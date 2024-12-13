import pinataSDK from '@pinata/sdk'
import dotenv from 'dotenv'

dotenv.config()

const pinata = new pinataSDK({ pinataJWTKey: process.env.PINATA_JWT })

// Define a type for the metadata
export async function uploadJSONToIPFS(jsonMetadata: Record<string, any>): Promise<string> {
    try {
        const result = await pinata.pinJSONToIPFS(jsonMetadata)
        return result.IpfsHash
    } catch (error) {
        console.error('Error uploading to IPFS:', error)
        throw error
    }
}

