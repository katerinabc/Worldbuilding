import axios from 'axios';
import dotenv from 'dotenv';
import { Reaction, ReactionsResponse } from './types';

dotenv.config();

export class FetchReactions {
    private readonly apiKey: string;
    private readonly baseUrl: string = 'https://api.neynar.com/v2';
    private readonly targetUserId: string = '12021';

    constructor() {
        const apiKey = process.env.NEYNAR_API_KEY;
        if (!apiKey) {
            throw new Error('NEYNAR_API_KEY not found in environment variables');
        }
        this.apiKey = apiKey;
    }

    /**
     * Fetch casts liked by the target user in the past 7 days
     */
    async getLikedCasts(): Promise<Reaction[]> {
        try {
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

            const response = await axios.get<ReactionsResponse>(
                `${this.baseUrl}/farcaster/reactions/user`,
                {
                    headers: {
                        accept: 'application/json',
                        'x-api-key': this.apiKey,
                    },
                    params: {
                        fid: this.targetUserId,
                        type: 'like',
                        limit: 100,
                    }
                }
            );

            return response.data.reactions.filter(reaction => {
                const reactionDate = new Date(reaction.reaction_timestamp);
                return reactionDate >= sevenDaysAgo;
            });

        } catch (error) {
            if (axios.isAxiosError(error)) {
                throw new Error(`Failed to fetch likes: ${error.message}`);
            }
            throw error;
        }
    }
} 