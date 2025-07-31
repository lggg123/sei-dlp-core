'use client'

import { useState, useEffect } from 'react'
import { useAccount, useChainId } from 'wagmi'

// Supported Sei wallets (Cosmos-based)
export const SUPPORTED_SEI_WALLETS = [
  { windowKey: 'keplr', name: 'Keplr' },
  { windowKey: 'leap', name: 'Leap' },
  { windowKey: 'falcon', name: 'Falcon' },
  { windowKey: 'coin98', name: 'Coin98' }
] as const

type SeiWalletType = typeof SUPPORTED_SEI_WALLETS[number]['windowKey']

interface SeiWalletState {
  isConnected: boolean
  accounts: string[]
  selectedWallet: SeiWalletType | null
  error: string | null
}

export function useSeiWallet() {
  const { isConnected: isEvmConnected } = useAccount()
  const chainId = useChainId()
  
  const [seiWalletState, setSeiWalletState] = useState<SeiWalletState>({
    isConnected: false,
    accounts: [],
    selectedWallet: null,
    error: null
  })

  const connectSeiWallet = async (walletType: SeiWalletType) => {
    try {
      setSeiWalletState(prev => ({ ...prev, error: null }))

      if (typeof window === 'undefined') {
        throw new Error('Window is not available')
      }

      const wallet = (window as any)[walletType]
      if (!wallet) {
        throw new Error(`${walletType} wallet not found. Please install the ${walletType} extension.`)
      }

      // For Keplr and other Cosmos wallets, we need to enable the chain first
      if (walletType === 'keplr') {
        const chainId = chainId === 1329 ? 'pacific-1' : 'arctic-1'
        await wallet.enable(chainId)
        
        const offlineSigner = wallet.getOfflineSigner(chainId)
        const accounts = await offlineSigner.getAccounts()
        
        setSeiWalletState({
          isConnected: true,
          accounts: accounts.map((acc: any) => acc.address),
          selectedWallet: walletType,
          error: null
        })
      } else {
        // For other wallets, we might need different connection logic
        const chainId = chainId === 1329 ? 'pacific-1' : 'arctic-1'
        await wallet.enable(chainId)
        
        const offlineSigner = wallet.getOfflineSigner(chainId)
        const accounts = await offlineSigner.getAccounts()
        
        setSeiWalletState({
          isConnected: true,
          accounts: accounts.map((acc: any) => acc.address),
          selectedWallet: walletType,
          error: null
        })
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to connect wallet'
      setSeiWalletState(prev => ({
        ...prev,
        error: errorMessage,
        isConnected: false,
        accounts: [],
        selectedWallet: null
      }))
    }
  }

  const disconnectSeiWallet = () => {
    setSeiWalletState({
      isConnected: false,
      accounts: [],
      selectedWallet: null,
      error: null
    })
  }

  // Check if we have both EVM and Cosmos wallet connections
  const isFullyConnected = isEvmConnected && seiWalletState.isConnected

  return {
    // EVM wallet state
    isEvmConnected,
    
    // Sei Cosmos wallet state
    isSeiConnected: seiWalletState.isConnected,
    seiAccounts: seiWalletState.accounts,
    selectedSeiWallet: seiWalletState.selectedWallet,
    seiWalletError: seiWalletState.error,
    
    // Combined state
    isFullyConnected,
    
    // Actions
    connectSeiWallet,
    disconnectSeiWallet,
    
    // Constants
    SUPPORTED_SEI_WALLETS
  }
}