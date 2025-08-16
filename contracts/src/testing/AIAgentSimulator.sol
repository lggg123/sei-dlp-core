// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../../lib/openzeppelin-contracts/contracts/access/Ownable.sol";
import "../../lib/openzeppelin-contracts/contracts/utils/cryptography/ECDSA.sol";
import "../../lib/openzeppelin-contracts/contracts/utils/cryptography/MessageHashUtils.sol";
import "./MockPriceFeed.sol";
import "../AIOracle.sol";
import "../interfaces/IStrategyVault.sol";

/**
 * @title AIAgentSimulator
 * @dev Simulates AI agent behavior for testing vault strategies
 * @notice Demonstrates how your Eliza agent would interact with the system
 */
contract AIAgentSimulator is Ownable {
    using ECDSA for bytes32;
    using MessageHashUtils for bytes32;
    
    struct AgentStrategy {
        string name;
        uint256 riskTolerance;    // 0-10000 (0% to 100%)
        uint256 rebalanceThreshold; // Price change % to trigger rebalance
        uint256 confidenceRequired; // Minimum confidence to act
        bool isActive;
    }
    
    struct TradingSignal {
        address vault;
        address token0;
        address token1;
        int24 suggestedTickLower;
        int24 suggestedTickUpper;
        uint256 confidence;
        string reasoning;
        uint256 timestamp;
    }
    
    MockPriceFeed public priceFeed;
    AIOracle public aiOracle;
    
    // Agent strategies
    mapping(uint256 => AgentStrategy) public strategies;
    uint256 public strategyCount;
    uint256 public activeStrategy;
    
    // Trading history
    TradingSignal[] public tradingHistory;
    mapping(address => uint256) public vaultSignalCount;
    
    // Agent state
    address public agentSigner;
    string public currentModel = "liquidity-optimizer-v1.0";
    
    event StrategyCreated(uint256 indexed strategyId, string name);
    event TradingSignalGenerated(address indexed vault, uint256 confidence, string reasoning);
    event RebalanceRequestSubmitted(bytes32 indexed requestId, address indexed vault);
    event AgentDecision(string decision, uint256 confidence, string factors);
    
    constructor(
        address _priceFeed,
        address _aiOracle,
        address _agentSigner,
        address initialOwner
    ) Ownable(initialOwner) {
        priceFeed = MockPriceFeed(_priceFeed);
        aiOracle = AIOracle(_aiOracle);
        agentSigner = _agentSigner;
        
        _initializeStrategies();
    }
    
    /**
     * @dev Analyze market conditions and generate trading signals
     */
    function analyzeMarketConditions(address[] calldata vaults) external {
        require(vaults.length > 0, "No vaults provided");
        
        AgentStrategy memory strategy = strategies[activeStrategy];
        require(strategy.isActive, "No active strategy");
        
        for (uint256 i = 0; i < vaults.length; i++) {
            _analyzeVault(vaults[i], strategy);
        }
    }
    
    /**
     * @dev Submit a rebalance request based on AI analysis
     * @notice In production, the signature would be provided by the external AI agent
     */
    function submitRebalanceRequest(
        address vault,
        int24 newTickLower,
        int24 newTickUpper,
        uint256 confidence,
        bytes calldata signature
    ) external onlyOwner {
        require(confidence >= strategies[activeStrategy].confidenceRequired, "Insufficient confidence");
        
        // Create deadline for the request
        uint256 deadline = block.timestamp + 3600; // 1 hour deadline
        
        // Submit to AI Oracle with provided signature
        bytes32 requestId = aiOracle.submitRebalanceRequest(
            vault,
            newTickLower,
            newTickUpper,
            confidence,
            deadline,
            currentModel,
            signature
        );
        
        emit RebalanceRequestSubmitted(requestId, vault);
        
        // Record the trading signal
        IStrategyVault.VaultInfo memory vaultInfo = IStrategyVault(vault).getVaultInfo();
        _recordTradingSignal(
            vault,
            vaultInfo.token0,
            vaultInfo.token1,
            newTickLower,
            newTickUpper,
            confidence,
            "AI-driven rebalancing based on market analysis"
        );
    }
    
    /**
     * @dev Automated trading bot - analyzes and acts on opportunities
     */
    function runTradingBot(address[] calldata vaults) external onlyOwner {
        AgentStrategy memory strategy = strategies[activeStrategy];
        
        emit AgentDecision("Starting automated analysis", 8000, "Scheduled bot run");
        
        for (uint256 i = 0; i < vaults.length; i++) {
            address vault = vaults[i];
            IStrategyVault.VaultInfo memory vaultInfo = IStrategyVault(vault).getVaultInfo();
            
            // Check if we should rebalance this vault
            (bool shouldRebalance, uint256 confidence, string memory reason) = 
                priceFeed.shouldRebalance(vaultInfo.token0, vaultInfo.token1);
            
            if (shouldRebalance && confidence >= strategy.confidenceRequired) {
                // Generate optimal tick range
                (int24 tickLower, int24 tickUpper) = _calculateOptimalRange(
                    vaultInfo.token0,
                    vaultInfo.token1,
                    strategy
                );
                
                emit AgentDecision("Rebalancing recommended", confidence, reason);
                
                // Note: In production, this would trigger the external AI agent to create and submit a signed request
                // For testing, we just emit the signal that rebalancing is recommended
            } else {
                emit AgentDecision("No action needed", confidence, "Market conditions stable");
            }
        }
    }
    
    /**
     * @dev Create a new trading strategy
     */
    function createStrategy(
        string calldata name,
        uint256 riskTolerance,
        uint256 rebalanceThreshold,
        uint256 confidenceRequired
    ) external onlyOwner returns (uint256 strategyId) {
        strategyId = strategyCount++;
        strategies[strategyId] = AgentStrategy({
            name: name,
            riskTolerance: riskTolerance,
            rebalanceThreshold: rebalanceThreshold,
            confidenceRequired: confidenceRequired,
            isActive: true
        });
        
        emit StrategyCreated(strategyId, name);
    }
    
    /**
     * @dev Set active strategy
     */
    function setActiveStrategy(uint256 strategyId) external onlyOwner {
        require(strategyId < strategyCount, "Invalid strategy");
        require(strategies[strategyId].isActive, "Strategy not active");
        activeStrategy = strategyId;
    }
    
    /**
     * @dev Get trading history for a vault
     */
    function getVaultTradingHistory(address vault) external view returns (TradingSignal[] memory signals) {
        uint256 count = 0;
        
        // Count signals for this vault
        for (uint256 i = 0; i < tradingHistory.length; i++) {
            if (tradingHistory[i].vault == vault) {
                count++;
            }
        }
        
        // Collect signals
        signals = new TradingSignal[](count);
        uint256 index = 0;
        for (uint256 i = 0; i < tradingHistory.length; i++) {
            if (tradingHistory[i].vault == vault) {
                signals[index] = tradingHistory[i];
                index++;
            }
        }
    }
    
    /**
     * @dev Get agent performance metrics
     */
    function getPerformanceMetrics() external view returns (
        uint256 totalSignals,
        uint256 activeVaults,
        string memory currentStrategyName,
        uint256 avgConfidence
    ) {
        totalSignals = tradingHistory.length;
        
        // Count active vaults (simplified)
        activeVaults = 0; // Would count unique vaults with recent signals
        
        currentStrategyName = strategies[activeStrategy].name;
        
        // Calculate average confidence
        if (totalSignals > 0) {
            uint256 totalConfidence = 0;
            for (uint256 i = 0; i < tradingHistory.length; i++) {
                totalConfidence += tradingHistory[i].confidence;
            }
            avgConfidence = totalConfidence / totalSignals;
        }
    }
    
    // Internal functions
    function _initializeStrategies() internal {
        // Conservative Strategy
        strategies[strategyCount++] = AgentStrategy({
            name: "Conservative Liquidity",
            riskTolerance: 3000, // 30%
            rebalanceThreshold: 500, // 5% price change
            confidenceRequired: 7000, // 70% confidence
            isActive: true
        });
        
        // Aggressive Strategy
        strategies[strategyCount++] = AgentStrategy({
            name: "Aggressive Alpha",
            riskTolerance: 8000, // 80%
            rebalanceThreshold: 200, // 2% price change
            confidenceRequired: 6000, // 60% confidence
            isActive: true
        });
        
        // Balanced Strategy
        strategies[strategyCount++] = AgentStrategy({
            name: "Balanced Growth",
            riskTolerance: 5000, // 50%
            rebalanceThreshold: 300, // 3% price change
            confidenceRequired: 6500, // 65% confidence
            isActive: true
        });
        
        activeStrategy = 2; // Start with balanced strategy
    }
    
    function _analyzeVault(address vault, AgentStrategy memory strategy) internal {
        IStrategyVault.VaultInfo memory vaultInfo = IStrategyVault(vault).getVaultInfo();
        
        // Get price data for both tokens
        MockPriceFeed.PriceData memory price0 = priceFeed.getPriceData(vaultInfo.token0);
        MockPriceFeed.PriceData memory price1 = priceFeed.getPriceData(vaultInfo.token1);
        
        // Calculate if rebalancing is needed
        bool needsRebalancing = false;
        uint256 confidence = 5000; // Base confidence
        string memory reasoning = "Normal market conditions";
        
        // Check price movements
        if (abs(price0.change24h) > strategy.rebalanceThreshold ||
            abs(price1.change24h) > strategy.rebalanceThreshold) {
            needsRebalancing = true;
            confidence = 7500;
            reasoning = "Significant price movement detected";
        }
        
        // Check volatility
        if (price0.volatility > 5000 || price1.volatility > 5000) {
            needsRebalancing = true;
            confidence = 8000;
            reasoning = "High volatility requires range adjustment";
        }
        
        if (needsRebalancing && confidence >= strategy.confidenceRequired) {
            // Generate optimal range
            (int24 tickLower, int24 tickUpper) = _calculateOptimalRange(
                vaultInfo.token0,
                vaultInfo.token1,
                strategy
            );
            
            _recordTradingSignal(
                vault,
                vaultInfo.token0,
                vaultInfo.token1,
                tickLower,
                tickUpper,
                confidence,
                reasoning
            );
            
            emit TradingSignalGenerated(vault, confidence, reasoning);
        }
    }
    
    function _calculateOptimalRange(
        address token0,
        address token1,
        AgentStrategy memory strategy
    ) internal view returns (int24 tickLower, int24 tickUpper) {
        // Simplified optimal range calculation
        // In production, this would use complex algorithms considering:
        // - Current price
        // - Historical volatility
        // - Market depth
        // - Risk tolerance
        // - Expected returns
        
        MockPriceFeed.PriceData memory price0 = priceFeed.getPriceData(token0);
        MockPriceFeed.PriceData memory price1 = priceFeed.getPriceData(token1);
        
        // Calculate range based on volatility and risk tolerance
        uint256 avgVolatility = (price0.volatility + price1.volatility) / 2;
        uint256 rangeMultiplier = (avgVolatility * strategy.riskTolerance) / 10000;
        
        // Convert to tick range (simplified - real implementation would use sqrt price math)
        // Ensure range fits in int24 bounds
        uint256 rangeUint = rangeMultiplier / 100;
        if (rangeUint > 887272) rangeUint = 887272; // Max tick value
        int24 range = int24(int256(rangeUint));
        
        tickLower = -range;
        tickUpper = range;
    }
    
    function _recordTradingSignal(
        address vault,
        address token0,
        address token1,
        int24 tickLower,
        int24 tickUpper,
        uint256 confidence,
        string memory reasoning
    ) internal {
        tradingHistory.push(TradingSignal({
            vault: vault,
            token0: token0,
            token1: token1,
            suggestedTickLower: tickLower,
            suggestedTickUpper: tickUpper,
            confidence: confidence,
            reasoning: reasoning,
            timestamp: block.timestamp
        }));
        
        vaultSignalCount[vault]++;
    }
    
    function abs(int256 x) internal pure returns (uint256) {
        return x >= 0 ? uint256(x) : uint256(-x);
    }
}