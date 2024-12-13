// import axios from 'axios';
// import dotenv from 'dotenv';

// // Load environment variables
// dotenv.config();

// // Types for API responses
// interface Author {
//     object: 'user';
//     fid: number;
//     username: string;
//     display_name: string;
//     pfp_url: string;
//     follower_count: number;
//     following_count: number;
// }

// interface Cast {
//     object: 'cast';
//     hash: string;
//     author: Author;
//     text: string;
//     timestamp: string;
//     reactions: {
//         likes_count: number;
//         recasts_count: number;
//         likes: Array<{
//             fid: number;
//             fname: string;
//         }>;
//     };
//     replies: {
//         count: number;
//     };
// }

// interface Reaction {
//     reaction_type: 'like' | 'recast';
//     cast: Cast;
//     reaction_timestamp: string;
//     object: string;
// }

// interface ReactionsResponse {
//     reactions: Reaction[];
//     cursor: string;
//     next: {
//         cursor: string;
//     };
// }

// interface UserFeed {
//     casts: Cast[];
//     cursor: string;
//     next: {
//         cursor: string;
//     };
// }

// export class FetchReactions {
//     private readonly apiKey: string;
//     private readonly baseUrl: string = 'https://api.neynar.com/v2';
//     private readonly targetUserId: string = '12021';

//     constructor() {
//         const apiKey = process.env.NEYNAR_API_KEY;
//         if (!apiKey) {
//             throw new Error('NEYNAR_API_KEY not found in environment variables');
//         }
//         this.apiKey = apiKey;
//     }

//     /**
//      * Fetch casts liked by the target user in the past 7 days
//      */
//     async getLikedCasts(): Promise<Reaction[]> {
//         try {
//             // 1. Set up the time filter
//             const sevenDaysAgo = new Date();
//             sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

//             // 2. Make API request
//             const response = await axios.get<ReactionsResponse>(
//                 `${this.baseUrl}/farcaster/reactions/user`,
//                 {
//                     headers: {
//                         accept: 'application/json',
//                         'x-api-key': this.apiKey,
//                     },
//                     params: {
//                         fid: this.targetUserId,
//                         type: 'like',
//                         limit: 100, // Adjust as needed
//                     }
//                 }
//             );

//             // 3. Filter reactions for occuring in the last 7 days
//             return response.data.reactions.filter(reaction => {
//                 const reactionDate = new Date(reaction.reaction_timestamp);
//                 return reactionDate >= sevenDaysAgo;
//             });

//         } catch (error) {
//             if (axios.isAxiosError(error)) {
//                 throw new Error(`Failed to fetch likes: ${error.message}`);
//             }
//             throw error;
//         }
//     }
// } 

// export class FetchUserCasts {
//     private readonly apiKey: string;
//     private readonly baseUrl: string = 'https://api.neynar.com/v2';
//     private readonly targetUserId: string = '12021';

//     constructor() {
//         const apiKey = process.env.NEYNAR_API_KEY;
//         if (!apiKey) {
//             throw new Error('NEYNAR_API_KEY not found in environment variables');
//         }
//         this.apiKey = apiKey;
//     }

//     /**
//      * Fetch casts by the user
//      */
//     async getUserCasts(): Promise<Cast[]> {
//         try {
//             // currently no time filter
//             // const sevenDaysAgo = new Date();
//             // sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

//             // 2. Make API request
//             const response = await axios.get<UserFeed>(
//                 `${this.baseUrl}/farcaster/feed/user`,
//                 {
//                     headers: {
//                         accept: 'application/json',
//                         'x-api-key': this.apiKey,
//                     },
//                     params: {
//                         fid: this.targetUserId,
//                         limit: 150, // Adjust as needed
//                         include_replies: true,
//                         //cursor?
//                     }
//                 }
//             );

//             // // 3. Filter reactions for occuring in the last 7 days
//             // return response.data.reactions.filter(reaction => {
//             //     const reactionDate = new Date(reaction.reaction_timestamp);
//             //     return reactionDate >= sevenDaysAgo;
//             // });

//             //Return response data
//             return response.data.casts;

//         } catch (error) {
//             if (axios.isAxiosError(error)) {
//                 throw new Error(`Failed to fetch likes: ${error.message}`);
//             }
//             throw error;
//         }
//     }
// } 