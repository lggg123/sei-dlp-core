"use client"

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { useDepositToVault } from '@/hooks/useVaults';

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

const getRiskLevel = (apy: number): 'Low' | 'Medium' | 'High' => {
  if (apy < 15) return 'Low'
  if (apy < 25) return 'Medium'
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

  const mutationOptions = React.useMemo(() => ({
    onSuccess: (data: any) => {
      console.log('[DepositModal] Deposit mutation successful:', data);
      setDepositAmount('');
      if (onSuccess && (data as { txHash?: string })?.txHash) {
        onSuccess((data as { txHash: string }).txHash);
      }
      onClose(); // Close modal on success
    },
    onError: (error: any) => {
      console.error('[DepositModal] Deposit mutation error:', error);
      // Here you could set an error state to show in the UI
      // For now, we just log it. The modal remains open for the user to retry.
    },
  }), [onSuccess, onClose]);

  const depositMutation = useDepositToVault(mutationOptions);

  // Debug logging moved to useEffect to prevent render loops
  useEffect(() => {
    console.log('[DepositModal] Component render with props:', {
      vaultExists: !!vault,
      vaultName: vault?.name || 'NO VAULT',
      vaultStrategy: vault?.strategy || 'NO STRATEGY',
      vaultAddress: vault?.address || 'NO ADDRESS',
      isOpen,
      propsReceived: { vault: !!vault, isOpen, onClose: !!onClose, onSuccess: !!onSuccess }
    });
    
    if (vault) {
      console.log('[DepositModal] Full vault data received:', vault);
    }
  }, [vault, isOpen, onClose, onSuccess]);

  // Add effect to track when the modal should be opening + handle body scroll
  useEffect(() => {
    if (isOpen) {
      if (vault) {
        console.log('[DepositModal] Modal should be opening now for vault:', vault.name);
        // Lock body scroll on mobile
        document.body.style.overflow = 'hidden';
        document.body.style.position = 'fixed';
        document.body.style.width = '100%';
      } else {
        console.error('[DepositModal] ERROR: Modal is open but vault is null!');
      }
    } else {
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
    };
  }, [isOpen, vault]);

  // Don't render if vault is null or modal is not open
  if (!isOpen || !vault) {
    return null;
  }

  const vaultColor = getVaultColor(vault.strategy);
  const riskLevel = getRiskLevel(vault.apy);
  const isValidAmount = depositAmount && parseFloat(depositAmount) > 0;

  const handleDeposit = () => {
    if (!isValidAmount || !vault) return;

    console.log('[DepositModal] Initiating deposit via mutation:', {
      amount: depositAmount,
      vaultAddress: vault.address,
    });

    depositMutation.mutate({
      vaultAddress: vault.address,
      amount: depositAmount,
    });
  };

  const handleClose = () => {
    console.log('[DepositModal] handleClose called');
    setDepositAmount('');
    onClose();
  };
  
  console.log('[DepositModal] RENDERING MODAL NOW - isOpen:', isOpen, 'vault:', vault?.name);
  
  return (
    <div 
      className="fixed flex items-center justify-center p-4"
      style={{ 
        backgroundColor: 'rgba(0, 0, 0, 0.9)', // Darker backdrop for better visibility
        zIndex: 10000, // Use inline style for maximum priority
        top: 0,
        left: 0, 
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh',
        minHeight: '100vh', // Safari fallback
        position: 'fixed',
        overflow: 'auto' // Allow scrolling if needed
      }}
      onClick={(e) => {
        console.log('[DepositModal] Backdrop clicked');
        if (e.target === e.currentTarget) {
          handleClose();
        }
      }}
    >
      <div 
        className="w-full max-w-md p-6 rounded-lg shadow-2xl"
        style={{
          backgroundColor: '#1a1a1a',
          border: '3px solid #00f5d4', // Make border even more visible
          maxHeight: '80vh', // Reduced for mobile
          overflow: 'auto',
          zIndex: 10001, // Ensure modal content is above backdrop
          position: 'relative',
          margin: '20px', // Add margin for mobile
          boxShadow: '0 20px 60px rgba(0, 245, 212, 0.3), 0 0 0 1px rgba(255,255,255,0.1)' // Enhanced visibility
        }}
        onClick={(e) => {
          console.log('[DepositModal] Modal content clicked - preventing propagation');
          e.stopPropagation();
        }}
      >
            <h2 className="text-2xl font-bold text-center mb-4">Deposit to {vault.name}</h2>
            
            <div className="space-y-4">
              <div className="text-center">
                <div className="text-lg font-bold" style={{ color: vaultColor }}>
                  {(vault.apy * 100).toFixed(1)}% APY
                </div>
                <div className="text-sm text-muted-foreground">
                  {vault.strategy.replace('_', ' ').toUpperCase()} • {formatCurrency(vault.tvl)} TVL • {riskLevel} Risk
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="deposit-amount">Amount (USD)</Label>
                <Input
                  id="deposit-amount"
                  type="number"
                  placeholder="Enter amount..."
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                />
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={handleClose}
                  className="flex-1"
                  disabled={depositMutation.isPending}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleDeposit}
                  disabled={!isValidAmount || depositMutation.isPending}
                  className="flex-1"
                >
                  {depositMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Processing...
                    </>
                  ) : (
                    'Confirm Deposit'
                  )}
                </Button>
              </div>
            </div>
      </div>
    </div>
  );
}
