# SEI DLP Core - Mock Contracts Documentation

## Overview

This document describes the mock smart contracts and testing infrastructure for the SEI Dynamic Liquidity Protocol (DLP) Core. The contracts are designed specifically for SEI Network devnet (Chain ID: 713715) and provide comprehensive testing capabilities for AI-driven liquidity management strategies.

## Contract Architecture

### Core Smart Contracts

#### 1. **StrategyVault.sol** - Main AI-Driven Vault
- **Purpose**: Primary vault contract implementing AI-driven dynamic liquidity management
- **Chain ID**: 713715 (SEI devnet)
- **Key Features**:
  - Leverages SEI's 400ms finality for rapid rebalancing
  - AI Oracle integration for automated position management
  - Parallel execution optimization
  - Management fee: 1% | Performance fee: 10%
  - Minimum rebalance interval: 1 hour (leveraging SEI speed)

#### 2. **SEIVault.sol** - SEI-Optimized Single Asset Vault
- **Purpose**: Specialized vault optimized for SEI network characteristics
- **Key Features**:
  - Single asset vault design for simplicity
  - Parallel execution support
  - 400ms finality optimization
  - SEI chain validation
  - Enhanced deposit/withdraw functions with gas optimization

#### 3. **VaultFactory.sol** - Vault Deployment Factory
- **Purpose**: Factory contract for creating new strategy vaults
- **Creation Fee**: 0.1 SEI tokens
- **Features**:
  - Deterministic vault deployment using CREATE2
  - Vault registry and validation
  - Default AI Oracle configuration

#### 4. **AIOracle.sol** - AI Decision Engine
- **Purpose**: Oracle for AI-driven rebalancing decisions with signature verification
- **Key Features**:
  - AI model registration and management
  - Cryptographic signature verification (ECDSA)
  - Performance tracking for AI models
  - Request/response lifecycle management
  - Leverages SEI's fast finality for rapid AI execution

## Mock Token Infrastructure

### Mock Cryptocurrency Supplies

The `DevnetMocks.t.sol` contract deploys realistic mock tokens with appropriate decimal places and supplies:

| Token | Symbol | Total Supply | Decimals | Use Case |
|-------|--------|--------------|----------|----------|
| SEI | SEI | 1,000,000,000 | 18 | Native SEI token |
| USD Coin | USDC | 1,000,000,000 | 6 | Stablecoin for LP pairs |
| Tether | USDT | 1,000,000,000 | 6 | Alternative stablecoin |
| Ethereum | ETH | 120,000,000 | 18 | Blue chip crypto |
| Bitcoin | BTC | 21,000,000 | 8 | Digital gold |
| Cosmos | ATOM | 400,000,000 | 6 | Cosmos ecosystem token |
| Dai Stablecoin | DAI | 5,000,000,000 | 18 | Decentralized stablecoin |

### Mock Token Features
- **Realistic Decimals**: Matches real-world token standards
- **Minting/Burning**: Test functions for liquidity simulation
- **Transfer Functionality**: Full ERC20 compliance
- **Large Supplies**: Enables realistic testing scenarios

## Vault Strategies & Mock Data

### 8 DLP Strategy Implementations

#### 1. **Concentrated Liquidity** (SEI-USDC)
- **Contract**: `ConcentratedLiquidityVault.sol`
- **Symbol**: SEIDLP
- **Pool Fee**: 0.30%
- **Mock TVL**: $1,250,000
- **Strategy**: AI-optimized concentrated liquidity ranges
- **Implementation Logic**:
  - Utilizes Uniswap V3-style concentrated liquidity positions
  - AI Oracle determines optimal tickLower and tickUpper ranges
  - Maximizes fee collection by concentrating liquidity around current price
  - Dynamic range adjustment based on market volatility
  - Integration with SEI's parallel execution for gas optimization
  - Core logic implemented in `_executeConcentratedLiquidityRebalance()` function
  - Uses `AIRebalanceParams` for AI-driven position adjustments
  - Implements signature verification for AI requests
  - Enforces minimum rebalance intervals (1 hour)
  - Tracks executed AI requests to prevent replay attacks
  - Emits `PositionRebalanced` and `AIRebalanceExecuted` events
  - Maintains current position state with tick ranges
  - Calculates total value based on token balances
  - Implements deposit/withdraw with share-based accounting
  - Uses SEI chain validation and emergency pause mechanisms

#### 2. **Yield Farming** (ATOM-SEI)
- **Contract**: `YieldFarmingVault.sol`
- **Symbol**: ASMYLP
- **Pool Fee**: 0.30%
- **Mock TVL**: $850,000
- **Strategy**: Cross-chain yield optimization
- **Implementation Logic**:
  - Cross-chain asset management for ATOM/SEI pairs
  - Yield farming optimization across multiple protocols
  - AI-driven allocation between liquidity provision and staking rewards
  - Automated compound farming strategies
  - IBC integration for cross-chain asset movement
  - Core logic implemented in `_executeYieldFarmingRebalance()` function
  - Uses `AIRebalanceParams` for AI-driven position adjustments
  - Implements signature verification for AI requests
  - Enforces minimum rebalance intervals (1 hour)
  - Tracks executed AI requests to prevent replay attacks
  - Emits `PositionRebalanced` and `AIRebalanceExecuted` events
  - Maintains current position state with tick ranges
  - Calculates total value based on token balances
  - Implements deposit/withdraw with share-based accounting
  - Uses SEI chain validation and emergency pause mechanisms

#### 3. **Arbitrage Bot** (ETH-USDT)
- **Contract**: `ArbitrageVault.sol`
- **Symbol**: ETHLP
- **Pool Fee**: 0.50%
- **Mock TVL**: $2,100,000
- **Strategy**: MEV-protected arbitrage execution
- **Implementation Logic**:
  - MEV protection mechanisms to prevent front-running
  - Real-time price discovery across multiple DEXs
  - AI-driven arbitrage opportunity identification
  - Fast execution leveraging SEI's 400ms finality
  - Risk management with stop-loss mechanisms
  - Core logic implemented in `_executeArbitrageRebalance()` function
  - Uses `AIRebalanceParams` for AI-driven position adjustments
  - Implements signature verification for AI requests
  - Enforces minimum rebalance intervals (1 hour)
  - Tracks executed AI requests to prevent replay attacks
  - Emits `PositionRebalanced` and `AIRebalanceExecuted` events
  - Maintains current position state with tick ranges
  - Calculates total value based on token balances
  - Implements deposit/withdraw with share-based accounting
  - Uses SEI chain validation and emergency pause mechanisms

#### 4. **Hedge Strategy** (BTC-SEI)
- **Contract**: `HedgeVault.sol`
- **Symbol**: BTCLP
- **Pool Fee**: 1.00%
- **Mock TVL**: $3,400,000
- **Strategy**: Delta-hedged position management
- **Implementation Logic**:
  - Delta-neutral hedging strategies
  - Dynamic position sizing based on volatility
  - Options-like exposure without traditional options
  - Risk-adjusted returns through sophisticated hedging
  - Integration with perpetual swap protocols for hedging
  - Core logic implemented in `_executeHedgeRebalance()` function
  - Uses `AIRebalanceParams` for AI-driven position adjustments
  - Implements signature verification for AI requests
  - Enforces minimum rebalance intervals (1 hour)
  - Tracks executed AI requests to prevent replay attacks
  - Emits `PositionRebalanced` and `AIRebalanceExecuted` events
  - Maintains current position state with tick ranges
  - Calculates total value based on token balances
  - Implements deposit/withdraw with share-based accounting
  - Uses SEI chain validation and emergency pause mechanisms

#### 5. **Stable Max Yield** (USDC-DAI)
- **Contract**: `StableMaxVault.sol`
- **Symbol**: STBLP
- **Pool Fee**: 0.05%
- **Mock TVL**: $8,500,000
- **Strategy**: Low-risk stablecoin yield farming
- **Implementation Logic**:
  - Low-risk stable-to-stable pairs with minimal impermanent loss
  - High capital efficiency through stable pair farming
  - Automated yield harvesting and compounding
  - Integration with lending protocols for additional yield
  - Risk monitoring for stablecoin depeg events
  - Core logic implemented in `_executeStableMaxRebalance()` function
  - Uses `AIRebalanceParams` for AI-driven position adjustments
  - Implements signature verification for AI requests
  - Enforces minimum rebalance intervals (1 hour)
  - Tracks executed AI requests to prevent replay attacks
  - Emits `PositionRebalanced` and `AIRebalanceExecuted` events
  - Maintains current position state with tick ranges
  - Calculates total value based on token balances
  - Implements deposit/withdraw with share-based accounting
  - Uses SEI chain validation and emergency pause mechanisms

#### 6. **SEI Hypergrowth** (SEI-ETH)
- **Contract**: `SeiHypergrowthVault.sol`
- **Symbol**: HGLP
- **Pool Fee**: 1.00%
- **Mock TVL**: $1,800,000
- **Strategy**: High-risk, high-reward SEI exposure
- **Implementation Logic**:
  - Concentrated SEI exposure with leverage-like characteristics
  - Growth-oriented position management
  - High volatility tolerance with dynamic risk management
  - SEI ecosystem token integration and optimization
  - Aggressive rebalancing for maximum SEI upside capture
  - Core logic implemented in `_executeHypergrowthRebalance()` function
  - Uses `AIRebalanceParams` for AI-driven position adjustments
  - Implements signature verification for AI requests
  - Enforces minimum rebalance intervals (1 hour)
  - Tracks executed AI requests to prevent replay attacks
  - Emits `PositionRebalanced` and `AIRebalanceExecuted` events
  - Maintains current position state with tick ranges
  - Calculates total value based on token balances
  - Implements deposit/withdraw with share-based accounting
  - Uses SEI chain validation and emergency pause mechanisms

#### 7. **Blue Chip Diversified** (ETH-BTC)
- **Contract**: `BlueChipVault.sol`
- **Symbol**: BCLP
- **Pool Fee**: 0.30%
- **Mock TVL**: $5,200,000
- **Strategy**: Large-cap cryptocurrency exposure
- **Implementation Logic**:
  - Conservative large-cap crypto allocation
  - Balanced exposure to major cryptocurrencies
  - Lower volatility through diversification
  - Long-term value accumulation strategy
  - Institutional-grade risk management
  - Core logic implemented in `_executeBlueChipRebalance()` function
  - Uses `AIRebalanceParams` for AI-driven position adjustments
  - Implements signature verification for AI requests
  - Enforces minimum rebalance intervals (1 hour)
  - Tracks executed AI requests to prevent replay attacks
  - Emits `PositionRebalanced` and `AIRebalanceExecuted` events
  - Maintains current position state with tick ranges
  - Calculates total value based on token balances
  - Implements deposit/withdraw with share-based accounting
  - Uses SEI chain validation and emergency pause mechanisms

#### 8. **Delta Neutral LP** (SEI-USDC)
- **Contract**: `DeltaNeutralVault.sol`
- **Symbol**: DNLP
- **Pool Fee**: 0.30%
- **Mock TVL**: $3,200,000
- **Strategy**: Market-neutral liquidity provision
- **Implementation Logic**:
  - Market-neutral strategies with hedged exposure
  - Liquidity provision with delta-neutral positioning
  - Fee collection without directional risk
  - Sophisticated hedging mechanisms
  - Consistent returns regardless of market direction
  - Core logic implemented in `_executeDeltaNeutralRebalance()` function
  - Uses `AIRebalanceParams` for AI-driven position adjustments
  - Implements signature verification for AI requests
  - Enforces minimum rebalance intervals (1 hour)
  - Tracks executed AI requests to prevent replay attacks
  - Emits `PositionRebalanced` and `AIRebalanceExecuted` events
  - Maintains current position state with tick ranges
  - Calculates total value based on token balances
  - Implements deposit/withdraw with share-based accounting
  - Uses SEI chain validation and emergency pause mechanisms

## Strategy Contract Architecture

### Common Implementation Patterns

All strategy vaults inherit from `IStrategyVault` interface and implement:

#### Core Functions
- `deposit()`: Accepts dual-token deposits, calculates proportional shares
- `withdraw()`: Burns shares, returns proportional token amounts
- `rebalance()`: AI Oracle-driven position optimization
- `getVaultInfo()`: Returns vault metadata and current status
- `getCurrentPosition()`: Returns current liquidity position details

#### Security Features
- **SEI Chain Validation**: `onlySEI()` modifier ensures devnet operation
- **AI Oracle Authentication**: `onlyAIOracle()` for rebalancing authorization
- **Reentrancy Protection**: `nonReentrant` on all state-changing functions
- **Emergency Pause**: Owner-controlled emergency stop mechanism
- **Request Replay Protection**: Prevents duplicate AI rebalancing requests

#### AI Integration Points
- **Signature Verification**: ECDSA signature validation for AI decisions
- **Request ID Tracking**: Prevents replay attacks on AI rebalancing
- **Deadline Enforcement**: Time-bound AI rebalancing requests
- **Gas Optimization**: Leverages SEI's parallel execution capabilities

#### Fee Structure
- **Management Fee**: 1% (100 basis points) annual management fee
- **Performance Fee**: 10% (1000 basis points) on profits
- **Fee Precision**: 10,000 basis points for accurate calculations
- **SEI Optimization**: Fee structure optimized for SEI's low gas costs

### Frontend Integration Points

#### Vault Discovery
- Each vault exposes `getVaultInfo()` for frontend metadata
- Standardized naming convention for strategy identification
- Token pair information for UI display
- Active status for vault filtering

#### User Interface Data
- Total Value Locked (TVL) calculation for display
- Share price calculation for user portfolio valuation
- Current position data for advanced users
- Historical performance tracking (via events)

#### Transaction Interface
- Standardized deposit/withdraw flows across all strategies
- Share-based accounting for proportional ownership
- Gas-optimized operations leveraging SEI features
- Error handling with descriptive revert messages

### ElizaOS Integration

#### AI Agent Communication
- Vault contracts accept AI-signed rebalancing instructions
- Standardized `AIRebalanceParams` structure across all strategies
- Event emission for AI performance tracking
- Gas usage reporting for AI cost optimization

#### Decision Engine Interface
- Each strategy exposes current position data for AI analysis
- Historical performance data through event logs
- Risk metrics calculation for AI decision making
- Market data integration points for strategy optimization

### AI Engine Integration

#### Model Registration
- AI Oracle manages multiple AI models per strategy
- Performance tracking and model comparison
- Signature-based model authentication
- Model versioning and upgrade capabilities

#### Execution Pipeline
- AI models analyze current market conditions
- Generate signed rebalancing instructions
- Vault contracts validate and execute instructions
- Performance feedback loop for model improvement

#### Risk Management
- Minimum rebalance intervals prevent over-trading
- Emergency pause mechanisms for model failures
- Position limits and risk controls per strategy
- Performance monitoring and alerting systems

## Testing & Development Features

### Deposit Testing Workflow

1. **Token Minting**: Mock tokens are minted to test accounts
2. **Approval**: Users approve vault contracts to spend tokens
3. **Deposit Execution**: Vaults calculate shares and mint LP tokens
4. **Share Tracking**: ERC20-compliant share tokens represent vault ownership
5. **Performance Simulation**: Mock TVL and APY data for realistic testing

### Mock Network Configuration

```solidity
uint256 public constant DEVNET_CHAIN_ID = 713715;
string public constant DEVNET_RPC_URL = "https://evm-rpc-arctic-1.sei-apis.com";
```

### Test Account Setup

| Account | Address | Purpose |
|---------|---------|---------|
| Owner | 0x1111...1111 | Contract owner and admin |
| User1 | 0x2222...2222 | Primary test user |
| User2 | 0x3333...3333 | Secondary test user |
| AI Signer | 0x7777...7777 | AI model signature authority |

### Mock Market Data Integration

- **AI Models**: Two registered models for testing
  - `liquidity-optimizer-v1.0`
  - `risk-manager-v1.0`
- **Performance Metrics**: Mock success rates and execution times
- **Request Lifecycle**: Complete AI request/execution simulation

## Security Features

### Access Control
- **Ownable Pattern**: Admin functions protected by ownership
- **ReentrancyGuard**: Protection against reentrancy attacks
- **Chain Validation**: Strict SEI network validation
- **AI Signature Verification**: ECDSA signature validation for AI decisions

### Emergency Controls
- **Emergency Pause**: Vault operations can be halted
- **Resume Functionality**: Operations can be restored
- **Oracle Updates**: AI oracle addresses can be updated
- **Fee Management**: Creation fees can be adjusted

## Deployment Scripts

### DeployScript.sol Features
- **Automated Deployment**: Complete infrastructure deployment
- **Configuration**: AI model registration and vault setup
- **Verification**: SEI network validation
- **Logging**: Comprehensive deployment logging

### Deployment Sequence
1. Mock token deployment (devnet only)
2. AI Oracle deployment with owner configuration
3. Vault Factory deployment with default AI oracle
4. SEI Vault deployment with optimizations
5. Strategy Vault deployment through factory
6. AI model registration and configuration
7. Vault optimization enablement

## Integration with Frontend

The mock contracts provide realistic data that matches the frontend API expectations:

- **Vault Addresses**: Deterministic addresses for consistent testing
- **TVL Data**: Mock total value locked amounts
- **Performance Metrics**: Simulated APY, Sharpe ratios, and risk metrics
- **Strategy Classifications**: All 8 strategy types supported
- **Token Pair Information**: Complete token metadata for UI display

## Gas Optimization

### SEI-Specific Optimizations
- **Parallel Execution**: Enabled where possible
- **400ms Finality**: Optimized for SEI's fast block times
- **Minimal Storage**: Efficient state management
- **Batch Operations**: Multiple operations in single transaction

## Testing Utilities

### Helper Functions
- `getMockVaultByStrategy()`: Retrieve vault by strategy name
- `getMockTokenBySymbol()`: Get token address by symbol
- `getVaultTVL()`: Retrieve mock TVL data
- Comprehensive event logging for debugging

### Test Coverage
- Deposit/withdrawal flows
- AI rebalancing simulation
- Fee calculations
- Emergency scenarios
- Cross-chain interactions
- Performance tracking

This mock contract infrastructure provides a complete testing environment that closely mirrors production conditions while offering the flexibility needed for comprehensive development and testing of the SEI DLP protocol.
