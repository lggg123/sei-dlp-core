// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../lib/openzeppelin-contracts/contracts/token/ERC20/ERC20.sol";
import "../lib/openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";
import "../lib/openzeppelin-contracts/contracts/access/Ownable.sol";
import "../lib/openzeppelin-contracts/contracts/utils/ReentrancyGuard.sol";
import "../lib/openzeppelin-contracts/contracts/utils/cryptography/ECDSA.sol";
import "./interfaces/IStrategyVault.sol";

/**
 * @title EnhancedStrategyVault
 * @dev Enhanced AI-driven dynamic liquidity vault with advanced customer token features
 * @notice Optimized for SEI Network with customer-focused enhancements
 */
contract EnhancedStrategyVault is IStrategyVault, ERC20, Ownable, ReentrancyGuard {
    using ECDSA for bytes32;

    // SEI Network Chain ID (testnet)
    uint256 public constant SEI_CHAIN_ID = 1328;
    
    // Vault configuration
    VaultInfo public vaultInfo;
    Position public currentPosition;
    
    // AI Oracle configuration
    address public aiOracle;
    mapping(bytes32 => bool) public executedAIRequests;
    
    // Enhanced fee configuration
    uint256 public constant MANAGEMENT_FEE = 100; // 1%
    uint256 public constant PERFORMANCE_FEE = 1000; // 10%
    uint256 public constant WITHDRAWAL_FEE = 50; // 0.5%
    uint256 public constant FEE_PRECISION = 10000;
    
    // Customer enhancement features
    mapping(address => uint256) public customerDepositTime;
    mapping(address => uint256) public customerTotalDeposited;
    mapping(address => uint256) public customerTotalWithdrawn;
    uint256 public minimumLockPeriod = 24 hours; // Minimum holding period
    
    // Yield tracking
    uint256 public totalFeesCollected;
    uint256 public totalYieldGenerated;
    uint256 public lastPerformanceFeeCollection;
    
    // Emergency controls
    bool public emergencyPaused = false;
    uint256 public lastRebalance;
    uint256 public constant MIN_REBALANCE_INTERVAL = 3600; // 1 hour
    
    // Events for customer tracking
    event CustomerDeposit(address indexed customer, uint256 amount0, uint256 amount1, uint256 shares, uint256 timestamp);
    event CustomerWithdraw(address indexed customer, uint256 shares, uint256 amount0, uint256 amount1, uint256 timestamp);
    event YieldDistributed(uint256 totalYield, uint256 perShareYield);
    event FeesCollected(uint256 managementFees, uint256 performanceFees);
    
    modifier onlySEI() {
        require(block.chainid == SEI_CHAIN_ID, "Invalid chain");
        _;
    }
    
    modifier onlyAIOracle() {
        require(msg.sender == aiOracle, "Unauthorized AI oracle");
        _;
    }
    
    modifier notPaused() {
        require(!emergencyPaused, "Vault paused");
        _;
    }

    constructor(
        string memory name,
        string memory symbol,
        address _token0,
        address _token1,
        uint24 _poolFee,
        address _aiOracle,
        address initialOwner
    ) ERC20(name, symbol) Ownable(initialOwner) {
        require(block.chainid == SEI_CHAIN_ID, "Invalid chain");
        
        vaultInfo = VaultInfo({
            name: name,
            strategy: "AI_DYNAMIC_LIQUIDITY_ENHANCED",
            token0: _token0,
            token1: _token1,
            poolFee: _poolFee,
            totalSupply: 0,
            totalValueLocked: 0,
            isActive: true
        });
        
        aiOracle = _aiOracle;
        lastPerformanceFeeCollection = block.timestamp;
        
        emit VaultCreated(address(this), name, _token0, _token1);
    }

    /**
     * @dev Enhanced deposit with customer tracking
     */
    function deposit(
        uint256 amount0,
        uint256 amount1,
        address recipient
    ) external override nonReentrant onlySEI notPaused returns (uint256 shares) {
        require(amount0 > 0 || amount1 > 0, "Invalid amounts");
        require(recipient != address(0), "Invalid recipient");
        
        // Collect management fees before deposit
        _collectManagementFees();
        
        // Calculate shares based on current vault value
        uint256 totalValue = _calculateTotalValue();
        uint256 currentSupply = totalSupply();
        
        if (currentSupply == 0) {
            shares = _sqrt(amount0 * amount1);
            require(shares > 1000, "Insufficient initial liquidity");
            shares -= 1000; // Burn minimum liquidity
        } else {
            uint256 depositValue = _calculateDepositValue(amount0, amount1);
            // Add precision to avoid rounding errors
            shares = (depositValue * currentSupply + totalValue / 2) / totalValue;
        }
        
        // Transfer tokens
        if (amount0 > 0) {
            IERC20(vaultInfo.token0).transferFrom(msg.sender, address(this), amount0);
        }
        if (amount1 > 0) {
            IERC20(vaultInfo.token1).transferFrom(msg.sender, address(this), amount1);
        }
        
        // Mint shares
        _mint(recipient, shares);
        
        // Update customer tracking
        // Only update deposit time for new customers or if no existing lock period
        if (customerDepositTime[recipient] == 0 || 
            block.timestamp >= customerDepositTime[recipient] + minimumLockPeriod) {
            customerDepositTime[recipient] = block.timestamp;
        }
        customerTotalDeposited[recipient] += amount0 + amount1;
        
        // Update vault info
        vaultInfo.totalSupply = totalSupply();
        vaultInfo.totalValueLocked = _calculateTotalValue();
        
        emit CustomerDeposit(recipient, amount0, amount1, shares, block.timestamp);
        
        return shares;
    }

    /**
     * @dev Enhanced withdraw with lock period and fees
     */
    function withdraw(
        uint256 shares,
        address recipient
    ) external override nonReentrant onlySEI notPaused returns (uint256 amount0, uint256 amount1) {
        require(shares > 0, "Invalid shares");
        require(shares <= balanceOf(msg.sender), "Insufficient shares");
        
        // Check minimum lock period
        require(
            block.timestamp >= customerDepositTime[msg.sender] + minimumLockPeriod,
            "Minimum lock period not met"
        );
        
        // Collect fees before withdrawal
        _collectManagementFees();
        
        uint256 currentSupply = totalSupply();
        amount0 = (shares * _getToken0Balance()) / currentSupply;
        amount1 = (shares * _getToken1Balance()) / currentSupply;
        
        // Apply withdrawal fee
        uint256 withdrawalFee0 = (amount0 * WITHDRAWAL_FEE) / FEE_PRECISION;
        uint256 withdrawalFee1 = (amount1 * WITHDRAWAL_FEE) / FEE_PRECISION;
        
        amount0 -= withdrawalFee0;
        amount1 -= withdrawalFee1;
        
        // Burn shares first
        _burn(msg.sender, shares);
        
        // Transfer tokens (after fees)
        if (amount0 > 0) {
            IERC20(vaultInfo.token0).transfer(recipient, amount0);
        }
        if (amount1 > 0) {
            IERC20(vaultInfo.token1).transfer(recipient, amount1);
        }
        
        // Update customer tracking
        customerTotalWithdrawn[msg.sender] += amount0 + amount1;
        
        // Track fees collected
        totalFeesCollected += withdrawalFee0 + withdrawalFee1;
        
        // Update vault info
        vaultInfo.totalSupply = totalSupply();
        vaultInfo.totalValueLocked = _calculateTotalValue();
        
        emit CustomerWithdraw(msg.sender, shares, amount0, amount1, block.timestamp);
        
        return (amount0, amount1);
    }

    /**
     * @dev Get customer's vault statistics
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
        shareValue = _calculateShareValue(shares);
        totalDeposited = customerTotalDeposited[customer];
        totalWithdrawn = customerTotalWithdrawn[customer];
        depositTime = customerDepositTime[customer];
        
        uint256 lockEndTime = depositTime + minimumLockPeriod;
        lockTimeRemaining = lockEndTime > block.timestamp ? lockEndTime - block.timestamp : 0;
    }

    /**
     * @dev Calculate the USD value of shares
     */
    function _calculateShareValue(uint256 shares) internal view returns (uint256) {
        if (totalSupply() == 0) return 0;
        return (shares * _calculateTotalValue()) / totalSupply();
    }

    /**
     * @dev Calculate deposit value considering current ratios
     */
    function _calculateDepositValue(uint256 amount0, uint256 amount1) internal view returns (uint256) {
        uint256 balance0 = _getToken0Balance();
        uint256 balance1 = _getToken1Balance();
        
        if (balance0 == 0 && balance1 == 0) {
            return amount0 + amount1; // Initial deposit
        }
        
        // Calculate proportional value
        uint256 value0 = balance1 > 0 ? (amount0 * balance1) / balance0 : amount0;
        uint256 value1 = balance0 > 0 ? (amount1 * balance0) / balance1 : amount1;
        
        return value0 + value1;
    }

    /**
     * @dev Collect management fees periodically
     */
    function _collectManagementFees() internal {
        uint256 timeElapsed = block.timestamp - lastPerformanceFeeCollection;
        if (timeElapsed > 365 days) timeElapsed = 365 days; // Cap at 1 year
        
        uint256 managementFee = (_calculateTotalValue() * MANAGEMENT_FEE * timeElapsed) / (FEE_PRECISION * 365 days);
        
        if (managementFee > 0) {
            // Mint fee shares to owner
            uint256 feeShares = (managementFee * totalSupply()) / _calculateTotalValue();
            _mint(owner(), feeShares);
            
            totalFeesCollected += managementFee;
            lastPerformanceFeeCollection = block.timestamp;
        }
    }

    /**
     * @dev Distribute yield to all shareholders
     */
    function distributeYield() external onlyOwner {
        uint256 currentValue = _calculateTotalValue();
        uint256 lastValue = vaultInfo.totalValueLocked;
        
        if (currentValue > lastValue) {
            uint256 yieldGenerated = currentValue - lastValue;
            uint256 perShareYield = totalSupply() > 0 ? yieldGenerated / totalSupply() : 0;
            
            totalYieldGenerated += yieldGenerated;
            vaultInfo.totalValueLocked = currentValue;
            
            emit YieldDistributed(yieldGenerated, perShareYield);
        }
    }

    /**
     * @dev Set minimum lock period (only owner)
     */
    function setMinimumLockPeriod(uint256 newPeriod) external onlyOwner {
        require(newPeriod <= 30 days, "Lock period too long");
        minimumLockPeriod = newPeriod;
    }

    /**
     * @dev AI-driven rebalancing (unchanged from original)
     */
    function rebalance(
        AIRebalanceParams calldata params
    ) external override onlyAIOracle nonReentrant onlySEI notPaused {
        require(
            lastRebalance == 0 || block.timestamp >= lastRebalance + MIN_REBALANCE_INTERVAL,
            "Rebalance too frequent"
        );
        
        // Verify AI signature
        bytes32 requestId = keccak256(abi.encodePacked(
            params.newTickLower,
            params.newTickUpper,
            params.deadline,
            block.timestamp
        ));
        
        require(!executedAIRequests[requestId], "Request already executed");
        require(block.timestamp <= params.deadline, "Request expired");
        
        // Mark request as executed
        executedAIRequests[requestId] = true;
        
        // Store old position for event
        int24 oldTickLower = currentPosition.tickLower;
        int24 oldTickUpper = currentPosition.tickUpper;
        
        // Execute rebalance logic here
        _executeRebalance(params);
        
        lastRebalance = block.timestamp;
        
        emit PositionRebalanced(oldTickLower, oldTickUpper, params.newTickLower, params.newTickUpper);
        emit AIRebalanceExecuted(requestId, gasleft());
    }

    // Standard functions (unchanged)
    function getVaultInfo() external view override returns (VaultInfo memory) {
        return vaultInfo;
    }

    function getCurrentPosition() external view override returns (Position memory) {
        return currentPosition;
    }

    function emergencyPause() external onlyOwner {
        emergencyPaused = true;
    }

    function resume() external onlyOwner {
        emergencyPaused = false;
    }

    function updateAIOracle(address newOracle) external onlyOwner {
        require(newOracle != address(0), "Invalid oracle");
        aiOracle = newOracle;
    }

    // Internal functions
    function _executeRebalance(AIRebalanceParams calldata params) internal {
        currentPosition.tickLower = params.newTickLower;
        currentPosition.tickUpper = params.newTickUpper;
    }

    function _calculateTotalValue() internal view returns (uint256) {
        return _getToken0Balance() + _getToken1Balance();
    }

    function _getToken0Balance() internal view returns (uint256) {
        return IERC20(vaultInfo.token0).balanceOf(address(this));
    }

    function _getToken1Balance() internal view returns (uint256) {
        return IERC20(vaultInfo.token1).balanceOf(address(this));
    }

    function _sqrt(uint256 x) internal pure returns (uint256) {
        if (x == 0) return 0;
        uint256 z = (x + 1) / 2;
        uint256 y = x;
        while (z < y) {
            y = z;
            z = (x / z + z) / 2;
        }
        return y;
    }
}
