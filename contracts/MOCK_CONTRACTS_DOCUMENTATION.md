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
- **Contract**: `concentratedLiquidityVault`
- **Symbol**: SEIDLP
- **Pool Fee**: 0.30%
- **Mock TVL**: $1,250,000
- **Strategy**: AI-optimized concentrated liquidity ranges

#### 2. **Yield Farming** (ATOM-SEI)
- **Contract**: `yieldFarmingVault`
- **Symbol**: ASMYLP
- **Pool Fee**: 0.30%
- **Mock TVL**: $850,000
- **Strategy**: Cross-chain yield optimization

#### 3. **Arbitrage Bot** (ETH-USDT)
- **Contract**: `arbitrageVault`
- **Symbol**: ETHLP
- **Pool Fee**: 0.50%
- **Mock TVL**: $2,100,000
- **Strategy**: MEV-protected arbitrage execution

#### 4. **Hedge Strategy** (BTC-SEI)
- **Contract**: `hedgeVault`
- **Symbol**: BTCLP
- **Pool Fee**: 1.00%
- **Mock TVL**: $3,400,000
- **Strategy**: Delta-hedged position management

#### 5. **Stable Max Yield** (USDC-DAI)
- **Contract**: `stableMaxVault`
- **Symbol**: STBLP
- **Pool Fee**: 0.05%
- **Mock TVL**: $8,500,000
- **Strategy**: Low-risk stablecoin yield farming

#### 6. **SEI Hypergrowth** (SEI-ETH)
- **Contract**: `seiHypergrowthVault`
- **Symbol**: HGLP
- **Pool Fee**: 1.00%
- **Mock TVL**: $1,800,000
- **Strategy**: High-risk, high-reward SEI exposure

#### 7. **Blue Chip Diversified** (ETH-BTC)
- **Contract**: `blueChipVault`
- **Symbol**: BCLP
- **Pool Fee**: 0.30%
- **Mock TVL**: $5,200,000
- **Strategy**: Large-cap cryptocurrency exposure

#### 8. **Delta Neutral LP** (SEI-USDC)
- **Contract**: `deltaNeutralVault`
- **Symbol**: DNLP
- **Pool Fee**: 0.30%
- **Mock TVL**: $3,200,000
- **Strategy**: Market-neutral liquidity provision

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
string public constant DEVNET_RPC_URL = "https://evm-rpc-devnet.sei-apis.com";
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