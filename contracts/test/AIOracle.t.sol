// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/AIOracle.sol";
import "../src/interfaces/IStrategyVault.sol";

contract AIOracleTest is Test {
    AIOracle public aiOracle;
    
    address public owner = address(0x1);
    address public aiSigner = address(0x3);
    address public vault = address(0x4);
    
    uint256 private aiSignerPrivateKey = 0x123;
    
    // Events from AIOracle contract
    event ModelRegistered(string model, address signer);
    event ModelDeactivated(string model);
    event AIRequestSubmitted(bytes32 indexed requestId, address indexed vault, string model);
    event AIRequestExecuted(bytes32 indexed requestId, bool success, uint256 gasUsed);
    
    function setUp() public {
        // Set SEI chain ID
        vm.chainId(713715);
        
        // Deploy AI Oracle
        vm.startPrank(owner);
        aiOracle = new AIOracle(owner);
        vm.stopPrank();
        
        // Set up AI signer with known private key
        aiSigner = vm.addr(aiSignerPrivateKey);
    }
    
    function testOracleDeployment() public {
        assertEq(aiOracle.totalRequests(), 0);
        assertEq(aiOracle.successfulRequests(), 0);
        assertEq(aiOracle.averageExecutionTime(), 0);
        assertEq(bytes(aiOracle.primaryModel()).length, 0);
    }
    
    function testSEIChainValidation() public {
        vm.chainId(1); // Ethereum mainnet
        
        vm.expectRevert("Invalid chain");
        new AIOracle(owner);
    }
    
    function testRegisterAIModel() public {
        vm.startPrank(owner);
        
        // Register model
        vm.expectEmit(true, true, true, true);
        emit ModelRegistered("v1.0", aiSigner);
        
        aiOracle.registerAIModel("v1.0", aiSigner);
        
        // Check model registration
        (uint256 successRate, uint256 totalRequests, bool isActive) = aiOracle.getModelPerformance("v1.0");
        assertEq(successRate, 0);
        assertEq(totalRequests, 0);
        assertTrue(isActive);
        assertEq(aiOracle.primaryModel(), "v1.0");
        
        vm.stopPrank();
    }
    
    function testRegisterAIModelValidation() public {
        // Only owner can register
        vm.expectRevert();
        aiOracle.registerAIModel("v1.0", aiSigner);
        
        vm.startPrank(owner);
        
        // Cannot register with zero address
        vm.expectRevert("Invalid signer");
        aiOracle.registerAIModel("v1.0", address(0));
        
        // Register first model
        aiOracle.registerAIModel("v1.0", aiSigner);
        
        // Cannot register same model again
        vm.expectRevert("Model already active");
        aiOracle.registerAIModel("v1.0", aiSigner);
        
        vm.stopPrank();
    }
    
    function testSubmitRebalanceRequest() public {
        // Register AI model first
        vm.prank(owner);
        aiOracle.registerAIModel("v1.0", aiSigner);
        
        int24 newTickLower = -1000;
        int24 newTickUpper = 1000;
        uint256 confidence = 8500; // 85%
        uint256 deadline = block.timestamp + 3600;
        
        // Create signature
        bytes32 messageHash = keccak256(abi.encodePacked(
            vault,
            newTickLower,
            newTickUpper,
            confidence,
            deadline
        ));
        
        bytes32 ethSignedMessageHash = keccak256(abi.encodePacked(
            "\x19Ethereum Signed Message:\n32",
            messageHash
        ));
        
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(aiSignerPrivateKey, ethSignedMessageHash);
        bytes memory signature = abi.encodePacked(r, s, v);
        
        // Submit request
        vm.chainId(713715);
        bytes32 requestId = aiOracle.submitRebalanceRequest(
            vault,
            newTickLower,
            newTickUpper,
            confidence,
            deadline,
            "v1.0",
            signature
        );
        
        assertFalse(requestId == bytes32(0));
        assertEq(aiOracle.totalRequests(), 1);
        assertEq(aiOracle.vaultRequestCount(vault), 1);
    }
    
    function testSubmitRebalanceRequestValidation() public {
        // Register AI model first
        vm.prank(owner);
        aiOracle.registerAIModel("v1.0", aiSigner);
        
        vm.chainId(713715);
        
        // Test inactive model
        vm.expectRevert("Model not active");
        aiOracle.submitRebalanceRequest(
            vault,
            -1000,
            1000,
            8500,
            block.timestamp + 3600,
            "v2.0", // Non-existent model
            ""
        );
        
        // Test invalid vault
        vm.expectRevert("Invalid vault");
        aiOracle.submitRebalanceRequest(
            address(0),
            -1000,
            1000,
            8500,
            block.timestamp + 3600,
            "v1.0",
            ""
        );
        
        // Test invalid deadline
        vm.expectRevert("Invalid deadline");
        aiOracle.submitRebalanceRequest(
            vault,
            -1000,
            1000,
            8500,
            block.timestamp - 1,
            "v1.0",
            ""
        );
        
        // Test invalid confidence
        vm.expectRevert("Invalid confidence");
        aiOracle.submitRebalanceRequest(
            vault,
            -1000,
            1000,
            10001, // > 100%
            block.timestamp + 3600,
            "v1.0",
            ""
        );
    }
    
    function testInvalidSignature() public {
        // Register AI model first
        vm.prank(owner);
        aiOracle.registerAIModel("v1.0", aiSigner);
        
        vm.chainId(713715);
        
        // Create invalid signature
        bytes memory invalidSignature = "invalid";
        
        vm.expectRevert("Invalid AI signature");
        aiOracle.submitRebalanceRequest(
            vault,
            -1000,
            1000,
            8500,
            block.timestamp + 3600,
            "v1.0",
            invalidSignature
        );
    }
    
    function testDeactivateModel() public {
        // Register AI model first
        vm.prank(owner);
        aiOracle.registerAIModel("v1.0", aiSigner);
        
        // Check it's active
        (, , bool isActive) = aiOracle.getModelPerformance("v1.0");
        assertTrue(isActive);
        
        // Only owner can deactivate
        vm.expectRevert();
        aiOracle.deactivateModel("v1.0");
        
        // Deactivate model
        vm.prank(owner);
        vm.expectEmit(true, true, true, true);
        emit ModelDeactivated("v1.0");
        
        aiOracle.deactivateModel("v1.0");
        
        // Check it's inactive
        (, , isActive) = aiOracle.getModelPerformance("v1.0");
        assertFalse(isActive);
        
        // Cannot deactivate again
        vm.prank(owner);
        vm.expectRevert("Model not active");
        aiOracle.deactivateModel("v1.0");
    }
    
    function testSetPrimaryModel() public {
        // Register AI models
        vm.startPrank(owner);
        aiOracle.registerAIModel("v1.0", aiSigner);
        aiOracle.registerAIModel("v2.0", address(0x5));
        vm.stopPrank();
        
        // First model should be primary
        assertEq(aiOracle.primaryModel(), "v1.0");
        
        // Only owner can set primary
        vm.expectRevert();
        aiOracle.setPrimaryModel("v2.0");
        
        // Cannot set inactive model as primary
        vm.prank(owner);
        vm.expectRevert("Model not active");
        aiOracle.setPrimaryModel("v3.0");
        
        // Set new primary model
        vm.prank(owner);
        aiOracle.setPrimaryModel("v2.0");
        
        assertEq(aiOracle.primaryModel(), "v2.0");
    }
    
    function testRequestExists() public {
        // Register AI model first
        vm.prank(owner);
        aiOracle.registerAIModel("v1.0", aiSigner);
        
        int24 newTickLower = -1000;
        int24 newTickUpper = 1000;
        uint256 confidence = 8500;
        uint256 deadline = block.timestamp + 3600;
        
        // Create signature
        bytes32 messageHash = keccak256(abi.encodePacked(
            vault,
            newTickLower,
            newTickUpper,
            confidence,
            deadline
        ));
        
        bytes32 ethSignedMessageHash = keccak256(abi.encodePacked(
            "\x19Ethereum Signed Message:\n32",
            messageHash
        ));
        
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(aiSignerPrivateKey, ethSignedMessageHash);
        bytes memory signature = abi.encodePacked(r, s, v);
        
        vm.chainId(713715);
        
        // Submit first request
        aiOracle.submitRebalanceRequest(
            vault,
            newTickLower,
            newTickUpper,
            confidence,
            deadline,
            "v1.0",
            signature
        );
        
        // Try to submit same request again should fail
        vm.expectRevert("Request exists");
        aiOracle.submitRebalanceRequest(
            vault,
            newTickLower,
            newTickUpper,
            confidence,
            deadline,
            "v1.0",
            signature
        );
    }
    
    function testChainValidationInSubmit() public {
        // Register AI model first
        vm.prank(owner);
        aiOracle.registerAIModel("v1.0", aiSigner);
        
        // Wrong chain should fail
        vm.chainId(1);
        vm.expectRevert("Invalid chain");
        aiOracle.submitRebalanceRequest(
            vault,
            -1000,
            1000,
            8500,
            block.timestamp + 3600,
            "v1.0",
            ""
        );
    }
}
