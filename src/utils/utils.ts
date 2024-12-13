import { StoryClient, StoryConfig } from "@story-protocol/core-sdk";
import { Account, Address, http } from 'viem'
import { privateKeyToAccount } from "viem/accounts";

// wallet private key
const privateKey: Address = `0x${process.env.WALLET_PRIVATE_KEY}`
const account: Account = privateKeyToAccount(privateKey)

// initiate story confit
const config: StoryConfig = {
    account: account, 
    transport: http(process.env.RPC_PROVIDER_URL),
    chainId: 'odyssey',
}
// client to minft nft, register ip etc
export const client = StoryClient.newClient(config)

//
// export const nftCollectionAddress = process.env.NFT_CONTRACT_ADDRESS
// nft collection is an nft contract that has been deployed to story before the start of the workshop to save time
export const nftCollectionAddress = '0x60079B018d74216EeF9E1604Cd05e13eA49735AF'
export const nonCommercialLicenseTermsid = '1'