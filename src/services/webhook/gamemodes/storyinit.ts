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
            // story initalization cast. A hash is returned
            const botHash = await this.botPosting.botSaysHi(this.prompt.storyPhase1(), hash)
        
            // foundation cast: getting adjectives
            const userFeed = new FetchUserCasts(fid);
            const userCasts = await userFeed.getUserCasts(10)

            // give feed to botthinking
            const worldBuildingPrompt = this.prompt.worldbuilding_adjectives(userCasts)

            // get the adjectives via gaianet
            const adjectives = await this.botThinking.callGaiaAdjectives(
                this.prompt.worldbuilding_system_prompt, 
                worldBuildingPrompt);
            console.log('[TEST] adjectives', adjectives)
            
            // reply with adjectives
            const storyFoundationHash = await this.botPosting.botSaysHi(adjectives, botHash)
            
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