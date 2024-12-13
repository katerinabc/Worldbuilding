import { http, createWalletClient, createPublicClient, Address} from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { odyssey } from '@story-protocol/core-sdk'
import { defaultNftContractAbi } from '.defaultNftContractAbi'

const privateKey: Address = `0x${process.env.WALLET_PRIVATE_KEY}`
const account: Account = privateKeyToAccount(privateKey)

const baseConfig = {
    chain: odyssey,
    transport: http(process.env.RPC_PROVIDER_URL)
} as const
export const PublicClient = createPublicClient(baseConfig)
export const waleltClient = createWalletClient({
    ...baseConfig,
    account,
})

export async function mintNFT(to: Address, uri: string): Promise<number | undefined> {
    const { request } = await PublicClient.simulateContract({
        address: ProcessingInstruction.env.NFT_CONTRACT_ADDRESS as Address,
        functionName: 'mintNFT',
        args: [to, uri],
        abi: defaultNftContractAbi,
    })
    const hash = await waleltClient.writeContract(request)
    const { logs } = await PublicClient.waitForTransactionReceipt({
        hash,
    })
    if (logs[0].topics[3]) {
        return parseInt(logs[0].topics[3], 16)
    }
}