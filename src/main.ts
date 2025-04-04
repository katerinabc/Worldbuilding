import { FetchUserCasts } from './services/feed'
import { FetchReactions } from './services/reactions'
import { MemoryService } from './services/memory'
import { ArticleGenerator } from './services/article'
import { SimilarityService } from './services/analytics'
import { AnalyticsDB } from './database/sqlite3'
import { getLatestArticlePath } from './services/getlatestarticle'
import { registerArticle } from './services/register'
import { WriteToFc } from './services/writetofc'
import dotenv from 'dotenv'
dotenv.config()

async function main() {
    // Get title from command line arguments
    const userid = process.argv[2] || '12021' // default userid
    const title = process.argv[3] || `daily update ${new Date().toISOString()}`
    
    // if (!userid || !title) {
    //     console.error('Please provide a userid and title: npm run register "Your Article Title"')
    //     process.exit(1)
    // }

    try {
        // Step 1a: Fetch user's feed for long-term memory
        // currently hardcoded to userid 12021
        // currently limited to 500 casts
        const feedService = new FetchUserCasts(userid)
        const casts = await feedService.getUserCasts()

        // Step 1b: Fetch user's reactions for short-term memory
        // currently hardcoded to userid 12021
        // currently limited to 500 casts
        const reactionsService = new FetchReactions(userid)
        const reactions = await reactionsService.getLikedCasts()

        // Step 2: Process memories
        const memoryService = new MemoryService()
        await memoryService.initializeCollections()
        const longTermCollection = await memoryService.processLongTermMemory(casts)
        const shortTermCollection = await memoryService.processShortTermMemory(casts)

        // Step 3: Calculate similarities
        const analyticsDB = new AnalyticsDB()
        const similarityService = new SimilarityService(longTermCollection, shortTermCollection, analyticsDB)
        await similarityService.updateSimilarityScore()

        // Step 4: Generate article
        const articleGenerator = new ArticleGenerator(longTermCollection, shortTermCollection)
        await articleGenerator.generateArticle()
        
        // Step 5: Get the latest article path
        const articlePath = await getLatestArticlePath()
        const description = `Article generated on ${new Date().toISOString()}`
        const creatorAddress = process.env.WALLET_ADDRESS as string

        const response = await registerArticle(
            articlePath,
            title,
            description,
            creatorAddress
        )

        console.log('Registration successful!')
        console.log(`View your IP Asset at: https://explorer.story.foundation/ipa/${response.ipId}`)
        console.log(`Article path: ${articlePath}`)

        // Step 6: Write to Farcaster
        const writeToFc = new WriteToFc(shortTermCollection, longTermCollection)
        await writeToFc.writeArticleToFc()

        console.log('Article posted to Farcaster!')

    } catch (error) {
        if (error instanceof Error) {
            console.error('Error:', error.message)
        } else {
            console.error('An unknown error occurred:', error)
        }
    }
}

main()