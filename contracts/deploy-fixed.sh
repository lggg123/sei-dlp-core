#!/bin/bash

# SEI DLP Fixed Deployment Script
# Deploys corrected vaults with proper native SEI support

set -e

echo "🚀 Starting SEI DLP Fixed Deployment..."

# Check if PRIVATE_KEY is set
if [ -z "$PRIVATE_KEY" ]; then
    echo "❌ Error: PRIVATE_KEY environment variable is not set"
    echo "Please set your private key: export PRIVATE_KEY=your_private_key_here"
    exit 1
fi

# SEI Atlantic-2 Testnet configuration
CHAIN_ID=1328
RPC_URL="https://evm-rpc-testnet.sei-apis.com"

echo "📋 Deployment Configuration:"
echo "  Network: SEI Atlantic-2 Testnet"
echo "  Chain ID: $CHAIN_ID"
echo "  RPC URL: $RPC_URL"

# Compile contracts
echo "🔨 Compiling contracts..."
forge build

if [ $? -ne 0 ]; then
    echo "❌ Compilation failed!"
    exit 1
fi

echo "✅ Compilation successful!"

# Deploy contracts
echo "🚀 Deploying contracts to SEI Atlantic-2 Testnet..."

forge script script/DeployFixed.s.sol:DeployFixedScript \
    --rpc-url $RPC_URL \
    --private-key $PRIVATE_KEY \
    --broadcast \
    --verify \
    --etherscan-api-key "sei" \
    -vvvv

if [ $? -eq 0 ]; then
    echo "✅ Deployment successful!"
    echo ""
    echo "📝 Contract addresses have been logged above."
    echo "🔍 You can view the deployment on SEI Explorer: https://seitrace.com"
    echo ""
    echo "📋 Copy these contract addresses to your frontend:"
    echo "📄 Update these files with the new addresses:"
    echo "   - src/hooks/useEnhancedVaultDeposit.ts (validTestnetVaults array)"
    echo "   - Update environment variables if using .env"
    echo ""
    echo "🎯 Next steps:"
    echo "  1. Update validTestnetVaults array with the deployed contract addresses"
    echo "  2. Test native SEI deposits to the Native SEI Vault"  
    echo "  3. Test ERC20 deposits to the USDC Vault (requires approval)"
    echo "  4. Verify transactions complete successfully"
else
    echo "❌ Deployment failed!"
    exit 1
fi