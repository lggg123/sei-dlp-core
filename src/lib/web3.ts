import { http } from 'wagmi'
import { defineChain } from 'viem'
import { getDefaultConfig } from '@rainbow-me/rainbowkit'

// SEI Production (Pacific-1) - legacy support
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

// SEI Devnet - Primary development and testing environment
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

export const config = getDefaultConfig({
  appName: 'SEI DLP',
  projectId: process.env.NEXT_PUBLIC_WC_ID || 'dummy-project-id',
  chains: [seiDevnet, seiMainnet],
  transports: {
    [seiDevnet.id]: http(),
    [seiMainnet.id]: http()
  },
  ssr: true,
  batch: {
    multicall: false,
  },
})