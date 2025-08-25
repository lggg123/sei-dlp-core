// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";

interface IERC20 {
    function transfer(address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

contract FundTestUserScript is Script {
    // SEI Network Configuration
    uint256 constant SEI_CHAIN_ID = 713715;
    
    function run() external {
        require(block.chainid == SEI_CHAIN_ID, "Must run on SEI network");
        
        // Replace these with actual deployed token addresses from Deploy.s.sol output
        address sei = address(0); // Replace with actual SEI token address
        address usdc = address(0); // Replace with actual USDC token address
        address usdt = address(0); // Replace with actual USDT token address
        address eth = address(0); // Replace with actual ETH token address
        address btc = address(0); // Replace with actual BTC token address
        address atom = address(0); // Replace with actual ATOM token address
        address dai = address(0); // Replace with actual DAI token address
        
        // Custom user address to fund (replace with desired address)
        address customUser = address(0x1111111111111111111111111111111111111111);
        
        // Deployer private key (same as Deploy.s.sol)
        uint256 deployerPrivateKey = 0x123456789abcdef123456789abcdef123456789abcdef123456789abcdef1234;
        
        vm.startBroadcast(deployerPrivateKey);
        
        console.log("Funding custom test user: %s", customUser);
        
        // Standard test user funding amounts
        if (sei != address(0)) {
            IERC20(sei).transfer(customUser, 1_000 * 1e18);
            console.log("Transferred 1,000 SEI");
        }
        
        if (usdc != address(0)) {
            IERC20(usdc).transfer(customUser, 1_000 * 1e18);
            console.log("Transferred 1,000 USDC");
        }
        
        if (usdt != address(0)) {
            IERC20(usdt).transfer(customUser, 500 * 1e18);
            console.log("Transferred 500 USDT");
        }
        
        if (eth != address(0)) {
            IERC20(eth).transfer(customUser, 10 * 1e18);
            console.log("Transferred 10 ETH");
        }
        
        if (btc != address(0)) {
            IERC20(btc).transfer(customUser, 1 * 1e18);
            console.log("Transferred 1 BTC");
        }
        
        if (atom != address(0)) {
            IERC20(atom).transfer(customUser, 100 * 1e18);
            console.log("Transferred 100 ATOM");
        }
        
        if (dai != address(0)) {
            IERC20(dai).transfer(customUser, 500 * 1e18);
            console.log("Transferred 500 DAI");
        }
        
        vm.stopBroadcast();
        
        console.log("Custom user funding complete!");
    }
}
