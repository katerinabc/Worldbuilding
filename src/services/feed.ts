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

                const newCasts = response.data.casts;
                allCasts = [...allCasts, ...newCasts]

                // check if we have more casts to fetch
                cursor = response.data.next?.cursor;
                if (!cursor || newCasts.length < TARGET_LIMIT) {
                    break;
                }

                // Add a small delay between requests to avoid rate limiting
                await new Promise(resolve => setTimeout(resolve, 1000));
            }

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
    private hash: string;

    constructor(hash: string) { //adding default value for userid for testing
        const apiKey = process.env.NEYNAR_API_KEY;
        if (!apiKey) {
            throw new Error('NEYNAR_API_KEY not found in environment variables');
        }
        this.apiKey = apiKey;
        this.hash = hash;
    }

    async getReplytoBot(): Promise<Cast> {
        try {
            const url = `${this.baseUrl}/farcaster/cast`;
            const headers = {
                accept: 'application/json',
                'x-api-key': this.apiKey,
            };
            const params = {
                identifier: this.hash,
                type: 'hash',
            };

            // Log the complete request URL with parameters
            const fullUrl = `${url}?${new URLSearchParams(params).toString()}`;
            console.log('[API REQUEST]', {
                method: 'GET',
                url: fullUrl,
                headers: {
                    ...headers,
                    'x-api-key': '***' // Mask the API key
                }
            });
            
            const response: AxiosResponse<UserFeedResponse> = await axios.get(
                url,
                {
                    headers,
                    params
                }
            );
            
            console.log('[API RESPONSE] Status:', response.status);
            console.log('[API RESPONSE] Data:', JSON.stringify(response.data, null, 2));
            
            const replyCast = response.data.casts[0];
            if (!replyCast) {
                console.log('[API RESPONSE] No cast found in response');
                throw new Error('No cast found in response');
            }
            
            return replyCast;

        } catch (error) {
            if (axios.isAxiosError(error)) {
                console.error('[API ERROR] Complete error details:', {
                    status: error.response?.status,
                    statusText: error.response?.statusText,
                    data: error.response?.data,
                    message: error.message,
                    config: {
                        url: error.config?.url,
                        method: error.config?.method,
                        headers: error.config?.headers,
                        params: error.config?.params
                    }
                });
                throw new Error(`Failed to fetch casts: ${error.message}`);
            }
            throw error;
        }
    }
}