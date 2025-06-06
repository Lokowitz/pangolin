import axios from 'axios';
import logger from '@server/logger';
import { db } from "@server/db";
import { exitNodes } from '@server/db';
import { eq } from 'drizzle-orm';

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
            throw new Error(`HTTP error! status: ${error.response?.status}`);
        }
        throw error;
    }
}

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
            throw new Error(`HTTP error! status: ${error.response?.status}`);
        }
        throw error;
    }
}
