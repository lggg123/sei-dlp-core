# SEI DLP Smart Contracts

**SEI Dynamic Liquidity Protocol contracts optimized for SEI EVM with 400ms finality.**

## Project Structure

```
contracts/
├── src/                    # Core contracts
│   ├── SEIVault.sol       # Main vault implementation
│   ├── VaultFactory.sol   # Vault deployment factory
│   ├── AIOracle.sol       # AI model integration
│   ├── StrategyVault.sol  # Base strategy implementation
│   └── strategies/        # Strategy vault implementations
├── script/                # Deployment scripts
│   ├── Deploy.s.sol       # Full production deployment
│   ├── SimpleDeploy.s.sol # Simplified devnet deployment
│   ├── VerifyTestUsers.s.sol # Test user verification
│   └── FundTestUser.s.sol # Additional user funding
├── test/                  # Comprehensive test suite
└── TEST_USER_GUIDE.md     # Test user funding guide
```

## Quick Start

### Deploy to SEI Devnet
```shell
forge script script/Deploy.s.sol --rpc-url https://evm-rpc-arctic-1.sei-apis.com --broadcast
```

### Run Tests
```shell
forge test
```

### Verify Test User Funding
```shell
forge script script/VerifyTestUsers.s.sol --rpc-url https://evm-rpc-arctic-1.sei-apis.com
```

## Features

### ✅ SEI Network Optimizations
- **Parallel Execution**: Optimized for SEI's parallel transaction processing
- **400ms Finality**: Leverages SEI's fast block times
- **Chain Validation**: Ensures deployment only on SEI (Chain ID: 713715)

### ✅ AI-Driven Strategies
- **8 Strategy Vaults**: Concentrated liquidity, yield farming, arbitrage, etc.
- **AI Oracle Integration**: Real-time strategy optimization
- **Dynamic Rebalancing**: Automated position management

### ✅ Test User Infrastructure
- **3 Pre-funded Test Users**: Balanced, conservative, and whale portfolios
- **7 Mock Tokens**: SEI, USDC, USDT, ETH, BTC, ATOM, DAI
- **Realistic Testing**: Enables full deposit/withdrawal workflow testing

## Test Users (Devnet)

After deployment, these addresses have funded tokens for testing:

| User | Address | Profile | SEI | USDC | ETH | BTC |
|------|---------|---------|-----|------|-----|-----|
| User1 | `0x2222...2222` | Balanced | 10K | 10K | 100 | 5 |
| User2 | `0x3333...3333` | Conservative | 5K | 5K | 25 | 1 |
| User3 | `0x4444...4444` | Whale | 100K | 50K | 500 | 20 |

See [TEST_USER_GUIDE.md](./TEST_USER_GUIDE.md) for complete details.

## Smart Contract Architecture

### Core Contracts
- **SEIVault**: Main vault with SEI-specific optimizations
- **VaultFactory**: Deploys and manages strategy vaults
- **AIOracle**: Integrates AI models for strategy decisions
- **StrategyVault**: Base implementation for all strategies

### Strategy Vaults
1. **ConcentratedLiquidityVault**: SEI-USDC focused liquidity
2. **YieldFarmingVault**: ATOM-SEI yield optimization
3. **ArbitrageVault**: ETH-USDT arbitrage opportunities
4. **HedgeVault**: BTC-SEI impermanent loss hedging
5. **StableMaxVault**: USDC-DAI stable yield maximization
6. **SeiHypergrowthVault**: SEI-ETH high-growth strategy
7. **BlueChipVault**: ETH-BTC blue-chip portfolio
8. **DeltaNeutralVault**: SEI-USDC market-neutral strategy

## Development Workflow

### 1. Local Development
```shell
# Build contracts
forge build

# Run tests
forge test

# Run specific test
forge test --match-test testDeposit
```

### 2. Devnet Deployment
```shell
# Deploy with test user funding
forge script script/Deploy.s.sol --rpc-url https://evm-rpc-arctic-1.sei-apis.com --broadcast

# Verify deployment
forge script script/VerifyTestUsers.s.sol --rpc-url https://evm-rpc-arctic-1.sei-apis.com
```

### 3. Frontend Integration
```shell
# Update environment variables with deployed addresses
cp deployment_output.txt ../src/.env

# Test with funded users in MetaMask
# Import test user private keys (devnet only!)
```

## Security Features

### ✅ Access Controls
- Owner-only administrative functions
- AI model signature verification
- Emergency pause capabilities

### ✅ Safety Checks
- Slippage protection on all trades
- Maximum deposit/withdrawal limits
- Reentrancy guards on all external calls

### ✅ SEI-Specific Validations
- Chain ID verification (713715)
- Block finality optimization
- Parallel execution safety

## Gas Optimization

### SEI Network Benefits
- **Lower Gas Costs**: SEI's optimized EVM implementation
- **Faster Transactions**: 400ms block times
- **Parallel Processing**: Multiple transactions per block

### Contract Optimizations
- Packed structs for storage efficiency
- Batch operations for multiple actions
- Minimal external calls in critical paths

## Testing

### Unit Tests
```shell
forge test src/test/SEIVault.t.sol
forge test src/test/VaultFactory.t.sol
forge test src/test/AIOracle.t.sol
```

### Integration Tests
```shell
forge test src/test/EnhancedVaultCustomer.t.sol
forge test src/test/DevnetMocks.t.sol
```

### Coverage Report
```shell
forge coverage
```

## Foundry Documentation

Foundry consists of:
- **Forge**: Ethereum testing framework
- **Cast**: Swiss army knife for EVM interactions
- **Anvil**: Local Ethereum node
- **Chisel**: Solidity REPL

Full documentation: https://book.getfoundry.sh/

## Contributing

1. Fork the repository
2. Create a feature branch
3. Add comprehensive tests
4. Ensure all tests pass
5. Submit a pull request

## License

MIT License - see LICENSE file for details.
