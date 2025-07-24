// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title ICustomerVaultDashboard
 * @dev Interface for customer vault token tracking and analytics
 */
interface ICustomerVaultDashboard {
    
    struct CustomerPortfolio {
        address vaultAddress;
        string vaultName;
        uint256 shareBalance;
        uint256 shareValue; // Current USD value
        uint256 totalDeposited;
        uint256 totalWithdrawn;
        uint256 unrealizedGains; // Current value - deposited + withdrawn
        uint256 depositTimestamp;
        uint256 lockTimeRemaining;
        bool canWithdraw;
    }
    
    struct VaultMetrics {
        uint256 totalValueLocked;
        uint256 totalShares;
        uint256 pricePerShare;
        uint256 apy; // Annual Percentage Yield
        uint256 totalYieldGenerated;
        uint256 managementFeeRate;
        uint256 performanceFeeRate;
        uint256 withdrawalFeeRate;
    }
    
    struct YieldHistory {
        uint256 timestamp;
        uint256 totalValue;
        uint256 yieldGenerated;
        uint256 apy;
    }
    
    /**
     * @dev Get complete customer portfolio across all vaults
     */
    function getCustomerPortfolio(address customer) external view returns (CustomerPortfolio[] memory);
    
    /**
     * @dev Get detailed vault metrics
     */
    function getVaultMetrics(address vault) external view returns (VaultMetrics memory);
    
    /**
     * @dev Get historical yield data for a vault
     */
    function getYieldHistory(address vault, uint256 fromTimestamp) external view returns (YieldHistory[] memory);
    
    /**
     * @dev Calculate projected returns for a deposit amount
     */
    function calculateProjectedReturns(
        address vault,
        uint256 depositAmount,
        uint256 daysHeld
    ) external view returns (
        uint256 projectedValue,
        uint256 projectedYield,
        uint256 managementFees,
        uint256 withdrawalFees
    );
    
    /**
     * @dev Get optimal deposit ratio for a vault
     */
    function getOptimalDepositRatio(address vault) external view returns (
        uint256 token0Ratio,
        uint256 token1Ratio,
        uint256 currentPrice
    );
}
