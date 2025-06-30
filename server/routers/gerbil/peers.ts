import axios from 'axios';
import logger from '@server/logger';
import { db } from "@server/db";
import { exitNodes } from '@server/db';
import { eq } from 'drizzle-orm';

/**
 * Adds a peer to the specified exit node by sending a request to the exit node's HTTP API.
 *
 * Throws an error if the exit node does not exist, is not reachable, or if communication with the Gerbil API fails.
 *
 * @param exitNodeId - The unique identifier of the exit node
 * @param peer - The peer object containing a public key and allowed IPs to be added
 * @returns The response data from the exit node's API after adding the peer
 */
export async function addPeer(exitNodeId: number, peer: {
    publicKey: string;
    allowedIps: string[];
}) {

    const [exitNode] = await db.select().from(exitNodes).where(eq(exitNodes.exitNodeId, exitNodeId)).limit(1);
    if (!exitNode) {
        throw new Error(`Exit node with ID ${exitNodeId} not found`);
    }
    if (!exitNode.reachableAt) {
        throw new Error(`Exit node with ID ${exitNodeId} is not reachable`);
    }

    try {
        const response = await axios.post(`${exitNode.reachableAt}/peer`, peer, {
            headers: {
                'Content-Type': 'application/json',
            }
        });

        logger.info('Peer added successfully:', { peer: response.data.status });
        return response.data;
    } catch (error) {
        if (axios.isAxiosError(error)) {
            throw new Error(`Error communicating with Gerbil. Make sure Pangolin can reach the Gerbil HTTP API: ${error.response?.status}`);
        }
        throw error;
    }
}

/**
 * Removes a peer from the specified exit node by sending a DELETE request to the exit node's API.
 *
 * Throws an error if the exit node does not exist, is unreachable, or if communication with the Gerbil API fails.
 *
 * @param exitNodeId - The unique identifier of the exit node
 * @param publicKey - The public key of the peer to be removed
 * @returns The response data from the exit node's API
 */
export async function deletePeer(exitNodeId: number, publicKey: string) {
    const [exitNode] = await db.select().from(exitNodes).where(eq(exitNodes.exitNodeId, exitNodeId)).limit(1);
    if (!exitNode) {
        throw new Error(`Exit node with ID ${exitNodeId} not found`);
    }
    if (!exitNode.reachableAt) {
        throw new Error(`Exit node with ID ${exitNodeId} is not reachable`);
    }
    try {
        const response = await axios.delete(`${exitNode.reachableAt}/peer?public_key=${encodeURIComponent(publicKey)}`);
        logger.info('Peer deleted successfully:', response.data.status);
        return response.data;
    } catch (error) {
        if (axios.isAxiosError(error)) {
            throw new Error(`Error communicating with Gerbil. Make sure Pangolin can reach the Gerbil HTTP API: ${error.response?.status}`);
        }
        throw error;
    }
}
