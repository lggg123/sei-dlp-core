// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/SEIVault.sol";
import "../src/VaultFactory.sol";
import "../src/AIOracle.sol";
import "../src/StrategyVault.sol";

contract DeployScript is Script {
    // SEI Network Configuration
    uint256 constant SEI_CHAIN_ID = 713715;
    
    // Deployment addresses (will be set during deployment)
    address public mockToken;
    address public seiVault;
    address public vaultFactory;
    address public aiOracle;
    address public strategyVault;
    
    function run() external {
        // Verify we're deploying to SEI network
        require(block.chainid == SEI_CHAIN_ID, "Must deploy to SEI network");
        
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        
        console.log("Deploying to SEI Network (Chain ID: %s)", block.chainid);
        console.log("Deployer address: %s", deployer);
        console.log("Deployer balance: %s", deployer.balance);
        
        vm.startBroadcast(deployerPrivateKey);
        
        // 1. Deploy Mock Token for testing (only on testnet)
        if (block.chainid == 713715) { // SEI testnet/mainnet
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
        console.log("\nConfiguration:");
        console.log("- Parallel Execution: Enabled");
        console.log("- Finality Optimization: Enabled");
        console.log("- SEI Chain Validation: Active");
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
        totalSupply = 1000000 * 10**18; // 1M tokens
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
