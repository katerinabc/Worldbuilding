import { WriteToFc } from '../services/writetofc';
import { client, COLLECTIONS, getEmbedder } from '../database/client';
import { MemoryService } from '../services/memory';
import { FetchUserCasts } from '../services/feed';
import { FetchReactions } from '../services/reactions';
import dotenv from 'dotenv';
import { IEmbeddingFunction } from 'chromadb';

dotenv.config()

async function testWriteToFc() {
    try {
        // all of this should alreayd be done
        // // 1. Initialize memory service and fetch services
        // console.log('Initializing services...');
        // const memoryService = new MemoryService();
        // const feedService = new FetchUserCasts();
        // const reactionsService = new FetchReactions();

        // // 2. Initialize collections with configured embedder
        // console.log('Creating collections...');
        // await memoryService.initializeCollections();

        // // 3. Fetch and process data
        // console.log('Fetching and processing data...');
        // const casts = await feedService.getUserCasts();
        // await memoryService.processLongTermMemory(casts);
        // console.log('casts processed');
        
        // const reactions = await reactionsService.getLikedCasts(); // returns arrays of casts 
        // // reactions looks like: [
        // //   { cast: {...}, timestamp: "...", other_data: "..." },
        // //   { cast: {...}, timestamp: "...", other_data: "..." }
        // // ]    
        // await memoryService.processShortTermMemory(reactions.map(r => r.cast));
        // console.log('reactions processed');

        // 4. Now we can get the populated collections
        console.log('Getting populated collections...');
        const embedder = getEmbedder()

        const shortTermCollection = await client.getCollection({
            name: COLLECTIONS.SHORT_TERM,
            embeddingFunction: embedder as IEmbeddingFunction
        });

        const longTermCollection = await client.getCollection({
            name: COLLECTIONS.LONG_TERM,
            embeddingFunction: embedder as IEmbeddingFunction,
        });

        // 5. Initialize WriteToFc with populated collections
        console.log('Testing WriteToFc...');
        const writeToFc = new WriteToFc(shortTermCollection, longTermCollection);

        // 6. Write to Farcaster
        const response = await writeToFc.writeSectionToFc();
        console.log('✓ All sections posted to Farcaster:', response);

    } catch (error) {
        console.error('error testing writing to fc', error);
        throw error;
    }
}

// Run the test
testWriteToFc();