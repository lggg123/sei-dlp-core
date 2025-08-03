# SEI DLP Core - Claude Development Guide

## Project Overview

SEI DLP (Decentralized Liquidity Protocol) is an AI-powered DeFi platform built on the SEI blockchain that provides autonomous liquidity provisioning with machine learning-driven optimization. The platform features an advanced strategy ecosystem with 12+ unique approaches ranging from delta-neutral positions to AI-driven momentum trading.

## Architecture

- **Frontend**: Next.js 15 with React 19, TypeScript, Tailwind CSS
- **AI Engine**: Python-based ML system with ElizaOS integration (29-feature ML pipeline)
- **Smart Contracts**: Solidity contracts using Foundry
- **Infrastructure**: Web3 integration with wagmi, RainbowKit, and SEI chain
- **Strategy Framework**: ElizaOS ↔ FastAPI ↔ Python ML models

## 🎯 Mission

Transform a single-version Next.js app into a **regulatory-compliant dual-version architecture** with:

- **US Version**: Coinbase Sandbox integration (CFTC-regulated SEF)
- **Global Version**: Drift Protocol on Sei Devnet (chain ID 13289)
- **Zero code bleed-through** between versions
- **DFPI Directive #25-08 compliance** (July 2025)

## 🚀 Strategy Ecosystem

### Core Strategy Types (12+ Strategies)

**Production Ready:**

1. **Concentrated Liquidity** - AI-optimized range management with 29-feature ML model
1. **Yield Farming** - Multi-protocol yield optimization with risk assessment
1. **Arbitrage** - Cross-exchange funding rate arbitrage with ML prediction
1. **Hedge** - Portfolio protection using perpetual futures
1. **StableMax** - Ultra-stable yield farming (0.1% volatility target)
1. **SEI Hypergrowth** - Native SEI ecosystem exposure with ParallelVM optimization
1. **BlueChip** - Diversified exposure with correlation-based risk management

**Advanced Strategies (Implementation Ready):**
8. **Delta Neutral LP** - LP provision + perpetual short hedge for true neutrality
9. **AI Momentum Long/Short** - Pure directional trading based on multi-modal AI
10. **Volatility Trading** - Volatility risk premium capture
11. **Cross-Asset Arbitrage** - Multi-asset opportunities across protocols
12. **Trend Following** - Systematic trend capture with AI enhancement

### Strategy Performance Matrix

|Strategy                  |Delta Exposure|Risk Level |AI Complexity|Expected APY|
|--------------------------|--------------|-----------|-------------|------------|
|**Delta Neutral LP**      |≈ 0           |Low-Medium |High         |12-18%      |
|**AI Momentum**           |Variable      |Medium-High|Very High    |20-35%      |
|**Concentrated Liquidity**|Positive      |Medium-High|High         |15-25%      |
|**Arbitrage**             |≈ 0           |Low        |Very High    |25-40%      |
|**StableMax**             |≈ 0           |Ultra-Low  |Medium       |8-15%       |

*See `strategies.md` for complete strategy analysis and implementation details.*

## 🤖 AI Engine Architecture

### Python ML Components

- **LiquidityOptimizer**: 29-feature Random Forest + ONNX inference
- **RiskManager**: Multi-dimensional risk assessment (IL, volatility, liquidity, concentration)
- **DeltaNeutralOptimizer**: ML-driven hedge ratio optimization
- **MomentumPredictor**: Multi-modal momentum analysis (technical + social + on-chain)
- **VolatilityPredictor**: Volatility regime detection and trading signals

### ElizaOS Integration

- **8+ Production Actions**: Cross-action coordination for complex strategies
- **Real-time Execution**: LLM-driven tool calls with <500ms latency
- **Multi-agent Orchestration**: Simultaneous strategy management
- **SEI Optimization**: Leveraging 400ms finality for micro-rebalancing

### API Bridge (Python ↔ TypeScript)

```bash
# AI Engine Endpoints
POST /predict/optimal-range           # ML-driven liquidity range optimization
POST /predict/market                  # Market movement prediction
POST /analyze/rebalance              # Rebalance need analysis
POST /predict/delta-neutral-optimization  # Delta neutral strategy optimization
POST /predict/momentum-signals       # AI momentum trading signals
POST /predict/volatility-opportunities   # Volatility trading opportunities
```

## Critical UI Issues to Address

### Landing Page

- **CSS Override Conflicts**: Multiple conflicting styles causing visual inconsistencies
- **Global CSS Cleanup**: Need to consolidate duplicate rules and eliminate specificity wars
- **Responsive Design**: Styling breaks or looks inconsistent across mobile/tablet/desktop
- **Performance**: CSS conflicts causing render performance issues

### Vaults Page

- **3D Background Interference**: Three.js background elements covering interactive buttons and UI elements
- **Transparency Issues**: UI elements too transparent, affecting usability and readability
- **Z-index Problems**: Poor layering causing buttons to be unclickable or hidden
- **Contrast Issues**: Poor text/button visibility over complex 3D backgrounds
- **Three.js Integration**: Need proper masking and overlays for UI elements over 3D scenes

### Cross-Page Issues

- Inconsistent design system implementation
- Accessibility problems (contrast ratios, focus states)
- Tailwind CSS conflicts with custom CSS
- 3D animation performance affecting UI responsiveness

### 2. US Version Requirements (CFTC-Compliant)

- ✅ **Coinbase Advanced Trade Sandbox ONLY** (`https://advanced-trade-sandbox.coinbase.com`)
- ✅ **Manual confirmation pattern**: No auto-execution
- ✅ **Clear disclaimer**: “Futures execution occurs via Coinbase (CFTC-regulated SEF)”
- ✅ **Zero Drift/Pyth imports** in `/us/` directory
- ✅ **Chain ID 13289 verification** in all protocol calls

### 3. Global Version Requirements (Sei-Optimized)

- ✅ **Drift Protocol on Sei Devnet** (chain ID 13289)
- ✅ **Real-time rebalancing** leveraging Sei’s 400ms finality
- ✅ **AI Engine**: Reinforcement learning for LP strategies
- ✅ **Three.js 3D vault visualization**
- ✅ **Zero Coinbase imports** in `/global/` directory

### 4. Compliance Safeguards (DFPI #25-08)

- ❌ **NO personal device usage** for deployment
- ✅ **Solvang Library Computer #7** for final deployment
- ✅ **Cloudflare Pages** for geo-routed versions:
  - `us.sei-dlp.pages.dev` → US edges (iad1)
  - `global.sei-dlp.pages.dev` → Singapore edges (sin1)
- ✅ **Header simulation** for local testing:
  
  ```bash
  curl -H "cf-ipcountry: US" http://localhost:3000/global # Should return 403
  ```

## Subagent Usage

- **ui-styling-specialist**: Use for any styling issues on landing page or vaults page
- Automatically invoked for CSS conflicts, 3D background issues, and responsive problems
- Invoke manually with: “Use the ui-styling-specialist to [specific task]”
- Agent specializes in Three.js layering, Tailwind optimization, and accessibility

## Development Commands

### Frontend (Next.js)

```bash
pnpm dev           # Start development server with Turbopack
pnpm build         # Build for production
pnpm start         # Start production server
pnpm lint          # Run ESLint
pnpm test          # Run Jest tests
pnpm test:watch    # Run tests in watch mode
pnpm test:coverage # Run tests with coverage report
```

### Styling & UI Development

```bash
# Tailwind CSS
pnpm build:css     # Build and optimize Tailwind styles
npx tailwindcss -i ./src/styles/globals.css -o ./dist/output.css --watch

# Lint CSS (if configured)
pnpm lint:css      # Check for CSS issues

# Test responsive design
pnpm dev           # Then test on localhost:3000 at different breakpoints
```

### AI Engine (Python)

```bash
cd ai-engine/
poetry install     # Install dependencies
poetry run uvicorn api_bridge:app --reload --port 8000  # Start AI engine
poetry run pytest # Run Python tests
poetry run pytest --cov # Run tests with coverage
poetry run black .       # Format code
poetry run isort .       # Sort imports
poetry run mypy .        # Type checking
```

### Smart Contracts (Foundry)

```bash
cd contracts/
forge build       # Compile contracts
forge test         # Run contract tests
forge coverage     # Generate coverage report
forge fmt          # Format Solidity code
```

## API Endpoints

```bash
# Health check
curl -s http://localhost:3000/api/health | jq .

# Get vault data (includes all 12+ strategies)
curl -s http://localhost:3000/api/vaults | jq '.data | length'

# Market data
curl -s 'http://localhost:3000/api/market/data?symbols=SEI-USDC' | jq .data[0].price

# AI Engine health
curl -s http://localhost:8000/health | jq .

# Strategy optimization
curl -X POST http://localhost:8000/predict/optimal-range \
  -H "Content-Type: application/json" \
  -d '{"vault_address":"0x123","current_price":1.5,"volatility":0.3}'

# API documentation
curl -s http://localhost:3000/api/docs | jq .title
```

## Key Technologies

### Frontend Stack

- **Next.js 15**: React framework with App Router
- **React 19**: UI library with latest features
- **TypeScript**: Type safety
- **Tailwind CSS 4**: Utility-first styling
- **Radix UI**: Accessible component primitives
- **Framer Motion**: Animation library
- **Three.js**: 3D graphics for vault visualization
- **GSAP**: High-performance animations

### Web3 Integration

- **wagmi**: React hooks for Ethereum
- **viem**: TypeScript interface for Ethereum
- **RainbowKit**: Wallet connection UI
- **@sei-js/core**: SEI blockchain integration
- **@web3modal/ethereum**: Web3 modal provider

### AI/ML Stack

- **Python 3.10+**: Core runtime
- **NumPy/Pandas**: Data processing
- **scikit-learn**: Machine learning (Random Forest, StandardScaler)
- **ONNX Runtime**: Optimized model inference
- **FastAPI**: API framework with async support
- **aiohttp**: Async HTTP client
- **Redis**: Caching and pub/sub

### ElizaOS Framework

- **Multi-agent System**: Autonomous agent orchestration
- **Plugin Architecture**: Modular strategy implementation
- **Real-time Execution**: LLM-driven tool calls
- **Cross-platform**: Discord, Telegram, HTTP interfaces

### Testing

- **Frontend**: Jest with Testing Library
- **AI Engine**: pytest with async support
- **Smart Contracts**: Foundry test suite
- **Coverage**: Comprehensive test coverage reporting
- **Strategy Testing**: Backtesting and simulation framework

## Project Structure

### Frontend (`/src/`)

- `app/`: Next.js App Router pages and API routes
  - `(landing)/`: Landing page components and styles
  - `vaults/`: Vaults page with 3D visualization and 12+ strategy support
- `components/`: React components with CSS modules
  - `ui/`: Radix UI component wrappers
  - `three/`: Three.js 3D components for vaults
- `styles/`: CSS and styling files
  - `globals.css`: Global Tailwind styles (needs cleanup)
  - `landing.module.css`: Landing page specific styles
  - `vaults.module.css`: Vaults page with 3D integration styles
- `hooks/`: Custom React hooks
- `lib/`: Utility functions and configurations
- `types/`: TypeScript type definitions

### AI Engine (`/ai-engine/`)

- `sei_dlp_ai/core/`: Core AI engine logic
- `sei_dlp_ai/integrations/`: ElizaOS client integration
- `sei_dlp_ai/models/`: ML models for liquidity optimization
  - `liquidity_optimizer.py`: 29-feature ML pipeline
  - `risk_manager.py`: Multi-dimensional risk assessment
  - `delta_neutral_optimizer.py`: Delta neutral strategy optimization
  - `momentum_predictor.py`: AI momentum trading signals
- `api_bridge.py`: FastAPI bridge for ElizaOS integration
- `tests/`: Comprehensive test suite

### ElizaOS Plugin (`/eliza-plugin/`)

- `actions/`: Strategy implementation actions
  - `amm-optimize.ts`: ML-enhanced liquidity optimization
  - `funding-arbitrage.ts`: Cross-exchange arbitrage
  - `delta-neutral.ts`: Delta neutral LP + short strategies
  - `ai-momentum.ts`: AI-driven momentum trading
- `providers/`: Blockchain and data providers
- `evaluators/`: Risk assessment and strategy selection
- `types/`: TypeScript types for strategy framework

### Smart Contracts (`/contracts/`)

- `src/`: Solidity contracts
- `test/`: Contract tests
- `script/`: Deployment scripts

## Styling Guidelines

- **Tailwind First**: Use Tailwind utilities before custom CSS
- **Component Scoping**: Use CSS modules for component-specific styles
- **3D Integration**: Ensure UI elements have proper z-index over Three.js canvas
- **Responsive**: Mobile-first design approach
- **Accessibility**: Maintain WCAG 2.1 AA compliance
- **Performance**: Minimize CSS conflicts and unused styles

## 3D Background Considerations

- Three.js canvas should have lower z-index than UI elements
- Use CSS `pointer-events: none` on background 3D elements
- Implement proper masking for text readability over 3D scenes
- Test button clickability with 3D backgrounds active
- Ensure animations don’t interfere with user interactions

## Key Features

1. **12+ Strategy Ecosystem**: From ultra-stable to high-alpha strategies
1. **Advanced AI Engine**: 29-feature ML pipeline with multi-modal analysis
1. **Delta Neutral Strategies**: True market-neutral positions with fee capture
1. **AI Momentum Trading**: Multi-modal sentiment and technical analysis
1. **Real-time Rebalancing**: Leveraging SEI’s 400ms finality
1. **3D Vault Visualization**: Interactive dashboard with Three.js
1. **ERC-4626 Vaults**: Standard-compliant vault contracts
1. **ElizaOS Integration**: Multi-agent AI framework integration
1. **Comprehensive Testing**: Full test coverage across all components
1. **Risk Management**: Multi-dimensional risk assessment and monitoring

## Development Workflow

1. Use `pnpm dev` for frontend development
1. Run AI engine with `poetry run uvicorn api_bridge:app --reload --port 8000`
1. Deploy contracts locally with `forge script`
1. **Always test styling changes on both landing and vaults pages**
1. **Invoke ui-styling-specialist for CSS issues**
1. **Test new strategies with backtesting framework**
1. Run comprehensive tests before committing
1. Use ESLint and Prettier for code formatting

## Strategy Development Workflow

1. **Design Strategy**: Define parameters in `strategies.md`
1. **Implement ElizaOS Action**: Create TypeScript action in `node_modules/elizaos/yield-delta/src/actions/`
1. **Develop Python AI Model**: Add ML components in `/ai-engine/sei_dlp_ai/models/`
1. **Create API Endpoint**: Add FastAPI endpoint in `api_bridge.py`
1. **Add Frontend Support**: Update vault UI for new strategy type
1. **Comprehensive Testing**: Unit tests, integration tests, and backtesting
1. **Performance Optimization**: Ensure <500ms end-to-end latency
1. **Documentation**: Update strategy documentation and user guides

## Environment Setup

- Node.js 18+ required for frontend
- Python 3.10+ required for AI engine
- Foundry required for smart contracts
- SEI wallet for testing blockchain interactions
- ElizaOS CLI for agent development

## Key Dependencies

- React 19 with Next.js 15
- Web3 stack: wagmi, viem, RainbowKit
- UI: Radix UI components with Tailwind styling
- Animation: Framer Motion and GSAP
- 3D: Three.js with React Three Fiber
- AI/ML: Python scientific stack with FastAPI
- Strategy Framework: ElizaOS multi-agent system
- Testing: Jest, pytest, Foundry

## Performance Requirements

- **ElizaOS Actions**: <100ms action validation and routing
- **Python AI Models**: <300ms ML inference
- **SEI Transactions**: <400ms finality
- **Total Latency**: <500ms end-to-end strategy execution
- **ML Accuracy**: 85%+ for momentum predictions, 95%+ for risk assessment

## Strategy Performance Targets

- **Delta Neutral**: <5% delta exposure, 12-18% APY
- **AI Momentum**: 85%+ prediction accuracy, 20-35% APY
- **Risk Management**: 50% reduction in maximum drawdown
- **Capital Efficiency**: 30% improvement via advanced strategies
- **Overall Platform**: 20%+ improvement in risk-adjusted returns

## Notes

- Project uses pnpm for package management
- AI engine is containerizable with Docker
- Smart contracts use OpenZeppelin libraries
- Comprehensive test coverage across all layers
- Follows modern TypeScript and Python best practices
- **Strategy ecosystem supports institutional-scale capital**
- **UI styling requires special attention due to 3D background complexity**
- **Always delegate styling issues to ui-styling-specialist subagent**
- **See `strategies.md` for complete strategy analysis and implementation details**

## Related Documentation

- **`strategies.md`**: Comprehensive strategy analysis and implementation guide
- **`api_bridge.py`**: FastAPI endpoints for AI integration
- **ElizaOS Plugin**: `/eliza-plugin/` directory for strategy actions
- **Python AI Models**: `/ai-engine/sei_dlp_ai/models/` for ML components

