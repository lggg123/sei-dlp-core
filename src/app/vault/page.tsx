"use client"

import { useEffect, useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import Navigation from '@/components/Navigation';
import { ArrowLeft, TrendingUp, Activity, DollarSign, Shield, Target, BarChart3, Loader2 } from 'lucide-react';
import gsap from 'gsap';
import { useVaultStore } from '@/stores/vaultStore';
import { useVaults, useDepositToVault } from '@/hooks/useVaults';

// Utility functions
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

export default function VaultDetailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const cardRef = useRef<HTMLDivElement>(null);
  
  // Get vault address and tab from URL
  const vaultAddress = searchParams.get('address');
  const activeTab = searchParams.get('tab') || 'overview';
  const action = searchParams.get('action');
  
  // State
  const [depositAmount, setDepositAmount] = useState('');
  const [showDepositModal, setShowDepositModal] = useState(action === 'deposit');
  
  // Store and API hooks
  const { selectedVault, setSelectedVault, getVaultByAddress } = useVaultStore();
  const { data: vaultsData, isLoading } = useVaults();
  const depositMutation = useDepositToVault();
  
  // Get vault data
  const vault = selectedVault || (vaultAddress ? getVaultByAddress(vaultAddress) : null);
  
  useEffect(() => {
    if (vaultAddress && !vault && vaultsData) {
      // Find vault in data and set it
      const foundVault = vaultsData.find((v) => v.address === vaultAddress);
      if (foundVault) {
        setSelectedVault(foundVault);
      }
    }
  }, [vaultAddress, vault, vaultsData, setSelectedVault]);
  
  useEffect(() => {
    if (cardRef.current) {
      gsap.fromTo(cardRef.current, 
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.8, ease: "back.out(1.7)" }
      );
    }
  }, [vault]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-lg">Loading vault details...</p>
        </div>
      </div>
    );
  }

  if (!vault) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Vault Not Found</h1>
          <p className="text-muted-foreground mb-6">The requested vault could not be found.</p>
          <Button onClick={() => router.push('/vaults')}>
            Back to Vaults
          </Button>
        </div>
      </div>
    );
  }

  const vaultColor = getVaultColor(vault.strategy);
  const riskLevel = getRiskLevel(vault.apy);

  const handleDeposit = async () => {
    if (!depositAmount || parseFloat(depositAmount) <= 0) return;
    
    try {
      await depositMutation.mutateAsync({
        vaultAddress: vault.address,
        amount: depositAmount
      });
      setDepositAmount('');
      setShowDepositModal(false);
      // Show success message or update UI
    } catch (error) {
      console.error('Deposit failed:', error);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation variant="dark" showWallet={true} showLaunchApp={false} />
      
      <div className="pt-20 px-4">
        <div className="container mx-auto max-w-6xl">
          {/* Header */}
          <div className="mb-8">
            <Button 
              variant="ghost" 
              onClick={() => router.push('/vaults')}
              className="mb-4 text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Vaults
            </Button>
            
            <div ref={cardRef} className="vault-solid-card relative z-10">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
                <div>
                  <h1 className="text-4xl font-bold mb-2 text-enhanced-glow" style={{ color: vaultColor }}>
                    {vault.name}
                  </h1>
                  <p className="text-muted-foreground text-lg">
                    {vault.strategy.replace('_', ' ').toUpperCase()} • {vault.tokenA}-{vault.tokenB}
                  </p>
                </div>
                <div className="flex items-center gap-4 mt-4 lg:mt-0">
                  <Badge className={`px-4 py-2 text-sm ${
                    riskLevel === 'Low' ? 'bg-green-500/20 text-green-400' :
                    riskLevel === 'Medium' ? 'bg-yellow-500/20 text-yellow-400' :
                    'bg-red-500/20 text-red-400'
                  }`}>
                    {riskLevel} Risk
                  </Badge>
                  <Button 
                    size="lg"
                    className="btn-vault-primary h-14 px-8 text-lg"
                    onClick={() => setShowDepositModal(true)}
                    style={{
                      background: `linear-gradient(135deg, ${vaultColor}, ${vaultColor}DD)`,
                      color: '#000',
                    }}
                  >
                    Deposit Funds
                  </Button>
                </div>
              </div>

              {/* Key Metrics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-enhanced-glow" style={{ color: vaultColor }}>
                    {(vault.apy * 100).toFixed(1)}%
                  </div>
                  <div className="text-sm text-muted-foreground font-medium">APY</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-vault-primary">
                    {formatCurrency(vault.tvl)}
                  </div>
                  <div className="text-sm text-muted-foreground font-medium">TVL</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-400 text-enhanced-glow">
                    {(vault.performance.totalReturn * 100).toFixed(1)}%
                  </div>
                  <div className="text-sm text-muted-foreground font-medium">Total Return</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-secondary text-enhanced-glow">
                    {vault.performance.sharpeRatio.toFixed(2)}
                  </div>
                  <div className="text-sm text-muted-foreground font-medium">Sharpe Ratio</div>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={(value) => {
            const params = new URLSearchParams(searchParams.toString());
            params.set('tab', value);
            router.push(`/vault?${params.toString()}`);
          }}>
            <TabsList className="grid w-full grid-cols-3 mb-8">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
              <TabsTrigger value="strategy">Strategy</TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-6xl mx-auto">
                {/* Performance Metrics */}
                <Card className="vault-solid-card relative z-10">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-vault-primary">
                      <TrendingUp className="w-5 h-5" />
                      Performance Metrics
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Win Rate</span>
                      <span className="font-bold text-green-400 text-enhanced-glow">
                        {(vault.performance.winRate * 100).toFixed(0)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Max Drawdown</span>
                      <span className={`font-bold text-enhanced-glow ${
                        vault.performance.maxDrawdown > 0.05 ? 'text-red-400' : 'text-green-400'
                      }`}>
                        {(vault.performance.maxDrawdown * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Fee Tier</span>
                      <span className="font-bold text-blue-400 text-enhanced-glow">
                        {(vault.fee * 100).toFixed(2)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Chain ID</span>
                      <span className="font-bold text-cyan-400 text-enhanced-glow">
                        {vault.chainId}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                {/* Risk Analysis */}
                <Card className="vault-solid-card relative z-10">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-vault-primary">
                      <Shield className="w-5 h-5" />
                      Risk Analysis
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Risk Level</span>
                        <Badge className={
                          riskLevel === 'Low' ? 'bg-green-500/20 text-green-400' :
                          riskLevel === 'Medium' ? 'bg-yellow-500/20 text-yellow-400' :
                          'bg-red-500/20 text-red-400'
                        }>
                          {riskLevel}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Based on volatility, correlation, and market conditions
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Volatility</span>
                        <span className="font-bold text-enhanced-glow text-orange-400">12.3%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Beta</span>
                        <span className="font-bold text-enhanced-glow text-purple-400">0.87</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="analytics">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-6xl mx-auto">
                {/* Chart Placeholder */}
                <Card className="vault-solid-card lg:col-span-2 relative z-10">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-vault-primary">
                      <BarChart3 className="w-5 h-5" />
                      Performance Chart
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64 flex items-center justify-center bg-muted/20 rounded-lg">
                      <div className="text-center">
                        <Activity className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                        <p className="text-muted-foreground">Interactive chart coming soon</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Historical Data */}
                <Card className="vault-solid-card relative z-10">
                  <CardHeader>
                    <CardTitle className="text-vault-primary">Historical Performance</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">1D Return</span>
                      <span className="font-bold text-green-400 text-enhanced-glow">+2.34%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">7D Return</span>
                      <span className="font-bold text-green-400 text-enhanced-glow">+12.67%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">30D Return</span>
                      <span className="font-bold text-green-400 text-enhanced-glow">+45.23%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">All Time</span>
                      <span className="font-bold text-green-400 text-enhanced-glow">
                        {(vault.performance.totalReturn * 100).toFixed(1)}%
                      </span>
                    </div>
                  </CardContent>
                </Card>

                {/* Trading Stats */}
                <Card className="vault-solid-card relative z-10">
                  <CardHeader>
                    <CardTitle className="text-vault-primary">Trading Statistics</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total Trades</span>
                      <span className="font-bold text-enhanced-glow text-blue-400">1,247</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Avg Trade Size</span>
                      <span className="font-bold text-enhanced-glow text-cyan-400">$12.5K</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Best Trade</span>
                      <span className="font-bold text-green-400 text-enhanced-glow">+8.9%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Worst Trade</span>
                      <span className="font-bold text-red-400 text-enhanced-glow">-1.2%</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="strategy">
              <Card className="vault-solid-card relative z-10">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-vault-primary">
                    <Target className="w-5 h-5" />
                    Strategy Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h3 className="text-xl font-semibold mb-2">
                      {vault.strategy.replace('_', ' ').toUpperCase()} Strategy
                    </h3>
                    <p className="text-muted-foreground">
                      This strategy employs advanced AI algorithms to optimize liquidity provision 
                      in the {vault.tokenA}-{vault.tokenB} pair, automatically adjusting positions 
                      based on market conditions and volatility patterns.
                    </p>
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold mb-2">Key Features</h4>
                      <ul className="space-y-1 text-sm text-muted-foreground">
                        <li>• AI-driven range optimization</li>
                        <li>• Automatic rebalancing</li>
                        <li>• MEV protection</li>
                        <li>• Gas optimization</li>
                      </ul>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold mb-2">Token Pair</h4>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold">
                            {vault.tokenA.charAt(0)}
                          </div>
                          <span>{vault.tokenA}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-secondary/20 flex items-center justify-center text-xs font-bold">
                            {vault.tokenB.charAt(0)}
                          </div>
                          <span>{vault.tokenB}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Deposit Modal */}
      {showDepositModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <Card className="w-full max-w-md vault-solid-card relative z-10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-vault-primary">
                <DollarSign className="w-5 h-5" />
                Deposit to {vault.name}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="deposit-amount" className="text-muted-foreground font-medium">Amount (USD)</Label>
                <Input
                  id="deposit-amount"
                  type="number"
                  placeholder="0.00"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                />
              </div>
              
              <div className="text-sm text-muted-foreground space-y-1">
                <div className="flex justify-between">
                  <span>Current APY:</span>
                  <span className="font-bold text-green-400 text-enhanced-glow">{(vault.apy * 100).toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Fee Tier:</span>
                  <span className="font-bold text-blue-400 text-enhanced-glow">{(vault.fee * 100).toFixed(2)}%</span>
                </div>
              </div>
              
              <div className="flex gap-2 pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => setShowDepositModal(false)}
                  className="btn-vault-secondary flex-1 h-12 text-base"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleDeposit}
                  disabled={!depositAmount || parseFloat(depositAmount) <= 0 || depositMutation.isPending}
                  className="btn-vault-primary flex-1 h-12 text-base"
                  style={{
                    background: `linear-gradient(135deg, ${vaultColor}, ${vaultColor}DD)`,
                    color: '#000',
                  }}
                >
                  {depositMutation.isPending ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    'Deposit'
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

    </div>
  );
}