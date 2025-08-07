"use client"

// Polyfill indexedDB on server to prevent WalletConnect SSR errors
if (typeof window === 'undefined') {
  (global as any).indexedDB = { open: () => ({}) }
}
import '@rainbow-me/rainbowkit/styles.css'
import { SeiGlobalWalletProvider } from './SeiGlobalWalletProvider'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WagmiProvider } from 'wagmi'
import { RainbowKitProvider } from '@rainbow-me/rainbowkit'
import { config } from '@/lib/web3'
import { ReactNode, useEffect, useState } from 'react'

// Create QueryClient with proper error handling and retry logic
function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60 * 5, // 5 minutes
        gcTime: 1000 * 60 * 30, // 30 minutes
        retry: (failureCount, error) => {
          // Don't retry on 4xx errors
          if (error instanceof Error && error.message.includes('4')) {
            return false
          }
          return failureCount < 3
        },
        retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
        refetchOnWindowFocus: false,
        refetchOnReconnect: true,
        refetchOnMount: true,
      },
      mutations: {
        retry: (failureCount, error) => {
          // Don't retry mutations on client errors
          if (error instanceof Error && error.message.includes('4')) {
            return false
          }
          return failureCount < 2
        },
        retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
      },
    },
  })
}

let browserQueryClient: QueryClient | undefined = undefined

function getQueryClient() {
  if (typeof window === 'undefined') {
    // Server: always make a new query client
    return makeQueryClient()
  } else {
    // Browser: make a new query client if we don't already have one
    if (!browserQueryClient) browserQueryClient = makeQueryClient()
    return browserQueryClient
  }
}

interface Web3ProviderProps {
  children: ReactNode
}

export function Web3Provider({ children }: Web3ProviderProps) {
  const [mounted, setMounted] = useState(false)
  // Create a stable queryClient instance
  const [queryClient] = useState(() => getQueryClient())

  useEffect(() => {
    setMounted(true)
  }, [])

  // Don't render providers until mounted to prevent double initialization
  if (!mounted) {
    return null
  }

  return (
    <SeiGlobalWalletProvider>
      <WagmiProvider config={config}>
        <QueryClientProvider client={queryClient}>
          <RainbowKitProvider initialChain={713715} showRecentTransactions={false}>
            {children}
          </RainbowKitProvider>
        </QueryClientProvider>
      </WagmiProvider>
    </SeiGlobalWalletProvider>
  )
}