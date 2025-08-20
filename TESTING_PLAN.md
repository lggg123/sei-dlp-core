# SEI DLP Deposit and Withdrawal Testing Plan

## Overview
This comprehensive testing plan outlines the steps to test the deposit and withdrawal functionality of the SEI Dynamic Liquidity Protocol (DLP) using the pre-funded test users. The plan covers environment setup, test scenarios, edge cases, and integration verification.

## 1. Test Environment Setup

### 1.1 Prerequisites
- Node.js v18+
- Foundry (Forge) installed
- MetaMask browser extension
- Access to SEI Devnet (Chain ID: 713715)

### 1.2 Testnet Vault Addresses (Chain ID: 1328)
Current deployed vault addresses on SEI Atlantic-2 testnet:
```
SEI-USDC Concentrated LP: 0xf6A791e4773A60083AA29aaCCDc3bA5E900974fE
ATOM-SEI Yield Farm: 0x6F4cF61bBf63dCe0094CA1fba25545f8c03cd8E6
ETH-USDT Arbitrage Bot: 0x22Fc4c01FAcE783bD47A1eF2B6504213C85906a1
BTC-SEI Hedge Strategy: 0xCB15AFA183347934DeEbb0F442263f50021EFC01
Stable Max Yield Vault: 0x34C0aA990D6e0D099325D7491136BA35FBcdFb38
SEI Hypergrowth Vault: 0x6C0e4d44bcdf6f922637e041FdA4b7c1Fe5667E6
Blue Chip DeFi Vault: 0x271115bA107A8F883DE36Eaf3a1CC41a4C5E1a56
Delta Neutral LP Vault: 0xaE6F27Fdf2D15c067A0Ebc256CE05A317B671B81
```

### 1.3 Update Environment Variables
Create/update `.env.local` file in the project root:
```env
NEXT_PUBLIC_SEI_CHAIN_ID=1328
NEXT_PUBLIC_RPC_URL=https://evm-rpc-atlantic-2.sei-apis.com
NEXT_PUBLIC_VAULT_ADDRESS=0xf6A791e4773A60083AA29aaCCDc3bA5E900974fE
```

### 1.4 Configure MetaMask
1. Add SEI Atlantic-2 testnet network:
   - Network Name: SEI Atlantic-2 Testnet
   - RPC URL: https://evm-rpc-atlantic-2.sei-apis.com
   - Chain ID: 1328
   - Currency Symbol: SEI

2. Import test user private keys (for testing only):
   - User1: `0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a`
   - User2: `0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6`
   - User3: `0x47e179ec197488593b187f80a00eb0da91f1b9d0b13f8733639f19c30a34926a`

## 2. Test User Accounts

| User | Address | Portfolio Type | SEI | USDC | USDT | ETH | BTC | ATOM | DAI |
|------|---------|----------------|-----|------|------|-----|-----|------|-----|
| User1 | 0x2222...2222 | Balanced | 10K | 10K | 5K | 100 | 5 | 1K | 5K |
| User2 | 0x3333...3333 | Conservative | 5K | 5K | 2K | 25 | 1 | 500 | 3K |
| User3 | 0x4444...4444 | Whale | 100K | 50K | 25K | 500 | 20 | 10K | 30K |

## 3. Deposit Testing

### 3.1 Basic Deposit Test
1. Connect MetaMask with User1
2. Navigate to the SEI-USDC Concentrated LP vault
3. Deposit 1,000 SEI
4. Verify:
   - Transaction confirmation
   - Vault balance updates
   - User receives vault shares

### 3.2 Multi-Token Deposit Test
1. Connect MetaMask with User2
2. Navigate to the ATOM-SEI Yield Farm vault
3. Deposit 500 ATOM and 500 SEI
4. Verify:
   - Both tokens are deposited
   - Vault balance updates correctly
   - User receives appropriate shares

### 3.3 Large Amount Deposit Test
1. Connect MetaMask with User3
2. Navigate to the ETH-USDT Arbitrage Bot vault
3. Deposit 10,000 USDT
4. Verify:
   - Large transaction processes correctly
   - Vault balance updates
   - No gas limit issues

### 3.4 Edge Case Testing
1. **Zero Amount**: Attempt to deposit 0 tokens
2. **Insufficient Balance**: Attempt to deposit more than available
3. **Invalid Token**: Attempt to deposit unsupported token
4. **Network Issues**: Simulate network delays

## 4. Withdrawal Testing

### 4.1 Basic Withdrawal Test
1. Connect MetaMask with User1
2. Navigate to a vault with existing deposit
3. Withdraw 50% of shares
4. Verify:
   - Transaction confirmation
   - User receives correct amount of tokens
   - Vault balance updates

### 4.2 Full Withdrawal Test
1. Connect MetaMask with User2
2. Navigate to a vault with existing deposit
3. Withdraw 100% of shares
4. Verify:
   - All tokens are returned
   - User balance updates correctly
   - Vault balance updates

### 4.3 Partial Withdrawal Test
1. Connect MetaMask with User3
2. Navigate to a vault with existing deposit
3. Withdraw 25% of shares
4. Verify:
   - Correct proportion of tokens returned
   - Vault and user balances update correctly

### 4.4 Edge Case Testing
1. **Zero Shares**: Attempt to withdraw 0 shares
2. **Exceeding Shares**: Attempt to withdraw more than owned
3. **Invalid Vault**: Attempt to withdraw from non-existent vault
4. **Network Congestion**: Test during simulated network congestion

## 5. Integration Testing

### 5.1 AI Engine Integration
1. Verify AI-driven rebalancing after deposits
2. Check AI model recommendations are applied
3. Verify yield optimization strategies are active

### 5.2 Eliza OSI Agent Integration
1. Test Eliza agent responses to deposit/withdrawal actions
2. Verify agent provides correct guidance and recommendations
3. Test agent's ability to explain vault strategies

### 5.3 Cross-Component Workflow
1. Deposit → AI Rebalancing → Withdrawal
2. Verify all components work together seamlessly
3. Test error handling across components

## 6. Performance Testing

### 6.1 Transaction Speed
1. Measure deposit/withdrawal confirmation times
2. Verify SEI's 400ms finality is achieved

### 6.2 Gas Efficiency
1. Measure gas usage for deposits/withdrawals
2. Compare with expected gas limits
3. Optimize if necessary

### 6.3 Load Testing
1. Simulate multiple concurrent deposits/withdrawals
2. Test system stability under load
3. Verify no race conditions

## 7. Security Testing

### 7.1 Access Control
1. Verify only authorized users can deposit/withdraw
2. Test contract ownership and admin functions

### 7.2 Reentrancy Protection
1. Test for reentrancy vulnerabilities
2. Verify proper use of reentrancy guards

### 7.3 Token Approval
1. Verify proper token approval workflow
2. Test revoking approvals

## 8. Test Automation

### 8.1 Scripted Testing
```bash
# Run automated tests
cd contracts
forge test --match-path test/SEIVault.t.sol
forge test --match-path test/StrategyVault.t.sol
```

### 8.2 Frontend Testing
```bash
cd src
npm run test:deposit
npm run test:withdrawal
```

## 9. Reporting and Documentation

### 9.1 Test Results
- Document all test cases and results
- Include transaction hashes for verification
- Note any issues or anomalies

### 9.2 Bug Reporting
- Create issues for any bugs found
- Include reproduction steps
- Prioritize based on severity

### 9.3 Final Report
- Summary of testing activities
- Overall system performance
- Recommendations for improvement

## 10. Next Steps
1. Execute the testing plan
2. Document results
3. Address any issues found
4. Prepare for mainnet deployment

This comprehensive testing plan ensures thorough validation of the deposit and withdrawal functionality across all components of the SEI DLP system.