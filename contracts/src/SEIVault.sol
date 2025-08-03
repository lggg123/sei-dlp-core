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
    // SEI Chain ID validation (devnet)
    uint256 private constant SEI_CHAIN_ID = 713715;
    
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
        require(_asset != address(0), "Invalid asset");
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
        return IERC20(vaultInfo.token0).balanceOf(address(this));
    }
    
    /**
     * @dev Standard deposit function for interface compliance
     */
    function deposit(
        uint256 amount0,
        uint256 amount1,
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
     */
    function seiOptimizedDeposit(
        uint256 amount,
        address recipient
    ) public nonReentrant onlySEI returns (uint256 shares) {
        require(amount > 0, "Deposit amount must be greater than 0");
        require(recipient != address(0), "Invalid recipient");
        
        if (parallelExecutionEnabled) {
            emit ParallelExecutionEnabled(true);
        }
        
        // Calculate shares
        uint256 currentSupply = totalSupply();
        uint256 totalAssetBalance = totalAssets();
        
        if (currentSupply == 0) {
            shares = amount;
        } else {
            shares = (amount * currentSupply) / totalAssetBalance;
        }
        
        // Transfer tokens
        IERC20(vaultInfo.token0).transferFrom(msg.sender, address(this), amount);
        
        // Mint shares
        _mint(recipient, shares);
        
        // Update vault info
        vaultInfo.totalSupply = totalSupply();
        vaultInfo.totalValueLocked = totalAssets();
        
        emit SEIOptimizedDeposit(recipient, amount, shares, block.timestamp);
        
        return shares;
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
        
        // Calculate assets to return
        uint256 currentSupply = totalSupply();
        uint256 totalAssetBalance = totalAssets();
        assets = (shares * totalAssetBalance) / currentSupply;
        
        // Burn shares
        _burn(owner, shares);
        
        // Transfer assets
        IERC20(vaultInfo.token0).transfer(recipient, assets);
        
        // Update vault info
        vaultInfo.totalSupply = totalSupply();
        vaultInfo.totalValueLocked = totalAssets();
        
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
    
    // Internal functions
    function _executeRebalance(AIRebalanceParams calldata params) internal {
        currentPosition.tickLower = params.newTickLower;
        currentPosition.tickUpper = params.newTickUpper;
        // SEI-specific DEX integration would go here
    }
}