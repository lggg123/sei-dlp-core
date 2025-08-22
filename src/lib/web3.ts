import { http } from 'wagmi'
import { defineChain } from 'viem'
import { getDefaultConfig } from '@rainbow-me/rainbowkit'

// SEI Mainnet (Pacific-1)
export const seiMainnet = defineChain({
  id: 1329,
  name: 'SEI',
  nativeCurrency: { name: 'SEI', symbol: 'SEI', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://evm-rpc.sei-apis.com'] }
  },
  blockExplorers: {
    default: { name: 'SeiTrace', url: 'https://seitrace.com' }
  },
  testnet: false
})

// SEI Devnet 
export const seiDevnet = defineChain({
  id: 713715,
  name: 'SEI Devnet',
  nativeCurrency: { name: 'SEI', symbol: 'SEI', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://evm-rpc-arctic-1.sei-apis.com'] }
  },
  blockExplorers: {
    default: { name: 'SeiTrace Devnet', url: 'https://seitrace.com/?chain=devnet' }
  },
  testnet: true
})

// SEI Testnet (Atlantic-2) - Updated for testing
export const seiTestnet = defineChain({
  id: 1328,
  name: 'SEI Atlantic-2',
  nativeCurrency: { name: 'SEI', symbol: 'SEI', decimals: 18 },
  rpcUrls: {
    default: { 
      http: [
        'https://evm-rpc-testnet.sei-apis.com',
        'https://evm-rpc.arctic-1.seinetwork.io' // Backup RPC
      ] 
    }
  },
  blockExplorers: {
    default: { name: 'SeiTrace Testnet', url: 'https://seitrace.com/atlantic-2' }
  },
  testnet: true
})

// Singleton pattern to prevent multiple config instantiation
let configInstance: ReturnType<typeof getDefaultConfig> | null = null
let isCreatingConfig = false

function createConfig() {
  // Prevent race conditions during config creation
  if (isCreatingConfig) {
    // Wait for existing creation to complete
    while (!configInstance && isCreatingConfig) {
      // Busy wait for a short time
    }
    return configInstance!
  }

  if (configInstance) {
    return configInstance
  }

  isCreatingConfig = true

  const projectId = process.env.NEXT_PUBLIC_WC_ID
  
  console.log('[Web3Config] WalletConnect Project ID:', projectId ? `${projectId.substring(0, 8)}...` : 'NOT_SET');
  
  if (!projectId || projectId === 'dummy-project-id' || projectId === 'your_walletconnect_project_id_here') {
    console.warn('⚠️ WalletConnect Project ID not set. Please add NEXT_PUBLIC_WC_ID to your .env.local file.')
    console.warn('Get your Project ID from: https://walletconnect.com/cloud')
  }

  configInstance = getDefaultConfig({
    appName: 'SEI DLP',
    projectId: projectId || 'fallback-project-id',
    chains: [seiTestnet, seiMainnet, seiDevnet],
    transports: {
      [seiDevnet.id]: http(),
      [seiMainnet.id]: http(),
      [seiTestnet.id]: http()
    },
    ssr: true
  })

  isCreatingConfig = false
  return configInstance
}

export const config = createConfig()