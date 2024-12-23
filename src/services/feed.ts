import axios from 'axios';
import dotenv from 'dotenv';
import { Cast, UserFeedResponse } from './types';

dotenv.config();

export class FetchUserCasts {
    private readonly apiKey: string;
    private readonly baseUrl: string = 'https://api.neynar.com/v2';
    private targetUserId: string;

    constructor(userId: string = '12021') { //adding default value for userid for testing
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
    async getUserCasts(): Promise<Cast[]> {
        try {
            const response = await axios.get<UserFeedResponse>(
                `${this.baseUrl}/farcaster/feed/user/casts`,
                {
                    headers: {
                        accept: 'application/json',
                        'x-api-key': this.apiKey,
                    },
                    params: {
                        fid: this.targetUserId,
                        limit: 150,
                        include_replies: true
                    }
                }
            );

            return response.data.casts;

        } catch (error) {
            if (axios.isAxiosError(error)) {
                throw new Error(`Failed to fetch casts: ${error.message}`);
            }
            throw error;
        }
    }
} 