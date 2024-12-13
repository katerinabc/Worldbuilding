import { FetchReactions } from '../services/reactions';
import { FetchUserCasts } from '../services/feed';

async function testReactions() {
    try {
        const service = new FetchReactions();
        console.log('Fetching liked casts...');
        
        const reactions = await service.getLikedCasts();
        
        console.log(`Found ${reactions.length} reactions in the past 7 days`);
        
        // Print details of each reaction
        reactions.forEach((reaction, index) => {
            console.log(`\n--- Reaction ${index + 1} ---`);
            console.log(`Type: ${reaction.reaction_type}`);
            console.log(`Time: ${reaction.reaction_timestamp}`);
            console.log(`Cast: "${reaction.cast.text}"`);
            console.log(`Author: ${reaction.cast.author.display_name} (@${reaction.cast.author.username})`);
            console.log(`Likes: ${reaction.cast.reactions.likes_count}`);
            console.log(`Replies: ${reaction.cast.replies.count}`);
        });

    } catch (error: unknown) {
        if (error instanceof Error) {
            console.error('Error:', error.message);
        } else {
            console.error('An unknown error occurred:', error);
        }
    }
}

async function testUserCasts() {
    try {
        const service = new FetchUserCasts();
        console.log('Fetching user casts...');
        
        const userFeed = await service.getUserCasts();
        
        console.log(`Found ${userFeed.length} casts. max is set to 150`);
        
        // Print details of each feed entry
        userFeed.forEach((feed, index) => {
            console.log(`\n--- Feed ${index + 1} ---`);
            console.log(`Cast: "${feed.text}"`);
            console.log(`Author: ${feed.author.display_name} (@${feed.author.username})`);
            console.log(`Likes: ${feed.reactions.likes_count} `);
            console.log(`Channel: ${feed.parent_url} `);
        });

    } catch (error: unknown) {
        if (error instanceof Error) {
            console.error('Error:', error.message);
        } else {
            console.error('An unknown error occurred:', error);
        }
    }
}

// Run both tests
(async () => {
    console.log('Testing Reactions:');
    await testReactions();
    console.log('\nTesting User Casts:');
    await testUserCasts();
})(); 