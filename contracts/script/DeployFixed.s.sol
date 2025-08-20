// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/SEIVault.sol";
import "../src/VaultFactory.sol";
import "../src/AIOracle.sol";

contract DeployFixedScript is Script {
    // SEI Testnet Configuration (Atlantic-2)
    uint256 constant SEI_CHAIN_ID = 1328;
    
    // Deployment addresses
    address public aiOracle;
    address public vaultFactory;
    address public nativeSEIVault;  // Native SEI vault (token0 = address(0))
    address public erc20Vault;      // ERC20 token vault
    address public mockUSDC;        // Mock USDC for testing
    
    function run() external {
        // Verify we're deploying to SEI testnet
        require(block.chainid == SEI_CHAIN_ID, "Must deploy to SEI Atlantic-2 testnet");
        
        // Use environment variable for private key (add 0x prefix for vm.parseUint)
        string memory privateKeyStr = vm.envString("PRIVATE_KEY");
        uint256 deployerPrivateKey = vm.parseUint(string(abi.encodePacked("0x", privateKeyStr)));
        address deployer = vm.addr(deployerPrivateKey);
        
        console.log("Deploying to SEI Atlantic-2 Testnet (Chain ID: %s)", block.chainid);
        console.log("Deployer address: %s", deployer);
        console.log("Deployer balance: %s wei", deployer.balance);
        
        vm.startBroadcast(deployerPrivateKey);
        
        // 1. Deploy AI Oracle
        aiOracle = deployAIOracle(deployer);
        console.log("AI Oracle deployed at: %s", aiOracle);
        
        // 2. Deploy Vault Factory
        vaultFactory = deployVaultFactory(deployer, aiOracle);
        console.log("Vault Factory deployed at: %s", vaultFactory);
        
        // 3. Deploy Mock USDC for ERC20 vault testing
        mockUSDC = deployMockUSDC();
        console.log("Mock USDC deployed at: %s", mockUSDC);
        
        // 4. Deploy Native SEI Vault (address(0) for native SEI)
        nativeSEIVault = deployNativeSEIVault(deployer, aiOracle);
        console.log("Native SEI Vault deployed at: %s", nativeSEIVault);
        
        // 5. Deploy ERC20 USDC Vault
        erc20Vault = deployERC20Vault(mockUSDC, deployer, aiOracle);
        console.log("ERC20 USDC Vault deployed at: %s", erc20Vault);
        
        // 6. Fund test users
        fundTestUsers();
        
        vm.stopBroadcast();
        
        // Log deployment summary
        logDeploymentSummary();
    }
    
    function deployAIOracle(address owner) internal returns (address) {
        AIOracle oracle = new AIOracle(owner);
        return address(oracle);
    }
    
    function deployVaultFactory(address owner, address oracle) internal returns (address) {
        VaultFactory factory = new VaultFactory(oracle, owner);
        return address(factory);
    }
    
    function deployMockUSDC() internal returns (address) {
        MockERC20 usdc = new MockERC20("USD Coin", "USDC", 6); // 6 decimals like real USDC
        return address(usdc);
    }
    
    function deployNativeSEIVault(address owner, address aiModel) internal returns (address) {
        // For native SEI vault, token0 should be address(0)
        SEIVault vault = new SEIVault(
            address(0),  // address(0) indicates native SEI
            "Native SEI Vault",
            "NSIV",
            owner,
            aiModel
        );
        return address(vault);
    }
    
    function deployERC20Vault(address token, address owner, address aiModel) internal returns (address) {
        SEIVault vault = new SEIVault(
            token,
            "USDC Vault",
            "USDCV",
            owner,
            aiModel
        );
        return address(vault);
    }
    
    function fundTestUsers() internal {
        // Test user addresses for consistent testing
        address user1 = address(0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC);
        address user2 = address(0x90F79bf6EB2c4f870365E785982E1f101E93b906);
        
        console.log("\n=== FUNDING TEST USERS ===");
        
        // Fund with native SEI (directly to addresses)
        payable(user1).transfer(100 ether); // 100 SEI to user1
        payable(user2).transfer(50 ether);  // 50 SEI to user2
        
        // Fund with Mock USDC
        MockERC20(mockUSDC).transfer(user1, 10_000 * 10**6); // 10K USDC (6 decimals)
        MockERC20(mockUSDC).transfer(user2, 5_000 * 10**6);  // 5K USDC
        
        console.log("User1 funded: %s", user1);
        console.log("  - 100 SEI, 10K USDC");
        console.log("User2 funded: %s", user2);
        console.log("  - 50 SEI, 5K USDC");
        console.log("=== TEST USERS SETUP COMPLETE ===\n");
    }
    
    function logDeploymentSummary() internal view {
        console.log("\n=== SEI DLP FIXED DEPLOYMENT SUMMARY ===");
        console.log("Network: SEI Atlantic-2 (Chain ID: %s)", block.chainid);
        console.log("Block Number: %s", block.number);
        console.log("Block Timestamp: %s", block.timestamp);
        console.log("\nDeployed Contracts:");
        console.log("- AI Oracle: %s", aiOracle);
        console.log("- Vault Factory: %s", vaultFactory);
        console.log("- Mock USDC: %s", mockUSDC);
        console.log("- Native SEI Vault: %s", nativeSEIVault);
        console.log("- ERC20 USDC Vault: %s", erc20Vault);
        console.log("\nVault Configuration:");
        console.log("- Native SEI Vault: Accepts native SEI deposits (payable)");
        console.log("- ERC20 USDC Vault: Requires USDC token approval + transferFrom");
        console.log("\nTest Users:");
        console.log("- User1: 0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC (100 SEI, 10K USDC)");
        console.log("- User2: 0x90F79bf6EB2c4f870365E785982E1f101E93b906 (50 SEI, 5K USDC)");
        console.log("============================================\n");
    }
}

// Enhanced Mock ERC20 with configurable decimals
contract MockERC20 {
    string public name;
    string public symbol;
    uint8 public decimals;
    uint256 public totalSupply;
    
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;
    
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
    
    constructor(string memory _name, string memory _symbol, uint8 _decimals) {
        name = _name;
        symbol = _symbol;
        decimals = _decimals;
        totalSupply = 10_000_000 * 10**_decimals; // 10M tokens
        balanceOf[msg.sender] = totalSupply;
        emit Transfer(address(0), msg.sender, totalSupply);
    }
    
    function transfer(address to, uint256 amount) external returns (bool) {
        require(balanceOf[msg.sender] >= amount, "Insufficient balance");
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
        require(allowance[from][msg.sender] >= amount, "Insufficient allowance");
        require(balanceOf[from] >= amount, "Insufficient balance");
        
        allowance[from][msg.sender] -= amount;
        balanceOf[from] -= amount;
        balanceOf[to] += amount;
        emit Transfer(from, to, amount);
        return true;
    }
}