import { http } from 'wagmi'
import { mainnet } from 'wagmi/chains'
import { getDefaultConfig } from '@rainbow-me/rainbowkit'

const seiDevnet = {
  ...mainnet,
  id: 713715,
  name: 'SEI Devnet',
  nativeCurrency: { name: 'SEI', symbol: 'SEI', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://evm-rpc-arctic-1.sei-apis.com'] }
  },
  blockExplorers: {
    default: { name: 'SeiTrace', url: 'https://seitrace.com' }
  }
}

export const config = getDefaultConfig({
  appName: 'SEI DLP',
  projectId: process.env.NEXT_PUBLIC_WC_ID!,
  chains: [seiDevnet],
  transports: {
    [713715]: http()
  }
})