# SEI DLP Core - Claude Development Guide

## Project Overview

SEI DLP (Decentralized Liquidity Protocol) is an AI-powered DeFi platform built on the SEI blockchain that provides autonomous liquidity provisioning with machine learning-driven optimization.

## Architecture

- **Frontend**: Next.js 15 with React 19, TypeScript, Tailwind CSS
- **AI Engine**: Python-based ML system with ElizaOS integration
- **Smart Contracts**: Solidity contracts using Foundry
- **Infrastructure**: Web3 integration with wagmi, RainbowKit, and SEI chain

## 🎯 Mission
Transform a single-version Next.js app into a **regulatory-compliant dual-version architecture** with:
- **US Version**: Coinbase Sandbox integration (CFTC-regulated SEF)
- **Global Version**: Drift Protocol on Sei Devnet (chain ID 13289)
- **Zero code bleed-through** between versions
- **DFPI Directive #25-08 compliance** (July 2025)

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
- ✅ **Clear disclaimer**: "Futures execution occurs via Coinbase (CFTC-regulated SEF)"
- ✅ **Zero Drift/Pyth imports** in `/us/` directory
- ✅ **Chain ID 13289 verification** in all protocol calls

### 3. Global Version Requirements (Sei-Optimized)
- ✅ **Drift Protocol on Sei Devnet** (chain ID 13289)
- ✅ **Real-time rebalancing** leveraging Sei's 400ms finality
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
  curl -H "cf-ipcountry: US" http://localhost:3000/global # Should return 403t

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

# Get vault data
curl -s http://localhost:3000/api/vaults | jq '.data | length'

# Market data
curl -s 'http://localhost:3000/api/market/data?symbols=SEI-USDC' | jq .data[0].price

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
- **scikit-learn**: Machine learning
- **ONNX Runtime**: Model inference
- **FastAPI**: API framework
- **aiohttp**: Async HTTP client
- **Redis**: Caching and pub/sub

### Testing

- **Frontend**: Jest with Testing Library
- **AI Engine**: pytest with async support
- **Smart Contracts**: Foundry test suite
- **Coverage**: Comprehensive test coverage reporting

## Project Structure

### Frontend (`/src/`)

- `app/`: Next.js App Router pages and API routes
  - `(landing)/`: Landing page components and styles
  - `vaults/`: Vaults page with 3D visualization
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
- `tests/`: Comprehensive test suite

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

1. **Autonomous Liquidity Management**: AI-driven position optimization
1. **Real-time Rebalancing**: Leveraging SEI’s 400ms finality
1. **3D Vault Visualization**: Interactive dashboard with Three.js
1. **ERC-4626 Vaults**: Standard-compliant vault contracts
1. **ElizaOS Integration**: AI agent framework integration
1. **Comprehensive Testing**: Full test coverage across all components

## Development Workflow

1. Use `pnpm dev` for frontend development
1. Run AI engine separately with `poetry run uvicorn`
1. Deploy contracts locally with `forge script`
1. **Always test styling changes on both landing and vaults pages**
1. **Invoke ui-styling-specialist for CSS issues**
1. Run comprehensive tests before committing
1. Use ESLint and Prettier for code formatting

## Environment Setup

- Node.js 18+ required for frontend
- Python 3.10+ required for AI engine
- Foundry required for smart contracts
- SEI wallet for testing blockchain interactions

## Key Dependencies

- React 19 with Next.js 15
- Web3 stack: wagmi, viem, RainbowKit
- UI: Radix UI components with Tailwind styling
- Animation: Framer Motion and GSAP
- 3D: Three.js with React Three Fiber
- AI/ML: Python scientific stack with FastAPI
- Testing: Jest, pytest, Foundry

## Notes

- Project uses pnpm for package management
- AI engine is containerizable with Docker
- Smart contracts use OpenZeppelin libraries
- Comprehensive test coverage across all layers
- Follows modern TypeScript and Python best practices
- **UI styling requires special attention due to 3D background complexity**
- **Always delegate styling issues to ui-styling-specialist subagent**