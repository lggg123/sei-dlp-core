# SEI DLP System Architecture

## Overview
The SEI Dynamic Liquidity Protocol (DLP) is a comprehensive DeFi system that integrates smart contracts, AI-driven optimization, and user interfaces to provide advanced liquidity management on the SEI blockchain.

## Architecture Diagram

```mermaid
graph TD
    subgraph "SEI Blockchain"
        AIOracle["AIOracle.sol"]
        VaultFactory["VaultFactory.sol"]
        SEIVault["SEIVault.sol"]
        StrategyVault["StrategyVault.sol"]
        ConcentratedLiquidityVault["ConcentratedLiquidityVault.sol"]
        YieldFarmingVault["YieldFarmingVault.sol"]
        ArbitrageVault["ArbitrageVault.sol"]
        HedgeVault["HedgeVault.sol"]
        StableMaxVault["StableMaxVault.sol"]
        SeiHypergrowthVault["SeiHypergrowthVault.sol"]
        BlueChipVault["BlueChipVault.sol"]
        DeltaNeutralVault["DeltaNeutralVault.sol"]
    end

    subgraph "AI Engine"
        AIE["AI Engine (Python)"]
        MLModels["ML Models"]
        RiskEngine["Risk Engine"]
        PortfolioOptimizer["Portfolio Optimizer"]
    end

    subgraph "Eliza OSI Agent"
        Eliza["Eliza OSI"]
        Liqui["Liqui Plugin"]
        Character["SEI DLP Character"]
    end

    subgraph "Frontend"
        NextJS["Next.js App"]
        DepositModal["DepositModal.tsx"]
        VaultCard["VaultCard.tsx"]
        Web3Provider["Web3Provider.tsx"]
        APIRoutes["API Routes"]
    end

    subgraph "Backend"
        VaultAPI["/api/vaults"]
        MarketAPI["/api/market"]
        AIAPI["/api/ai"]
        ElizaAPI["/api/eliza"]
    end

    subgraph "Users"
        User1["User1 (0x2222...)"]
        User2["User2 (0x3333...)"]
        User3["User3 (0x4444...)"]
        MetaMask["MetaMask"]
    end

    %% Smart Contract Relationships
    AIOracle --> VaultFactory
    VaultFactory --> SEIVault
    VaultFactory --> StrategyVault
    StrategyVault --> ConcentratedLiquidityVault
    StrategyVault --> YieldFarmingVault
    StrategyVault --> ArbitrageVault
    StrategyVault --> HedgeVault
    StrategyVault --> StableMaxVault
    StrategyVault --> SeiHypergrowthVault
    StrategyVault --> BlueChipVault
    StrategyVault --> DeltaNeutralVault

    %% AI Engine Integration
    AIOracle --> AIE
    AIE --> MLModels
    AIE --> RiskEngine
    AIE --> PortfolioOptimizer

    %% Eliza OSI Integration
    Eliza --> Liqui
    Liqui --> Character
    Character --> AIE

    %% Frontend Integration
    NextJS --> DepositModal
    NextJS --> VaultCard
    NextJS --> Web3Provider
    NextJS --> APIRoutes

    %% Backend Integration
    APIRoutes --> VaultAPI
    APIRoutes --> MarketAPI
    APIRoutes --> AIAPI
    APIRoutes --> ElizaAPI

    %% User Interaction
    User1 --> MetaMask
    User2 --> MetaMask
    User3 --> MetaMask
    MetaMask --> NextJS
    MetaMask --> SEIVault
    MetaMask --> StrategyVault

    %% Data Flow
    VaultAPI --> SEIVault
    VaultAPI --> StrategyVault
    MarketAPI --> AIOracle
    AIAPI --> AIE
    ElizaAPI --> Eliza

    %% Workflow
    User1 -->|Deposit| DepositModal
    DepositModal -->|Transaction| MetaMask
    MetaMask -->|Approve| SEIVault
    SEIVault -->|Mint Shares| User1
    SEIVault -->|Rebalance| AIOracle
    AIOracle -->|Optimize| AIE
    AIE -->|Recommend| SEIVault