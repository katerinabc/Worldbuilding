import { client } from '../utils/utils'
import { zeroAddress } from 'viem'

async function createNFTCollection() {
    try {
        const newCollection = await client.nftClient.createNFTCollection({
            name: 'Article NFTs',
            symbol: 'ART',
            isPublicMinting: true,
            mintOpen: true,
            mintFeeRecipient: zeroAddress,
            contractURI: '',
            txOptions: { waitForTransaction: true },
        })

        console.log('NFT Collection created at:', newCollection.spgNftContract)
        // Save this address and use it in your .env file
    } catch (error) {
        console.error('Error creating collection:', error)
        throw error
    }
}

createNFTCollection()