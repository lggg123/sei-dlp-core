
# SEI DLP Core - Claude Development Guide

## Project Overview
SEI DLP (Decentralized Liquidity Protocol) is an AI-powered DeFi platform built on the SEI blockchain that provides autonomous liquidity provisioning with machine learning-driven optimization.

## Architecture
- **Frontend**: Next.js 15 with React 19, TypeScript, Tailwind CSS
- **AI Engine**: Python-based ML system with ElizaOS integration
- **Smart Contracts**: Solidity contracts using Foundry
- **Infrastructure**: Web3 integration with wagmi, RainbowKit, and SEI chain

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
- `components/`: React components with CSS modules
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

## Key Features
1. **Autonomous Liquidity Management**: AI-driven position optimization
2. **Real-time Rebalancing**: Leveraging SEI's 400ms finality
3. **3D Vault Visualization**: Interactive dashboard with Three.js
4. **ERC-4626 Vaults**: Standard-compliant vault contracts
5. **ElizaOS Integration**: AI agent framework integration
6. **Comprehensive Testing**: Full test coverage across all components

## Development Workflow
1. Use `pnpm dev` for frontend development
2. Run AI engine separately with `poetry run uvicorn`
3. Deploy contracts locally with `forge script`
4. Run comprehensive tests before committing
5. Use ESLint and Prettier for code formatting

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