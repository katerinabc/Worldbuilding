import { EmbeddingVector } from "./types";
import { client, COLLECTIONS, getEmbedder } from "../database/client";
import { MemoryService } from "./memory";
import { AnalyticsDB } from "../database/sqlite3";
import { EMBEDDER_CONFIG } from '../config/embedder';
import { EmbeddingFunction } from './types';

export class SimilarityService {     
     /**
//      * Find casts with different similarity levels
//      * Returns an object with three categories:
//      * - core: highly similar (0.8-1.0)
//      * - related: somewhat similar (0.5-0.7)
//      * - outerSpace: low similarity (0.1-0.4)
//      */

    // configuration files that don't change
    private readonly embedder: EmbeddingFunction | undefined;
    private longTermCollection: any;
    private shortTermCollection: any;
    private analyticsDB: AnalyticsDB;

    // //add this to run the test and prin the results
    // async getShortTermResults() {
    //     return await this.shortTermCollection.get({
    //         include: ["embeddings", "metadatas", "documents"]
    //     });
    // }

    constructor(longTermCollection: any, shortTermCollection: any, analyticsDB: AnalyticsDB) {
        this.longTermCollection = longTermCollection;
        this.shortTermCollection = shortTermCollection;
        this.analyticsDB = analyticsDB;
        this.embedder = getEmbedder();  // Initialize embedder in constructor
        const settings = EMBEDDER_CONFIG.settings.gaia;
    }

    /**
     * Calculate how similar two vectors are
     * Returns a number between -1 and 1:
     * 1 = identical
     * 0 = completely different
     * -1 = opposite
     */
    private cosineSimilarity(a: number[], b: number[]): number {
        const dotProduct = a.reduce((sum, a_i, i) => sum + a_i * b[i], 0);
        const magnitudeA = Math.sqrt(a.reduce((sum, a_i) => sum + a_i * a_i, 0));
        const magnitudeB = Math.sqrt(b.reduce((sum, b_i) => sum + b_i * b_i, 0));
        return dotProduct / (magnitudeA * magnitudeB);
    }

    async updateSimilarityScore(): Promise<void> {
        try {
            //get all items from both collections
            // remember to mention the embedder
            const shortTermItems = await this.shortTermCollection.get({
                include: ["embeddings", "metadatas", "documents"],
                embedding_function: this.embedder
            });
            const longTermItems = await this.longTermCollection.get({
                include: ["embeddings", "metadatas", "documents"],
                embedding_function: this.embedder
                
            });

            // add debug logging
            console.log('Short term items:', shortTermItems);

            if(!shortTermItems || !shortTermItems.embeddings) {
                console.log('no embeddings in short term items');
                return;
            }

            //for each short term item
            for (let i = 0; i < shortTermItems.embeddings.length; i++) {
                console.log('print i:', i)
                const likeEmbedding = shortTermItems.embeddings[i];
                const likeId = shortTermItems.ids[i];
                // console.log('print likeId:', likeId);
                // console.log('print likeEmbedding:', likeEmbedding);

                // find the higest similarity score among feed items
                // this refers to the SimilarityService instance
                let maxSimilarity = 0;
                for (let j = 0; j < longTermItems.embeddings.length; j++) {
                    const feedEmbedding = longTermItems.embeddings[j];
                    const similarity = this.cosineSimilarity(likeEmbedding, feedEmbedding);
                    maxSimilarity = Math.max(maxSimilarity, similarity);
                }

                //Determine category after finding the highest similarity score
                let simCat = '';
                console.log('max similarity score: ', maxSimilarity);
                if (maxSimilarity > 0) {
                    simCat = 'core'
                } else if (maxSimilarity >=0.5) {
                    simCat ='related'
                } else { 
                    simCat ='outerSpace'}
                
                console.log('similarity category: ', simCat);

                //Update sqlite with the higest similarity score
                // sqldb kept just in case. I had issues with updating chromadb, 
                //because I forgot the `s` at the end of metadata. 
                await this.analyticsDB.addAnalysis({
                    hash: likeId,
                    similarity_score: maxSimilarity,
                    similarity_category: simCat,
                    cast_text: shortTermItems.documents[i],
                    author_username: shortTermItems.metadatas[i].author,
                    // timestamp: shortTermItems.metadatas[i].timestamp
                })
                console.log('similarity score added to sqlite')

                // updat chromadb metadata
                await this.shortTermCollection.upsert({
                    ids:[likeId],
                    documents: [shortTermItems.documents[i]],
                    embeddings: [likeEmbedding],
                    metadatas:[{
                        similarity: maxSimilarity,
                        similarity_category: simCat
                    }]
                })
                console.log('chromadb metadata updated')
            }
        } catch (error) { 
            console.error('error updating similarity score:', error);
            throw error;
        }
    }
} 