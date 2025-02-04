import {
    createSession,
    generateSessionToken,
    serializeSessionCookie
} from "@server/auth/sessions/app";
import db from "@server/db";
import { users } from "@server/db/schema";
import HttpCode from "@server/types/HttpCode";
import response from "@server/lib/response";
import { eq } from "drizzle-orm";
import { NextFunction, Request, Response } from "express";
import createHttpError from "http-errors";
import { z } from "zod";
import { fromError } from "zod-validation-error";
import { verifyTotpCode } from "@server/auth/totp";
import config from "@server/lib/config";
import logger from "@server/logger";
import { verifyPassword } from "@server/auth/password";
import { verifySession } from "@server/auth/sessions/verifySession";

export const loginBodySchema = z
    .object({
        email: z
            .string()
            .email()
            .transform((v) => v.toLowerCase()),
        password: z.string(),
        code: z.string().optional()
    })
    .strict();

export type LoginBody = z.infer<typeof loginBodySchema>;

export type LoginResponse = {
    codeRequested?: boolean;
    emailVerificationRequired?: boolean;
};

export async function login(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<any> {
    const parsedBody = loginBodySchema.safeParse(req.body);

    if (!parsedBody.success) {
        return next(
            createHttpError(
                HttpCode.BAD_REQUEST,
                fromError(parsedBody.error).toString()
            )
        );
    }

    const { email, password, code } = parsedBody.data;

    try {
        const { session: existingSession } = await verifySession(req);
        if (existingSession) {
            return response<null>(res, {
                data: null,
                success: true,
                error: false,
                message: "Already logged in",
                status: HttpCode.OK
            });
        }

        const existingUserRes = await db
            .select()
            .from(users)
            .where(eq(users.email, email));
        if (!existingUserRes || !existingUserRes.length) {
            if (config.getRawConfig().app.log_failed_attempts) {
                logger.info(
                    `Username or password incorrect. Email: ${email}. IP: ${req.ip}.`
                );
            }
            return next(
                createHttpError(
                    HttpCode.BAD_REQUEST,
                    "Username or password is incorrect"
                )
            );
        }

        const existingUser = existingUserRes[0];

        const validPassword = await verifyPassword(
            password,
            existingUser.passwordHash
        );
        if (!validPassword) {
            if (config.getRawConfig().app.log_failed_attempts) {
                logger.info(
                    `Username or password incorrect. Email: ${email}. IP: ${req.ip}.`
                );
            }
            return next(
                createHttpError(
                    HttpCode.BAD_REQUEST,
                    "Username or password is incorrect"
                )
            );
        }

        if (existingUser.twoFactorEnabled) {
            if (!code) {
                return response<{ codeRequested: boolean }>(res, {
                    data: { codeRequested: true },
                    success: true,
                    error: false,
                    message: "Two-factor authentication required",
                    status: HttpCode.ACCEPTED
                });
            }

            const validOTP = await verifyTotpCode(
                code,
                existingUser.twoFactorSecret!,
                existingUser.userId
            );

            if (!validOTP) {
                if (config.getRawConfig().app.log_failed_attempts) {
                    logger.info(
                        `Two-factor code incorrect. Email: ${email}. IP: ${req.ip}.`
                    );
                }
                return next(
                    createHttpError(
                        HttpCode.BAD_REQUEST,
                        "The two-factor code you entered is incorrect"
                    )
                );
            }
        }

        const token = generateSessionToken();
        await createSession(token, existingUser.userId);
        const isSecure = req.protocol === "https";
        const cookie = serializeSessionCookie(token, isSecure);

        res.appendHeader("Set-Cookie", cookie);

        if (
            !existingUser.emailVerified &&
            config.getRawConfig().flags?.require_email_verification
        ) {
            return response<LoginResponse>(res, {
                data: { emailVerificationRequired: true },
                success: true,
                error: false,
                message: "Email verification code sent",
                status: HttpCode.OK
            });
        }

        return response<null>(res, {
            data: null,
            success: true,
            error: false,
            message: "Logged in successfully",
            status: HttpCode.OK
        });
    } catch (e) {
        logger.error(e);
        return next(
            createHttpError(
                HttpCode.INTERNAL_SERVER_ERROR,
                "Failed to authenticate user"
            )
        );
    }
}
