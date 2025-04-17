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
import { BotWebhook, WebhookEvent, StoryState, StoryFlowResult } from './types';
import { Prompts } from '../prompts';
import { FetchReply, FetchUserCasts } from '../feed';
import { WebhookManager } from './manager'
import { Cast } from '../types';
import { StoryInitialization } from './gamemodes/storyinit';
import { StorySinglePlayer } from './gamemodes/storysingleplayer';
import { StoryMultiPlayer } from './gamemodes/storymultiplayer';
dotenv.config();

export class ListenBot {
    private readonly apiKey: string;
    private readonly baseUrl: string = 'https://api.neynar.com/v2';
    private storyState: StoryState;
    private readonly botPosting: BotPosting;    
    private readonly botThinking: BotThinking;  
    private readonly prompt: Prompts; 
    private repliedHashes: Set<string> = new Set();  // Track all hashes we've replied to
    private authors: Set<number> = new Set(); // track all authors
    // private user_fid: number;// not sure we still need this
          

    constructor() {
        const apiKey = process.env.NEYNAR_API_KEY;
        if (!apiKey) {
            throw new Error('NEYNAR_API_KEY not found in env variables')
        }
        this.apiKey = apiKey;
        this.storyState = StoryState.getInstance();
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

    private async handleStoryFlow(fid: number, hash: string, thread_hash: string, username: string, user_cast: string, mode: string, coauthors_name: string[]): Promise<StoryFlowResult> {

        // bot being mentioned for the first time
        if (mode === 'init') {
                try {
                console.log('[STAGE] : initialization')
                const storyInit = new StoryInitialization()
                return await storyInit.storyInitialization(fid, hash, username, user_cast)

            } catch (error) {
                console.error('[ERROR] botStoryPhase1', error);
                return {
                    success: false, 
                    stage: 'init',
                    message: 'error posting story phase 1',
                    hash: null,
                    error: error instanceof Error ? error.message : 'unknown error'
                }
            }
        }
        
        // single player mode
        // user and bot make a story together
        // no limit to coauthors right now.              
        if (mode === 'singleplayer') {
            try {
                console.log('[STAGE] : single player')
                const storySP = new StorySinglePlayer()
                return await storySP.singlePlayer(fid, hash, thread_hash, username, user_cast)
                
            } catch (error) {
                console.error('[ERROR] in SINGPLE player mode:', error);
                return {
                    success: false,
                    stage: 'singleplayer',
                    message: 'error waiting for user reply',
                    hash: null,
                    error: error instanceof Error ? error.message : 'unknown error'
                }
            }
        }
        
        // multiplayer mode
        if (mode === 'multiplayer') {
            try {
                console.log('[STAGE] : multiplayer')
                const storyMP = new StoryMultiPlayer()
                return await storyMP.multiPlayer(fid, hash, thread_hash, username, user_cast, coauthors_name)
               

            } catch (error) {
                console.error('[ERROR] in MULTIplayer mode:', error);
                return {
                    success: false,
                    stage: 'multiplayer',
                    message: 'error in stage 4',
                    hash: null,
                    error: error instanceof Error ? error.message : 'unknown error'
                }
            }
        }

        
    // Fallback for unknown stages
    return {
        success: false,
        stage: 'unknown',
        message: 'unknown stage encountered',
        hash: null
    };
        
    }

    async handleWebhook(event: WebhookEvent) {
        console.log('\n🤖 Bot Processing Webhook:');
        console.log('Time:', new Date().toLocaleTimeString());
        // console.log('Full event:', JSON.stringify(event, null, 2));  
        console.log('Console log event data', event.data)
        // console.log('[LOG WBH type] : ', event.type)
        // console.log('[LOG WBH hash] : ', event.data.hash)
        // console.log('[LOG WBH text] : ', event.data.text)
        // console.log('[LOG WBH author fid] : ', event.data.author?.fid)
        // console.log('[LOG WBH mentioned profiles] : ', event.data.mentioned_profiles)
        // console.log('[LOG WBH parent author fid] : ', event.data.parent_author?.fid)
        // console.log('[LOG WBH parent hash] : ', event.data.parent_hash)
        // console.log('[LOG WBH thread hash] : ', event.data.thread_hash)

        // DECISION: I don't think this needed
        // const conversation = this.storyState.conversations.get(event.data.author?.fid)
        // const coAuthors = conversation?.coauthorFid
        // console.log('[LOG WBH coauthors] : ', coAuthors)

        // // this will only work if ongoing conversation. not if time has passed
        // const parent_hash = conversation?.parent_hash
        // console.log('[LOG WBH parent hash from conversation] : ', parent_hash)

         // Check if we've already replied to this hash
         if (this.repliedHashes.has(event.data.hash)) {
            console.log('Already replied to hash:', event.data.hash);
            return;
        }

        // level 1: INIT: The bot is mentioned in a cast for the first time.
        // TODO: add limit that mentioned_profiles can only be lenght = 1?
        // TODO: add an orchestrator agent before default. 
        if (event.type === 'cast.created' && 
            event.data.mentioned_profiles?.some(profile => profile.fid == 913741) &&
            event.data.author.fid != 913741 &&
            event.data.parent_author?.fid != 913741
            ) {
                console.log('[LOG WBH]: Level 1: initialization of story')
                const stage = this.parseConversationStage(event.data.text);
                const castHash = event.data.hash;
                const user_name = event.data.author?.username;
                const user_fid = event.data.author?.fid;
                const user_cast = event.data.text
                const mode = 'init'
                const threadHash = event.data.thread_hash
                const coauthors_name: string[] = []

                switch (stage) {
                    case 'show_yourself':
                        const botSaysHiResponse = await this.botPosting.botSaysHi(this.defaultPoem(), castHash)
                        return botSaysHiResponse
                    
                    case 'story':
                        const result = await this.handleStoryFlow(
                            user_fid,
                            castHash,
                            threadHash,
                            user_name,
                            user_cast,
                            mode,
                            coauthors_name
                        );
                        console.log('[DEBUG] Story flow result:', result);
                        return result;
                    
                    default: 
                    try {
                        const defaultprompt = this.prompt.sayhiPrompt.replace('{user_name}', user_name)
                        // console.log('[TEST] defaultprompt', defaultprompt)
                        
                        const botreply = await this.botThinking.callGaiaDefault(user_cast, defaultprompt)
                        console.log('[TEST] botreply', botreply)

                        return await this.botPosting.botSaysHi(botreply, castHash);
                        // if the botPosting fails, does it try again from the start?
                    } catch (error) {
                        console.error('Error in default case', error)
                        return await this.botPosting.botSaysHi("nothing working. come back later plz. @kbc error here", castHash)
                    }
                }

        } 

        
        if (event.type === 'cast.created' && 
            event.data.parent_author?.fid == 913741 && // replies to bot
            event.data.author?.fid != 913741 &&// not the bot's own cast (so the bot should reply to replies to it, but not reply to itself)
            (event.data.mentioned_profiles_ranges.length === 0)
            ) { 
                try {
                    console.log('[LOG WBH]: Level 3: single player mode')
                    console.log('[LOG WBH] : ', 'reply from ', event.data.author?.username, 'detected, casting ', event.data.text)
                    console.log('[LOG WBH] : ', 'reply from ', event.data.author?.username, ' mentioned profiles ', event.data.mentioned_profiles)
                    const user_fid = event.data.author?.fid;
                    const castHash = event.data.hash;
                    const user_name = event.data.author?.username;
                    const user_cast = event.data.text
                    const mentioned_profiles = event.data.mentioned_profiles
                    const mode = 'singleplayer'
                    const threadHash = event.data.thread_hash
                    const coauthors_name: string[] = []

                    // check text if it mentions register/ Story protocol or if another person has been mentioned. 
                    // const conversation = this.storyState.conversations.get(user_fid);
                    // get current conversation to check if parent hash already set
                    // const currentConversation = this.storyState.conversations.get(user_fid);

                    // if (!mentioned_profiles) {
                    //     this.storyState.jumpintoConveration(user_fid, castHash, {
                    //         stage: 'singleplayer',
                    //         hash: castHash,
                    //         parent_hash: currentConversation?.parent_hash || castHash,
                    //         username: user_name,
                    //         usercast: user_cast,
                    //         lastAttempt: new Date()
                    //     });
                    // }
                    
                    // Continue the story flow with the reply
                    const result = await this.handleStoryFlow(
                        user_fid,
                        castHash,
                        threadHash,
                        user_name,
                        user_cast,
                        mode,
                        coauthors_name
                    );

                    console.log('[DEBUG] Story flow result from reply:', result);
                    return result;
                     
                } catch (error) {
                    console.error('[ERROR] handling reply:', error);
                    return await this.botPosting.botSaysHi("nothing working. come back later plz. @kbc error here", event.data.hash)
                }
            }

        // level 4: multiplayer mode
        if (event.type === 'cast.created' &&
            event.data.parent_author?.fid == 913741 && // bot is the parent fid
            event.data.mentioned_profiles?.length > 0 
        ) { 
            try {
                console.log('[LOG WBH]: Level 4: multi player mode')
                console.log('[TEST] parent hash', event.data.parent_hash)
                console.log('[TEST] parent hash', event.data.parent_hash)
                console.log('[TEST] thread hash', event.data.thread_hash)
                // bot replies with summary of story + instructions for new co-author. 
                console.log('[LOG WBH] : ', 'user1 ', event.data.author?.username, ' tagged ', event.data.mentioned_profiles)

                const coauthors_name = event.data.mentioned_profiles.map(profile => profile.username)
                const user_fid = event.data.author?.fid;
                const castHash = event.data.hash;
                const threadHash = event.data.thread_hash
                const user_name = event.data.author?.username;
                const user_cast = event.data.text
                const currentConversation = this.storyState.conversations.get(user_fid);
                const mode = 'multiplayer'
                console.log('[LOG WBH] : ', 'coauthors_name', coauthors_name)

                if(coauthors_name) {
                    this.storyState.jumpintoConveration(user_fid, castHash, {
                        stage: 'multiplayer',
                        hash: castHash,
                        parent_hash: currentConversation?.parent_hash || castHash,
                        username: user_name,
                        usercast: user_cast,
                        lastAttempt: new Date()
                    });
                }

                // Continue the story flow with the reply
                const result = await this.handleStoryFlow(
                    user_fid,
                    castHash,
                    threadHash,
                    user_name,
                    user_cast,
                    mode,
                    coauthors_name
                );

                console.log('[DEBUG] Story flow result from reply:', result);
                return result;

            } catch (error) {
                console.error('[ERROR] handling mentioned:',error );
                return await this.botPosting.botSaysHi("nothing working. come back later plz. @kbc error here", event.data.hash)
            }
            
        }
         else {
            console.log('❌ Not a relevant event', event.type);

            // const botTalking = new BotTalking()
            // const castHash = event.data.hash
            // const botfailurereply = "Return to Claude!"
            // const botSaysHiResponse = await botTalking.botSaysHi(botfailurereply, castHash)
            // return botSaysHiResponse
        }
    
    // After successfully posting a reply, mark the hash as replied
    this.repliedHashes.add(event.data.hash);
    }


    private defaultPoem() {
        return `Wo der Abend unmerklich\n
                wie man so sagt ohne\n
                Umschweife sagst du\n

                in die Nach übergeht\n
                Ist meine Zeit\n
                Ist mein Ort. Dort\n

                lebe ich einsam bei mir\n
                sage ich und du sagst:\n
                ich bin auch noch da.\n

                - Steffen Jacobs, Sprechstück`;
            }

    private storyPhase1() {
        return `
        Ley's play. This is our playground: \n
        - team of 4 (not yet implemented) \n
        - no ownership of ideas \n
        - everything is in flux until it's on Story Protocol. \n

        Step 1: Foundation \n
        @kbc believes unconscious ideas are embedded in writing. With all the data you put out, this is scary but serves us well now. Give me a 42 seconds to "get you". Use that time to "get me".
        `
    }


}  // Close listenBot class

