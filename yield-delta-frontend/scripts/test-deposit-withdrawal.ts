/**
 * Mock Deposit/Withdrawal Testing Script
 * Simulates wallet connections and transactions for testing
 * @author Frontend Developer
 */

import { jest } from '@jest/globals';

// Mock wallet provider
export class MockWalletProvider {
  private isConnected: boolean = false;
  private address: string = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045';
  private balance: number = 50000; // Mock balance in USD

  async connect(): Promise<void> {
    console.log('🔗 MockWallet: Connecting...');
    await this.delay(1000);
    this.isConnected = true;
    console.log('✅ MockWallet: Connected to', this.address);
  }

  async disconnect(): Promise<void> {
    console.log('🔗 MockWallet: Disconnecting...');
    this.isConnected = false;
    console.log('✅ MockWallet: Disconnected');
  }

  getAddress(): string {
    if (!this.isConnected) throw new Error('Wallet not connected');
    return this.address;
  }

  getBalance(): number {
    if (!this.isConnected) throw new Error('Wallet not connected');
    return this.balance;
  }

  async deposit(vaultAddress: string, amount: number): Promise<string> {
    if (!this.isConnected) throw new Error('Wallet not connected');
    if (amount > this.balance) throw new Error('Insufficient balance');

    console.log(`💰 MockWallet: Depositing $${amount} to vault ${vaultAddress}`);
    
    // Simulate transaction processing
    await this.delay(2000);
    
    // Update balance
    this.balance -= amount;
    
    // Generate mock transaction hash
    const txHash = `0x${Math.random().toString(16).substr(2, 64)}`;
    
    console.log(`✅ MockWallet: Deposit successful! TX: ${txHash}`);
    console.log(`💵 MockWallet: New balance: $${this.balance}`);
    
    return txHash;
  }

  async withdraw(vaultAddress: string, shareAmount: number): Promise<string> {
    if (!this.isConnected) throw new Error('Wallet not connected');

    const usdAmount = shareAmount * 1.05; // Mock 5% yield
    
    console.log(`📤 MockWallet: Withdrawing ${shareAmount} shares from vault ${vaultAddress}`);
    console.log(`📤 MockWallet: Equivalent to ~$${usdAmount.toFixed(2)} USD`);
    
    // Simulate transaction processing
    await this.delay(2000);
    
    // Update balance
    this.balance += usdAmount;
    
    // Generate mock transaction hash
    const txHash = `0x${Math.random().toString(16).substr(2, 64)}`;
    
    console.log(`✅ MockWallet: Withdrawal successful! TX: ${txHash}`);
    console.log(`💵 MockWallet: New balance: $${this.balance}`);
    
    return txHash;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Mock vault contract interactions
export class MockVaultContract {
  private vault: {
    address: string;
    name: string;
    tvl: number;
    totalShares: number;
    userShares: number;
    apy: number;
  };

  constructor(vaultAddress: string) {
    // Mock vault data based on address
    const mockVaults = {
      '0x1234567890123456789012345678901234567890': {
        address: vaultAddress,
        name: 'SEI-USDC Concentrated LP',
        tvl: 1250000,
        totalShares: 1187500,
        userShares: 0,
        apy: 0.125,
      },
      '0x2345678901234567890123456789012345678901': {
        address: vaultAddress,
        name: 'ATOM-SEI Yield Farm',
        tvl: 850000,
        totalShares: 807500,
        userShares: 0,
        apy: 0.189,
      },
      '0x3456789012345678901234567890123456789012': {
        address: vaultAddress,
        name: 'ETH-USDT Arbitrage Bot',
        tvl: 2100000,
        totalShares: 1995000,
        userShares: 0,
        apy: 0.267,
      },
    };

    this.vault = mockVaults[vaultAddress as keyof typeof mockVaults] || {
      address: vaultAddress,
      name: 'Unknown Vault',
      tvl: 0,
      totalShares: 0,
      userShares: 0,
      apy: 0,
    };
  }

  async getVaultInfo() {
    console.log(`📊 MockContract: Getting vault info for ${this.vault.name}`);
    return {
      ...this.vault,
      sharePrice: this.vault.tvl / this.vault.totalShares || 1,
    };
  }

  async getUserShares(userAddress: string): Promise<number> {
    console.log(`👤 MockContract: Getting user shares for ${userAddress}`);
    return this.vault.userShares;
  }

  async deposit(userAddress: string, amount: number): Promise<void> {
    console.log(`📈 MockContract: Processing deposit of $${amount} for ${userAddress}`);
    
    const sharePrice = this.vault.tvl / this.vault.totalShares || 1;
    const sharesToMint = amount / sharePrice;
    
    // Update vault state
    this.vault.tvl += amount;
    this.vault.totalShares += sharesToMint;
    this.vault.userShares += sharesToMint;
    
    console.log(`📈 MockContract: Minted ${sharesToMint.toFixed(2)} shares`);
    console.log(`📈 MockContract: New TVL: $${this.vault.tvl}`);
  }

  async withdraw(userAddress: string, shareAmount: number): Promise<number> {
    console.log(`📉 MockContract: Processing withdrawal of ${shareAmount} shares for ${userAddress}`);
    
    if (shareAmount > this.vault.userShares) {
      throw new Error('Insufficient shares');
    }
    
    const sharePrice = this.vault.tvl / this.vault.totalShares;
    const usdAmount = shareAmount * sharePrice;
    
    // Update vault state
    this.vault.tvl -= usdAmount;
    this.vault.totalShares -= shareAmount;
    this.vault.userShares -= shareAmount;
    
    console.log(`📉 MockContract: Redeemed $${usdAmount.toFixed(2)} USD`);
    console.log(`📉 MockContract: New TVL: $${this.vault.tvl}`);
    
    return usdAmount;
  }
}

// Integration test helper
export class DepositWithdrawalTestRunner {
  private wallet: MockWalletProvider;
  private contracts: Map<string, MockVaultContract>;

  constructor() {
    this.wallet = new MockWalletProvider();
    this.contracts = new Map();
  }

  async runFullDepositTest(vaultAddress: string, depositAmount: number): Promise<boolean> {
    try {
      console.log('\n🚀 Starting Full Deposit Test');
      console.log('================================');

      // Step 1: Connect wallet
      await this.wallet.connect();
      
      // Step 2: Check initial balance
      const initialBalance = this.wallet.getBalance();
      console.log(`💰 Initial wallet balance: $${initialBalance}`);
      
      // Step 3: Get vault contract
      if (!this.contracts.has(vaultAddress)) {
        this.contracts.set(vaultAddress, new MockVaultContract(vaultAddress));
      }
      const vault = this.contracts.get(vaultAddress)!;
      
      // Step 4: Get vault info
      const vaultInfo = await vault.getVaultInfo();
      console.log(`📊 Vault: ${vaultInfo.name}`);
      console.log(`📊 TVL: $${vaultInfo.tvl.toLocaleString()}`);
      console.log(`📊 APY: ${(vaultInfo.apy * 100).toFixed(1)}%`);
      
      // Step 5: Check initial user shares
      const initialShares = await vault.getUserShares(this.wallet.getAddress());
      console.log(`📈 Initial shares: ${initialShares}`);
      
      // Step 6: Perform deposit
      console.log(`\n💰 Depositing $${depositAmount}...`);
      await vault.deposit(this.wallet.getAddress(), depositAmount);
      const txHash = await this.wallet.deposit(vaultAddress, depositAmount);
      
      // Step 7: Verify results
      const finalBalance = this.wallet.getBalance();
      const finalShares = await vault.getUserShares(this.wallet.getAddress());
      
      console.log('\n✅ Deposit Test Results:');
      console.log(`💵 Wallet balance: $${initialBalance} → $${finalBalance}`);
      console.log(`📈 Vault shares: ${initialShares} → ${finalShares}`);
      console.log(`📄 Transaction hash: ${txHash}`);
      
      return true;
    } catch (error) {
      console.error('❌ Deposit test failed:', error);
      return false;
    }
  }

  async runFullWithdrawalTest(vaultAddress: string, shareAmount: number): Promise<boolean> {
    try {
      console.log('\n🚀 Starting Full Withdrawal Test');
      console.log('==================================');

      // Ensure we have shares to withdraw
      if (!this.contracts.has(vaultAddress)) {
        console.log('❌ No deposits found for this vault. Run deposit test first.');
        return false;
      }

      const vault = this.contracts.get(vaultAddress)!;
      const userAddress = this.wallet.getAddress();
      
      // Step 1: Check current state
      const initialBalance = this.wallet.getBalance();
      const initialShares = await vault.getUserShares(userAddress);
      
      console.log(`💰 Initial wallet balance: $${initialBalance}`);
      console.log(`📈 Initial shares: ${initialShares}`);
      
      if (initialShares === 0) {
        console.log('❌ No shares to withdraw. Run deposit test first.');
        return false;
      }

      // Step 2: Perform withdrawal
      console.log(`\n📤 Withdrawing ${shareAmount} shares...`);
      const usdAmount = await vault.withdraw(userAddress, shareAmount);
      const txHash = await this.wallet.withdraw(vaultAddress, shareAmount);
      
      // Step 3: Verify results
      const finalBalance = this.wallet.getBalance();
      const finalShares = await vault.getUserShares(userAddress);
      
      console.log('\n✅ Withdrawal Test Results:');
      console.log(`💵 Wallet balance: $${initialBalance} → $${finalBalance}`);
      console.log(`📈 Vault shares: ${initialShares} → ${finalShares}`);
      console.log(`💰 USD received: $${usdAmount.toFixed(2)}`);
      console.log(`📄 Transaction hash: ${txHash}`);
      
      return true;
    } catch (error) {
      console.error('❌ Withdrawal test failed:', error);
      return false;
    }
  }

  async runCompleteFlowTest(): Promise<void> {
    console.log('\n🎯 Running Complete Deposit/Withdrawal Flow Test');
    console.log('================================================');

    const vaultAddress = '0x1234567890123456789012345678901234567890';
    const depositAmount = 1000;
    const withdrawalShares = 500;

    // Test deposit
    const depositSuccess = await this.runFullDepositTest(vaultAddress, depositAmount);
    
    if (depositSuccess) {
      // Wait a bit to simulate time passing
      console.log('\n⏳ Waiting 2 seconds...');
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Test withdrawal
      await this.runFullWithdrawalTest(vaultAddress, withdrawalShares);
    }

    await this.wallet.disconnect();
    console.log('\n🏁 Test completed!');
  }
}

// Export for use in tests
export const mockWalletUtils = {
  createMockWallet: () => new MockWalletProvider(),
  createMockVault: (address: string) => new MockVaultContract(address),
  createTestRunner: () => new DepositWithdrawalTestRunner(),
};

// If running as a script
if (require.main === module) {
  const testRunner = new DepositWithdrawalTestRunner();
  testRunner.runCompleteFlowTest().catch(console.error);
}
