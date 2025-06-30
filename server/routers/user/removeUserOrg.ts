import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { db, resources, sites } from "@server/db";
import { userOrgs, userResources, users, userSites } from "@server/db";
import { and, eq, exists } from "drizzle-orm";
import response from "@server/lib/response";
import HttpCode from "@server/types/HttpCode";
import createHttpError from "http-errors";
import logger from "@server/logger";
import { fromError } from "zod-validation-error";
import { OpenAPITags, registry } from "@server/openApi";

const removeUserSchema = z
    .object({
        userId: z.string(),
        orgId: z.string()
    })
    .strict();

registry.registerPath({
    method: "delete",
    path: "/org/{orgId}/user/{userId}",
    description: "Remove a user from an organization.",
    tags: [OpenAPITags.Org, OpenAPITags.User],
    request: {
        params: removeUserSchema
    },
    responses: {}
});

/**
 * Removes a user from an organization, including all their associated resources and sites within that organization.
 *
 * Validates the request parameters, ensures the user is not an owner, and deletes all relevant associations in a database transaction. Responds with a success message or passes appropriate HTTP errors to the next middleware.
 */
export async function removeUserOrg(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<any> {
    try {
        const parsedParams = removeUserSchema.safeParse(req.params);
        if (!parsedParams.success) {
            return next(
                createHttpError(
                    HttpCode.BAD_REQUEST,
                    fromError(parsedParams.error).toString()
                )
            );
        }

        const { userId, orgId } = parsedParams.data;

        // get the user first
        const user = await db
            .select()
            .from(userOrgs)
            .where(and(eq(userOrgs.userId, userId), eq(userOrgs.orgId, orgId)));

        if (!user || user.length === 0) {
            return next(createHttpError(HttpCode.NOT_FOUND, "User not found"));
        }

        if (user[0].isOwner) {
            return next(
                createHttpError(
                    HttpCode.BAD_REQUEST,
                    "Cannot remove owner from org"
                )
            );
        }

        await db.transaction(async (trx) => {
            await trx
                .delete(userOrgs)
                .where(
                    and(eq(userOrgs.userId, userId), eq(userOrgs.orgId, orgId))
                );

            await db.delete(userResources).where(
                and(
                    eq(userResources.userId, userId),
                    exists(
                        db
                            .select()
                            .from(resources)
                            .where(
                                and(
                                    eq(
                                        resources.resourceId,
                                        userResources.resourceId
                                    ),
                                    eq(resources.orgId, orgId)
                                )
                            )
                    )
                )
            );

            await db.delete(userSites).where(
                and(
                    eq(userSites.userId, userId),
                    exists(
                        db
                            .select()
                            .from(sites)
                            .where(
                                and(
                                    eq(sites.siteId, userSites.siteId),
                                    eq(sites.orgId, orgId)
                                )
                            )
                    )
                )
            );
        });

        return response(res, {
            data: null,
            success: true,
            error: false,
            message: "User removed from org successfully",
            status: HttpCode.OK
        });
    } catch (error) {
        logger.error(error);
        return next(
            createHttpError(HttpCode.INTERNAL_SERVER_ERROR, "An error occurred")
        );
    }
}
