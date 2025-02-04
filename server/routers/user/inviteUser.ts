import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { db } from "@server/db";
import { orgs, userInvites, userOrgs, users } from "@server/db/schema";
import { and, eq } from "drizzle-orm";
import response from "@server/lib/response";
import HttpCode from "@server/types/HttpCode";
import createHttpError from "http-errors";
import logger from "@server/logger";
import { alphabet, generateRandomString } from "oslo/crypto";
import { createDate, TimeSpan } from "oslo";
import config from "@server/lib/config";
import { hashPassword } from "@server/auth/password";
import { fromError } from "zod-validation-error";
import { sendEmail } from "@server/emails";
import SendInviteLink from "@server/emails/templates/SendInviteLink";

const inviteUserParamsSchema = z
    .object({
        orgId: z.string()
    })
    .strict();

const inviteUserBodySchema = z
    .object({
        email: z
            .string()
            .email()
            .transform((v) => v.toLowerCase()),
        roleId: z.number(),
        validHours: z.number().gt(0).lte(168),
        sendEmail: z.boolean().optional()
    })
    .strict();

export type InviteUserBody = z.infer<typeof inviteUserBodySchema>;

export type InviteUserResponse = {
    inviteLink: string;
    expiresAt: number;
};

const inviteTracker: Record<string, { timestamps: number[] }> = {};

export async function inviteUser(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<any> {
    try {
        const parsedParams = inviteUserParamsSchema.safeParse(req.params);
        if (!parsedParams.success) {
            return next(
                createHttpError(
                    HttpCode.BAD_REQUEST,
                    fromError(parsedParams.error).toString()
                )
            );
        }

        const parsedBody = inviteUserBodySchema.safeParse(req.body);
        if (!parsedBody.success) {
            return next(
                createHttpError(
                    HttpCode.BAD_REQUEST,
                    fromError(parsedBody.error).toString()
                )
            );
        }

        const { orgId } = parsedParams.data;
        const {
            email,
            validHours,
            roleId,
            sendEmail: doEmail
        } = parsedBody.data;

        const currentTime = Date.now();
        const oneHourAgo = currentTime - 3600000;

        if (!inviteTracker[email]) {
            inviteTracker[email] = { timestamps: [] };
        }

        inviteTracker[email].timestamps = inviteTracker[
            email
        ].timestamps.filter((timestamp) => timestamp > oneHourAgo); // TODO: this could cause memory increase over time if the object is never deleted

        if (inviteTracker[email].timestamps.length >= 3) {
            return next(
                createHttpError(
                    HttpCode.TOO_MANY_REQUESTS,
                    "User has already been invited 3 times in the last hour"
                )
            );
        }

        inviteTracker[email].timestamps.push(currentTime);

        const org = await db
            .select()
            .from(orgs)
            .where(eq(orgs.orgId, orgId))
            .limit(1);
        if (!org.length) {
            return next(
                createHttpError(HttpCode.NOT_FOUND, "Organization not found")
            );
        }

        const existingUser = await db
            .select()
            .from(users)
            .innerJoin(userOrgs, eq(users.userId, userOrgs.userId))
            .where(eq(users.email, email))
            .limit(1);
        if (existingUser.length && existingUser[0].userOrgs?.orgId === orgId) {
            return next(
                createHttpError(
                    HttpCode.BAD_REQUEST,
                    "User is already a member of this organization"
                )
            );
        }

        const inviteId = generateRandomString(
            10,
            alphabet("a-z", "A-Z", "0-9")
        );
        const token = generateRandomString(32, alphabet("a-z", "A-Z", "0-9"));
        const expiresAt = createDate(new TimeSpan(validHours, "h")).getTime();

        const tokenHash = await hashPassword(token);

        await db.transaction(async (trx) => {
            // delete any existing invites for this email
            await trx
                .delete(userInvites)
                .where(
                    and(
                        eq(userInvites.email, email),
                        eq(userInvites.orgId, orgId)
                    )
                )
                .execute();

            await trx.insert(userInvites).values({
                inviteId,
                orgId,
                email,
                expiresAt,
                tokenHash,
                roleId
            });
        });

        const inviteLink = `${config.getRawConfig().app.dashboard_url}/invite?token=${inviteId}-${token}`;

        if (doEmail) {
            await sendEmail(
                SendInviteLink({
                    email,
                    inviteLink,
                    expiresInDays: (validHours / 24).toString(),
                    orgName: org[0].name || orgId,
                    inviterName: req.user?.email
                }),
                {
                    to: email,
                    from: config.getNoReplyEmail(),
                    subject: "You're invited to join a Fossorial organization"
                }
            );
        }

        return response<InviteUserResponse>(res, {
            data: {
                inviteLink,
                expiresAt
            },
            success: true,
            error: false,
            message: "User invited successfully",
            status: HttpCode.OK
        });
    } catch (error) {
        logger.error(error);
        return next(
            createHttpError(HttpCode.INTERNAL_SERVER_ERROR, "An error occurred")
        );
    }
}
