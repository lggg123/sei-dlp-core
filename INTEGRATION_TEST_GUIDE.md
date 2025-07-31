# SEI DLP AI Integration Test Guide

## Overview
This guide tests the complete integration flow: **UI (3001) ↔ ElizaOS (3000) ↔ Python AI Engine (8000)**

## Architecture Summary

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Next.js UI    │    │   ElizaOS       │    │  Python AI      │
│   Port: 3001    │◄──►│   Port: 3000    │◄──►│  Port: 8000     │
│                 │    │                 │    │                 │
│ • Vaults Page   │    │ • Liqui Agent   │    │ • ML Models     │
│ • AIChat Comp   │    │ • Character     │    │ • Predictions   │
│ • API Routes    │    │ • Plugin Overr  │    │ • Rebalancing   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Prerequisites

### 1. Environment Variables
Create `.env` files with required configuration:

**Main Project (.env):**
```env
AI_ENGINE_URL=http://localhost:8000
ELIZA_AGENT_URL=http://localhost:3000
```

**Eliza Agent (liqui/.env):**
```env
MAIN_PROJECT_API=http://localhost:3001
AI_ENGINE_URL=http://localhost:8000
PYTHON_AI_ENGINE_ACTIVE=true
YIELD_DELTA_USE_EXISTING_APIS=true
ENABLE_API_INTEGRATION=true
```

### 2. Dependencies
```bash
# Install Python dependencies
cd ai-engine
pip install fastapi uvicorn pydantic httpx

# Install Node.js dependencies  
cd ../
npm install

cd liqui/
npm install
```

## Testing Steps

### Phase 1: Individual Service Health Checks

#### 1.1 Start Python AI Engine
```bash
cd ai-engine
python api_bridge.py
```

**Expected Output:**
```
INFO: Starting SEI DLP AI Engine Bridge on port 8000
INFO: Uvicorn running on http://0.0.0.0:8000
```

**Test Health Endpoint:**
```bash
curl http://localhost:8000/health
```

**Expected Response:**
```json
{
  "status": "healthy",
  "service": "SEI DLP AI Engine Bridge",
  "timestamp": "2024-01-23T12:00:00.000Z",
  "version": "1.0.0"
}
```

#### 1.2 Start ElizaOS Agent
```bash
cd liqui
npm run dev
```

**Expected Output:**
```
🤖 Starting Eliza agent...
✅ Character loaded: Liqui
✅ Plugins loaded: [@elizaos/plugin-bootstrap]
🚀 Agent running on http://localhost:3000
```

**Test Health Endpoint:**
```bash
curl http://localhost:3000/health
```

#### 1.3 Start Next.js UI
```bash
cd ../
npm run dev
```

**Expected Output:**
```
▲ Next.js 14.x.x
- Local: http://localhost:3001
- Ready in 2.1s
```

**Test Health Endpoint:**
```bash
curl http://localhost:3001/api/health
```

### Phase 2: API Integration Tests

#### 2.1 Test UI → Python AI Direct Connection
```bash
curl -X POST http://localhost:3001/api/ai/predict \
  -H "Content-Type: application/json" \
  -d '{
    "vaultAddress": "0x1234567890123456789012345678901234567890",
    "marketData": {
      "currentPrice": 1.0,
      "volume24h": 1000000,
      "volatility": 0.25,
      "liquidity": 5000000
    },
    "timeframe": "1d",
    "chainId": 713715
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "vaultAddress": "0x1234567890123456789012345678901234567890",
    "prediction": {
      "optimalRange": {
        "lowerPrice": 0.95,
        "upperPrice": 1.05,
        "lowerTick": -500,
        "upperTick": 500,
        "currentTick": 0,
        "tickSpacing": 60
      },
      "confidence": 0.87,
      "metadata": {
        "aiEngineUsed": true,
        "reasoning": "Optimal range calculated for SEI Chain..."
      }
    }
  },
  "timestamp": "2024-01-23T12:00:00.000Z",
  "chainId": 713715
}
```

#### 2.2 Test UI → ElizaOS Chat Integration
```bash
curl -X POST http://localhost:3001/api/eliza/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Analyze my SEI-USDC vault performance and suggest optimal ranges",
    "vaultAddress": "0x1234567890123456789012345678901234567890",
    "context": {
      "currentPage": "vaults",
      "vaultData": {"apy": 24.5, "tvl": "$1.8M"}
    },
    "chainId": 713715
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "response": "🎯 Based on SEI AI Engine analysis: Optimal range is $0.9500 - $1.0500 with 87.0% confidence...",
  "confidence": 0.87,
  "actions": ["ANALYZE_REBALANCE", "CHECK_GAS_COSTS"],
  "suggestions": [
    "Analyze vault 12345678... performance",
    "Check rebalancing opportunities for this vault",
    "Review risk metrics and IL exposure"
  ],
  "responseTime": "485ms",
  "metadata": {
    "processingSource": "eliza-agent",
    "aiEngineIntegration": true
  }
}
```

### Phase 3: UI Integration Tests

#### 3.1 Test Vaults Page Chat Interface

1. **Navigate to Vaults Page:**
   ```
   http://localhost:3001/vaults
   ```

2. **Verify AI Chat Button:**
   - Look for floating chat button in bottom-right corner
   - Should show green pulse indicator when chat is closed
   - Button should have "Open AI Assistant" tooltip

3. **Open Chat Interface:**
   - Click the chat button
   - Chat interface should slide in from right
   - Should show initial message from Liqui

4. **Test Chat Functionality:**
   - Type: "What's the best vault for 25% APY?"
   - Expected: Response about SEI Hypergrowth vault with AI analysis
   - Check for confidence indicator and suggestions

5. **Test Vault-Specific Queries:**
   - Click on a vault card to select it
   - Type: "Should I rebalance this vault?"
   - Expected: AI analysis specific to selected vault

#### 3.2 Test Agent Status Indicators

1. **With All Services Running:**
   - Chat should show "AI Agent Online" status
   - Confidence bars should be high (80%+)
   - Responses should include "⚡ Powered by SEI DLP AI Engine"

2. **With AI Engine Stopped:**
   - Stop Python AI Engine (`Ctrl+C`)
   - Chat should still work but show "Using Fallback Mode"
   - Responses should have lower confidence
   - Metadata should show `aiEngineUsed: false`

3. **With ElizaOS Stopped:**
   - Stop ElizaOS agent (`Ctrl+C`)
   - Chat should show "AI Agent Offline (Using Fallback)"
   - Responses should use basic fallback logic

### Phase 4: End-to-End Integration Tests

#### 4.1 Complete User Flow Test

1. **User visits vaults page** → UI loads with 3D animations
2. **User opens AI chat** → Chat interface appears
3. **User asks: "Which vault has the best risk-adjusted returns?"**
4. **Expected Flow:**
   ```
   UI → /api/eliza/chat → ElizaOS Agent → Python AI Engine → ML Analysis → Response Chain
   ```
5. **User gets response with:**
   - AI-powered vault analysis
   - Specific recommendations
   - Risk metrics
   - Actionable suggestions

#### 4.2 Vault Optimization Flow

1. **User selects specific vault**
2. **User asks: "Optimize this vault's liquidity range"**
3. **Expected Processing:**
   - UI sends vault context to ElizaOS
   - ElizaOS routes to Python AI via plugin overrides
   - AI engine calculates optimal range
   - Response includes tick calculations and confidence
4. **User receives:**
   - Specific price ranges
   - Expected APY improvement
   - Gas cost estimates
   - Rebalancing recommendations

## Expected Integration Results

### ✅ Success Indicators

1. **All Health Endpoints Return 200**
2. **Chat Shows "AI Agent Online"**
3. **Responses Include AI Engine Data**
4. **High Confidence Scores (80%+)**
5. **SEI-Specific Optimizations Mentioned**
6. **Vault Context Properly Passed**

### 🔧 Troubleshooting

#### Chat Not Working
- Check browser console for errors
- Verify all three services are running
- Test individual API endpoints

#### Low Confidence Responses
- Indicates AI engine connection issues
- Check Python AI engine logs
- Verify API routes are properly connected

#### Generic Responses
- Suggests ElizaOS fallback mode
- Check ElizaOS agent connection
- Verify plugin overrides are active

## Architecture Validation

### ✅ Confirmed Integrations

1. **UI ↔ Python AI:** Direct API calls for predictions/rebalancing
2. **UI ↔ ElizaOS:** Chat interface with context passing
3. **ElizaOS ↔ Python AI:** Plugin overrides route AI queries
4. **ElizaOS ↔ UI APIs:** Uses existing SEI DLP endpoints

### 🚀 Performance Targets

- **Chat Response Time:** < 2 seconds
- **AI Predictions:** < 1 second  
- **UI Responsiveness:** No blocking operations
- **Fallback Handling:** Graceful degradation when services unavailable

## Next Steps

1. **Load Testing:** Test with multiple concurrent users
2. **Error Handling:** Verify robust error recovery
3. **Production Deployment:** Configure for production environments
4. **Monitoring:** Add comprehensive logging and metrics
5. **Security:** Implement proper authentication and rate limiting

---

## Integration Complete! 🎉

The SEI DLP system now has full AI integration across all three components:
- **Stunning 3D UI** with real-time chat
- **Intelligent ElizaOS agent** with SEI-specific knowledge
- **Powerful Python AI engine** with ML predictions

Users can now interact with AI-powered vault optimization through a beautiful, responsive interface with seamless fallback handling.