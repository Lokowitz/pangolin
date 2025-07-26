import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { clients, newts, olms, Site, sites, clientSites } from "@server/db";
import { db } from "@server/db";
import { eq } from "drizzle-orm";
import HttpCode from "@server/types/HttpCode";
import createHttpError from "http-errors";
import logger from "@server/logger";
import { fromError } from "zod-validation-error";
import { validateNewtSessionToken } from "@server/auth/sessions/newt";
import { validateOlmSessionToken } from "@server/auth/sessions/olm";

// Define Zod schema for request validation
const updateHolePunchSchema = z.object({
    olmId: z.string().optional(),
    newtId: z.string().optional(),
    token: z.string(),
    ip: z.string(),
    port: z.number(),
    timestamp: z.number()
});

// New response type with multi-peer destination support
interface PeerDestination {
    destinationIP: string;
    destinationPort: number;
}

export async function updateHolePunch(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<any> {
    try {
        // Validate request parameters
        const parsedParams = updateHolePunchSchema.safeParse(req.body);
        if (!parsedParams.success) {
            return next(
                createHttpError(
                    HttpCode.BAD_REQUEST,
                    fromError(parsedParams.error).toString()
                )
            );
        }

        const { olmId, newtId, ip, port, timestamp, token } = parsedParams.data;

        let currentSiteId: number | undefined;
        let destinations: PeerDestination[] = [];
        
        if (olmId) {
            logger.debug(`Got hole punch with ip: ${ip}, port: ${port} for olmId: ${olmId}`);

            const { session, olm: olmSession } =
                await validateOlmSessionToken(token);
            if (!session || !olmSession) {
                return next(
                    createHttpError(HttpCode.UNAUTHORIZED, "Unauthorized")
                );
            }

            if (olmId !== olmSession.olmId) {
                logger.warn(`Olm ID mismatch: ${olmId} !== ${olmSession.olmId}`);
                return next(
                    createHttpError(HttpCode.UNAUTHORIZED, "Unauthorized")
                );
            }

            const [olm] = await db
                .select()
                .from(olms)
                .where(eq(olms.olmId, olmId));

            if (!olm || !olm.clientId) {
                logger.warn(`Olm not found: ${olmId}`);
                return next(
                    createHttpError(HttpCode.NOT_FOUND, "Olm not found")
                );
            }

            const [client] = await db
                .update(clients)
                .set({
                    endpoint: `${ip}:${port}`,
                    lastHolePunch: timestamp
                })
                .where(eq(clients.clientId, olm.clientId))
                .returning();
            
            if (!client) {
                logger.warn(`Client not found for olm: ${olmId}`);
                return next(
                    createHttpError(HttpCode.NOT_FOUND, "Client not found")
                );
            }

            // Get all sites that this client is connected to
            const clientSitePairs = await db
                .select()
                .from(clientSites)
                .where(eq(clientSites.clientId, client.clientId));
            
            if (clientSitePairs.length === 0) {
                logger.warn(`No sites found for client: ${client.clientId}`);
                return next(
                    createHttpError(HttpCode.NOT_FOUND, "No sites found for client")
                );
            }
            
            // Get all sites details
            const siteIds = clientSitePairs.map(pair => pair.siteId);
            
            for (const siteId of siteIds) {
                const [site] = await db
                    .select()
                    .from(sites)
                    .where(eq(sites.siteId, siteId));
                
                if (site && site.subnet && site.listenPort) {
                    destinations.push({
                        destinationIP: site.subnet.split("/")[0],
                        destinationPort: site.listenPort
                    });
                }
            }

        } else if (newtId) {
            const { session, newt: newtSession } =
                await validateNewtSessionToken(token);

            if (!session || !newtSession) {
                return next(
                    createHttpError(HttpCode.UNAUTHORIZED, "Unauthorized")
                );
            }

            if (newtId !== newtSession.newtId) {
                logger.warn(`Newt ID mismatch: ${newtId} !== ${newtSession.newtId}`);
                return next(
                    createHttpError(HttpCode.UNAUTHORIZED, "Unauthorized")
                );
            }

            const [newt] = await db
                .select()
                .from(newts)
                .where(eq(newts.newtId, newtId));

            if (!newt || !newt.siteId) {
                logger.warn(`Newt not found: ${newtId}`);
                return next(
                    createHttpError(HttpCode.NOT_FOUND, "New not found")
                );
            }

            currentSiteId = newt.siteId;

            // Update the current site with the new endpoint
            const [updatedSite] = await db
                .update(sites)
                .set({
                    endpoint: `${ip}:${port}`,
                    lastHolePunch: timestamp
                })
                .where(eq(sites.siteId, newt.siteId))
                .returning();
            
            if (!updatedSite || !updatedSite.subnet) {
                logger.warn(`Site not found: ${newt.siteId}`);
                return next(
                    createHttpError(HttpCode.NOT_FOUND, "Site not found")
                );
            }

            // Find all clients that connect to this site
            // const sitesClientPairs = await db
            //     .select()
            //     .from(clientSites)
            //     .where(eq(clientSites.siteId, newt.siteId));
            
            // THE NEWT IS NOT SENDING RAW WG TO THE GERBIL SO IDK IF WE REALLY NEED THIS - REMOVING
            // Get client details for each client
            // for (const pair of sitesClientPairs) {
            //     const [client] = await db
            //         .select()
            //         .from(clients)
            //         .where(eq(clients.clientId, pair.clientId));
                
            //     if (client && client.endpoint) {
            //         const [host, portStr] = client.endpoint.split(':');
            //         if (host && portStr) {
            //             destinations.push({
            //                 destinationIP: host,
            //                 destinationPort: parseInt(portStr, 10)
            //             });
            //         }
            //     }
            // }
            
            // If this is a newt/site, also add other sites in the same org
        //     if (updatedSite.orgId) {
        //         const orgSites = await db
        //             .select()
        //             .from(sites)
        //             .where(eq(sites.orgId, updatedSite.orgId));
                
        //         for (const site of orgSites) {
        //             // Don't add the current site to the destinations
        //             if (site.siteId !== currentSiteId && site.subnet && site.endpoint && site.listenPort) {
        //                 const [host, portStr] = site.endpoint.split(':');
        //                 if (host && portStr) {
        //                     destinations.push({
        //                         destinationIP: host,
        //                         destinationPort: site.listenPort
        //                     });
        //                 }
        //             }
        //         }
        //     }
        }

        // if (destinations.length === 0) {
        //     logger.warn(
        //         `No peer destinations found for olmId: ${olmId} or newtId: ${newtId}`
        //     );
        //     return next(createHttpError(HttpCode.NOT_FOUND, "No peer destinations found"));
        // }

        // Return the new multi-peer structure
        return res.status(HttpCode.OK).send({
            destinations: destinations
        });
    } catch (error) {
        logger.error(error);
        return next(
            createHttpError(
                HttpCode.INTERNAL_SERVER_ERROR,
                "An error occurred..."
            )
        );
    }
}