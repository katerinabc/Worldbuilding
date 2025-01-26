import { registerArticle } from '../services/register'
import dotenv from 'dotenv'

dotenv.config()

async function testRegistration() {
    try {
        const articlePath = 'articles/article-2024-12-13T10-00-44-379Z.txt'
        const title = "Article from December 13"
        const description = "Test article registration for Story Protocol"
        const creatorAddress = process.env.WALLET_ADDRESS as string

        const response = await registerArticle(
            articlePath,
            title,
            description,
            creatorAddress
        )

        console.log('Registration successful!')
        console.log('Transaction Hash:', response.txHash)
        console.log('NFT Token ID:', response.tokenId)
        console.log('IPA ID:', response.ipId)
    } catch (error) {
        if (error instanceof Error) {
            console.error('Error:', error.message);}
        else {
            console.error('An unknown error occurred:', error)
        }
    }
}

testRegistration()