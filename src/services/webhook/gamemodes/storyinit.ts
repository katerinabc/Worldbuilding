import { StoryFlowResult } from '../types';
import { BotPosting } from '../../writetofc';
import { Prompts } from '../../prompts';
import { FetchUserCasts } from '../../feed';
import { BotThinking } from '../../botthinking';


export class StoryInitialization {
    private readonly botPosting: BotPosting;
    private readonly botThinking: BotThinking;  
    private readonly prompt: Prompts

    constructor() {
        this.botThinking = new BotThinking();
        this.botPosting = new BotPosting();
        this.prompt = new Prompts()
    }

    public async storyInitialization(fid: number, hash:string, username:string, user_cast: string): Promise<StoryFlowResult> {

        try {
            console.log('[STAGE]', 'initialization')
            
            // foundation cast: getting adjectives
            console.log('[LOG] fetching user casts to come up with adjectives')
            const userFeed = new FetchUserCasts(fid);
            const userCasts = await userFeed.getUserCasts(10)

            // give feed to botthinking
            console.log('[LOG] creating worldbuilding prompt')
            const worldBuildingPrompt = this.prompt.worldbuilding_adjectives(userCasts)

            // get the adjectives via gaianet
            console.log('[LOG] calling gaianet')
            const adjectives = await this.botThinking.callGaiaAdjectives(
                this.prompt.worldbuilding_system_prompt, 
                worldBuildingPrompt);
            console.log('[TEST] adjectives', adjectives)

            // story initalization cast. A hash is returned
            const botHash = await this.botPosting.botSaysHi(this.prompt.storyPhase1(), hash)

            // strip adjectives of any extra text. might not be needed. depends on llm. works well with falcon
            
            // reply with adjectives
            const botreply = "These are the foundations of our World: " + adjectives +"\n Now it's your turn: Write a couple of lines about the world. Describe a place in this world, landmark, or entity."
            const storyFoundationHash = await this.botPosting.botSaysHi(botreply, botHash)
            
            return {
                success: true,
                stage: 'init',
                message: 'bot replied with foundation',
                hash: storyFoundationHash
            }


        } catch (error) {
            console.error('[ERROR] bot story mode init', error )
            return { 
                success: false,
                stage: 'init',
                message: 'error posting foundation adjectives',
                hash: null,
                error: error instanceof Error ? error.message : 'unknown error'
            }
        }

    }

}