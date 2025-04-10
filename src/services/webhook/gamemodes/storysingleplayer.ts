import { FetchReply } from "../../feed";
import { StoryFlowResult } from "../types";
import { Prompts } from "../../prompts";
import { BotThinking } from "../../botthinking";
import { BotPosting } from "../../writetofc";

export class StorySinglePlayer {
    private readonly botPosting: BotPosting;
    private readonly botThinking: BotThinking;  
    private readonly prompt: Prompts

    constructor() {
        this.botThinking = new BotThinking();
        this.botPosting = new BotPosting();
        this.prompt = new Prompts()
    }

    public async singlePlayer(fid: number, hash: string, username: string, user_cast: string): Promise<StoryFlowResult> {
    
        try {
            console.log('[STAGE] : singleplayer')

            // get all the casts in the thread
            const replytoBot = new FetchReply(hash)
            const threadSummaryText = await replytoBot.getThreadSummary() //default depth: 2
            console.log('[LOG single player] Cast in Thread', threadSummaryText)

            // Gaianet: add to the story (prompting LLM)
            const worldBuildingPrompt = this.prompt.worldbuilding_storywriting(
                // this creates the prompt combinign the general prompt text with input from the user
                // it needs the user's story (cast) and the thread summary
                user_cast, 
                threadSummaryText)
            const botStory = await this.botThinking.callGaiaStorywriting(
                // this calls the LLM with the prompt
                this.prompt.worldbuilding_system_prompt,
                worldBuildingPrompt)

            // post the reply and return the hash of the reply
            const botReply = await this.botPosting.botSaysHi(botStory, hash)

            // // get the reply and check for coauthors
            // // if coauthors mentioned create a webhook
            // DECISION: leave out for mvp. need db to do this properly
            // const userReply = new FetchReply(botReply)
            // const userReplyCast = await userReply.getReplytoBot() // this doesn't check for replys
            // const coauthors = userReplyCast.mentioned_fids

            // if (coauthors) {
            //     const webhookManager = new WebhookManager();
            //     await webhookManager.coauthorsWebhook(fid, hash, coauthors)
            // }

            return {
                success: true, 
                stage: 'singleplayer',
                message: 'bot replied to user with story',
                hash: botReply
            }

        } catch (error) {
            console.error('[ERROR] in single player mode', error)
            return {
                success: false,
                stage: 'singleplayer',
                message: 'error intercting with user',
                hash: null,
                error: error instanceof Error ? error.message : 'unknown error'
            }
        }
    }
}