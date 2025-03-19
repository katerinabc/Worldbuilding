import axios from 'axios';
// import { ArticleSection } from './types';
import dotenv from 'dotenv';
import { EMBEDDER_CONFIG } from '../config/embedder';
import { Prompts } from './prompts';

// this calls the chat endpoint from gaia

dotenv.config();

export class BotThinking {

    private readonly baseUrl: string;
    private readonly model: string;
    private readonly longTermCollection: any;
    private readonly shortTermCollection: any;

    constructor() {
        const settings = EMBEDDER_CONFIG.settings.gaia;
        // this.baseUrl = settings.baseUrl;
        this.baseUrl = 'https://llama3b.gaia.domains/v1'; //smaller model
        this.model = 'llama3b';  // Different model for chat

    }

    public async callGaia(castText: string, prompt: string): Promise<string> {
        try {
            const response = await axios.post(
                `${this.baseUrl}/chat/completions`,
                {messages: [
                        {
                            role: 'system',
                            content: prompt
                        },
                        {
                            role: 'user',
                            content: castText
                        }
                    ],
                    model: this.model,
                    temperature: 0.7,
                    top_p: 0.9,
                    presence_penalty: 0.75,
                    frequency_penalty: 0.5,
                },
                {
                    headers: {
                        'accept': 'application/json',
                        'content-type': 'application/json',
                        'Authorization': `Bearer ${process.env.GAIA_API_KEY}`
                    },
                }
            );

            if (!response.data?.choices?.[0]?.message?.content) {
                throw new Error('Invalid API response format');
            }

            return response.data.choices[0].message.content;

        } catch (error) {
            console.error('Error calling gaia', error);
            throw error;
        }
    }

}