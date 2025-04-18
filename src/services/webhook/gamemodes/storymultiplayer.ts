import { BotThinking } from "../../botthinking";
import { BotPosting } from "../../writetofc";
import { Prompts } from "../../prompts";
import { StoryFlowResult } from "../types";
import { FetchReply } from "../../feed";

export class StoryMultiPlayer {
    private readonly botPosting: BotPosting;
    private readonly botThinking: BotThinking;
    private readonly prompt: Prompts
    
    constructor() {
        this.botThinking = new BotThinking();
        this.botPosting = new BotPosting();
        this.prompt = new Prompts()
    }

    public async multiPlayer(fid: number, hash: string, parent_hash: string | null, thread_hash: string, username: string, user_cast: string, coauthors: string[]): Promise<StoryFlowResult>{

        try {
            console.log('[STAGE] : multi player mode')

            // get all casts in the thread
            // replace this with API endpoint for Ai summary?
            // increase 5 for more context. 
            const storySummary = new FetchReply(thread_hash)
            const storySummaryText = await storySummary.getThreadSummary(5)
            console.log('[MULTIPLAYER] : ', 'thread summary', storySummaryText)

            // get most recent casts in the thread
            const threadSummaryRecent = new FetchReply(parent_hash || hash)
            const threadSummaryTextRecent = await threadSummaryRecent.getThreadSummary(2)
            console.log('[MULTIPLAYER] : ', 'thread summary recent', threadSummaryTextRecent)

            const worlbuildingMPPrompt = this.prompt.worldbuilding_multiplayer_storysummary(
                storySummaryText, threadSummaryTextRecent, coauthors)
            console.log('[MULTIPLAYER] : ', 'worlbuildingMPPrompt', worlbuildingMPPrompt)

            let attempts = 0;
            let validResponse = false;
            let replyWithTags = "";
            const MAX_ATTEMPTS = 5;
            let botReply = null;

            while (!validResponse && attempts < MAX_ATTEMPTS) {
                attempts++;
                console.log(`\n--- Attempt ${attempts}/${MAX_ATTEMPTS} to generate response ---`);
    
                // create a reply for the coauthors
                // First, generate the initial story - only done once
                const botStory_original = await this.botThinking.callGaiaNotCreative(
                    this.prompt.worldbuilding_system_prompt,
                    worlbuildingMPPrompt
                );
                console.log('[MULTIPLAYER] : ', 'original story length', botStory_original.length);
    
                // For each attempt, start with the original and try to shorten if needed
                let botStory = botStory_original;
                if (attempts > 1) {
                    console.log(`Attempt ${attempts}: Shortening the original story...`);
                    // Add increasing shortening instructions based on attempt number
                    let shortenInstruction = "";
                    if (attempts == 2) shortenInstruction = " Make it about 25% shorter.";
                    if (attempts == 3) shortenInstruction = " Make it about 50% shorter.";
                    if (attempts >= 4) shortenInstruction = " Make it extremely concise, at most 400 characters.";
                    
                    const shortenPrompt = this.prompt.shortenSummary(botStory_original + shortenInstruction);
                    
                    botStory = await this.botThinking.callGaiaNotCreative(
                        this.prompt.worldbuilding_system_prompt,
                        shortenPrompt
                    );
                    
                    console.log(`Original length: ${botStory_original.length}, Shortened length: ${botStory.length}`);
                }
    
                // Format co-authors with @ symbol
                const taggedCoauthors = coauthors.map(author => 
                    author.startsWith('@') ? author : `@${author}`
                ).join(' ');
                
                // Add tagged co-authors to the beginning of the message
                replyWithTags = `${botStory} \n ${taggedCoauthors} How'd you continue the story? Add a new landmark or person, or describe an event.`;
    
                // Check if message is under 1024 bytes (Farcaster limit)
                const getByteLength = (str: string) => {
                    // Convert string to byte array and get length
                    return new TextEncoder().encode(str).length;
                };
                
                const messageBytes = getByteLength(replyWithTags);
                console.log(`Message byte length: ${messageBytes}/1024 bytes`);
                
                if (messageBytes <= 1024) {
                    // post reply for coauthors
                    botReply = await this.botPosting.botSaysHi(replyWithTags, hash);
                    console.log('[MULTIPLAYER] : ', 'bot reply', replyWithTags);
                    console.log("✅ Message is within byte limit!");
                    validResponse = true;

                } else {
                    console.warn("\n--- WARNING: MESSAGE EXCEEDS 1024 BYTES ---");
                    console.warn(`Attempt ${attempts}/${MAX_ATTEMPTS} failed. Trying again with stricter length constraints...`);
                }
            }

            if (!validResponse) {
                console.error("⛔ Failed to generate a response within byte limit after " + MAX_ATTEMPTS + " attempts");
                return {
                    success: false,
                    stage: 'multiplayer',
                    message: 'failed to generate a message within byte limit',
                    hash: null,
                    error: 'Message exceeded byte limit after multiple attempts'
                };
            }

            return {
                success: true,
                stage: 'multiplayer',
                message: 'bot replied to coauthors',
                hash: botReply
            };

        } catch (error) {
            console.error('[ERROR] in multiplayer mode', error)
            return {
                success: false,
                stage: 'multiplayer',
                message: 'error posting summary for coauthors',
                hash: null,
                error: error instanceof Error ? error.message : 'unknown error'
            }
        }
    }
}