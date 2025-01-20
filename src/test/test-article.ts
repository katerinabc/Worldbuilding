import { client, COLLECTIONS, getEmbedder } from "../database/client";
import { ArticleGenerator } from "../services/article";
import { IEmbeddingFunction } from 'chromadb';

async function testArticleGenerator() {
    try {
        const embedder = getEmbedder('chroma');
        console.log('Initializing services...');
        
        console.log('Getting short-term collection...');
        const shortTermCollection = await client.getCollection({
            name: COLLECTIONS.SHORT_TERM,
            embeddingFunction: embedder as IEmbeddingFunction,
        });

        console.log('getting long-term collection...');
        const longTermCollection = await client.getCollection({
            name: COLLECTIONS.LONG_TERM,
            embeddingFunction: embedder as IEmbeddingFunction,
        });

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