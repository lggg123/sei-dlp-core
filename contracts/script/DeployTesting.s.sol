// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/testing/MockPriceFeed.sol";
import "../src/testing/MarketSimulator.sol";
import "../src/testing/AIAgentSimulator.sol";

contract DeployTestingScript is Script {
    uint256 constant SEI_CHAIN_ID = 713715;
    
    address public mockPriceFeed;
    address public marketSimulator;
    address public aiAgentSimulator;
    
    // Token addresses from main deployment
    address public seiToken;
    address public usdcToken;
    address public usdtToken;
    address public ethToken;
    address public btcToken;
    address public atomToken;
    address public daiToken;
    
    // Vault addresses (to be set from main deployment)
    address public aiOracle;
    address public concentratedLiquidityVault;
    address public yieldFarmingVault;
    address public arbitrageVault;
    
    function run() external {
        require(block.chainid == SEI_CHAIN_ID, "Must deploy to SEI network");
        
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        
        console.log("Deploying Testing Infrastructure to SEI Network");
        console.log("Deployer address: %s", deployer);
        
        vm.startBroadcast(deployerPrivateKey);
        
        // 1. Deploy Mock Price Feed
        mockPriceFeed = deployMockPriceFeed(deployer);
        console.log("Mock Price Feed deployed at: %s", mockPriceFeed);
        
        // 2. Set AI Oracle address (from main deployment)
        // You'll need to update this with the actual deployed AI Oracle address
        aiOracle = 0xFE1F6AD530cc04f935f215a822eFdEa665a7Ce23;
        
        // 3. Deploy Market Simulator  
        marketSimulator = deployMarketSimulator(mockPriceFeed, aiOracle, deployer);
        console.log("Market Simulator deployed at: %s", marketSimulator);
        
        // 4. Deploy AI Agent Simulator (using dummy signer for testing)
        address dummySigner = vm.addr(0x1234567890123456789012345678901234567890123456789012345678901234);
        address aiAgentSimulator = deployAIAgentSimulator(mockPriceFeed, aiOracle, dummySigner, deployer);
        console.log("AI Agent Simulator deployed at: %s", aiAgentSimulator);
        
        // 5. Initialize mock tokens with realistic prices
        initializeMockTokens();
        
        // 6. Create test market scenarios
        createTestScenarios();
        
        vm.stopBroadcast();
        
        logTestingDeploymentSummary();
    }
    
    function deployMockPriceFeed(address owner) internal returns (address) {
        MockPriceFeed priceFeed = new MockPriceFeed(owner);
        return address(priceFeed);
    }
    
    function deployMarketSimulator(
        address _priceFeed,
        address _aiOracle,
        address owner
    ) internal returns (address) {
        MarketSimulator simulator = new MarketSimulator(_priceFeed, _aiOracle, owner);
        return address(simulator);
    }
    
    function deployAIAgentSimulator(
        address _priceFeed,
        address _aiOracle,
        address _agentSigner,
        address owner
    ) internal returns (address) {
        AIAgentSimulator agentSim = new AIAgentSimulator(_priceFeed, _aiOracle, _agentSigner, owner);
        return address(agentSim);
    }
    
    function initializeMockTokens() internal {
        MockPriceFeed priceFeed = MockPriceFeed(mockPriceFeed);
        
        // Set token addresses from main deployment (replace with actual addresses)
        seiToken = 0xB00d53a9738FcDeF6844f33F3F5D71Cf57438030; // Replace with actual SEI mock token
        
        // Initialize realistic prices (in 18 decimals)
        // SEI: $0.50
        priceFeed.setTokenPrice(seiToken, "SEI", 0.5 * 1e18, 1000000 * 1e18);
        
        // If other tokens are deployed, initialize them too
        // This is simplified - in practice you'd get these from the main deployment
        console.log("Initialized SEI token price feed");
    }
    
    function createTestScenarios() internal {
        MarketSimulator simulator = MarketSimulator(marketSimulator);
        
        // Create test scenarios for AI trading
        address[] memory tokens = new address[](1);
        int256[] memory priceChanges = new int256[](1);
        uint256[] memory volatilities = new uint256[](1);
        
        tokens[0] = seiToken;
        
        // Bull Market Scenario
        priceChanges[0] = 2000; // +20%
        volatilities[0] = 4000; // High volatility
        simulator.createTestScenario(
            "AI Bull Market Test",
            tokens,
            priceChanges,
            volatilities,
            3600, // 1 hour
            true  // Trigger rebalance
        );
        
        // Bear Market Scenario
        priceChanges[0] = -1500; // -15%
        volatilities[0] = 5000; // Very high volatility
        simulator.createTestScenario(
            "AI Bear Market Test",
            tokens,
            priceChanges,
            volatilities,
            1800, // 30 minutes
            true  // Trigger rebalance
        );
        
        // Volatility Spike Scenario
        priceChanges[0] = 500; // +5%
        volatilities[0] = 8000; // Extreme volatility
        simulator.createTestScenario(
            "AI Volatility Spike Test",
            tokens,
            priceChanges,
            volatilities,
            900, // 15 minutes
            true // Trigger rebalance
        );
        
        console.log("Created 3 test scenarios for AI trading");
    }
    
    function logTestingDeploymentSummary() internal view {
        console.log("\n=== SEI DLP TESTING INFRASTRUCTURE ===");
        console.log("Network: SEI (Chain ID: %s)", block.chainid);
        console.log("\nTesting Contracts:");
        console.log("- Mock Price Feed: %s", mockPriceFeed);
        console.log("- Market Simulator: %s", marketSimulator);
        console.log("- AI Agent Simulator: %s", aiAgentSimulator);
        console.log("- AI Oracle (linked): %s", aiOracle);
        console.log("\nSetup Complete:");
        console.log("- SEI token price feed initialized");
        console.log("- 3 test scenarios created");
        console.log("- Ready for AI agent testing");
        console.log("\nUsage Instructions:");
        console.log("1. Start a test scenario: MarketSimulator.startTest()");
        console.log("2. Monitor price feeds for trading opportunities");
        console.log("3. AI agent should detect conditions and submit rebalance requests");
        console.log("4. Execute rebalance through AI Oracle");
        console.log("5. Progress test with MarketSimulator.progressTest()");
        console.log("==========================================\n");
    }
}