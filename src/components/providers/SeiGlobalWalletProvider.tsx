'use client'

import { useEffect } from 'react'

/**
 * Client-side provider to initialize SEI Global Wallet
 * This must run on the client side to avoid SSR issues
 */
export function SeiGlobalWalletProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Dynamically import the SEI Global Wallet to enable EIP-6963 support
    // This ensures it only runs on the client side
    import('@sei-js/sei-global-wallet/eip6963').catch(console.error)
  }, [])

  return <>{children}</>
}