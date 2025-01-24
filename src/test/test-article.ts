import { client, COLLECTIONS, getEmbedder } from "../database/client";
import { ArticleGenerator } from "../services/article";
import { IEmbeddingFunction } from 'chromadb';
import { EMBEDDER_CONFIG } from '../config/embedder';

async function testArticleGenerator() {
    try {
        const embedder = getEmbedder();
        console.log(`Using ${EMBEDDER_CONFIG.active} embedder`);
        
        console.log('Getting collections...');
        const shortTermCollection = await client.getCollection({
            name: COLLECTIONS.SHORT_TERM,
            embeddingFunction: embedder as IEmbeddingFunction,
        });
        // console.log('Using embedder:', embedder);

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

        // Create article generator and generate sections
        console.log('\n=== Generating Core Section ===');
        const coreSection = await articleGenerator.generateCoreSection();
        console.log(coreSection);

        console.log('\n=== Generating Related Section ===');
        const relatedSection = await articleGenerator.generateRelatedSection();
        console.log(relatedSection);

        console.log('\n=== Generating Outer Space Section ===');
        const outerSpaceSection = await articleGenerator.generateOuterSpaceSection();
        console.log(outerSpaceSection);

        // Don't need to call generateArticle() since we're not using the combined result
        
    } catch (error) {
        console.error('Error testing article generator:', error);
        throw error;
    }
}

// Run the test
testArticleGenerator();