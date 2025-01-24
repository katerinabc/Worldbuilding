import { ChromaClient } from 'chromadb';
import { GaiaEmbeddingFunction } from './chromadb';
import { EmbeddingFunction } from '../services/types';
import { EMBEDDER_CONFIG } from '../config/embedder';

// Create shared client and embedder
export const client = new ChromaClient();
// export const embedder = new GaiaEmbeddingFunction();
export const getEmbedder = (): EmbeddingFunction | undefined => {
    const choice = EMBEDDER_CONFIG.active;
    
    switch (choice) {
        case 'gaia': 
            console.log('Using Gaia embedding service');
            return new GaiaEmbeddingFunction();
        case 'chroma':
            console.log('Using ChromaDB default embedding');
            return undefined;
        default:
            console.log('Invalid embedding service, using ChromaDB default');
            return undefined;
    }
}

// Collection names as constants
export const COLLECTIONS = {
    LONG_TERM: 'lt-memory',
    SHORT_TERM: 'st-memory'
} as const; 