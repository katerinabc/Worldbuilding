import { SimilarityService } from '../services/analytics';
import { client, COLLECTIONS, embedder } from "../database/client";
import { AnalyticsDB } from '../database/sqlite3';

async function testAnalytics() {
    try {
        // 1. initalize services
        console.log('initialize services...');
        console.log('getting long-term collection...');
        const longTermCollection = await client.getCollection({
            name: COLLECTIONS.LONG_TERM,
            embeddingFunction: embedder,
        });
        console.log('getting short-term collection...');
        const shortTermCollection = await client.getCollection({
            name: COLLECTIONS.SHORT_TERM,
            embeddingFunction: embedder,
        });
        console.log('getting analyticsDB...');
         const analyticsDB = new AnalyticsDB();

         // Add this check
         const shortTermCount = await shortTermCollection.count();
         const longTermCount = await longTermCollection.count();
         console.log(`Short-term collection has ${shortTermCount} items`);
         console.log(`Long-term collection has ${longTermCount} items`);
 
         if (shortTermCount === 0 || longTermCount === 0) {
             console.log('Collections are empty! Run test-memory.ts first to populate data.');
             return;
         }
        
        // 2. Create similarity service with existing collections
        const similarityService = new SimilarityService(
            longTermCollection, 
            shortTermCollection, 
            analyticsDB);

        // 3. run the similarity service to update the scores
        console.log('starting similarity service...');
        await similarityService.updateSimilarityScore();
        
        // 4. peek into the collection. check if the cast data is stored. 
        // if no cast data = error in how collection is initialized and docments added
        const peek = await shortTermCollection.peek();
        console.log('peeking into short-term collection:',peek);

        // 5. look for a specific item
        const results = await shortTermCollection.get({
            ids:['0x43daaaadc6d8ad8375cfa063e56adb820e5f3896'],
        })
        console.log('Query results from Chromadb:', results);

        const resultSimScore = await shortTermCollection.get({
            where: {
                'similarity_category': 'core'
            }
        })
        console.log('Query results from Chromadb by simscore:', resultSimScore);

        // 5. get data from sqlite
        const sqlite = new AnalyticsDB();
        const data1 = sqlite.getByHash('0x43daaaadc6d8ad8375cfa063e56adb820e5f3896');
        console.log('sqlite results from has 0x43..:', data1);
        const data2 = sqlite.getAllBySimscoreGT(0.5);
        console.log('sqlite resutls: hashes with simscore > 0.5: ', data2)

        // // Verification step: Get fresh data from ChromaDB
        // console.log('\n=== VERIFYING STORED SIMILARITY SCORES IN CHROMADB ===');
        // const verificationData = await shortTermCollection.get({
        // });

        // if (!verificationData || !verificationData.metadatas) {
        //     console.log('No verification data found');
        //     return;
        // }

        // // Print verification results
        // console.log('\nStored Data in ChromaDB:');
        // for (let i = 0; i < verificationData.documents.length; i++) {
        //     console.log('\n---');
        //     console.log(`Cast: "${verificationData.documents[i]}"`);
        //     console.log('Metadata:', JSON.stringify(verificationData.metadatas[i], null, 2));
        // }

        // // Count how many items have similarity scores
        // const itemsWithScores = verificationData.metadatas.filter(
        //     m => m && m.similarity_score !== undefined
        // ).length;

        // console.log(`\nFound ${itemsWithScores} items with similarity scores out of ${verificationData.documents.length} total items`);



    } catch (error) {
        console.error('error running similarity service:', error);
        throw error;
    }
}

// run the test
testAnalytics();