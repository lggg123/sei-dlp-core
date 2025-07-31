import { connect } from '@sei-js/core/wallet'
import { SigningClient } from '@sei-js/core'

export interface SeiConnection {
  accounts: any[]
  offlineSigner: any
  signingClient?: any
}

/**
 * Connect to a Sei wallet and get signing capabilities
 */
export async function connectSeiWallet(
  walletType: string, 
  chainId: string = 'pacific-1'
): Promise<SeiConnection> {
  try {
    // Determine RPC endpoints based on chain
    const rpcEndpoint = chainId === 'pacific-1' 
      ? 'https://rpc.sei-apis.com' 
      : 'https://rpc-arctic-1.sei-apis.com'
    
    const restEndpoint = chainId === 'pacific-1'
      ? 'https://rest.sei-apis.com'
      : 'https://rest-arctic-1.sei-apis.com'

    // Connect to wallet
    const { accounts, offlineSigner } = connect(
      walletType, 
      chainId, 
      restEndpoint, 
      rpcEndpoint
    )

    // Create signing client for transactions
    const signingClient = await SigningClient.getSigningClient({
      RPC_ENDPOINT: rpcEndpoint,
      offlineSigner
    })

    return {
      accounts,
      offlineSigner,
      signingClient
    }
  } catch (error) {
    console.error('Failed to connect to Sei wallet:', error)
    throw error
  }
}

/**
 * Get chain configuration based on EVM chain ID
 */
export function getSeiChainConfig(evmChainId: number) {
  switch (evmChainId) {
    case 1329: // SEI Mainnet
      return {
        chainId: 'pacific-1',
        rpcEndpoint: 'https://rpc.sei-apis.com',
        restEndpoint: 'https://rest.sei-apis.com',
        name: 'SEI Pacific'
      }
    case 713715: // SEI Testnet
      return {
        chainId: 'arctic-1',
        rpcEndpoint: 'https://rpc-arctic-1.sei-apis.com',
        restEndpoint: 'https://rest-arctic-1.sei-apis.com',
        name: 'SEI Arctic'
      }
    default:
      throw new Error(`Unsupported SEI chain ID: ${evmChainId}`)
  }
}

/**
 * Format Sei address for display
 */
export function formatSeiAddress(address: string, length: number = 8): string {
  if (!address) return ''
  if (address.length <= length * 2) return address
  return `${address.slice(0, length)}...${address.slice(-length)}`
}

/**
 * Check if a wallet is available in the browser
 */
export function isWalletAvailable(walletType: string): boolean {
  if (typeof window === 'undefined') return false
  return !!(window as any)[walletType]
}

/**
 * Get available Sei wallets
 */
export function getAvailableSeiWallets() {
  const supportedWallets = [
    { windowKey: 'keplr', name: 'Keplr' },
    { windowKey: 'leap', name: 'Leap' },
    { windowKey: 'falcon', name: 'Falcon' },
    { windowKey: 'coin98', name: 'Coin98' }
  ]

  return supportedWallets.filter(wallet => isWalletAvailable(wallet.windowKey))
}