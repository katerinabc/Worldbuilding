import { FetchUserCasts } from '../services/feed'
import { FetchReactions } from '../services/reactions'
import { MemoryService } from '../services/memory'
import { ArticleGenerator } from '../services/article'
import { registerArticle } from '../services/register'
import dotenv from 'dotenv'
import fs from 'fs/promises'
import path from 'path'

dotenv.config()

async function testFetchUserCasts() {
    console.log('Testing: Fetch User Casts')
    try {
        const feedService = new FetchUserCasts()
        const allCasts = await feedService.getUserCasts()
        // Limit to 15 casts
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
        // Limit to 5 reactions
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
        const memoryService = new MemoryService()
        await memoryService.processLongTermMemory(casts)
        await memoryService.processShortTermMemory(casts)
        console.log('✅ Successfully processed memories')
    } catch (error) {
        console.error('❌ Failed to process memories:', error)
        throw error
    }
}

async function testArticleGeneration() {
    console.log('\nTesting: Article Generation')
    try {
        const articleGenerator = new ArticleGenerator()
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

async function runTests() {
    const title = process.argv[2]
    
    if (!title) {
        console.error('Please provide a title: npm run test:main "Your Article Title"')
        process.exit(1)
    }

    try {
        const casts = await testFetchUserCasts()
        await testFetchReactions()
        await testMemoryProcessing(casts)
        await testArticleGeneration()
        await testArticleRegistration(title)
        
        console.log('\n✅ All tests completed successfully!')
    } catch (error) {
        console.error('\n❌ Tests failed:', error)
        process.exit(1)
    }
}

runTests() 