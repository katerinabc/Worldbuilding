import { client, COLLECTIONS, getEmbedder } from '../database/client';
import { IEmbeddingFunction } from 'chromadb';

async function checkCollections(embeddingChoice: 'chroma' | 'gaia' = 'chroma') {
    try {
        const embedder = getEmbedder(embeddingChoice);
        console.log(`Using ${embeddingChoice} embedder`);

        // List all collections
        console.log('Listing all collections...');
        const allCollections = await client.listCollections();
        console.log('All collections:', allCollections.map(c => c.name));

        // Try to get each collection
        console.log('\nChecking short-term collection...');
        try {
            const shortTerm = await client.getCollection({
                name: COLLECTIONS.SHORT_TERM,
                embeddingFunction: embedder as IEmbeddingFunction,
            });
            const shortTermCount = await shortTerm.count();
            console.log(`✓ Short-term collection exists with ${shortTermCount} items`);
            
            if (shortTermCount > 0) {
                const shortTermPeek = await shortTerm.peek({limit: 1});
                console.log('Sample content:', shortTermPeek);
            }
        } catch (e) {
            console.log('✗ Short-term collection not found');
        }

        console.log('\nChecking long-term collection...');
        try {
            const longTerm = await client.getCollection({
                name: COLLECTIONS.LONG_TERM,
                embeddingFunction: embedder as IEmbeddingFunction,
            });
            const longTermCount = await longTerm.count();
            console.log(`✓ Long-term collection exists with ${longTermCount} items`);
            
            if (longTermCount > 0) {
                const longTermPeek = await longTerm.peek({limit: 1});
                console.log('Sample content:', longTermPeek);
            }
        } catch (e) {
            console.log('✗ Long-term collection not found');
        }

    } catch (error) {
        console.error('Error checking collections:', error);
    }
}

// Get embedder choice from command line or default to 'chroma'
const embedderChoice = process.argv[2] as 'chroma' | 'gaia' || 'chroma';
checkCollections(embedderChoice); 