import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { db } from "@server/db";
import { sites } from "@server/db/schemas";
import { eq } from "drizzle-orm";
import response from "@server/lib/response";
import HttpCode from "@server/types/HttpCode";
import createHttpError from "http-errors";
import logger from "@server/logger";
import { fromError } from "zod-validation-error";
import { OpenAPITags, registry } from "@server/openApi";

const updateSiteParamsSchema = z
    .object({
        siteId: z.string().transform(Number).pipe(z.number().int().positive())
    })
    .strict();

const updateSiteBodySchema = z
    .object({
        name: z.string().min(1).max(255).optional(),
        dockerSocketEnabled: z.boolean().optional(),
        // subdomain: z
        //     .string()
        //     .min(1)
        //     .max(255)
        //     .transform((val) => val.toLowerCase())
        //     .optional()
        // pubKey: z.string().optional(),
        // subnet: z.string().optional(),
        // exitNode: z.number().int().positive().optional(),
        // megabytesIn: z.number().int().nonnegative().optional(),
        // megabytesOut: z.number().int().nonnegative().optional(),
    })
    .strict()
    .refine((data) => Object.keys(data).length > 0, {
        message: "At least one field must be provided for update"
    });

registry.registerPath({
    method: "post",
    path: "/site/{siteId}",
    description:
        "Update a site.",
    tags: [OpenAPITags.Site],
    request: {
        params: updateSiteParamsSchema,
        body: {
            content: {
                "application/json": {
                    schema: updateSiteBodySchema
                }
            }
        }
    },
    responses: {}
});

export async function updateSite(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<any> {
    try {
        const parsedParams = updateSiteParamsSchema.safeParse(req.params);
        if (!parsedParams.success) {
            return next(
                createHttpError(
                    HttpCode.BAD_REQUEST,
                    fromError(parsedParams.error).toString()
                )
            );
        }

        const parsedBody = updateSiteBodySchema.safeParse(req.body);
        if (!parsedBody.success) {
            return next(
                createHttpError(
                    HttpCode.BAD_REQUEST,
                    fromError(parsedBody.error).toString()
                )
            );
        }

        const { siteId } = parsedParams.data;
        const updateData = parsedBody.data;

        const updatedSite = await db
            .update(sites)
            .set(updateData)
            .where(eq(sites.siteId, siteId))
            .returning();

        if (updatedSite.length === 0) {
            return next(
                createHttpError(
                    HttpCode.NOT_FOUND,
                    `Site with ID ${siteId} not found`
                )
            );
        }

        return response(res, {
            data: updatedSite[0],
            success: true,
            error: false,
            message: "Site updated successfully",
            status: HttpCode.OK
        });
    } catch (error) {
        logger.error(error);
        return next(
            createHttpError(HttpCode.INTERNAL_SERVER_ERROR, "An error occurred")
        );
    }
}
