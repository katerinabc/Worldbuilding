// Types for API responses
export interface Author {
    object: 'user';
    fid: number;
    username: string;
    display_name: string;
    pfp_url: string;
    follower_count: number;
    following_count: number;
}

interface ArticleSection { // never used
    title: string;
    content: string[];
    similarity: 'core' | 'related' | 'outerSpace';
}

export interface Cast {
    object: 'cast';a
    hash: string;
    author: Author;
    text: string;
    timestamp: string;
    parent_author: { //unsure this is correct
        fid: number;
    }
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
    // channel: {
    //     id: string;
    //     name: string;
    // }
    parent_url: string;
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