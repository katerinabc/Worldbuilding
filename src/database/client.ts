import { ChromaClient } from 'chromadb';
import { gaiaEmbeddingFunction } from './chromadb';

// Create shared client and embedder
export const client = new ChromaClient();
export const embedder = new gaiaEmbeddingFunction();

// Collection names as constants
export const COLLECTIONS = {
    LONG_TERM: 'lt-memory',
    SHORT_TERM: 'st-memory'
} as const; 