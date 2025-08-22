"use client"

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Loader2, ArrowRight, Info, Shield, TrendingUp, Coins, Vault, DollarSign, Percent, CheckCircle2, Zap } from 'lucide-react';
import { useEnhancedVaultDeposit } from '@/hooks/useEnhancedVaultDeposit';
import { 
  getTokenRequirementText, 
  getPrimaryDepositToken
} from '@/utils/tokenUtils';
import { useRouter } from 'next/navigation';
import { useAccount } from 'wagmi';

interface VaultData {
  address: string;
  name: string;
  apy: number;
  tvl: number;
  strategy: string;
  tokenA: string;
  tokenB: string;
  fee: number;
  performance: {
    totalReturn: number;
    sharpeRatio: number;
    maxDrawdown: number;
    winRate: number;
  };
}

interface DepositModalProps {
  vault: VaultData | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (txHash: string) => void;
}

const formatCurrency = (amount: number) => {
  if (amount >= 1000000) {
    return `${(amount / 1000000).toFixed(1)}M`
  }
  if (amount >= 1000) {
    return `${(amount / 1000).toFixed(0)}K`
  }
  return `${amount.toFixed(0)}`
}

const getRiskLevel = (apy: number, strategy?: string): 'Low' | 'Medium' | 'High' => {
  const apyPercentage = apy * 100; // Convert decimal to percentage
  
  // Strategy-based risk adjustments
  const strategyRiskModifier = {
    'stable_max': -5,          // Stablecoin strategies are less risky
    'concentrated_liquidity': 5, // Concentrated liquidity has impermanent loss risk
    'arbitrage': 3,            // Arbitrage has execution risk
    'yield_farming': 2,        // Standard farming risk
    'hedge': 0,                // Hedge strategies are balanced
    'sei_hypergrowth': 8,      // High growth = high risk
    'blue_chip': -2,           // Blue chip assets are safer
    'delta_neutral': -3        // Delta neutral strategies reduce market risk
  };
  
  const modifier = strategy ? (strategyRiskModifier[strategy as keyof typeof strategyRiskModifier] || 0) : 0;
  const adjustedApy = apyPercentage + modifier;
  
  if (adjustedApy < 15) return 'Low'
  if (adjustedApy < 25) return 'Medium'
  return 'High'
}

const getVaultColor = (strategy: string) => {
  const colors = {
    concentrated_liquidity: '#00f5d4',
    yield_farming: '#9b5de5',
    arbitrage: '#ff206e',
    hedge: '#ffa500',
    stable_max: '#10b981',
    sei_hypergrowth: '#f59e0b',
    blue_chip: '#3b82f6',
    delta_neutral: '#8b5cf6',
  }
  return colors[strategy as keyof typeof colors] || '#00f5d4'
}

export default function DepositModal({ vault, isOpen, onClose, onSuccess }: DepositModalProps) {
  const [depositAmount, setDepositAmount] = useState('');
  const [transactionStatus, setTransactionStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle');
  const [transactionHash, setTransactionHash] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [pendingTimeout, setPendingTimeout] = useState<NodeJS.Timeout | null>(null);
  // Get actual wallet connection
  const { address, isConnected } = useAccount();
  
  // Debug wallet connection
  useEffect(() => {
    console.log('🔗 [DepositModal] Wallet connection status:', {
      address,
      isConnected,
      addressType: typeof address
    });
  }, [address, isConnected]);
  
  const router = useRouter();
  
  // State for selected deposit token
  const [selectedToken, setSelectedToken] = useState<string>('');

  // Memoize vault data to prevent unnecessary re-creations and re-renders
  const vaultData = useMemo(() => {
    // Only use real vault data, no fallback to prevent hydration issues
    if (vault && vault.address && vault.tokenA && vault.tokenB && vault.strategy) {
      console.log('✅ [DepositModal] Using real vault data:', vault);
      return {
        address: vault.address,
        tokenA: vault.tokenA,
        tokenB: vault.tokenB,
        strategy: vault.strategy,
        name: vault.name
      };
    }
    
    // Return null if no valid vault - component will not render
    console.log('❌ [DepositModal] No valid vault data available');
    return null;
  }, [vault?.address, vault?.tokenA, vault?.tokenB, vault?.strategy, vault?.name]);
  
  const depositMutation = useEnhancedVaultDeposit(vaultData || {
    address: '',
    tokenA: 'SEI', 
    tokenB: 'USDC',
    strategy: 'stable_max',
    name: 'Default Vault'
  });
  
  // Memoize computed values to prevent excessive re-computations
  const depositInfo = useMemo(() => {
    return vault ? depositMutation.getDepositInfo() : null;
  }, [vault, depositMutation.getDepositInfo]);

  const primaryToken = useMemo(() => {
    return (vault && vault.tokenA && vault.tokenB && vault.strategy) ? getPrimaryDepositToken(vault) : null;
  }, [vault?.tokenA, vault?.tokenB, vault?.strategy]);

  const requirementText = useMemo(() => {
    return (vault && vault.tokenA && vault.tokenB && vault.strategy) ? getTokenRequirementText(vault) : 'Token requirements unavailable';
  }, [vault?.tokenA, vault?.tokenB, vault?.strategy]);
  
  // Get current user balance for the primary deposit token
  const currentUserBalance = depositInfo ? depositInfo.userBalance : { amount: 0, formatted: '0', isLoading: false };
  
  // Update selected token when vault changes - optimize to prevent excessive calls
  useEffect(() => {
    if (primaryToken?.symbol && !selectedToken) {
      console.log('🔧 [DepositModal] Setting selected token to:', primaryToken.symbol);
      setSelectedToken(primaryToken.symbol);
    }
  }, [primaryToken?.symbol, selectedToken]);
  
  // Define handleClose function early to avoid hoisting issues
  const handleClose = useCallback(() => {
    // Clear any pending timeouts
    if (pendingTimeout) {
      clearTimeout(pendingTimeout);
      setPendingTimeout(null);
    }
    
    // Reset wagmi transaction state
    console.log('🔄 [DepositModal] Resetting transaction state on close');
    depositMutation.reset();
    
    setDepositAmount('');
    setTransactionStatus('idle');
    setTransactionHash(null);
    setErrorMessage(null);
    onClose();
  }, [onClose, pendingTimeout, depositMutation]);

  // Watch for transaction pending state - prevent infinite loops and add timeout
  useEffect(() => {
    if (depositMutation.isPending && transactionStatus !== 'pending') {
      console.log('⏳ [DepositModal] Transaction pending state detected');
      setTransactionStatus('pending');
      setTransactionHash(null);
      setErrorMessage(null);

      // Set a timeout to prevent getting stuck in pending state
      const timeout = setTimeout(() => {
        console.warn('⚠️ [DepositModal] Transaction timeout - resetting to idle state');
        
        // Reset wagmi state on timeout
        depositMutation.reset();
        
        setTransactionStatus('error');
        setErrorMessage('Transaction timed out. Please try again.');
      }, 60000); // 60 seconds timeout

      setPendingTimeout(timeout);
    } else if (!depositMutation.isPending && pendingTimeout) {
      // Clear timeout if transaction is no longer pending
      clearTimeout(pendingTimeout);
      setPendingTimeout(null);
    }
  }, [depositMutation.isPending, transactionStatus, pendingTimeout]);

  // Watch for transaction success
  useEffect(() => {
    if (depositMutation.isSuccess && depositMutation.hash && transactionStatus !== 'success') {
      console.log('[DepositModal] Transaction successful:', depositMutation.hash);
      setTransactionHash(depositMutation.hash);
      setTransactionStatus('success');
      
      // Invalidate queries and show success notification
      depositMutation.invalidateQueries();
      onSuccess(depositMutation.hash);
      
      // Reset deposit amount but keep modal open to show success
      setDepositAmount('');

      // CRITICAL: Refetch balance after successful transaction with delay
      setTimeout(() => {
        depositMutation.userBalance.refetch();
      }, 2000); // Wait 2 seconds for blockchain state to update

      // Give user time to see the success message before redirecting
      setTimeout(() => {
        if (vault) {
          router.push(`/vault?address=${vault.address}&tab=overview`);
        }
        handleClose();
      }, 3000);
    }
  }, [depositMutation.isSuccess, depositMutation.hash, transactionStatus, vault, router, onSuccess, handleClose, depositMutation.userBalance]);

  // Watch for transaction errors
  useEffect(() => {
    if (depositMutation.isError && depositMutation.error && transactionStatus !== 'error') {
      console.error('[DepositModal] Transaction failed:', depositMutation.error);
      
      // Handle specific error cases
      const error = depositMutation.error;
      let errorMessage = 'Unknown error occurred';
      
      if (error.message.includes('user rejected transaction')) {
        errorMessage = 'Transaction was rejected by the user';
      } else if (error.message.includes('insufficient funds')) {
        errorMessage = 'Insufficient funds for this transaction';
      } else if (error.message.includes('Insufficient balance')) {
        errorMessage = 'Your wallet balance is too low for this deposit';
      } else {
        errorMessage = error.message;
      }
      
      setErrorMessage(errorMessage);
      setTransactionStatus('error');
    }
  }, [depositMutation.isError, depositMutation.error, transactionStatus]);

  // Add effect to track when the modal should be opening + handle body scroll
  useEffect(() => {
    if (isOpen) {
      if (vault) {
        console.log('✅ [DepositModal] Modal opened for vault:', {
          name: vault.name,
          address: vault.address,
          strategy: vault.strategy,
          tokenA: vault.tokenA,
          tokenB: vault.tokenB
        });
        // Lock body scroll on mobile
        document.body.style.overflow = 'hidden';
        document.body.style.position = 'fixed';
        document.body.style.width = '100%';
      } else {
        console.error('❌ [DepositModal] ERROR: Modal is open but vault is null!', {
          isOpen,
          vault: vault,
          vaultType: typeof vault
        });
      }
    } else {
      console.log('🛑 [DepositModal] Modal closed');
      // Unlock body scroll
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
    }

    // Cleanup on unmount
    return () => {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
      // Clear timeout on unmount
      if (pendingTimeout) {
        clearTimeout(pendingTimeout);
      }
    };
  }, [isOpen, vault, pendingTimeout]);

  // Don't render if vault is null or modal is not open
  if (!isOpen || !vault || !vault.address || !vaultData) {
    console.log('🚫 [DepositModal] Not rendering:', {
      isOpen,
      hasVault: !!vault,
      vaultAddress: vault?.address,
      vaultName: vault?.name,
      hasVaultData: !!vaultData
    });
    return null;
  }

  const vaultColor = getVaultColor(vault.strategy);
  const riskLevel = getRiskLevel(vault.apy, vault.strategy);
  const isValidAmount = depositAmount && parseFloat(depositAmount) > 0;

  // Enhanced handleDeposit function
  const handleDeposit = async () => {
    // Check wallet connection first
    if (!isConnected || !address) {
      console.warn('🔒 [DepositModal] Wallet not connected, aborting deposit');
      setErrorMessage('Please connect your wallet to continue');
      return;
    }
    
    console.log('▶️ [DepositModal] handleDeposit initiated', {
      depositAmount,
      selectedToken,
      isValidAmount,
      vaultName: vault?.name,
    });

    if (!isValidAmount || !vault || !selectedToken) {
      console.warn('⚠️ [DepositModal] Invalid deposit params, aborting', {
        isValidAmount,
        vault: !!vault,
        selectedToken: !!selectedToken,
      });
      return;
    }

    // Reset transaction state
    console.log('🔄 [DepositModal] Resetting transaction state to pending');
    
    // Clear any previous wagmi state
    depositMutation.reset();
    
    setTransactionStatus('pending');
    setTransactionHash(null);
    setErrorMessage(null);

    try {
      // Validate the deposit using enhanced validation
      const validation = depositMutation.validateDeposit({
        amount: depositAmount,
        tokenSymbol: selectedToken,
        vaultAddress: vault.address,
        recipient: address
      });

      if (!validation.isValid) {
        throw new Error(validation.error);
      }

      // Show warnings if any
      if (validation.warnings && validation.warnings.length > 0) {
        console.warn('[DepositModal] Deposit warnings:', validation.warnings);
      }

      // Execute the deposit
      await depositMutation.deposit({
        amount: depositAmount,
        tokenSymbol: selectedToken,
        vaultAddress: vault.address,
        recipient: address
      });
      
      console.log('[DepositModal] Transaction initiated, waiting for blockchain confirmation');
    } catch (error) {
      console.error('[DepositModal] Deposit initiation error:', error);
      
      // Handle immediate errors (validation, wallet issues, etc.)
      if (error instanceof Error) {
        let userFriendlyMessage = error.message;
        
        if (error.message.includes('user rejected transaction')) {
          userFriendlyMessage = 'Transaction was rejected by the user';
        } else if (error.message.includes('insufficient funds')) {
          userFriendlyMessage = 'Insufficient funds for this transaction';
        } else if (error.message.includes('Insufficient balance')) {
          userFriendlyMessage = 'Your wallet balance is too low for this deposit';
        }
        
        setErrorMessage(userFriendlyMessage);
      } else {
        setErrorMessage('Failed to initiate transaction');
      }
      
      setTransactionStatus('error');
    }
  };
  
  return (
    <>
      <style jsx>{`
        @keyframes modalEnter {
          from {
            opacity: 0;
            transform: scale(0.9) translateY(20px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-8px) rotate(2deg); }
        }
        
        @keyframes slideRight {
          0%, 100% { transform: translateX(0px); opacity: 0.6; }
          50% { transform: translateX(4px); opacity: 1; }
        }
        
        @keyframes textGlow {
          0% { 
            textShadow: 0 0 30px ${vaultColor}40, 0 4px 8px rgba(0,0,0,0.4);
            filter: brightness(1);
          }
          100% { 
            textShadow: 0 0 40px ${vaultColor}60, 0 4px 8px rgba(0,0,0,0.4);
            filter: brightness(1.1);
          }
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 0.2; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(1.02); }
        }
        
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        /* ULTIMATE MODAL WIDTH OVERRIDE - All possible constraints */
        html, body {
          max-width: none !important;
        }
        
        /* Reset any container constraints globally when modal is open */
        .deposit-modal-container ~ *,
        .deposit-modal-container ~ * *,
        .deposit-modal-container {
          max-width: none !important;
        }
        
        /* Target all possible CSS framework containers */
        .container,
        [class*="container"],
        [class*="max-w"],
        .max-w-xl,
        .max-w-2xl,
        .max-w-3xl,
        .max-w-4xl,
        .max-w-5xl,
        .max-w-6xl,
        .max-w-7xl {
          max-width: none !important;
        }
        
        /* ENHANCED MODAL SIZING - Force consistent width across all scenarios */
        .deposit-modal-container {
          width: 100vw !important;
          height: 100vh !important;
          position: fixed !important;
          top: 0 !important;
          left: 0 !important;
          right: 0 !important;
          bottom: 0 !important;
          z-index: 10000 !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          margin: 0 !important;
          padding: 20px !important;
          max-width: none !important;
          max-height: none !important;
          transform: none !important;
          box-sizing: border-box !important;
        }
        
        .deposit-modal-content {
          width: 920px !important;
          max-width: 920px !important;
          min-width: 320px !important;
          position: relative !important;
          margin: 0 !important;
          transform: none !important;
          left: auto !important;
          right: auto !important;
          top: auto !important;
          bottom: auto !important;
          box-sizing: border-box !important;
          flex-shrink: 0 !important;
        }
        
        /* Override any parent container constraints */
        html body .deposit-modal-container,
        html body .deposit-modal-container *,
        html body div.deposit-modal-container,
        html body div.deposit-modal-container * {
          max-width: none !important;
        }
        
        html body .deposit-modal-content,
        html body div.deposit-modal-content {
          max-width: 860px !important;
          width: 860px !important;
        }
        
        /* NUCLEAR OPTION: Ultimate width enforcement */
        .deposit-modal-container > .deposit-modal-content,
        div.deposit-modal-container > div.deposit-modal-content {
          width: 920px !important;
          max-width: 920px !important;
          min-width: 320px !important;
          flex: none !important;
          flex-basis: 920px !important;
          flex-grow: 0 !important;
          flex-shrink: 0 !important;
        }
        
        /* Override CSS framework utilities */
        body:has(.deposit-modal-container) .container {
          max-width: none !important;
        }
        
        /* Prevent Tailwind container class interference */
        .deposit-modal-container .container,
        .deposit-modal-container [class*="max-w-"],
        .deposit-modal-container [class*="w-"] {
          max-width: none !important;
          width: auto !important;
        }
        
        /* Restore modal content width specifically */
        .deposit-modal-container .deposit-modal-content {
          width: 920px !important;
          max-width: 920px !important;
        }
        
        /* Responsive handling for smaller screens - Enhanced */
        @media (max-width: 960px) {
          .deposit-modal-container {
            padding: 15px !important;
          }
          .deposit-modal-content {
            width: calc(100vw - 30px) !important;
            max-width: calc(100vw - 30px) !important;
            min-width: 300px !important;
          }
        }
        
        @media (max-width: 360px) {
          .deposit-modal-container {
            padding: 10px !important;
          }
          .deposit-modal-content {
            width: calc(100vw - 20px) !important;
            max-width: calc(100vw - 20px) !important;
            min-width: 280px !important;
          }
        }
        
        /* Desktop size enforcement */
        @media (min-width: 961px) {
          .deposit-modal-content {
            width: 920px !important;
            max-width: 920px !important;
            min-width: 920px !important;
          }
        }
      `}</style>
      <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center deposit-modal-container"
      style={{
        position: 'fixed',
        top: '0',
        left: '0',
        right: '0',
        bottom: '0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        pointerEvents: 'auto',
        zIndex: 10000,
        width: '100vw',
        height: '100vh',
        margin: '0',
        padding: '20px',
        transform: 'none',
        boxSizing: 'border-box'
      }}
      onClick={(e) => {
        console.log('[DepositModal] Backdrop clicked');
        if (e.target === e.currentTarget) {
          handleClose();
        }
      }}
      data-testid="modal-backdrop"
    >
      <div 
        className="rounded-3xl shadow-2xl flex flex-col deposit-modal-content"
        style={{
          background: `linear-gradient(135deg, rgba(255, 255, 255, 0.12) 0%, rgba(255, 255, 255, 0.04) 100%)`,
          backdropFilter: 'blur(24px) saturate(180%)',
          border: `2px solid rgba(255, 255, 255, 0.15)`,
          borderTop: `3px solid ${vaultColor}60`,
          borderLeft: `1px solid ${vaultColor}20`,
          borderRight: `1px solid ${vaultColor}20`,
          maxHeight: 'calc(100vh - 40px)',
          height: 'auto',
          width: '640px',
          maxWidth: '640px',
          minWidth: '320px',
          zIndex: 10001,
          position: 'relative',
          margin: '0',
          boxShadow: `0 32px 80px ${vaultColor}20, 0 0 0 1px rgba(255,255,255,0.1), inset 0 1px 0 rgba(255,255,255,0.1)`,
          color: '#ffffff',
          borderRadius: '24px',
          transform: 'none',
          left: 'auto',
          right: 'auto',
          top: 'auto',
          bottom: 'auto',
          animation: 'modalEnter 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
          display: 'flex',
          flexDirection: 'column',
          boxSizing: 'border-box',
          flexShrink: 0
        }}
        onClick={(e) => {
          console.log('[DepositModal] Modal content clicked - preventing propagation');
          e.stopPropagation();
        }}
      >
        {/* Scrollable Content Area */}
        <div
          style={{
            flex: '1',
            overflow: 'auto',
            padding: '1rem 1.5rem 0 1.5rem', // Top and side padding only
            minHeight: '0' // Allow flex shrinking
          }}
        >
            {/* Enhanced Modal Header */}
            <div style={{
              background: `linear-gradient(135deg, ${vaultColor}08 0%, transparent 60%)`,
              borderRadius: '20px',
              padding: '1.5rem',
              position: 'relative',
              overflow: 'hidden',
              marginBottom: '1rem'
            }}>
              {/* Background Animation */}
              <div 
                style={{
                  position: 'absolute',
                  inset: '0',
                  opacity: '0.2',
                  background: `radial-gradient(ellipse at center, ${vaultColor}15 0%, transparent 70%)`,
                  animation: 'pulse 3s ease-in-out infinite'
                }}
              />
              
              {/* Icon Section */}
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                marginBottom: '1rem',
                position: 'relative'
              }}>
                <div 
                  style={{
                    background: `linear-gradient(135deg, ${vaultColor}20, ${vaultColor}10)`,
                    border: `2px solid ${vaultColor}40`,
                    borderRadius: '20px',
                    padding: '16px',
                    boxShadow: `0 0 40px ${vaultColor}30, 0 8px 24px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.2)`,
                    animation: 'float 2s ease-in-out infinite'
                  }}
                >
                  <Vault style={{ width: '32px', height: '32px', color: vaultColor }} />
                </div>
                <ArrowRight 
                  style={{ 
                    margin: '0 16px',
                    opacity: '0.6',
                    color: vaultColor,
                    animation: 'slideRight 2s ease-in-out infinite'
                  }} 
                />
                <div 
                  style={{
                    background: `linear-gradient(135deg, rgba(34, 197, 94, 0.2), rgba(34, 197, 94, 0.1))`,
                    border: '2px solid rgba(34, 197, 94, 0.4)',
                    borderRadius: '20px',
                    padding: '16px',
                    boxShadow: `0 0 40px rgba(34, 197, 94, 0.3), 0 8px 24px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.2)`,
                    animation: 'float 2s ease-in-out infinite 0.5s'
                  }}
                >
                  <TrendingUp style={{ width: '32px', height: '32px', color: '#22c55e' }} />
                </div>
              </div>

              {/* Enhanced Title */}
              <h2 
                style={{ 
                  fontSize: 'clamp(1.75rem, 4vw, 2.5rem)',
                  fontWeight: '900',
                  marginBottom: '1rem',
                  lineHeight: '1.2',
                  color: '#ffffff',
                  textShadow: `0 0 30px ${vaultColor}60, 0 4px 8px rgba(0,0,0,0.4), 0 2px 4px rgba(0,0,0,0.6)`,
                  letterSpacing: '-0.02em',
                  textAlign: 'center',
                  position: 'relative',
                  animation: 'textGlow 3s ease-in-out infinite alternate'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
                  <Shield style={{ 
                    width: '24px', 
                    height: '24px', 
                    color: vaultColor,
                    filter: 'drop-shadow(0 0 10px currentColor)'
                  }} />
                  Deposit to {vault.name}
                  <Coins style={{ 
                    width: '24px', 
                    height: '24px', 
                    color: vaultColor,
                    filter: 'drop-shadow(0 0 10px currentColor)',
                    animation: 'spin 4s linear infinite'
                  }} />
                </div>
              </h2>

              {/* Enhanced Subtitle */}
              <div style={{ textAlign: 'center' }}>
                <p 
                  style={{
                    fontSize: 'clamp(1rem, 2.5vw, 1.25rem)',
                    color: 'rgba(255, 255, 255, 0.9)',
                    marginBottom: '1rem',
                    fontWeight: '600',
                    letterSpacing: '0.5px',
                    textShadow: '0 2px 4px rgba(0,0,0,0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexWrap: 'wrap',
                    gap: '8px'
                  }}
                >
                  <DollarSign style={{ width: '20px', height: '20px', opacity: '0.8' }} />
                  Earn yield by providing liquidity to this vault
                  <Percent style={{ width: '20px', height: '20px', opacity: '0.8' }} />
                </p>
                
                {/* Trust Indicators */}
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  gap: '16px', 
                  fontSize: '0.875rem', 
                  opacity: '0.8',
                  flexWrap: 'wrap'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <CheckCircle2 style={{ width: '16px', height: '16px', color: '#22c55e' }} />
                    <span>Audited</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Shield style={{ width: '16px', height: '16px', color: '#3b82f6' }} />
                    <span>Secure</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Zap style={{ width: '16px', height: '16px', color: vaultColor }} />
                    <span>{(vault.apy * 100).toFixed(1)}% APY</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="space-y-4" style={{ color: '#ffffff' }}>
              {/* Transaction Flow Section */}
              <div className="transaction-flow-container mb-4">
                <div className="grid grid-cols-1 lg:grid-cols-[1fr_60px_1fr] gap-6 items-center">
                  
                  {/* You will deposit */}
                  <div className="transaction-side p-6 rounded-2xl" style={{
                    background: 'rgba(255, 255, 255, 0.08) !important',
                    border: '1px solid rgba(255, 255, 255, 0.12) !important',
                    backdropFilter: 'blur(8px) !important',
                    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.1) !important'
                  }}>
                    <h3 className="text-lg font-bold mb-4 opacity-90">You will deposit</h3>
                    <div className="amount-input-card relative">
                      <input
                        id="deposit-amount"
                        type="number"
                        placeholder="0.00"
                        value={depositAmount}
                        onChange={(e) => setDepositAmount(e.target.value)}
                        style={{
                          color: '#ffffff',
                          fontSize: '2rem',
                          fontWeight: '800',
                          textAlign: 'left',
                          backgroundColor: 'transparent',
                          border: 'none',
                          outline: 'none',
                          boxShadow: 'none',
                          width: '100%',
                          fontFamily: 'inherit',
                          padding: '0',
                          margin: '0'
                        }}
                      />
                      <span className="absolute right-0 top-1/2 -translate-y-1/2 text-xl font-bold opacity-80">{selectedToken || primaryToken?.symbol || 'SEI'}</span>
                    </div>
                    <div className="text-sm opacity-60 mt-2">Balance: {currentUserBalance.amount.toFixed(4)} {selectedToken || 'SEI'}</div>
                  </div>

                  {/* Arrow */}
                  <div className="flex justify-center">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{
                      backgroundColor: `${vaultColor}20`,
                      border: `1px solid ${vaultColor}40`
                    }}>
                      <ArrowRight className="w-6 h-6" style={{ color: vaultColor }} />
                    </div>
                  </div>

                  {/* You will receive */}
                  <div className="transaction-side p-6 rounded-2xl" style={{
                    background: 'rgba(255, 255, 255, 0.08) !important',
                    border: '1px solid rgba(255, 255, 255, 0.12) !important',
                    backdropFilter: 'blur(8px) !important',
                    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.1) !important'
                  }}>
                    <h3 className="text-lg font-bold mb-4 opacity-90">You will receive</h3>
                    <div style={{ marginBottom: '8px' }}>
                      <div style={{ 
                        color: vaultColor,
                        fontSize: '2rem',
                        fontWeight: '800',
                        marginBottom: '4px',
                        lineHeight: '1.2'
                      }}>
                        {depositAmount && parseFloat(depositAmount) > 0 
                          ? (parseFloat(depositAmount) * 0.95).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                          : '0.00'
                        }
                      </div>
                      <div style={{
                        color: '#ffffff',
                        fontSize: '1rem',
                        fontWeight: '600',
                        opacity: '0.9'
                      }}>{vault.name} Shares</div>
                    </div>
                    <div className="text-sm opacity-60 mt-2">Rate: 1 SEI = 0.95 shares</div>
                  </div>

                </div>
              </div>

              {/* Preset Amount Cards */}
              <div style={{ marginBottom: '16px' }}>
                <div style={{
                  display: 'block',
                  fontSize: '1rem',
                  fontWeight: '600',
                  marginBottom: '16px',
                  opacity: '0.9',
                  color: '#ffffff'
                }}>Quick deposit amounts</div>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '16px'
                }}
                className="lg:grid-cols-4">
                  {[1, 5, 10, 14.83].map((amount) => (
                    <button
                      key={amount}
                      onClick={() => setDepositAmount(amount.toString())}
                      style={{
                        background: depositAmount === amount.toString() 
                          ? `linear-gradient(135deg, ${vaultColor}20, ${vaultColor}10)` 
                          : 'rgba(255, 255, 255, 0.08)',
                        border: depositAmount === amount.toString() 
                          ? `2px solid ${vaultColor}` 
                          : '1px solid rgba(255, 255, 255, 0.12)',
                        backdropFilter: 'blur(8px)',
                        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.1)',
                        cursor: 'pointer',
                        padding: '16px',
                        borderRadius: '16px',
                        textAlign: 'left',
                        transition: 'all 0.2s ease',
                        width: '100%',
                        fontFamily: 'inherit',
                        display: 'block'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'scale(1.05)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'scale(1)';
                      }}
                    >
                      <div style={{
                        color: depositAmount === amount.toString() ? vaultColor : '#ffffff',
                        fontSize: '1.25rem',
                        fontWeight: '700',
                        marginBottom: '4px'
                      }}>
                        {amount} {selectedToken || primaryToken?.symbol || 'SEI'}
                      </div>
                      <div style={{
                        color: '#ffffff',
                        opacity: '0.6',
                        fontSize: '0.875rem'
                      }}>
                        ~{(amount * 0.95).toLocaleString()} shares
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Contract Limitation Warning */}
              <div style={{
                background: 'linear-gradient(135deg, rgba(255, 193, 7, 0.15), rgba(255, 193, 7, 0.08))',
                border: '1px solid rgba(255, 193, 7, 0.3)',
                backdropFilter: 'blur(12px)',
                borderRadius: '16px',
                padding: '16px',
                marginBottom: '16px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <Info style={{ width: '20px', height: '20px', color: '#ffc107' }} />
                  <span style={{ 
                    fontSize: '1rem', 
                    fontWeight: '700', 
                    color: '#ffffff',
                    textShadow: '0 1px 2px rgba(0,0,0,0.3)'
                  }}>Important Notice</span>
                </div>
                <p style={{
                  fontSize: '0.875rem',
                  color: 'rgba(255, 255, 255, 0.9)',
                  lineHeight: '1.5',
                  margin: '0 0 12px 0'
                }}>
                  <strong>Token Requirements:</strong> {requirementText}
                </p>
                <p style={{
                  fontSize: '0.875rem',
                  color: 'rgba(255, 255, 255, 0.9)',
                  lineHeight: '1.5',
                  margin: '0 0 12px 0'
                }}>
                  <strong>Your Balance:</strong> {currentUserBalance.amount.toFixed(4)} {primaryToken?.symbol || 'tokens'} 
                  {currentUserBalance.isLoading && ' (Loading...)'}
                </p>
                <p style={{
                  fontSize: '0.8rem',
                  color: 'rgba(255, 255, 255, 0.7)',
                  lineHeight: '1.4',
                  margin: '0'
                }}>
                  {primaryToken?.isNative 
                    ? 'This vault accepts native SEI deposits directly from your wallet.' 
                    : `This vault requires ${primaryToken?.symbol} tokens. Make sure you have sufficient ${primaryToken?.symbol} balance and approve token spending before depositing.`
                  }
                </p>
              </div>

              {/* Enhanced Yield Display */}
              <div style={{
                background: `linear-gradient(135deg, ${vaultColor}15, ${vaultColor}08)`,
                border: `1px solid ${vaultColor}30`,
                backdropFilter: 'blur(12px)',
                boxShadow: `inset 0 1px 0 rgba(255,255,255,0.1), 0 4px 20px ${vaultColor}10`,
                borderRadius: '16px',
                padding: '16px',
                position: 'relative',
                overflow: 'hidden'
              }}>
                {/* Background gradient accent */}
                <div style={{
                  position: 'absolute',
                  top: '0',
                  right: '0',
                  width: '100px',
                  height: '100px',
                  background: `radial-gradient(circle, ${vaultColor}20 0%, transparent 70%)`,
                  borderRadius: '50%',
                  transform: 'translate(30px, -30px)'
                }} />
                
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'between', position: 'relative' }}>
                  <div style={{ flex: '1' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <Info style={{ width: '20px', height: '20px', opacity: '0.7', color: vaultColor }} />
                      <span style={{ 
                        fontSize: '1.125rem', 
                        fontWeight: '700', 
                        opacity: '0.9', 
                        color: '#ffffff',
                        textShadow: '0 1px 2px rgba(0,0,0,0.3)'
                      }}>Annual Percentage Yield</span>
                    </div>
                    <div style={{ 
                      color: vaultColor,
                      textShadow: `0 0 20px ${vaultColor}40, 0 2px 4px rgba(0,0,0,0.4)`,
                      fontSize: '3rem',
                      fontWeight: '900',
                      lineHeight: '1',
                      letterSpacing: '-0.02em',
                      fontFamily: 'inherit'
                    }}>
                      {(vault.apy * 100).toFixed(1)}%
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', paddingLeft: '24px' }}>
                    <div style={{ 
                      fontSize: '0.875rem', 
                      opacity: '0.7', 
                      marginBottom: '4px',
                      color: '#ffffff',
                      fontWeight: '500'
                    }}>Expected daily</div>
                    <div style={{ 
                      color: vaultColor,
                      fontSize: '1.5rem',
                      fontWeight: '700',
                      textShadow: `0 0 10px ${vaultColor}30`
                    }}>
                      ~{((vault.apy / 365) * 100).toFixed(3)}%
                    </div>
                  </div>
                </div>
                
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between', 
                  marginTop: '12px', 
                  paddingTop: '12px', 
                  borderTop: '1px solid rgba(255,255,255,0.1)',
                  position: 'relative'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '20px', fontSize: '0.875rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Shield style={{ 
                        width: '16px', 
                        height: '16px', 
                        color: riskLevel === 'Low' ? '#22c55e' : riskLevel === 'Medium' ? '#f59e0b' : '#ef4444'
                      }} />
                      <span style={{ 
                        color: '#ffffff', 
                        fontWeight: '600',
                        textShadow: '0 1px 2px rgba(0,0,0,0.2)'
                      }}>{riskLevel} Risk</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <TrendingUp style={{ width: '16px', height: '16px', color: '#10b981' }} />
                      <span style={{ 
                        color: '#ffffff', 
                        fontWeight: '600',
                        textShadow: '0 1px 2px rgba(0,0,0,0.2)'
                      }}>{formatCurrency(vault.tvl)} TVL</span>
                    </div>
                  </div>
                  <div style={{ 
                    fontSize: '0.75rem', 
                    opacity: '0.6',
                    color: '#ffffff',
                    fontWeight: '500',
                    letterSpacing: '0.05em',
                    textTransform: 'uppercase'
                  }}>
                    {vault.strategy.replace('_', ' ')}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Transaction Status Section */}
          {(transactionStatus === 'pending' || transactionStatus === 'success' || transactionStatus === 'error') && (
            <div style={{
              padding: '1rem 1.5rem',
              background: 'rgba(0, 0, 0, 0.3)',
              backdropFilter: 'blur(8px)',
              borderTop: '1px solid rgba(255, 255, 255, 0.1)',
              margin: '1rem 0 0 0',
              borderRadius: '12px 12px 0 0',
            }}>
              {transactionStatus === 'pending' && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  color: '#ffffff',
                  fontWeight: '600',
                }}>
                  <Loader2 style={{ width: '20px', height: '20px' }} className="animate-spin" />
                  <span>Transaction is being processed...</span>
                </div>
              )}

              {transactionStatus === 'success' && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  color: '#22c55e',
                  fontWeight: '600',
                }}>
                  <CheckCircle2 style={{ width: '20px', height: '20px' }} />
                  <span>Transaction successful!</span>
                  {transactionHash && (
                    <span style={{ fontSize: '0.875rem', opacity: '0.8', marginLeft: '0.5rem' }}>
                      Hash: {transactionHash.substring(0, 6)}...{transactionHash.substring(transactionHash.length - 4)}
                    </span>
                  )}
                </div>
              )}

              {transactionStatus === 'error' && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  color: '#ef4444',
                  fontWeight: '600',
                }}>
                  <Info style={{ width: '20px', height: '20px' }} />
                  <span>Transaction failed</span>
                  {errorMessage && (
                    <span style={{ fontSize: '0.875rem', opacity: '0.8', marginLeft: '0.5rem' }}>
                      {errorMessage}
                    </span>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Fixed Action Buttons at Bottom */}
          <div
            style={{
              flexShrink: 0, // Don't shrink
              padding: '1rem 1.5rem 1.5rem 1.5rem', // Bottom and side padding
              background: 'linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.8) 80%, transparent 100%)',
              backdropFilter: 'blur(8px)',
              borderTop: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '0 0 24px 24px'
            }}
          >
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '16px'
            }}>
              <button
                onClick={handleClose}
                disabled={depositMutation.isPending || transactionStatus === 'pending'}
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  color: '#ffffff',
                  borderRadius: '16px',
                  backdropFilter: 'blur(8px)',
                  height: '56px',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.02)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                {transactionStatus === 'success' ? 'Close' : 'Cancel'}
              </button>
              <button
                onClick={transactionStatus === 'success' ? handleClose : handleDeposit}
                disabled={!isValidAmount || depositMutation.isPending || transactionStatus === 'pending'}
                style={{
                  background: `linear-gradient(135deg, ${vaultColor} 0%, ${vaultColor}dd 100%)`,
                  border: 'none',
                  color: '#000000',
                  borderRadius: '16px',
                  boxShadow: `0 12px 40px ${vaultColor}40, inset 0 1px 0 rgba(255,255,255,0.2)`,
                  height: '56px',
                  fontSize: '1rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.02)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                {depositMutation.isPending || transactionStatus === 'pending' ? (
                  <>
                    <Loader2 style={{ width: '20px', height: '20px' }} className="animate-spin" />
                    {transactionStatus === 'pending' ? 'Processing...' : 'Deposit Now'}
                  </>
                ) : transactionStatus === 'success' ? (
                  <>
                    <CheckCircle2 style={{ width: '20px', height: '20px', color: '#22c55e' }} />
                    Success!
                  </>
                ) : transactionStatus === 'error' ? (
                  <>
                    <Info style={{ width: '20px', height: '20px', color: '#ef4444' }} />
                    Error
                  </>
                ) : (
                  'Deposit Now'
                )}
              </button>
            </div>
          </div>
      </div>
    </div>
    </>
  );
}
