// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Test, console} from "forge-std/Test.sol";
import {ConcentratedLiquidityVault} from "../src/strategies/ConcentratedLiquidityVault.sol";
import {IStrategyVault} from "../src/interfaces/IStrategyVault.sol";

contract ConcentratedLiquidityVaultTest is Test {
    ConcentratedLiquidityVault public concentratedLiquidityVault;

    function setUp() public {
        address token0 = address(0x1);
        address token1 = address(0x2);
        address aiOracle = address(0x3);
        concentratedLiquidityVault = new ConcentratedLiquidityVault(token0, token1, aiOracle, address(this));
    }

    function testInitialState() public {
        IStrategyVault.VaultInfo memory vaultInfo = concentratedLiquidityVault.getVaultInfo();
        assertEq(vaultInfo.name, "Concentrated Liquidity");
        assertEq(vaultInfo.strategy, "AI-optimized concentrated liquidity ranges");
        assertEq(vaultInfo.token0, address(0x1));
        assertEq(vaultInfo.token1, address(0x2));
        assertEq(vaultInfo.poolFee, 3000);
        assertEq(vaultInfo.totalSupply, 0);
        assertEq(vaultInfo.totalValueLocked, 0);
        assertTrue(vaultInfo.isActive);
    }
}
