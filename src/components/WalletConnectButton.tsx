'use client'

import { useState } from 'react'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { Button } from '@/components/ui/button'
import { SeiWalletModal } from './SeiWalletModal'
import { useSeiWallet } from '@/hooks/useSeiWallet'

export function WalletConnectButton() {
  const [showSeiModal, setShowSeiModal] = useState(false)
  const { isSeiConnected, isFullyConnected, mounted } = useSeiWallet()

  if (!mounted) {
    return (
      <Button className="btn-cyber text-sm" disabled>
        Loading...
      </Button>
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
              {ready && (
                <div className="flex items-center">
                  {(() => {
                if (!connected) {
                  return (
                    <Button 
                      onClick={openConnectModal} 
                      className="btn-cyber text-sm"
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
                      variant="destructive"
                      className="text-sm"
                    >
                      Wrong network
                    </Button>
                  )
                }

                return (
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={openChainModal}
                      className="text-sm px-3 py-2 bg-secondary/50 hover:bg-secondary/70 border border-primary/30"
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
                      className="btn-cyber text-sm relative"
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
                      variant={isSeiConnected ? "default" : "outline"}
                      className="text-sm px-2 py-2"
                      type="button"
                      title="Connect Sei Cosmos wallet"
                    >
                      {isSeiConnected ? '🌕' : '🌑'}
                    </Button>
                  </div>
                )
                  })()}
                </div>
              )}
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