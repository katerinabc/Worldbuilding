import { ChromaClient } from 'chromadb';
import { GaiaEmbeddingFunction } from './chromadb';
import { EmbeddingFunction } from '../services/types';

// Create shared client and embedder
export const client = new ChromaClient();
// export const embedder = new GaiaEmbeddingFunction();
export const getEmbedder = (service: 'chroma' | 'gaia' = 'chroma'): EmbeddingFunction | undefined => {
    switch (service.toLowerCase()) {
        case 'gaia': 
            console.log('using gaia embedding service');
            return new GaiaEmbeddingFunction();
        case 'chroma':
            console.log('using chroma default embedding service');
            return undefined //chromadb will be the default
        default:
            console.log('invalid embedding service specified. using default chroma embedding service');
            return undefined;
    }

}

// Collection names as constants
export const COLLECTIONS = {
    LONG_TERM: 'lt-memory',
    SHORT_TERM: 'st-memory'
} as const; 