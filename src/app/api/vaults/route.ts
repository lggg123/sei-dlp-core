import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

// SEI-specific vault data schema
const VaultSchema = z.object({
  address: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid SEI address'),
  name: z.string().min(1, 'Vault name required'),
  strategy: z.enum(['concentrated_liquidity', 'yield_farming', 'arbitrage', 'hedge']),
  tokenA: z.string(),
  tokenB: z.string(),
  fee: z.number().min(0),
  tickSpacing: z.number().min(1),
  chainId: z.number().refine(id => id === 713715, 'Must be SEI chain (713715)')
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
    
    // Mock vault data - replace with actual blockchain calls
    const vaults = [
      {
        address: '0x1234567890123456789012345678901234567890',
        name: 'SEI-USDC Concentrated LP',
        strategy: 'concentrated_liquidity',
        tokenA: 'SEI',
        tokenB: 'USDC',
        fee: 0.003,
        tickSpacing: 60,
        tvl: 1250000,
        apy: 0.125,
        chainId: 713715,
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
        address: '0x2345678901234567890123456789012345678901',
        name: 'ATOM-SEI Yield Farm',
        strategy: 'yield_farming',
        tokenA: 'ATOM',
        tokenB: 'SEI',
        fee: 0.003,
        tickSpacing: 60,
        tvl: 850000,
        apy: 0.189,
        chainId: 713715,
        active: true,
        performance: {
          totalReturn: 0.112,
          sharpeRatio: 1.23,
          maxDrawdown: 0.034,
          winRate: 0.72
        }
      },
      {
        address: '0x3456789012345678901234567890123456789012',
        name: 'ETH-USDT Arbitrage Bot',
        strategy: 'arbitrage',
        tokenA: 'ETH',
        tokenB: 'USDT',
        fee: 0.005,
        tickSpacing: 10,
        tvl: 2100000,
        apy: 0.267,
        chainId: 713715,
        active: true,
        performance: {
          totalReturn: 0.156,
          sharpeRatio: 2.1,
          maxDrawdown: 0.018,
          winRate: 0.81
        }
      },
      {
        address: '0x4567890123456789012345678901234567890123',
        name: 'BTC-SEI Hedge Strategy',
        strategy: 'hedge',
        tokenA: 'BTC',
        tokenB: 'SEI',
        fee: 0.01,
        tickSpacing: 200,
        tvl: 3400000,
        apy: 0.089,
        chainId: 713715,
        active: true,
        performance: {
          totalReturn: 0.045,
          sharpeRatio: 0.98,
          maxDrawdown: 0.012,
          winRate: 0.58
        }
      },
      {
        address: '0x5678901234567890123456789012345678901234',
        name: 'OSMO-ATOM Concentrated Range',
        strategy: 'concentrated_liquidity',
        tokenA: 'OSMO',
        tokenB: 'ATOM',
        fee: 0.003,
        tickSpacing: 60,
        tvl: 650000,
        apy: 0.234,
        chainId: 713715,
        active: true,
        performance: {
          totalReturn: 0.198,
          sharpeRatio: 1.67,
          maxDrawdown: 0.041,
          winRate: 0.74
        }
      },
      {
        address: '0x6789012345678901234567890123456789012345',
        name: 'USDC-USDT Stable Yield',
        strategy: 'yield_farming',
        tokenA: 'USDC',
        tokenB: 'USDT',
        fee: 0.001,
        tickSpacing: 1,
        tvl: 5200000,
        apy: 0.067,
        chainId: 713715,
        active: true,
        performance: {
          totalReturn: 0.034,
          sharpeRatio: 1.89,
          maxDrawdown: 0.008,
          winRate: 0.89
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
      chainId: 713715
    })
  } catch (error) {
    console.error('Error fetching vaults:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch vaults',
        chainId: 713715
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
    if (validatedData.chainId !== 713715) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid chain ID - must be SEI (713715)' 
        },
        { status: 400 }
      )
    }

    // Mock vault creation - replace with actual smart contract deployment
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
      chainId: 713715
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
        chainId: 713715
      },
      { status: 500 }
    )
  }
}
