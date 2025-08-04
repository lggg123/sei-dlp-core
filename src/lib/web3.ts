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

// SEI Testnet (Arctic-1) - avoid for DeFi compliance
export const seiTestnet = defineChain({
  id: 13289,
  name: 'SEI Arctic',
  nativeCurrency: { name: 'SEI', symbol: 'SEI', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://evm-rpc-arctic-1.sei-apis.com'] }
  },
  blockExplorers: {
    default: { name: 'SeiTrace Arctic', url: 'https://seitrace.com/?chain=arctic-1' }
  },
  testnet: true
})

export const config = getDefaultConfig({
  appName: 'SEI DLP',
  projectId: process.env.NEXT_PUBLIC_WC_ID || 'dummy-project-id',
  chains: [seiDevnet, seiMainnet, seiTestnet],
  transports: {
    [seiDevnet.id]: http(),
    [seiMainnet.id]: http(),
    [seiTestnet.id]: http()
  },
  ssr: true,
  batch: {
    multicall: false,
  },
})