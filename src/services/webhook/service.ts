/**
 * Webhook Service Handler (service.ts)
 * 
 * Purpose: Contains the core business logic for processing webhook events.
 * Think of this as a specialist that:
 * 1. Manages conversation state between the bot and users
 * 2. Determines what action to take based on the webhook event
 * 3. Coordinates with other services (memory, article generation, etc.)
 * 4. Tracks the progress of multi-step interactions
 * 
 * This service focuses on WHAT to do with webhook data, rather than HOW to receive it.
 * It contains the intelligence of your bot's interaction flow.
 */ 


import axios, { AxiosResponse, AxiosError } from 'axios';
import dotenv from 'dotenv';
import { BotPosting } from '../writetofc';
import { BotThinking } from '../botthinking';
import { BotWebhook, WebhookEvent, StoryState } from './types';
import { Prompts } from '../prompts';
import { isThisTypeNode } from 'typescript';
import { FetchUserCasts } from '../feed';
dotenv.config();

export class ListenBot {
    private readonly apiKey: string;
    private readonly baseUrl: string = 'https://api.neynar.com/v2';
    private storyState: StoryState;
    private readonly botPosting: BotPosting;    
    private readonly botThinking: BotThinking;  
    private readonly prompt: Prompts;           

    constructor() {
        const apiKey = process.env.NEYNAR_API_KEY;
        if (!apiKey) {
            throw new Error('NEYNAR_API_KEY not found in env variables')
        }
        this.apiKey = apiKey;
        this.storyState = new StoryState();
        this.botPosting = new BotPosting(); 
        this.botThinking = new BotThinking();
        this.prompt = new Prompts();
    }

    private parseConversationStage(text: string) {
        text = text.toLowerCase()
        if (text.includes('show yourself')) return 'show_yourself';
        if (text.includes('story') || text.includes('world') || text.includes('worldbuilding')) return 'story';
        return 'default';
    }

    private async handleStoryFlow(fid: number, hash: string, username: string) {
        const conversation = this.storyState.conversations.get(fid);

        if (!conversation) {
            // New story conversation
            this.storyState.startNewConversation(fid, hash, username);
        }

        const currentStage = conversation ? conversation.stage : 1;

        // handle existing conversation
        switch(currentStage) {
            case 1:
                try {

                // stage 1: hard coded intro
                // const storystart = prompt.worldbuildingPrompt1.replace('{user_name}', user_name)
                // console.log('[TEST STORY PHASE 1', storystart)

                // const botreply = await botThinking.callGaiaDefault(user_cast, storystart)
                // console.log('[TEST] STORY PHASE 1', botreply)
                const botStoryPhase1 = await this.botPosting.botSaysHi(this.storyPhase1(), hash)
                console.log('[TEST] botStoryPhase1 hash', botStoryPhase1)
                
                // update the stage we are in with the user
                this.storyState.updateConversation(fid,{
                    stage: 2,
                    hash: botStoryPhase1,
                    lastAttempt: new Date()
                });
                return {
                    success: true,
                    stage: 1,
                    message: 'successfully posted story phase 1 & updated state',
                    hash: botStoryPhase1
                }
            } catch (error) {
                console.error('[ERROR] botStoryPhase1', error);
                return {
                    success: false, 
                    stage: 1,
                    message: 'error posting story phase 1',
                    hash: null,
                    error: error instanceof Error ? error.message : 'unknown error'
                }
            }
                
            case 2: // come up with adjects and post them on farcaster

                try {
                // get casts from user
                const userFeed = new FetchUserCasts(fid);
                const userCasts = await userFeed.getUserCasts(10);
                console.log('[TEST] userCasts', userCasts)

                // give feed to botthinking
                const worldBuildingPrompt = this.prompt.worldbuilding_user_prompt(userCasts)

                // get the adjectives via gaianet
                const adjectives = await this.botThinking.callGaiaAdjectives(
                    this.prompt.worldbuilding_system_prompt, 
                    worldBuildingPrompt);
                console.log('[TEST] adjectives', adjectives)
                // reply with adjectives
                const botReply = await this.botPosting.botSaysHi(adjectives, hash)
                console.log('[TEST] botReply', botReply)

                // update state (hash)
                this.storyState.updateConversation(fid,{
                    stage: 3,
                    hash: botReply,
                    lastAttempt: new Date()
                });
                return {
                    success: true,
                    stage: 3,
                    message: 'successfully posted story phase 3 & updated state',
                    hash: botReply
                } 

            }  catch (error) {
                console.error('[ERROR] botStoryPhase1', error);
                return {
                    success: false, 
                    stage: 1,
                    message: 'error posting story phase 1',
                    hash: null,
                    error: error instanceof Error ? error.message : 'unknown error'
                }
            }                  
            case 3:
                const botReply = await this.botPosting.botSaysHi('nice one (yeah, still in testing mode', hash)
                console.log('[TEST] botReply', botReply)          
        }
        
    }

    // async createWebhook(): Promise<void> {
    //     try {
    //         const response:AxiosResponse<BotWebhook> = await axios.post(
    //         `${this.baseUrl}/farcaster/webhook`,
    //         {   // Data object
    //             subscription: {'cast.created': {mentioned_fids: [913741], parent_author_fids: [913741]}},
    //             name: 'mentionbot',
    //             url: 'https://webhook.netnigma.io/webhook'
    //         },
    //         {   // Config object (including headers)
    //             headers: {
    //                 accept: 'application/json',
    //                 'content-type': 'application/json',
    //                 'x-api-key': this.apiKey
    //             }
    //         }
    //     );
        
    //     // Add success logging
    //     console.log('service: Webhook created successfully:', {
    //         status: response.status,
    //         data: response.data
    //     });

    //     } catch(error: unknown) {
    //         if (axios.isAxiosError(error)) {
    //             console.error('Webhook API error:', {
    //                 message: error.message,
    //                 details: error.response?.data
    //             });
    //         } else {
    //             console.error('Unknown error:', error);
    //         }
    //     }
    // }

    async handleWebhook(event: WebhookEvent) {
        console.log('\n🤖 Bot Processing Webhook:');
        console.log('Time:', new Date().toLocaleTimeString());
        // console.log('Full event:', JSON.stringify(event, null, 2));  
        console.log('Console log event data', event.data)
        console.log('Console log hash: ', event.data.hash)
        console.log('[LOG', event.data.text)

        if (event.type === 'cast.created' && 
            event.data.mentioned_profiles?.some(profile => profile.fid == 913741) &&
            event.data.author.fid != 913741
            // check for hash that has already been replied to by bot. Via reply and time_period?
            ) {
                const stage = this.parseConversationStage(event.data.text);
                const castHash = event.data.hash;
                const user_name = event.data.author.username;
                const user_fid = event.data.author.fid;
                const user_cast = event.data.text

                switch (stage) {
                    case 'show_yourself':
                        const botSaysHiResponse = await this.botPosting.botSaysHi(this.defaultPoem(), castHash)
                        return botSaysHiResponse
                    
                    case 'story':
                        return await this.handleStoryFlow(
                            user_fid,
                            castHash,
                            user_name
                        );
                    
                    default: 
                    try {
                        const defaultprompt = this.prompt.sayhiPrompt.replace('{user_name}', user_name)
                        console.log('[TEST] defaultprompt', defaultprompt)
                        
                        const botreply = await this.botThinking.callGaiaDefault(user_cast, defaultprompt)
                        console.log('[TEST] botreply', botreply)

                        return await this.botPosting.botSaysHi(botreply, castHash);
                        // if the botPosting fails, does it try again from the start?
                    } catch (error) {
                        console.error('Error in default case', error)
                        return await this.botPosting.botSaysHi("nothing working. come back later plz. @kbc error here", castHash)
                    }

                        
                        
                }

        } else {
            console.log('❌ Not a mention event', event.type);

            // const botTalking = new BotTalking()
            // const castHash = event.data.hash
            // const botfailurereply = "Return to Claude!"
            // const botSaysHiResponse = await botTalking.botSaysHi(botfailurereply, castHash)
            // return botSaysHiResponse
        }
    }


    private defaultPoem() {
        return `Wo der Abend unmerklich/
                wie man so sagt ohne/
                Umschweife sagst du //
                in die Nach übergeht/
                Ist meine Zeit/
                Ist mein Ort. Dort //
                lebe ich einsam bei mir/
                sage ich und du sagst: //
                ich bin auch noch da.
                - Steffen Jacobs, Sprechstück`;
    
            }

    private storyPhase1() {
        return `
        Ley's play. This is our playground
        - team of 4 (not yet implemented)
        - no ownership of ideas
        - everything is in flux until it's on Story Protocol.

        Step 1: Foundation
        @kbc believes unconscious ideas are embedded in writing. With all the data you put out, this is scary but serves us well now. Give me a 42 seconds to "get you". Use that time to "get me".`
    }

}  // Close listenBot class

