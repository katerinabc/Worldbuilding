import axios from 'axios';
import { EmbeddingFunction } from '../services/types';

export class GaiaEmbeddingFunction implements EmbeddingFunction {
    private readonly baseUrl: string = 'https://llama8b.gaia.domains/v1';
    // private readonly model: string = 'nomic-embed-text-v1.5.f16';
    private readonly model: string = 'nomic-embed';
    private readonly maxBatchSize: number = 1;  // Reduce batch size
    private readonly timeout: number = 30000;    // 30 second timeout

    constructor() {
        // No need for constructor parameters since Gaia node is public
    }

    async generate(texts: string[]): Promise<number[][]> {
        try {
            // Process in smaller batches
            const results: number[][] = [];
            for (let i = 0; i < texts.length; i += this.maxBatchSize) {
                const batch = texts.slice(i, i + this.maxBatchSize);
                console.log(`Processing batch ${i/this.maxBatchSize + 1} of ${Math.ceil(texts.length/this.maxBatchSize)}`);

                console.log('text that is being procesed: ', batch);
                
                const response = await axios.post(
                    `${this.baseUrl}/embeddings`,
                    {
                        model: this.model,
                        input: batch
                    },
                    {
                        headers: {
                            'accept': 'application/json',
                            'Content-type': 'application/json',
                            'Authorization': `Bearer ${process.env.GAIA_API_KEY}`
                        },
                        timeout: this.timeout
                    }
                );

                if (!response.data?.data) {
                    throw new Error('Invalid API response format');
                }

                results.push(...response.data.data.map((item: any) => item.embedding));
                
                // Add delay between batches
                if (i + this.maxBatchSize < texts.length) {
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
            }
            return results;

        } catch (error) {
            console.error('Embedding error:', {
                status: (error as any).response?.status,
                message: (error as any).message
            });
            throw error;
        }
    }
}
