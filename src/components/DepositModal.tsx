"use client"

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Loader2, DollarSign, TrendingUp, Shield, AlertTriangle } from 'lucide-react';
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
  onSuccess?: (txHash: string) => void;
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
  }
  return colors[strategy as keyof typeof colors] || '#00f5d4'
}

export default function DepositModal({ vault, isOpen, onClose, onSuccess }: DepositModalProps) {
  const [depositAmount, setDepositAmount] = useState('');
  const depositMutation = useDepositToVault();

  if (!vault) return null;

  const vaultColor = getVaultColor(vault.strategy);
  const riskLevel = getRiskLevel(vault.apy);
  const isValidAmount = depositAmount && parseFloat(depositAmount) > 0;

  const handleDeposit = async () => {
    if (!isValidAmount) return;
    
    try {
      const result = await depositMutation.mutateAsync({
        vaultAddress: vault.address,
        amount: depositAmount
      });
      
      setDepositAmount('');
      onClose();
      
      if (onSuccess && result?.txHash) {
        onSuccess(result.txHash);
      }
    } catch (error) {
      console.error('Deposit error:', error);
    }
  };

  const handleClose = () => {
    setDepositAmount('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md glass-card border-primary/20">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center mb-2">
            Deposit to {vault.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Vault Summary */}
          <div className="rounded-lg border border-primary/20 p-4 space-y-3"
               style={{ 
                 background: `linear-gradient(135deg, ${vaultColor}15, ${vaultColor}05)`,
                 borderColor: `${vaultColor}40`
               }}>
            <div className="flex justify-between items-center">
              <div className="space-y-1">
                <div className="text-2xl font-bold" style={{ color: vaultColor }}>
                  {(vault.apy * 100).toFixed(1)}% APY
                </div>
                <div className="text-sm text-muted-foreground">
                  {vault.strategy.replace('_', ' ').toUpperCase()}
                </div>
              </div>
              <div className="text-right space-y-1">
                <div className="text-lg font-bold">{formatCurrency(vault.tvl)}</div>
                <div className="text-sm text-muted-foreground">TVL</div>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <Badge className={`${
                riskLevel === 'Low' ? 'bg-green-500/20 text-green-300 border-green-500/50' :
                riskLevel === 'Medium' ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/50' :
                'bg-red-500/20 text-red-300 border-red-500/50'
              }`}>
                <Shield className="w-3 h-3 mr-1" />
                {riskLevel} Risk
              </Badge>
              <div className="text-sm text-muted-foreground">
                {vault.tokenA}-{vault.tokenB} pair
              </div>
            </div>
          </div>

          {/* Amount Input */}
          <div className="space-y-3">
            <Label htmlFor="deposit-amount" className="text-base font-medium flex items-center">
              <DollarSign className="w-4 h-4 mr-2" />
              Deposit Amount (USD)
            </Label>
            <Input
              id="deposit-amount"
              type="number"
              placeholder="0.00"
              value={depositAmount}
              onChange={(e) => setDepositAmount(e.target.value)}
              className="text-lg h-12 glass-input"
              min="0"
              step="0.01"
            />
            
            {/* Quick Amount Buttons */}
            <div className="flex gap-2">
              {['100', '500', '1000', '5000'].map((amount) => (
                <Button
                  key={amount}
                  variant="outline"
                  size="sm"
                  className="flex-1 text-xs"
                  onClick={() => setDepositAmount(amount)}
                >
                  ${amount}
                </Button>
              ))}
            </div>
          </div>

          {/* Estimated Returns */}
          {isValidAmount && (
            <div className="rounded-lg bg-muted/50 p-4 space-y-2">
              <div className="flex items-center text-sm font-medium">
                <TrendingUp className="w-4 h-4 mr-2 text-green-400" />
                Estimated Annual Return
              </div>
              <div className="text-2xl font-bold text-green-400">
                ${(parseFloat(depositAmount) * vault.apy).toFixed(2)}
              </div>
              <div className="text-xs text-muted-foreground">
                Based on current {(vault.apy * 100).toFixed(1)}% APY
              </div>
            </div>
          )}

          {/* Risk Warning */}
          <div className="flex items-start space-x-2 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
            <AlertTriangle className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-yellow-300">
              <div className="font-medium mb-1">Risk Disclaimer</div>
              <div>
                DeFi investments carry inherent risks including impermanent loss, smart contract vulnerabilities, and market volatility. Only invest what you can afford to lose.
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={handleClose}
              className="flex-1 h-12"
              disabled={depositMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleDeposit}
              disabled={!isValidAmount || depositMutation.isPending}
              className="flex-1 h-12 font-bold"
              style={{
                background: isValidAmount 
                  ? `linear-gradient(135deg, ${vaultColor}, ${vaultColor}DD)` 
                  : undefined,
                color: isValidAmount ? '#000' : undefined,
              }}
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
      </DialogContent>
    </Dialog>
  );
}