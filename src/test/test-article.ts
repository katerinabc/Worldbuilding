import { ArticleGenerator } from '../services/article';

async function testArticleGeneration() {
    try {
        console.log('Starting article generation test...\n');

        // Initialize article generator
        const generator = new ArticleGenerator();

        // Generate article
        console.log('Generating article...');
        const article = await generator.generateArticle();

        // Print the result
        console.log('\n=== Generated Article ===\n');
        console.log(article);
        console.log('\n=== End of Article ===\n');

        // Print article stats
        const wordCount = article.split(/\s+/).length;
        console.log(`Article Statistics:`);
        console.log(`- Word count: ${wordCount}`);
        console.log(`- Character count: ${article.length}`);
        console.log(`- Number of paragraphs: ${article.split('\n\n').length}`);

    } catch (error: unknown) {
        if (error instanceof Error) {
            console.error('Error:', error.message);
        } else {
            console.error('An unknown error occurred');
        }
    }
}

// Run the test
console.log('Note: Make sure you have run test-memory.ts first to generate the embeddings!\n');
testArticleGeneration();