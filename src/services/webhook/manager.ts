// WebhookManager class for creating/managing webhooks

import { NeynarAPIClient } from "@neynar/nodejs-sdk";
import dotenv from 'dotenv';

dotenv.config();

export class WebhookManager {
    private client: NeynarAPIClient;

    constructor() {
        const apiKey = process.env.NEYNAR_API_KEY;
        if (!apiKey) {
            throw new Error('NEYNAR_API_KEY is not set');
        }

        this.client = new NeynarAPIClient(apiKey);
    }
    
    async coauthorsWebhook(user1_fid: number, storyHash: string, coAuthorFid: number[]) {
        try {
            const webhook = await this.client.publishWebhook(
                'coauthors',
                'https://webhook.netnigma.io/webhook',
                {
                    subscription: {
                        "cast.created": {
                            mentioned_fids: coAuthorFid,
                            parent_hashes: [storyHash],
                            author_fids: [user1_fid]
                        }
                    }
                }
            );
            return webhook;
        } catch (error) {
            console.error('[ERROR] coauthorsWebhook:', error);
            throw error;
        }
    }
} 