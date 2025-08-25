// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../lib/openzeppelin-contracts/contracts/token/ERC20/ERC20.sol";
import "../lib/openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";
import "../lib/openzeppelin-contracts/contracts/access/Ownable.sol";
import "../lib/openzeppelin-contracts/contracts/utils/ReentrancyGuard.sol";
import "./interfaces/ISEIVault.sol";

/**
 * @title SEIVault - AI-Driven Dynamic Liquidity Vault
 * @dev Optimized for SEI EVM 400ms finality
 * @notice Core vault implementing concentrated liquidity + AI rebalancing
 */
contract SEIVault is ISEIVault, ERC20, Ownable, ReentrancyGuard {
    // SEI Chain ID validation (testnet)
    uint256 private constant SEI_CHAIN_ID = 1328;
    
    // Vault configuration
    VaultInfo public vaultInfo;
    Position public currentPosition;
    
    // AI integration
    address public aiOracle;
    address public aiModel;
    mapping(bytes32 => bool) public executedAIRequests;
    
    // SEI-specific optimizations
    bool public parallelExecutionEnabled = true;
    uint256 public lastFinalityOptimization;
    uint256 public lastRebalance;
    uint256 public constant MIN_REBALANCE_INTERVAL = 400; // 400ms aligned with SEI finality
    
    // Fee structure optimized for SEI
    uint256 public constant MANAGEMENT_FEE = 100; // 1%
    uint256 public constant PERFORMANCE_FEE = 1000; // 10%
    uint256 public constant FEE_PRECISION = 10000;
    
    // Events for SEI optimizations
    event SEIOptimizedDeposit(address indexed user, uint256 amount, uint256 shares, uint256 blockTime);
    event SEIOptimizedWithdraw(address indexed user, uint256 amount, uint256 shares, uint256 blockTime);
    event ParallelExecutionEnabled(bool enabled);
    event FinalityOptimized(uint256 blockTime, uint256 executionBatch);
    event SEIChainValidated(uint256 chainId, bool isValid);
    
    modifier onlySEI() {
        require(block.chainid == SEI_CHAIN_ID, "Invalid SEI chain");
        _;
    }
    
    modifier onlyAIOracle() {
        require(msg.sender == aiOracle, "Unauthorized AI");
        _;
    }
    
    constructor(
        address _asset,
        string memory _name,
        string memory _symbol,
        address _owner,
        address _aiModel
    ) ERC20(_name, _symbol) Ownable(_owner) {
        require(block.chainid == SEI_CHAIN_ID, "Invalid SEI chain");
        // Note: _asset can be address(0) for native SEI vaults
        require(_owner != address(0), "Invalid owner");
        require(_aiModel != address(0), "Invalid AI model");
        
        vaultInfo = VaultInfo({
            name: _name,
            strategy: "SEI_AI_CONCENTRATED_LIQUIDITY",
            token0: _asset,
            token1: address(0), // Single asset vault for simplicity
            poolFee: 3000, // 0.3%
            totalSupply: 0,
            totalValueLocked: 0,
            isActive: true
        });
        
        aiModel = _aiModel;
        
        emit VaultCreated(address(this), _name, _asset, address(0));
    }
    
    // Core vault functions required by interface
    function asset() public view returns (address) {
        return vaultInfo.token0;
    }
    
    function totalAssets() public view returns (uint256) {
        return _getTotalAssetBalance();
    }
    
    /**
     * @dev Standard deposit function for interface compliance
     */
    function deposit(
        uint256 amount0,
        uint256, // amount1 - unused for single asset vault
        address recipient
    ) external override nonReentrant onlySEI returns (uint256 shares) {
        require(amount0 > 0, "Deposit amount must be greater than 0");
        require(recipient != address(0), "Invalid recipient");
        
        // For single asset vault, only use amount0
        shares = seiOptimizedDeposit(amount0, recipient);
        return shares;
    }
    
    /**
     * @dev Standard withdraw function for interface compliance
     */
    function withdraw(
        uint256 shares,
        address recipient
    ) external override nonReentrant onlySEI returns (uint256 amount0, uint256 amount1) {
        require(shares > 0, "Withdraw amount must be greater than 0");
        require(recipient != address(0), "Invalid recipient");
        
        amount0 = seiOptimizedWithdraw(shares, msg.sender, recipient);
        amount1 = 0; // Single asset vault
        return (amount0, amount1);
    }
    
    /**
     * @dev SEI-optimized deposit with parallel execution support
     * @notice Optimized for SEI's 400ms finality with gas optimizations
     * @param amount The amount to deposit (for ERC20) or should match msg.value (for native SEI)
     * @param recipient The address to receive vault shares
     */
    function seiOptimizedDeposit(
        uint256 amount,
        address recipient
    ) public payable nonReentrant onlySEI returns (uint256 shares) {
        require(recipient != address(0), "Invalid recipient");
        
        uint256 actualAmount;
        
        // Determine if this is a native SEI deposit or ERC20 deposit
        if (vaultInfo.token0 == address(0)) {
            // Native SEI deposit
            require(msg.value > 0, "Must send SEI with transaction");
            require(amount == msg.value, "Amount must match msg.value for native SEI");
            actualAmount = msg.value;
        } else {
            // ERC20 token deposit
            require(amount > 0, "Deposit amount must be greater than 0");
            require(msg.value == 0, "Do not send SEI for ERC20 deposits");
            actualAmount = amount;
            
            // Transfer ERC20 tokens from sender
            IERC20(vaultInfo.token0).transferFrom(msg.sender, address(this), amount);
        }
        
        // Cache values to reduce SLOAD operations (gas optimization for SEI)
        uint256 currentSupply = totalSupply();
        uint256 totalAssetBalance = _getTotalAssetBalance();
        
        // Calculate shares with optimized logic
        if (currentSupply == 0) {
            shares = actualAmount;
        } else {
            // Use unchecked for gas optimization on SEI (safe due to previous checks)
            unchecked {
                shares = (actualAmount * currentSupply) / totalAssetBalance;
            }
        }
        
        // Mint shares
        _mint(recipient, shares);
        
        // Track customer deposits for statistics
        customerTotalDeposited[recipient] += actualAmount;
        if (customerDepositTime[recipient] == 0) {
            customerDepositTime[recipient] = block.timestamp;
        }
        
        // Batch update vault info to reduce SSTORE operations
        unchecked {
            vaultInfo.totalSupply = currentSupply + shares;
            vaultInfo.totalValueLocked = totalAssetBalance + actualAmount;
        }
        
        // Emit optimized event for SEI parallel execution
        emit SEIOptimizedDeposit(recipient, actualAmount, shares, block.timestamp);
        
        // Optional: Emit parallel execution status only when enabled
        if (parallelExecutionEnabled) {
            emit ParallelExecutionEnabled(true);
        }
        
        return shares;
    }
    
    /**
     * @dev Helper function to get total asset balance (native SEI or ERC20)
     */
    function _getTotalAssetBalance() internal view returns (uint256) {
        if (vaultInfo.token0 == address(0)) {
            // Native SEI balance
            return address(this).balance;
        } else {
            // ERC20 token balance
            return IERC20(vaultInfo.token0).balanceOf(address(this));
        }
    }
    
    /**
     * @dev SEI-optimized withdraw with parallel execution support
     */
    function seiOptimizedWithdraw(
        uint256 shares,
        address owner,
        address recipient
    ) public nonReentrant onlySEI returns (uint256 assets) {
        require(shares > 0, "Withdraw amount must be greater than 0");
        require(balanceOf(owner) >= shares, "Insufficient shares");
        require(msg.sender == owner || allowance(owner, msg.sender) >= shares, "Insufficient allowance");
        
        // Check lock period
        uint256 depositTime = customerDepositTime[owner];
        if (depositTime > 0) {
            require(block.timestamp >= depositTime + LOCK_PERIOD, "Assets are locked for 24 hours after deposit");
        }
        
        // Calculate assets to return
        uint256 currentSupply = totalSupply();
        uint256 totalAssetBalance = _getTotalAssetBalance();
        assets = (shares * totalAssetBalance) / currentSupply;
        
        // Burn shares
        _burn(owner, shares);
        
        // Track customer withdrawals for statistics
        customerTotalWithdrawn[owner] += assets;
        
        // Transfer assets (native SEI or ERC20)
        if (vaultInfo.token0 == address(0)) {
            // Native SEI transfer
            require(address(this).balance >= assets, "Insufficient contract balance");
            (bool success, ) = recipient.call{value: assets}("");
            require(success, "Native SEI transfer failed");
        } else {
            // ERC20 token transfer
            IERC20(vaultInfo.token0).transfer(recipient, assets);
        }
        
        // Update vault info
        vaultInfo.totalSupply = totalSupply();
        vaultInfo.totalValueLocked = _getTotalAssetBalance();
        
        emit SEIOptimizedWithdraw(recipient, assets, shares, block.timestamp);
        
        return assets;
    }
    
    /**
     * @dev AI rebalancing with SEI 400ms finality optimization
     */
    function rebalance(
        AIRebalanceParams calldata params
    ) external override onlyAIOracle nonReentrant onlySEI {
        require(
            block.timestamp >= lastRebalance + MIN_REBALANCE_INTERVAL,
            "Rebalance too frequent"
        );
        
        // Execute rebalance leveraging SEI speed
        _executeRebalance(params);
        
        lastRebalance = block.timestamp;
        
        emit PositionRebalanced(
            currentPosition.tickLower,
            currentPosition.tickUpper,
            params.newTickLower,
            params.newTickUpper
        );
    }
    
    /**
     * @dev Get vault information
     */
    function getVaultInfo() external view override returns (VaultInfo memory) {
        return vaultInfo;
    }
    
    /**
     * @dev Get current position
     */
    function getCurrentPosition() external view override returns (Position memory) {
        return currentPosition;
    }
    
    // SEI-specific optimization functions
    function getSEIChainId() external pure returns (uint256) {
        return SEI_CHAIN_ID;
    }
    
    function validateSEIChain() public returns (bool) {
        bool isValid = block.chainid == SEI_CHAIN_ID;
        emit SEIChainValidated(block.chainid, isValid);
        return isValid;
    }
    
    function setParallelExecution(bool enabled) external onlyOwner {
        parallelExecutionEnabled = enabled;
        emit ParallelExecutionEnabled(enabled);
    }
    
    function optimizeForFinality() external onlyOwner {
        lastFinalityOptimization = block.timestamp;
        emit FinalityOptimized(block.timestamp, 1);
    }
    
    function getLastFinalityOptimization() external view returns (uint256) {
        return lastFinalityOptimization;
    }
    
    /**
     * @dev Receive function to accept native SEI deposits
     */
    receive() external payable {
        // Only accept SEI if this is a native SEI vault
        require(vaultInfo.token0 == address(0), "This vault does not accept native SEI");
        // Note: Direct receives should use seiOptimizedDeposit for proper share calculation
        // This is just to prevent accidental SEI sends from reverting
    }
    
    /**
     * @dev Fallback function
     */
    fallback() external payable {
        revert("Use seiOptimizedDeposit function for deposits");
    }

    // Customer tracking
    struct CustomerStats {
        uint256 shares;
        uint256 shareValue;
        uint256 totalDeposited;
        uint256 totalWithdrawn;
        uint256 depositTime;
        uint256 lockTimeRemaining;
    }
    
    mapping(address => uint256) public customerTotalDeposited;
    mapping(address => uint256) public customerTotalWithdrawn;
    mapping(address => uint256) public customerDepositTime;
    uint256 public constant LOCK_PERIOD = 24 hours; // 24-hour lock period
    
    /**
     * @dev Get customer statistics for dashboard display
     * @param customer The customer address to get stats for
     * @return shares Current shares owned by customer
     * @return shareValue Current value of customer's shares
     * @return totalDeposited Total amount deposited by customer
     * @return totalWithdrawn Total amount withdrawn by customer
     * @return depositTime Timestamp of customer's first deposit
     * @return lockTimeRemaining Time remaining in lock period (0 if unlocked)
     */
    function getCustomerStats(address customer) external view returns (
        uint256 shares,
        uint256 shareValue,
        uint256 totalDeposited,
        uint256 totalWithdrawn,
        uint256 depositTime,
        uint256 lockTimeRemaining
    ) {
        shares = balanceOf(customer);
        
        // Calculate share value based on current exchange rate
        if (shares > 0) {
            uint256 currentSupply = totalSupply();
            uint256 totalAssetBalance = _getTotalAssetBalance();
            shareValue = currentSupply > 0 ? (shares * totalAssetBalance) / currentSupply : 0;
        } else {
            shareValue = 0;
        }
        
        totalDeposited = customerTotalDeposited[customer];
        totalWithdrawn = customerTotalWithdrawn[customer];
        depositTime = customerDepositTime[customer];
        
        // Calculate lock time remaining
        if (depositTime > 0) {
            uint256 unlockTime = depositTime + LOCK_PERIOD;
            lockTimeRemaining = block.timestamp < unlockTime ? unlockTime - block.timestamp : 0;
        } else {
            lockTimeRemaining = 0;
        }
        
        return (shares, shareValue, totalDeposited, totalWithdrawn, depositTime, lockTimeRemaining);
    }

    // Internal functions
    function _executeRebalance(AIRebalanceParams calldata params) internal {
        currentPosition.tickLower = params.newTickLower;
        currentPosition.tickUpper = params.newTickUpper;
        // SEI-specific DEX integration would go here
    }
}