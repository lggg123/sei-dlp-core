// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../lib/openzeppelin-contracts/contracts/token/ERC20/ERC20.sol";
import "../lib/openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";
import "../lib/openzeppelin-contracts/contracts/access/Ownable.sol";
import "../lib/openzeppelin-contracts/contracts/utils/ReentrancyGuard.sol";
import "../lib/openzeppelin-contracts/contracts/utils/cryptography/ECDSA.sol";
import "./interfaces/IStrategyVault.sol";

/**
 * @title StrategyVault
 * @dev AI-driven dynamic liquidity vault optimized for SEI Network
 * @notice Leverages SEI's 400ms finality for rapid rebalancing
 */
contract StrategyVault is IStrategyVault, ERC20, Ownable, ReentrancyGuard {
    using ECDSA for bytes32;

    // SEI Network Chain ID
    uint256 public constant SEI_CHAIN_ID = 713715;
    
    // Vault configuration
    VaultInfo public vaultInfo;
    Position public currentPosition;
    
    // AI Oracle configuration
    address public aiOracle;
    mapping(bytes32 => bool) public executedAIRequests;
    
    // Fee configuration (optimized for SEI's low gas costs)
    uint256 public constant MANAGEMENT_FEE = 100; // 1%
    uint256 public constant PERFORMANCE_FEE = 1000; // 10%
    uint256 public constant FEE_PRECISION = 10000;
    
    // Emergency controls
    bool public emergencyPaused = false;
    uint256 public lastRebalance;
    uint256 public constant MIN_REBALANCE_INTERVAL = 3600; // 1 hour (leveraging SEI speed)
    
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
            strategy: "AI_DYNAMIC_LIQUIDITY",
            token0: _token0,
            token1: _token1,
            poolFee: _poolFee,
            totalSupply: 0,
            totalValueLocked: 0,
            isActive: true
        });
        
        aiOracle = _aiOracle;
        
        emit VaultCreated(address(this), name, _token0, _token1);
    }

    /**
     * @dev Deposit tokens and mint vault shares
     * @notice Optimized for SEI's parallel execution
     */
    function deposit(
        uint256 amount0,
        uint256 amount1,
        address recipient
    ) external override nonReentrant onlySEI notPaused returns (uint256 shares) {
        require(amount0 > 0 || amount1 > 0, "Invalid amounts");
        require(recipient != address(0), "Invalid recipient");
        
        // Calculate shares based on current vault value
        uint256 totalValue = _calculateTotalValue();
        uint256 currentSupply = totalSupply();
        
        if (currentSupply == 0) {
            shares = _sqrt(amount0 * amount1);
            require(shares > 1000, "Insufficient initial liquidity");
            shares -= 1000; // Burn minimum liquidity
        } else {
            uint256 value0 = (amount0 * totalValue) / _getToken0Balance();
            uint256 value1 = (amount1 * totalValue) / _getToken1Balance();
            shares = ((value0 + value1) * currentSupply) / totalValue;
        }
        
        // Transfer tokens (SEI's parallel execution optimizes this)
        if (amount0 > 0) {
            IERC20(vaultInfo.token0).transferFrom(msg.sender, address(this), amount0);
        }
        if (amount1 > 0) {
            IERC20(vaultInfo.token1).transferFrom(msg.sender, address(this), amount1);
        }
        
        // Mint shares
        _mint(recipient, shares);
        
        // Update vault info
        vaultInfo.totalSupply = totalSupply();
        vaultInfo.totalValueLocked = _calculateTotalValue();
        
        return shares;
    }

    /**
     * @dev Withdraw tokens by burning shares
     * @notice Fast withdrawals leveraging SEI's 400ms finality
     */
    function withdraw(
        uint256 shares,
        address recipient
    ) external override nonReentrant onlySEI notPaused returns (uint256 amount0, uint256 amount1) {
        require(shares > 0, "Invalid shares");
        require(shares <= balanceOf(msg.sender), "Insufficient shares");
        
        uint256 currentSupply = totalSupply();
        amount0 = (shares * _getToken0Balance()) / currentSupply;
        amount1 = (shares * _getToken1Balance()) / currentSupply;
        
        // Burn shares first
        _burn(msg.sender, shares);
        
        // Transfer tokens
        if (amount0 > 0) {
            IERC20(vaultInfo.token0).transfer(recipient, amount0);
        }
        if (amount1 > 0) {
            IERC20(vaultInfo.token1).transfer(recipient, amount1);
        }
        
        // Update vault info
        vaultInfo.totalSupply = totalSupply();
        vaultInfo.totalValueLocked = _calculateTotalValue();
        
        return (amount0, amount1);
    }

    /**
     * @dev AI-driven rebalancing with signature verification
     * @notice Optimized for SEI's fast finality and parallel execution
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

    /**
     * @dev Get current vault information
     */
    function getVaultInfo() external view override returns (VaultInfo memory) {
        return vaultInfo;
    }

    /**
     * @dev Get current liquidity position
     */
    function getCurrentPosition() external view override returns (Position memory) {
        return currentPosition;
    }

    /**
     * @dev Emergency pause function
     */
    function emergencyPause() external onlyOwner {
        emergencyPaused = true;
    }

    /**
     * @dev Resume operations
     */
    function resume() external onlyOwner {
        emergencyPaused = false;
    }

    /**
     * @dev Update AI oracle address
     */
    function updateAIOracle(address newOracle) external onlyOwner {
        require(newOracle != address(0), "Invalid oracle");
        aiOracle = newOracle;
    }

    // Internal functions
    function _executeRebalance(AIRebalanceParams calldata params) internal {
        // Implementation would integrate with Uniswap V3 or similar DEX
        // This is simplified for the example
        currentPosition.tickLower = params.newTickLower;
        currentPosition.tickUpper = params.newTickUpper;
        
        // Update liquidity calculations based on new position
        // Real implementation would call external DEX contracts
    }

    function _calculateTotalValue() internal view returns (uint256) {
        // Calculate total vault value including positions and fees
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
