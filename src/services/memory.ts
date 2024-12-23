import { Cast } from './types';  // Our custom types for Farcaster data
import { client, COLLECTIONS, embedder } from '../database/client';


export class MemoryService {
    private longTermCollection: any;
    private shortTermCollection: any;

    // initialize collections
    async initializeCollections() {

        try {
            // await client.deleteCollection(this.longTermCollection);
            // console.log('long term collection deleted')
            this.longTermCollection = await client.getOrCreateCollection({
                name: COLLECTIONS.LONG_TERM,
                embeddingFunction: embedder,
                metadata: {description: "users long term memory"}
            });
            
            console.log('long term collection created or gotten')
            
        } catch (error) { 
            console.error('failed to create or get collection: ', error);
            throw error;
            // // if collection does not exist create it
            // console.log('creating new long-term collection...');
            // this.longTermCollection = await client.createCollection({
            //     name: COLLECTIONS.LONG_TERM,
            //     embeddingFunction: embedder,
            //     metadata: {description: "users long term memory"}
            // });
        };
        try {
            this.shortTermCollection = await client.getOrCreateCollection({
                name: COLLECTIONS.SHORT_TERM,
                embeddingFunction: embedder,
                metadata: {description: "users short term memory"}
            });
            console.log('short term collection created or gotten')
            

        } catch (error) {
            console.error('failed to create or get collection: ', error);
            throw error;
            // //if collection does not exist create it
            // console.log('creating new short-term collection...');
            // this.shortTermCollection = await client.createCollection({
            //     name: COLLECTIONS.SHORT_TERM,
            //     embeddingFunction: embedder,
            //     metadata: {description: "users short term memory"}
            // });
        }
            return { 
                longTermCollection: this.longTermCollection, 
                shortTermCollection: this.shortTermCollection 
            }; 
        } 

    /** Core function to process casts and generate their embeddings */

    async processLongTermMemory(casts: Cast[]): Promise<void> {
        try {
            console.log('processing long term memory...')
            await this.longTermCollection.add({
                ids: casts.map(cast => cast.hash), 
                metadatas: casts.map(cast => ({
                    timestamp: cast.timestamp,
                    author: cast.author.username,
                    hash: cast.hash,
                    type: 'feed'
            })),
            documents: casts.map(cast => cast.text),
        });
        } catch (error) {
            console.error('failed processing long term memory:', error);
            throw error;
        }
    }

    async processShortTermMemory(casts: Cast[]): Promise<void> {
        try { //i'm pretty sure the metadata isn't stored properly
            console.log('processing short term memory...')
            await this.shortTermCollection.upsert({
                ids: casts.map(cast => cast.hash),
                metadatas: casts.map(cast => ({
                    timestamp: cast.timestamp,
                    author: cast.author.username,
                    hash: cast.hash,
                    type: 'like',
                    similarity: 0, // initial similarity score
                    similarity_category: 'outerSpace' // initial category
                })),
                documents: casts.map(cast => cast.text),
            });
        } catch (error) {
            console.error('failed processing short term memory:', error);
            throw error;
        }
    }

    async peekShortTermMemory(): Promise<any> {
        return await this.shortTermCollection.peek();
    }

    async peekLongTermMemory(): Promise<any> {
        return await this.longTermCollection.peek();
    }
}