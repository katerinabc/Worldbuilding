import dotenv from 'dotenv'
import { createHash } from 'crypto'
import { client, nftCollectionAddress } from '../utils/utils'
import { uploadJSONToIPFS } from "../utils/uploadToIpfs"
import { PIL_TYPE, IpMetadata } from "@story-protocol/core-sdk"
import fs from 'fs'

dotenv.config()

// TODO: get latest article .

/**
 * Registers an article as intellectual property on Story Protocol
 * This process includes:
 * 1. Creating metadata for both IP and NFT
 * 2. Uploading metadata to IPFS
 * 3. Registering the IP with Story Protocol
 * 
 * @param articlePath - Path to the article file
 * @param title - Title of the article
 * @param description - Description of the article
 * @param creatorAddress - Blockchain address of the creator
 */
export async function registerArticle(
    articlePath: string,
    title: string,
    description: string,
    creatorAddress: string
) {
    try {
        // Step 1: Read the article content from file
        // This will be used in both IP and NFT metadata
        const articleText = fs.readFileSync(articlePath, 'utf8')

        // Step 2: Generate IP Metadata
        // This metadata describes the intellectual property itself
        const ipMetadata = {
            title: title,
            description: description,
            ipType: 'text',  // Specifies this IP is a text-based work
            attributes: [{
                key: 'Article Text',
                value: articleText,  // Full content of the article
            }],
            creators: [{
                name: 'Author',
                contributionPercent: 100,  // Single author gets 100% contribution
                address: creatorAddress,   // Blockchain address of the creator
            }],
        }

        // Step 3: Generate NFT Metadata
        // This metadata is for the NFT that represents ownership of the IP
        const nftMetadata = {
            name: `${title} - Ownership NFT`,
            description: `Ownership NFT for article: ${title}`,
            attributes: [{
                key: 'Article Text',
                value: articleText,
            }],
        }

        // Step 4: Upload both metadata objects to IPFS
        // IPFS provides permanent, decentralized storage
        const ipIpfsHash = await uploadJSONToIPFS(ipMetadata)
        // Create a hash of the metadata for verification
        const ipHash = createHash('sha256').update(JSON.stringify(ipMetadata)).digest('hex')
        
        const nftIpfsHash = await uploadJSONToIPFS(nftMetadata)
        const nftHash = createHash('sha256').update(JSON.stringify(nftMetadata)).digest('hex')

        // Step 5: Register the IP and mint NFT in one transaction
        const response = await client.ipAsset.mintAndRegisterIp({
            spgNftContract: nftCollectionAddress,
            ipMetadata: {
                ipMetadataURI: `https://ipfs.io/ipfs/${ipIpfsHash}`,
                nftMetadataURI: `https://ipfs.io/ipfs/${nftIpfsHash}`,
                ipMetadataHash: `0x${ipHash}`,
                nftMetadataHash: `0x${nftHash}`,
            },
            txOptions: { waitForTransaction: true }
        });

        return response;

    } catch (error) {
        console.error('Error registering article:', error)
        throw error
    }
}