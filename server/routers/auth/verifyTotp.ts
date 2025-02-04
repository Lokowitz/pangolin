import { Request, Response, NextFunction } from "express";
import createHttpError from "http-errors";
import { z } from "zod";
import { fromError } from "zod-validation-error";
import HttpCode from "@server/types/HttpCode";
import { response } from "@server/lib";
import { db } from "@server/db";
import { twoFactorBackupCodes, User, users } from "@server/db/schema";
import { eq } from "drizzle-orm";
import { alphabet, generateRandomString } from "oslo/crypto";
import { hashPassword } from "@server/auth/password";
import { verifyTotpCode } from "@server/auth/totp";
import logger from "@server/logger";
import { sendEmail } from "@server/emails";
import TwoFactorAuthNotification from "@server/emails/templates/TwoFactorAuthNotification";
import config from "@server/lib/config";

export const verifyTotpBody = z
    .object({
        code: z.string()
    })
    .strict();

export type VerifyTotpBody = z.infer<typeof verifyTotpBody>;

export type VerifyTotpResponse = {
    valid: boolean;
    backupCodes?: string[];
};

export async function verifyTotp(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<any> {
    const parsedBody = verifyTotpBody.safeParse(req.body);

    if (!parsedBody.success) {
        return next(
            createHttpError(
                HttpCode.BAD_REQUEST,
                fromError(parsedBody.error).toString()
            )
        );
    }

    const { code } = parsedBody.data;

    const user = req.user as User;

    if (user.twoFactorEnabled) {
        return next(
            createHttpError(
                HttpCode.BAD_REQUEST,
                "Two-factor authentication is already enabled"
            )
        );
    }

    if (!user.twoFactorSecret) {
        return next(
            createHttpError(
                HttpCode.BAD_REQUEST,
                "User has not requested two-factor authentication"
            )
        );
    }

    try {
        const valid = await verifyTotpCode(
            code,
            user.twoFactorSecret,
            user.userId
        );

        let codes;
        if (valid) {
            // if valid, enable two-factor authentication; the totp secret is no longer temporary
            await db.transaction(async (trx) => {
                await trx
                    .update(users)
                    .set({ twoFactorEnabled: true })
                    .where(eq(users.userId, user.userId));

                const backupCodes = await generateBackupCodes();
                codes = backupCodes;
                for (const code of backupCodes) {
                    const hash = await hashPassword(code);

                    await trx.insert(twoFactorBackupCodes).values({
                        userId: user.userId,
                        codeHash: hash
                    });
                }
            });
        }

        if (!valid) {
            if (config.getRawConfig().app.log_failed_attempts) {
                logger.info(
                    `Two-factor authentication code is incorrect. Email: ${user.email}. IP: ${req.ip}.`
                );
            }
            return next(
                createHttpError(
                    HttpCode.BAD_REQUEST,
                    "Invalid two-factor authentication code"
                )
            );
        }

        sendEmail(
            TwoFactorAuthNotification({
                email: user.email,
                enabled: true
            }),
            {
                to: user.email,
                from: config.getRawConfig().email?.no_reply,
                subject: "Two-factor authentication enabled"
            }
        );

        return response<VerifyTotpResponse>(res, {
            data: {
                valid,
                ...(valid && codes ? { backupCodes: codes } : {})
            },
            success: true,
            error: false,
            message: valid
                ? "Code is valid. Two-factor is now enabled"
                : "Code is invalid",
            status: HttpCode.OK
        });
    } catch (error) {
        logger.error(error);
        return next(
            createHttpError(
                HttpCode.INTERNAL_SERVER_ERROR,
                "Failed to verify two-factor authentication code"
            )
        );
    }
}

async function generateBackupCodes(): Promise<string[]> {
    const codes = [];
    for (let i = 0; i < 10; i++) {
        const code = generateRandomString(6, alphabet("0-9", "A-Z", "a-z"));
        codes.push(code);
    }
    return codes;
}
