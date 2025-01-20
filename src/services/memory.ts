import { Cast, ChromaMetadataType } from './types';  // Our custom types for Farcaster data
import { client, COLLECTIONS, getEmbedder } from '../database/client';
import { IEmbeddingFunction } from 'chromadb';

export class MemoryService {
    private longTermCollection: any;
    private shortTermCollection: any;
    private embedder: IEmbeddingFunction | undefined;

    // initialize collections
    async initializeCollections(embeddingChoice: 'chroma' | 'gaia' = 'chroma') {
        try {
            this.embedder = getEmbedder(embeddingChoice) as IEmbeddingFunction;
            console.log(`Using ${embeddingChoice} embedder`);

            this.longTermCollection = await client.getOrCreateCollection({
                name: COLLECTIONS.LONG_TERM,
                embeddingFunction: this.embedder,
                metadata: { description: "users long term memory" }
            });
            console.log('Long term collection initialized');

            this.shortTermCollection = await client.getOrCreateCollection({
                name: COLLECTIONS.SHORT_TERM,
                embeddingFunction: this.embedder,
                metadata: { description: "users short term memory" }
            });
            console.log('Short term collection initialized');

            return {
                longTermCollection: this.longTermCollection,
                shortTermCollection: this.shortTermCollection
            };
        } catch (error: unknown) {
            console.error('Failed to initialize collections:', (error as Error).message);
            throw error;
        }
    }

    // Add getter methods to access collections with proper embedder
    async getLongTermCollection(): Promise< any > {
        if (!this.longTermCollection) {
            throw new Error('Long term collection not initialized');
        }
        return this.longTermCollection;
    }

    async getShortTermCollection(): Promise< any > {
        if (!this.shortTermCollection) {
            throw new Error('Short term collection not initialized');
        }
        return this.shortTermCollection;
    }

    /** Core function to process casts and generate their embeddings */

    async processLongTermMemory(casts: Cast[]) {
        try {
            // process in smaller batches
            const BATCH_SIZE = 10;
            for (let i = 0; i < casts.length; i += BATCH_SIZE) {
                const batch = casts.slice(i, i + BATCH_SIZE);
                console.log(`Processing batch ${i/BATCH_SIZE + 1} of ${Math.ceil(casts.length/BATCH_SIZE)}`);
            
                await this.longTermCollection.add({
                    ids: batch.map(cast => cast.hash), 
                    documents: batch.map(cast => cast.text),
                    metadatas: batch.map(cast => ({
                        timestamp: cast.timestamp,
                        author: cast.author.username,
                        hash: cast.hash,
                        // type: 'feed'
                }))
                // documents: casts.map(cast => cast.text),
            });
            console.log('processing long term memory...')

            //add a delay between batches
            await new Promise(resolve => setTimeout(resolve, 1000));
            } 
            return this.longTermCollection;
        } catch (error) {
                console.error('failed processing long term memory:', error);
                throw error;
            }
        }

    async processShortTermMemory(casts: Cast[]): Promise<void> {
        try { 
            // process in smaller batches
            const BATCH_SIZE = 1;
            for (let i = 0; i < casts.length; i += BATCH_SIZE) {
                const batch = casts.slice(i, i + BATCH_SIZE);
                console.log('number of casts: ', casts.length)
                console.log(`Processing batch ${i/BATCH_SIZE + 1} of ${Math.ceil(casts.length/BATCH_SIZE)}`)

                // check for duplicates
                const duplicateCheck = await this.shortTermCollection.get({
                    ids: batch.map(cast => cast.hash),
                    include: ['metadatas', 'documents']
                });
                console.log('duplicate check: ', duplicateCheck)

                if (duplicateCheck.ids.length > 0) {
                    console.log('Found duplicates: ', {
                        hashes: duplicateCheck.metadatas.map((m: ChromaMetadataType) => m.hash),
                        entries: duplicateCheck
                    });
                }
                console.log('found ', duplicateCheck.ids.length, ' duplicates')

                // Filter out duplicates
                const newCasts = batch.filter(cast =>
                    !duplicateCheck.metadatas.some((m: ChromaMetadataType) => m.hash === cast.hash)
                );
                console.log('filtered out duplicated casts done')

                // add new casts to collection
                if (newCasts.length > 0) {
                    await this.shortTermCollection.add({
                        ids: batch.map(cast => cast.hash),
                        documents: batch.map(cast => cast.text),
                        metadatas: batch.map(cast => ({
                            timestamp: cast.timestamp,
                            author: cast.author.username,
                            hash: cast.hash,
                            type: 'like',
                            similarity: 0,
                            similarity_category: 'outerSpace'
                        })),
                    })
                }
            console.log('processing short term memory...')
            // console.log('processing cast id with text', casts[0].hash, casts[0].text) // this doesnt' work. it always returns the first casts

            // delay
            await new Promise(resolve => setTimeout(resolve, 1000));
                }
        return this.shortTermCollection;

            
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