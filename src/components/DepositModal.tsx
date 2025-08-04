"use client"

import React, { useState } from 'react';
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
    return `$${(amount / 1000000).toFixed(1)}M`
  }
  if (amount >= 1000) {
    return `$${(amount / 1000).toFixed(0)}K`
  }
  return `$${amount.toFixed(0)}`
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
  const depositMutation = useDepositToVault();

  // Debug all props on every render
  console.log('[DepositModal] Component render with props:', {
    vaultExists: !!vault,
    vaultName: vault?.name || 'NO VAULT',
    vaultStrategy: vault?.strategy || 'NO STRATEGY',
    vaultAddress: vault?.address || 'NO ADDRESS',
    isOpen,
    propsReceived: { vault: !!vault, isOpen, onClose: !!onClose, onSuccess: !!onSuccess }
  });

  // Log the entire vault object when it exists
  if (vault) {
    console.log('[DepositModal] Full vault data received:', vault);
  }

  // Add effect to track when the modal should be opening - must be before early return
  React.useEffect(() => {
    if (isOpen && vault) {
      console.log('[DepositModal] Modal should be opening now for vault:', vault.name);
    }
    if (isOpen && !vault) {
      console.error('[DepositModal] ERROR: Modal is open but vault is null!');
    }
  }, [isOpen, vault]);

  // Don't render if vault is null
  if (!vault) {
    console.log('[DepositModal] Vault is null, not rendering modal overlay');
    return null;
  }

  console.log('[DepositModal] Rendering with:', { vault: vault.name, isOpen });

  const vaultColor = getVaultColor(vault.strategy);
  const riskLevel = getRiskLevel(vault.apy);
  const isValidAmount = depositAmount && parseFloat(depositAmount) > 0;

  const handleDeposit = async () => {
    if (!isValidAmount) return;
    
    try {
      console.log('[DepositModal] Starting deposit:', { amount: depositAmount, vault: vault.address });
      
      const result = await depositMutation.mutateAsync({
        vaultAddress: vault.address,
        amount: depositAmount
      });
      
      setDepositAmount('');
      onClose();
      
      if (onSuccess && (result as { txHash?: string })?.txHash) {
        onSuccess((result as { txHash: string }).txHash);
      }
    } catch (error) {
      console.error('Deposit error:', error);
    }
  };

  const handleClose = () => {
    setDepositAmount('');
    onClose();
  };

  // Mobile-friendly modal for iPad/Codespaces
  if (!isOpen) return null;
  
  console.log('[DepositModal] About to render modal overlay');
  
  return (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      style={{ 
        backgroundColor: 'rgba(0, 0, 0, 0.8)' // Semi-transparent black backdrop
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
          border: '2px solid #333',
          maxHeight: '90vh',
          overflow: 'auto'
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