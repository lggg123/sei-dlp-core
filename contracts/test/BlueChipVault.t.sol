// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Test, console} from "forge-std/Test.sol";
import {BlueChipVault} from "../src/strategies/BlueChipVault.sol";
import {IStrategyVault} from "../src/interfaces/IStrategyVault.sol";

contract BlueChipVaultTest is Test {
    BlueChipVault public blueChipVault;

    function setUp() public {
        address token0 = address(0x1);
        address token1 = address(0x2);
        address aiOracle = address(0x3);
        blueChipVault = new BlueChipVault(token0, token1, aiOracle, address(this));
    }

    function testInitialState() public {
        IStrategyVault.VaultInfo memory vaultInfo = blueChipVault.getVaultInfo();
        assertEq(vaultInfo.name, "Blue Chip Diversified");
        assertEq(vaultInfo.strategy, "Large-cap cryptocurrency exposure");
        assertEq(vaultInfo.token0, address(0x1));
        assertEq(vaultInfo.token1, address(0x2));
        assertEq(vaultInfo.poolFee, 3000);
        assertEq(vaultInfo.totalSupply, 0);
        assertEq(vaultInfo.totalValueLocked, 0);
        assertTrue(vaultInfo.isActive);
    }
}
