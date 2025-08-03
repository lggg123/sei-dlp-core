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
    uint256 public constant DEVNET_CHAIN_ID = 13289;
    string public constant DEVNET_RPC_URL = "https://evm-rpc-devnet.sei-apis.com";
    
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
    address public constant MOCK_POSITION_MANAGER = 0xC36442b4b4e7ec3ce2e6e1b9b5b5f6F8C3C86e1f;
    address public constant MOCK_ROUTER = 0xE592427A0AEce92De3Edee1F18E0157C05861564;
    address public constant MOCK_DRIFT_PROTOCOL = 0x8888888888888888888888888888888888888888;
    
    // Test accounts
    address public owner = address(0x1111111111111111111111111111111111111111);
    address public user1 = address(0x2222222222222222222222222222222222222222);
    address public user2 = address(0x3333333333333333333333333333333333333333);
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
        vaultFactory = new VaultFactory(address(aiOracle));
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
        concentratedLiquidityVault = StrategyVault(vaultFactory.createVault(
            address(seiToken),
            address(usdcToken),
            3000, // 0.3% fee
            60,   // tick spacing
            "SEI-USDC Concentrated LP",
            "concentrated_liquidity"
        ));
        
        // Strategy 2: Yield Farming (ATOM-SEI)
        yieldFarmingVault = StrategyVault(vaultFactory.createVault(
            address(atomToken),
            address(seiToken),
            3000,
            60,
            "ATOM-SEI Yield Farm",
            "yield_farming"
        ));
        
        // Strategy 3: Arbitrage (ETH-USDT)
        arbitrageVault = StrategyVault(vaultFactory.createVault(
            address(ethToken),
            address(usdtToken),
            5000, // 0.5% fee
            10,
            "ETH-USDT Arbitrage Bot",
            "arbitrage"
        ));
        
        // Strategy 4: Hedge (BTC-SEI)
        hedgeVault = StrategyVault(vaultFactory.createVault(
            address(btcToken),
            address(seiToken),
            10000, // 1% fee
            200,
            "BTC-SEI Hedge Strategy",
            "hedge"
        ));
        
        // Strategy 5: Stable Max (USDC-DAI)
        stableMaxVault = StrategyVault(vaultFactory.createVault(
            address(usdcToken),
            address(daiToken),
            500, // 0.05% fee
            1,
            "Stable Max Yield Vault",
            "stable_max"
        ));
        
        // Strategy 6: SEI Hypergrowth (SEI-ETH)
        seiHypergrowthVault = StrategyVault(vaultFactory.createVault(
            address(seiToken),
            address(ethToken),
            10000, // 1% fee
            200,
            "SEI Hypergrowth Vault",
            "sei_hypergrowth"
        ));
        
        // Strategy 7: Blue Chip (ETH-BTC simulated)
        blueChipVault = StrategyVault(vaultFactory.createVault(
            address(ethToken),
            address(btcToken),
            3000,
            60,
            "Blue Chip Diversified",
            "blue_chip"
        ));
        
        // Strategy 8: Delta Neutral LP (SEI-USDC with perpetual hedge)
        deltaNeutralVault = StrategyVault(vaultFactory.createVault(
            address(seiToken),
            address(usdcToken),
            3000,
            60,
            "Delta Neutral LP Vault",
            "delta_neutral"
        ));
        
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
        // Set up realistic price feeds for AI Oracle
        // Prices in USD with 8 decimal precision
        
        aiOracle.updatePrice(address(seiToken), 85000000); // $0.85
        aiOracle.updatePrice(address(usdcToken), 100000000); // $1.00
        aiOracle.updatePrice(address(usdtToken), 100000000); // $1.00
        aiOracle.updatePrice(address(ethToken), 385000000000); // $3,850.00
        aiOracle.updatePrice(address(btcToken), 9500000000000); // $95,000.00
        aiOracle.updatePrice(address(atomToken), 1250000000); // $12.50
        aiOracle.updatePrice(address(daiToken), 100000000); // $1.00
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
        if (vault == address(0xa123456789012345678901234567890123456789)) return 3200000; // Delta Neutral
        
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