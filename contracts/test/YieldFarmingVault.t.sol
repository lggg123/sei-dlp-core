// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Test, console} from "forge-std/Test.sol";
import {YieldFarmingVault} from "../src/strategies/YieldFarmingVault.sol";
import {IStrategyVault} from "../src/interfaces/IStrategyVault.sol";

contract YieldFarmingVaultTest is Test {
    YieldFarmingVault public yieldFarmingVault;

    function setUp() public {
        address token0 = address(0x1);
        address token1 = address(0x2);
        address aiOracle = address(0x3);
        yieldFarmingVault = new YieldFarmingVault(token0, token1, aiOracle, address(this));
    }

    function testInitialState() public {
        IStrategyVault.VaultInfo memory vaultInfo = yieldFarmingVault.getVaultInfo();
        assertEq(vaultInfo.name, "Yield Farming");
        assertEq(vaultInfo.strategy, "Cross-chain yield optimization");
        assertEq(vaultInfo.token0, address(0x1));
        assertEq(vaultInfo.token1, address(0x2));
        assertEq(vaultInfo.poolFee, 3000);
        assertEq(vaultInfo.totalSupply, 0);
        assertEq(vaultInfo.totalValueLocked, 0);
        assertTrue(vaultInfo.isActive);
    }
}
