/**
 * Webhook Type Definitions (types.ts)
 * 
 * Purpose: Defines TypeScript interfaces and types specific to webhook handling.
 * This includes:
 * 1. Webhook payload structure from Neynar
 * 2. Conversation state types
 * 3. Configuration interfaces
 * 4. Response types
 * 
 * Having types in a separate file:
 * - Makes the code more maintainable
 * - Provides better TypeScript support
 * - Makes it easier to adapt to API changes
 * - Serves as documentation for data structures
 */
import { StringLiteral } from "typescript";

 

export interface BotWebhook {
    subscription: {
        'cast.created': {
            mentioned_fids: number[];
            parent_author_fids: number[];
        }
    };
    name: string;
    url: string;
}

export interface WebhookEvent {
    type: 'cast.created';
    created_at: number;  // Changed from string as it's a timestamp
    data: {
        object: 'cast';
        hash: string;
        author: {
            object: 'user';
            fid: number;
            username: string;
            display_name: string;
            pfp_url: string;
            custody_address: string;
        };
        thread_hash: string;
        parent_hash: string | null;
        parent_url: string;
        root_parent_url: string;
        parent_author: {
            fid: number | null;
        };
        text: string;
        timestamp: string;
        embeds: any[];
        channel: {
            object: 'channel_dehydrated';
            id: string;
            name: string;
            image_url: string;
        };
        reactions: {
            likes_count: number;
            recasts_count: number;
            likes: any[];
            recasts: any[];
        };
        replies: {
            count: number;
        };
        mentioned_profiles: Array<{
            object: 'user';
            fid: number;
            username: string;
            custody_address: string;
            display_name: string;
            pfp_url: string;
            profile: {
                bio: {
                    text: string;
                    mentioned_profiles: any[];
                };
            };
            follower_count: number;
            following_count: number;
            verifications: string[];
            power_badge: boolean;
        }>;
        mentioned_profiles_ranges: Array<{
            start: number;
            end: number;
        }>;
        mentioned_channels: any[];
        mentioned_channels_ranges: any[];
        event_timestamp: string;
    }
}