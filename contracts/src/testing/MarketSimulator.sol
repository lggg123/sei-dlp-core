// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../../lib/openzeppelin-contracts/contracts/access/Ownable.sol";
import "./MockPriceFeed.sol";
import "../AIOracle.sol";
import "../interfaces/IStrategyVault.sol";

/**
 * @title MarketSimulator
 * @dev Orchestrates market scenarios to test AI trading strategies
 * @notice Simulates real market conditions to trigger vault rebalancing
 */
contract MarketSimulator is Ownable {
    MockPriceFeed public priceFeed;
    AIOracle public aiOracle;
    
    struct TestScenario {
        string name;
        address[] tokens;
        int256[] priceChanges;  // Price changes to apply
        uint256[] volatilities; // Volatility levels
        uint256 duration;       // How long to run
        bool triggerRebalance;  // Should trigger AI rebalancing
    }
    
    struct ActiveTest {
        uint256 scenarioId;
        uint256 startTime;
        uint256 currentStep;
        bool isRunning;
        address[] targetVaults;
    }
    
    mapping(uint256 => TestScenario) public testScenarios;
    uint256 public scenarioCount;
    ActiveTest public currentTest;
    
    // Trading scenarios for comprehensive testing
    string[] public scenarioNames = [
        "Bull Market Rally",
        "Bear Market Crash", 
        "Sideways Consolidation",
        "Flash Crash Recovery",
        "Volatility Spike",
        "Range Trading",
        "Breakout Rally",
        "Dead Cat Bounce"
    ];
    
    event TestScenarioCreated(uint256 indexed scenarioId, string name);
    event TestStarted(uint256 indexed scenarioId, string name, address[] vaults);
    event MarketConditionTriggered(string condition, address[] affectedTokens, uint256 severity);
    event AIRebalanceTriggered(address indexed vault, uint256 confidence, string reason);
    event TestCompleted(uint256 indexed scenarioId, uint256 duration, bool success);
    
    constructor(
        address _priceFeed,
        address _aiOracle,
        address initialOwner
    ) Ownable(initialOwner) {
        priceFeed = MockPriceFeed(_priceFeed);
        aiOracle = AIOracle(_aiOracle);
        _initializeTestScenarios();
    }
    
    /**
     * @dev Create a custom test scenario
     */
    function createTestScenario(
        string calldata name,
        address[] calldata tokens,
        int256[] calldata priceChanges,
        uint256[] calldata volatilities,
        uint256 duration,
        bool triggerRebalance
    ) external onlyOwner returns (uint256 scenarioId) {
        require(tokens.length == priceChanges.length, "Array length mismatch");
        require(tokens.length == volatilities.length, "Array length mismatch");
        
        scenarioId = scenarioCount++;
        testScenarios[scenarioId] = TestScenario({
            name: name,
            tokens: tokens,
            priceChanges: priceChanges,
            volatilities: volatilities,
            duration: duration,
            triggerRebalance: triggerRebalance
        });
        
        emit TestScenarioCreated(scenarioId, name);
    }
    
    /**
     * @dev Start a market test scenario
     */
    function startTest(
        uint256 scenarioId,
        address[] calldata targetVaults
    ) external onlyOwner {
        require(scenarioId < scenarioCount, "Invalid scenario");
        require(!currentTest.isRunning, "Test already running");
        require(targetVaults.length > 0, "No target vaults");
        
        TestScenario memory scenario = testScenarios[scenarioId];
        
        currentTest = ActiveTest({
            scenarioId: scenarioId,
            startTime: block.timestamp,
            currentStep: 0,
            isRunning: true,
            targetVaults: targetVaults
        });
        
        emit TestStarted(scenarioId, scenario.name, targetVaults);
        
        // Start the market simulation
        _executeScenarioStep(scenario);
    }
    
    /**
     * @dev Progress the current test scenario
     */
    function progressTest() external {
        require(currentTest.isRunning, "No active test");
        
        TestScenario memory scenario = testScenarios[currentTest.scenarioId];
        
        // Check if test should complete
        if (block.timestamp >= currentTest.startTime + scenario.duration) {
            _completeTest();
            return;
        }
        
        // Progress to next step
        currentTest.currentStep++;
        _executeScenarioStep(scenario);
        
        // Check if AI should rebalance
        if (scenario.triggerRebalance) {
            _checkAndTriggerRebalance(scenario);
        }
    }
    
    /**
     * @dev Simulate a flash crash for testing emergency responses
     */
    function simulateFlashCrash(
        address[] calldata tokens,
        int256 crashPercent,
        uint256 recoveryTimeSeconds
    ) external onlyOwner {
        require(crashPercent <= -1000, "Must be at least 10% crash"); // Max 10% crash
        require(recoveryTimeSeconds > 0, "Invalid recovery time");
        
        // Trigger the crash
        for (uint256 i = 0; i < tokens.length; i++) {
            priceFeed.triggerPriceMove(tokens[i], crashPercent, 9000); // High volatility
        }
        
        emit MarketConditionTriggered("FLASH_CRASH", tokens, uint256(-crashPercent));
        
        // Note: Recovery would need to be triggered manually or with a timer
    }
    
    /**
     * @dev Simulate a volatility spike
     */
    function simulateVolatilitySpike(
        address[] calldata tokens,
        uint256 volatilityLevel,
        uint256 durationSeconds
    ) external onlyOwner {
        require(volatilityLevel <= 10000, "Invalid volatility");
        require(durationSeconds > 0, "Invalid duration");
        
        for (uint256 i = 0; i < tokens.length; i++) {
            // Random price movements with high volatility
            int256 randomChange = (int256(block.timestamp) % 1000) - 500; // -5% to +5%
            priceFeed.triggerPriceMove(tokens[i], randomChange, volatilityLevel);
        }
        
        emit MarketConditionTriggered("VOLATILITY_SPIKE", tokens, volatilityLevel);
    }
    
    /**
     * @dev Create bull market conditions
     */
    function createBullMarket(
        address[] calldata tokens,
        uint256 rallyStrength // 1-100
    ) external onlyOwner {
        require(rallyStrength <= 100, "Invalid rally strength");
        
        for (uint256 i = 0; i < tokens.length; i++) {
            int256 bullishMove = int256(rallyStrength) * 50; // 0.5% per strength point
            priceFeed.triggerPriceMove(tokens[i], bullishMove, rallyStrength * 30);
        }
        
        emit MarketConditionTriggered("BULL_MARKET", tokens, rallyStrength);
    }
    
    /**
     * @dev Create bear market conditions
     */
    function createBearMarket(
        address[] calldata tokens,
        uint256 bearishStrength // 1-100
    ) external onlyOwner {
        require(bearishStrength <= 100, "Invalid bearish strength");
        
        for (uint256 i = 0; i < tokens.length; i++) {
            int256 bearishMove = -int256(bearishStrength) * 30; // -0.3% per strength point
            priceFeed.triggerPriceMove(tokens[i], bearishMove, bearishStrength * 25);
        }
        
        emit MarketConditionTriggered("BEAR_MARKET", tokens, bearishStrength);
    }
    
    /**
     * @dev Get current test status
     */
    function getTestStatus() external view returns (
        bool isRunning,
        uint256 scenarioId,
        string memory scenarioName,
        uint256 progress, // 0-10000 (0-100%)
        uint256 timeRemaining
    ) {
        if (!currentTest.isRunning) {
            return (false, 0, "", 0, 0);
        }
        
        TestScenario memory scenario = testScenarios[currentTest.scenarioId];
        uint256 elapsed = block.timestamp - currentTest.startTime;
        
        progress = (elapsed * 10000) / scenario.duration;
        if (progress > 10000) progress = 10000;
        
        timeRemaining = elapsed >= scenario.duration ? 0 : scenario.duration - elapsed;
        
        return (true, currentTest.scenarioId, scenario.name, progress, timeRemaining);
    }
    
    /**
     * @dev Force stop current test
     */
    function stopTest() external onlyOwner {
        require(currentTest.isRunning, "No active test");
        _completeTest();
    }
    
    // Internal functions
    function _initializeTestScenarios() internal {
        // Bull Market Rally
        address[] memory tokens = new address[](2);
        int256[] memory changes = new int256[](2);
        uint256[] memory volatilities = new uint256[](2);
        
        // This will be populated with actual token addresses during deployment
        changes[0] = 1500; // +15%
        changes[1] = 1200; // +12%
        volatilities[0] = 3000;
        volatilities[1] = 2500;
        
        testScenarios[scenarioCount++] = TestScenario({
            name: "Bull Market Rally",
            tokens: tokens,
            priceChanges: changes,
            volatilities: volatilities,
            duration: 3600, // 1 hour
            triggerRebalance: true
        });
    }
    
    function _executeScenarioStep(TestScenario memory scenario) internal {
        // Apply price changes from the scenario
        for (uint256 i = 0; i < scenario.tokens.length; i++) {
            if (scenario.tokens[i] != address(0)) {
                priceFeed.triggerPriceMove(
                    scenario.tokens[i],
                    scenario.priceChanges[i],
                    scenario.volatilities[i]
                );
            }
        }
    }
    
    function _checkAndTriggerRebalance(TestScenario memory scenario) internal {
        // Check each target vault for rebalancing opportunities
        for (uint256 i = 0; i < currentTest.targetVaults.length; i++) {
            address vault = currentTest.targetVaults[i];
            
            // Get vault token pair
            IStrategyVault.VaultInfo memory vaultInfo = IStrategyVault(vault).getVaultInfo();
            
            // Check if rebalancing is recommended
            (bool shouldRebalance, uint256 confidence, string memory reason) = 
                priceFeed.shouldRebalance(vaultInfo.token0, vaultInfo.token1);
            
            if (shouldRebalance && confidence > 6000) {
                emit AIRebalanceTriggered(vault, confidence, reason);
                
                // In a real scenario, this would trigger the AI agent to submit a rebalance request
                // For testing, we just emit the event
            }
        }
    }
    
    function _completeTest() internal {
        uint256 duration = block.timestamp - currentTest.startTime;
        bool success = duration > 0; // Simple success criteria
        
        emit TestCompleted(currentTest.scenarioId, duration, success);
        
        // Reset test state
        currentTest.isRunning = false;
        currentTest.currentStep = 0;
    }
}