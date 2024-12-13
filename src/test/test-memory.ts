import { FetchUserCasts } from '../services/feed';
import { FetchReactions } from '../services/reactions';
import { MemoryService } from '../services/memory';

async function buildMemory() {
    try {
        const memoryService = new MemoryService();

        // 1. Process Long-Term Memory (User's Feed)
        console.log('Fetching user casts for long-term memory...');
        const feedService = new FetchUserCasts();
        const allCasts = await feedService.getUserCasts();
        const feedCasts = allCasts.slice(0, 15);  // Take 15 most recent
        console.log(`Processing ${feedCasts.length} out of ${allCasts.length} feed casts`);

        console.log('\nGenerating long-term memory embeddings...');
        await memoryService.processLongTermMemory(feedCasts);

        // 2. Process Short-Term Memory (User's Likes)
        console.log('\nFetching user reactions for short-term memory...');
        const reactionService = new FetchReactions();
        const allReactions = await reactionService.getLikedCasts();
        const reactions = allReactions.slice(0, 5)
        
        // Extract casts from reactions
        const likedCasts = reactions.map(reaction => reaction.cast);
        console.log(`Processing ${likedCasts.length} liked casts`);

        console.log('\nGenerating short-term memory embeddings...');
        await memoryService.processShortTermMemory(likedCasts);

        // 3. Print processed casts
        console.log('\nProcessed feed casts (long-term memory):');
        feedCasts.forEach((cast, index) => {
            console.log(`\n--- Feed Cast ${index + 1} ---`);
            console.log(`Text: "${cast.text}"`);
            console.log(`Time: ${cast.timestamp}`);
            console.log(`Author: @${cast.author.username}`);
        });

        console.log('\nProcessed liked casts (short-term memory):');
        likedCasts.forEach((cast, index) => {
            console.log(`\n--- Liked Cast ${index + 1} ---`);
            console.log(`Text: "${cast.text}"`);
            console.log(`Time: ${cast.timestamp}`);
            console.log(`Author: @${cast.author.username}`);
        });

        // 4. Find and display similarities
        console.log('\nAnalyzing similarities between feed and likes...');
        const similarities = await memoryService.findSimilarCastsByCategory();
        
        console.log('\nSimilarity Results:');
        console.log(`Core matches (>= 80% similar): ${similarities.core.length}`);
        console.log(`Related matches (50-79% similar): ${similarities.related.length}`);
        console.log(`Outer Space matches (10-49% similar): ${similarities.outerSpace.length}`);

        // 5. Show some example matches
        if (similarities.core.length > 0) {
            console.log('\nExample Core Match:');
            const example = similarities.core[0];
            console.log(`Feed: "${example.feed.text}"`);
            console.log(`Like: "${example.like.text}"`);
            console.log(`Similarity: ${(example.similarity * 100).toFixed(1)}%`);
        }

        if (similarities.outerSpace.length > 0) {
            console.log('\nExample Outer Space Match:');
            const example = similarities.outerSpace[0];
            console.log(`Feed: "${example.feed.text}"`);
            console.log(`Like: "${example.like.text}"`);
            console.log(`Similarity: ${(example.similarity * 100).toFixed(1)}%`);
        }

    } catch (error: unknown) {
        if (error instanceof Error) {
            console.error('Error:', error.message);
        } else {
            console.error('An unknown error occurred');
        }
    }
}

// Run the test
buildMemory(); 