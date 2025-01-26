import { FetchUserCasts } from '../services/feed'
import { FetchReactions } from '../services/reactions'
import { MemoryService } from '../services/memory'
import { ArticleGenerator } from '../services/article'
import { registerArticle } from '../services/register'
import { WriteToFc } from '../services/writetofc'
import dotenv from 'dotenv'
import fs from 'fs/promises'
import path from 'path'
import { AnalyticsDB } from '../database/sqlite3'
import { SimilarityService } from '../services/analytics'
import { client, COLLECTIONS, getEmbedder } from '../database/client'
import { IEmbeddingFunction } from 'chromadb'
import { EMBEDDER_CONFIG } from '../config/embedder'

dotenv.config()

async function testFetchUserCasts() {
    console.log('Testing: Fetch User Casts')
    try {
        const feedService = new FetchUserCasts()
        const allCasts = await feedService.getUserCasts()
        const casts = allCasts.slice(0, 15)
        console.log(`✅ Successfully fetched ${casts.length}/15 casts for long-term memory`)
        return casts
    } catch (error) {
        console.error('❌ Failed to fetch user casts:', error)
        throw error
    }
}

async function testFetchReactions() {
    console.log('\nTesting: Fetch Reactions')
    try {
        const reactionsService = new FetchReactions()
        const allReactions = await reactionsService.getLikedCasts()
        const reactions = allReactions.slice(0, 5)
        console.log(`✅ Successfully fetched ${reactions.length}/5 reactions for short-term memory`)
        return reactions
    } catch (error) {
        console.error('❌ Failed to fetch reactions:', error)
        throw error
    }
}

async function testMemoryProcessing(casts: any[]) {
    console.log('\nTesting: Memory Processing')
    try {
        // Initialize MemoryService and collections
        const memoryService = new MemoryService()
        console.log('Initializing collections...')
        await memoryService.initializeCollections()
        console.log('Collections initialized successfully')

        // Validate casts before processing
        const validCasts = casts.filter(cast => {
            if (!cast || !cast.text || !cast.author || !cast.hash) {
                console.log('Skipping invalid cast:', cast);
                return false;
            }
            return true;
        });

        console.log(`Found ${validCasts.length} valid casts out of ${casts.length} total`);

        // Process memories
        console.log('Processing long-term memory...')
        await memoryService.processLongTermMemory(validCasts)
        console.log('Processing short-term memory...')
        await memoryService.processShortTermMemory(validCasts)
        console.log('✅ Successfully processed memories')

        // Get collections for next steps
        const embedder = getEmbedder()
        const longTermCollection = await client.getCollection({
            name: COLLECTIONS.LONG_TERM,
            embeddingFunction: embedder as IEmbeddingFunction,
        })
        const shortTermCollection = await client.getCollection({
            name: COLLECTIONS.SHORT_TERM,
            embeddingFunction: embedder as IEmbeddingFunction,
        })
        return { longTermCollection, shortTermCollection }
    } catch (error) {
        console.error('❌ Failed to process memories:', error)
        throw error
    }
}

async function testSimilarityService(longTermCollection: any, shortTermCollection: any) {
    console.log('\nTesting: Similarity Service')
    try {
        const analyticsDB = new AnalyticsDB()
        const similarityService = new SimilarityService(longTermCollection, shortTermCollection, analyticsDB)
        await similarityService.updateSimilarityScore()
        console.log('✅ Successfully updated similarity score')
    } catch (error) {
        console.error('❌ Failed to create analytics tables:', error)
        throw error
    }
}

async function testArticleGeneration(longTermCollection: any, shortTermCollection: any) {
    console.log('\nTesting: Article Generation')
    try {
        const articleGenerator = new ArticleGenerator(shortTermCollection, longTermCollection)
        const article = await articleGenerator.generateArticle()
        console.log('✅ Successfully generated article')
        console.log('Preview:', article.substring(0, 100) + '...')
        return article
    } catch (error) {
        console.error('❌ Failed to generate article:', error)
        throw error
    }
}

async function testArticleRegistration(title: string) {
    console.log('\nTesting: Article Registration')
    try {
        const articlesDir = 'articles'
        const files = await fs.readdir(articlesDir)
        if (files.length === 0) {
            throw new Error('No articles found')
        }
        
        const articlePath = path.join(articlesDir, files[files.length - 1])
        const description = `Test article generated on ${new Date().toISOString()}`
        const creatorAddress = process.env.WALLET_ADDRESS as string

        const response = await registerArticle(
            articlePath,
            title,
            description,
            creatorAddress
        )
        console.log('✅ Successfully registered article')
        console.log('IP Asset URL:', `https://explorer.story.foundation/ipa/${response.ipId}`)
    } catch (error) {
        console.error('❌ Failed to register article:', error)
        throw error
    }
}

async function testWriteToFc(shortTermCollection: any, longTermCollection: any) {
    console.log('\nTesting: Memory Processing')

    try {
        const writeToFc = new WriteToFc(shortTermCollection, longTermCollection)
        await writeToFc.writeSectionToFc()
        console.log('✅ Successfully wrote to Farcaster')

    } catch (error) {
        console.error('❌ Failed to write to Farcaster:', error)
        throw error
    }
    
}


async function runTests() {
    const title = process.argv[2] || `daily update ${new Date().toISOString()}`
    
    if (!title) {
        console.error('Please provide a title: npm run test:main "Your Article Title"')
        process.exit(1)
    }

    try {
        console.log('\n=== Testing Complete Flow ===');

        console.log('\n1. Fetching Data...');   
        const casts = await testFetchUserCasts()
        await testFetchReactions()

        console.log('\n2. Processing Memories...');
        const collections = await testMemoryProcessing(casts)
        
        console.log('\n3. Calculating Similarity...');
        await testSimilarityService(collections.longTermCollection, collections.shortTermCollection)
        
        console.log('\n4. Generating Article...');
        const article = await testArticleGeneration(collections.longTermCollection, collections.shortTermCollection)
        
        console.log('\n5. Registering Article...');
        await testArticleRegistration(title)
        
        console.log('\n6. Writing to Farcaster...');
        await testWriteToFc(collections.shortTermCollection, collections.longTermCollection)
        
        console.log('\n✅ All tests completed successfully!')
    } catch (error) {
        console.error('\n❌ Tests failed:', error)
        process.exit(1)
    }
}


runTests() 