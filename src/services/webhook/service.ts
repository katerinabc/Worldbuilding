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
import { BotThinking } from '../bottalking';
import { BotWebhook, WebhookEvent } from './types';
import { Prompts } from '../prompts';
dotenv.config();

export class ListenBot {
    private readonly apiKey: string;
    private readonly baseUrl: string = 'https://api.neynar.com/v2';

    private handlers = {
        'cast.created': this.handleWebhook
    };

    private parseConversationStage(text: string) {
        text = text.toLowerCase()
        if (text.includes('show yourself')) return 'show_yourself';
        if (text.includes('story') || text.includes('world')) return 'story';
        return 'default';
    }

    constructor() {
        const apiKey = process.env.NEYNAR_API_KEY;
        if (!apiKey) {
            throw new Error('NEYNAR_API_KEY not found in env variables')
        }
        this.apiKey = apiKey;
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
        // console.log('Console log event data', event.data)
        console.log('Console log hash: ', event.data.hash)

        if (event.type === 'cast.created' && 
            event.data.mentioned_profiles?.some(profile => profile.fid == 913741) &&
            event.data.author.fid != 913741
            ) {
                const stage = this.parseConversationStage(event.data.text);
                const castHash = event.data.hash;
                const user_name = event.data.author.username;
                const user_fid = event.data.author.fid;
                const user_cast = event.data.text
                const botPosting = new BotPosting();
                const botThinking = new BotThinking()
                const prompt = new Prompts()

                switch (stage) {
                    case 'show_yourself':
                        const botSaysHiResponse = await botPosting.botSaysHi(this.defaultPoem(), castHash)
                        return botSaysHiResponse
                    
                    case 'story':
                        // todo implement
                        return await botPosting.botSaysHi( "...",castHash);
                    
                    default: 
                    try {
                        const defaultprompt = prompt.sayhiPrompt.replace('{user_name}', user_name)
                        console.log('[TEST] defaultprompt', defaultprompt)
                        const botreply = await botThinking.callGaia(user_cast, defaultprompt)
                        console.log('[TEST] botreply', botreply)

                        return await botPosting.botSaysHi(botreply, castHash);
                    } catch (error) {
                        console.error('Error in default case', error)
                        return await botPosting.botSaysHi("nothing working. come back later plz. @kbc error here", castHash)
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

}  // Close listenBot class

