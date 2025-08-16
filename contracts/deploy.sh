
#!/bin/bash

# SEI DLP Devnet Deployment Script
# This script deploys the contracts and verifies test user funding

echo "🚀 Starting SEI DLP Devnet Deployment..."
echo "=========================================="

# Set SEI devnet RPC URL
RPC_URL="https://evm-rpc-arctic-1.sei-apis.com"

echo "📍 Network: SEI Devnet (Chain ID: 713715)"
echo "🔗 RPC URL: $RPC_URL"
echo ""

# Deploy contracts
echo "🔧 Deploying contracts..."
forge script script/Deploy.s.sol:DeployScript --rpc-url $RPC_URL --broadcast --slow --tc DeployScript

if [ $? -eq 0 ]; then
    echo "✅ Deployment successful!"
    echo ""
    
    echo "🧪 Test User Addresses:"
    echo "User1 (Balanced):     0x2222222222222222222222222222222222222222"
    echo "User2 (Conservative): 0x3333333333333333333333333333333333333333"  
    echo "User3 (Whale):        0x4444444444444444444444444444444444444444"
    echo ""
    
    echo "📋 Next Steps:"
    echo "1. Copy deployed contract addresses to your .env file"
    echo "2. Import test user private keys into MetaMask (devnet only!)"
    echo "3. Test deposit/withdrawal functionality with funded users"
    echo "4. Run: forge script script/VerifyTestUsers.s.sol:VerifyTestUsersScript --rpc-url $RPC_URL --tc VerifyTestUsersScript"
    echo ""
    
    echo "🎯 Ready for frontend testing!"
else
    echo "❌ Deployment failed!"
    echo "Please check the error messages above and try again."
    exit 1
fi
