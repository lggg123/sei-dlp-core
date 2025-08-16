// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../../lib/openzeppelin-contracts/contracts/access/Ownable.sol";

/**
 * @title MockPriceFeed
 * @dev Simulates price feeds for testing AI trading strategies
 * @notice Creates realistic market conditions to trigger vault rebalancing
 */
contract MockPriceFeed is Ownable {
    struct PriceData {
        uint256 price;          // Current price in wei (18 decimals)
        uint256 timestamp;      // Last update timestamp
        uint256 volume24h;      // 24h trading volume
        int256 change24h;       // 24h price change in basis points (±10000 = ±100%)
        uint256 volatility;     // Volatility indicator (0-10000, higher = more volatile)
    }
    
    struct MarketScenario {
        string name;            // e.g., "Bull Run", "Bear Market", "Sideways"
        uint256 duration;       // Duration in seconds
        int256 trendDirection;  // -10000 to +10000 (bearish to bullish)
        uint256 volatility;     // 0-10000
        bool isActive;
    }
    
    // Token price feeds
    mapping(address => PriceData) public priceFeeds;
    mapping(string => address) public tokenSymbols; // "SEI" => address
    
    // Market scenarios for testing
    mapping(uint256 => MarketScenario) public scenarios;
    uint256 public currentScenario;
    uint256 public scenarioStartTime;
    uint256 public scenarioCount;
    
    // Price movement parameters
    uint256 public constant PRICE_PRECISION = 1e18;
    uint256 public constant BASIS_POINTS = 10000;
    uint256 public updateInterval = 300; // 5 minutes default
    
    // Events for AI agents to monitor
    event PriceUpdated(address indexed token, uint256 newPrice, int256 change24h, uint256 volatility);
    event MarketScenarioChanged(uint256 indexed scenarioId, string name, int256 trend, uint256 volatility);
    event SignificantPriceMove(address indexed token, uint256 oldPrice, uint256 newPrice, int256 changePercent);
    event TradingOpportunity(address indexed token0, address indexed token1, string opportunityType, uint256 confidence);
    
    constructor(address initialOwner) Ownable(initialOwner) {
        // Initialize default market scenario
        _createScenario("Normal Market", 86400, 0, 2000); // 1 day, neutral, low volatility
        currentScenario = 0;
        scenarioStartTime = block.timestamp;
    }
    
    /**
     * @dev Set initial price for a token
     */
    function setTokenPrice(
        address token,
        string calldata symbol,
        uint256 initialPrice,
        uint256 initialVolume
    ) external onlyOwner {
        require(token != address(0), "Invalid token");
        require(initialPrice > 0, "Invalid price");
        
        priceFeeds[token] = PriceData({
            price: initialPrice,
            timestamp: block.timestamp,
            volume24h: initialVolume,
            change24h: 0,
            volatility: 1000 // 10% default volatility
        });
        
        tokenSymbols[symbol] = token;
        
        emit PriceUpdated(token, initialPrice, 0, 1000);
    }
    
    /**
     * @dev Create a market scenario for testing
     */
    function createMarketScenario(
        string calldata name,
        uint256 duration,
        int256 trendDirection,
        uint256 volatility
    ) external onlyOwner returns (uint256 scenarioId) {
        scenarioId = _createScenario(name, duration, trendDirection, volatility);
    }
    
    /**
     * @dev Activate a market scenario
     */
    function activateScenario(uint256 scenarioId) external onlyOwner {
        require(scenarioId < scenarioCount, "Invalid scenario");
        require(scenarios[scenarioId].isActive, "Scenario not active");
        
        currentScenario = scenarioId;
        scenarioStartTime = block.timestamp;
        
        MarketScenario memory scenario = scenarios[scenarioId];
        emit MarketScenarioChanged(scenarioId, scenario.name, scenario.trendDirection, scenario.volatility);
    }
    
    /**
     * @dev Simulate price movement based on current market scenario
     */
    function updatePrices(address[] calldata tokens) external {
        require(tokens.length > 0, "No tokens provided");
        
        MarketScenario memory scenario = scenarios[currentScenario];
        uint256 elapsed = block.timestamp - scenarioStartTime;
        
        // Check if scenario should change
        if (elapsed >= scenario.duration) {
            _progressToNextScenario();
            scenario = scenarios[currentScenario];
        }
        
        for (uint256 i = 0; i < tokens.length; i++) {
            _updateTokenPrice(tokens[i], scenario);
        }
    }
    
    /**
     * @dev Manually trigger a significant price move for testing
     */
    function triggerPriceMove(
        address token,
        int256 changePercent,
        uint256 newVolatility
    ) external onlyOwner {
        require(priceFeeds[token].price > 0, "Token not initialized");
        require(changePercent >= -9000 && changePercent <= 20000, "Invalid change"); // -90% to +200%
        
        PriceData storage feed = priceFeeds[token];
        uint256 oldPrice = feed.price;
        
        // Calculate new price
        uint256 newPrice = uint256(int256(oldPrice) + (int256(oldPrice) * changePercent) / int256(BASIS_POINTS));
        require(newPrice > 0, "Invalid new price");
        
        feed.price = newPrice;
        feed.change24h = changePercent;
        feed.volatility = newVolatility;
        feed.timestamp = block.timestamp;
        
        emit PriceUpdated(token, newPrice, changePercent, newVolatility);
        emit SignificantPriceMove(token, oldPrice, newPrice, changePercent);
        
        // Check for trading opportunities
        _checkTradingOpportunities(token, changePercent);
    }
    
    /**
     * @dev Get current price for a token
     */
    function getPrice(address token) external view returns (uint256) {
        return priceFeeds[token].price;
    }
    
    /**
     * @dev Get detailed price data
     */
    function getPriceData(address token) external view returns (PriceData memory) {
        return priceFeeds[token];
    }
    
    /**
     * @dev Check if conditions favor rebalancing
     */
    function shouldRebalance(address token0, address token1) external view returns (
        bool shouldRebalance_,
        uint256 confidence,
        string memory reason
    ) {
        PriceData memory feed0 = priceFeeds[token0];
        PriceData memory feed1 = priceFeeds[token1];
        
        // High volatility suggests rebalancing opportunity
        if (feed0.volatility > 5000 || feed1.volatility > 5000) {
            return (true, 8000, "High volatility detected");
        }
        
        // Significant price divergence
        if (feed0.change24h > 2000 || feed0.change24h < -2000 || 
            feed1.change24h > 2000 || feed1.change24h < -2000) {
            return (true, 7000, "Significant price movement");
        }
        
        // Market scenario suggests opportunity
        MarketScenario memory scenario = scenarios[currentScenario];
        if (scenario.volatility > 4000) {
            return (true, 6000, "Volatile market conditions");
        }
        
        return (false, 0, "No rebalancing needed");
    }
    
    // Internal functions
    function _createScenario(
        string memory name,
        uint256 duration,
        int256 trendDirection,
        uint256 volatility
    ) internal returns (uint256 scenarioId) {
        scenarioId = scenarioCount++;
        scenarios[scenarioId] = MarketScenario({
            name: name,
            duration: duration,
            trendDirection: trendDirection,
            volatility: volatility,
            isActive: true
        });
    }
    
    function _updateTokenPrice(address token, MarketScenario memory scenario) internal {
        PriceData storage feed = priceFeeds[token];
        if (feed.price == 0) return; // Skip uninitialized tokens
        
        // Generate pseudo-random price movement
        uint256 randomSeed = uint256(keccak256(abi.encodePacked(
            block.timestamp,
            block.prevrandao,
            token,
            feed.price
        )));
        
        // Base change influenced by market scenario
        int256 trendInfluence = (scenario.trendDirection * int256(scenario.volatility)) / int256(BASIS_POINTS);
        int256 randomChange = (int256(randomSeed % 1000) - 500) * int256(scenario.volatility) / int256(BASIS_POINTS);
        
        int256 totalChange = (trendInfluence + randomChange) / 10; // Scale down for realism
        
        // Apply price change
        uint256 oldPrice = feed.price;
        uint256 newPrice = uint256(int256(oldPrice) + (int256(oldPrice) * totalChange) / int256(BASIS_POINTS));
        
        // Ensure price doesn't go to zero or become unrealistic
        if (newPrice < oldPrice / 2) newPrice = oldPrice / 2;
        if (newPrice > oldPrice * 3) newPrice = oldPrice * 3;
        
        feed.price = newPrice;
        feed.change24h = totalChange;
        feed.volatility = scenario.volatility;
        feed.timestamp = block.timestamp;
        
        emit PriceUpdated(token, newPrice, totalChange, scenario.volatility);
        
        // Check for significant moves
        if (totalChange > 1000 || totalChange < -1000) { // >10% change
            emit SignificantPriceMove(token, oldPrice, newPrice, totalChange);
            _checkTradingOpportunities(token, totalChange);
        }
    }
    
    function _progressToNextScenario() internal {
        // Simple progression: cycle through scenarios
        uint256 nextScenario = (currentScenario + 1) % scenarioCount;
        if (scenarios[nextScenario].isActive) {
            currentScenario = nextScenario;
            scenarioStartTime = block.timestamp;
            
            MarketScenario memory scenario = scenarios[nextScenario];
            emit MarketScenarioChanged(nextScenario, scenario.name, scenario.trendDirection, scenario.volatility);
        }
    }
    
    function _checkTradingOpportunities(address token, int256 changePercent) internal {
        // Emit trading opportunity signals for AI agents
        if (changePercent > 1500) { // >15% increase
            emit TradingOpportunity(token, address(0), "MOMENTUM_UP", 8000);
        } else if (changePercent < -1500) { // >15% decrease
            emit TradingOpportunity(token, address(0), "REVERSAL_BUY", 7500);
        } else if (changePercent > 500 && priceFeeds[token].volatility > 4000) {
            emit TradingOpportunity(token, address(0), "VOLATILITY_PLAY", 6000);
        }
    }
}