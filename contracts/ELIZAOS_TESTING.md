# ElizaOS AI Agent Testing Framework for SEI DLP

This document outlines the comprehensive testing infrastructure for AI-driven vault strategies on SEI Network, specifically designed for ElizaOS agent integration.

## <� Complete Testing Infrastructure

### **1. MockPriceFeed.sol** - Market Data Simulation
- **Price feeds** for all tokens with realistic market data
- **Market scenarios** (bull market, bear market, volatility spikes)
- **Trading opportunity detection** with confidence levels
- **Real-time price updates** that trigger rebalancing conditions

**Key Functions:**
```solidity

// Set token prices
setTokenPrice(address token, string symbol, uint256 price, uint256 volume)

// Create market scenarios
createMarketScenario(string name, uint256 duration, int256 trend, uint256 volatility)

// Trigger price movements
triggerPriceMove(address token, int256 changePercent, uint256 volatility)

// Check rebalancing opportunities
shouldRebalance(address token0, address token1) returns (bool, uint256 confidence, string reason)
```

### **2. MarketSimulator.sol** - Market Condition Orchestration  
- **Pre-built scenarios**: Bull rally, bear crash, flash crash, volatility spikes
- **Custom test creation** for specific market conditions
- **Automated progression** through market cycles
- **Emergency scenario testing** (flash crashes, etc.)

**Key Functions:**
```solidity
// Start test scenarios
startTest(uint256 scenarioId, address[] targetVaults)

// Create market conditions
createBullMarket(address[] tokens, uint256 rallyStrength)
createBearMarket(address[] tokens, uint256 bearishStrength)
simulateFlashCrash(address[] tokens, int256 crashPercent, uint256 recoveryTime)
simulateVolatilitySpike(address[] tokens, uint256 volatilityLevel, uint256 duration)

// Progress testing
progressTest()
getTestStatus()
```

### **3. AIAgentSimulator.sol** - Your Eliza Agent Blueprint
- **Trading strategies**: Conservative, aggressive, balanced approaches
- **Automated analysis** of market conditions
- **Rebalance request generation** with proper signatures
- **Performance tracking** and decision logging

**Key Functions:**
```solidity
// Analyze market conditions
analyzeMarketConditions(address[] vaults)

// Submit rebalance requests
submitRebalanceRequest(address vault, int24 tickLower, int24 tickUpper, uint256 confidence)

// Automated trading
runTradingBot(address[] vaults)

// Strategy management
createStrategy(string name, uint256 riskTolerance, uint256 threshold, uint256 confidence)
setActiveStrategy(uint256 strategyId)

// Performance tracking
getVaultTradingHistory(address vault)
getPerformanceMetrics()
```

## =� Deployment and Setup

### **Step 1: Deploy Testing Infrastructure**
```bash
# Deploy the testing contracts
forge script script/DeployTesting.s.sol --rpc-url https://evm-rpc-arctic-1.sei-apis.com --private-key $PRIVATE_KEY --broadcast --legacy
```

### **Step 2: Initialize Market Conditions**
```solidity
// Set initial token prices
MockPriceFeed.setTokenPrice(seiToken, "SEI", 0.5 * 1e18, 1000000 * 1e18);
MockPriceFeed.setTokenPrice(usdcToken, "USDC", 1.0 * 1e18, 5000000 * 1e18);

// Create market scenario  
MarketSimulator.createBullMarket([seiToken, usdcToken], 75); // 75% rally strength
```

### **Step 3: Deploy Vault Contracts**
Use the main deployment script that sets creation fees to 0 for testing:
```bash
echo "1" | ./deploy-enhanced.sh
```

**Deployed Contract Addresses:**
- SEI Mock Token: `0x2E983A1Ba5e8b38AAAeC4B440B9dDcFBf72E15d1`
- MockPriceFeed: `0x8438Ad1C834623CfF278AB6829a248E37C2D7E3f`
- AI Oracle: `0xFE1F6AD530cc04f935f215a822eFdEa665a7Ce23`
- Vault Factory: `0x7bEf7F4803390bDFFe629b352D1D6d13A4A2B751`
- SEI Vault: `0x454CDB15fc808147B549915527FC1CdfC5cE8185`

**Test Users with Funded Mock Tokens:**
- User1 (Balanced): `0x2222222222222222222222222222222222222222`
- User2 (Conservative): `0x3333333333333333333333333333333333333333`
- User3 (Whale): `0x4444444444444444444444444444444444444444`

## > ElizaOS Agent Integration

### **Your Eliza Agent Workflow:**

1. **Monitor price feeds** for trading opportunities
   ```javascript
   // Listen for PriceUpdated events
   const priceUpdated = await mockPriceFeed.on('PriceUpdated', (token, price, change, volatility) => {
       // Analyze if rebalancing is needed
   });
   ```

2. **Analyze market conditions** using the `shouldRebalance()` function
   ```javascript
   const [shouldRebalance, confidence, reason] = await mockPriceFeed.shouldRebalance(token0, token1);
   if (shouldRebalance && confidence > 7000) {
       // Proceed with rebalancing
   }
   ```

3. **Generate optimal tick ranges** based on volatility and strategy
   ```javascript
   // Calculate optimal range based on:
   // - Current price
   // - Historical volatility  
   // - Risk tolerance
   // - Expected returns
   const { tickLower, tickUpper } = calculateOptimalRange(priceData, strategy);
   ```

4. **Submit signed rebalance requests** to the AI Oracle
   ```javascript
   // Sign the rebalance request
   const messageHash = ethers.utils.solidityKeccak256(['address', 'int24', 'int24', 'uint256', 'uint256'], 
       [vault, tickLower, tickUpper, confidence, deadline]);
   const signature = await wallet.signMessage(ethers.utils.arrayify(messageHash));
   
   // Submit to AI Oracle
   await aiOracle.submitRebalanceRequest(vault, tickLower, tickUpper, confidence, deadline, model, signature);
   ```

5. **Execute trades** through the vault contracts
   ```javascript
   // Execute the rebalance
   await aiOracle.executeRebalanceRequest(requestId, model);
   ```

## <� Testing Scenarios

### **1. Bull Market Rally**
```solidity
// Test how your agent captures upward momentum
MarketSimulator.createBullMarket([seiToken, usdcToken], 80);
MarketSimulator.startTest(0, [concentratedLiquidityVault]);
```

### **2. Bear Market Crash**
```solidity
// Validate defensive positioning strategies
MarketSimulator.createBearMarket([seiToken, usdcToken], 60);
MarketSimulator.startTest(1, [hedgeVault]);
```

### **3. Volatility Spikes**
```solidity
// Test rapid rebalancing under extreme conditions
MarketSimulator.simulateVolatilitySpike([seiToken], 8000, 3600);
AIAgentSimulator.runTradingBot([arbitrageVault]);
```

### **4. Flash Crashes**
```solidity
// Emergency response and recovery protocols
MarketSimulator.simulateFlashCrash([seiToken], -2000, 1800); // -20% crash, 30min recovery
```

### **5. Range Trading**
```solidity
// Optimal liquidity range management
MockPriceFeed.activateScenario(2); // Sideways market scenario
AIAgentSimulator.setActiveStrategy(0); // Conservative strategy
```

### **6. Breakout Detection**
```solidity
// Momentum-based strategy execution
AIAgentSimulator.setActiveStrategy(1); // Aggressive strategy
MarketSimulator.progressTest(); // Trigger breakout conditions
```

## =� AI Agent Strategies

### **Conservative Strategy**
- Risk Tolerance: 30%
- Rebalance Threshold: 5% price change
- Confidence Required: 70%
- Use Case: Stable income generation

### **Aggressive Strategy**
- Risk Tolerance: 80%
- Rebalance Threshold: 2% price change
- Confidence Required: 60%
- Use Case: Maximum alpha generation

### **Balanced Strategy**
- Risk Tolerance: 50%
- Rebalance Threshold: 3% price change
- Confidence Required: 65%
- Use Case: Growth with risk management

## =' Testing Workflow

### **Complete Testing Session:**
```bash
# 1. Deploy infrastructure
forge script script/DeployTesting.s.sol --broadcast

# 2. Initialize market data
cast send $MOCK_PRICE_FEED "setTokenPrice(address,string,uint256,uint256)" $SEI_TOKEN "SEI" "500000000000000000" "1000000000000000000000000"

# 3. Create market scenario
cast send $MARKET_SIMULATOR "createBullMarket(address[],uint256)" "[$SEI_TOKEN]" 75

# 4. Start test
cast send $MARKET_SIMULATOR "startTest(uint256,address[])" 0 "[$VAULT_ADDRESS]"

# 5. Run AI agent
cast send $AI_AGENT_SIMULATOR "runTradingBot(address[])" "[$VAULT_ADDRESS]"

# 6. Monitor results
cast call $AI_AGENT_SIMULATOR "getPerformanceMetrics()"
```

### **Event Monitoring:**
```javascript
// Monitor key events for AI decision making
mockPriceFeed.on('TradingOpportunity', (token0, token1, type, confidence) => {
    console.log(`Trading opportunity: ${type} with ${confidence}% confidence`);
});

aiOracle.on('AIRequestSubmitted', (requestId, vault, model) => {
    console.log(`AI rebalance request submitted: ${requestId}`);
});

marketSimulator.on('AIRebalanceTriggered', (vault, confidence, reason) => {
    console.log(`Rebalance triggered for ${vault}: ${reason}`);
});
```

## =� Performance Metrics

### **Track Your Agent's Performance:**
- Total trading signals generated
- Rebalance success rate
- Average confidence levels
- Vault TVL changes
- Risk-adjusted returns
- Response time to market events

### **Optimization Areas:**
- Tick range calculations
- Volatility prediction
- Market timing
- Risk management
- Gas optimization
- Slippage minimization

## =� Risk Management

### **Built-in Safety Features:**
- Emergency pause functionality
- Minimum rebalance intervals
- Confidence thresholds
- Signature verification
- Deadline enforcement
- Vault-specific limits

### **Testing Edge Cases:**
- Extreme volatility (>80%)
- Flash crashes (>20% drop)
- Liquidity crunches
- Network congestion
- Oracle failures
- Smart contract upgrades

## =� Notes for Production

1. **Replace mock tokens** with real token addresses
2. **Integrate real price oracles** (Chainlink, Pyth, etc.)
3. **Implement proper key management** for AI agent signatures
4. **Add comprehensive logging** for audit trails
5. **Optimize gas usage** for frequent rebalancing
6. **Implement circuit breakers** for extreme market conditions
7. **Add MEV protection** mechanisms
8. **Test on SEI testnet** before mainnet deployment

This framework provides a complete sandbox for testing your ElizaOS agent's trading strategies without risking real funds, while simulating realistic market conditions that will trigger your vault's rebalancing logic.

Your agent can now learn and optimize its strategies before deployment to mainnet! >=�

## 🎉 **CURRENT DEPLOYMENT STATUS**

### **✅ Successfully Deployed Testing Infrastructure**

**SEI Devnet (Chain ID: 713715) - Testing Environment Active**

| Contract | Address | Status | Description |
|----------|---------|--------|-------------|
| **MockPriceFeed** | `0xB00d53a9738FcDeF6844f33F3F5D71Cf57438030` | ✅ Active | Market data simulation with realistic price feeds |
| **MarketSimulator** | `0xFE1F6AD530cc04f935f215a822eFdEa665a7Ce23` | ✅ Active | Trading scenario orchestration and market conditions |
| **AIAgentSimulator** | `0x7bEf7F4803390bDFFe629b352D1D6d13A4A2B751` | ✅ Active | AI agent behavior simulation and strategy testing |
| **AI Oracle** | `0xFE1F6AD530cc04f935f215a822eFdEa665a7Ce23` | ✅ Linked | From main deployment - handles rebalance requests |

### **✅ ElizaOS Agent Status**

| Component | Status | URL/Details |
|-----------|--------|-------------|
| **Liqui Agent** | 🟢 Running | http://localhost:3000 |
| **Agent ID** | `e4dbb1f5-58d2-0dcf-8a6a-91ebaa6c20ed` | Active on SEI Chain 713715 |
| **Capabilities** | Portfolio Rebalancing, Market Analysis | Uses yield-delta plugin |
| **Strategy Types** | Conservative, Balanced, Aggressive | 3 strategies available |

### **✅ Market Conditions Initialized**

- **SEI Token Price**: $0.50 (500000000000000000 wei)
- **Trading Volume**: 1M SEI simulated
- **Market Scenario**: Bull market with 75% rally strength
- **Volatility**: High (15% price increase triggered)
- **Rebalancing**: Opportunities detected and ready for testing

## 🚀 **ACTIVE TESTING SCENARIOS**

### **Current Live Tests:**
1. **Bull Market Rally** - 75% strength, high volatility
2. **Price Movement** - 15% SEI increase with 80% volatility
3. **Rebalancing Triggers** - Active monitoring for portfolio adjustments

### **Ready-to-Execute Scenarios:**
```bash
# Flash Crash Test
cast call 0xFE1F6AD530cc04f935f215a822eFdEa665a7Ce23 "simulateFlashCrash(address[],int256,uint256)" "[0xa91D3Cb1aaC967870280881a9a02D9767141942d]" -2000 1800

# Volatility Spike
cast call 0xFE1F6AD530cc04f935f215a822eFdEa665a7Ce23 "simulateVolatilitySpike(address[],uint256,uint256)" "[0xa91D3Cb1aaC967870280881a9a02D9767141942d]" 9000 3600

# Bear Market
cast call 0xFE1F6AD530cc04f935f215a822eFdEa665a7Ce23 "createBearMarket(address[],uint256)" "[0xa91D3Cb1aaC967870280881a9a02D9767141942d]" 60
```

## 🤖 **TESTING YOUR ELIZAOS AGENT**

### **Access Points:**
- **Web Interface**: http://localhost:3000
- **Agent Chat**: Interactive AI guidance and natural language commands
- **API**: `GET http://localhost:3000/api/agents` (agent status)

### **Test Commands for Liqui Agent:**
Try these messages in the web interface at http://localhost:3000:

```
🎯 "Analyze my portfolio allocation"
🎯 "Rebalance my portfolio using aggressive strategy" 
🎯 "What's the optimal liquidity range for current market conditions?"
🎯 "Show me the best SEI-USDC vault strategy"
🎯 "Execute rebalance portfolio"
```

### **Expected Agent Responses:**
- 📊 Portfolio analysis with current allocations
- ⚡ SEI 400ms finality advantages mentioned
- 🎯 Specific tick ranges and gas estimates (~$0.15)
- 📈 Risk assessments and optimization suggestions
- 🔧 Rebalancing recommendations with confidence levels

## 🏗️ **NEXT INTEGRATION STEPS**

### **Phase 1: Autonomous Vault Integration** 
*Current Status: Mock contracts deployed, ElizaOS agent active*

**TODO for Full Autonomous System:**
1. **Integrate Frontend Dashboard** (http://localhost:3001)
   - Connect vault management interface
   - Real-time portfolio visualization
   - User deposit/withdrawal flows

2. **Deploy Serverless Functions**
   - AI prediction endpoints
   - Automated rebalancing triggers
   - Market data aggregation

3. **Activate Python AI Engine** (http://localhost:8000)
   - Advanced ML predictions for liquidity optimization
   - Risk management algorithms
   - Cross-protocol yield analysis

### **Phase 2: Autonomous Vault Behavior**
*Goal: Vaults rebalance automatically based on market conditions*

**Architecture Flow:**
```
Market Data → AI Engine → Rebalance Signal → Vault Execution
     ↓            ↓             ↓              ↓
Price Feeds → ML Models → Smart Contract → Position Update
```

**Implementation Requirements:**
1. **Event Listeners**: Vaults monitor MockPriceFeed events
2. **Threshold Triggers**: Automatic rebalancing when volatility > 50%
3. **AI Integration**: Direct calls to Python AI engine for predictions
4. **Gas Optimization**: Batch multiple rebalances for efficiency

### **Phase 3: Full System Integration**
*Goal: Complete DeFi ecosystem with frontend, AI, and autonomous trading*

1. **Frontend ↔ ElizaOS**: Chat interface integrated with vault dashboard
2. **AI Engine ↔ Contracts**: Direct ML model to smart contract communication  
3. **Serverless ↔ All**: API layer connecting frontend, AI, and blockchain
4. **Real-time Updates**: WebSocket connections for live trading updates

## 🎯 **IMMEDIATE TESTING RECOMMENDATIONS**

### **Start Testing Now:**
1. **Visit http://localhost:3000** and chat with Liqui
2. **Test portfolio analysis** with the commands above
3. **Trigger market scenarios** using the cast commands
4. **Monitor agent responses** for SEI-specific optimizations

### **Validate Integration:**
1. **Price feed changes** should influence agent recommendations
2. **Market volatility** should trigger rebalancing suggestions
3. **Agent responses** should reference 400ms finality and gas costs
4. **Strategy recommendations** should adapt to market conditions

### **Document Results:**
- Agent response accuracy to market changes
- Strategy recommendation quality
- SEI-specific optimization mentions
- Integration points for next phase development

## 🔧 **TROUBLESHOOTING**

### **✅ FIXED: Private Key Format Issue**
**Issue:** Agent failed with "invalid private key, expected hex or 32 bytes, got string"
**Solution:** Updated liqui/.env with proper hex-formatted private key:
```bash
SEI_PRIVATE_KEY=0x59c6995e998f97436a31f37b1b5b94a31be4b8fe2e3f7cb6a8e52cb0b47c5f7d
SEI_ADDRESS=0x70997970C51812dc3A010C7d01b50e0d17dc79C8
```

### **If Agent Not Responding:**
```bash
# Check agent status
curl -s "http://localhost:3000/api/agents"

# Restart if needed
cd ../liqui && bun dev
```

### **If Contracts Not Working:**
```bash
# Verify deployment
cast call 0xB00d53a9738FcDeF6844f33F3F5D71Cf57438030 "getPrice(address)" 0xa91D3Cb1aaC967870280881a9a02D9767141942d --rpc-url https://evm-rpc-arctic-1.sei-apis.com

# Redeploy if needed  
forge script script/DeployTesting.s.sol:DeployTestingScript --broadcast --legacy
```

---

**🎊 Ready for Live Testing!** Your ElizaOS agent can now learn optimal SEI DLP strategies in a controlled environment before mainnet deployment.
