import { client, COLLECTIONS, embedder } from "../database/client";
import { ArticleGenerator } from "../services/article";

async function testArticleGenerator() {
    try {
        // 1. Initialize services
        console.log('Initializing services...');
        
        console.log('Getting short-term collection...');
        const shortTermCollection = await client.getCollection({
            name: COLLECTIONS.SHORT_TERM,
            embeddingFunction: embedder,
        });

        console.log('getting long-term collection...');
        const longTermCollection = await client.getCollection({
            name: COLLECTIONS.LONG_TERM,
            embeddingFunction: embedder,
        })

        // Check if we have data
        const shortTermCount = await shortTermCollection.count();
        console.log(`Short-term collection has ${shortTermCount} items`);

        if (shortTermCount === 0) {
            console.log('Collection is empty! Run test-memory.ts first to populate data.');
            return;
        }

        // 2. Create article generator
        console.log('Creating article generator...');
        const articleGenerator = new ArticleGenerator(shortTermCollection, longTermCollection);

        // 3. Generate article (currently just core section)
        console.log('Generating article...');
        const article = await articleGenerator.generateArticle();

        // 4. Print results
        console.log('\n=== Generated Article ===\n');
        console.log(article);

    } catch (error) {
        console.error('Error testing article generator:', error);
        throw error;
    }
}

// Run the test
testArticleGenerator();