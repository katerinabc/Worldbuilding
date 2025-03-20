import axios from 'axios';
import { AxiosResponse } from 'axios';
import dotenv from 'dotenv';
import { Cast, UserFeedResponse } from './types';

dotenv.config();

export class FetchUserCasts {
    private readonly apiKey: string;
    private readonly baseUrl: string = 'https://api.neynar.com/v2';
    private targetUserId: number;

    constructor(userId: number = 12021) { //adding default value for userid for testing
        const apiKey = process.env.NEYNAR_API_KEY;
        if (!apiKey) {
            throw new Error('NEYNAR_API_KEY not found in environment variables');
        }
        this.apiKey = apiKey;
        this.targetUserId = userId;
    }

    /**
     * Fetch casts by the user
     */
    async getUserCasts(limit: number = 500): Promise<Cast[]> {
        try {
            let allCasts: Cast[] = [];
            let cursor = null;
            const TARGET_LIMIT = limit;

            // keep fetching until we have 500 casts
            while (allCasts.length < TARGET_LIMIT) {
                const response: AxiosResponse<UserFeedResponse> = await axios.get(
                    `${this.baseUrl}/farcaster/feed/user/casts`,
                    {
                        headers: {
                            accept: 'application/json',
                            'x-api-key': this.apiKey,
                        },
                        params: {
                            fid: this.targetUserId,
                            limit: Math.min(150, TARGET_LIMIT - allCasts.length),
                            cursor: cursor,
                            include_replies: true
                        }
                    }
                );

                // logging the response for debugging
                console.log('Feed:API response:', {
                    status: response.status,
                    dataLength: response.data.casts.length,
                    cursor: response.data.next?.cursor,
                });



                const newCasts = response.data.casts;
                allCasts = [...allCasts, ...newCasts]
                console.log(`Feed: Fetched ${newCasts.length} casts (Total: ${allCasts.length})`);

                // check if we have more casts to fetch
                cursor = response.data.next?.cursor;
                if (!cursor || newCasts.length < TARGET_LIMIT) {
                    break;
                }

                // Add a small delay between requests to avoid rate limiting
                await new Promise(resolve => setTimeout(resolve, 1000));
            }

            console.log(`Feed: completed fetching ${allCasts.length} total casts`);
            return allCasts;

        } catch (error) {
            if (axios.isAxiosError(error)) {
                throw new Error(`Failed to fetch casts: ${error.message}`);
            }
            throw error;
        }
    }
} 

export class FetchReply {
    private readonly apiKey: string;
    private readonly baseUrl: string = 'https://api.neynar.com/v2';
    private targetUserId: number;
    private hash: string;

    constructor(userId: number = 12021, hash: string) { //adding default value for userid for testing
        const apiKey = process.env.NEYNAR_API_KEY;
        if (!apiKey) {
            throw new Error('NEYNAR_API_KEY not found in environment variables');
        }
        this.apiKey = apiKey;
        this.hash = hash;
        this.targetUserId = userId;
    }

    /**
     * Fetch casts by the user
     */
    async getReplytoBot(): Promise<Cast> {
        try {
            // let allCasts: Cast[] = [];
            // let cursor = null;
            // const TARGET_LIMIT = limit;
            
            const response: AxiosResponse<UserFeedResponse> = await axios.get(
                `${this.baseUrl}/farcaster/feed/cast`,
                {
                    headers: {
                        accept: 'application/json',
                        'x-api-key': this.apiKey,
                    },
                    params: {
                        identifier: this.hash,
                        type: 'hash',
                    }
                }
            );

            // logging the response for debugging
            console.log('Feed:API response:', {
                status: response.status,
                hash: response.data.casts[0].hash,
                text: response.data.casts[0].text,
            });
            
            const replyCast = response.data.casts[0]

            console.log(`Feed: got cast ${replyCast.text} `);
            console.log(`Feed: got cast ${replyCast.hash} `);
            
            return replyCast;

        } catch (error) {
            if (axios.isAxiosError(error)) {
                throw new Error(`Failed to fetch casts: ${error.message}`);
            }
            throw error;
        }
    }
}