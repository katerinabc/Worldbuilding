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

    public async multiPlayer(fid: number, hash: string, thread_hash: string, username: string, user_cast: string, coauthors: string[]): Promise<StoryFlowResult>{

        try {
            console.log('[STAGE] : multi player mode')

            // get all casts in the thread
            // replace this with API endpoint for Ai summary?
            // increase 5 for more context. 
            const storySummary = new FetchReply(thread_hash)
            const storySummaryText = await storySummary.getThreadSummary(5)
            console.log('[MULTIPLAYER] : ', 'thread summary', storySummaryText)

            // get most recent casts in the thread
            const threadSummaryRecent = new FetchReply(hash)
            const threadSummaryTextRecent = await threadSummaryRecent.getThreadSummary(2)
            console.log('[MULTIPLAYER] : ', 'thread summary recent', threadSummaryTextRecent)

            // create a reply for the coauthors
            const worlbuildingMPPrompt = this.prompt.worldbuilding_multiplayer_storysummary(
                storySummaryText, threadSummaryTextRecent, coauthors)
            console.log('[MULTIPLAYER] : ', 'worlbuildingMPPrompt', worlbuildingMPPrompt)
            const botStory = await this.botThinking.callGaiaNotCreative(
                this.prompt.worldbuilding_system_prompt,
                worlbuildingMPPrompt)
            console.log('[MULTIPLAYER] : ', 'botStory', botStory)

            // Format co-authors with @ symbol
            const taggedCoauthors = coauthors.map(author => 
                author.startsWith('@') ? author : `@${author}`
            ).join(' ');
            
            // Add tagged co-authors to the beginning of the message
            const replyWithTags = `${taggedCoauthors}\n\n${botStory}`;

            // post reply for coauthors
            const botReply = await this.botPosting.botSaysHi(replyWithTags, hash)
            console.log('[MULTIPLAYER] : ', 'bot reply', replyWithTags)

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