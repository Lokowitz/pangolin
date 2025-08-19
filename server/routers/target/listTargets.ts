import { db } from "@server/db";
import { targets } from "@server/db";
import HttpCode from "@server/types/HttpCode";
import response from "@server/lib/response";
import { eq, sql } from "drizzle-orm";
import { NextFunction, Request, Response } from "express";
import createHttpError from "http-errors";
import { z } from "zod";
import { fromError } from "zod-validation-error";
import logger from "@server/logger";
import { OpenAPITags, registry } from "@server/openApi";

const listTargetsParamsSchema = z.strictObject({
        resourceId: z
            .string()
            .transform(Number)
            .pipe(z.int().positive())
    });

const listTargetsSchema = z.object({
    limit: z
        .string()
        .optional()
        .prefault("1000")
        .transform(Number)
        .pipe(z.int().positive()),
    offset: z
        .string()
        .optional()
        .prefault("0")
        .transform(Number)
        .pipe(z.int().nonnegative())
});

function queryTargets(resourceId: number) {
    const baseQuery = db
        .select({
            targetId: targets.targetId,
            ip: targets.ip,
            method: targets.method,
            port: targets.port,
            enabled: targets.enabled,
            resourceId: targets.resourceId
            // resourceName: resources.name,
        })
        .from(targets)
        // .leftJoin(resources, eq(targets.resourceId, resources.resourceId))
        .where(eq(targets.resourceId, resourceId));

    return baseQuery;
}

export type ListTargetsResponse = {
    targets: Awaited<ReturnType<typeof queryTargets>>;
    pagination: { total: number; limit: number; offset: number };
};

registry.registerPath({
    method: "get",
    path: "/resource/{resourceId}/targets",
    description: "List targets for a resource.",
    tags: [OpenAPITags.Resource, OpenAPITags.Target],
    request: {
        params: listTargetsParamsSchema,
        query: listTargetsSchema
    },
    responses: {}
});

export async function listTargets(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<any> {
    try {
        const parsedQuery = listTargetsSchema.safeParse(req.query);
        if (!parsedQuery.success) {
            return next(
                createHttpError(
                    HttpCode.BAD_REQUEST,
                    fromError(parsedQuery.error)
                )
            );
        }
        const { limit, offset } = parsedQuery.data;

        const parsedParams = listTargetsParamsSchema.safeParse(req.params);
        if (!parsedParams.success) {
            return next(
                createHttpError(
                    HttpCode.BAD_REQUEST,
                    fromError(parsedParams.error)
                )
            );
        }
        const { resourceId } = parsedParams.data;

        const baseQuery = queryTargets(resourceId);

        const countQuery = db
            .select({ count: sql<number>`cast(count(*) as integer)` })
            .from(targets)
            .where(eq(targets.resourceId, resourceId));

        const targetsList = await baseQuery.limit(limit).offset(offset);
        const totalCountResult = await countQuery;
        const totalCount = totalCountResult[0].count;

        return response<ListTargetsResponse>(res, {
            data: {
                targets: targetsList,
                pagination: {
                    total: totalCount,
                    limit,
                    offset
                }
            },
            success: true,
            error: false,
            message: "Targets retrieved successfully",
            status: HttpCode.OK
        });
    } catch (error) {
        logger.error(error);
        return next(
            createHttpError(HttpCode.INTERNAL_SERVER_ERROR, "An error occurred")
        );
    }
}
