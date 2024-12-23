import { FetchReactions } from "../services/reactions";

const DEFAULT_USER_ID = '12021'; // Default test user ID

async function testReactions() {
    const userId = process.argv[2] || DEFAULT_USER_ID;
    console.log(`Testing with user ID: ${userId}`);

    try {
        const service = new FetchReactions(userId);
        const reactions = await service.getLikedCasts();
        console.log(`Successfully processed ${reactions.length} reactions`);
    } catch (error) {
        console.error('Test failed:', error);
    }
}

testReactions(); 