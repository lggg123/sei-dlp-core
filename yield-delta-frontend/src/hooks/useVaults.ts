import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useVaultStore, VaultData } from '@/stores/vaultStore'
import { useAppStore } from '@/stores/appStore'
import { useWriteContract, useAccount } from 'wagmi'
import { parseUnits } from 'viem'
import SEIVault from '@/lib/abis/SEIVault'

interface VaultResponse {
  success: boolean
  data: VaultData[]
  count: number
  chainId: number
  error?: string
}

interface CreateVaultRequest {
  name: string
  strategy: 'concentrated_liquidity' | 'yield_farming' | 'arbitrage' | 'hedge' | 'stable_max' | 'sei_hypergrowth' | 'blue_chip' | 'delta_neutral'
  tokenA: string
  tokenB: string
  fee: number
  tickSpacing: number
  chainId: number
}

export const VAULT_QUERY_KEYS = {
  all: ['vaults'] as const,
  lists: () => [...VAULT_QUERY_KEYS.all, 'list'] as const,
  list: (filters: Record<string, unknown>) => [...VAULT_QUERY_KEYS.lists(), filters] as const,
  details: () => [...VAULT_QUERY_KEYS.all, 'detail'] as const,
  detail: (address: string) => [...VAULT_QUERY_KEYS.details(), address] as const,
  positions: (walletAddress: string) => [...VAULT_QUERY_KEYS.all, 'positions', walletAddress] as const,
}

// Fetch all vaults
export const useVaults = (filters?: { strategy?: string; active?: boolean }) => {
  const setVaults = useVaultStore((state) => state.setVaults)
  const setLoading = useVaultStore((state) => state.setLoading)
  const setError = useVaultStore((state) => state.setError)
  const addNotification = useAppStore((state) => state.addNotification)

  return useQuery({
    queryKey: VAULT_QUERY_KEYS.list(filters || {}),
    queryFn: async (): Promise<VaultData[]> => {
      console.log('[useVaults] queryFn called - starting fetch');

      // Only set loading in store if it's the client
      if (typeof window !== 'undefined') {
        setLoading(true)
      }

      try {
        const params = new URLSearchParams()
        if (filters?.strategy) params.append('strategy', filters.strategy)
        if (filters?.active !== undefined) params.append('active', filters.active.toString())

        const url = `/api/vaults?${params.toString()}`;
        console.log('[useVaults] Fetching from URL:', url);

        const response = await fetch(url, {
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
        })

        console.log('[useVaults] Response received:', {
          status: response.status,
          statusText: response.statusText,
          ok: response.ok,
          headers: Object.fromEntries(response.headers.entries())
        });

        if (!response.ok) {
          const errorText = await response.text()
          throw new Error(`Failed to fetch vaults: ${response.status} ${response.statusText}${errorText ? ` - ${errorText}` : ''}`)
        }

        const result: VaultResponse = await response.json()
        console.log('[useVaults] API response:', result);

        if (!result.success) {
          throw new Error(result.error || 'Failed to fetch vaults')
        }

        console.log('[useVaults] Successfully fetched', result.data.length, 'vaults');

        // Update store with fetched data (only on client)
        if (typeof window !== 'undefined') {
          setVaults(result.data)
          setError(null)
        }

        return result.data
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
        console.error('[useVaults] Fetch error:', error);
        console.error('[useVaults] Error details:', {
          message: errorMessage,
          stack: error instanceof Error ? error.stack : 'No stack',
          name: error instanceof Error ? error.name : 'Unknown error type'
        });

        // Only update store and show notifications on client
        if (typeof window !== 'undefined') {
          setError(errorMessage)
          addNotification({
            type: 'error',
            title: 'Failed to fetch vaults',
            message: errorMessage,
          })
        }

        throw error
      } finally {
        // Only set loading in store if it's the client
        if (typeof window !== 'undefined') {
          setLoading(false)
        }
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes - much longer to reduce requests
    refetchInterval: false, // CRITICAL: Disable automatic refetch to prevent provider conflicts
    refetchOnWindowFocus: false, // CRITICAL: Prevent focus-based refetch
    refetchOnReconnect: false, // CRITICAL: Prevent reconnect-based refetch
    refetchOnMount: true, // Only refetch on mount
    retry: (failureCount, error) => {
      // Don't retry on 4xx errors, wallet errors, or if offline
      if (error instanceof Error && (
        error.message.includes('4') ||
        error.message.includes('MetaMask') ||
        error.message.includes('eth_accounts') ||
        !navigator.onLine
      )) {
        return false
      }
      return failureCount < 2 // Reduced retries
    },
    enabled: typeof window !== 'undefined', // Only enable on client side
  })
}

// Fetch single vault details
export const useVault = (address: string) => {
  return useQuery({
    queryKey: VAULT_QUERY_KEYS.detail(address),
    queryFn: async (): Promise<VaultData> => {
      const response = await fetch(`/api/vaults/${address}`, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Failed to fetch vault: ${response.status} ${response.statusText}${errorText ? ` - ${errorText}` : ''}`)
      }

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch vault')
      }

      return result.data
    },
    enabled: !!address && typeof window !== 'undefined',
    staleTime: 3 * 60 * 1000, // 3 minutes - longer stale time
    refetchInterval: false, // CRITICAL: Disable automatic refetch
    refetchOnWindowFocus: false, // CRITICAL: Prevent focus-based refetch
    refetchOnReconnect: false, // CRITICAL: Prevent reconnect-based refetch
    retry: (failureCount, error) => {
      // Don't retry on 4xx errors or wallet errors
      if (error instanceof Error && (
        error.message.includes('4') ||
        error.message.includes('MetaMask') ||
        error.message.includes('eth_accounts')
      )) {
        return false
      }
      return failureCount < 2 // Reduced retries
    },
  })
}

// Create new vault
export const useCreateVault = () => {
  const queryClient = useQueryClient()
  const addVault = useVaultStore((state) => state.addVault)
  const addNotification = useAppStore((state) => state.addNotification)

  return useMutation({
    mutationFn: async (vaultData: CreateVaultRequest): Promise<VaultData> => {
      const response = await fetch('/api/vaults', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(vaultData),
      })

      if (!response.ok) {
        throw new Error(`Failed to create vault: ${response.statusText}`)
      }

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to create vault')
      }

      return result.data
    },
    onSuccess: (newVault) => {
      // Update store
      addVault(newVault)

      // Invalidate and refetch vault lists
      queryClient.invalidateQueries({ queryKey: VAULT_QUERY_KEYS.lists() })

      // Success notification
      addNotification({
        type: 'success',
        title: 'Vault Created',
        message: `${newVault.name} has been successfully created`,
      })
    },
    onError: (error) => {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      addNotification({
        type: 'error',
        title: 'Failed to create vault',
        message: errorMessage,
      })
    },
  })
}

// Get user positions
export const useUserPositions = (walletAddress: string) => {
  const setUserPositions = useVaultStore((state) => state.setUserPositions)

  return useQuery({
    queryKey: VAULT_QUERY_KEYS.positions(walletAddress),
    queryFn: async () => {
      // This would typically call your backend API
      // For now, returning mock data
      const positions = [
        {
          vaultAddress: '0x1234567890123456789012345678901234567890',
          shares: '1000000000000000000',
          depositedAmount: '1000',
          currentValue: '1087',
          pnl: 87,
          pnlPercentage: 8.7,
          depositedAt: Date.now() - 7 * 24 * 60 * 60 * 1000, // 7 days ago
        },
      ]

      setUserPositions(positions)
      return positions
    },
    enabled: !!walletAddress,
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000,
  })
}

// Deposit to vault
export const useDepositToVault = (vaultAddress: string) => {
  const { writeContract, data: hash, error, isPending, isSuccess, isError } = useWriteContract()
  const { address } = useAccount()
  const queryClient = useQueryClient()
  const addNotification = useAppStore((state) => state.addNotification)

  const deposit = async (amount: string): Promise<string> => {
    if (!address) {
      throw new Error('Wallet not connected')
    }

    if (!vaultAddress) {
      throw new Error('Vault address not provided')
    }

    // Enhanced validation for SEI testnet vault addresses
    const validTestnetVaults = [
      // NEW FIXED VAULTS - Deployed 2024
      '0xAC64527866CCfA796Fa87A257B3f927179a895e6', // Native SEI Vault (FIXED)
      '0xcF796aEDcC293db74829e77df7c26F482c9dBEC0', // ERC20 USDC Vault (FIXED)

      // Legacy vault addresses (for backwards compatibility)
      '0xf6A791e4773A60083AA29aaCCDc3bA5E900974fE',
      '0x6F4cF61bBf63dCe0094CA1fba25545f8c03cd8E6',
      '0x22Fc4c01FAcE783bD47A1eF2B6504213C85906a1',
      '0xCB15AFA183347934DeEbb0F442263f50021EFC01',
      '0x34C0aA990D6e0D099325D7491136BA35FBcdFb38',
      '0x6C0e4d44bcdf6f922637e041FdA4b7c1Fe5667E6',
      '0x271115bA107A8F883DE36Eaf3a1CC41a4C5E1a56',
      '0xaE6F27Fdf2D15c067A0Ebc256CE05A317B671B81'
    ]

    const normalizedVaultAddress = vaultAddress.toLowerCase()
    const isValidTestnetVault = validTestnetVaults.some(addr => addr.toLowerCase() === normalizedVaultAddress)

    if (!isValidTestnetVault) {
      console.error('[useDepositToVault] Invalid vault address for testnet:', vaultAddress)
      throw new Error(`Vault address ${vaultAddress} is not deployed on SEI Atlantic-2 testnet (Chain ID 1328). Please use a valid testnet vault address.`)
    }

    const amountInWei = parseUnits(amount, 18)

    try {
      console.log('[useDepositToVault] Initiating deposit with validated address:', {
        vaultAddress,
        amount,
        amountInWei: amountInWei.toString(),
        userAddress: address
      })

      // Call writeContract - this triggers the transaction
      // Note: This contract expects ERC20 token approval, not native SEI
      writeContract({
        address: vaultAddress.startsWith('0x') ? vaultAddress as `0x${string}` : `0x${vaultAddress}` as `0x${string}`,
        abi: SEIVault.abi,
        functionName: 'seiOptimizedDeposit',
        args: [amountInWei, address],
        // No value parameter - this contract uses transferFrom for ERC20 tokens
      })

      // The writeContract function returns void, but the hook will update with the hash
      // We return a resolved Promise immediately since the actual transaction handling
      // is done through the wagmi hooks (isSuccess, isError, etc.)
      return Promise.resolve('pending')
    } catch (err) {
      // Handle any synchronous errors
      console.error('Deposit error:', err)
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'

      // Enhanced error messaging for common issues
      let userFriendlyMessage = errorMessage
      if (errorMessage.includes('execution reverted')) {
        userFriendlyMessage = 'Transaction failed: Contract execution reverted. Please check your balance and try again.'
      } else if (errorMessage.includes('insufficient funds')) {
        userFriendlyMessage = 'Insufficient funds for this transaction including gas fees.'
      } else if (errorMessage.includes('user rejected')) {
        userFriendlyMessage = 'Transaction was rejected. Please try again.'
      }

      addNotification({
        type: 'error',
        title: 'Deposit Failed',
        message: userFriendlyMessage,
      })
      throw err
    }
  }

  // Handle success and error states through effects in the component
  return {
    deposit,
    hash,
    error,
    isPending,
    isSuccess,
    isError,
    // Add helper to invalidate queries when needed
    invalidateQueries: () => {
      queryClient.invalidateQueries({ queryKey: VAULT_QUERY_KEYS.detail(vaultAddress) })
      queryClient.invalidateQueries({ queryKey: VAULT_QUERY_KEYS.lists() })
    }
  }
}

// Withdraw from vault
export const useWithdrawFromVault = () => {
  const queryClient = useQueryClient()
  const addNotification = useAppStore((state) => state.addNotification)

  return useMutation({
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    mutationFn: async (_params: { vaultAddress: string; shares: string }) => {
      // This would integrate with your smart contract
      // For now, simulating the withdrawal
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({ success: true, txHash: '0x...' })
        }, 2000)
      })
    },
    onSuccess: (_, variables) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: VAULT_QUERY_KEYS.detail(variables.vaultAddress) })
      queryClient.invalidateQueries({ queryKey: VAULT_QUERY_KEYS.lists() })

      addNotification({
        type: 'success',
        title: 'Withdrawal Successful',
        message: `Successfully withdrew ${variables.shares} shares`,
      })
    },
    onError: (error) => {
      const errorMessage = error instanceof Error ? error.message : 'Withdrawal failed'
      addNotification({
        type: 'error',
        title: 'Withdrawal Failed',
        message: errorMessage,
      })
    },
  })
}
