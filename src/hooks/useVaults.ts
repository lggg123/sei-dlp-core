import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useVaultStore, VaultData } from '@/stores/vaultStore'
import { useAppStore } from '@/stores/appStore'

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
      // Only set loading in store if it's the client
      if (typeof window !== 'undefined') {
        setLoading(true)
      }
      
      try {
        const params = new URLSearchParams()
        if (filters?.strategy) params.append('strategy', filters.strategy)
        if (filters?.active !== undefined) params.append('active', filters.active.toString())
        
        const response = await fetch(`/api/vaults?${params.toString()}`, {
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
        })
        
        if (!response.ok) {
          const errorText = await response.text()
          throw new Error(`Failed to fetch vaults: ${response.status} ${response.statusText}${errorText ? ` - ${errorText}` : ''}`)
        }
        
        const result: VaultResponse = await response.json()
        
        if (!result.success) {
          throw new Error(result.error || 'Failed to fetch vaults')
        }
        
        // Update store with fetched data (only on client)
        if (typeof window !== 'undefined') {
          setVaults(result.data)
          setError(null)
        }
        
        return result.data
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
        
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
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: typeof window !== 'undefined' ? 60 * 1000 : false, // Only refetch on client
    retry: (failureCount, error) => {
      // Don't retry on 4xx errors or if offline
      if (error instanceof Error && (error.message.includes('4') || !navigator.onLine)) {
        return false
      }
      return failureCount < 3
    },
    enabled: typeof window !== 'undefined', // Only run on client
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
    staleTime: 15 * 1000, // 15 seconds
    refetchInterval: typeof window !== 'undefined' ? 30 * 1000 : false, // 30 seconds
    retry: (failureCount, error) => {
      // Don't retry on 4xx errors
      if (error instanceof Error && error.message.includes('4')) {
        return false
      }
      return failureCount < 3
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
export const useDepositToVault = () => {
  const queryClient = useQueryClient()
  const addNotification = useAppStore((state) => state.addNotification)

  return useMutation({
    mutationFn: async ({ vaultAddress, amount }: { vaultAddress: string; amount: string }) => {
      // This would integrate with your smart contract
      // For now, simulating the deposit
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
        title: 'Deposit Successful',
        message: `Successfully deposited ${variables.amount} tokens`,
      })
    },
    onError: (error) => {
      const errorMessage = error instanceof Error ? error.message : 'Deposit failed'
      addNotification({
        type: 'error',
        title: 'Deposit Failed',
        message: errorMessage,
      })
    },
  })
}

// Withdraw from vault
export const useWithdrawFromVault = () => {
  const queryClient = useQueryClient()
  const addNotification = useAppStore((state) => state.addNotification)

  return useMutation({
    mutationFn: async ({ vaultAddress, shares }: { vaultAddress: string; shares: string }) => {
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