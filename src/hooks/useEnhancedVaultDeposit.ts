/**
 * Enhanced vault deposit hook that supports both native SEI and ERC20 token deposits
 */

import { useWriteContract, useAccount } from 'wagmi';
import { parseUnits, formatUnits } from 'viem';
import { useQueryClient } from '@tanstack/react-query';
import { useAppStore } from '@/stores/appStore';
import { VAULT_QUERY_KEYS } from './useVaults';
import { 
  getVaultTokenRequirements, 
  vaultAcceptsNativeSEI, 
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
  const { writeContract, data: hash, error, isPending, isSuccess, isError } = useWriteContract();
  const { address: userAddress } = useAccount();
  const queryClient = useQueryClient();
  const addNotification = useAppStore((state) => state.addNotification);

  // Validate vault data before using it
  const hasValidVaultData = vaultData.address && vaultData.tokenA && vaultData.tokenB && vaultData.strategy;

  // Get token requirements for this vault - only if vault data is valid
  const tokenRequirements = hasValidVaultData ? getVaultTokenRequirements(vaultData) : {
    primaryToken: { symbol: 'SEI', name: 'SEI', decimals: 18, isNative: true },
    secondaryToken: { symbol: 'USDC', name: 'USD Coin', decimals: 6, isNative: false, address: '0xD2D6BE5E318d5D4B3A03aFf4b7FfDA3d3f3a2a2a' },
    requiresBothTokens: false,
    supportsNativeSEI: true
  };
  const primaryToken = hasValidVaultData ? getPrimaryDepositToken(vaultData) : tokenRequirements.primaryToken;
  
  // Get user's balance for the primary token
  const userBalance = useTokenBalance(primaryToken.symbol);

  /**
   * Validate deposit parameters
   */
  const validateDeposit = (params: VaultDepositParams): DepositValidation => {
    if (!userAddress) {
      return { isValid: false, error: 'Wallet not connected' };
    }

    if (!params.vaultAddress || !params.amount || !params.tokenSymbol) {
      return { isValid: false, error: 'Missing required parameters' };
    }

    // Check if vault address is valid for testnet
    const validTestnetVaults = [
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

    if (!isValidVault) {
      return {
        isValid: false,
        error: `Vault address ${params.vaultAddress} is not deployed on SEI Atlantic-2 testnet (Chain ID 1328)`
      };
    }

    // Check if the token is supported by this vault
    const tokenSymbol = params.tokenSymbol.toUpperCase();
    const vaultTokenA = vaultData.tokenA.toUpperCase();
    const vaultTokenB = vaultData.tokenB.toUpperCase();

    if (tokenSymbol !== vaultTokenA && tokenSymbol !== vaultTokenB) {
      return {
        isValid: false,
        error: `This vault does not accept ${tokenSymbol}. It accepts ${vaultTokenA} and ${vaultTokenB}.`
      };
    }

    // Validate balance
    const balanceCheck = hasInsufficientBalance(
      params.amount,
      userBalance.balance,
      primaryToken
    );

    if (balanceCheck.insufficient) {
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
    if (!userAddress) {
      throw new Error('Wallet not connected');
    }

    // Validate deposit
    const validation = validateDeposit(params);
    if (!validation.isValid) {
      throw new Error(validation.error);
    }

    const tokenInfo = primaryToken;
    const amountInWei = parseUnits(params.amount, tokenInfo.decimals);
    const recipient = params.recipient || userAddress;

    console.log('[useEnhancedVaultDeposit] Initiating deposit:', {
      vaultAddress: params.vaultAddress,
      amount: params.amount,
      tokenSymbol: params.tokenSymbol,
      amountInWei: amountInWei.toString(),
      tokenInfo,
      isNative: tokenInfo.isNative
    });

    try {
      if (tokenInfo.isNative) {
        // Native SEI deposit - the contract should handle this properly
        // Check if vault has a native deposit function or if we need to use value
        if (vaultAcceptsNativeSEI(vaultData)) {
          console.log('[useEnhancedVaultDeposit] Executing native SEI deposit with value');
          
          writeContract({
            address: params.vaultAddress as `0x${string}`,
            abi: SEIVault.abi,
            functionName: 'seiOptimizedDeposit',
            args: [amountInWei, recipient as `0x${string}`],
            value: amountInWei // Send SEI as value for native deposits
          });
        } else {
          throw new Error('This vault does not support native SEI deposits');
        }
      } else {
        // ERC20 token deposit - requires prior approval
        console.log('[useEnhancedVaultDeposit] Executing ERC20 deposit (requires approval)');
        
        writeContract({
          address: params.vaultAddress as `0x${string}`,
          abi: SEIVault.abi,
          functionName: 'seiOptimizedDeposit',
          args: [amountInWei, recipient as `0x${string}`]
          // No value for ERC20 deposits
        });
      }

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