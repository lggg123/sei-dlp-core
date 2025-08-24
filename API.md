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

## 💰 Vault Deposit & Withdrawal UX Flow

The following diagram illustrates the complete user experience flow for depositing money into vaults and withdrawing funds:

```mermaid
flowchart TD
    A[User visits /vaults page] --> B[Browse Available Vaults]
    B --> C{Select Vault Action}
    
    C -->|View Details| D[Navigate to /vault?address=X&tab=overview]
    C -->|Quick Deposit| E[Click Deposit Button on Card]
    
    D --> D1[View Vault Details Page]
    D1 --> D2[Enhanced Deposit Button]
    D2 --> E
    
    E --> F[DepositModal Opens]
    F --> G[Enter Deposit Amount]
    G --> H[Review Deposit Details]
    H --> H1[Current APY: XX.X%]
    H --> H2[Fee Tier: X.XX%]
    H --> H3[Lock Period: 24 hours]
    
    H --> I{Confirm Deposit?}
    I -->|Cancel| J[Close Modal]
    I -->|Confirm| K[Connect Wallet]
    
    K --> L[Wallet Connection Check]
    L -->|Not Connected| M[Show Wallet Connect Modal]
    L -->|Connected| N[Initiate Smart Contract Call]
    
    M --> N
    
    N --> O[Call deposit(amount0, amount1, recipient)]
    O --> P[Smart Contract Processing]
    P --> Q{Transaction Success?}
    
    Q -->|Failed| R[Show Error Message]
    Q -->|Success| S[Transaction Confirmed]
    
    R --> F
    S --> T[Update User Balance]
    T --> U[Show Success Notification]
    U --> V[Update Vault TVL]
    V --> W[Apply 24-hour Lock Period]
    
    W --> X[User Can View Position]
    X --> Y[CustomerVaultDashboard Component]
    
    Y --> Z[Dashboard Shows:]
    Z --> Z1[• Your Shares: XXX SEIDLPE]
    Z --> Z2[• Share Value: $XXX.XX]
    Z --> Z3[• Total Deposited: $XXX.XX]
    Z --> Z4[• Unrealized Gains: +/-$XX.XX]
    Z --> Z5[• Lock Status: Remaining Time]
    
    Z --> AA{Lock Period Active?}
    AA -->|Yes| AB[Withdrawal Disabled]
    AA -->|No| AC[Withdrawal Available]
    
    AB --> AD[Show Lock Timer]
    AD --> AE[Lock period: Xh Xm remaining]
    
    AC --> AF[Enable Withdraw Button]
    AF --> AG[Click Withdraw]
    AG --> AH[Enter Withdrawal Shares]
    AH --> AI[Show Withdrawal Preview]
    AI --> AI1[Available Shares: XXX]
    AI --> AI2[Withdrawal Fee: 0.5%]
    AI --> AI3[Estimated Output: Token0 + Token1]
    
    AI --> AJ{Confirm Withdrawal?}
    AJ -->|Cancel| AK[Return to Dashboard]
    AJ -->|Confirm| AL[Call withdraw(shares, recipient)]
    
    AL --> AM[Smart Contract Processing]
    AM --> AN{Withdrawal Success?}
    
    AN -->|Failed| AO[Show Error Message]
    AN -->|Success| AP[Tokens Returned to Wallet]
    
    AO --> AG
    AP --> AQ[Update User Position]
    AQ --> AR[Show Success Notification]
    AR --> AS[Refresh Dashboard Data]
    
    AS --> Y
    
    %% Styling
    classDef processBox fill:#e1f5fe,stroke:#0277bd,stroke-width:2px,color:#000
    classDef decisionBox fill:#fff3e0,stroke:#f57c00,stroke-width:2px,color:#000
    classDef successBox fill:#e8f5e8,stroke:#388e3c,stroke-width:2px,color:#000
    classDef errorBox fill:#ffebee,stroke:#d32f2f,stroke-width:2px,color:#000
    classDef userAction fill:#f3e5f5,stroke:#7b1fa2,stroke-width:2px,color:#000
    
    class A,B,G,H,X,Y,Z processBox
    class C,I,L,Q,AA,AJ,AN decisionBox
    class S,T,U,V,AP,AQ,AR,AS successBox
    class R,AO errorBox
    class E,D2,AG userAction
```

### CustomerVaultDashboard Implementation Status

**✅ IMPLEMENTED** - The `CustomerVaultDashboard.tsx` component is fully implemented with the following features:

1. **Real-time Position Tracking**:
   - User shares (SEIDLPE tokens)
   - Current share value in USD
   - Total deposited amount
   - Unrealized gains/losses calculation

2. **Lock Period Management**:
   - 24-hour minimum lock period for new deposits
   - Real-time countdown timer
   - Visual lock status indicator
   - Disabled withdrawal when locked

3. **Deposit Functionality**:
   - Dual token input (Token0 + Token1)
   - Smart contract integration via wagmi
   - Transaction status tracking
   - Error handling and user feedback

4. **Withdrawal Functionality**:
   - Share-based withdrawal system
   - 0.5% withdrawal fee display
   - Available shares validation
   - Lock period enforcement

5. **Smart Contract Integration**:
   - `getCustomerStats()` for user data
   - `getVaultInfo()` for vault details
   - `deposit()` and `withdraw()` functions
   - Real-time balance updates

The component uses the SEI network's 400ms finality and integrates with the vault smart contracts through the wagmi library for seamless Web3 interactions.

---

**Built for SEI Network** 🚀 - Optimized for 400ms finality and parallel execution
