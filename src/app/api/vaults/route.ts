import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

// SEI-specific vault data schema
const VaultSchema = z.object({
  address: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid SEI address'),
  name: z.string().min(1, 'Vault name required'),
  strategy: z.enum(['concentrated_liquidity', 'yield_farming', 'arbitrage', 'hedge', 'stable_max', 'sei_hypergrowth', 'blue_chip', 'delta_neutral']),
  tokenA: z.string(),
  tokenB: z.string(),
  fee: z.number().min(0),
  tickSpacing: z.number().min(1),
  chainId: z.number().refine(id => id === 1328, 'Must be SEI testnet (1328)')
})

const CreateVaultSchema = VaultSchema.omit({ address: true })

/**
 * Get all vaults or create a new vault
 * GET /api/vaults - List all vaults
 * POST /api/vaults - Create new vault
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const strategy = searchParams.get('strategy')
    const active = searchParams.get('active')
    
    // Bull market vault data - synchronized with deployed smart contracts
    const vaults = [
      {
        address: '0xf6A791e4773A60083AA29aaCCDc3bA5E900974fE', // Concentrated Liquidity Vault (testnet)
        name: 'SEI-USDC Concentrated LP',
        strategy: 'concentrated_liquidity',
        tokenA: 'SEI',
        tokenB: 'USDC',
        fee: 0.003,
        tickSpacing: 60,
        tvl: 1250000, // Bull market: $1.25M TVL
        apy: 0.125,
        chainId: 1328,
        active: true,
        performance: {
          totalReturn: 0.087,
          sharpeRatio: 1.45,
          maxDrawdown: 0.023,
          winRate: 0.68
        },
        position: {
          lowerTick: -887220,
          upperTick: 887220,
          liquidity: '1000000000000000000',
          tokensOwed0: '50000000',
          tokensOwed1: '125000000'
        }
      },
      {
        address: '0x6F4cF61bBf63dCe0094CA1fba25545f8c03cd8E6', // Yield Farming Vault (testnet)
        name: 'ATOM-SEI Yield Farm',
        strategy: 'yield_farming',
        tokenA: 'ATOM',
        tokenB: 'SEI',
        fee: 0.003,
        tickSpacing: 60,
        tvl: 850000, // Bull market: $850K TVL
        apy: 0.189,
        chainId: 1328,
        active: true,
        performance: {
          totalReturn: 0.112,
          sharpeRatio: 1.23,
          maxDrawdown: 0.034,
          winRate: 0.72
        }
      },
      {
        address: '0x22Fc4c01FAcE783bD47A1eF2B6504213C85906a1', // Arbitrage Vault (testnet)
        name: 'ETH-USDT Arbitrage Bot',
        strategy: 'arbitrage',
        tokenA: 'ETH',
        tokenB: 'USDT',
        fee: 0.005,
        tickSpacing: 10,
        tvl: 2100000, // Bull market: $2.1M TVL
        apy: 0.267,
        chainId: 1328,
        active: true,
        performance: {
          totalReturn: 0.156,
          sharpeRatio: 2.1,
          maxDrawdown: 0.018,
          winRate: 0.81
        }
      },
      {
        address: '0xCB15AFA183347934DeEbb0F442263f50021EFC01', // Hedge Vault (testnet)
        name: 'BTC-SEI Hedge Strategy',
        strategy: 'hedge',
        tokenA: 'BTC',
        tokenB: 'SEI',
        fee: 0.01,
        tickSpacing: 200,
        tvl: 3400000, // Bull market: $3.4M TVL
        apy: 0.089,
        chainId: 1328,
        active: true,
        performance: {
          totalReturn: 0.045,
          sharpeRatio: 0.98,
          maxDrawdown: 0.012,
          winRate: 0.58
        }
      },
      {
        address: '0x34C0aA990D6e0D099325D7491136BA35FBcdFb38', // Stable Max Vault (testnet)
        name: 'Stable Max Yield Vault',
        strategy: 'stable_max',
        tokenA: 'USDC',
        tokenB: 'DAI',
        fee: 0.0005,
        tickSpacing: 1,
        tvl: 8500000,
        apy: 0.045,
        chainId: 1328,
        active: true,
        performance: {
          totalReturn: 0.022,
          sharpeRatio: 2.34,
          maxDrawdown: 0.003,
          winRate: 0.95
        }
      },
      {
        address: '0x6C0e4d44bcdf6f922637e041FdA4b7c1Fe5667E6', // SEI Hypergrowth Vault (testnet)
        name: 'SEI Hypergrowth Vault',
        strategy: 'sei_hypergrowth',
        tokenA: 'SEI',
        tokenB: 'ETH',
        fee: 0.01,
        tickSpacing: 200,
        tvl: 1800000,
        apy: 0.420,
        chainId: 1328,
        active: true,
        performance: {
          totalReturn: 0.324,
          sharpeRatio: 1.12,
          maxDrawdown: 0.187,
          winRate: 0.63
        }
      },
      {
        address: '0x271115bA107A8F883DE36Eaf3a1CC41a4C5E1a56', // Blue Chip Vault (testnet)
        name: 'Blue Chip DeFi Vault',
        strategy: 'blue_chip',
        tokenA: 'BTC',
        tokenB: 'ETH',
        fee: 0.003,
        tickSpacing: 60,
        tvl: 4200000,
        apy: 0.156,
        chainId: 1328,
        active: true,
        performance: {
          totalReturn: 0.098,
          sharpeRatio: 1.78,
          maxDrawdown: 0.034,
          winRate: 0.76
        }
      },
      {
        address: '0xaE6F27Fdf2D15c067A0Ebc256CE05A317B671B81', // Delta Neutral Vault (testnet)
        name: 'Delta Neutral LP Vault',
        strategy: 'delta_neutral',
        tokenA: 'ETH',
        tokenB: 'USDC',
        fee: 0.003,
        tickSpacing: 60,
        tvl: 3100000,
        apy: 0.155,
        chainId: 1328,
        active: true,
        performance: {
          totalReturn: 0.098,
          sharpeRatio: 2.45,
          maxDrawdown: 0.008,
          winRate: 0.92
        },
        strategy_details: {
          hedge_ratio: 0.95,
          market_neutrality: 0.93,
          revenue_sources: ['lp_fees', 'funding_rates', 'volatility_capture']
        }
      }
    ]

    // Filter by strategy if provided
    let filteredVaults = vaults
    if (strategy) {
      filteredVaults = vaults.filter(vault => vault.strategy === strategy)
    }
    
    // Filter by active status if provided
    if (active !== null) {
      const isActive = active === 'true'
      filteredVaults = filteredVaults.filter(vault => vault.active === isActive)
    }

    return NextResponse.json({
      success: true,
      data: filteredVaults,
      count: filteredVaults.length,
      chainId: 1328
    })
  } catch (error) {
    console.error('Error fetching vaults:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch vaults',
        chainId: 1328
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate request body
    const validatedData = CreateVaultSchema.parse(body)
    
    // SEI-specific validation
    if (validatedData.chainId !== 1328) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid chain ID - must be SEI testnet (1328)' 
        },
        { status: 400 }
      )
    }

    // Mock vault creation - replace with actual smart contr
    // act deployment
    const newVault = {
      ...validatedData,
      address: `0x${Array.from({length: 40}, () => Math.floor(Math.random() * 16).toString(16)).join('')}`,
      tvl: 0,
      apy: 0,
      active: true,
      createdAt: new Date().toISOString(),
      performance: {
        totalReturn: 0,
        sharpeRatio: 0,
        maxDrawdown: 0,
        winRate: 0
      }
    }

    return NextResponse.json({
      success: true,
      data: newVault,
      message: 'Vault created successfully',
      chainId: 1328
    }, { status: 201 })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid request data',
          details: error.errors
        },
        { status: 400 }
      )
    }

    console.error('Error creating vault:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to create vault',
        chainId: 1328
      },
      { status: 500 }
    )
  }
}
