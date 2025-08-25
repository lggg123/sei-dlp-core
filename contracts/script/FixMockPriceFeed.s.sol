// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/testing/MockPriceFeed.sol";

/**
 * @title FixMockPriceFeed
 * @dev Deploys a proper SEI mock token and a new MockPriceFeed contract
 */
contract FixMockPriceFeedScript is Script {
    // SEI Network Configuration
    uint256 constant SEI_CHAIN_ID = 713715;
    
    // Deployment addresses
    address public seiMockToken;
    address public mockPriceFeed;
    
    function run() external {
        // Verify we're deploying to SEI devnet
        require(block.chainid == SEI_CHAIN_ID, "Must deploy to SEI devnet");
        
        // Use the account that deployed the MockPriceFeed (from broadcast logs)
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        
        console.log("Deploying SEI MockToken and MockPriceFeed on SEI Devnet (Chain ID: %s)", block.chainid);
        console.log("Deployer address: %s", deployer);
        console.log("Deployer balance: %s", deployer.balance);
        
        vm.startBroadcast(deployerPrivateKey);
        
        // 1. Deploy proper SEI mock token
        seiMockToken = deploySEIMockToken();
        console.log("SEI Mock Token deployed at: %s", seiMockToken);
        
        // 2. Deploy MockPriceFeed contract
        mockPriceFeed = deployMockPriceFeed(deployer);
        console.log("MockPriceFeed deployed at: %s", mockPriceFeed);
        
        // 3. Initialize MockPriceFeed with SEI token
        initializeMockPriceFeed();
        
        // 4. Verify everything works correctly
        verifyDeployment();
        
        vm.stopBroadcast();
        
        // Log summary
        logDeploymentSummary();
    }
    
    function deploySEIMockToken() internal returns (address) {
        // Deploy SEI mock token with 1B supply
        MockERC20 seiToken = new MockERC20("SEI", "SEI", 1_000_000_000 * 1e18);
        return address(seiToken);
    }
    
    function deployMockPriceFeed(address owner) internal returns (address) {
        MockPriceFeed priceFeed = new MockPriceFeed(owner);
        return address(priceFeed);
    }
    
    function initializeMockPriceFeed() internal {
        MockPriceFeed priceFeed = MockPriceFeed(mockPriceFeed);
        
        // Set SEI token price to $0.50 (0.5 * 1e18) with 1M volume
        uint256 seiPrice = 0.5 * 1e18; // $0.50
        uint256 seiVolume = 1_000_000 * 1e18; // 1M SEI volume
        
        priceFeed.setTokenPrice(
            seiMockToken,
            "SEI",
            seiPrice,
            seiVolume
        );
        
        console.log("MockPriceFeed initialized with:");
        console.log("  - SEI Token: %s", seiMockToken);
        console.log("  - SEI Price: $0.50 (500000000000000000 wei)");
        console.log("  - SEI Volume: 1M tokens");
    }
    
    function verifyDeployment() internal view {
        MockPriceFeed priceFeed = MockPriceFeed(mockPriceFeed);
        
        // Test price query
        uint256 retrievedPrice = priceFeed.getPrice(seiMockToken);
        console.log("Retrieved SEI price: %s wei", retrievedPrice);
        
        // Get detailed price data
        MockPriceFeed.PriceData memory priceData = priceFeed.getPriceData(seiMockToken);
        console.log("Price data verification:");
        console.log("  - Price: %s", priceData.price);
        console.log("  - Volume24h: %s", priceData.volume24h);
        console.log("  - Timestamp: %s", priceData.timestamp);
        console.log("  - Change24h: %s", priceData.change24h);
        console.log("  - Volatility: %s", priceData.volatility);
        
        require(retrievedPrice == 0.5 * 1e18, "Price verification failed");
        require(priceData.volume24h == 1_000_000 * 1e18, "Volume verification failed");
        
        console.log("Price feed verification successful!");
    }
    
    function logDeploymentSummary() internal view {
        console.log("\n=== SEI MOCK DEPLOYMENT SUMMARY ===");
        console.log("Network: SEI Devnet (Chain ID: %s)", block.chainid);
        console.log("Block Number: %s", block.number);
        console.log("Block Timestamp: %s", block.timestamp);
        console.log("\nDeployed Contracts:");
        console.log("- SEI Mock Token: %s", seiMockToken);
        console.log("- MockPriceFeed: %s", mockPriceFeed);
        console.log("\nConfiguration:");
        console.log("- SEI Token Name: SEI");
        console.log("- SEI Token Symbol: SEI");
        console.log("- SEI Total Supply: 1,000,000,000 SEI");
        console.log("- SEI Initial Price: $0.50");
        console.log("- SEI 24h Volume: 1,000,000 SEI");
        console.log("- Volatility: 10%% (default)");
        console.log("\nStatus: MockPriceFeed successfully deployed and initialized!");
        console.log("=====================================\n");
    }
}

/**
 * @title MockERC20
 * @dev Simple ERC20 implementation for testing with configurable supply
 */
contract MockERC20 {
    string public name;
    string public symbol;
    uint8 public constant decimals = 18;
    uint256 public totalSupply;
    
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;
    
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
    
    constructor(string memory _name, string memory _symbol, uint256 _totalSupply) {
        name = _name;
        symbol = _symbol;
        totalSupply = _totalSupply;
        balanceOf[msg.sender] = _totalSupply;
        emit Transfer(address(0), msg.sender, _totalSupply);
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