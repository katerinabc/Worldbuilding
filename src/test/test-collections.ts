import { client, COLLECTIONS, embedder } from '../database/client';

async function checkCollections() {
    try {
        // List all collections
        console.log('Listing all collections...');
        const allCollections = await client.listCollections();
        console.log('All collections:', allCollections.map(c => c.name));

        // Try to get each collection
        console.log('\nChecking short-term collection...');
        try {
            const shortTerm = await client.getCollection({
                name: COLLECTIONS.SHORT_TERM,
                embeddingFunction: embedder,
            });
            const shortTermCount = await shortTerm.count();
            console.log(`✓ Short-term collection exists with ${shortTermCount} items`);
            
            // Peek at content
            const shortTermPeek = await shortTerm.peek({limit: 1});
            console.log('Sample content:', shortTermPeek);
        } catch (e) {
            console.log('✗ Short-term collection not found');
        }

        console.log('\nChecking long-term collection...');
        try {
            const longTerm = await client.getCollection({
                name: COLLECTIONS.LONG_TERM,
                embeddingFunction: embedder,
            });
            const longTermCount = await longTerm.count();
            console.log(`✓ Long-term collection exists with ${longTermCount} items`);
            
            // Peek at content
            const longTermPeek = await longTerm.peek({limit: 1});
            console.log('Sample content:', longTermPeek);
        } catch (e) {
            console.log('✗ Long-term collection not found');
        }

    } catch (error) {
        console.error('Error checking collections:', error);
    }
}

checkCollections(); 