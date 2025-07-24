// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "../src/EnhancedStrategyVault.sol";
import "../src/AIOracle.sol";

contract MockERC20 is ERC20 {
    constructor(string memory name, string memory symbol) ERC20(name, symbol) {
        _mint(msg.sender, 1000000 * 10**18);
    }
    
    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}

contract EnhancedVaultCustomerTest is Test {
    EnhancedStrategyVault public vault;
    AIOracle public aiOracle;
    MockERC20 public token0;
    MockERC20 public token1;
    
    address public owner = address(0x123);
    address public customer1 = address(0x456);
    address public customer2 = address(0x789);
    address public aiSigner = address(0x3);
    
    function setUp() public {
        // Set SEI chain ID
        vm.chainId(713715);
        
        // Deploy mock tokens
        token0 = new MockERC20("USDC", "USDC");
        token1 = new MockERC20("WSEI", "WSEI");
        
        // Deploy AI Oracle
        vm.startPrank(owner);
        aiOracle = new AIOracle(owner);
        vm.stopPrank();
        
        // Deploy enhanced vault
        vault = new EnhancedStrategyVault(
            "SEI DLP Enhanced Vault",
            "SEIDLPE",
            address(token0),
            address(token1),
            3000,
            address(aiOracle),
            owner
        );
        
        // Give customers tokens
        token0.transfer(customer1, 10000 * 10**18);
        token1.transfer(customer1, 10000 * 10**18);
        token0.transfer(customer2, 10000 * 10**18);
        token1.transfer(customer2, 10000 * 10**18);
    }
    
    function testCustomerDeposit() public {
        uint256 amount0 = 1000 * 10**18;
        uint256 amount1 = 1000 * 10**18;
        
        vm.startPrank(customer1);
        token0.approve(address(vault), amount0);
        token1.approve(address(vault), amount1);
        
        uint256 sharesBefore = vault.balanceOf(customer1);
        uint256 shares = vault.deposit(amount0, amount1, customer1);
        uint256 sharesAfter = vault.balanceOf(customer1);
        
        assertEq(sharesAfter - sharesBefore, shares);
        assertTrue(shares > 0);
        
        // Check customer stats
        (
            uint256 customerShares,
            uint256 shareValue,
            uint256 totalDeposited,
            uint256 totalWithdrawn,
            uint256 depositTime,
            uint256 lockTimeRemaining
        ) = vault.getCustomerStats(customer1);
        
        assertEq(customerShares, shares);
        assertEq(totalDeposited, amount0 + amount1);
        assertEq(totalWithdrawn, 0);
        assertEq(depositTime, block.timestamp);
        assertEq(lockTimeRemaining, 24 hours);
        assertTrue(shareValue > 0);
        
        vm.stopPrank();
    }
    
    function testLockPeriodEnforcement() public {
        uint256 amount0 = 1000 * 10**18;
        uint256 amount1 = 1000 * 10**18;
        
        // Customer deposits
        vm.startPrank(customer1);
        token0.approve(address(vault), amount0);
        token1.approve(address(vault), amount1);
        uint256 shares = vault.deposit(amount0, amount1, customer1);
        
        // Try to withdraw immediately (should fail)
        vm.expectRevert("Minimum lock period not met");
        vault.withdraw(shares, customer1);
        
        // Fast forward time
        vm.warp(block.timestamp + 24 hours + 1);
        
        // Now withdrawal should work
        vault.withdraw(shares, customer1);
        vm.stopPrank();
    }
    
    function testWithdrawalFees() public {
        uint256 amount0 = 1000 * 10**18;
        uint256 amount1 = 1000 * 10**18;
        
        // Customer deposits
        vm.startPrank(customer1);
        token0.approve(address(vault), amount0);
        token1.approve(address(vault), amount1);
        uint256 shares = vault.deposit(amount0, amount1, customer1);
        
        // Fast forward past lock period
        vm.warp(block.timestamp + 24 hours + 1);
        
        uint256 balanceBefore0 = token0.balanceOf(customer1);
        uint256 balanceBefore1 = token1.balanceOf(customer1);
        
        (uint256 amount0Out, uint256 amount1Out) = vault.withdraw(shares, customer1);
        
        uint256 balanceAfter0 = token0.balanceOf(customer1);
        uint256 balanceAfter1 = token1.balanceOf(customer1);
        
        // Check that withdrawal fees were applied (0.5%)
        uint256 expectedFee0 = (amount0 * 50) / 10000;
        uint256 expectedFee1 = (amount1 * 50) / 10000;
        
        assertEq(balanceAfter0 - balanceBefore0, amount0Out);
        assertEq(balanceAfter1 - balanceBefore1, amount1Out);
        
        // Verify fees were deducted
        assertTrue(amount0Out < amount0);
        assertTrue(amount1Out < amount1);
        
        vm.stopPrank();
    }
    
    function testManagementFeeCollection() public {
        uint256 amount0 = 1000 * 10**18;
        uint256 amount1 = 1000 * 10**18;
        
        // Customer deposits
        vm.startPrank(customer1);
        token0.approve(address(vault), amount0);
        token1.approve(address(vault), amount1);
        vault.deposit(amount0, amount1, customer1);
        vm.stopPrank();
        
        uint256 ownerSharesBefore = vault.balanceOf(owner);
        
        // Fast forward 1 year to trigger management fees
        vm.warp(block.timestamp + 365 days);
        
        // Trigger fee collection through another deposit
        vm.startPrank(customer2);
        token0.approve(address(vault), amount0);
        token1.approve(address(vault), amount1);
        vault.deposit(amount0, amount1, customer2);
        vm.stopPrank();
        
        uint256 ownerSharesAfter = vault.balanceOf(owner);
        
        // Owner should have received management fee shares
        assertTrue(ownerSharesAfter > ownerSharesBefore);
    }
    
    function testYieldDistribution() public {
        uint256 amount0 = 1000 * 10**18;
        uint256 amount1 = 1000 * 10**18;
        
        // Customer deposits
        vm.startPrank(customer1);
        token0.approve(address(vault), amount0);
        token1.approve(address(vault), amount1);
        vault.deposit(amount0, amount1, customer1);
        vm.stopPrank();
        
        // Simulate yield generation by sending tokens to vault
        token0.mint(address(vault), 100 * 10**18);
        
        uint256 totalYieldBefore = vault.totalYieldGenerated();
        
        // Distribute yield
        vm.prank(owner);
        vault.distributeYield();
        
        uint256 totalYieldAfter = vault.totalYieldGenerated();
        
        assertTrue(totalYieldAfter > totalYieldBefore);
    }
    
    function testMinimumLockPeriodUpdate() public {
        uint256 newPeriod = 48 hours;
        
        vm.prank(owner);
        vault.setMinimumLockPeriod(newPeriod);
        
        assertEq(vault.minimumLockPeriod(), newPeriod);
        
        // Test that period can't be too long
        vm.prank(owner);
        vm.expectRevert("Lock period too long");
        vault.setMinimumLockPeriod(31 days);
    }
    
    function testCustomerStatsTracking() public {
        uint256 amount0 = 1000 * 10**18;
        uint256 amount1 = 1000 * 10**18;
        
        // First deposit
        vm.startPrank(customer1);
        token0.approve(address(vault), amount0 * 2);
        token1.approve(address(vault), amount1 * 2);
        
        vault.deposit(amount0, amount1, customer1);
        
        (,, uint256 totalDeposited1,,, uint256 lockTime1) = vault.getCustomerStats(customer1);
        assertEq(totalDeposited1, amount0 + amount1);
        assertEq(lockTime1, 24 hours);
        
        // Fast forward and make another deposit
        vm.warp(block.timestamp + 12 hours);
        vault.deposit(amount0, amount1, customer1);
        
        (,, uint256 totalDeposited2,,, uint256 lockTime2) = vault.getCustomerStats(customer1);
        assertEq(totalDeposited2, (amount0 + amount1) * 2);
        assertEq(lockTime2, 12 hours); // Updated deposit time
        
        vm.stopPrank();
    }
    
    function testMultipleCustomersShareCalculation() public {
        uint256 amount0 = 1000 * 10**18;
        uint256 amount1 = 1000 * 10**18;
        
        // Customer 1 deposits first
        vm.startPrank(customer1);
        token0.approve(address(vault), amount0);
        token1.approve(address(vault), amount1);
        uint256 shares1 = vault.deposit(amount0, amount1, customer1);
        vm.stopPrank();
        
        // Customer 2 deposits same amount
        vm.startPrank(customer2);
        token0.approve(address(vault), amount0);
        token1.approve(address(vault), amount1);
        uint256 shares2 = vault.deposit(amount0, amount1, customer2);
        vm.stopPrank();
        
        // Shares should be approximately equal for equal deposits
        uint256 shareDiff = shares1 > shares2 ? shares1 - shares2 : shares2 - shares1;
        assertTrue(shareDiff <= shares1 / 100); // Less than 1% difference
        
        // Total supply should equal sum of individual shares
        assertEq(vault.totalSupply(), shares1 + shares2 + 1000); // +1000 for burned initial liquidity
    }
}
