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
    type: 'first_mention' | 'ongoing_conversation';
    data: {
        text: string;
        author: {
            fid: number;
            username: string;
        };
        hash: string;
        timestamp: string;
    };
}