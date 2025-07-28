// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/SEIVault.sol";
import "../src/interfaces/ISEIVault.sol";
import "../lib/openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";
import "../lib/openzeppelin-contracts/contracts/token/ERC20/ERC20.sol";

contract MockERC20 is ERC20 {
    constructor(string memory name, string memory symbol) ERC20(name, symbol) {
        _mint(msg.sender, 1000000 * 10**18);
    }

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}

contract SEIVaultTest is Test {
    SEIVault public vault;
    MockERC20 public token;
    
    address public owner = address(1);
    address public user1 = address(2);
    address public user2 = address(3);
    address public aiModel = address(4);
    
    uint256 constant SEI_CHAIN_ID = 713715;
    uint256 constant INITIAL_BALANCE = 10000 * 1e18;
    
    event SEIOptimizedDeposit(address indexed user, uint256 amount, uint256 shares, uint256 blockTime);
    event SEIOptimizedWithdraw(address indexed user, uint256 amount, uint256 shares, uint256 blockTime);
    event ParallelExecutionEnabled(bool enabled);
    event FinalityOptimized(uint256 blockTime, uint256 executionBatch);
    event SEIChainValidated(uint256 chainId, bool isValid);
    
    function setUp() public {
        // Set chain ID to SEI network
        vm.chainId(SEI_CHAIN_ID);
        
        // Deploy mock token
        vm.prank(owner);
        token = new MockERC20("Test Token", "TEST");
        
        // Deploy SEI vault
        vm.prank(owner);
        vault = new SEIVault(
            address(token),
            "SEI Vault Token",
            "SVT",
            owner,
            aiModel
        );
        
        // Setup initial balances
        vm.prank(owner);
        token.mint(user1, INITIAL_BALANCE);
        vm.prank(owner);
        token.mint(user2, INITIAL_BALANCE);
    }
    
    function test_InitialState() public view {
        assertEq(vault.asset(), address(token));
        assertEq(vault.name(), "SEI Vault Token");
        assertEq(vault.symbol(), "SVT");
        assertEq(vault.owner(), owner);
        assertEq(vault.aiModel(), aiModel);
        assertTrue(vault.parallelExecutionEnabled());
        assertEq(vault.getSEIChainId(), SEI_CHAIN_ID);
    }
    
    function test_SEIChainValidation() public {
        // Test valid SEI chain
        vm.chainId(SEI_CHAIN_ID);
        vm.expectEmit(true, false, false, true);
        emit SEIChainValidated(SEI_CHAIN_ID, true);
        assertTrue(vault.validateSEIChain());
        
        // Test invalid chain
        vm.chainId(1); // Ethereum mainnet
        vm.expectEmit(true, false, false, true);
        emit SEIChainValidated(1, false);
        assertFalse(vault.validateSEIChain());
    }
    
    function test_SEIOptimizedDeposit() public {
        uint256 depositAmount = 1000 * 1e18;
        
        vm.startPrank(user1);
        token.approve(address(vault), depositAmount);
        
        vm.expectEmit(true, false, false, true);
        emit SEIOptimizedDeposit(user1, depositAmount, depositAmount, block.timestamp);
        
        uint256 shares = vault.seiOptimizedDeposit(depositAmount, user1);
        vm.stopPrank();
        
        assertEq(shares, depositAmount);
        assertEq(vault.balanceOf(user1), depositAmount);
        assertEq(vault.totalAssets(), depositAmount);
        assertEq(token.balanceOf(address(vault)), depositAmount);
    }
    
    function test_SEIOptimizedDepositWithParallelExecution() public {
        uint256 depositAmount = 1000 * 1e18;
        
        // Enable parallel execution optimization
        vm.prank(owner);
        vault.setParallelExecution(true);
        
        vm.startPrank(user1);
        token.approve(address(vault), depositAmount);
        
        vm.expectEmit(true, false, false, true);
        emit ParallelExecutionEnabled(true);
        
        vm.expectEmit(true, false, false, true);
        emit SEIOptimizedDeposit(user1, depositAmount, depositAmount, block.timestamp);
        
        uint256 shares = vault.seiOptimizedDeposit(depositAmount, user1);
        vm.stopPrank();
        
        assertEq(shares, depositAmount);
        assertTrue(vault.parallelExecutionEnabled());
    }
    
    function test_SEIOptimizedWithdraw() public {
        // First deposit
        uint256 depositAmount = 1000 * 1e18;
        vm.startPrank(user1);
        token.approve(address(vault), depositAmount);
        vault.seiOptimizedDeposit(depositAmount, user1);
        
        // Then withdraw
        uint256 withdrawShares = 500 * 1e18;
        vm.expectEmit(true, false, false, true);
        emit SEIOptimizedWithdraw(user1, withdrawShares, withdrawShares, block.timestamp);
        
        uint256 assets = vault.seiOptimizedWithdraw(withdrawShares, user1, user1);
        vm.stopPrank();
        
        assertEq(assets, withdrawShares);
        assertEq(vault.balanceOf(user1), depositAmount - withdrawShares);
        assertEq(token.balanceOf(user1), INITIAL_BALANCE - depositAmount + withdrawShares);
    }
    
    function test_FinalityOptimization() public {
        // Test finality optimization with SEI's 400ms blocks
        vm.warp(block.timestamp + 1); // Advance 1 second (2.5 SEI blocks)
        
        vm.expectEmit(false, false, false, true);
        emit FinalityOptimized(block.timestamp, 1);
        
        vm.prank(owner);
        vault.optimizeForFinality();
        
        // Verify finality optimization state
        assertEq(vault.getLastFinalityOptimization(), block.timestamp);
    }
    
    function test_ParallelExecutionToggle() public {
        // Initially enabled
        assertTrue(vault.parallelExecutionEnabled());
        
        // Disable parallel execution
        vm.expectEmit(false, false, false, true);
        emit ParallelExecutionEnabled(false);
        
        vm.prank(owner);
        vault.setParallelExecution(false);
        assertFalse(vault.parallelExecutionEnabled());
        
        // Re-enable parallel execution
        vm.expectEmit(false, false, false, true);
        emit ParallelExecutionEnabled(true);
        
        vm.prank(owner);
        vault.setParallelExecution(true);
        assertTrue(vault.parallelExecutionEnabled());
    }
    
    function test_OnlyOwnerCanSetParallelExecution() public {
        vm.expectRevert(
            abi.encodeWithSelector(
                Ownable.OwnableUnauthorizedAccount.selector,
                user1
            )
        );
        vm.prank(user1);
        vault.setParallelExecution(false);
    }
    
    function test_OnlyOwnerCanOptimizeFinality() public {
        vm.expectRevert(
            abi.encodeWithSelector(
                Ownable.OwnableUnauthorizedAccount.selector,
                user1
            )
        );
        vm.prank(user1);
        vault.optimizeForFinality();
    }
    
    function test_RevertOnInvalidChainDeposit() public {
        // Switch to non-SEI chain
        vm.chainId(1);
        
        uint256 depositAmount = 1000 * 1e18;
        vm.startPrank(user1);
        token.approve(address(vault), depositAmount);
        
        vm.expectRevert("Invalid SEI chain");
        vault.seiOptimizedDeposit(depositAmount, user1);
        vm.stopPrank();
    }
    
    function test_RevertOnInvalidChainWithdraw() public {
        // First deposit on correct chain
        uint256 depositAmount = 1000 * 1e18;
        vm.startPrank(user1);
        token.approve(address(vault), depositAmount);
        vault.seiOptimizedDeposit(depositAmount, user1);
        
        // Switch to invalid chain for withdrawal
        vm.chainId(1);
        
        vm.expectRevert("Invalid SEI chain");
        vault.seiOptimizedWithdraw(500 * 1e18, user1, user1);
        vm.stopPrank();
    }
    
    function test_SEISpecificGasOptimizations() public {
        uint256 depositAmount = 1000 * 1e18;
        
        vm.startPrank(user1);
        token.approve(address(vault), depositAmount);
        
        uint256 gasBefore = gasleft();
        vault.seiOptimizedDeposit(depositAmount, user1);
        uint256 gasUsed = gasBefore - gasleft();
        
        // SEI optimizations should keep gas usage reasonable
        // This is a relative test - actual gas costs will vary
        assertTrue(gasUsed < 200000, "Gas usage should be optimized for SEI");
        vm.stopPrank();
    }
    
    function test_MultipleConcurrentDeposits() public {
        uint256 depositAmount = 1000 * 1e18;
        
        // Enable parallel execution
        vm.prank(owner);
        vault.setParallelExecution(true);
        
        // User 1 deposit
        vm.startPrank(user1);
        token.approve(address(vault), depositAmount);
        uint256 shares1 = vault.seiOptimizedDeposit(depositAmount, user1);
        vm.stopPrank();
        
        // User 2 deposit (simulating parallel execution)
        vm.startPrank(user2);
        token.approve(address(vault), depositAmount);
        uint256 shares2 = vault.seiOptimizedDeposit(depositAmount, user2);
        vm.stopPrank();
        
        assertEq(shares1, depositAmount);
        assertEq(shares2, depositAmount);
        assertEq(vault.totalAssets(), depositAmount * 2);
        assertEq(vault.balanceOf(user1), depositAmount);
        assertEq(vault.balanceOf(user2), depositAmount);
    }
    
    function test_FinalityOptimizationCooldown() public {
        // First optimization
        vm.prank(owner);
        vault.optimizeForFinality();
        uint256 firstOptimization = vault.getLastFinalityOptimization();
        
        // Advance time by 1 second (less than 400ms * 10 blocks)
        vm.warp(block.timestamp + 1);
        
        // Second optimization should work
        vm.prank(owner);
        vault.optimizeForFinality();
        uint256 secondOptimization = vault.getLastFinalityOptimization();
        
        assertTrue(secondOptimization > firstOptimization);
    }
    
    function test_InterfaceCompliance() public {
        // Test that SEIVault implements ISEIVault interface
        ISEIVault seiVaultInterface = ISEIVault(address(vault));
        
        // These calls should not revert if interface is properly implemented
        seiVaultInterface.getSEIChainId();
        // Note: validateSEIChain() modifies state so it can't be called in a view context
        seiVaultInterface.parallelExecutionEnabled();
        seiVaultInterface.getLastFinalityOptimization();
    }
    
    function test_EdgeCaseZeroDeposit() public {
        vm.startPrank(user1);
        token.approve(address(vault), 0);
        
        vm.expectRevert("Deposit amount must be greater than 0");
        vault.seiOptimizedDeposit(0, user1);
        vm.stopPrank();
    }
    
    function test_EdgeCaseZeroWithdraw() public {
        // First deposit something
        uint256 depositAmount = 1000 * 1e18;
        vm.startPrank(user1);
        token.approve(address(vault), depositAmount);
        vault.seiOptimizedDeposit(depositAmount, user1);
        
        vm.expectRevert("Withdraw amount must be greater than 0");
        vault.seiOptimizedWithdraw(0, user1, user1);
        vm.stopPrank();
    }
    
    function test_SEINetworkSpecificFeatures() public {
        // Test SEI-specific optimizations are active
        assertTrue(vault.parallelExecutionEnabled(), "Parallel execution should be enabled by default");
        assertEq(vault.getSEIChainId(), SEI_CHAIN_ID, "Should be configured for SEI network");
        
        // Test finality optimization
        vm.prank(owner);
        vault.optimizeForFinality();
        assertGt(vault.getLastFinalityOptimization(), 0, "Finality optimization should be recorded");
    }
}
