import { FetchUserCasts } from '../services/feed';
import { FetchReactions } from '../services/reactions'
import { MemoryService } from '../services/memory';

// testing creating chromadb collections and processing casts into them

async function testMemory() {
    try {
        // 1. Initialize services
        console.log('Initializing services...');
        const memoryService = new MemoryService();
        const feedService = new FetchUserCasts();
        const reactionsService = new FetchReactions();

        // 2. Initialize collections
        console.log('Creating Chroma collections...');
        const collections = await memoryService.initializeCollections();
        console.log('Collections created successfully');

        // 3a. Fetch user casts
        // console.log('\nFetching user casts...');
        // const allCasts = await feedService.getUserCasts();
        // const recentCasts = allCasts.slice(0, 15);  // Take 15 most recent
        // console.log(`Fetched ${recentCasts.length} out of ${allCasts.length} total casts`);

        // 3b Fetch users reactions
        console.log('\nFetching user reactions...');
        const allReactions = await reactionsService.getLikedCasts();
        const recentReactions = allReactions.slice(0,5);
        console.log(`Fetched ${recentReactions.length} out of ${allReactions.length} total casts`);


        // 4. Process casts into long-term memory
        console.log('\nProcessing casts into long-term memory...');
        // await memoryService.processLongTermMemory(recentCasts);

        // 4b. Process casts into short-term memory
        console.log('\nProcessing casts into short-term memory...');
        await memoryService.processShortTermMemory(recentReactions.map(reaction => reaction.cast));

        // 6. Print processed casts for verification
        console.log('\nProcessed casts:');
        // recentCasts.forEach((cast, index) => {
        //     console.log(`\n--- Cast ${index + 1} ---`);
        //     console.log(`Text: "${cast.text}"`);
        //     console.log(`Time: ${cast.timestamp}`);
        //     console.log(`Author: @${cast.author.username}`);
        // });
        recentReactions.forEach((reaction, index) => {
            console.log(`\n--- Cast ${index + 1} ---`);
            console.log(`Text: "${reaction.cast.text}"`);
            console.log(`Time: ${reaction.cast.timestamp}`);
            console.log(`Author: @${reaction.cast.author.username}`);
        });

        // // 7. peeking into the collections returning everythign but embeddings
        
        const peekShortTerm = await memoryService.peekShortTermMemory();
        const peekLongTerm = await memoryService.peekLongTermMemory();

        console.log('Peek into short term memory:',peekShortTerm);
        console.log('Peek into long term memory:',peekLongTerm);

        console.log('\nTest completed successfully!');

    } catch (error) {
        if (error instanceof Error) {
            console.error('Error:', error.message);
        } else {
            console.error('An unknown error occurred');
        }
    }
}

// Run the test
testMemory();