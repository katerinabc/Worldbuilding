import axios from 'axios';

interface ArticleSection { // move this to types and import types
    title: string;
    content: string[];
    similarity: 'core' | 'related' | 'outerSpace';
}

export class ArticleGenerator {
    private readonly baseUrl: string = 'https://llama8b.gaia.domains/v1';
    private readonly longTermCollection: any;
    private readonly shortTermCollection: any;

    // Base prompt template
    private readonly sectionPromptTemplate = `
    Write a blog-style article in the first person singular that analyzes and connects these {section_type} topics:
    {casts}

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
    The article should be more than 500 words andless than 3000 words. 
    `;

    // Define guidelines for each section type
    private readonly guidelinesBySection = {
        core: [
            "1. Dive deep into the main themes",
            "2. Show how these topics connect to each other",
            "3. Write as if you are the narrator of the user's life",
            "4. For each cast, explain why it's a core interest",
            "5. Make it sound like a monologue"
        ],
        related: [
            "1. Show how these topics connect to the core interests",
            "2. Explain why these topics are relevant but not core",
            "3. Keep the narrative flow from the core section",
            "4. Make connections between different related topics",
            "5. Maintain the monologue style"
        ],
        outerSpace: [
            "1. Acknowledge these topics are different from usual interests",
            "2. No need to force connections to other topics",
            "3. Explain what makes each topic intriguing",
            "4. Keep a curious, exploratory tone",
            "5. Stay in the monologue style"
        ]
    }

    constructor(shortTermCollection: any, longTermCollection: any) {
        this.shortTermCollection = shortTermCollection;
        this.longTermCollection = longTermCollection;
    }

    private async getUserContext(): Promise<string> {
       try {
        //get users posts from long-term memory
        const userPosts = await this.longTermCollection.get({
            include:["documents"]
        });
        if (!userPosts || !userPosts.documents) {
            throw new Error('No user posts found');
        }

        // create a context string user's posts
        return `
        Here is background about the user based on their writing:
        ${userPosts.documents.join('\n')}
        
        Use this context to understand the user's interests and writing style.
        Mimic their tone and perspective when writing the article.
        `;

       } catch (error) {
        console.error('Error getting user context:', error);
        throw error;
       }
    }

    private createSectionPrompt(sectionType: 'core' | 'related' | 'outerSpace', casts: string[]): string {
        return this.sectionPromptTemplate
            .replace('{section_type}', sectionType)
            .replace('{casts}', casts.join('\n'))
            .replace('{guidelines}', this.guidelinesBySection[sectionType].join('\n'));
    }

    public async generateCoreSection(): Promise<string> {
        try {
            const coreCasts = await this.shortTermCollection.get({
                where: {
                    'similarity_category': 'core'
                }
            });

            if (!coreCasts || !coreCasts.documents) {
                throw new Error('No core casts found');
            }

            // Get user context
            const userContext = await this.getUserContext();

            // Add user context to the prompt
            const prompt = this.createSectionPrompt('core', coreCasts.documents);
            const fullPrompt = `${userContext}\n\n${prompt}`;

            const response = await axios.post(`${this.baseUrl}/chat/completions`, {
                messages: [
                    {
                        role: "system",
                        content: "You are crafting a section of a newsletter-style article. Write in a personal, reflective tone."
                    },
                    {
                        role: "user",
                        content: fullPrompt
                    }
                ],
                model: "llama",
                temperature: 0.7,
                max_tokens: 1000
            });

            return response.data.choices[0].message.content;

        } catch (error) {
            console.error('Error generating core section:', error);
            throw error;
        }
    }

    public async generateRelatedSection(): Promise<string> {
        try {
            const relatedCasts = await this.shortTermCollection.get({
                where: {
                    'similarity_category': 'related'
                }
            });

            if (!relatedCasts || !relatedCasts.documents) {
                throw new Error('No related casts found');
            }

            // Get user context
            const userContext = await this.getUserContext();

            // Add user context to the prompt
            const prompt = this.createSectionPrompt('related', relatedCasts.documents);
            const fullPrompt = `${userContext}\n\n${prompt}`;

            const response = await axios.post(`${this.baseUrl}/chat/completions`, {
                messages: [
                    {
                        role: "system",
                        content: "You are crafting a section of a newsletter-style article. Write in a personal, reflective tone."
                    },
                    {
                        role: "user",
                        content: fullPrompt
                    }
                ],
                model: "llama",
                temperature: 0.7,
                max_tokens: 1000
            });

            return response.data.choices[0].message.content;

        } catch (error) {
            console.error('Error generating related section:', error);
            throw error;
        }
    }

    public async generateOuterSpaceSection(): Promise<string> {
        try {
            const outerSpaceCasts = await this.shortTermCollection.get({
                where: {
                    'similarity_category': 'outerSpace'
                }
            });

            if (!outerSpaceCasts || !outerSpaceCasts.documents) {
                throw new Error('No outer space casts found');
            }

            // Get user context
            const userContext = await this.getUserContext();

            // Add user context to the prompt
            const prompt = this.createSectionPrompt('outerSpace', outerSpaceCasts.documents);
            const fullPrompt = `${userContext}\n\n${prompt}`;

            const response = await axios.post(`${this.baseUrl}/chat/completions`, {
                messages: [
                    {
                        role: "system",
                        content: "You are crafting a section of a newsletter-style article. Write in a personal, reflective tone."
                    },
                    {
                        role: "user",
                        content: fullPrompt
                    }
                ],
                model: "llama",
                temperature: 0.7,
                max_tokens: 1000
            });

            return response.data.choices[0].message.content;

        } catch (error) {
            console.error('Error generating outer space section:', error);
            throw error;
        }
    }

    async generateArticle(): Promise<string> {
        const coreSection = await this.generateCoreSection();
        const relatedSection = await this.generateRelatedSection();
        const outerSpaceSection = await this.generateOuterSpaceSection();

        return `${coreSection}\n\n${relatedSection}\n\n${outerSpaceSection}`;
    }
}