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
  // Mock market data - replace with actual DEX/CEX API calls
  const baseData = {
    'SEI-USDC': {
      symbol: 'SEI-USDC',
      price: 0.485,
      change24h: 0.087,
      changePercent24h: 21.83,
      volume24h: 15678234,
      volumeUSD24h: 7603583,
      high24h: 0.512,
      low24h: 0.398,
      marketCap: 485000000,
      circulatingSupply: 1000000000,
      totalSupply: 10000000000,
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
      price: 14.25,
      change24h: -0.125,
      changePercent24h: -0.87,
      volume24h: 8934567,
      volumeUSD24h: 4334234,
      high24h: 14.78,
      low24h: 13.89,
      liquidity: {
        totalLocked: 85000000,
        atom: 5964912,
        sei: 175257732
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
      const basePrice = symbol === 'SEI-USDC' ? 0.485 : 14.25
      
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
