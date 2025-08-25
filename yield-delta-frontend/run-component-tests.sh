#!/bin/bash
# Test runner script for component tests
# Runs Jest tests with proper configuration

echo "🧪 Running Component Tests..."
echo "=============================="

# Set NODE_ENV for testing
export NODE_ENV=test

# Run specific component tests
echo "🔍 Running DepositModal tests..."
npx jest src/components/__tests__/DepositModal.test.tsx --verbose --no-cache

echo ""
echo "🔍 Running WithdrawalModal tests..."
npx jest src/components/__tests__/WithdrawalModal.test.tsx --verbose --no-cache

echo ""
echo "🔍 Running Integration tests..."
npx jest src/__tests__/integration/deposit-withdrawal-flow.test.tsx --verbose --no-cache

echo ""
echo "✅ Test run complete!"
