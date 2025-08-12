// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/SEIVault.sol";
import "../src/VaultFactory.sol";
import "../src/AIOracle.sol";
import "../src/StrategyVault.sol";
import "../src/strategies/ConcentratedLiquidityVault.sol";
import "../src/strategies/YieldFarmingVault.sol";
import "../src/strategies/ArbitrageVault.sol";
import "../src/strategies/HedgeVault.sol";
import "../src/strategies/StableMaxVault.sol";
import "../src/strategies/SeiHypergrowthVault.sol";
import "../src/strategies/BlueChipVault.sol";
import "../src/strategies/DeltaNeutralVault.sol";

contract DeployScript is Script {
    // SEI Network Configuration (devnet chain ID 713715, Arctic endpoint)
    uint256 constant SEI_CHAIN_ID = 713715;
    
    // Deployment addresses (will be set during deployment)
    address public mockToken;
    address public seiVault;
    address public vaultFactory;
    address public aiOracle;
    address public strategyVault;
    address public concentratedLiquidityVault;
    address public yieldFarmingVault;
    address public arbitrageVault;
    address public hedgeVault;
    address public stableMaxVault;
    address public seiHypergrowthVault;
    address public blueChipVault;
    address public deltaNeutralVault;
    
    function run() external {
        // Verify we're deploying to SEI network
        require(block.chainid == SEI_CHAIN_ID, "Must deploy to SEI network");
        
        // Hardcoded devnet private key (for SEI devnet only, safe for testing)
        uint256 deployerPrivateKey = 0x123456789abcdef123456789abcdef123456789abcdef123456789abcdef1234; // example key, replace as needed
        address deployer = vm.addr(deployerPrivateKey);
        
        console.log("Deploying to SEI Network (Chain ID: %s)", block.chainid);
        console.log("Deployer address: %s", deployer);
        console.log("Deployer balance: %s", deployer.balance);
        
        vm.startBroadcast(deployerPrivateKey);
        
        // 1. Deploy Mock Token for testing (only on devnet)
        if (block.chainid == 713715) { // SEI devnet (Arctic)
            mockToken = deployMockToken();
            console.log("Mock Token deployed at: %s", mockToken);
        }
        
        // 2. Deploy AI Oracle
        aiOracle = deployAIOracle(deployer);
        console.log("AI Oracle deployed at: %s", aiOracle);
        
        // 3. Deploy Vault Factory
        vaultFactory = deployVaultFactory(deployer, aiOracle);
        console.log("Vault Factory deployed at: %s", vaultFactory);
        
        // 4. Deploy SEI Vault
        seiVault = deploySEIVault(mockToken, deployer, deployer);
        console.log("SEI Vault deployed at: %s", seiVault);
        
        // 5. Deploy Strategy Vault through Factory
        strategyVault = deployStrategyVaultThroughFactory(mockToken, deployer);
        console.log("Strategy Vault deployed at: %s", strategyVault);
        
        // 6. Configure AI Oracle with deployed contracts
        configureAIOracle(deployer);
        
        // 7. Set up initial vault parameters
        configureVaults();

        // 8. Deploy Strategy Vaults
        (address sei, address usdc, address usdt, address eth, address btc, address atom, address dai) = deployMockTokens();
        concentratedLiquidityVault = deployConcentratedLiquidityVault(sei, usdc, aiOracle, deployer);
        yieldFarmingVault = deployYieldFarmingVault(atom, sei, aiOracle, deployer);
        arbitrageVault = deployArbitrageVault(eth, usdt, aiOracle, deployer);
        hedgeVault = deployHedgeVault(btc, sei, aiOracle, deployer);
        stableMaxVault = deployStableMaxVault(usdc, dai, aiOracle, deployer);
        seiHypergrowthVault = deploySeiHypergrowthVault(sei, eth, aiOracle, deployer);
        blueChipVault = deployBlueChipVault(eth, btc, aiOracle, deployer);
        deltaNeutralVault = deployDeltaNeutralVault(sei, usdc, aiOracle, deployer);
        
        // === FUND VAULTS TO MATCH FRONTEND MOCKS ===
        // SEI-USDC Concentrated LP: 1,250,000 TVL (625,000 SEI + 625,000 USDC)
        MockERC20(sei).transfer(concentratedLiquidityVault, 625_000e18);
        MockERC20(usdc).transfer(concentratedLiquidityVault, 625_000e18);

        // ATOM-SEI Yield Farm: 850,000 TVL (425,000 ATOM + 425,000 SEI)
        MockERC20(atom).transfer(yieldFarmingVault, 425_000e18);
        MockERC20(sei).transfer(yieldFarmingVault, 425_000e18);

        // ETH-USDT Arbitrage Bot: 2,100,000 TVL (1,050,000 ETH + 1,050,000 USDT)
        MockERC20(eth).transfer(arbitrageVault, 1_050_000e18);
        MockERC20(usdt).transfer(arbitrageVault, 1_050_000e18);

        // BTC-SEI Hedge Strategy: 3,400,000 TVL (1,700,000 BTC + 1,700,000 SEI)
        MockERC20(btc).transfer(hedgeVault, 1_700_000e18);
        MockERC20(sei).transfer(hedgeVault, 1_700_000e18);

        // === FUND TEST USERS FOR FRONTEND TESTING ===
        setupTestUsers(sei, usdc, usdt, eth, btc, atom, dai);

        vm.stopBroadcast();
        
        // Log deployment summary
        logDeploymentSummary();
    }
    
    function deployMockToken() internal returns (address) {
        // Deploy a mock ERC20 token for testing
        MockERC20 token = new MockERC20("SEI Test Token", "SEIT");
        return address(token);
    }
    
    function deployAIOracle(address owner) internal returns (address) {
        AIOracle oracle = new AIOracle(owner);
        return address(oracle);
    }
    
    function deployVaultFactory(address owner, address oracle) internal returns (address) {
        VaultFactory factory = new VaultFactory(owner, oracle);
        return address(factory);
    }
    
    function deploySEIVault(address asset, address owner, address aiModel) internal returns (address) {
        SEIVault vault = new SEIVault(
            asset,
            "SEI Dynamic Liquidity Vault",
            "SEIDLV",
            owner,
            aiModel
        );
        return address(vault);
    }
    
    function deployStrategyVaultThroughFactory(address asset, address owner) internal returns (address) {
        VaultFactory factory = VaultFactory(vaultFactory);
        
        VaultFactory.VaultCreationParams memory params = VaultFactory.VaultCreationParams({
            name: "SEI Strategy Vault",
            symbol: "SEISV",
            token0: asset,
            token1: address(0x0000000000000000000000000000000000000001), // Placeholder token1
            poolFee: 3000,
            aiOracle: aiOracle
        });
        
        address vault = factory.createVault{value: 0.1 ether}(params);
        
        return vault;
    }
    
    function configureAIOracle(address deployer) internal {
        AIOracle oracle = AIOracle(aiOracle);
        
        // Register AI models with string identifiers
        string[] memory modelVersions = new string[](2);
        modelVersions[0] = "liquidity-optimizer-v1.0";
        modelVersions[1] = "risk-manager-v1.0";
        
        address[] memory signers = new address[](2);
        signers[0] = address(0x1234567890123456789012345678901234567890); // Liquidity optimization model signer
        signers[1] = address(0x0987654321098765432109876543210987654321); // Risk management model signer
        
        for (uint i = 0; i < modelVersions.length; i++) {
            oracle.registerAIModel(modelVersions[i], signers[i]);
            console.log("Registered AI model: %s with signer: %s", modelVersions[i], signers[i]);
        }
    }
    
    function configureVaults() internal {
        SEIVault vault = SEIVault(seiVault);
        
        // Enable parallel execution optimization for SEI
        vault.setParallelExecution(true);
        
        // Optimize for SEI's 400ms finality
        vault.optimizeForFinality();
        
        console.log("SEI Vault configured with optimizations");
    }
    
    function deployMockTokens() internal returns (address, address, address, address, address, address, address) {
        // Deploy a mock ERC20 token for testing
        MockERC20 sei = new MockERC20("SEI", "SEI");
        MockERC20 usdc = new MockERC20("USD Coin", "USDC");
        MockERC20 usdt = new MockERC20("Tether", "USDT");
        MockERC20 eth = new MockERC20("Ethereum", "ETH");
        MockERC20 btc = new MockERC20("Bitcoin", "BTC");
        MockERC20 atom = new MockERC20("Cosmos", "ATOM");
        MockERC20 dai = new MockERC20("Dai Stablecoin", "DAI");
        return (address(sei), address(usdc), address(usdt), address(eth), address(btc), address(atom), address(dai));
    }

    function deployConcentratedLiquidityVault(address token0, address token1, address oracle, address owner) internal returns (address) {
        ConcentratedLiquidityVault vault = new ConcentratedLiquidityVault(token0, token1, oracle, owner);
        return address(vault);
    }

    function deployYieldFarmingVault(address token0, address token1, address oracle, address owner) internal returns (address) {
        YieldFarmingVault vault = new YieldFarmingVault(token0, token1, oracle, owner);
        return address(vault);
    }

    function deployArbitrageVault(address token0, address token1, address oracle, address owner) internal returns (address) {
        ArbitrageVault vault = new ArbitrageVault(token0, token1, oracle, owner);
        return address(vault);
    }

    function deployHedgeVault(address token0, address token1, address oracle, address owner) internal returns (address) {
        HedgeVault vault = new HedgeVault(token0, token1, oracle, owner);
        return address(vault);
    }

    function deployStableMaxVault(address token0, address token1, address oracle, address owner) internal returns (address) {
        StableMaxVault vault = new StableMaxVault(token0, token1, oracle, owner);
        return address(vault);
    }

    function deploySeiHypergrowthVault(address token0, address token1, address oracle, address owner) internal returns (address) {
        SeiHypergrowthVault vault = new SeiHypergrowthVault(token0, token1, oracle, owner);
        return address(vault);
    }

    function deployBlueChipVault(address token0, address token1, address oracle, address owner) internal returns (address) {
        BlueChipVault vault = new BlueChipVault(token0, token1, oracle, owner);
        return address(vault);
    }

    function deployDeltaNeutralVault(address token0, address token1, address oracle, address owner) internal returns (address) {
        DeltaNeutralVault vault = new DeltaNeutralVault(token0, token1, oracle, owner);
        return address(vault);
    }

    function setupTestUsers(address sei, address usdc, address usdt, address eth, address btc, address atom, address dai) internal {
        // Test user addresses (deterministic for consistent testing)
        address user1 = address(0x2222222222222222222222222222222222222222); // Primary test user
        address user2 = address(0x3333333333333333333333333333333333333333); // Secondary test user
        address user3 = address(0x4444444444444444444444444444444444444444); // Whale test user
        
        console.log("\n=== FUNDING TEST USERS ===");
        
        // === PRIMARY TEST USER (user1) - Balanced Portfolio ===
        MockERC20(sei).transfer(user1, 10_000 * 1e18);     // 10K SEI
        MockERC20(usdc).transfer(user1, 10_000 * 1e18);    // 10K USDC  
        MockERC20(usdt).transfer(user1, 5_000 * 1e18);     // 5K USDT
        MockERC20(eth).transfer(user1, 100 * 1e18);        // 100 ETH
        MockERC20(btc).transfer(user1, 5 * 1e18);          // 5 BTC
        MockERC20(atom).transfer(user1, 1_000 * 1e18);     // 1K ATOM
        MockERC20(dai).transfer(user1, 5_000 * 1e18);      // 5K DAI
        
        console.log("User1 funded: %s", user1);
        console.log("  - 10K SEI, 10K USDC, 5K USDT, 100 ETH, 5 BTC, 1K ATOM, 5K DAI");
        
        // === SECONDARY TEST USER (user2) - Conservative Portfolio ===
        MockERC20(sei).transfer(user2, 5_000 * 1e18);      // 5K SEI
        MockERC20(usdc).transfer(user2, 5_000 * 1e18);     // 5K USDC
        MockERC20(usdt).transfer(user2, 2_000 * 1e18);     // 2K USDT
        MockERC20(eth).transfer(user2, 25 * 1e18);         // 25 ETH
        MockERC20(btc).transfer(user2, 1 * 1e18);          // 1 BTC
        MockERC20(atom).transfer(user2, 500 * 1e18);       // 500 ATOM
        MockERC20(dai).transfer(user2, 3_000 * 1e18);      // 3K DAI
        
        console.log("User2 funded: %s", user2);
        console.log("  - 5K SEI, 5K USDC, 2K USDT, 25 ETH, 1 BTC, 500 ATOM, 3K DAI");
        
        // === WHALE TEST USER (user3) - Large Portfolio for Testing Edge Cases ===
        MockERC20(sei).transfer(user3, 100_000 * 1e18);    // 100K SEI
        MockERC20(usdc).transfer(user3, 50_000 * 1e18);    // 50K USDC
        MockERC20(usdt).transfer(user3, 25_000 * 1e18);    // 25K USDT
        MockERC20(eth).transfer(user3, 500 * 1e18);        // 500 ETH
        MockERC20(btc).transfer(user3, 20 * 1e18);         // 20 BTC
        MockERC20(atom).transfer(user3, 10_000 * 1e18);    // 10K ATOM
        MockERC20(dai).transfer(user3, 30_000 * 1e18);     // 30K DAI
        
        console.log("User3 (Whale) funded: %s", user3);
        console.log("  - 100K SEI, 50K USDC, 25K USDT, 500 ETH, 20 BTC, 10K ATOM, 30K DAI");
        
        console.log("=== TEST USERS SETUP COMPLETE ===\n");
    }

    function logDeploymentSummary() internal view {
        console.log("\n=== SEI DLP DEPLOYMENT SUMMARY ===");
        console.log("Network: SEI (Chain ID: %s)", block.chainid);
        console.log("Block Number: %s", block.number);
        console.log("Block Timestamp: %s", block.timestamp);
        console.log("\nDeployed Contracts:");
        console.log("- Mock Token: %s", mockToken);
        console.log("- AI Oracle: %s", aiOracle);
        console.log("- Vault Factory: %s", vaultFactory);
        console.log("- SEI Vault: %s", seiVault);
        console.log("- Strategy Vault: %s", strategyVault);
        console.log("\nStrategy Vaults:");
        console.log("- Concentrated Liquidity Vault: %s", concentratedLiquidityVault);
        console.log("- Yield Farming Vault: %s", yieldFarmingVault);
        console.log("- Arbitrage Vault: %s", arbitrageVault);
        console.log("- Hedge Vault: %s", hedgeVault);
        console.log("- Stable Max Vault: %s", stableMaxVault);
        console.log("- SEI Hypergrowth Vault: %s", seiHypergrowthVault);
        console.log("- Blue Chip Vault: %s", blueChipVault);
        console.log("- Delta Neutral Vault: %s", deltaNeutralVault);
        console.log("\nTest Users:");
        console.log("- User1 (Balanced): 0x2222222222222222222222222222222222222222");
        console.log("- User2 (Conservative): 0x3333333333333333333333333333333333333333");
        console.log("- User3 (Whale): 0x4444444444444444444444444444444444444444");
        console.log("\nConfiguration:");
        console.log("- Parallel Execution: Enabled");
        console.log("- Finality Optimization: Enabled");
        console.log("- SEI Chain Validation: Active");
        console.log("- Test Users: 3 accounts funded with tokens");
        console.log("=====================================\n");
    }
}

// Mock ERC20 for testing purposes
contract MockERC20 {
    string public name;
    string public symbol;
    uint8 public constant decimals = 18;
    uint256 public totalSupply;
    
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;
    
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
    
    constructor(string memory _name, string memory _symbol) {
        name = _name;
        symbol = _symbol;
        totalSupply = 10_000_000 * 10**18; // 10M tokens for testing
        balanceOf[msg.sender] = totalSupply;
        emit Transfer(address(0), msg.sender, totalSupply);
    }
    
    function transfer(address to, uint256 amount) external returns (bool) {
        balanceOf[msg.sender] -= amount;
        balanceOf[to] += amount;
        emit Transfer(msg.sender, to, amount);
        return true;
    }
    
    function approve(address spender, uint256 amount) external returns (bool) {
        allowance[msg.sender][spender] = amount;
        emit Approval(msg.sender, spender, amount);
        return true;
    }
    
    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        allowance[from][msg.sender] -= amount;
        balanceOf[from] -= amount;
        balanceOf[to] += amount;
        emit Transfer(from, to, amount);
        return true;
    }
}
