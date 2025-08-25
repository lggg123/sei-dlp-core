#!/bin/bash

# Enhanced SEI DLP Devnet Deployment Script
# This script provides multiple deployment options with proper contract targeting

echo "🚀 Enhanced SEI DLP Devnet Deployment Script"
echo "=============================================="

# Configuration
RPC_URL="https://evm-rpc-arctic-1.sei-apis.com"
CHAIN_ID="713715"

echo "📍 Network: SEI Devnet (Chain ID: $CHAIN_ID)"
echo "🔗 RPC URL: $RPC_URL"
echo ""

# Function to deploy with proper contract specification
deploy_script() {
    local script_file=$1
    local contract_name=$2
    local description=$3
    
    echo "🔧 Deploying $description..."
    echo "   Script: $script_file"
    echo "   Contract: $contract_name"
    echo ""
    
    forge script "$script_file:$contract_name" \
        --rpc-url "$RPC_URL" \
        --broadcast \
        --slow \
        --tc "$contract_name" \
        --chain-id "$CHAIN_ID"
    
    return $?
}

# Function to verify deployment
verify_deployment() {
    echo "🔍 Verifying test users..."
    forge script script/VerifyTestUsers.s.sol:VerifyTestUsersScript \
        --rpc-url "$RPC_URL" \
        --tc VerifyTestUsersScript \
        --chain-id "$CHAIN_ID"
    
    return $?
}

# Main deployment menu
echo "Select deployment option:"
echo "1) Full deployment (All contracts + test setup)"
echo "2) Simple deployment (Core contracts only)"
echo "3) Verify test users only"
echo "4) Deploy specific contract"
echo ""
read -p "Enter your choice (1-4): " choice

case $choice in
    1)
        echo "🚀 Starting FULL deployment..."
        echo ""
        
        if deploy_script "script/Deploy.s.sol" "DeployScript" "Full SEI DLP System"; then
            echo "✅ Full deployment successful!"
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
            echo "4. Run verification: ./deploy-enhanced.sh (option 3)"
            echo ""
            
            # Auto-verify if requested
            read -p "Run test user verification now? (y/n): " verify
            if [[ $verify == "y" || $verify == "Y" ]]; then
                verify_deployment
            fi
            
            echo "🎯 Ready for frontend testing!"
        else
            echo "❌ Full deployment failed!"
            exit 1
        fi
        ;;
        
    2)
        echo "🚀 Starting SIMPLE deployment..."
        echo ""
        
        if deploy_script "script/SimpleDeploy.s.sol" "SimpleDeployScript" "Core SEI DLP Contracts"; then
            echo "✅ Simple deployment successful!"
            echo ""
            echo "📋 Core contracts deployed. Configure as needed."
        else
            echo "❌ Simple deployment failed!"
            exit 1
        fi
        ;;
        
    3)
        echo "🧪 Verifying test users..."
        echo ""
        
        if verify_deployment; then
            echo "✅ Test user verification completed!"
        else
            echo "❌ Test user verification failed!"
            exit 1
        fi
        ;;
        
    4)
        echo "Available deployment scripts:"
        echo "1) Deploy.s.sol:DeployScript (Full system)"
        echo "2) SimpleDeploy.s.sol:SimpleDeployScript (Core contracts)"
        echo "3) FundTestUser.s.sol:FundTestUserScript (Fund test users)"
        echo ""
        read -p "Enter script file (e.g., script/Deploy.s.sol): " script_file
        read -p "Enter contract name (e.g., DeployScript): " contract_name
        read -p "Enter description: " description
        
        if deploy_script "$script_file" "$contract_name" "$description"; then
            echo "✅ Custom deployment successful!"
        else
            echo "❌ Custom deployment failed!"
            exit 1
        fi
        ;;
        
    *)
        echo "❌ Invalid choice. Exiting."
        exit 1
        ;;
esac

echo ""
echo "=============================================="
echo "🏁 Deployment process completed!"
echo "=============================================="