'use client'

import React, { useState, useEffect } from 'react'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { Button } from '@/components/ui/button'
import { useBalance, useAccount } from 'wagmi'
import { formatEther } from 'viem'

export function WalletConnectButton() {
  const [mounted, setMounted] = useState(false)
  
  useEffect(() => {
    setMounted(true)
  }, [])
  const [lastLogTime, setLastLogTime] = useState(0)
  
  // Get wallet address and balance for SEI testnet
  const { address, isConnected } = useAccount()
  const { data: balance, isLoading: balanceLoading } = useBalance({
    address,
    chainId: 1328, // SEI Atlantic-2 testnet
    query: {
      enabled: !!address && isConnected,
      refetchInterval: 30000, // 30 seconds
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      staleTime: 20000, // 20 seconds stale time
    }
  })
  
  // Enhanced debug logging with debouncing to prevent spam
  React.useEffect(() => {
    const now = Date.now()
    if (now - lastLogTime < 5000) return
    
    setLastLogTime(now)
    console.log('[WalletConnectButton] State:', { 
      mounted,
      isWalletConnected: isConnected,
      walletAddress: address,
      timestamp: new Date().toISOString()
    })
    
    if (typeof window !== 'undefined' && window.ethereum) {
      console.log('[WalletConnectButton] Ethereum provider detected:', {
        isMetaMask: window.ethereum.isMetaMask,
        chainId: window.ethereum.chainId,
        selectedAddress: window.ethereum.selectedAddress
      });
    }
  }, [mounted, lastLogTime, isConnected, address])


  // Show loading state while mounting
  if (!mounted) {
    return (
      <div className="wallet-container-override">
        <Button 
          className="btn-cyber" 
          disabled
          data-testid="wallet-loading-button"
        >
          Loading...
        </Button>
      </div>
    )
  }


  return (
    <>
      
      <ConnectButton.Custom>
        {({
          account,
          chain,
          openAccountModal,
          openChainModal,
          openConnectModal,
          authenticationStatus,
          mounted,
        }) => {
          const ready = mounted && authenticationStatus !== 'loading'
          const connected =
            ready &&
            account &&
            chain &&
            (!authenticationStatus ||
              authenticationStatus === 'authenticated')

          return (
            <>
              {/* Always render container - even if not ready for maximum visibility */}
              <div className="wallet-container-override flex items-center">
                {(() => {
                  // Show loading state if not ready
                  if (!ready) {
                    return (
                      <Button 
                        className="btn-cyber"
                        disabled
                      >
                        Connecting...
                      </Button>
                    )
                  }

                  if (!connected) {
                    return (
                      <Button 
                        onClick={() => {
                          console.log('[WalletConnectButton] Connect button clicked');
                          try {
                            openConnectModal();
                          } catch (error) {
                            console.error('[WalletConnectButton] Error opening connect modal:', error);
                          }
                        }} 
                        className="btn-cyber"
                        type="button"
                      >
                        Connect Wallet
                      </Button>
                    )
                  }

                if (chain.unsupported) {
                  return (
                    <Button 
                      onClick={openChainModal} 
                      type="button"
                      className="btn-cyber-error"
                    >
                      Wrong network
                    </Button>
                  )
                }

                return (
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={openChainModal}
                      className="btn-cyber-secondary"
                      type="button"
                    >
                      {chain.hasIcon && (
                        <div
                          style={{
                            background: chain.iconBackground,
                            width: 12,
                            height: 12,
                            borderRadius: 999,
                            overflow: 'hidden',
                            marginRight: 4,
                          }}
                        >
                          {chain.iconUrl && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              alt={chain.name ?? 'Chain icon'}
                              src={chain.iconUrl}
                              style={{ width: 12, height: 12 }}
                            />
                          )}
                        </div>
                      )}
                      {chain.name}
                    </Button>

                    <Button
                      onClick={openAccountModal}
                      type="button"
                      className="btn-cyber relative"
                    >
                      {account.displayName}
                      {balance && !balanceLoading
                        ? ` (${parseFloat(formatEther(balance.value)).toFixed(2)} SEI)`
                        : balanceLoading
                        ? ' (Loading...)'
                        : ' (0.00 SEI)'}
                      {/* Connection status indicator */}
                      {isConnected && (
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-background" />
                      )}
                    </Button>
                  </div>
                )
                })()}
              </div>
            </>
          )
        }}
      </ConnectButton.Custom>

    </>
  )
}