import axios from 'axios';
import { MemoryService } from './memory';
import fs from 'fs/promises';

interface ArticleSection {
    title: string;
    content: string[];
    similarity: 'core' | 'related' | 'outerSpace';
}

export class ArticleGenerator {
    private readonly baseUrl: string = 'https://llama8b.gaia.domains/v1';
    private readonly memoryService: MemoryService;

    constructor() {
        this.memoryService = new MemoryService();
    }

    /**
     * Generate an article based on user's memories
     */
    async generateArticle(): Promise<string> {
        // 1. Get similarities from memory
        const similarities = await this.memoryService.findSimilarCastsByCategory();

        // 2. Get user's writing style examples from long-term memory. 
        // for testing limited to 5 posts.
        const userPosts = await this.memoryService.getLongTermMemoryPosts(3); // Reduce from 5 to 3
        const styleExamples = userPosts
            .map(post => post.text)
            .slice(0, 3)  // Take only first 3 examples
            .join('\n\n');

        // 3. Prepare sections
        const sections: ArticleSection[] = [
            {
                title: "Core Interests",
                content: similarities.core
                    .slice(0, 5)  // Take only top 5
                    .map(s => `${s.like.text} (Similarity: ${(s.similarity * 100).toFixed(1)}%)`),
                similarity: 'core'
            },
            {
                title: "Related Topics",
                content: similarities.related
                    .slice(0, 3)  // Take only top 3
                    .map(s => `${s.like.text} (Similarity: ${(s.similarity * 100).toFixed(1)}%)`),
                similarity: 'related'
            },
            {
                title: "Outer Space",
                content: similarities.outerSpace
                    .slice(0, 2)  // Take only top 2
                    .map(s => `${s.like.text} (Similarity: ${(s.similarity * 100).toFixed(1)}%)`),
                similarity: 'outerSpace'
            }
        ];

        // 4. Create prompt
        const prompt = this.createPrompt(sections);

        // 5. Generate article using Gaia.node
        try {
            console.log('Making request to Gaia API with payload:', {
                messages: [
                    {
                        role: "system",
                        content: `You are crafting a newsletter-style article using the user's personal writing style. Here are examples of the user's writing:\n\n${styleExamples}\n\nEmulate this writing style. Connect different topics in ways that feel natural to the user's voice. You audience are friends and acquaitances. You are writing to clarify your thinking not to sell a product. Your goal is to showcase your knowledge and thought about topics.`
                    },
                    {
                        role: "user",
                        content: prompt
                    }
                ],
                model: "llama",
                temperature: 0.7,
                max_tokens: 1000
            });

            const response = await axios.post(`${this.baseUrl}/chat/completions`, {
                messages: [
                    {
                        role: "system",
                        content: `You are crafting a newsletter-style article using the user's personal writing style. Here are examples of the user's writing:\n\n${styleExamples}\n\nEmulate this writing style. Connect different topics in ways that feel natural to the user's voice. You audience are friends and acquaitances. You are writing to clarify your thinking not to sell a product. Your goal is to showcase your knowledge and thought about topics.`
                    },
                    {
                        role: "user",
                        content: prompt
                    }
                ],
                model: "llama",
                temperature: 0.7,
                max_tokens: 1000
            });

            const articleContent = response.data.choices[0].message.content;

            // Add this new code to save the article
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const filename = `articles/article-${timestamp}.txt`;
            
            // Create articles directory if it doesn't exist
            await fs.mkdir('articles', { recursive: true });
            
            // Save the article
            await fs.writeFile(filename, articleContent, 'utf-8');
            console.log(`Article saved to ${filename}`);

            return articleContent;

        } catch (error) {
            if (axios.isAxiosError(error)) {
                console.error('Detailed error information:');
                console.error('Status:', error.response?.status);
                console.error('Status Text:', error.response?.statusText);
                console.error('Response Data:', error.response?.data);
                console.error('Request URL:', error.config?.url);
                console.error('Request Method:', error.config?.method);
                console.error('Request Headers:', error.config?.headers);
            }
            throw new Error(`Failed to generate article: ${error}`);
        }
    }

    /**
     * Create a prompt for the LLM based on the sections
     */
    private createPrompt(sections: ArticleSection[]): string {
        return `
Write a blog-style article that analyzes and connects the following content:

${sections.map(section => `
# ${section.title}
${section.content.join('\n')}
`).join('\n')}

Guidelines:
1. Start with a personalized introduction. Use your knowledge of the user.
2. For Core Interests, dive deep into the main themes. Use content from the users digital twin to enhance this section
3. For Related Topics, show how they connect to the core interests
4. For Outer Space, no need to find creative ways to connect these seemingly unrelated topics. Add one sentence why they are an outer-space topic. 
5. End with asking the reader to collect this article. This should be the last sentence in the article. nothing comes after it.

Write the article as if you are the narrator of the user's life. Imagine you live in the users head and are sorting through the casts, filing them in different sections based on their content.
for every cast that you file in a section you make a commment why it belongs in this section. 
Make the article sound like a monologue. 

Remember that these casts are written by other people than the user. The user only liked or recasted them.

Do not worry about clear formatting and engaging headings.
Do not use any emojis.
The article should be more than 750 words andless than 3000 words. 
`;
    }
} 