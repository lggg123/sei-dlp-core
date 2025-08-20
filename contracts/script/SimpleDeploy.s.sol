// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/SEIVault.sol";
import "../src/VaultFactory.sol";
import "../src/AIOracle.sol";
import "../src/StrategyVault.sol";

contract SimpleDeployScript is Script {
    // SEI Network Configuration (devnet chain ID 713715)
    uint256 constant SEI_CHAIN_ID = 713715;
    
    // Deployment addresses (will be set during deployment)
    address public mockToken;
    address payable public seiVault;
    address public vaultFactory;
    address public aiOracle;
    address public strategyVault;
    
    function run() external {
        // Verify we're deploying to SEI network
        require(block.chainid == SEI_CHAIN_ID, "Must deploy to SEI network");
        
        // Use a deterministic deployer address for simulation
        address deployer = address(0x7E5F4552091A69125d5DfCb7b8C2659029395Bdf);
        vm.startBroadcast(deployer);
        
        console.log("Deploying to SEI Devnet (Chain ID: %s)", block.chainid);
        console.log("Deployer address: %s", deployer);
        
        // 1. Deploy Mock Token for testing on devnet
        mockToken = deployMockToken();
        console.log("Mock Token deployed at: %s", mockToken);
        
        // 2. Deploy AI Oracle
        aiOracle = deployAIOracle(deployer);
        console.log("AI Oracle deployed at: %s", aiOracle);
        
        // 3. Deploy Vault Factory
        vaultFactory = deployVaultFactory(deployer, aiOracle);
        console.log("Vault Factory deployed at: %s", vaultFactory);
        
        // 4. Deploy SEI Vault
        seiVault = payable(deploySEIVault(mockToken, deployer, deployer));
        console.log("SEI Vault deployed at: %s", seiVault);
        
        // 5. Configure AI Oracle with deployed contracts
        configureAIOracle();
        
        // 6. Set up initial vault parameters
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
        VaultFactory factory = new VaultFactory(oracle, owner);
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
    
    function configureAIOracle() internal {
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