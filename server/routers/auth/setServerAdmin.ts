import { NextFunction, Request, Response } from "express";
import HttpCode from "@server/types/HttpCode";
import { z } from "zod/v4";
import { fromError } from "zod-validation-error";
import createHttpError from "http-errors";
import { generateId } from "@server/auth/sessions/app";
import logger from "@server/logger";
import { hashPassword } from "@server/auth/password";
import { passwordSchema } from "@server/auth/passwordSchema";
import { response } from "@server/lib";
import { db, users } from "@server/db";
import { eq } from "drizzle-orm";
import { UserType } from "@server/types/UserTypes";
import moment from "moment";

export const bodySchema = z.object({
    email: z.email().toLowerCase(),
    password: passwordSchema
});

export type SetServerAdminBody = z.infer<typeof bodySchema>;

export type SetServerAdminResponse = null;

export async function setServerAdmin(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<any> {
    try {
        const parsedBody = bodySchema.safeParse(req.body);

        if (!parsedBody.success) {
            return next(
                createHttpError(
                    HttpCode.BAD_REQUEST,
                    fromError(parsedBody.error).toString()
                )
            );
        }

        const { email, password } = parsedBody.data;

        const [existing] = await db
            .select()
            .from(users)
            .where(eq(users.serverAdmin, true));

        if (existing) {
            return next(
                createHttpError(
                    HttpCode.BAD_REQUEST,
                    "Server admin already exists"
                )
            );
        }

        const passwordHash = await hashPassword(password);
        const userId = generateId(15);

        await db.insert(users).values({
            userId: userId,
            email: email,
            type: UserType.Internal,
            username: email,
            passwordHash,
            dateCreated: moment().toISOString(),
            serverAdmin: true,
            emailVerified: true
        });

        return response<SetServerAdminResponse>(res, {
            data: null,
            success: true,
            error: false,
            message: "Server admin set successfully",
            status: HttpCode.OK
        });
    } catch (e) {
        logger.error(e);
        return next(
            createHttpError(
                HttpCode.INTERNAL_SERVER_ERROR,
                "Failed to set server admin"
            )
        );
    }
}
