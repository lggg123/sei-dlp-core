#!/usr/bin/env node

/**
 * Manual Test Runner for Deposit/Withdrawal
 * Run this script to test deposit/withdrawal flows manually
 * @author Frontend Developer
 */

const { DepositWithdrawalTestRunner } = require('../scripts/test-deposit-withdrawal');

async function runManualTests() {
  console.log('🧪 SEI DLP - Deposit/Withdrawal Manual Testing');
  console.log('==============================================\n');

  const testRunner = new DepositWithdrawalTestRunner();

  try {
    // Test 1: Complete flow with default values
    console.log('Test 1: Complete Deposit → Withdrawal Flow');
    await testRunner.runCompleteFlowTest();

    console.log('\n' + '='.repeat(50));

    // Test 2: Multiple deposits
    console.log('\nTest 2: Multiple Deposits');
    const vaults = [
      '0x1234567890123456789012345678901234567890', // SEI-USDC
      '0x2345678901234567890123456789012345678901', // ATOM-SEI
      '0x3456789012345678901234567890123456789012', // ETH-USDT
    ];

    for (const vaultAddr of vaults) {
      await testRunner.runFullDepositTest(vaultAddr, 500);
      console.log(''); // Add spacing
    }

    console.log('\n' + '='.repeat(50));

    // Test 3: Edge cases
    console.log('\nTest 3: Edge Case Testing');
    
    // Small amount
    await testRunner.runFullDepositTest(vaults[0], 10);
    
    // Large amount  
    await testRunner.runFullDepositTest(vaults[0], 10000);

    console.log('\n✅ All manual tests completed successfully!');

  } catch (error) {
    console.error('\n❌ Manual test failed:', error);
    process.exit(1);
  }
}

// CLI interface
const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
  console.log('SEI DLP Deposit/Withdrawal Test Runner\n');
  console.log('Usage:');
  console.log('  npm run test:manual              # Run all manual tests');
  console.log('  npm run test:manual -- --quick   # Run quick test only');
  console.log('  npm run test:manual -- --help    # Show this help');
  console.log('\nOptions:');
  console.log('  --quick    Run only the basic deposit/withdrawal flow');
  console.log('  --help     Show this help message');
  process.exit(0);
}

if (args.includes('--quick')) {
  // Quick test - just basic flow
  (async () => {
    const testRunner = new DepositWithdrawalTestRunner();
    await testRunner.runCompleteFlowTest();
  })();
} else {
  // Full test suite
  runManualTests();
}
