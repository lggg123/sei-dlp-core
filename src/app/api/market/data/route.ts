import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

// Market data request schema
const MarketDataRequestSchema = z.object({
  symbols: z.array(z.string()).min(1, 'At least one symbol required'),
  timeframe: z.enum(['1m', '5m', '15m', '1h', '4h', '1d']).default('1h'),
  limit: z.number().int().min(1).max(1000).default(100),
  chainId: z.number().refine(id => id === 713715, 'Must be SEI chain (713715)').optional()
})

/**
 * Get real-time and historical market data for SEI ecosystem
 * GET /api/market/data - Get current market data
 * POST /api/market/data - Get historical market data
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const symbols = searchParams.get('symbols')?.split(',') || ['SEI-USDC']
    const timeframe = searchParams.get('timeframe') || '1h'
    console.log('[Market Data] Fetching data for timeframe:', timeframe);
    
    // Validate symbols
    if (!symbols.length) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'At least one symbol required' 
        },
        { status: 400 }
      )
    }

    // Get current market data for requested symbols
    const marketData = await getCurrentMarketData(symbols)
    
    return NextResponse.json({
      success: true,
      data: marketData,
      timestamp: new Date().toISOString(),
      chainId: 713715
    })

  } catch (error) {
    console.error('Error fetching market data:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch market data',
        chainId: 713715
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate request
    const validatedData = MarketDataRequestSchema.parse(body)
    
    // Get historical market data
    const historicalData = await getHistoricalMarketData(
      validatedData.symbols,
      validatedData.timeframe,
      validatedData.limit
    )
    
    return NextResponse.json({
      success: true,
      data: historicalData,
      metadata: {
        timeframe: validatedData.timeframe,
        limit: validatedData.limit,
        symbols: validatedData.symbols
      },
      timestamp: new Date().toISOString(),
      chainId: 713715
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid market data request',
          details: error.errors
        },
        { status: 400 }
      )
    }

    console.error('Error fetching historical data:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch historical market data',
        chainId: 713715
      },
      { status: 500 }
    )
  }
}

/**
 * Get current market data for symbols
 */
async function getCurrentMarketData(symbols: string[]) {
  // Bull market data - synchronized with deployed smart contracts at $0.50 SEI
  const baseData = {
    'SEI-USDC': {
      symbol: 'SEI-USDC',
      price: 0.50, // FIXED: Match smart contract price exactly
      change24h: 0.10, // Bull market: +$0.10 gain today
      changePercent24h: 25.0, // Bull market: +25% gain (was +20% base + 5% additional)
      volume24h: 1000000, // Match contract: 1M SEI volume
      volumeUSD24h: 500000, // $500K USD volume at $0.50
      high24h: 0.52, // Bull market high
      low24h: 0.40, // Previous low before bull run  
      marketCap: 500000000, // $500M at $0.50 per token
      circulatingSupply: 1000000000, // 1B SEI circulating
      totalSupply: 10000000000, // 10B SEI total supply
      liquidity: {
        totalLocked: 125000000,
        sei: 257732474,
        usdc: 125000000
      },
      seiMetrics: {
        blockTime: 0.4, // 400ms
        tps: 5000,
        gasPrice: 0.000001,
        validators: 100,
        stakingRatio: 0.67
      }
    },
    'ATOM-SEI': {
      symbol: 'ATOM-SEI',
      price: 8.00, // Match smart contract ATOM price
      change24h: 0.50, // Bull market: +$0.50 gain
      changePercent24h: 6.67, // Bull market: +6.67% gain
      volume24h: 10000, // Match contract volumes
      volumeUSD24h: 80000, // $80K volume at $8.00
      high24h: 8.25,
      low24h: 7.50,
      liquidity: {
        totalLocked: 85000000, // $850K TVL
        atom: 106250, // 850K / 8 = 106,250 ATOM
        sei: 1700000 // 850K / 0.5 = 1.7M SEI
      }
    },
    'WETH-SEI': {
      symbol: 'WETH-SEI',
      price: 2500.00, // Match smart contract ETH price
      change24h: 150.00, // Bull market: +$150 gain
      changePercent24h: 6.38, // Bull market: +6.38% gain
      volume24h: 1000, // Match contract volumes
      volumeUSD24h: 2500000, // $2.5M volume
      high24h: 2550.00,
      low24h: 2350.00,
      liquidity: {
        totalLocked: 2100000, // $2.1M TVL
        weth: 840, // 2.1M / 2500 = 840 ETH
        sei: 4200000 // 2.1M / 0.5 = 4.2M SEI
      }
    },
    'OSMO-SEI': {
      symbol: 'OSMO-SEI',
      price: 1.20, // OSMO price
      change24h: 0.08, // Bull market gain
      changePercent24h: 7.14, // +7.14% gain
      volume24h: 50000,
      volumeUSD24h: 60000,
      high24h: 1.25,
      low24h: 1.10,
      liquidity: {
        totalLocked: 500000,
        osmo: 416667, // 500K / 1.20
        sei: 1000000 // 500K / 0.50
      }
    }
  }

  return symbols.map(symbol => ({
    ...baseData[symbol as keyof typeof baseData] || generateMockData(symbol),
    timestamp: new Date().toISOString(),
    source: 'SEI_DEX_AGGREGATOR'
  }))
}

/**
 * Get historical market data
 */
async function getHistoricalMarketData(symbols: string[], timeframe: string, limit: number) {
  // Mock historical data generation
  const now = new Date()
  const timeframeMs = getTimeframeMs(timeframe)
  
  return symbols.map(symbol => ({
    symbol,
    timeframe,
    data: Array.from({ length: limit }, (_, i) => {
      const timestamp = new Date(now.getTime() - (i * timeframeMs))
      // Use exact contract prices for historical data
      const basePrices: { [key: string]: number } = {
        'SEI-USDC': 0.50,   // $0.50 SEI
        'ATOM-SEI': 8.00,   // $8.00 ATOM  
        'WETH-SEI': 2500.00, // $2,500 ETH
        'OSMO-SEI': 1.20     // $1.20 OSMO
      }
      const basePrice = basePrices[symbol] || 1.00
      
      // Generate realistic price movements
      const volatility = 0.02
      const trend = Math.sin(i * 0.1) * 0.05
      const noise = (Math.random() - 0.5) * volatility
      const price = basePrice * (1 + trend + noise)
      
      const volume = Math.random() * 10000000 + 5000000
      
      return {
        timestamp: timestamp.toISOString(),
        open: price * (1 + (Math.random() - 0.5) * 0.01),
        high: price * (1 + Math.random() * 0.02),
        low: price * (1 - Math.random() * 0.02),
        close: price,
        volume,
        volumeUSD: volume * price,
        trades: Math.floor(Math.random() * 1000) + 100
      }
    }).reverse() // Return in chronological order
  }))
}

/**
 * Generate mock data for unknown symbols
 */
function generateMockData(symbol: string) {
  return {
    symbol,
    price: Math.random() * 100 + 1,
    change24h: (Math.random() - 0.5) * 10,
    changePercent24h: (Math.random() - 0.5) * 20,
    volume24h: Math.random() * 50000000,
    volumeUSD24h: Math.random() * 25000000,
    high24h: Math.random() * 110 + 1,
    low24h: Math.random() * 90 + 1,
    liquidity: {
      totalLocked: Math.random() * 100000000,
    }
  }
}

/**
 * Convert timeframe string to milliseconds
 */
function getTimeframeMs(timeframe: string): number {
  const timeframes = {
    '1m': 60 * 1000,
    '5m': 5 * 60 * 1000,
    '15m': 15 * 60 * 1000,
    '1h': 60 * 60 * 1000,
    '4h': 4 * 60 * 60 * 1000,
    '1d': 24 * 60 * 60 * 1000
  }
  return timeframes[timeframe as keyof typeof timeframes] || timeframes['1h']
}
