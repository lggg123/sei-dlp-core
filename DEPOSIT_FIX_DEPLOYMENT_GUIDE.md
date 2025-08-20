# SEI DLP Deposit Fix - Deployment Guide

## Overview

This guide covers the deployment of fixed contracts that properly handle native SEI vs ERC20 token deposits. The original issue was that transactions would get stuck at "processing" because the smart contract was trying to use `transferFrom()` for native SEI deposits instead of handling `msg.value`.

## Problem Summary

### Root Cause
- **Contract Bug**: `SEIVault.sol` was using `IERC20(token).transferFrom()` for all deposits, including native SEI
- **Frontend Mismatch**: Frontend was sending native SEI as `msg.value`, but contract expected `transferFrom()`
- **No Error Handling**: Failed transactions remained in "pending" state with no clear error messages

### Fixed Issues
1. ✅ Smart contract now properly handles native SEI deposits using `msg.value`
2. ✅ Frontend correctly distinguishes between native SEI and ERC20 deposits
3. ✅ Enhanced error handling and validation
4. ✅ Proper receive/fallback functions for native SEI

## ✅ Deployment Completed

### 1. Environment Variables SET
```bash
# Private key was set for deployment
export PRIVATE_KEY="ca7c2c5e7d3539ac03efc2cfaf0f4a0d3b5929e95bbf95b586c7a95b672e46cf"
```

### 2. Fixed Contracts DEPLOYED
```bash
cd contracts
./deploy-fixed.sh
```

**Deployed Addresses:**
- **Native SEI Vault**: `0xAC64527866CCfA796Fa87A257B3f927179a895e6`
- **ERC20 USDC Vault**: `0xcF796aEDcC293db74829e77df7c26F482c9dBEC0`
- **AI Oracle**: `0x4199f86F3Bd73cF6ae5E89C8E28863d4B12fb18E`
- **Vault Factory**: `0x37b8E91705bc42d5489Dae84b00B87356342B267`
- **Mock USDC**: `0x647Dc1B1BFb17171326c12A2dcd8464E871F097B`

### ✅ 3. Frontend Configuration UPDATED
All files have been updated with the new contract addresses:

#### Update Token Utils
```typescript
// src/utils/tokenUtils.ts
export function isNativeSEIVault(vaultData: {
  tokenA: string;
  tokenB: string;
  strategy: string;
}): boolean {
  const primaryToken = getPrimaryDepositToken(vaultData);
  return primaryToken.isNative && primaryToken.symbol === 'SEI';
}
```

#### Update Vault Hook Addresses
```typescript
// src/hooks/useEnhancedVaultDeposit.ts
const validTestnetVaults = [
  '0xNEW_NATIVE_SEI_VAULT_ADDRESS',  // Native SEI vault (token0 = address(0))
  '0xNEW_ERC20_VAULT_ADDRESS',       // ERC20 USDC vault
  // ... other existing vaults
];
```

## Contract Architecture

### Native SEI Vault
```solidity
// token0 = address(0) indicates native SEI
SEIVault nativeVault = new SEIVault(
    address(0),          // Native SEI indicator
    "Native SEI Vault",
    "NSIV",
    owner,
    aiOracle
);
```

### ERC20 Vault
```solidity
// token0 = ERC20 token address
SEIVault erc20Vault = new SEIVault(
    mockUSDC,           // ERC20 token address
    "USDC Vault", 
    "USDCV",
    owner,
    aiOracle
);
```

## Testing After Deployment

### 1. Test Native SEI Deposit
```javascript
// Should work with msg.value
await vault.seiOptimizedDeposit(
  parseEther("1.0"),     // amount
  userAddress,           // recipient
  { value: parseEther("1.0") }  // Send SEI as value
);
```

### 2. Test ERC20 Deposit
```javascript
// Should work with prior approval
await token.approve(vaultAddress, amount);
await vault.seiOptimizedDeposit(
  amount,
  userAddress
  // No value for ERC20 deposits
);
```

### 3. Frontend Testing
1. Connect wallet to SEI Atlantic-2 testnet
2. Try depositing to native SEI vault - should accept SEI from wallet
3. Try depositing to ERC20 vault - should require token approval first
4. Verify transaction status properly updates to "success" or shows clear errors

## Environment Configuration

### SEI Atlantic-2 Testnet
- **Chain ID**: 1328
- **RPC URL**: https://evm-rpc-testnet.sei-apis.com
- **Block Explorer**: https://seitrace.com

### Test User Accounts
After deployment, these accounts will be funded:
- **User1**: `0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC`
  - 100 SEI + 10,000 USDC
- **User2**: `0x90F79bf6EB2c4f870365E785982E1f101E93b906`
  - 50 SEI + 5,000 USDC

## Key Differences from Original

### Smart Contract Changes
```diff
// OLD: Always used transferFrom
- IERC20(vaultInfo.token0).transferFrom(msg.sender, address(this), amount);

// NEW: Handles both native SEI and ERC20
+ if (vaultInfo.token0 == address(0)) {
+     // Native SEI deposit
+     require(msg.value > 0, "Must send SEI with transaction");
+     actualAmount = msg.value;
+ } else {
+     // ERC20 token deposit
+     IERC20(vaultInfo.token0).transferFrom(msg.sender, address(this), amount);
+ }
```

### Frontend Changes
```diff
// OLD: Always sent value for SEI vaults
- if (vaultAcceptsNativeSEI(vaultData)) {
-   value: amountInWei
- }

// NEW: Check if vault is actually configured for native SEI
+ if (tokenInfo.isNative && isNativeSEIVault(vaultData)) {
+   value: amountInWei // Send SEI as value for native deposits
+ } else if (!tokenInfo.isNative && !isNativeSEIVault(vaultData)) {
+   // No value for ERC20 deposits
+ }
```

## Troubleshooting

### Transaction Still Stuck?
1. Check vault address is from the new deployment
2. Verify you're using the correct vault type (native vs ERC20)
3. For ERC20: ensure token approval was successful
4. Check browser console for detailed error logs

### Contract Interaction Fails?
1. Confirm you're on SEI Atlantic-2 testnet (Chain ID 1328)
2. Verify contract addresses match deployment output
3. Check wallet has sufficient balance (SEI for gas + deposit amount)

### Frontend Not Updating?
1. Clear browser cache and reload
2. Verify environment variables are updated
3. Check token balance refetch is working

## Next Steps

1. ✅ Deploy fixed contracts
2. ✅ Update frontend configuration  
3. ✅ Test deposit flow end-to-end
4. ⭐ Monitor for any remaining issues
5. 🚀 Deploy to mainnet when stable

## Support

If you encounter issues:
1. Check browser console for error logs
2. Verify transaction on SEI Explorer
3. Ensure you're using the latest contract addresses
4. Test with small amounts first