import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { db } from "@server/db";
import { Resource, resources, sites } from "@server/db";
import { eq } from "drizzle-orm";
import response from "@server/lib/response";
import HttpCode from "@server/types/HttpCode";
import createHttpError from "http-errors";
import { fromError } from "zod-validation-error";
import logger from "@server/logger";
import { OpenAPITags, registry } from "@server/openApi";

const getResourceSchema = z.strictObject({
        resourceId: z
            .string()
            .transform(Number)
            .pipe(z.int().positive())
    });

export type GetResourceResponse = Resource & {
    siteName: string;
};

registry.registerPath({
    method: "get",
    path: "/resource/{resourceId}",
    description: "Get a resource.",
    tags: [OpenAPITags.Resource],
    request: {
        params: getResourceSchema
    },
    responses: {}
});

export async function getResource(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<any> {
    try {
        const parsedParams = getResourceSchema.safeParse(req.params);
        if (!parsedParams.success) {
            return next(
                createHttpError(
                    HttpCode.BAD_REQUEST,
                    fromError(parsedParams.error).toString()
                )
            );
        }

        const { resourceId } = parsedParams.data;

        const [resp] = await db
            .select()
            .from(resources)
            .where(eq(resources.resourceId, resourceId))
            .leftJoin(sites, eq(sites.siteId, resources.siteId))
            .limit(1);

        const resource = resp.resources;
        const site = resp.sites;

        if (!resource) {
            return next(
                createHttpError(
                    HttpCode.NOT_FOUND,
                    `Resource with ID ${resourceId} not found`
                )
            );
        }

        return response(res, {
            data: {
                ...resource,
                siteName: site?.name
            },
            success: true,
            error: false,
            message: "Resource retrieved successfully",
            status: HttpCode.OK
        });
    } catch (error) {
        logger.error(error);
        return next(
            createHttpError(HttpCode.INTERNAL_SERVER_ERROR, "An error occurred")
        );
    }
}
