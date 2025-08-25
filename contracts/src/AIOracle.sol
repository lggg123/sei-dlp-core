// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../lib/openzeppelin-contracts/contracts/access/Ownable.sol";
import "../lib/openzeppelin-contracts/contracts/utils/ReentrancyGuard.sol";
import "../lib/openzeppelin-contracts/contracts/utils/cryptography/ECDSA.sol";
import "../lib/openzeppelin-contracts/contracts/utils/cryptography/MessageHashUtils.sol";
import "./interfaces/IStrategyVault.sol";

/**
 * @title AIOracle
 * @dev Oracle contract for AI-driven rebalancing decisions
 * @notice Optimized for SEI's 400ms finality for rapid AI execution
 */
contract AIOracle is Ownable, ReentrancyGuard {
    using ECDSA for bytes32;
    using MessageHashUtils for bytes32;

    struct AIRebalanceRequest {
        address vault;
        int24 newTickLower;
        int24 newTickUpper;
        uint256 confidence;
        uint256 timestamp;
        uint256 deadline;
        bool executed;
    }

    struct AIModel {
        string version;
        address signer;
        bool isActive;
        uint256 successRate;
        uint256 totalRequests;
    }

    // Custom errors
    error InvalidChain();
    error InvalidSigner();
    error RequestNotFound();
    error RequestExpired();
    error RequestAlreadyExecuted();

    // SEI Chain validation (testnet)
    uint256 public constant SEI_CHAIN_ID = 1328;

    // AI model management
    mapping(string => AIModel) public aiModels;
    string[] public activeModels;
    string public primaryModel;

    // Request tracking
    mapping(bytes32 => AIRebalanceRequest) public requests;
    mapping(address => uint256) public vaultRequestCount;
    
    // Performance tracking (leveraging SEI's fast finality)
    uint256 public totalRequests;
    uint256 public successfulRequests;
    uint256 public averageExecutionTime;

    event AIRequestSubmitted(bytes32 indexed requestId, address indexed vault, string model);
    event AIRequestExecuted(bytes32 indexed requestId, bool success, uint256 gasUsed);
    event ModelRegistered(string model, address signer);
    event ModelDeactivated(string model);

    modifier onlySEI() {
        require(block.chainid == SEI_CHAIN_ID, "Invalid chain");
        _;
    }

    modifier onlyActiveModel(string calldata model) {
        require(aiModels[model].isActive, "Model not active");
        _;
    }

        constructor(address initialOwner) Ownable(initialOwner) {
        require(block.chainid == SEI_CHAIN_ID, "Invalid chain");
    }

    /**
     * @dev Register a new AI model
     */
    function registerAIModel(
        string calldata model,
        address signer
    ) external onlyOwner {
        require(signer != address(0), "Invalid signer");
        require(!aiModels[model].isActive, "Model already active");
        
        aiModels[model] = AIModel({
            version: model,
            signer: signer,
            isActive: true,
            successRate: 0,
            totalRequests: 0
        });
        
        activeModels.push(model);
        
        if (bytes(primaryModel).length == 0) {
            primaryModel = model;
        }
        
        emit ModelRegistered(model, signer);
    }

    /**
     * @dev Submit AI rebalance request
     * @notice Optimized for SEI's fast execution
     */
    function submitRebalanceRequest(
        address vault,
        int24 newTickLower,
        int24 newTickUpper,
        uint256 confidence,
        uint256 deadline,
        string calldata model,
        bytes calldata signature
    ) external onlySEI onlyActiveModel(model) returns (bytes32 requestId) {
        require(vault != address(0), "Invalid vault");
        require(deadline > block.timestamp, "Invalid deadline");
        require(confidence <= 10000, "Invalid confidence"); // max 100%
        
        // Create request ID
        requestId = keccak256(abi.encodePacked(
            vault,
            newTickLower,
            newTickUpper,
            confidence,
            block.timestamp,
            msg.sender
        ));
        
        require(requests[requestId].vault == address(0), "Request exists");
        
        // Verify AI signature
        require(signature.length == 65, "Invalid AI signature");
        
        bytes32 messageHash = keccak256(abi.encodePacked(
            vault,
            newTickLower,
            newTickUpper,
            confidence,
            deadline
        )).toEthSignedMessageHash();
        
        address recoveredSigner = messageHash.recover(signature);
        require(recoveredSigner == aiModels[model].signer, "Invalid AI signature");
        
        // Store request
        requests[requestId] = AIRebalanceRequest({
            vault: vault,
            newTickLower: newTickLower,
            newTickUpper: newTickUpper,
            confidence: confidence,
            timestamp: block.timestamp,
            deadline: deadline,
            executed: false
        });
        
        // Update counters
        vaultRequestCount[vault]++;
        totalRequests++;
        aiModels[model].totalRequests++;
        
        emit AIRequestSubmitted(requestId, vault, model);
        
        return requestId;
    }

    /**
     * @dev Execute AI rebalance request
     * @notice Leverages SEI's 400ms finality for rapid execution
     */
    function executeRebalanceRequest(
        bytes32 requestId,
        string calldata model
    ) external onlySEI nonReentrant returns (bool success) {
        AIRebalanceRequest storage request = requests[requestId];
        require(request.vault != address(0), "Request not found");
        require(!request.executed, "Already executed");
        require(block.timestamp <= request.deadline, "Request expired");
        
        uint256 gasStart = gasleft();
        
        // Mark as executed
        request.executed = true;
        
        // Execute rebalance on vault
        try IStrategyVault(request.vault).rebalance(IStrategyVault.AIRebalanceParams({
            newTickLower: request.newTickLower,
            newTickUpper: request.newTickUpper,
            minAmount0: 0, // Simplified for example
            minAmount1: 0,
            deadline: request.deadline,
            aiSignature: abi.encodePacked(requestId)
        })) {
            success = true;
            successfulRequests++;
            aiModels[model].successRate = (aiModels[model].successRate * (aiModels[model].totalRequests - 1) + 10000) / aiModels[model].totalRequests;
        } catch {
            success = false;
        }
        
        uint256 gasUsed = gasStart - gasleft();
        
        // Update average execution time (leveraging SEI's consistency)
        averageExecutionTime = (averageExecutionTime * (totalRequests - 1) + gasUsed) / totalRequests;
        
        emit AIRequestExecuted(requestId, success, gasUsed);
        
        return success;
    }

    /**
     * @dev Get AI model performance
     */
    function getModelPerformance(string calldata model) external view returns (
        uint256 successRate,
        uint256 modelTotalRequests,
        bool isActive
    ) {
        AIModel memory aiModel = aiModels[model];
        return (aiModel.successRate, aiModel.totalRequests, aiModel.isActive);
    }

    /**
     * @dev Deactivate AI model
     */
    function deactivateModel(string calldata model) external onlyOwner {
        require(aiModels[model].isActive, "Model not active");
        aiModels[model].isActive = false;
        
        emit ModelDeactivated(model);
    }

    /**
     * @dev Set primary AI model
     */
    function setPrimaryModel(string calldata model) external onlyOwner {
        require(aiModels[model].isActive, "Model not active");
        primaryModel = model;
    }
}
