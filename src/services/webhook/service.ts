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

    private async handleStoryFlow(fid: number, hash: string, username: string, user_cast: string): Promise<StoryFlowResult> {
        const conversation = this.storyState.conversations.get(fid);

        if (!conversation) {
            // New story conversation
            this.storyState.startNewConversation(fid, hash, username, user_cast);
        }

        const currentStage = conversation ? conversation.stage : 1;

        // handle existing conversation
        if (currentStage === 1) {
                try {

                // stage 1: hard coded intro
                // const storystart = prompt.worldbuildingPrompt1.replace('{user_name}', user_name)
                // console.log('[TEST STORY PHASE 1', storystart)

                // const botreply = await botThinking.callGaiaDefault(user_cast, storystart)
                // console.log('[TEST] STORY PHASE 1', botreply)
                const botStoryPhase1 = await this.botPosting.botSaysHi(this.storyPhase1(), hash)
                
                // update the stage we are in with the user
                this.storyState.updateConversation(fid,{
                    stage: 2,
                    hash: botStoryPhase1,
                    usercast: this.storyPhase1(),
                    lastAttempt: new Date()
                });

                // Verify the update
                const updatedConversation = this.storyState.conversations.get(fid);
                console.log('[DEBUG] Conversation state after update:', updatedConversation);

                // Continue to stage 2 immediately
                return await this.handleStoryFlow(fid, botStoryPhase1, username, this.storyPhase1());
                
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
        }
        
        // story initialization stage
        if (currentStage === 2) {
            try {
                // get casts from user
                const userFeed = new FetchUserCasts(fid);
                const userCasts = await userFeed.getUserCasts(10);
                

                // give feed to botthinking
                const worldBuildingPrompt = this.prompt.worldbuilding_adjectives(userCasts)

                // get the adjectives via gaianet
                const adjectives = await this.botThinking.callGaiaAdjectives(
                    this.prompt.worldbuilding_system_prompt, 
                    worldBuildingPrompt);
                console.log('[TEST] adjectives', adjectives)
                
                // reply with adjectives
                const botReply = await this.botPosting.botSaysHi(adjectives, hash)

                // update state (hash) but stay in stage 2
                this.storyState.updateConversation(fid,{
                    stage: 2,  // Stay in stage 2
                    hash: botReply,
                    usercast: adjectives,
                    lastAttempt: new Date()
                });
                return {
                    success: true,
                    stage: 2,
                    message: 'waiting for user reply',
                    hash: hash // we keep the hash the same until the user replies
                } 

            } catch (error) {
                console.error('[ERROR] in stage 2:', error);
                return {
                    success: false, 
                    stage: 2,
                    message: 'error in stage 2',
                    hash: null,
                    error: error instanceof Error ? error.message : 'unknown error'
                }
            }
        }    
        // single player mode
        // user and bot make a story together. Ends with new webhook for adding new coauthors.
        // no limit to coauthors right now.              
        if (currentStage === 3) {
            try {
                // get reply to previous cast
                // const replyCast = await replytoBot.getReplytoBot()

                // if (!replyCast) {
                //     // No reply yet, stay in stage 3
                //     return {
                //         success: true,
                //         stage: 3,
                //         message: 'waiting for user reply',
                //         hash: hash
                //     }
                // }
                // console.log('[TEST] Getting the hash to the bot s cast the user replied to', replyCast.cast.hash, replyCast.cast.text)
                console.log('[LOG stage 3] user cast:', user_cast)
                console.log('[LOG stage 3] user hash:', hash)

                // get the thread summary
                const replytoBot = new FetchReply(hash)
                const threadSummaryText = await replytoBot.getThreadSummary()
                console.log('[LOG stage 3] Getting the thread summary', threadSummaryText)
                console.log('[LOG stage 3] Thread summary type:', typeof threadSummaryText)
                console.log('[LOG stage 3] Is thread summary an array?', Array.isArray(threadSummaryText))
                console.log('[LOG stage 3] Thread summary length:', threadSummaryText?.length)

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

                // post the reply. 
                const botReply = await this.botPosting.botSaysHi(botStory, hash)

                // update state (hash)
                this.storyState.updateConversation(fid,{
                    stage: 4,
                    hash: hash,
                    usercast: botStory,
                    lastAttempt: new Date()
                });

                // get reply and check for coauthors
                const userReply = new FetchReply(hash)
                const userReplyCast = await userReply.getReplytoBot()
                const coauthors = userReplyCast.mentioned_fids

                const webhookManager = new WebhookManager();
                await webhookManager.coauthorsWebhook(fid, hash, coauthors)

                this.storyState.updateConversation(fid, {
                    coauthorFid: coauthors
                });

                return {
                    success: true,
                    stage: 4,
                    message: 'bot replied to user with story',
                    hash: hash
                } 

            } catch (error) {
                console.error('[ERROR] in stage 3:', error);
                return {
                    success: false,
                    stage: 3,
                    message: 'error waiting for user reply',
                    hash: null,
                    error: error instanceof Error ? error.message : 'unknown error'
                }
            }
        }
        
        // multiplayer mode
        if (currentStage === 4) {
            try {

                // bot replies with summary of story + instructions for new coauthor

            } catch (error) {
                console.error('[ERROR] in stage 4:', error);
                return {
                    success: false,
                    stage: 4,
                    message: 'error in stage 4',
                    hash: null,
                    error: error instanceof Error ? error.message : 'unknown error'
                }
            }
        }

        
    // Fallback for unknown stages
    return {
        success: false,
        stage: currentStage,
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

        const conversation = this.storyState.conversations.get(event.data.author?.fid)
        const coAuthors = conversation?.coauthorFid
        console.log('[LOG WBH coauthors] : ', coAuthors)

        // this will only work if ongoing conversation. not if time has passed
        const parent_hash = conversation?.parent_hash
        console.log('[LOG WBH parent hash from conversation] : ', parent_hash)

         // Check if we've already replied to this hash
         if (this.repliedHashes.has(event.data.hash)) {
            console.log('Already replied to hash:', event.data.hash);
            return;
        }

        // level 1: The bot is mentioned in a cast for the first time.
        // TODO: add limit that mentioned_profiles can only be lenght = 1?
        if (event.type === 'cast.created' && 
            event.data.mentioned_profiles?.some(profile => profile.fid == 913741) &&
            event.data.author.fid != 913741 &&
            event.data.parent_author?.fid != 913741
            ) {
                const stage = this.parseConversationStage(event.data.text);
                const castHash = event.data.hash;
                const user_name = event.data.author?.username;
                const user_fid = event.data.author?.fid;
                const user_cast = event.data.text


                switch (stage) {
                    case 'show_yourself':
                        const botSaysHiResponse = await this.botPosting.botSaysHi(this.defaultPoem(), castHash)
                        return botSaysHiResponse
                    
                    case 'story':
                        const result = await this.handleStoryFlow(
                            user_fid,
                            castHash,
                            user_name,
                            user_cast
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

        // level 3: conversation with the bot
        // limit to single player mode??
        if (event.type === 'cast.created' && 
            event.data.parent_author?.fid == 913741 && // replies to bot
            event.data.author?.fid != 913741 // not the bot's own cast (so the bot should reply to replies to it, but not reply to itself)
            ) { 
                try {
                    console.log('[LOG WBH] : ', 'reply from ', event.data.author?.username, 'detected, casting ', event.data.text)
                    console.log('[LOG WBH] : ', 'reply from ', event.data.author?.username, ' mentioned profiles ', event.data.mentioned_profiles)
                    const user_fid = event.data.author?.fid;
                    const castHash = event.data.hash;
                    const user_name = event.data.author?.username;
                    const user_cast = event.data.text
                    const mentioned_profiles = event.data.mentioned_profiles
                    
                    // check text if it mentions register/ Story protocol or if another person has been mentioned. 
                    // const conversation = this.storyState.conversations.get(user_fid);
                    // get current conversation to check if parent hash already set
                    const currentConversation = this.storyState.conversations.get(user_fid);

                    if (!mentioned_profiles) {
                        this.storyState.jumpintoConveration(user_fid, castHash, {
                            stage: 3,
                            hash: castHash,
                            parent_hash: currentConversation?.parent_hash || castHash,
                            username: user_name,
                            usercast: user_cast,
                            lastAttempt: new Date()
                        });
                    
                    // Continue the story flow with the reply
                    const result = await this.handleStoryFlow(
                        user_fid,
                        castHash,
                        user_name,
                        user_cast
                    );

                    console.log('[DEBUG] Story flow result from reply:', result);
                    return result;
                     }
                } catch (error) {
                    console.error('[ERROR] handling reply:', error);
                    return await this.botPosting.botSaysHi("nothing working. come back later plz. @kbc error here", event.data.hash)
                }
            }

        // level 4: multiplayer mode???
        if (event.type === 'cast.created' &&
            event.data.parent_author?.fid == 913741 && // bot is the parent fid
            event.data.mentioned_profiles?.some(profile => coAuthors?.includes(profile.fid))
        ) { 
            try {
                console.log('[TEST] parent hash', event.data.parent_hash)
                console.log('[TEST] parent hash', parent_hash)
                console.log('[TEST] thread hash', event.data.thread_hash)
                // bot replies with summary of story + instructions for new co-author. 
                console.log('[LOG WBH] : ', 'user1 ', event.data.author?.username, ' tagged ', event.data.mentioned_profiles)

                const coauthors_name = event.data.mentioned_profiles.map(profile => profile.username)
                console.log('[LOG WBH] : ', 'coauthors_name', coauthors_name)

                let storySummaryText: Cast[] = [];
                if (parent_hash){
                    // summary of thread starting with initial parent hash (as much as possible)
                    const storySummary = new FetchReply(parent_hash)
                    const storySummaryText = await storySummary.getThreadSummary(5)
                    console.log('[LOG WBH] : ', 'thread summary', storySummaryText)
                }

                // summary of more current thread (thread summary with reply depth 2 or 3)
                const threadSummary = new FetchReply(event.data.thread_hash)
                const threadSummaryText = await threadSummary.getThreadSummary(5)
                console.log('[LOG WBH] : ', 'thread summary', threadSummaryText)

                // bot replies with summary of story + instructions for new co-author
                const worlbuildingMPPrompt = this.prompt.worldbuilding_multiplayer_storysummary(
                    storySummaryText, threadSummaryText, coauthors_name)
                const botStory = await this.botThinking.callGaiaStorywriting(
                    this.prompt.worldbuilding_system_prompt,
                    worlbuildingMPPrompt)

                const botReply = await this.botPosting.botSaysHi(botStory, event.data.hash)
                console.log('[LOG WBH] : ', 'bot reply', botReply)
                return botReply

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
        return `Ley's play. This is our playground: \n
        - team of 4 (not yet implemented) \n
        - no ownership of ideas \n
        - everything is in flux until it's on Story Protocol. \n

        Step 1: Foundation \n
        @kbc believes unconscious ideas are embedded in writing. With all the data you put out, this is scary but serves us well now. Give me a 42 seconds to "get you". Use that time to "get me".
        `
    }


}  // Close listenBot class

