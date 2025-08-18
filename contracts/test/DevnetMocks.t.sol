// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../lib/openzeppelin-contracts/contracts/token/ERC20/ERC20.sol";
import "../src/StrategyVault.sol";
import "../src/VaultFactory.sol";
import "../src/AIOracle.sol";

/**
 * @title DevnetMocks
 * @dev Mock contract setup for SEI Devnet (Chain ID 13289) testing
 * Provides realistic mock data for all 8 DLP strategies
 */
contract DevnetMocks is Test {
    
    // Chain configuration
    uint256 public constant DEVNET_CHAIN_ID = 713715;
    string public constant DEVNET_RPC_URL = "https://evm-rpc-arctic-1.sei-apis.com";
    
    // Core contracts
    VaultFactory public vaultFactory;
    AIOracle public aiOracle;
    
    // Mock tokens
    MockToken public seiToken;
    MockToken public usdcToken;
    MockToken public usdtToken;
    MockToken public ethToken;
    MockToken public btcToken;
    MockToken public atomToken;
    MockToken public daiToken;
    
    // Strategy vaults (8 total as per vault API)
    StrategyVault public concentratedLiquidityVault;
    StrategyVault public yieldFarmingVault;
    StrategyVault public arbitrageVault;
    StrategyVault public hedgeVault;
    StrategyVault public stableMaxVault;
    StrategyVault public seiHypergrowthVault;
    StrategyVault public blueChipVault;
    StrategyVault public deltaNeutralVault;
    
    // Mock addresses (matching devnet-contracts.ts)
    address public constant MOCK_AMM_FACTORY = 0x1F98431c8aD98523631AE4a59f267346ea31F984;
    address public constant MOCK_POSITION_MANAGER = 0xc36442B4B4E7ec3CE2e6e1b9b5B5F6f8c3c86e1f;
    address public constant MOCK_ROUTER = 0xE592427A0AEce92De3Edee1F18E0157C05861564;
    address public constant MOCK_DRIFT_PROTOCOL = 0x8888888888888888888888888888888888888888;
    
    // Test accounts
    address public owner = address(0x1111111111111111111111111111111111111111);
    address public user1 = address(0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC);
    address public user2 = address(0x90F79bf6EB2c4f870365E785982E1f101E93b906);
    address public aiSigner = address(0x7777777777777777777777777777777777777777);
    
    event DevnetMockSetup(string indexed setup, address indexed contractAddress);
    
    function setUp() public {
        // Set up mock environment for Devnet
        vm.createSelectFork(DEVNET_RPC_URL, DEVNET_CHAIN_ID);
        
        // Deploy AI Oracle with mock signer
        vm.startPrank(owner);
        aiOracle = new AIOracle(aiSigner);
        emit DevnetMockSetup("AIOracle", address(aiOracle));
        
        // Deploy Vault Factory
        vaultFactory = new VaultFactory(address(aiOracle), owner);
        emit DevnetMockSetup("VaultFactory", address(vaultFactory));
        
        // Deploy mock tokens with realistic supplies
        _deployMockTokens();
        
        // Deploy strategy vaults
        _deployStrategyVaults();
        
        // Set up mock market data
        _setupMockMarketData();
        
        vm.stopPrank();
    }
    
    function _deployMockTokens() internal {
        seiToken = new MockToken("SEI", "SEI", 1_000_000_000 * 10**18); // 1B SEI
        usdcToken = new MockToken("USD Coin", "USDC", 1_000_000_000 * 10**6); // 1B USDC (6 decimals)
        usdtToken = new MockToken("Tether", "USDT", 1_000_000_000 * 10**6); // 1B USDT (6 decimals)
        ethToken = new MockToken("Ethereum", "ETH", 120_000_000 * 10**18); // 120M ETH
        btcToken = new MockToken("Bitcoin", "BTC", 21_000_000 * 10**8); // 21M BTC (8 decimals)
        atomToken = new MockToken("Cosmos", "ATOM", 400_000_000 * 10**6); // 400M ATOM (6 decimals)
        daiToken = new MockToken("Dai Stablecoin", "DAI", 5_000_000_000 * 10**18); // 5B DAI
        
        emit DevnetMockSetup("SEI Token", address(seiToken));
        emit DevnetMockSetup("USDC Token", address(usdcToken));
        emit DevnetMockSetup("USDT Token", address(usdtToken));
        emit DevnetMockSetup("ETH Token", address(ethToken));
        emit DevnetMockSetup("BTC Token", address(btcToken));
        emit DevnetMockSetup("ATOM Token", address(atomToken));
        emit DevnetMockSetup("DAI Token", address(daiToken));
    }
    
    function _deployStrategyVaults() internal {
        // Strategy 1: Concentrated Liquidity (SEI-USDC)
        VaultFactory.VaultCreationParams memory params1 = VaultFactory.VaultCreationParams({
            name: "SEI-USDC Concentrated LP",
            symbol: "SEIDLP",
            token0: address(seiToken),
            token1: address(usdcToken),
            poolFee: 3000,
            aiOracle: address(aiOracle)
        });
        concentratedLiquidityVault = StrategyVault(vaultFactory.createVault{value: 0.1 ether}(params1));
        
        // Strategy 2: Yield Farming (ATOM-SEI)
        VaultFactory.VaultCreationParams memory params2 = VaultFactory.VaultCreationParams({
            name: "ATOM-SEI Yield Farm",
            symbol: "ASMYLP",
            token0: address(atomToken),
            token1: address(seiToken),
            poolFee: 3000,
            aiOracle: address(aiOracle)
        });
        yieldFarmingVault = StrategyVault(vaultFactory.createVault{value: 0.1 ether}(params2));
        
        // Strategy 3: Arbitrage (ETH-USDT)
        VaultFactory.VaultCreationParams memory params3 = VaultFactory.VaultCreationParams({
            name: "ETH-USDT Arbitrage Bot",
            symbol: "ETHLP",
            token0: address(ethToken),
            token1: address(usdtToken),
            poolFee: 5000,
            aiOracle: address(aiOracle)
        });
        arbitrageVault = StrategyVault(vaultFactory.createVault{value: 0.1 ether}(params3));
        
        // Strategy 4: Hedge (BTC-SEI)
        VaultFactory.VaultCreationParams memory params4 = VaultFactory.VaultCreationParams({
            name: "BTC-SEI Hedge Strategy",
            symbol: "BTCLP",
            token0: address(btcToken),
            token1: address(seiToken),
            poolFee: 10000,
            aiOracle: address(aiOracle)
        });
        hedgeVault = StrategyVault(vaultFactory.createVault{value: 0.1 ether}(params4));
        
        // Strategy 5: Stable Max (USDC-DAI)
        VaultFactory.VaultCreationParams memory params5 = VaultFactory.VaultCreationParams({
            name: "Stable Max Yield Vault",
            symbol: "STBLP",
            token0: address(usdcToken),
            token1: address(daiToken),
            poolFee: 500,
            aiOracle: address(aiOracle)
        });
        stableMaxVault = StrategyVault(vaultFactory.createVault{value: 0.1 ether}(params5));
        
        // Strategy 6: SEI Hypergrowth (SEI-ETH)
        VaultFactory.VaultCreationParams memory params6 = VaultFactory.VaultCreationParams({
            name: "SEI Hypergrowth Vault",
            symbol: "HGLP",
            token0: address(seiToken),
            token1: address(ethToken),
            poolFee: 10000,
            aiOracle: address(aiOracle)
        });
        seiHypergrowthVault = StrategyVault(vaultFactory.createVault{value: 0.1 ether}(params6));
        
        // Strategy 7: Blue Chip (ETH-BTC simulated)
        VaultFactory.VaultCreationParams memory params7 = VaultFactory.VaultCreationParams({
            name: "Blue Chip Diversified",
            symbol: "BCLP",
            token0: address(ethToken),
            token1: address(btcToken),
            poolFee: 3000,
            aiOracle: address(aiOracle)
        });
        blueChipVault = StrategyVault(vaultFactory.createVault{value: 0.1 ether}(params7));
        
        // Strategy 8: Delta Neutral LP (SEI-USDC with perpetual hedge)
        VaultFactory.VaultCreationParams memory params8 = VaultFactory.VaultCreationParams({
            name: "Delta Neutral LP Vault",
            symbol: "DNLP",
            token0: address(seiToken),
            token1: address(usdcToken),
            poolFee: 3000,
            aiOracle: address(aiOracle)
        });
        deltaNeutralVault = StrategyVault(vaultFactory.createVault{value: 0.1 ether}(params8));
        
        emit DevnetMockSetup("Concentrated Liquidity Vault", address(concentratedLiquidityVault));
        emit DevnetMockSetup("Yield Farming Vault", address(yieldFarmingVault));
        emit DevnetMockSetup("Arbitrage Vault", address(arbitrageVault));
        emit DevnetMockSetup("Hedge Vault", address(hedgeVault));
        emit DevnetMockSetup("Stable Max Vault", address(stableMaxVault));
        emit DevnetMockSetup("SEI Hypergrowth Vault", address(seiHypergrowthVault));
        emit DevnetMockSetup("Blue Chip Vault", address(blueChipVault));
        emit DevnetMockSetup("Delta Neutral Vault", address(deltaNeutralVault));
    }
    
    function _setupMockMarketData() internal {
        // Register AI models for mock testing
        aiOracle.registerAIModel("liquidity-optimizer-v1.0", aiSigner);
        aiOracle.registerAIModel("risk-manager-v1.0", aiSigner);
    }
    
    // Helper functions for testing
    function getMockVaultByStrategy(string memory strategy) public view returns (address) {
        bytes32 strategyHash = keccak256(abi.encodePacked(strategy));
        
        if (strategyHash == keccak256(abi.encodePacked("concentrated_liquidity"))) {
            return address(concentratedLiquidityVault);
        } else if (strategyHash == keccak256(abi.encodePacked("yield_farming"))) {
            return address(yieldFarmingVault);
        } else if (strategyHash == keccak256(abi.encodePacked("arbitrage"))) {
            return address(arbitrageVault);
        } else if (strategyHash == keccak256(abi.encodePacked("hedge"))) {
            return address(hedgeVault);
        } else if (strategyHash == keccak256(abi.encodePacked("stable_max"))) {
            return address(stableMaxVault);
        } else if (strategyHash == keccak256(abi.encodePacked("sei_hypergrowth"))) {
            return address(seiHypergrowthVault);
        } else if (strategyHash == keccak256(abi.encodePacked("blue_chip"))) {
            return address(blueChipVault);
        } else if (strategyHash == keccak256(abi.encodePacked("delta_neutral"))) {
            return address(deltaNeutralVault);
        }
        
        revert("Strategy not found");
    }
    
    function getMockTokenBySymbol(string memory symbol) public view returns (address) {
        bytes32 symbolHash = keccak256(abi.encodePacked(symbol));
        
        if (symbolHash == keccak256(abi.encodePacked("SEI"))) {
            return address(seiToken);
        } else if (symbolHash == keccak256(abi.encodePacked("USDC"))) {
            return address(usdcToken);
        } else if (symbolHash == keccak256(abi.encodePacked("USDT"))) {
            return address(usdtToken);
        } else if (symbolHash == keccak256(abi.encodePacked("ETH"))) {
            return address(ethToken);
        } else if (symbolHash == keccak256(abi.encodePacked("BTC"))) {
            return address(btcToken);
        } else if (symbolHash == keccak256(abi.encodePacked("ATOM"))) {
            return address(atomToken);
        } else if (symbolHash == keccak256(abi.encodePacked("DAI"))) {
            return address(daiToken);
        }
        
        revert("Token not found");
    }
    
    // Simulate realistic TVL and performance data
    function getVaultTVL(address vault) public pure returns (uint256) {
        // Mock TVL data matching API expectations
        if (vault == address(0x1234567890123456789012345678901234567890)) return 1250000; // Concentrated
        if (vault == address(0x2345678901234567890123456789012345678901)) return 850000;  // Yield
        if (vault == address(0x3456789012345678901234567890123456789012)) return 2100000; // Arbitrage
        if (vault == address(0x4567890123456789012345678901234567890123)) return 3400000; // Hedge
        if (vault == address(0x7890123456789012345678901234567890123456)) return 8500000; // Stable
        if (vault == address(0x8901234567890123456789012345678901234567)) return 1800000; // Hypergrowth
        if (vault == address(0x9012345678901234567890123456789012345678)) return 5200000; // Blue Chip
        if (vault == address(0xA123456789012345678901234567890123456789)) return 3200000; // Delta Neutral
        
        return 1000000; // Default
    }
}

/**
 * @dev Enhanced ERC20 token for testing with realistic decimals
 */
contract MockToken is ERC20 {
    uint8 private _decimals;
    
    constructor(
        string memory name,
        string memory symbol,
        uint256 totalSupply
    ) ERC20(name, symbol) {
        // Set realistic decimals based on token type
        if (keccak256(abi.encodePacked(symbol)) == keccak256(abi.encodePacked("USDC")) ||
            keccak256(abi.encodePacked(symbol)) == keccak256(abi.encodePacked("USDT")) ||
            keccak256(abi.encodePacked(symbol)) == keccak256(abi.encodePacked("ATOM"))) {
            _decimals = 6;
        } else if (keccak256(abi.encodePacked(symbol)) == keccak256(abi.encodePacked("BTC"))) {
            _decimals = 8;
        } else {
            _decimals = 18; // Default for SEI, ETH, DAI
        }
        
        _mint(msg.sender, totalSupply);
    }
    
    function decimals() public view virtual override returns (uint8) {
        return _decimals;
    }
    
    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
    
    function burn(uint256 amount) external {
        _burn(msg.sender, amount);
    }
}