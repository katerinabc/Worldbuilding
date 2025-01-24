import axios from 'axios';
import { EmbeddingFunction } from '../services/types';
import { EMBEDDER_CONFIG } from '../config/embedder';

export class GaiaEmbeddingFunction implements EmbeddingFunction {
    private readonly baseUrl: string;
    private readonly model: string;
    private readonly maxBatchSize: number;
    private readonly timeout: number;

    constructor() {
        // Get settings directly from config
        const settings = EMBEDDER_CONFIG.settings.gaia;
        this.baseUrl = settings.baseUrl;
        this.model = settings.model;
        this.maxBatchSize = settings.maxBatchSize;
        this.timeout = settings.timeout;
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
