// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Test, console} from "forge-std/Test.sol";
import {HedgeVault} from "../src/strategies/HedgeVault.sol";

contract HedgeVaultTest is Test {
    HedgeVault public hedgeVault;

    function setUp() public {
        address token0 = address(0x1);
        address token1 = address(0x2);
        address aiOracle = address(0x3);
        hedgeVault = new HedgeVault(token0, token1, aiOracle, address(this));
    }

    function test() public {
    }
}
