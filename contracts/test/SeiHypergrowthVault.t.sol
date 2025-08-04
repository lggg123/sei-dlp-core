// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Test, console} from "forge-std/Test.sol";
import {SeiHypergrowthVault} from "../src/strategies/SeiHypergrowthVault.sol";
import {IStrategyVault} from "../src/interfaces/IStrategyVault.sol";

contract SeiHypergrowthVaultTest is Test {
    SeiHypergrowthVault public seiHypergrowthVault;

    function setUp() public {
        address token0 = address(0x1);
        address token1 = address(0x2);
        address aiOracle = address(0x3);
        seiHypergrowthVault = new SeiHypergrowthVault(token0, token1, aiOracle, address(this));
    }

    function testInitialState() public {
        IStrategyVault.VaultInfo memory vaultInfo = seiHypergrowthVault.getVaultInfo();
        assertEq(vaultInfo.name, "SEI Hypergrowth");
        assertEq(vaultInfo.strategy, "High-risk, high-reward SEI exposure");
        assertEq(vaultInfo.token0, address(0x1));
        assertEq(vaultInfo.token1, address(0x2));
        assertEq(vaultInfo.poolFee, 3000);
        assertEq(vaultInfo.totalSupply, 0);
        assertEq(vaultInfo.totalValueLocked, 0);
        assertTrue(vaultInfo.isActive);
    }
}
