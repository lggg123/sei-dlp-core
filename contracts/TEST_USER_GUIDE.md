# Test User Funding Guide

## Overview
The deployment scripts now include comprehensive test user funding to enable realistic testing of deposit/withdrawal functionality on SEI devnet.

## Test Users

### Pre-funded Test Users
After deployment, these addresses will have tokens for testing:

#### User1 (Balanced Portfolio) - `0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc`
- **SEI**: 10,000 tokens
- **USDC**: 10,000 tokens  
- **USDT**: 5,000 tokens
- **ETH**: 100 tokens
- **BTC**: 5 tokens
- **ATOM**: 1,000 tokens
- **DAI**: 5,000 tokens

#### User2 (Conservative Portfolio) - `0x90F79bf6EB2c4f870365E785982E1f101E93b906`
- **SEI**: 5,000 tokens
- **USDC**: 5,000 tokens
- **USDT**: 2,000 tokens
- **ETH**: 25 tokens
- **BTC**: 1 token
- **ATOM**: 500 tokens
- **DAI**: 3,000 tokens

#### User3 (Whale Portfolio) - `0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65`
- **SEI**: 100,000 tokens
- **USDC**: 50,000 tokens
- **USDT**: 25,000 tokens
- **ETH**: 500 tokens
- **BTC**: 20 tokens
- **ATOM**: 10,000 tokens
- **DAI**: 30,000 tokens

## Deployment Commands

### Deploy with Test User Funding
```bash
cd contracts
forge script script/Deploy.s.sol --rpc-url https://evm-rpc-arctic-1.sei-apis.com --broadcast
```

### Verify Test User Balances
```bash
forge script script/VerifyTestUsers.s.sol --rpc-url https://evm-rpc-arctic-1.sei-apis.com
```

### Fund Additional Test Users
```bash
# Edit FundTestUser.s.sol to set token addresses and custom user address
forge script script/FundTestUser.s.sol --rpc-url https://evm-rpc-arctic-1.sei-apis.com --broadcast
```

## Frontend Integration

### Using Test Users in MetaMask
1. Import any of the test user private keys into MetaMask
2. Connect to SEI devnet (Chain ID: 713715)
3. Use the funded tokens to test deposits/withdrawals

### Environment Variables
Update your `.env` file with deployed contract addresses:
```env
NEXT_PUBLIC_SEI_CHAIN_ID=713715
NEXT_PUBLIC_VAULT_ADDRESS=<deployed_vault_address>
NEXT_PUBLIC_TOKEN_SEI=<deployed_sei_token_address>
NEXT_PUBLIC_TOKEN_USDC=<deployed_usdc_token_address>
# ... other token addresses
```

## Testing Workflows

### Basic Deposit/Withdrawal Test
1. Connect MetaMask with User1 address
2. Navigate to vault interface
3. Test deposit flow with SEI tokens
4. Verify vault balance updates
5. Test withdrawal flow
6. Verify returned tokens

### Multi-Token Testing
1. Use User1 for balanced multi-token deposits
2. Use User2 for conservative single-token deposits  
3. Use User3 for large-amount edge case testing

### Cross-Vault Testing
1. Test deposits across different strategy vaults
2. Compare yields and performance
3. Test rebalancing between vaults

## Troubleshooting

### Insufficient Balance Errors
- Check if deployment completed successfully
- Verify you're using the correct test user address
- Confirm you're connected to SEI devnet (Chain ID: 713715)

### Transaction Failures
- Ensure gas limit is sufficient for SEI devnet
- Check if contracts are properly deployed
- Verify token allowances are set correctly

### Frontend Connection Issues
- Confirm RPC URL is correct: `https://evm-rpc-arctic-1.sei-apis.com`
- Check that contract addresses in `.env` match deployment output
- Verify MetaMask is connected to SEI devnet

## Security Notes
- These are test tokens with no real value
- Private keys are for devnet testing only
- Never use these addresses or keys on mainnet
- Test users have deterministic addresses for consistent testing

## Next Steps
1. Deploy contracts with test user funding
2. Update frontend environment variables
3. Test deposit/withdrawal flows with funded users
4. Verify AI-driven rebalancing with test transactions
5. Test edge cases with whale user (User3)
