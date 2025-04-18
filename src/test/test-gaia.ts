// test-gaia.ts (Example Structure)
import dotenv from 'dotenv';
import { BotThinking } from '../services/botthinking'; // Adjust path if needed
import { Prompts } from '../services/prompts';      // Adjust path if needed
import { Cast } from '../services/types';          // Adjust path if needed
import { FetchReply, FetchUserCasts } from '../services/feed';

// Load environment variables (for GAIA_API_KEY)
dotenv.config();

// Instantiate necessary classes
const botThinking = new BotThinking();
const prompts = new Prompts();

// Define Sample Input Data (This is the crucial part!)
// Example for testing worldbuilding_adjectives -> callGaiaAdjectives
// MOVED: const userFeed = new FetchUserCasts(12021);
// MOVED: const sampleCastsForAdjectives = await userFeed.getUserCasts(10)

// Example for testing worldbuilding_storywriting -> callGaiaStorywriting
// const sampleUserCastText: string = "The dragon landed near the shimmering lake.";
// const sampleThreadSummary: Cast[] = [
//     // Create Cast objects representing the story so far
//     {
//         object: 'cast', hash: '0xstoryhash1', text: 'Once upon a time...',
//         author: { /*...*/ fid: 913741, username: 'bot', display_name: 'Bot', pfp_url: '', follower_count: 0, following_count: 0, power_badge: false },
//         timestamp: new Date().toISOString(), parent_author: { fid: null }, reactions: { likes_count: 0, recasts_count: 0, likes: [] }, replies: { count: 0 }, parent_url: null, root_parent_url: null, thread_hash: '0xstorythread', mentioned_profiles: [], mentioned_profiles_ranges: [], mentioned_channels: [], mentioned_channels_ranges: []
//     },
//     // ... more story casts ...
// ];

// --- Test Execution ---
async function runTests() {
    try {
        // Fetching data for testing
        console.log("Fetching sample casts from feed...");
        const userFeed = new FetchUserCasts(12021);
        const sampleCastsForAdjectives = await userFeed.getUserCasts(10);
        console.log(`Fetched ${sampleCastsForAdjectives.length} sample casts.`);

        // for tsting SINGLE player story ---
        const last_cast = new FetchReply('0xccb2f28d47203bd8336bb29dda8a523abe9134b0') //last cast in the story-thread
        const last_cast_text = (await last_cast.getReplytoBot()).cast.text
        console.log("Last cast text:\n", last_cast_text)

        const replytoBot = new FetchReply('0xc0d324871a7f002aeb9e68ac63696feb23a463f9') // first story cast in the story-thread
        const threadSummaryText = await replytoBot.getThreadSummary(3)
        console.log(`Fetched thread summary ${threadSummaryText}`)

        // for tsting MUTLIPLAYER player story ---
        const storySummary = new FetchReply('0x0f835e78450f6d07ae1e8d33fc898780f1490799')
        const storySummaryText = await storySummary.getThreadSummary(5)
        console.log('[MULTIPLAYER] : ', 'thread summary', storySummaryText)

        // get most recent casts in the thread
        // parent_hash = most recent cast
        const threadSummaryRecent = new FetchReply('0xf5d5d3cebab972b0687cdf1dc412747fabcb3371')
        const threadSummaryTextRecent = await threadSummaryRecent.getThreadSummary(2)
        console.log('[MULTIPLAYER] : ', 'thread summary recent', threadSummaryTextRecent)

        console.log("Testing gaianode availability...");
        // Error: prompts.sayHello is not a function - assuming you meant sayhiPrompt
        // console.log(prompts.sayHello()); 

        // testing if gaianode is working ---
        const simpleprompt = prompts.sayHello()
        console.log("Checking sayhiPrompt:", simpleprompt); // Displaying part of it
        const botSaysHi = await botThinking.callGaiaDefault(simpleprompt, simpleprompt)
        console.log("Bot Says Hi:", botSaysHi);

        const coauthors_name = [ '@borrowlucid.eth', '@kbc']

        // testing generating adjectives ---

        console.log("Testing Adjectives Prompt Generation...");
        const adjectivePromptText = prompts.worldbuilding_adjectives(sampleCastsForAdjectives);
        console.log("Generated Prompt:\n", adjectivePromptText);

        console.log("\nTesting Gaia Adjectives Call...");
        const adjectivesResult = await botThinking.callGaiaNotCreative(
            prompts.worldbuilding_system_prompt, // Use the actual system prompt
            adjectivePromptText
        );
        console.log("Gaia Result:\n", adjectivesResult);
        console.log("These are the foundations of our World: " + adjectivesResult +"\n Now it's your turn: Write a couple of lines about the world. Describe a place in this world, landmark, or entity.");

        // --- testing if bot can add to story (singleplayer) ---
        console.log("\nTesting Storywriting Prompt Generation...");
        const worldBuildingPrompt = prompts.worldbuilding_storywriting(
            // this creates the prompt combinign the general prompt text with input from the user
            // it needs the user's story (cast) and the thread summary
            last_cast_text, // last cast in the thread
            threadSummaryText) //summary of thread
        console.log("Generated Prompt:\n", worldBuildingPrompt);

        const botStory = await botThinking.callGaiaStorywriting(
            // this calls the LLM with the prompt
            prompts.worldbuilding_system_prompt,
            worldBuildingPrompt)
        console.log("Bot's reply:\n", botStory + "\n \n Your turn: Add to the story, tag a friend, or register on Story Protocol.");
        

        // --- testing if bot can kick off multiplayer mode (multiplayer) ---
        // console.log("\nTesting Gaia Storywriting Call...");
        const worldBuildingPromptMP = prompts.worldbuilding_multiplayer_storysummary(
            // this creates the prompt combinign the general prompt text with input from the user
            // it needs the user's story (cast) and the thread summary
            threadSummaryTextRecent, // last cast in the thread
            storySummaryText, //summary of thread
            coauthors_name)
        console.log("Generated Prompt:\n", worldBuildingPromptMP);
        
        const storyResult = await botThinking.callGaiaNotCreative(
            prompts.worldbuilding_system_prompt,
            worldBuildingPromptMP
        );

        // Format co-authors with @ symbol
        const taggedCoauthors = coauthors_name.map(author => 
            author.startsWith('@') ? author : `@${author}`
        ).join(' ');
        
        // Add tagged co-authors to the beginning of the message
        const replyWithTags = `${botStory} \n ${taggedCoauthors} How'd you continue the story? Add a new landmark or person, or describe an event.`;

        console.log("Gaia Result:\n", replyWithTags);


    } catch (error) {
        console.error("\n--- TEST FAILED ---");
        console.error(error);
    }
}

runTests(); // Execute the tests