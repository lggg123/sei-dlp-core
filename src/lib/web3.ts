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

// SEI Testnet (Arctic-1)
export const seiTestnet = defineChain({
  id: 713715,
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
  projectId: process.env.NEXT_PUBLIC_WC_ID!,
  chains: [seiMainnet, seiTestnet],
  transports: {
    [seiMainnet.id]: http(),
    [seiTestnet.id]: http()
  },
  ssr: true
})