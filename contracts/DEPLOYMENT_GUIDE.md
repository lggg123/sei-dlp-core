# SEI DLP Smart Contract Deployment Guide

This guide provides comprehensive instructions for deploying SEI DLP smart contracts to SEI Devnet with proper contract targeting.

## Problem Solved

The original deployment was failing with the error:
```
Multiple contracts in the target path. Please specify the contract name with `--tc ContractName`
```

This happened because deployment scripts contained multiple contracts (main script + mock contracts) without explicit targeting.

## Quick Start

### Option 1: Enhanced Deployment Script (Recommended)
```bash
cd contracts
./deploy-enhanced.sh
```

Select from the interactive menu:
1. **Full deployment** - All contracts + test setup
2. **Simple deployment** - Core contracts only  
3. **Verify test users** - Check funded accounts
4. **Deploy specific contract** - Custom deployment

### Option 2: Manual Deployment
```bash
cd contracts

# Full deployment with proper contract targeting
forge script script/Deploy.s.sol:DeployScript \
    --rpc-url https://evm-rpc-arctic-1.sei-apis.com \
    --broadcast \
    --slow \
    --tc DeployScript \
    --chain-id 713715

# Simple deployment
forge script script/SimpleDeploy.s.sol:SimpleDeployScript \
    --rpc-url https://evm-rpc-arctic-1.sei-apis.com \
    --broadcast \
    --slow \
    --tc SimpleDeployScript \
    --chain-id 713715

# Verify test users
forge script script/VerifyTestUsers.s.sol:VerifyTestUsersScript \
    --rpc-url https://evm-rpc-arctic-1.sei-apis.com \
    --tc VerifyTestUsersScript \
    --chain-id 713715
```

## Network Configuration

### SEI Devnet (Arctic)
- **Chain ID**: 713715
- **RPC URL**: https://evm-rpc-arctic-1.sei-apis.com
- **Block Explorer**: https://seitrace.com
- **Finality**: ~400ms

### SEI Mainnet
- **Chain ID**: 1329
- **RPC URL**: https://evm-rpc.sei-apis.com
- **Block Explorer**: https://seitrace.com

## Contract Architecture

### Main Contracts
1. **AIOracle** - AI-driven rebalancing oracle
2. **VaultFactory** - Factory for creating vaults
3. **SEIVault** - Core vault with SEI optimizations
4. **StrategyVault** - Base strategy vault implementation

### Strategy Contracts
1. **ConcentratedLiquidityVault** - Concentrated liquidity management
2. **YieldFarmingVault** - Automated yield farming
3. **ArbitrageVault** - Cross-DEX arbitrage
4. **HedgeVault** - Risk hedging strategies
5. **StableMaxVault** - Stablecoin yield optimization
6. **SeiHypergrowthVault** - High-growth SEI strategies
7. **BlueChipVault** - Blue-chip asset management
8. **DeltaNeutralVault** - Market-neutral strategies

### Test Infrastructure
- **MockERC20** - Test tokens (SEI, USDC, USDT, ETH, BTC, ATOM, DAI)
- **Test Users** - Pre-funded accounts for testing

## Deployment Scripts Explained

### Deploy.s.sol
- **Target Contract**: `DeployScript`
- **Purpose**: Full system deployment with test setup
- **Features**: 
  - Deploys all main and strategy contracts
  - Sets up mock tokens for testing
  - Funds test user accounts
  - Configures AI oracle with models

### SimpleDeploy.s.sol  
- **Target Contract**: `SimpleDeployScript`
- **Purpose**: Core contracts only (minimal deployment)
- **Features**:
  - Deploys main contracts (AIOracle, VaultFactory, SEIVault)
  - Basic configuration
  - No test user setup

### VerifyTestUsers.s.sol
- **Target Contract**: `VerifyTestUsersScript` 
- **Purpose**: Verify test user funding
- **Features**:
  - Checks token balances for all test users
  - Validates expected vs actual balances
  - Reports verification status

## Test Users

### User1 (Balanced Portfolio)
- **Address**: `0x2222222222222222222222222222222222222222`
- **Tokens**: 10K SEI, 10K USDC, 5K USDT, 100 ETH, 5 BTC, 1K ATOM, 5K DAI

### User2 (Conservative Portfolio)  
- **Address**: `0x3333333333333333333333333333333333333333`
- **Tokens**: 5K SEI, 5K USDC, 2K USDT, 25 ETH, 1 BTC, 500 ATOM, 3K DAI

### User3 (Whale Portfolio)
- **Address**: `0x4444444444444444444444444444444444444444` 
- **Tokens**: 100K SEI, 50K USDC, 25K USDT, 500 ETH, 20 BTC, 10K ATOM, 30K DAI

## SEI-Specific Optimizations

### Parallel Execution
- Enabled by default in deployed vaults
- Leverages SEI's parallel processing capabilities

### Finality Optimization
- Aligned with SEI's 400ms finality
- Minimum rebalance interval: 400ms
- Fast execution patterns

### Chain Validation
- Mandatory SEI chain ID validation (713715 for devnet)
- Prevents deployment on wrong networks

## Troubleshooting

### "Multiple contracts in target path"
**Solution**: Always specify the target contract with `--tc ContractName`
```bash
# Wrong
forge script script/Deploy.s.sol --rpc-url $RPC_URL --broadcast

# Correct  
forge script script/Deploy.s.sol:DeployScript --rpc-url $RPC_URL --broadcast --tc DeployScript
```

### "Invalid chain" Error
**Solution**: Ensure you're deploying to SEI Devnet (Chain ID: 713715)
```bash
# Check current network
cast chain-id --rpc-url https://evm-rpc-arctic-1.sei-apis.com

# Should return: 713715
```

### Gas Issues
**Solution**: Use appropriate gas settings for SEI
```bash
forge script script/Deploy.s.sol:DeployScript \
    --rpc-url $RPC_URL \
    --broadcast \
    --slow \
    --tc DeployScript \
    --gas-limit 30000000 \
    --gas-price 25000000000
```

### Deployment Verification
```bash
# Check deployed contracts
cast code $CONTRACT_ADDRESS --rpc-url https://evm-rpc-arctic-1.sei-apis.com

# Verify test user balances
./deploy-enhanced.sh  # Choose option 3
```

## Security Considerations

### Private Keys
- **NEVER** commit private keys to version control
- Use environment variables or secure key management
- Example scripts use placeholder keys for demonstration

### Network Validation
- All contracts validate deployment on correct SEI network
- Chain ID checks prevent accidental deployments

### Access Control
- Proper ownership setup with Ownable contracts
- Multi-signature recommended for mainnet deployments

## Configuration Files

### foundry.toml
- Enhanced with SEI network endpoints
- Optimized compiler settings
- Gas configuration for SEI

### deployment-config.json
- Network configurations
- Contract deployment targets
- Test user specifications

## Next Steps After Deployment

1. **Copy Contract Addresses**: Save deployed addresses to environment variables
2. **Frontend Integration**: Update frontend with new contract addresses
3. **Test Functionality**: Use test users to verify deposit/withdrawal flows
4. **Monitor Performance**: Check SEI-specific optimizations are active
5. **Security Audit**: Conduct thorough security review before mainnet

## Support

For deployment issues:
1. Check the deployment logs for specific error messages
2. Verify network connectivity to SEI Devnet
3. Ensure sufficient SEI tokens for gas fees
4. Review contract dependencies and imports

The enhanced deployment system provides robust error handling and clear feedback for successful SEI DLP deployment.