"use client"

import { useEffect, useState } from 'react'
import { useChainId, useSwitchChain, useAccount } from 'wagmi'
import { AlertTriangle, Wifi } from 'lucide-react'
import { seiTestnet } from '@/lib/web3'

export default function NetworkSwitcher() {
  const chainId = useChainId()
  const { isConnected } = useAccount()
  const { switchChain, isPending } = useSwitchChain()
  const [showSwitcher, setShowSwitcher] = useState(false)

  const expectedChainId = 1328 // SEI Atlantic-2 testnet
  const isCorrectNetwork = chainId === expectedChainId

  useEffect(() => {
    // Only show switcher if wallet is connected but on wrong network
    if (isConnected && !isCorrectNetwork) {
      setShowSwitcher(true)
    } else {
      setShowSwitcher(false)
    }
  }, [isConnected, isCorrectNetwork])

  const handleSwitchNetwork = async () => {
    try {
      await switchChain({ chainId: expectedChainId })
    } catch (error) {
      console.error('Failed to switch network:', error)
    }
  }

  const getNetworkName = (chainId: number) => {
    switch (chainId) {
      case 1328:
        return 'SEI Atlantic-2 Testnet'
      case 713715:
        return 'SEI Devnet (Arctic)'
      case 1329:
        return 'SEI Mainnet'
      default:
        return `Unknown Network (${chainId})`
    }
  }

  if (!showSwitcher) {
    return null
  }

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm">
      <div className="bg-gradient-to-r from-red-500/10 to-orange-500/10 border border-red-500/30 backdrop-blur-lg rounded-2xl p-4 shadow-xl">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-400" />
            </div>
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-white mb-1">
              Wrong Network
            </h3>
            <p className="text-xs text-gray-300 mb-3">
              You're connected to <strong>{getNetworkName(chainId)}</strong>. 
              Please switch to <strong>SEI Atlantic-2 Testnet</strong> to continue.
            </p>
            
            <button
              onClick={handleSwitchNetwork}
              disabled={isPending}
              className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:from-gray-500 disabled:to-gray-600 text-white text-sm font-medium py-2 px-3 rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
            >
              {isPending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Switching...
                </>
              ) : (
                <>
                  <Wifi className="w-4 h-4" />
                  Switch to Testnet
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}