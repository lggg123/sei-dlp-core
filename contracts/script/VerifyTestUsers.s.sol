// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";

interface IERC20 {
    function balanceOf(address account) external view returns (uint256);
    function name() external view returns (string memory);
    function symbol() external view returns (string memory);
    function decimals() external view returns (uint8);
}

contract VerifyTestUsersScript is Script {
    // Test user addresses
    address constant USER1 = address(0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC);
    address constant USER2 = address(0x90F79bf6EB2c4f870365E785982E1f101E93b906);
    address constant USER3 = address(0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65);
    
    function run() external view {
        console.log("=== TEST USER BALANCE VERIFICATION ===");
        console.log("SEI Chain ID:", block.chainid);
        console.log("Block Number:", block.number);
        console.log("");
        
        // You would replace these with actual deployed token addresses
        address[] memory tokens = new address[](7);
        // tokens[0] = 0x...; // SEI token address
        // tokens[1] = 0x...; // USDC token address
        // tokens[2] = 0x...; // USDT token address
        // tokens[3] = 0x...; // ETH token address
        // tokens[4] = 0x...; // BTC token address
        // tokens[5] = 0x...; // ATOM token address
        // tokens[6] = 0x...; // DAI token address
        
        string[] memory tokenNames = new string[](7);
        tokenNames[0] = "SEI";
        tokenNames[1] = "USDC";
        tokenNames[2] = "USDT";
        tokenNames[3] = "ETH";
        tokenNames[4] = "BTC";
        tokenNames[5] = "ATOM";
        tokenNames[6] = "DAI";
        
        // Expected balances for verification
        uint256[][] memory expectedBalances = new uint256[][](3);
        
        // User1 expected balances
        expectedBalances[0] = new uint256[](7);
        expectedBalances[0][0] = 10_000 * 1e18; // SEI
        expectedBalances[0][1] = 10_000 * 1e18; // USDC
        expectedBalances[0][2] = 5_000 * 1e18;  // USDT
        expectedBalances[0][3] = 100 * 1e18;    // ETH
        expectedBalances[0][4] = 5 * 1e18;      // BTC
        expectedBalances[0][5] = 1_000 * 1e18;  // ATOM
        expectedBalances[0][6] = 5_000 * 1e18;  // DAI
        
        // User2 expected balances
        expectedBalances[1] = new uint256[](7);
        expectedBalances[1][0] = 5_000 * 1e18;  // SEI
        expectedBalances[1][1] = 5_000 * 1e18;  // USDC
        expectedBalances[1][2] = 2_000 * 1e18;  // USDT
        expectedBalances[1][3] = 25 * 1e18;     // ETH
        expectedBalances[1][4] = 1 * 1e18;      // BTC
        expectedBalances[1][5] = 500 * 1e18;    // ATOM
        expectedBalances[1][6] = 3_000 * 1e18;  // DAI
        
        // User3 expected balances
        expectedBalances[2] = new uint256[](7);
        expectedBalances[2][0] = 100_000 * 1e18; // SEI
        expectedBalances[2][1] = 50_000 * 1e18;  // USDC
        expectedBalances[2][2] = 25_000 * 1e18;  // USDT
        expectedBalances[2][3] = 500 * 1e18;     // ETH
        expectedBalances[2][4] = 20 * 1e18;      // BTC
        expectedBalances[2][5] = 10_000 * 1e18;  // ATOM
        expectedBalances[2][6] = 30_000 * 1e18;  // DAI
        
        address[] memory users = new address[](3);
        users[0] = USER1;
        users[1] = USER2;
        users[2] = USER3;
        
        string[] memory userLabels = new string[](3);
        userLabels[0] = "User1 (Balanced)";
        userLabels[1] = "User2 (Conservative)";
        userLabels[2] = "User3 (Whale)";
        
        for (uint256 i = 0; i < users.length; i++) {
            console.log("User:", userLabels[i]);
            console.log("Address:", users[i]);
            
            for (uint256 j = 0; j < tokens.length; j++) {
                if (tokens[j] != address(0)) {
                    uint256 balance = IERC20(tokens[j]).balanceOf(users[i]);
                    uint256 expected = expectedBalances[i][j];
                    
                    string memory status = balance == expected ? "[PASS]" : "[FAIL]";
                    console.log("  Token:", tokenNames[j]);
                    console.log("    Balance:", formatTokenAmount(balance));
                    console.log("    Expected:", formatTokenAmount(expected));
                    console.log("    Status:", status);
                } else {
                    console.log("  Token:", tokenNames[j]);
                    console.log("    Status: Not deployed yet");
                }
            }
            console.log("");
        }
        
        console.log("=======================================");
    }
    
    function formatTokenAmount(uint256 amount) internal pure returns (string memory) {
        // Simple formatting - divide by 1e18 and return as string
        uint256 wholePart = amount / 1e18;
        return vm.toString(wholePart);
    }
}
