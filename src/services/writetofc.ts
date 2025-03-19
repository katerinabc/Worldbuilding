import axios from 'axios'
import { getLatestArticlePath } from './getlatestarticle'
import { ArticleGenerator } from './article'
import { truncateToBytes, processLLMOutput } from '../utils/casting'
import dotenv from 'dotenv';
import fs from 'fs'

dotenv.config();
/**
 * write the story to farcaster as one cast or a series of casts
 * @param articlePath - path to the article
 * @param targetUserFname - fname of the user whose likes are storified
 */

export class BotTalking {

    private readonly apiKey: string;
    private readonly baseUrl: string = 'https://api.neynar.com/v2';

    constructor() {
        const apiKey = process.env.NEYNAR_API_KEY;
        if (!apiKey) {  
            throw new Error('NEYNAR_API_KEY not found in env vari')
        }
        this.apiKey = apiKey
    }
    
    
    async botSaysHi(botmessage: string, castHash: string) {

        try {
            const textToCast = botmessage
            const response = await axios.post(
                `${this.baseUrl}/farcaster/cast`,
                 {
                    text:textToCast,
                    parent:castHash,
                    signer_uuid: '480f13ff-7223-4b65-b71b-801044bf9779'
                },
                {
                    headers: {
                        accept: 'application/json',
                        'content-type': 'application/json',
                        'x-api-key': this.apiKey,
                    }
                
                }
            )

            console.log('Cast published successfully', response.data)

        } catch (error) {
            console.error('error writing to fc', error)
            throw error
        }

    }
}

export class WriteToFc {
    private readonly apiKey: string;
    private readonly baseUrl: string = 'https://api.neynar.com/v2';
    private readonly longTermCollection: any;
    private readonly shortTermCollection: any;

    constructor(shortTermCollection: any, longTermCollection: any) {
        const apiKey = process.env.NEYNAR_API_KEY;
        if (!apiKey) {
            throw new Error('NEYNAR_API_KEY not found in env vari')
        }
        this.apiKey = apiKey
        this.shortTermCollection = shortTermCollection;
        this.longTermCollection = longTermCollection;
    }

    async getLatestArticle() {
        try {
            const articlePath = await getLatestArticlePath()
            const article = fs.readFileSync(articlePath, 'utf8');

            return article

            // return the first 100 characters of the article
            console.log('article', article.slice(0,200))

        } catch (error) {
            console.error('error writing to fc', error)
            throw error
        }
    }

    async writeArticleToFc() {

        try {
            const textToCast = await this.processArticle()
            const response = await axios.post(
                `${this.baseUrl}/farcaster/cast`,
                 {
                    text:textToCast,
                    signer_uuid: '480f13ff-7223-4b65-b71b-801044bf9779'
                },
                {
                    headers: {
                        accept: 'application/json',
                        'content-type': 'application/json',
                        'x-api-key': this.apiKey,
                    }
                
                }
            )

            console.log('Cast published successfully', response.data)

        } catch (error) {
            console.error('error writing to fc', error)
            throw error
        }

    }


    async getHash(response: any) {
        try {
            const getHash = response.data.cast.hash
            return getHash

        } catch (error){
            console.error('error getting hash 1', error)
            throw error
        }
    }

    async writeSectionToFc() {

        try {
            // Casting Core Casts
            const CoreToCast = await this.processCoreSection()
            const coreResponse = await axios.post(
                `${this.baseUrl}/farcaster/cast`,
                {
                    text:CoreToCast,
                    signer_uuid: '480f13ff-7223-4b65-b71b-801044bf9779'
                },
                {
                    headers: {
                        accept: 'application/json',
                        'content-type': 'application/json',
                        'x-api-key': this.apiKey,
                    }
                }
            )
            
            console.log('cast publishd successfully', coreResponse.data)

            const getHash = await this.getHash(coreResponse)

            await new Promise(resolve => setTimeout(resolve, 1000))


            // Casting Related Casts
            const RelatedToCast = await this.processRelatedSection()
            const relatedResponse = await axios.post(
                `${this.baseUrl}/farcaster/cast`,
                {
                    text:RelatedToCast,
                    parent: getHash,
                    signer_uuid: '480f13ff-7223-4b65-b71b-801044bf9779'
                },
                {
                    headers: {
                        accept: 'application/json',
                        'content-type': 'application/json',
                        'x-api-key': this.apiKey,
                    }
                }

            )

            console.log('related cast published successfully', relatedResponse.data)

            const getHashRelated = await this.getHash(relatedResponse)

            await new Promise(resolve => setTimeout(resolve, 1000))

            // Casting OUter Space Casts
            const OuterSpacetoCast = await this.processOuterSpaceSection()
            const outerSpaceResponse = await axios.post(
                `${this.baseUrl}/farcaster/cast`,
                {
                    text: OuterSpacetoCast,
                    parent: getHash,
                    signer_uuid: '480f13ff-7223-4b65-b71b-801044bf9779'
                },
                {
                    headers:{
                        accept: 'applicatio/json',
                        'content-type': 'application/json',
                        'x-api-key': this.apiKey,
                    }
                }
            )

            console.log('outer space cast published successfully', outerSpaceResponse.data)

        } catch (error) {
            console.error('error writing cast 1 to fc', error)
            throw error
        }
    }

    async processArticle() { // this gets the full article and adds a default intro to the article

        try {
            const article = await this.getLatestArticle()
            const defaultIntro = '@kbc testing stuff. here are the first 200 characters. '
            const processedArticle = defaultIntro + article.slice(0,200)
            console.log('processed article', processedArticle)
            
            return processedArticle

        } catch (error) {
            console.error('error processing article', error)
            throw error
        }
    }

    async processCoreSection() {// this only gets the core section. The core section isn't stored as a txt file

        try {
            const articleGenerator = new ArticleGenerator(this.shortTermCollection, this.longTermCollection)
            const coreSection = await articleGenerator.generateCoreSection()
            
            const defaultCoreIntro = 'Core to @kbc: '

            const processedCoreSection = processLLMOutput(coreSection, defaultCoreIntro)

            console.log('processed the core section', processedCoreSection)

            return processedCoreSection
        } catch (error) {
            console.error('error processing the core section', error)
            throw error
        }
    }

    async processRelatedSection() {

        try {
            const articleGenerator = new ArticleGenerator(this.shortTermCollection, this.longTermCollection)
            const relatedSection = await articleGenerator.generateRelatedSection()

            const defaultRelatedIntro = 'Related to @kbc: '
            const processedRelatedSection = processLLMOutput(relatedSection, defaultRelatedIntro)

            return processedRelatedSection

        } catch (error) {
            console.error('error processing the related section', error)
            throw error
        }
    }

    async processOuterSpaceSection() {

        try {
            const articleGenerator = new ArticleGenerator(this.shortTermCollection, this.longTermCollection)
            const outerSpaceSection = await articleGenerator.generateOuterSpaceSection()

            const defaultOuterSpaceIntro = 'Outer Space to @kbc: '

            const processedOuterSpaceSection = processLLMOutput(outerSpaceSection, defaultOuterSpaceIntro)

            return processedOuterSpaceSection

        } catch (error) {
            console.error('error processing the outer space section', error)
            throw error
        }

    }
    
}