'use client'

import React, { useState } from 'react'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { Button } from '@/components/ui/button'
import { SeiWalletModal } from './SeiWalletModal'
import { useSeiWallet } from '@/hooks/useSeiWallet'

export function WalletConnectButton() {
  const [showSeiModal, setShowSeiModal] = useState(false)
  const { isSeiConnected, isFullyConnected, mounted } = useSeiWallet()
  const [fallbackMode, setFallbackMode] = useState(false)
  // Enhanced debug logging for visibility issues
  React.useEffect(() => {
    console.log('[WalletConnectButton] State:', { 
      mounted, 
      fallbackMode, 
      isSeiConnected, 
      isFullyConnected,
      timestamp: new Date().toISOString()
    })
    
    // Debug DOM visibility
    const walletContainers = document.querySelectorAll('.wallet-container-override')
    console.log('[WalletConnectButton] Found wallet containers:', walletContainers.length)
    walletContainers.forEach((container, index) => {
      const styles = window.getComputedStyle(container)
      console.log(`[WalletConnectButton] Container ${index}:`, {
        display: styles.display,
        visibility: styles.visibility,
        opacity: styles.opacity,
        zIndex: styles.zIndex,
        position: styles.position
      })
    })
  }, [mounted, fallbackMode, isSeiConnected, isFullyConnected])

  // Reduced fallback timeout for better UX
  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (!mounted) {
        console.log('[WalletConnectButton] Activating fallback mode after timeout')
        setFallbackMode(true)
      }
    }, 3000) // Reduced from 5s to 3s

    return () => clearTimeout(timer)
  }, [mounted])

  // Always show a button to ensure visibility - even during loading
  if (!mounted && !fallbackMode) {
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

  // Enhanced fallback mode with better error handling
  if (fallbackMode) {
    return (
      <div className="wallet-container-override">
        <Button 
          className="btn-cyber"
          onClick={() => {
            console.log('[WalletConnectButton] Fallback mode - attempting wallet connection')
            // More user-friendly fallback
            const retry = window.confirm('Wallet connection is having issues. Would you like to refresh the page to try again?')
            if (retry) {
              window.location.reload()
            }
          }}
        >
          Connect Wallet
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
                        onClick={openConnectModal} 
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
                      {account.displayBalance
                        ? ` (${account.displayBalance})`
                        : ''}
                      {/* Connection status indicator */}
                      {isFullyConnected && (
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-background" />
                      )}
                    </Button>

                    {/* Sei Wallet Toggle */}
                    <Button
                      onClick={() => setShowSeiModal(true)}
                      className={isSeiConnected ? "btn-cyber-secondary" : "btn-cyber-outline"}
                      type="button"
                      title="Connect Sei Cosmos wallet"
                    >
                      {isSeiConnected ? '🌕' : '🌑'}
                    </Button>
                  </div>
                )
                })()}
              </div>
            </>
          )
        }}
      </ConnectButton.Custom>

      {/* Sei Wallet Modal */}
      <SeiWalletModal 
        isOpen={showSeiModal} 
        onClose={() => setShowSeiModal(false)} 
      />
    </>
  )
}