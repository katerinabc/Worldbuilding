// Types for API responses
export interface Author {
    object: 'user';
    fid: number;
    username: string;
    display_name: string;
    pfp_url: string;
    follower_count: number;
    following_count: number;
    profile?: {
        bio: {
            text: string;
            mentioned_profiles: any[];
        };
        location?: {
            latitude: number;
            longitude: number;
            address: {
                city: string;
                state: string;
                country: string;
                country_code: string;
            };
        };
    };
    verified_addresses?: {
        eth_addresses: string[];
        sol_addresses: string[];
    };
    verified_accounts: any[];
    power_badge: boolean;
}

interface ArticleSection { // never used
    title: string;
    content: string[];
    similarity: 'core' | 'related' | 'outerSpace';
}

export interface Cast {
    object: 'cast';
    hash: string;
    author: Author;
    text: string;
    timestamp: string;
    parent_author: {
        fid: number | null;
    };
    reactions: {
        likes_count: number;
        recasts_count: number;
        likes: Array<{
            fid: number;
            fname: string;
        }>;
    };
    replies: {
        count: number;
    };
    parent_url: string | null;
    root_parent_url: string | null;
    thread_hash: string;
    app?: {
        object: 'user_dehydrated';
        fid: number;
        username: string;
        display_name: string;
        pfp_url: string;
    };
    channel?: {
        object: 'channel_dehydrated';
        id: string;
        name: string;
        image_url: string;
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
}

export interface Reaction {
    reaction_type: 'like' | 'recast';
    cast: Cast;
    reaction_timestamp: string;
    object: string;
}

export interface ReactionsResponse {
    reactions: Reaction[];
    cursor: string;
    next: {
        cursor: string;
    };
}

export interface UserFeedResponse {
    casts: Cast[];
    next: {
        cursor?: string;
    };
} 

export interface ThreadSummaryResponse {
    conversation: {
        cast: Cast;
        direct_replies: Cast[];
    };
    next: {
        cursor: string | null;
    };
} 

export interface FetchSingleCast {
    cast: Cast;
    mentioned_fids: number[];
}

// TYPES FOR MEMORY SERVICE

// Define what an embedding vector looks like
// This is like a container for both the original text and its mathematical representation
export interface EmbeddingVector {
    text: string;          // The original text from the cast
    vector: number[];      // The mathematical representation of the text
    metadata: {            // Additional information about the cast
        timestamp: string; // When it was created
        author: string;    // Who wrote it
        hash: string;      // Unique identifier
        type: 'feed' | 'like';  // Whether it's from user's feed or their likes
    };
}

// Structure for storing multiple vectors with a timestamp
export interface Memory {
    vectors: EmbeddingVector[];     // Array of all our vectors
    lastUpdated: string;            // When this memory was last modified
}

// Add this with the other interfaces
export interface EmbeddingFunction {
    generate(texts: string[]): Promise<number[][]>;
}

// Interface for metadata of chroma object. used to checking for duplicates
export interface ChromaMetadataType {
    timestamp: string;
    author: string;
    hash: string;
    type?: string;
    similarity?: number;
    similarity_category?: string;
}