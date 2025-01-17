import axios from 'axios';
import { AxiosResponse } from 'axios';
import dotenv from 'dotenv';
import { Reaction, ReactionsResponse } from './types';

dotenv.config();

export class FetchReactions {
    private readonly apiKey: string;
    private readonly baseUrl: string = 'https://api.neynar.com/v2';
    private targetUserId: string;

    constructor(userId: string = '12021') {
        const apiKey = process.env.NEYNAR_API_KEY;
        if (!apiKey) {
            throw new Error('NEYNAR_API_KEY not found in environment variables');
        }
        this.apiKey = apiKey;
        this.targetUserId = userId;
    }

    /**
     * Fetch casts liked by the target user in the past 7 days
     */
    async getLikedCasts(): Promise<Reaction[]> {
        try {
            let allReactions: Reaction[] = [];
            let cursor = null;
            const TARGET_LIMIT = 500;
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

            // log API endpoint
            console.log('reactions API endpoing:', `${this.baseUrl}/farcaste/reactions/user`);

            // keep fetching until we have 500 reactions or we have no more reactions to fetch for the time period
            while (allReactions.length < TARGET_LIMIT) {
                console.log('making api request for reactions with with params:', {
                    fid: this.targetUserId,
                    limit: Math.min(100, TARGET_LIMIT - allReactions.length),
                    type: 'like',
                    cursor: cursor,
                })
                const response: AxiosResponse<ReactionsResponse> = await axios.get(
                `${this.baseUrl}/farcaster/reactions/user`,
                {
                    headers: {
                        accept: 'application/json',
                        'x-api-key': this.apiKey,
                    },
                    params: {
                        fid: this.targetUserId,
                        limit: Math.min(100, TARGET_LIMIT - allReactions.length),
                        type: 'like',
                        cursor: cursor,
                        include_replies: true
                        
                    }
                }
            );

            // logging response for debugging
            console.log('Reactions:API response', {
                status: response.status, 
                dataLength: response.data.reactions.length,
                cursor: response.data.next?.cursor,
                // fid: response.data.fid
            })

            const newReactions = response.data.reactions.filter(reaction => {
                const reactionDate = new Date(reaction.reaction_timestamp);
                return reactionDate >= sevenDaysAgo;
            });
            allReactions = [...allReactions, ...newReactions]
            console.log(`Reactions:Fetched ${newReactions.length} reactions (Total: ${allReactions.length})`)

            //check if we have more reactions to fetch
            cursor = response.data.next?.cursor;
            if(!cursor || newReactions.length < TARGET_LIMIT) {
                break;
            }

            // small delay between requests to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        console.log(`Reactions:completed fetching ${allReactions.length} total reactions`);
        return allReactions;

            // return response.data.reactions.filter(reaction => {
            //     const reactionDate = new Date(reaction.reaction_timestamp);
            //     return reactionDate >= sevenDaysAgo;

        } catch (requestError) {
            if (axios.isAxiosError(requestError)) {
                console.error('reactions API error details:', {
                    status: requestError.response?.status,
                    statusText: requestError.response?.statusText,
                    data: requestError.response?.data,
                    params: requestError.response?.config.params
                })
            }
            throw requestError;
        }
    }
} 