import axios from 'axios';
import { EmbeddingFunction } from '../services/types';

export class gaiaEmbeddingFunction implements EmbeddingFunction {
    private readonly baseUrl: string = 'https://llama8b.gaia.domains/v1';
    private readonly model: string = 'nomic-embed-text-v1.5';

    constructor() {
        // No need for constructor parameters since Gaia node is public
    }

    async generate(texts: string[]): Promise<number[][]> {
        try {
            const response = await axios.post(`${this.baseUrl}/embeddings`, {
                input: texts,
                model: this.model
            });

            // Check if we got a valid response
            if (!response.data?.data) {
                throw new Error('Unexpected API response format');
            }

            // Extract embeddings from response
            return response.data.data.map((item: any) => item.embedding);

        } catch (error) {
            if (axios.isAxiosError(error)) {
                console.error('API Error Details:', error.response?.data);
                throw new Error(`Failed to generate embeddings: ${error.message}`);
            }
            throw error;
        }
    }
}
