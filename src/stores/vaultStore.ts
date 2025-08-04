import { create } from 'zustand'
import { devtools, subscribeWithSelector } from 'zustand/middleware'

export interface VaultData {
  address: string
  name: string
  strategy: 'concentrated_liquidity' | 'yield_farming' | 'arbitrage' | 'hedge' | 'stable_max' | 'sei_hypergrowth' | 'blue_chip' | 'delta_neutral'
  tokenA: string
  tokenB: string
  fee: number
  tickSpacing: number
  tvl: number
  apy: number
  chainId: number
  active: boolean
  performance: {
    totalReturn: number
    sharpeRatio: number
    maxDrawdown: number
    winRate: number
  }
  position?: {
    lowerTick: number
    upperTick: number
    liquidity: string
    tokensOwed0: string
    tokensOwed1: string
  }
  // UI-specific properties
  color?: string
  description?: string
  totalDeposits?: string
  activeStrategies?: number
  lastRebalance?: string
  aiConfidence?: number
  dailyVolume?: string
  impermanentLoss?: number
}

export interface UserPosition {
  vaultAddress: string
  shares: string
  depositedAmount: string
  currentValue: string
  pnl: number
  pnlPercentage: number
  depositedAt: number
}

interface VaultState {
  // Vault data
  vaults: VaultData[]
  selectedVault: VaultData | null
  userPositions: UserPosition[]
  
  // Filters and sorting
  strategyFilter: string | null
  riskFilter: 'Low' | 'Medium' | 'High' | null
  sortBy: 'apy' | 'tvl' | 'name' | 'performance'
  sortOrder: 'asc' | 'desc'
  
  // Loading states
  isLoading: boolean
  isError: boolean
  error: string | null
  
  // Real-time data
  priceUpdates: Record<string, { price: number; change24h: number; timestamp: number }>
  
  // Actions
  setVaults: (vaults: VaultData[]) => void
  setSelectedVault: (vault: VaultData | null) => void
  addVault: (vault: VaultData) => void
  updateVault: (address: string, updates: Partial<VaultData>) => void
  removeVault: (address: string) => void
  
  setUserPositions: (positions: UserPosition[]) => void
  addUserPosition: (position: UserPosition) => void
  updateUserPosition: (vaultAddress: string, updates: Partial<UserPosition>) => void
  removeUserPosition: (vaultAddress: string) => void
  
  setStrategyFilter: (strategy: string | null) => void
  setRiskFilter: (risk: 'Low' | 'Medium' | 'High' | null) => void
  setSortBy: (sortBy: 'apy' | 'tvl' | 'name' | 'performance') => void
  setSortOrder: (order: 'asc' | 'desc') => void
  
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  
  updatePrices: (updates: Record<string, { price: number; change24h: number }>) => void
  
  // Computed values
  getFilteredVaults: () => VaultData[]
  getVaultByAddress: (address: string) => VaultData | undefined
  getTotalTVL: () => number
  getUserTotalValue: () => number
  getUserTotalPnL: () => number
}

export const useVaultStore = create<VaultState>()(
  devtools(
    subscribeWithSelector((set, get) => ({
      // Initial state
      vaults: [],
      selectedVault: null,
      userPositions: [],
      
      strategyFilter: null,
      riskFilter: null,
      sortBy: 'apy',
      sortOrder: 'desc',
      
      isLoading: false,
      isError: false,
      error: null,
      
      priceUpdates: {},
      
      // Actions
      setVaults: (vaults) => set({ vaults, isLoading: false, isError: false, error: null }),
      setSelectedVault: (vault) => set({ selectedVault: vault }),
      addVault: (vault) => set((state) => ({ vaults: [...state.vaults, vault] })),
      updateVault: (address, updates) =>
        set((state) => ({
          vaults: state.vaults.map((vault) =>
            vault.address === address ? { ...vault, ...updates } : vault
          ),
        })),
      removeVault: (address) =>
        set((state) => ({
          vaults: state.vaults.filter((vault) => vault.address !== address),
        })),
      
      setUserPositions: (positions) => set({ userPositions: positions }),
      addUserPosition: (position) =>
        set((state) => ({ userPositions: [...state.userPositions, position] })),
      updateUserPosition: (vaultAddress, updates) =>
        set((state) => ({
          userPositions: state.userPositions.map((position) =>
            position.vaultAddress === vaultAddress ? { ...position, ...updates } : position
          ),
        })),
      removeUserPosition: (vaultAddress) =>
        set((state) => ({
          userPositions: state.userPositions.filter((position) => position.vaultAddress !== vaultAddress),
        })),
      
      setStrategyFilter: (strategy) => set({ strategyFilter: strategy }),
      setRiskFilter: (risk) => set({ riskFilter: risk }),
      setSortBy: (sortBy) => set({ sortBy }),
      setSortOrder: (order) => set({ sortOrder: order }),
      
      setLoading: (loading) => set({ isLoading: loading }),
      setError: (error) => set({ isError: !!error, error }),
      
      updatePrices: (updates) =>
        set((state) => ({
          priceUpdates: {
            ...state.priceUpdates,
            ...Object.entries(updates).reduce((acc, [symbol, data]) => {
              acc[symbol] = { ...data, timestamp: Date.now() }
              return acc
            }, {} as Record<string, { price: number; change24h: number; timestamp: number }>),
          },
        })),
      
      // Computed values
      getFilteredVaults: () => {
        const state = get()
        let filtered = [...state.vaults]
        
        // Apply filters
        if (state.strategyFilter) {
          filtered = filtered.filter((vault) => vault.strategy === state.strategyFilter)
        }
        
        if (state.riskFilter) {
          // Map risk levels based on APY ranges (this is a simple example)
          const riskMapping = (apy: number) => {
            if (apy < 15) return 'Low'
            if (apy < 25) return 'Medium'
            return 'High'
          }
          filtered = filtered.filter((vault) => riskMapping(vault.apy) === state.riskFilter)
        }
        
        // Apply sorting
        filtered.sort((a, b) => {
          let comparison = 0
          
          switch (state.sortBy) {
            case 'apy':
              comparison = a.apy - b.apy
              break
            case 'tvl':
              comparison = a.tvl - b.tvl
              break
            case 'name':
              comparison = a.name.localeCompare(b.name)
              break
            case 'performance':
              comparison = a.performance.totalReturn - b.performance.totalReturn
              break
          }
          
          return state.sortOrder === 'asc' ? comparison : -comparison
        })
        
        return filtered
      },
      
      getTotalTVL: () => {
        return get().vaults.reduce((total, vault) => total + vault.tvl, 0)
      },
      
      getUserTotalValue: () => {
        return get().userPositions.reduce((total, position) => total + parseFloat(position.currentValue), 0)
      },
      
      getUserTotalPnL: () => {
        return get().userPositions.reduce((total, position) => total + position.pnl, 0)
      },
      
      getVaultByAddress: (address) => {
        return get().vaults.find((vault) => vault.address === address)
      },
    })),
    {
      name: 'vault-store',
    }
  )
)