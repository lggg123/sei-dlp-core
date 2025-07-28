// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../lib/openzeppelin-contracts/contracts/token/ERC20/ERC20.sol";
import "../src/StrategyVault.sol";
import "../src/VaultFactory.sol";
import "../src/AIOracle.sol";

contract MockERC20 is ERC20 {
    constructor(string memory name, string memory symbol) ERC20(name, symbol) {
        _mint(msg.sender, 1000000 * 10**18);
    }
    
    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}

contract StrategyVaultTest is Test {
    StrategyVault public vault;
    VaultFactory public factory;
    AIOracle public aiOracle;
    MockERC20 public token0;
    MockERC20 public token1;
    
    address public owner = address(0x1);
    address public user = address(0x2);
    address public aiSigner = address(0x3);
    
    // Events from StrategyVault
    event PositionRebalanced(int24 oldTickLower, int24 oldTickUpper, int24 newTickLower, int24 newTickUpper);
    event DepositExecuted(address indexed user, uint256 amount0, uint256 amount1, uint256 shares);
    event WithdrawExecuted(address indexed user, uint256 shares, uint256 amount0, uint256 amount1);
    
    function setUp() public {
        // Set SEI chain ID
        vm.chainId(713715);
        
        // Deploy mock tokens
        token0 = new MockERC20("Token0", "TK0");
        token1 = new MockERC20("Token1", "TK1");
        
        // Deploy AI Oracle
        vm.startPrank(owner);
        aiOracle = new AIOracle(owner);
        aiOracle.registerAIModel("v1.0", aiSigner);
        vm.stopPrank();
        
        // Deploy factory
        factory = new VaultFactory(address(aiOracle), owner);
        
        // Create vault
        vm.startPrank(user);
        vm.deal(user, 1 ether);
        
        VaultFactory.VaultCreationParams memory params = VaultFactory.VaultCreationParams({
            name: "SEI DLP Vault",
            symbol: "SEIDLP",
            token0: address(token0),
            token1: address(token1),
            poolFee: 3000,
            aiOracle: address(aiOracle)
        });
        
        address vaultAddress = factory.createVault{value: 0.1 ether}(params);
        vault = StrategyVault(vaultAddress);
        vm.stopPrank();
        
        // Setup token balances
        token0.mint(user, 1000 * 10**18);
        token1.mint(user, 1000 * 10**18);
    }
    
    function testVaultCreation() public {
        IStrategyVault.VaultInfo memory info = vault.getVaultInfo();
        assertEq(info.name, "SEI DLP Vault");
        assertEq(info.token0, address(token0));
        assertEq(info.token1, address(token1));
        assertEq(info.poolFee, 3000);
        assertTrue(info.isActive);
        assertEq(info.strategy, "AI_DYNAMIC_LIQUIDITY");
    }
    
    function testSEIChainValidation() public {
        vm.chainId(1); // Ethereum mainnet
        
        vm.expectRevert("Invalid chain");
        new StrategyVault(
            "Test",
            "TEST",
            address(token0),
            address(token1),
            3000,
            address(aiOracle),
            owner
        );
    }
    
    function testDepositValidation() public {
        vm.startPrank(user);
        
        // Test zero amounts
        vm.expectRevert("Invalid amounts");
        vault.deposit(0, 0, user);
        
        // Test zero recipient
        vm.expectRevert("Invalid recipient");
        vault.deposit(100, 100, address(0));
        
        vm.stopPrank();
    }
    
    function testInitialDeposit() public {
        uint256 amount0 = 100 * 10**18;
        uint256 amount1 = 100 * 10**18;
        
        vm.startPrank(user);
        token0.approve(address(vault), amount0);
        token1.approve(address(vault), amount1);
        
        uint256 shares = vault.deposit(amount0, amount1, user);
        
        assertGt(shares, 0);
        assertEq(vault.balanceOf(user), shares);
        assertGt(vault.totalSupply(), 0);
        
        IStrategyVault.VaultInfo memory info = vault.getVaultInfo();
        assertGt(info.totalValueLocked, 0);
        assertEq(info.totalSupply, vault.totalSupply());
        
        vm.stopPrank();
    }
    
    function testSubsequentDeposit() public {
        // First deposit
        uint256 amount0 = 100 * 10**18;
        uint256 amount1 = 100 * 10**18;
        
        vm.startPrank(user);
        token0.approve(address(vault), amount0 * 2);
        token1.approve(address(vault), amount1 * 2);
        
        uint256 firstShares = vault.deposit(amount0, amount1, user);
        uint256 secondShares = vault.deposit(amount0, amount1, user);
        
        assertGt(firstShares, 0);
        assertGt(secondShares, 0);
        assertEq(vault.balanceOf(user), firstShares + secondShares);
        
        vm.stopPrank();
    }
    
    function testWithdrawValidation() public {
        vm.startPrank(user);
        
        // Test zero shares
        vm.expectRevert("Invalid shares");
        vault.withdraw(0, user);
        
        // Test insufficient shares
        vm.expectRevert("Insufficient shares");
        vault.withdraw(1000, user);
        
        vm.stopPrank();
    }
    
    function testWithdrawAfterDeposit() public {
        // First deposit
        uint256 amount0 = 100 * 10**18;
        uint256 amount1 = 100 * 10**18;
        
        vm.startPrank(user);
        token0.approve(address(vault), amount0);
        token1.approve(address(vault), amount1);
        
        uint256 shares = vault.deposit(amount0, amount1, user);
        
        // Store balances before withdrawal
        uint256 balanceBefore0 = token0.balanceOf(user);
        uint256 balanceBefore1 = token1.balanceOf(user);
        
        // Then withdraw
        (uint256 withdrawn0, uint256 withdrawn1) = vault.withdraw(shares, user);
        
        assertGt(withdrawn0, 0);
        assertGt(withdrawn1, 0);
        assertEq(vault.balanceOf(user), 0);
        assertGt(token0.balanceOf(user), balanceBefore0);
        assertGt(token1.balanceOf(user), balanceBefore1);
        
        vm.stopPrank();
    }
    
    function testRebalanceOnlyAIOracle() public {
        IStrategyVault.AIRebalanceParams memory params = IStrategyVault.AIRebalanceParams({
            newTickLower: -1000,
            newTickUpper: 1000,
            minAmount0: 0,
            minAmount1: 0,
            deadline: block.timestamp + 3600,
            aiSignature: ""
        });
        
        vm.expectRevert("Unauthorized AI oracle");
        vault.rebalance(params);
    }
    
    function testRebalanceFrequencyLimit() public {
        // Deposit first to initialize vault
        uint256 amount0 = 100 * 10**18;
        uint256 amount1 = 100 * 10**18;
        
        vm.startPrank(user);
        token0.approve(address(vault), amount0);
        token1.approve(address(vault), amount1);
        vault.deposit(amount0, amount1, user);
        vm.stopPrank();
        
        IStrategyVault.AIRebalanceParams memory params = IStrategyVault.AIRebalanceParams({
            newTickLower: -1000,
            newTickUpper: 1000,
            minAmount0: 0,
            minAmount1: 0,
            deadline: block.timestamp + 3600,
            aiSignature: ""
        });
        
        // First rebalance should work
        vm.prank(address(aiOracle));
        vault.rebalance(params);
        
        // Second rebalance too soon should fail
        vm.prank(address(aiOracle));
        vm.expectRevert("Rebalance too frequent");
        vault.rebalance(params);
        
        // After time passes, should work again
        vm.warp(block.timestamp + 3601);
        
        // Update deadline for the new timestamp
        params.deadline = block.timestamp + 3600;
        
        vm.prank(address(aiOracle));
        vault.rebalance(params);
    }
    
    function testEmergencyPause() public {
        uint256 amount0 = 100 * 10**18;
        uint256 amount1 = 100 * 10**18;
        
        vm.startPrank(user);
        token0.approve(address(vault), amount0);
        token1.approve(address(vault), amount1);
        
        // Should work normally
        vault.deposit(amount0, amount1, user);
        
        vm.stopPrank();
        
        // Owner pauses vault
        vm.prank(vault.owner());
        vault.emergencyPause();
        
        // Operations should fail when paused
        vm.startPrank(user);
        vm.expectRevert("Vault paused");
        vault.deposit(amount0, amount1, user);
        
        uint256 userBalance = vault.balanceOf(user);
        vm.expectRevert("Vault paused");
        vault.withdraw(userBalance, user);
        
        vm.stopPrank();
        
        // Resume should work
        vm.prank(vault.owner());
        vault.resume();
        
        // Operations should work again
        vm.startPrank(user);
        token0.approve(address(vault), amount0);
        token1.approve(address(vault), amount1);
        vault.deposit(amount0, amount1, user);
        vm.stopPrank();
    }
    
    function testUpdateAIOracle() public {
        address newOracle = address(0x999);
        
        // Only owner can update
        vm.expectRevert();
        vault.updateAIOracle(newOracle);
        
        // Owner can update
        vm.prank(vault.owner());
        vault.updateAIOracle(newOracle);
        
        assertEq(vault.aiOracle(), newOracle);
        
        // Cannot set zero address
        vm.prank(vault.owner());
        vm.expectRevert("Invalid oracle");
        vault.updateAIOracle(address(0));
    }
    
    function testPositionTracking() public {
        IStrategyVault.Position memory position = vault.getCurrentPosition();
        // Initial position should be empty/default
        assertEq(position.tickLower, 0);
        assertEq(position.tickUpper, 0);
        assertEq(position.liquidity, 0);
    }
    
    function testEventEmission() public {
        uint256 amount0 = 100 * 10**18;
        uint256 amount1 = 100 * 10**18;
        
        vm.startPrank(user);
        token0.approve(address(vault), amount0);
        token1.approve(address(vault), amount1);
        
        // Should emit VaultCreated event during setup
        // Rebalance should emit events
        IStrategyVault.AIRebalanceParams memory params = IStrategyVault.AIRebalanceParams({
            newTickLower: -1000,
            newTickUpper: 1000,
            minAmount0: 0,
            minAmount1: 0,
            deadline: block.timestamp + 3600,
            aiSignature: ""
        });
        
        vault.deposit(amount0, amount1, user);
        vm.stopPrank();
        
        vm.expectEmit(true, true, true, true);
        emit PositionRebalanced(0, 0, -1000, 1000);
        
        vm.prank(address(aiOracle));
        vault.rebalance(params);
    }
}
