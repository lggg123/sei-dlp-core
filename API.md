# SEI DLP Core API

A comprehensive RESTful API for the SEI Dynamic Liquidity Protocol, featuring AI-powered vault optimization, real-time market data, and arbitrage opportunities.

## 🚀 Features

- **AI-Powered Predictions**: Advanced machine learning models for optimal liquidity range predictions
- **Vault Management**: Complete CRUD operations for dynamic liquidity vaults
- **Real-time Market Data**: Live and historical market data from SEI ecosystem
- **Arbitrage Scanning**: Cross-DEX arbitrage opportunity detection with AI ranking
- **SEI-Optimized**: Built specifically for SEI's 400ms finality and parallel execution
- **Type-Safe**: Full TypeScript implementation with Zod validation
- **Rate Limited**: Built-in rate limiting and security features

## 📊 API Endpoints

### Health & Documentation
- `GET /api/health` - System health check
- `GET /api/docs` - Complete API documentation
- `GET /api/test` - Development test endpoint

### Vault Management
- `GET /api/vaults` - List all vaults with filtering
- `POST /api/vaults` - Create new vault
- `GET /api/vaults/{address}` - Get vault details
- `PATCH /api/vaults/{address}` - Update vault configuration
- `DELETE /api/vaults/{address}` - Delete/deactivate vault

### AI-Powered Features
- `POST /api/ai/predict` - Generate optimal range predictions
- `POST /api/ai/rebalance` - Trigger intelligent rebalancing

### Market Data
- `GET /api/market/data` - Current market data
- `POST /api/market/data` - Historical market data
- `GET /api/market/arbitrage` - Scan arbitrage opportunities
- `POST /api/market/arbitrage` - Advanced arbitrage scanning with AI

## 🔧 Quick Start

### Start Development Server
```bash
npm run dev
```

### Test API Endpoints
```bash
# Health check
curl http://localhost:3000/api/health

# Get vaults
curl http://localhost:3000/api/vaults

# Market data
curl "http://localhost:3000/api/market/data?symbols=SEI-USDC"

# AI prediction
curl -X POST http://localhost:3000/api/ai/predict \\
  -H "Content-Type: application/json" \\
  -d '{
    "vaultAddress": "0x1234567890123456789012345678901234567890",
    "marketData": {
      "currentPrice": 0.485,
      "volume24h": 15678234,
      "volatility": 0.25,
      "liquidity": 125000000
    },
    "timeframe": "1d",
    "chainId": 713715
  }'
```

## 🏗️ Architecture

### Technology Stack
- **Next.js 14** - App Router with serverless functions
- **TypeScript** - Type-safe development
- **Zod** - Runtime validation
- **SEI Network** - Optimized for 400ms finality

### Response Format
All endpoints return standardized responses:
```typescript
{
  "success": boolean,
  "data": any,
  "error"?: string,
  "metadata"?: any,
  "timestamp": string,
  "chainId": 713715
}
```

### Authentication
- **Public Endpoints**: Health, market data, vault listing
- **Authenticated Endpoints**: AI features, vault management
- **API Key**: Include `X-API-Key` header for authenticated requests

### Rate Limiting
- **Limit**: 100 requests per minute per IP
- **Headers**: `X-RateLimit-*` headers included in responses
- **Handling**: 429 status code when limit exceeded

## 📈 SEI-Specific Optimizations

### Performance Features
- **Fast Finality**: 400ms block time optimization
- **Parallel Execution**: Concurrent transaction processing
- **Low Gas Costs**: Efficient gas estimation and optimization
- **MEV Protection**: Built-in MEV resistance features

### Chain Configuration
```typescript
{
  CHAIN_ID: 713715,
  RPC_URL: 'https://evm-rpc.sei-apis.com',
  BLOCK_TIME: 400, // milliseconds
  NATIVE_TOKEN: 'SEI'
}
```

## 🤖 AI Integration

### Features
- **Optimal Range Prediction**: ML-powered liquidity range optimization
- **Risk Assessment**: Advanced risk metrics and scoring
- **Rebalancing Signals**: Intelligent rebalancing recommendations
- **Market Analysis**: Real-time market sentiment and trend analysis

### Python AI Engine Integration
The API integrates with the SEI DLP AI Engine (`/ai-engine`) which provides:
- **99% Test Coverage**: Comprehensive test suite
- **Advanced ML Models**: RandomForest, ONNX, and statistical fallbacks
- **SEI-Specific Optimization**: Chain-aware predictions and gas optimization

## 📚 Data Types

### Vault
```typescript
interface Vault {
  address: string
  name: string
  strategy: 'concentrated_liquidity' | 'yield_farming' | 'arbitrage' | 'hedge'
  tokenA: string
  tokenB: string
  fee: number
  tickSpacing: number
  tvl: number
  apy: number
  chainId: 713715
  active: boolean
  performance: VaultPerformance
  position?: VaultPosition
  risk?: VaultRisk
}
```

### AI Prediction
```typescript
interface AIPrediction {
  vaultAddress: string
  prediction: {
    optimalRange: OptimalRange
    confidence: number
    expectedReturn: ExpectedReturn
    riskMetrics: RiskMetrics
    seiOptimizations: SeiOptimizations
  }
}
```

### Market Data
```typescript
interface MarketData {
  symbol: string
  price: number
  change24h: number
  volume24h: number
  liquidity: object
  seiMetrics?: {
    blockTime: number
    tps: number
    gasPrice: number
  }
}
```

## 🔒 Security Features

- **Input Validation**: Comprehensive Zod schema validation
- **Rate Limiting**: IP-based request throttling
- **CORS**: Configurable cross-origin resource sharing
- **Error Handling**: Standardized error responses
- **Chain Validation**: SEI chain ID verification

## 🌐 Supported Tokens & Exchanges

### Tokens
- SEI, USDC, USDT, ATOM, ETH, BTC

### Exchanges
- DragonSwap, SeiSwap, AstroPort, WhiteWhale

## 📖 Examples

### Create Vault
```typescript
const vault = await fetch('/api/vaults', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': 'your-api-key'
  },
  body: JSON.stringify({
    name: 'SEI-USDC Concentrated LP',
    strategy: 'concentrated_liquidity',
    tokenA: 'SEI',
    tokenB: 'USDC',
    fee: 0.003,
    tickSpacing: 60,
    chainId: 713715
  })
})
```

### Get AI Prediction
```typescript
const prediction = await fetch('/api/ai/predict', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': 'your-api-key'
  },
  body: JSON.stringify({
    vaultAddress: '0x...',
    marketData: {
      currentPrice: 0.485,
      volume24h: 15678234,
      volatility: 0.25,
      liquidity: 125000000
    },
    timeframe: '1d',
    chainId: 713715
  })
})
```

## 🚀 Deployment

### Environment Variables
```bash
NEXT_PUBLIC_API_URL=https://your-domain.com/api
SEI_RPC_URL=https://evm-rpc.sei-apis.com
AI_ENGINE_URL=http://localhost:8000
```

### Production Considerations
- **Caching**: Implement Redis for market data caching
- **Database**: Add PostgreSQL for persistent vault storage
- **Monitoring**: Set up API monitoring and alerts
- **Scaling**: Configure auto-scaling for high traffic

## 📝 Contributing

1. Follow SEI DLP coding standards
2. Add comprehensive tests for new endpoints
3. Update API documentation
4. Ensure type safety with TypeScript
5. Test with real SEI network integration

## 🔗 Related Projects

- **AI Engine**: `/ai-engine` - Python ML models with 99% test coverage
- **Frontend**: React components for vault management
- **Smart Contracts**: Solidity contracts on SEI Network

---

**Built for SEI Network** 🚀 - Optimized for 400ms finality and parallel execution
