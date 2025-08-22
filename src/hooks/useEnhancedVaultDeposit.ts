/**
 * Enhanced vault deposit hook that supports both native SEI and ERC20 token deposits
 */

import { useWriteContract, useAccount, useWaitForTransactionReceipt, useChainId, useReadContract } from 'wagmi';
import { useEffect, useMemo, useRef } from 'react';
import { parseUnits, formatUnits } from 'viem';
import { useQueryClient } from '@tanstack/react-query';
import { useAppStore } from '@/stores/appStore';
import { VAULT_QUERY_KEYS } from './useVaults';
import { 
  getVaultTokenRequirements, 
  vaultAcceptsNativeSEI, 
  isNativeSEIVault,
  getPrimaryDepositToken,
  hasInsufficientBalance,
  TokenInfo
} from '@/utils/tokenUtils';
import { useTokenBalance } from './useTokenBalance';
import SEIVault from '@/../contracts/out/SEIVault.sol/SEIVault.json';

// ERC20 ABI for approve function
const ERC20_ABI = [
  {
    name: 'approve',
    type: 'function',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' }
    ],
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable'
  }
] as const;

interface VaultDepositParams {
  amount: string;
  tokenSymbol: string;
  vaultAddress: string;
  recipient?: string;
}

interface DepositValidation {
  isValid: boolean;
  error?: string;
  warnings?: string[];
  requiredApproval?: {
    tokenAddress: string;
    amount: string;
  };
}

export function useEnhancedVaultDeposit(vaultData: {
  address: string;
  tokenA: string;
  tokenB: string;
  strategy: string;
  name: string;
}) {
  const { writeContract, data: hash, error, isPending, isSuccess, isError, reset } = useWriteContract({
    mutation: {
      onError: (error) => {
        console.error('🚨 [writeContract] ERROR:', error);
      },
      onSuccess: (data) => {
        console.log('✅ [writeContract] SUCCESS:', data);
      },
      onSettled: (data, error) => {
        console.log('🏁 [writeContract] SETTLED:', { data, error });
      }
    }
  });
  const { address: userAddress } = useAccount();
  const chainId = useChainId();
  const queryClient = useQueryClient();
  const addNotification = useAppStore((state) => state.addNotification);
  
  // Use ref to prevent multiple initializations
  const initRef = useRef(false);
  const lastVaultAddress = useRef('');
  
  // Only log when vault changes or first initialization
  useEffect(() => {
    if (!initRef.current || lastVaultAddress.current !== vaultData.address) {
      console.log('🚀 [useEnhancedVaultDeposit] Hook initialized for vault:', {
        name: vaultData.name,
        address: vaultData.address,
        strategy: vaultData.strategy,
        tokenA: vaultData.tokenA,
        tokenB: vaultData.tokenB,
        isFirstInit: !initRef.current,
        addressChanged: lastVaultAddress.current !== vaultData.address
      });
      
      initRef.current = true;
      lastVaultAddress.current = vaultData.address;
    }
  }, [vaultData.name, vaultData.address, vaultData.strategy, vaultData.tokenA, vaultData.tokenB]);

  // Log wallet and network status (only when it changes)
  const lastUserAddress = useRef('');
  const lastChainId = useRef(0);
  
  useEffect(() => {
    if (lastUserAddress.current !== userAddress || lastChainId.current !== chainId) {
      console.log('🌐 [useEnhancedVaultDeposit] Wallet & Network Status:', {
        userAddress,
        chainId,
        expectedChainId: 1328, // SEI Atlantic-2
        isCorrectNetwork: chainId === 1328,
        vaultAddress: vaultData.address,
        userAddressChanged: lastUserAddress.current !== userAddress,
        chainIdChanged: lastChainId.current !== chainId
      });
      
      lastUserAddress.current = userAddress || '';
      lastChainId.current = chainId;
    }
  }, [userAddress, chainId, vaultData.address]);

  // Add network warning
  if (chainId !== 1328) {
    console.warn('⚠️ [useEnhancedVaultDeposit] NETWORK MISMATCH!', {
      currentChainId: chainId,
      expectedChainId: 1328,
      currentNetwork: chainId === 1 ? 'Ethereum Mainnet' : 
                     chainId === 11155111 ? 'Sepolia' :
                     chainId === 713715 ? 'SEI Devnet (Arctic)' :
                     chainId === 1328 ? 'SEI Atlantic-2 Testnet' : 'Unknown',
      requiredNetwork: 'SEI Atlantic-2 Testnet',
      action: 'Please switch to SEI Atlantic-2 testnet in your wallet'
    });
  }

  // Monitor transaction receipt
  const { 
    data: receipt, 
    isLoading: isConfirming, 
    isSuccess: isConfirmed,
    isError: isReceiptError,
    error: receiptError
  } = useWaitForTransactionReceipt({
    hash,
  });

  // Monitor transaction state changes
  useEffect(() => {
    if (hash) {
      console.log('🆔 [Transaction] Hash generated:', hash);
    }
  }, [hash]);

  useEffect(() => {
    if (isPending) {
      console.log('⏳ [Transaction] Status: PENDING - Waiting for user confirmation...');
    }
  }, [isPending]);

  useEffect(() => {
    if (isSuccess) {
      console.log('✅ [Transaction] Status: SUCCESS - Transaction submitted to network');
      console.log('🔍 [Transaction] Hash:', hash);
    }
  }, [isSuccess, hash]);

  useEffect(() => {
    if (isError) {
      console.error('❌ [Transaction] Status: ERROR - Transaction failed');
      console.error('💥 [Transaction] Error:', error);
    }
  }, [isError, error]);

  useEffect(() => {
    if (isConfirming) {
      console.log('⏳ [Transaction] Status: CONFIRMING - Waiting for network confirmation...');
      console.log('🔍 [Transaction] Hash:', hash);
    }
  }, [isConfirming, hash]);

  useEffect(() => {
    if (isConfirmed && receipt) {
      console.log('🎉 [Transaction] Status: CONFIRMED - Transaction confirmed on network!');
      console.log('📄 [Transaction] Receipt:', receipt);
      console.log('⛽ [Transaction] Gas used:', receipt.gasUsed?.toString());
      console.log('🏁 [Transaction] Block number:', receipt.blockNumber?.toString());
    }
  }, [isConfirmed, receipt]);

  useEffect(() => {
    if (isReceiptError) {
      console.error('❌ [Transaction] Receipt ERROR:', receiptError);
    }
  }, [isReceiptError, receiptError]);

  // Enhanced logging for transaction states (only when state changes)
  const lastTxState = useRef('');
  
  useEffect(() => {
    const currentState = `${isPending}|${isSuccess}|${isError}|${!!hash}`;
    if (lastTxState.current !== currentState) {
      console.log('📊 [useEnhancedVaultDeposit] Transaction State Changed:', {
        hash,
        isPending,
        isSuccess,
        isError,
        isConfirming,
        isConfirmed,
        isReceiptError,
        error: error?.message,
        receiptError: receiptError?.message,
        hasReceipt: !!receipt
      });
      lastTxState.current = currentState;
    }
  }, [hash, isPending, isSuccess, isError, isConfirming, isConfirmed, isReceiptError, error, receiptError, receipt]);

  // Memoize vault data validation to prevent unnecessary re-computations
  const hasValidVaultData = useMemo(() => {
    return !!(vaultData.address && vaultData.tokenA && vaultData.tokenB && vaultData.strategy);
  }, [vaultData.address, vaultData.tokenA, vaultData.tokenB, vaultData.strategy]);

  // Memoize token requirements to prevent repeated calls to getVaultTokenRequirements
  const tokenRequirements = useMemo(() => {
    if (!hasValidVaultData) {
      return {
        primaryToken: { symbol: 'SEI', name: 'SEI', decimals: 18, isNative: true },
        secondaryToken: { symbol: 'USDC', name: 'USD Coin', decimals: 6, isNative: false, address: '0xD2D6BE5E318d5D4B3A03aFf4b7FfDA3d3f3a2a2a' },
        requiresBothTokens: false,
        supportsNativeSEI: true
      };
    }
    
    console.log('🔍 [useEnhancedVaultDeposit] Computing token requirements for vault:', vaultData.name);
    return getVaultTokenRequirements(vaultData);
  }, [hasValidVaultData, vaultData.address, vaultData.tokenA, vaultData.tokenB, vaultData.strategy, vaultData.name]);

  // Memoize primary token to prevent repeated calls to getPrimaryDepositToken
  const primaryToken = useMemo(() => {
    if (!hasValidVaultData) {
      return tokenRequirements.primaryToken;
    }
    
    console.log('🔍 [useEnhancedVaultDeposit] Computing primary deposit token for vault:', vaultData.name);
    return getPrimaryDepositToken(vaultData);
  }, [hasValidVaultData, tokenRequirements.primaryToken, vaultData.address, vaultData.tokenA, vaultData.tokenB, vaultData.strategy, vaultData.name]);
  
  // Get user's balance for the primary token
  const userBalance = useTokenBalance(primaryToken.symbol);
  
  // Test contract accessibility by reading a simple view function
  const { data: contractName, error: contractError } = useReadContract({
    address: vaultData.address as `0x${string}`,
    abi: SEIVault.abi,
    functionName: 'name',
    query: {
      enabled: !!vaultData.address && vaultData.address.length === 42
    }
  });
  
  // Log contract accessibility
  useEffect(() => {
    if (vaultData.address) {
      console.log('🔗 [Contract Test] Contract accessibility:', {
        contractAddress: vaultData.address,
        contractName: contractName,
        contractError: contractError?.message,
        isAccessible: !!contractName && !contractError
      });
    }
  }, [vaultData.address, contractName, contractError]);

  // Log token requirements and user balance
  console.log('ℹ️ [useEnhancedVaultDeposit] Token Info:', {
    primaryToken,
    userBalance: {
      balance: userBalance.balance,
      formatted: userBalance.formatted,
      isLoading: userBalance.isLoading,
    },
    tokenRequirements,
  });

  /**
   * Validate deposit parameters
   */
  const validateDeposit = (params: VaultDepositParams): DepositValidation => {
    console.log('🔍 [validateDeposit] Starting validation with params:', {
      vaultAddress: params.vaultAddress,
      amount: params.amount,
      tokenSymbol: params.tokenSymbol,
      userAddress,
      chainId
    });

    if (!userAddress) {
      console.error('❌ [validateDeposit] Wallet not connected');
      return { isValid: false, error: 'Wallet not connected' };
    }

    if (!params.vaultAddress || !params.amount || !params.tokenSymbol) {
      console.error('❌ [validateDeposit] Missing required parameters:', {
        vaultAddress: !!params.vaultAddress,
        amount: !!params.amount,
        tokenSymbol: !!params.tokenSymbol
      });
      return { isValid: false, error: 'Missing required parameters' };
    }

    // Check if vault address is valid for testnet
    const validTestnetVaults = [
      // NEW FIXED VAULTS - Deployed 2024
      '0xAC64527866CCfA796Fa87A257B3f927179a895e6', // Native SEI Vault (FIXED)
      '0xcF796aEDcC293db74829e77df7c26F482c9dBEC0', // ERC20 USDC Vault (FIXED)
      
      // Legacy vault addresses (for backwards compatibility)
      '0xf6A791e4773A60083AA29aaCCDc3bA5E900974fE',
      '0x6F4cF61bBf63dCe0094CA1fba25545f8c03cd8E6', 
      '0x22Fc4c01FAcE783bD47A1eF2B6504213C85906a1',
      '0xCB15AFA183347934DeEbb0F442263f50021EFC01',
      '0x34C0aA990D6e0D099325D7491136BA35FBcdFb38',
      '0x6C0e4d44bcdf6f922637e041FdA4b7c1Fe5667E6',
      '0x271115bA107A8F883DE36Eaf3a1CC41a4C5E1a56',
      '0xaE6F27Fdf2D15c067A0Ebc256CE05A317B671B81'
    ];

    const isValidVault = validTestnetVaults.some(addr => 
      addr.toLowerCase() === params.vaultAddress.toLowerCase()
    );

    console.log('🔍 [validateDeposit] Vault validation:', {
      vaultAddress: params.vaultAddress,
      isValidVault,
      validVaults: validTestnetVaults.slice(0, 2) // Show first 2 (new vaults)
    });

    if (!isValidVault) {
      console.error('❌ [validateDeposit] Invalid vault address:', params.vaultAddress);
      return {
        isValid: false,
        error: `Vault address ${params.vaultAddress} is not deployed on SEI Atlantic-2 testnet (Chain ID 1328)`
      };
    }

    // Check if the token is supported by this vault
    const tokenSymbol = params.tokenSymbol.toUpperCase();
    const vaultTokenA = vaultData.tokenA.toUpperCase();
    const vaultTokenB = vaultData.tokenB.toUpperCase();
    const isNativeVault = isNativeSEIVault(vaultData);

    console.log('🔍 [validateDeposit] Token validation:', {
      tokenSymbol,
      vaultTokenA,
      vaultTokenB,
      isNativeVault,
      vaultData
    });

    if (tokenSymbol !== vaultTokenA && tokenSymbol !== vaultTokenB) {
      console.error('❌ [validateDeposit] Token not supported by vault');
      return {
        isValid: false,
        error: `This vault does not accept ${tokenSymbol}. It accepts ${vaultTokenA} and ${vaultTokenB}.`
      };
    }

    // Additional validation for native vs ERC20 vault types
    const depositTokenInfo = primaryToken;
    console.log('🔍 [validateDeposit] Vault type validation:', {
      depositTokenIsNative: depositTokenInfo.isNative,
      isNativeVault,
      depositTokenInfo
    });

    if (depositTokenInfo.isNative && !isNativeVault) {
      console.error('❌ [validateDeposit] Cannot deposit native SEI to ERC20 vault');
      return {
        isValid: false,
        error: 'Cannot deposit native SEI to an ERC20-only vault. Please select an appropriate vault.'
      };
    }

    if (!depositTokenInfo.isNative && isNativeVault) {
      console.error('❌ [validateDeposit] Cannot deposit ERC20 to native vault');
      return {
        isValid: false,
        error: 'Cannot deposit ERC20 tokens to a native SEI vault. Please select an appropriate vault.'
      };
    }

    // Validate balance
    const balanceCheck = hasInsufficientBalance(
      params.amount,
      userBalance.balance,
      primaryToken
    );

    console.log('🔍 [validateDeposit] Balance validation:', {
      requestedAmount: params.amount,
      userBalance: userBalance.balance,
      primaryToken: primaryToken.symbol,
      sufficient: !balanceCheck.insufficient,
      balanceLoading: userBalance.isLoading,
      balanceError: userBalance.error
    });

    if (balanceCheck.insufficient) {
      console.error('❌ [validateDeposit] Insufficient balance:', balanceCheck.message);
      return {
        isValid: false,
        error: balanceCheck.message
      };
    }

    const warnings: string[] = [];

    // Check if user is depositing the optimal token
    if (tokenSymbol !== primaryToken.symbol) {
      warnings.push(
        `You're depositing ${tokenSymbol}, but ${primaryToken.symbol} is the primary token for this vault.`
      );
    }

    // For ERC20 tokens, check if approval is needed
    let requiredApproval: DepositValidation['requiredApproval'];
    if (!primaryToken.isNative && primaryToken.address) {
      const amountInWei = parseUnits(params.amount, primaryToken.decimals);
      requiredApproval = {
        tokenAddress: primaryToken.address,
        amount: amountInWei.toString()
      };
      
      warnings.push(
        `This deposit requires ERC20 token approval. You'll need to approve ${primaryToken.symbol} spending first.`
      );
    }

    console.log('✅ [validateDeposit] Validation successful!', {
      warnings: warnings.length,
      requiredApproval: !!requiredApproval,
      tokenSymbol,
      primaryToken: primaryToken.symbol
    });

    return {
      isValid: true,
      warnings,
      requiredApproval
    };
  };

  /**
   * Approve ERC20 token spending
   */
  const approveToken = async (tokenAddress: string, amount: string): Promise<void> => {
    if (!userAddress) {
      throw new Error('Wallet not connected');
    }

    console.log('[useEnhancedVaultDeposit] Approving token:', {
      tokenAddress,
      amount,
      spender: vaultData.address
    });

    writeContract({
      address: tokenAddress as `0x${string}`,
      abi: ERC20_ABI,
      functionName: 'approve',
      args: [vaultData.address as `0x${string}`, BigInt(amount)]
    });
  };

  /**
   * Execute vault deposit
   */
  const deposit = async (params: VaultDepositParams): Promise<string> => {
    console.log('🚀 [deposit] Starting deposit process:', {
      params,
      userAddress,
      chainId,
      vaultData
    });

    if (!userAddress) {
      console.error('❌ [deposit] Wallet not connected');
      throw new Error('Wallet not connected');
    }

    // Validate deposit
    console.log('🔍 [deposit] Running validation...');
    const validation = validateDeposit(params);
    if (!validation.isValid) {
      console.error('❌ [deposit] Validation failed:', validation.error);
      throw new Error(validation.error);
    }
    console.log('✅ [deposit] Validation passed');

    // Reset any previous transaction state
    console.log('🔄 [deposit] Resetting previous transaction state...');
    reset();

    const tokenInfo = primaryToken;
    const amountInWei = parseUnits(params.amount, tokenInfo.decimals);
    const recipient = params.recipient || userAddress;

    console.log('🔍 [deposit] Deposit details:', {
      vaultAddress: params.vaultAddress,
      amount: params.amount,
      tokenSymbol: params.tokenSymbol,
      amountInWei: amountInWei.toString(),
      tokenInfo,
      recipient,
      isNative: tokenInfo.isNative
    });

    try {
      // Pre-write validation - ensure wallet is connected and on correct chain
      if (!userAddress) {
        console.error('❌ [deposit] User address not available');
        throw new Error('Wallet not connected properly');
      }
      
      if (chainId !== 1328) {
        console.error('❌ [deposit] Wrong network:', { currentChainId: chainId, expectedChainId: 1328 });
        throw new Error('Please switch to SEI Atlantic-2 testnet (Chain ID 1328)');
      }
      
      console.log('✅ [deposit] Pre-write validation passed:', {
        userAddress,
        chainId,
        vaultAddress: params.vaultAddress
      });
      
      // Debug ABI availability
      console.log('🔍 [deposit] ABI Debug:', {
        abiLength: SEIVault.abi.length,
        hasSeiOptimizedDeposit: SEIVault.abi.some(item => 
          item.type === 'function' && item.name === 'seiOptimizedDeposit'
        ),
        availableFunctions: SEIVault.abi
          .filter(item => item.type === 'function')
          .map(item => item.name)
          .slice(0, 5) // Show first 5 functions
      });
      
      // Determine if this is a native SEI vault or ERC20 vault
      const isNativeVault = isNativeSEIVault(vaultData);
      
      console.log('🔍 [deposit] Vault type determination:', {
        isNativeVault,
        tokenIsNative: tokenInfo.isNative,
        vaultData,
        willSendValue: tokenInfo.isNative && isNativeVault
      });
      
      if (tokenInfo.isNative && isNativeVault) {
        // Native SEI deposit to a native SEI vault
        console.log('💰 [deposit] Executing native SEI deposit with msg.value');
        console.log('📋 [deposit] Contract call params:', {
          address: params.vaultAddress,
          functionName: 'seiOptimizedDeposit',
          args: [amountInWei.toString(), recipient],
          value: amountInWei.toString()
        });
        
        try {
          // Add a small delay to ensure wallet is ready
          await new Promise(resolve => setTimeout(resolve, 100));
          
          console.log('🚀 [deposit] About to call writeContract...');
          console.log('🔍 [deposit] writeContract parameters:', {
            address: params.vaultAddress,
            functionName: 'seiOptimizedDeposit',
            argsTypes: [typeof amountInWei, typeof recipient],
            args: [amountInWei.toString(), recipient],
            value: amountInWei.toString(),
            userAddress,
            chainId
          });
          
          // Test if the contract address is valid
          if (!params.vaultAddress || params.vaultAddress.length !== 42) {
            throw new Error(`Invalid contract address: ${params.vaultAddress}`);
          }
          
          // Check if wallet is actually connected
          if (!userAddress || userAddress === '0x') {
            throw new Error(`Invalid user address: ${userAddress}`);
          }
          
          console.log('🔍 [deposit] Validation passed, proceeding with writeContract...');
          
          // Call writeContract and wait a moment to see if state changes
          writeContract({
            address: params.vaultAddress as `0x${string}`,
            abi: SEIVault.abi,
            functionName: 'seiOptimizedDeposit',
            args: [amountInWei, recipient as `0x${string}`],
            value: amountInWei // Send SEI as value for native deposits
          });
          
          console.log('✅ [deposit] writeContract function called');
          
          // Immediate state check
          console.log('🔍 [deposit] Immediate state after writeContract:', {
            isPending,
            hash,
            error: error?.message,
            isSuccess,
            isError
          });
          
          // Wait and check if the state changed
          setTimeout(() => {
            console.log('🔍 [deposit] State check after 1s:', {
              isPending,
              hash,
              error: error?.message,
              isSuccess,
              isError
            });
          }, 1000);
          
          // Another check after longer delay
          setTimeout(() => {
            console.log('🔍 [deposit] State check after 3s:', {
              isPending,
              hash,
              error: error?.message,
              isSuccess,
              isError
            });
          }, 3000);
          
        } catch (writeError) {
          console.error('❌ [deposit] writeContract failed:', writeError);
          throw writeError;
        }
      } else if (!tokenInfo.isNative && !isNativeVault) {
        // ERC20 token deposit to an ERC20 vault - requires prior approval
        console.log('🏦 [deposit] Executing ERC20 deposit (requires approval)');
        console.log('📋 [deposit] Contract call params:', {
          address: params.vaultAddress,
          functionName: 'seiOptimizedDeposit',
          args: [amountInWei.toString(), recipient],
          value: '0'
        });
        
        try {
          const result = writeContract({
            address: params.vaultAddress as `0x${string}`,
            abi: SEIVault.abi,
            functionName: 'seiOptimizedDeposit',
            args: [amountInWei, recipient as `0x${string}`]
            // No value for ERC20 deposits
          });
          
          console.log('✅ [deposit] ERC20 writeContract called, result:', result);
        } catch (writeError) {
          console.error('❌ [deposit] writeContract failed:', writeError);
          throw writeError;
        }
      } else {
        // Mismatched vault and token types
        const errorMsg = isNativeVault 
          ? 'This vault only accepts native SEI deposits'
          : `This vault only accepts ERC20 tokens, not native SEI`;
        console.error('❌ [deposit] Vault/token type mismatch:', {
          isNativeVault,
          tokenIsNative: tokenInfo.isNative,
          errorMsg
        });
        throw new Error(errorMsg);
      }

      console.log('⏳ [deposit] Returning pending status');
      return 'pending';
    } catch (err) {
      console.error('[useEnhancedVaultDeposit] Deposit error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      
      addNotification({
        type: 'error',
        title: 'Deposit Failed',
        message: errorMessage
      });
      
      throw err;
    }
  };

  /**
   * Get deposit information for UI
   */
  const getDepositInfo = () => {
    return {
      vaultName: vaultData.name,
      primaryToken,
      tokenRequirements,
      userBalance: {
        amount: userBalance.balance,
        formatted: userBalance.formatted,
        isLoading: userBalance.isLoading
      },
      supportsNativeSEI: vaultAcceptsNativeSEI(vaultData),
      requiresBothTokens: tokenRequirements.requiresBothTokens
    };
  };

  return {
    // Main functions
    deposit,
    approveToken,
    validateDeposit,
    reset,
    
    // Deposit info
    getDepositInfo,
    
    // Transaction state
    hash,
    error,
    isPending,
    isSuccess,
    isError,
    
    // Balance info
    userBalance,
    
    // Helper to invalidate queries
    invalidateQueries: () => {
      queryClient.invalidateQueries({ queryKey: VAULT_QUERY_KEYS.detail(vaultData.address) });
      queryClient.invalidateQueries({ queryKey: VAULT_QUERY_KEYS.lists() });
    }
  };
}