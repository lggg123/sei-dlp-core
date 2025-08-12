# Deposit/Withdrawal Component Testing Guide

## 🎯 Overview
This guide helps you test the deposit and withdrawal functionality using mocks before deploying to devnet.

## 🧪 Available Tests

### 1. Component Unit Tests
```bash
# Run all component tests
npm run test:component

# Run specific deposit modal tests
npx jest src/components/__tests__/DepositModal.test.tsx

# Run specific withdrawal modal tests  
npx jest src/components/__tests__/WithdrawalModal.test.tsx
```

### 2. Integration Tests
```bash
# Run deposit/withdrawal flow integration tests
npm run test:integration

# Run specific integration test
npx jest src/__tests__/integration/deposit-withdrawal-flow.test.tsx
```

### 3. Manual Mock Testing
```bash
# Run manual test simulation
npm run test:deposit

# Verify test dependencies
node test-verification.js
```

## 🔧 Test Configuration

### Jest Configuration (`jest.config.js`)
- **Environment**: jsdom (browser simulation)
- **Test Pattern**: `**/__tests__/**/*.test.{js,jsx,ts,tsx}`
- **Setup**: `jest.setup.js` with DOM matchers
- **Module Mapping**: `@/` → `src/`

### Mock Setup
- **Wallet**: Simulated wallet connection and transactions
- **Vault Contracts**: Mock contract interactions
- **API Calls**: Mocked with predefined responses
- **React Query**: Test wrapper with disabled retries

## 🧪 Test Scenarios Covered

### Deposit Modal Tests
✅ **UI Rendering**
- Modal opens/closes correctly
- Form fields render properly
- Buttons have correct states

✅ **User Interactions**
- Amount input validation
- Share calculation display
- Button enable/disable logic

✅ **State Management**
- Loading states during transaction
- Error states with proper messages
- Success states with callbacks

✅ **Edge Cases**
- Invalid amounts (negative, zero)
- Network errors
- User rejection

### Withdrawal Modal Tests
✅ **UI Rendering**
- Current position display
- Available shares calculation
- Expected return calculation

✅ **User Interactions**
- Share amount input validation
- Maximum withdrawal logic
- Confirmation flow

✅ **State Management**
- Loading during withdrawal
- Error handling
- Success confirmation

### Integration Tests
✅ **Complete User Journey**
- Connect wallet → Deposit → View position → Withdraw
- State persistence across modals
- Real-time balance updates

✅ **Mock Blockchain Simulation**
- Transaction hash generation
- Gas fee calculation
- Block confirmation delays

## 🚀 Mock Implementation Details

### Mock Wallet (`scripts/test-deposit-withdrawal.ts`)
```typescript
// Simulates wallet connection
const mockWallet = {
  connect: () => Promise<void>,
  getAddress: () => string,
  getBalance: () => number,
  deposit: (vaultAddress, amount) => Promise<txHash>,
  withdraw: (vaultAddress, shares) => Promise<txHash>
};
```

### Mock Vault Contract
```typescript
// Simulates vault state changes
const mockVault = {
  getVaultInfo: () => Promise<VaultInfo>,
  getUserShares: (address) => Promise<number>,
  deposit: (user, amount) => Promise<void>,
  withdraw: (user, shares) => Promise<number>
};
```

## 🔍 Test Execution Steps

### Before Running Tests
1. Ensure all dependencies are installed:
   ```bash
   npm install
   ```

2. Verify Jest configuration:
   ```bash
   npx jest --config jest.config.js --showConfig
   ```

3. Check test file structure:
   ```bash
   find src -name "*.test.*" -type f
   ```

### Running Tests
1. **Quick component test**:
   ```bash
   npm run test:component
   ```

2. **Watch mode for development**:
   ```bash
   npm run test:watch
   ```

3. **Coverage report**:
   ```bash
   npm run test:coverage
   ```

## 🐛 Troubleshooting

### Common Issues
1. **Module not found errors**:
   - Check `moduleNameMapper` in `jest.config.js`
   - Verify import paths use `@/` prefix

2. **DOM method not found**:
   - Ensure `jest.setup.js` imports `@testing-library/jest-dom`
   - Check `testEnvironment: 'jsdom'` in config

3. **React Query errors**:
   - Wrap components in test `QueryClientProvider`
   - Disable retries in test queries

4. **Async test timeouts**:
   - Use `waitFor` for async assertions
   - Increase Jest timeout if needed

### Debug Commands
```bash
# Debug specific test
npx jest src/components/__tests__/DepositModal.test.tsx --verbose

# Debug with no cache
npx jest --no-cache --clearCache

# Debug test environment
npx jest --debug
```

## 🎯 Expected Test Results

When all tests pass, you should see:
```
✅ DepositModal.test.tsx (15 tests)
✅ WithdrawalModal.test.tsx (12 tests)  
✅ deposit-withdrawal-flow.test.tsx (8 tests)

Total: 35 tests passed
Coverage: >80% for components
```

## 🚀 Next Steps After Testing

1. **All tests passing** → Ready for devnet deployment
2. **Some tests failing** → Fix issues and re-run
3. **Tests passing** → Deploy contracts to SEI devnet
4. **Devnet deployed** → Replace mocks with real contract calls

---

**Remember**: These tests verify the UI logic and user interactions. Once contracts are deployed to devnet, you'll replace the mocks with actual blockchain calls!
