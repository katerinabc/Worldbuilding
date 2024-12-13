import axios from 'axios';  // For making HTTP requests
import { Cast } from './types';  // Our custom types for Farcaster data
import { EmbeddingVector, Memory } from './types';
import fs from 'fs';  // For reading/writing files


export class MemoryService {
    // Configuration values that don't change
    private readonly baseUrl: string = 'https://llama8b.gaia.domains/v1';  // API endpoint
    private readonly model: string = 'nomic-embed-text-v1.5';              // Model to use
    private readonly longTermFile: string = 'long_term_memory.json';       // Where to store user's own casts
    private readonly shortTermFile: string = 'short_term_memory.json';     // Where to store liked casts

    /**
     * Convert a piece of text into its mathematical representation (embedding)
     * This is like translating text into numbers that capture its meaning
     */
    private async getEmbedding(text: string): Promise<number[]> {
        try {
            // Send text to the API to get its embedding
            const response = await axios.post(`${this.baseUrl}/embeddings`, {
                input: text,
                model: this.model
            });

            // Make sure we got a valid response
            if (!response.data?.data?.[0]?.embedding) {
                console.error('Unexpected response:', response.data);
                throw new Error('Unexpected API response format');
            }

            return response.data.data[0].embedding;
        } catch (error) {
            if (axios.isAxiosError(error)) {
                console.error('API Error Details:', error.response?.data);
                throw new Error(`Failed to generate embedding: ${error.message}`);
            }
            throw error;
        }
    }

    /**
     * Read memory from a JSON file
     * If file doesn't exist, create an empty memory structure
     */
    private async loadMemory(filename: string): Promise<Memory> {
        try {
            if (!fs.existsSync(filename)) {
                return { vectors: [], lastUpdated: new Date().toISOString() };
            }
            const data = await fs.promises.readFile(filename, 'utf-8');
            return JSON.parse(data);
        } catch (error) {
            throw new Error(`Failed to load memory from ${filename}: ${error}`);
        }
    }

    /**
     * Save memory to a JSON file
     * This is like saving your work to a file
     */
    private async saveMemory(memory: Memory, filename: string): Promise<void> {
        try {
            await fs.promises.writeFile(
                filename,
                JSON.stringify(memory, null, 2)  // The '2' makes the file readable by humans
            );
        } catch (error) {
            throw new Error(`Failed to save memory to ${filename}: ${error}`);
        }
    }

    /**
     * Process user's own casts (their feed) as long-term memory
     * This represents the user's writing style and interests
     */
    async processLongTermMemory(casts: Cast[]): Promise<void> {
        console.log('Processing long-term memory...');
        const memory = await this.loadMemory(this.longTermFile);
        await this.processCasts(casts, memory, 'feed', this.longTermFile);
    }

    /**
     * Process casts that the user liked as short-term memory
     * This represents what the user is currently interested in
     */
    async processShortTermMemory(casts: Cast[]): Promise<void> {
        console.log('Processing short-term memory...');
        const memory = await this.loadMemory(this.shortTermFile);
        await this.processCasts(casts, memory, 'like', this.shortTermFile);
    }

    /**
     * Core function to process casts and generate their embeddings
     * This is where we actually create the mathematical representations
     */
    private async processCasts(
        casts: Cast[],           // The casts to process
        memory: Memory,          // Where to store them
        type: 'feed' | 'like',   // What kind of casts these are
        filename: string         // Where to save the results
    ): Promise<void> {
        try {
            console.log(`Processing ${casts.length} casts for ${type} memory...`);
            
            for (const cast of casts) {
                // Skip if we've already processed this cast
                if (memory.vectors.some(v => v.metadata.hash === cast.hash)) {
                    console.log(`Skip existing cast: ${cast.hash}`);
                    continue;
                }

                // Generate embedding and store all the information
                const vector = await this.getEmbedding(cast.text);
                memory.vectors.push({
                    text: cast.text,
                    vector: vector,
                    metadata: {
                        timestamp: cast.timestamp,
                        author: cast.author.username,
                        hash: cast.hash,
                        type: type
                    }
                });
                console.log(`Processed cast: ${cast.hash}`);
            }

            memory.lastUpdated = new Date().toISOString();
            await this.saveMemory(memory, filename);
            console.log(`${type} memory saved successfully`);

        } catch (error) {
            if (error instanceof Error) {
                throw new Error(`Failed to process ${type} memory: ${error.message}`);
            }
            throw error;
        }
    }

    /**
     * Find casts with different similarity levels
     * Returns an object with three categories:
     * - core: highly similar (0.8-1.0)
     * - related: somewhat similar (0.5-0.7)
     * - outerSpace: low similarity (0.1-0.4)
     */
    async findSimilarCastsByCategory(): Promise<{
        core: Array<{like: EmbeddingVector, feed: EmbeddingVector, similarity: number}>;
        related: Array<{like: EmbeddingVector, feed: EmbeddingVector, similarity: number}>;
        outerSpace: Array<{like: EmbeddingVector, feed: EmbeddingVector, similarity: number}>;
    }> {
        const longTerm = await this.loadMemory(this.longTermFile);
        const shortTerm = await this.loadMemory(this.shortTermFile);
        
        const results = {
            core: [] as Array<{like: EmbeddingVector, feed: EmbeddingVector, similarity: number}>,
            related: [] as Array<{like: EmbeddingVector, feed: EmbeddingVector, similarity: number}>,
            outerSpace: [] as Array<{like: EmbeddingVector, feed: EmbeddingVector, similarity: number}>
        };

        // Compare each liked cast with each feed cast
        for (const like of shortTerm.vectors) {
            for (const feed of longTerm.vectors) {
                const similarity = this.cosineSimilarity(like.vector, feed.vector);
                const match = { like, feed, similarity };

                // Categorize based on similarity score
                if (similarity >= 0.8) {
                    results.core.push(match);
                } else if (similarity >= 0.5) {
                    results.related.push(match);
                } else if (similarity >= 0.1) {
                    results.outerSpace.push(match);
                }
            }
        }

        // Sort each category by similarity (highest first)
        results.core.sort((a, b) => b.similarity - a.similarity);
        results.related.sort((a, b) => b.similarity - a.similarity);
        results.outerSpace.sort((a, b) => b.similarity - a.similarity);

        return results;
    }

    // Keep the original function for backward compatibility
    async findSimilarCasts(threshold: number = 0.8): Promise<Array<{like: EmbeddingVector, feed: EmbeddingVector, similarity: number}>> {
        const longTerm = await this.loadMemory(this.longTermFile);
        const shortTerm = await this.loadMemory(this.shortTermFile);
        const similarities: Array<{like: EmbeddingVector, feed: EmbeddingVector, similarity: number}> = [];

        for (const like of shortTerm.vectors) {
            for (const feed of longTerm.vectors) {
                const similarity = this.cosineSimilarity(like.vector, feed.vector);
                if (similarity > threshold) {
                    similarities.push({ like, feed, similarity });
                }
            }
        }

        return similarities.sort((a, b) => b.similarity - a.similarity);
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

    /**
     * Get recent posts from the user's long-term memory
     * @param limit Number of recent posts to retrieve
     */
    async getLongTermMemoryPosts(limit: number = 5): Promise<{text: string}[]> {
        const memory = await this.loadMemory(this.longTermFile);
        return memory.vectors
            .filter(v => v.metadata.type === 'feed')
            .sort((a, b) => new Date(b.metadata.timestamp).getTime() - new Date(a.metadata.timestamp).getTime())
            .slice(0, limit)
            .map(v => ({ text: v.text }));
    }
} 