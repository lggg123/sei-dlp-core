// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Test, console} from "forge-std/Test.sol";
import {SeiHypergrowthVault} from "../src/strategies/SeiHypergrowthVault.sol";

contract SeiHypergrowthVaultTest is Test {
    SeiHypergrowthVault public seiHypergrowthVault;

    function setUp() public {
        address token0 = address(0x1);
        address token1 = address(0x2);
        address aiOracle = address(0x3);
        seiHypergrowthVault = new SeiHypergrowthVault(token0, token1, aiOracle, address(this));
    }

    function test() public {
    }
}
