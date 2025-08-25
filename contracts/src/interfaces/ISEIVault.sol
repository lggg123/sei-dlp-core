// filepath: /workspaces/sei-dlp-core/contracts/src/interfaces/ISEIVault.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title ISEIVault - SEI DLP Vault Interface
 * @dev Standard interface for SEI-optimized liquidity vaults
 */
interface ISEIVault {
    struct VaultInfo {
        string name;
        string strategy;
        address token0;
        address token1;
        uint24 poolFee;
        uint256 totalSupply;
        uint256 totalValueLocked;
        bool isActive;
    }

    struct Position {
        int24 tickLower;
        int24 tickUpper;
        uint128 liquidity;
        uint256 tokensOwed0;
        uint256 tokensOwed1;
        uint256 feeGrowthInside0LastX128;
        uint256 feeGrowthInside1LastX128;
    }

    struct AIRebalanceParams {
        int24 newTickLower;
        int24 newTickUpper;
        uint256 minAmount0;
        uint256 minAmount1;
        uint256 deadline;
        bytes aiSignature;
    }

    event VaultCreated(address indexed vault, string name, address token0, address token1);
    event PositionRebalanced(int24 oldTickLower, int24 oldTickUpper, int24 newTickLower, int24 newTickUpper);
    event AIRebalanceExecuted(bytes32 indexed aiRequestId, uint256 gasUsed);
    
    function deposit(uint256 amount0, uint256 amount1, address recipient) external returns (uint256 shares);
    function withdraw(uint256 shares, address recipient) external returns (uint256 amount0, uint256 amount1);
    function rebalance(AIRebalanceParams calldata params) external;
    function getVaultInfo() external view returns (VaultInfo memory);
    function getCurrentPosition() external view returns (Position memory);
    function getCustomerStats(address customer) external view returns (
        uint256 shares,
        uint256 shareValue,
        uint256 totalDeposited,
        uint256 totalWithdrawn,
        uint256 depositTime,
        uint256 lockTimeRemaining
    );
    
    // SEI-specific functions
    function getSEIChainId() external pure returns (uint256);
    function validateSEIChain() external returns (bool);
    function parallelExecutionEnabled() external view returns (bool);
    function getLastFinalityOptimization() external view returns (uint256);
}