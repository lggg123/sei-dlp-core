# SEI DLP AI Engine

## Overview
AI-driven liquidity optimization engine for the SEI Dynamic Liquidity Protocol (DLP). This engine integrates with ElizaOS to provide machine learning-powered trading strategies and risk management.

## Features
- 🧠 **ML-driven price range optimization** using reinforcement learning
- ⚡ **Real-time position management** leveraging SEI's 400ms finality
- 🛡️ **Impermanent loss hedging** via perpetual futures
- 📊 **Multi-strategy portfolio optimization**
- 🔄 **ElizaOS integration** for seamless data flow

## Architecture
```
ElizaOS (TypeScript) ↔ AI Engine (Python) ↔ SEI Chain
     ↑                       ↑                    ↑
SEI Oracle Provider    ML Models (ONNX)    Smart Contracts
DragonSwap Action      Risk Engine         Vault Strategies
Funding Arbitrage      Portfolio Optimizer  Position Manager
```

## Development

### Setup
```bash
cd ai-engine
./install.sh
poetry install
poetry run pytest  # Run tests
```

### Testing
```bash
# Run all tests with coverage
poetry run pytest --cov=sei_dlp_ai --cov-report=html

# Run specific test modules
poetry run pytest tests/test_models/
poetry run pytest tests/test_integrations/
```

## Integration with ElizaOS

The AI engine communicates with your ElizaOS plugin via:
- **WebSocket connections** for real-time data streaming
- **REST APIs** for model predictions and recommendations
- **Redis pub/sub** for event-driven communication
- **Shared data schemas** for type safety across languages
