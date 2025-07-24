// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "../src/VaultFactory.sol";
import "../src/AIOracle.sol";

contract MockERC20 is ERC20 {
    constructor(string memory name, string memory symbol) ERC20(name, symbol) {
        _mint(msg.sender, 1000000 * 10**18);
    }
}

contract VaultFactoryTest is Test {
    VaultFactory public factory;
    AIOracle public aiOracle;
    MockERC20 public token0;
    MockERC20 public token1;
    
    address public owner = address(0x1);
    address public user = address(0x2);
    
    // Events from VaultFactory
    event VaultCreated(
        address indexed vault,
        address indexed token0,
        address indexed token1,
        uint24 poolFee,
        string name
    );
    address public aiSigner = address(0x3);
    
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
    }
    
    function testFactoryDeployment() public {
        assertEq(factory.defaultAIOracle(), address(aiOracle));
        assertEq(factory.creationFee(), 0.1 ether);
        assertEq(factory.allVaultsLength(), 0);
    }
    
    function testSEIChainValidation() public {
        vm.chainId(1); // Ethereum mainnet
        
        vm.expectRevert("Must deploy on SEI");
        new VaultFactory(address(aiOracle), owner);
    }
    
    function testCreateVaultValidation() public {
        VaultFactory.VaultCreationParams memory params = VaultFactory.VaultCreationParams({
            name: "Test Vault",
            symbol: "TEST",
            token0: address(token0),
            token1: address(token1),
            poolFee: 3000,
            aiOracle: address(0) // Will use default
        });
        
        vm.startPrank(user);
        vm.deal(user, 1 ether);
        
        // Test insufficient fee
        vm.expectRevert("Insufficient creation fee");
        factory.createVault{value: 0.05 ether}(params);
        
        // Test identical tokens
        params.token1 = address(token0);
        vm.expectRevert("Identical tokens");
        factory.createVault{value: 0.1 ether}(params);
        
        // Test zero address tokens
        params.token0 = address(0);
        params.token1 = address(token1);
        vm.expectRevert("Zero address");
        factory.createVault{value: 0.1 ether}(params);
        
        vm.stopPrank();
    }
    
    function testCreateVaultSuccess() public {
        VaultFactory.VaultCreationParams memory params = VaultFactory.VaultCreationParams({
            name: "SEI DLP Vault",
            symbol: "SEIDLP",
            token0: address(token0),
            token1: address(token1),
            poolFee: 3000,
            aiOracle: address(0) // Will use default
        });
        
        vm.startPrank(user);
        vm.deal(user, 1 ether);
        
        // Should emit VaultCreated event
        vm.expectEmit(false, true, true, true);
        emit VaultCreated(
            address(0), // Vault address will be calculated
            address(token0),
            address(token1),
            3000,
            "SEI DLP Vault"
        );
        
        address vault = factory.createVault{value: 0.1 ether}(params);
        
        assertTrue(factory.isVault(vault));
        assertEq(factory.allVaultsLength(), 1);
        assertEq(factory.allVaults(0), vault);
        
        vm.stopPrank();
    }
    
    function testCreateVaultWithCustomOracle() public {
        address customOracle = address(0x999);
        
        VaultFactory.VaultCreationParams memory params = VaultFactory.VaultCreationParams({
            name: "Custom Oracle Vault",
            symbol: "CUSTOM",
            token0: address(token0),
            token1: address(token1),
            poolFee: 3000,
            aiOracle: customOracle
        });
        
        vm.startPrank(user);
        vm.deal(user, 1 ether);
        
        address vault = factory.createVault{value: 0.1 ether}(params);
        StrategyVault strategyVault = StrategyVault(vault);
        
        assertEq(strategyVault.aiOracle(), customOracle);
        
        vm.stopPrank();
    }
    
    function testCreateMultipleVaults() public {
        VaultFactory.VaultCreationParams memory params1 = VaultFactory.VaultCreationParams({
            name: "Vault 1",
            symbol: "V1",
            token0: address(token0),
            token1: address(token1),
            poolFee: 3000,
            aiOracle: address(0)
        });
        
        VaultFactory.VaultCreationParams memory params2 = VaultFactory.VaultCreationParams({
            name: "Vault 2",
            symbol: "V2",
            token0: address(token0),
            token1: address(token1),
            poolFee: 10000, // Different fee tier
            aiOracle: address(0)
        });
        
        vm.startPrank(user);
        vm.deal(user, 1 ether);
        
        address vault1 = factory.createVault{value: 0.1 ether}(params1);
        address vault2 = factory.createVault{value: 0.1 ether}(params2);
        
        assertEq(factory.allVaultsLength(), 2);
        assertTrue(factory.isVault(vault1));
        assertTrue(factory.isVault(vault2));
        assertFalse(vault1 == vault2);
        
        vm.stopPrank();
    }
    
    function testSetCreationFee() public {
        uint256 newFee = 0.2 ether;
        
        // Only owner can set fee
        vm.expectRevert();
        factory.setCreationFee(newFee);
        
        // Owner can set fee
        vm.prank(factory.owner());
        factory.setCreationFee(newFee);
        
        assertEq(factory.creationFee(), newFee);
    }
    
    function testSetDefaultAIOracle() public {
        address newOracle = address(0x999);
        
        // Only owner can set oracle
        vm.expectRevert();
        factory.setDefaultAIOracle(newOracle);
        
        // Cannot set zero address
        vm.prank(factory.owner());
        vm.expectRevert("Invalid oracle");
        factory.setDefaultAIOracle(address(0));
        
        // Owner can set valid oracle
        vm.prank(factory.owner());
        factory.setDefaultAIOracle(newOracle);
        
        assertEq(factory.defaultAIOracle(), newOracle);
    }
    
    function testWithdrawFees() public {
        VaultFactory.VaultCreationParams memory params = VaultFactory.VaultCreationParams({
            name: "Fee Test Vault",
            symbol: "FEE",
            token0: address(token0),
            token1: address(token1),
            poolFee: 3000,
            aiOracle: address(0)
        });
        
        vm.startPrank(user);
        vm.deal(user, 1 ether);
        
        // Create vault (pays fee)
        factory.createVault{value: 0.1 ether}(params);
        
        vm.stopPrank();
        
        // Check factory has fees
        assertEq(address(factory).balance, 0.1 ether);
        
        // Only owner can withdraw
        vm.expectRevert();
        factory.withdrawFees();
        
        // Owner withdraws fees
        uint256 ownerBalanceBefore = factory.owner().balance;
        
        vm.prank(factory.owner());
        factory.withdrawFees();
        
        assertEq(address(factory).balance, 0);
        assertEq(factory.owner().balance, ownerBalanceBefore + 0.1 ether);
    }
    
    function testDeterministicAddresses() public {
        VaultFactory.VaultCreationParams memory params = VaultFactory.VaultCreationParams({
            name: "Deterministic Vault",
            symbol: "DET",
            token0: address(token0),
            token1: address(token1),
            poolFee: 3000,
            aiOracle: address(0)
        });
        
        vm.startPrank(user);
        vm.deal(user, 1 ether);
        
        // Create first vault
        address vault1 = factory.createVault{value: 0.1 ether}(params);
        
        // Try to create same vault again should create different vault
        // (because timestamp is part of salt)
        vm.warp(block.timestamp + 1);
        address vault2 = factory.createVault{value: 0.1 ether}(params);
        
        assertFalse(vault1 == vault2);
        
        vm.stopPrank();
    }
}
