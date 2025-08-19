// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../lib/openzeppelin-contracts/contracts/access/Ownable.sol";
import "../lib/openzeppelin-contracts/contracts/utils/ReentrancyGuard.sol";
import "./StrategyVault.sol";

/**
 * @title VaultFactory
 * @dev Factory contract for creating AI-driven liquidity vaults on SEI
 */
contract VaultFactory is Ownable, ReentrancyGuard {
    // SEI Network Chain ID (testnet)
    uint256 public constant SEI_CHAIN_ID = 1328;
    
    struct VaultCreationParams {
        string name;
        string symbol;
        address token0;
        address token1;
        uint24 poolFee;
        address aiOracle;
    }
    
    // Registry of created vaults
    address[] public allVaults;
    mapping(address => bool) public isVault;
    mapping(bytes32 => address) public getVault; // salt => vault
    
    // Configuration
    address public defaultAIOracle;
    uint256 public creationFee = 0.1 ether; // SEI tokens
    
    event VaultCreated(
        address indexed vault,
        address indexed token0,
        address indexed token1,
        uint24 poolFee,
        string name
    );
    
    modifier onlySEI() {
        require(block.chainid == SEI_CHAIN_ID, "Invalid chain");
        _;
    }

    constructor(address _defaultAIOracle, address initialOwner) Ownable(initialOwner) {
        require(block.chainid == SEI_CHAIN_ID, "Must deploy on SEI");
        defaultAIOracle = _defaultAIOracle;
    }

    /**
     * @dev Create a new strategy vault
     * @notice Optimized for SEI's fast deployment and execution
     */
    function createVault(
        VaultCreationParams calldata params
    ) external payable nonReentrant onlySEI returns (address vault) {
        require(msg.value >= creationFee, "Insufficient creation fee");
        require(params.token0 != params.token1, "Identical tokens");
        require(params.token0 != address(0) && params.token1 != address(0), "Zero address");
        
        // Create salt for deterministic deployment
        bytes32 salt = keccak256(abi.encodePacked(
            params.token0,
            params.token1,
            params.poolFee,
            block.timestamp
        ));
        
        require(getVault[salt] == address(0), "Vault already exists");
        
        // Deploy vault
        vault = address(new StrategyVault{salt: salt}(
            params.name,
            params.symbol,
            params.token0,
            params.token1,
            params.poolFee,
            params.aiOracle != address(0) ? params.aiOracle : defaultAIOracle,
            msg.sender
        ));
        
        // Register vault
        allVaults.push(vault);
        isVault[vault] = true;
        getVault[salt] = vault;
        
        emit VaultCreated(vault, params.token0, params.token1, params.poolFee, params.name);
        
        return vault;
    }

    /**
     * @dev Get total number of vaults
     */
    function allVaultsLength() external view returns (uint256) {
        return allVaults.length;
    }

    /**
     * @dev Update creation fee
     */
    function setCreationFee(uint256 newFee) external onlyOwner {
        creationFee = newFee;
    }

    /**
     * @dev Update default AI oracle
     */
    function setDefaultAIOracle(address newOracle) external onlyOwner {
        require(newOracle != address(0), "Invalid oracle");
        defaultAIOracle = newOracle;
    }

    /**
     * @dev Withdraw accumulated fees
     */
    function withdrawFees() external onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }
}
