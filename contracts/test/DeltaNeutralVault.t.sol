// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Test, console} from "forge-std/Test.sol";
import {DeltaNeutralVault} from "../src/strategies/DeltaNeutralVault.sol";
import {IStrategyVault} from "../src/interfaces/IStrategyVault.sol";

contract DeltaNeutralVaultTest is Test {
    DeltaNeutralVault public deltaNeutralVault;

    function setUp() public {
        address token0 = address(0x1);
        address token1 = address(0x2);
        address aiOracle = address(0x3);
        deltaNeutralVault = new DeltaNeutralVault(token0, token1, aiOracle, address(this));
    }

    function testInitialState() public {
        IStrategyVault.VaultInfo memory vaultInfo = deltaNeutralVault.getVaultInfo();
        assertEq(vaultInfo.name, "Delta Neutral LP");
        assertEq(vaultInfo.strategy, "Market-neutral liquidity provision");
        assertEq(vaultInfo.token0, address(0x1));
        assertEq(vaultInfo.token1, address(0x2));
        assertEq(vaultInfo.poolFee, 3000);
        assertEq(vaultInfo.totalSupply, 0);
        assertEq(vaultInfo.totalValueLocked, 0);
        assertTrue(vaultInfo.isActive);
    }
}
