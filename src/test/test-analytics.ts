import { SimilarityService } from "../services/analytics";
import { AnalyticsDB } from "../database/sqlite3";
import { MemoryService } from "../services/memory";

async function testAnalytics() {
    try {
        // 1. Initialize services
        console.log('Initializing services...');
        const memoryService = new MemoryService();
        const analyticsDB = new AnalyticsDB();
        await analyticsDB.initializeDB();

        // 2. Get collections from memory service
        console.log('Getting collections...');
        const { longTermCollection, shortTermCollection } = await memoryService.initializeCollections();

        // 3. Check collections have data
        const shortTermCount = await shortTermCollection.count();
        const longTermCount = await longTermCollection.count();
        console.log(`Short-term collection has ${shortTermCount} items`);
        console.log(`Long-term collection has ${longTermCount} items`);

        if (shortTermCount === 0 || longTermCount === 0) {
            console.log('Collections are empty! Run test-memory.ts first to populate data.');
            return;
        }

        // 4. Run similarity service
        console.log('Running similarity analysis...');
        const similarityService = new SimilarityService(
            longTermCollection,
            shortTermCollection,
            analyticsDB
        );

        await similarityService.updateSimilarityScore();
        console.log('Similarity scores updated successfully');

    } catch (error) {
        console.error('Error:', error);
    }
}

testAnalytics();