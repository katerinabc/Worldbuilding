import { FetchUserCasts } from '../services/feed';
import { FetchReactions } from '../services/reactions'
import { MemoryService } from '../services/memory';
import { client, COLLECTIONS, getEmbedder } from '../database/client';
import { IEmbeddingFunction } from 'chromadb';
import { EMBEDDER_CONFIG } from '../config/embedder';

// testing creating chromadb collections and processing casts into them

async function testMemory() {
    try {
        console.log('\nChecking existing collections...');
        const existingCollections = await client.listCollections();
        console.log('Found collections:', 
            existingCollections.map(c => ({
                name: c.name,
                metadata: c.metadata
            }))
        );

        // If collections exist, delete them
        // why did I let the AI add that?????
        
        // for (const collection of existingCollections) {
        //     if (collection.name === COLLECTIONS.LONG_TERM || 
        //         collection.name === COLLECTIONS.SHORT_TERM) {
        //         console.log(`Deleting existing collection: ${collection.name}`);
        //         await client.deleteCollection({ name: collection.name });
        //     }
        // }

        // Initialize with configured embedder
        console.log(`\nInitializing collections with ${EMBEDDER_CONFIG.active} embedder`);
        const memoryService = new MemoryService();
        const collections = await memoryService.initializeCollections();
        console.log('Collections initialized:', collections ? 'Success' : 'Failed');
        // console.log('Collections created successfully');

        // 3a. Fetch user casts
        console.log('\nFetching user casts...');
        const feedService = new FetchUserCasts();
        const allCasts = await feedService.getUserCasts();
        const recentCasts = allCasts.slice(0, 15);  // Take 15 most recent
        console.log(`Fetched ${recentCasts.length} out of ${allCasts.length} total casts`);

        // 3b Fetch users reactions
        console.log('\nFetching user reactions...');
        const reactionsService = new FetchReactions();
        const allReactions = await reactionsService.getLikedCasts();
        const recentReactions = allReactions.slice(0,5);
        console.log(`Fetched ${recentReactions.length} out of ${allReactions.length} total casts`);


        // 4. Process casts into long-term memory
        console.log('\nProcessing casts into long-term memory...');
        try {
            await memoryService.processLongTermMemory(recentCasts);
            console.log('Long-term memory processed successfully');
        } catch (error) {
            console.error('Error processing long-term memory:', error);
        }


        // 4b. Process casts into short-term memory
        console.log('\nProcessing reactions into short-term memory...');
        try {
            await memoryService.processShortTermMemory(recentReactions.map(r => r.cast));
            console.log('Short-term memory processed successfully');
        } catch (error) {
            console.error('Error processing short-term memory:', error);
        }

        // // 6. Print processed casts for verification
        // console.log('\nProcessed casts:');
        // // recentCasts.forEach((cast, index) => {
        // //     console.log(`\n--- Cast ${index + 1} ---`);
        // //     console.log(`Text: "${cast.text}"`);
        // //     console.log(`Time: ${cast.timestamp}`);
        // //     console.log(`Author: @${cast.author.username}`);
        // // });
        // recentReactions.forEach((reaction, index) => {
        //     console.log(`\n--- Cast ${index + 1} ---`);
        //     console.log(`Text: "${reaction.cast.text}"`);
        //     console.log(`Time: ${reaction.cast.timestamp}`);
        //     console.log(`Author: @${reaction.cast.author.username}`);
        // });

         // 8. Verify data was added
         const shortTermCount = await collections.shortTermCollection.count();
         const longTermCount = await collections.longTermCollection.count();
         console.log('\nFinal collection counts:');
         console.log(`Short-term: ${shortTermCount} items`);
         console.log(`Long-term: ${longTermCount} items`);

        // 9. peeking into the collections returning everythign but embeddings
        
        // const peekShortTerm = await memoryService.peekShortTermMemory();
        // const peekLongTerm = await memoryService.peekLongTermMemory();

        // console.log('Peek into short term memory:', peekShortTerm);
        // console.log('Peek into long term memory:', peekLongTerm);

        // console.log('\nTest completed successfully!');

    } catch (error) {
        console.error('Error in test memory:', error);
        throw error;
    }
}

// Get embedder choice from command line or default to 'chroma'
const embedderChoice = process.argv[2] as 'chroma' | 'gaia' || 'chroma';
testMemory();