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
    stable_max: '#10b981',
    sei_hypergrowth: '#f59e0b',
    blue_chip: '#3b82f6',
    delta_neutral: '#8b5cf6',
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
    <div className="min-h-screen bg-background relative vault-page" style={{
      background: 'radial-gradient(ellipse at top, rgba(155, 93, 229, 0.1) 0%, rgba(0, 245, 212, 0.05) 50%, transparent 100%)',
    }}>
      {/* Background overlay for better content contrast */}
      <div className="fixed inset-0 bg-gradient-to-b from-background/80 via-background/70 to-background/80 pointer-events-none" />
      
      <Navigation variant="dark" showWallet={true} showLaunchApp={false} />
      
      <div className="relative z-10 pt-20 px-4 pb-12">
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
            
            <div ref={cardRef} className="vault-solid-card relative z-10" style={{
              background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.12) 0%, rgba(255, 255, 255, 0.06) 100%)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.25)',
              borderRadius: '24px',
              boxShadow: '0 25px 50px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.1) inset',
              padding: '2rem',
              position: 'relative'
            }}>
              {/* Deposit Button - Fixed Top Right Positioning with CSS Reset Override */}
              <div 
                className="deposit-button-container"
                style={{ 
                  position: 'absolute', 
                  top: '1.5rem', 
                  right: '1.5rem', 
                  zIndex: 50,
                  all: 'initial',
                  fontFamily: 'inherit'
                }}
              >
                <button
                  className="vault-deposit-enhanced"
                  onClick={() => {
                    console.log('[VaultDetail] Deposit button clicked - setting modal to true');
                    setShowDepositModal(true);
                  }}
                  style={{
                    all: 'initial',
                    fontFamily: 'inherit',
                    background: `linear-gradient(135deg, ${vaultColor}, ${vaultColor}DD, ${vaultColor}BB)`,
                    color: '#000000',
                    border: `2px solid ${vaultColor}`,
                    boxShadow: `
                      0 8px 25px ${vaultColor}60, 
                      0 0 30px ${vaultColor}40, 
                      0 0 0 1px rgba(255,255,255,0.3) inset,
                      0 2px 8px rgba(0,0,0,0.4)
                    `,
                    width: '170px',
                    height: '54px',
                    fontSize: '0.95rem',
                    fontWeight: '800',
                    borderRadius: '14px',
                    textShadow: '0 1px 3px rgba(0,0,0,0.8), 0 0 1px rgba(0,0,0,1)',
                    backdropFilter: 'blur(10px)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    textDecoration: 'none',
                    outline: 'none',
                    transition: 'all 0.3s ease',
                    position: 'relative',
                    zIndex: 1000
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px) scale(1.05)';
                    e.currentTarget.style.boxShadow = `
                      0 12px 35px ${vaultColor}70, 
                      0 0 40px ${vaultColor}50, 
                      0 0 0 1px rgba(255,255,255,0.4) inset,
                      0 4px 12px rgba(0,0,0,0.5)
                    `;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0) scale(1)';
                    e.currentTarget.style.boxShadow = `
                      0 8px 25px ${vaultColor}60, 
                      0 0 30px ${vaultColor}40, 
                      0 0 0 1px rgba(255,255,255,0.3) inset,
                      0 2px 8px rgba(0,0,0,0.4)
                    `;
                  }}
                >
                  Deposit Funds
                </button>
              </div>

              <div className="pr-52 mb-10">
                <div className="flex-1">
                  <h1 className="text-5xl font-black mb-4 text-enhanced-glow leading-tight" style={{ 
                    color: vaultColor,
                    textShadow: `0 0 30px ${vaultColor}60, 0 2px 4px rgba(0,0,0,0.3)`
                  }}>
                    {vault.name}
                  </h1>
                  <p className="text-muted-foreground text-xl mb-8 font-medium opacity-90">
                    {vault.strategy.replace('_', ' ').toUpperCase()} • {vault.tokenA}-{vault.tokenB}
                  </p>
                  <div className="flex items-center gap-4">
                    <div
                      className="risk-badge-custom"
                      style={{
                        all: 'initial',
                        fontFamily: 'inherit',
                        background: riskLevel === 'Low' ? 
                          'linear-gradient(135deg, #22c55e, #16a34a, #15803d)' :
                          riskLevel === 'Medium' ? 
                          'linear-gradient(135deg, #f59e0b, #d97706, #b45309)' :
                          'linear-gradient(135deg, #ef4444, #dc2626, #b91c1c)',
                        color: riskLevel === 'Low' ? '#fef3c7' :  // Light yellow for green background
                               riskLevel === 'Medium' ? '#fef3c7' : // Light yellow for orange background
                               '#fef3c7', // Light yellow for red background
                        border: riskLevel === 'Low' ? '1px solid rgba(34, 197, 94, 0.6)' :
                                riskLevel === 'Medium' ? '1px solid rgba(245, 158, 11, 0.6)' :
                                '1px solid rgba(239, 68, 68, 0.6)',
                        boxShadow: riskLevel === 'Low' ? 
                          '0 0 15px rgba(34, 197, 94, 0.4), 0 2px 8px rgba(34, 197, 94, 0.2), 0 0 0 1px rgba(255, 255, 255, 0.05) inset' :
                          riskLevel === 'Medium' ? 
                          '0 0 15px rgba(245, 158, 11, 0.4), 0 2px 8px rgba(245, 158, 11, 0.2), 0 0 0 1px rgba(255, 255, 255, 0.05) inset' :
                          '0 0 15px rgba(239, 68, 68, 0.4), 0 2px 8px rgba(239, 68, 68, 0.2), 0 0 0 1px rgba(255, 255, 255, 0.05) inset',
                        textShadow: '0 1px 2px rgba(0,0,0,0.6), 0 0 1px rgba(0,0,0,0.8)',
                        backdropFilter: 'blur(10px)',
                        fontWeight: '700',
                        letterSpacing: '0.3px',
                        textTransform: 'uppercase',
                        minWidth: '90px',
                        height: '32px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '16px',
                        padding: '8px 20px',
                        fontSize: '0.875rem',
                        cursor: 'default',
                        transition: 'all 0.3s ease'
                      }}
                    >
                      {riskLevel} Risk
                    </div>
                  </div>
                </div>
              </div>

              {/* Key Metrics - Bento Grid Design */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 max-w-4xl mx-auto">
                {/* APY - Large Corner Focus */}
                <div className="col-span-2 md:col-span-2 text-center p-6 transition-all duration-300 hover:scale-105" style={{
                  background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.12) 0%, rgba(255, 255, 255, 0.06) 100%)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  backdropFilter: 'blur(15px)',
                  borderRadius: '24px 24px 8px 8px',
                  boxShadow: '0 15px 35px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.1) inset'
                }}>
                  <div className="text-5xl font-black text-enhanced-glow mb-3" style={{ 
                    color: vaultColor,
                    textShadow: `0 0 25px ${vaultColor}60, 0 2px 4px rgba(0,0,0,0.3)`
                  }}>
                    {(vault.apy * 100).toFixed(1)}%
                  </div>
                  <div className="text-base text-muted-foreground font-bold uppercase tracking-wider opacity-90">Current APY</div>
                </div>
                
                {/* TVL */}
                <div className="text-center p-4 transition-all duration-300 hover:scale-105" style={{
                  background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.03) 100%)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  backdropFilter: 'blur(10px)',
                  borderRadius: '8px 24px 8px 8px',
                  boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)'
                }}>
                  <div className="text-2xl font-black text-vault-primary mb-2 text-enhanced-glow">
                    {formatCurrency(vault.tvl)}
                  </div>
                  <div className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">TVL</div>
                </div>
                
                {/* Total Return */}
                <div className="text-center p-4 transition-all duration-300 hover:scale-105" style={{
                  background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.03) 100%)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  backdropFilter: 'blur(10px)',
                  borderRadius: '8px 8px 24px 8px',
                  boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)'
                }}>
                  <div className="text-2xl font-black text-green-400 text-enhanced-glow mb-2" style={{
                    textShadow: '0 0 20px rgba(34, 197, 94, 0.5)'
                  }}>
                    {(vault.performance.totalReturn * 100).toFixed(1)}%
                  </div>
                  <div className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Total Return</div>
                </div>
                
                {/* Sharpe Ratio - Spanning full width */}
                <div className="col-span-2 md:col-span-4 text-center p-4 transition-all duration-300 hover:scale-105" style={{
                  background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.03) 100%)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  backdropFilter: 'blur(10px)',
                  borderRadius: '8px 8px 24px 24px',
                  boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)'
                }}>
                  <div className="text-3xl font-black text-secondary text-enhanced-glow mb-2" style={{
                    textShadow: '0 0 20px rgba(155, 93, 229, 0.5)'
                  }}>
                    {vault.performance.sharpeRatio.toFixed(2)}
                  </div>
                  <div className="text-sm text-muted-foreground font-bold uppercase tracking-wider opacity-90">Sharpe Ratio</div>
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
            <TabsList 
              className="grid w-full grid-cols-3 mb-8 h-18 p-2 rounded-2xl relative tabs-container-enhanced"
              style={{
                all: 'initial',
                fontFamily: 'inherit',
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                width: '100%',
                marginBottom: '2rem',
                height: '4.5rem',
                padding: '0.5rem',
                borderRadius: '1rem',
                position: 'relative',
                backgroundColor: 'rgba(15, 23, 42, 0.8)',
                border: '2px solid rgba(255, 255, 255, 0.2)',
                backdropFilter: 'blur(25px)',
                boxShadow: '0 15px 50px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.1) inset'
              }}
            >
              <div
                className="tab-trigger-custom"
                onClick={() => {
                  const params = new URLSearchParams(searchParams.toString());
                  params.set('tab', 'overview');
                  router.push(`/vault?${params.toString()}`);
                }}
                style={{
                  all: 'initial',
                  fontFamily: 'inherit',
                  height: '4rem',
                  fontSize: '1.125rem',
                  fontWeight: '900',
                  borderRadius: '0.75rem',
                  position: 'relative',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.3s ease',
                  color: activeTab === 'overview' ? '#000000' : '#ffffff',
                  backgroundColor: activeTab === 'overview' ? vaultColor : 'rgba(51, 65, 85, 0.6)',
                  textShadow: activeTab === 'overview' ? 
                    '0 1px 3px rgba(0,0,0,0.6)' : 
                    `0 0 15px ${vaultColor}80, 0 0 25px ${vaultColor}40, 0 2px 4px rgba(0,0,0,0.8)`,
                  border: activeTab !== 'overview' ? 
                    `1px solid ${vaultColor}80` : 'none',
                  boxShadow: activeTab === 'overview' ? 
                    `0 4px 15px ${vaultColor}40, 0 0 0 1px rgba(255,255,255,0.2) inset` : 
                    `0 0 15px ${vaultColor}30, 0 0 25px ${vaultColor}15`,
                  transform: activeTab === 'overview' ? 'scale(1.02)' : 'scale(1)',
                  letterSpacing: '0.5px',
                  textTransform: 'uppercase',
                  zIndex: activeTab === 'overview' ? 10 : 1
                }}
              >
                Overview
              </div>
              <div
                className="tab-trigger-custom"
                onClick={() => {
                  const params = new URLSearchParams(searchParams.toString());
                  params.set('tab', 'analytics');
                  router.push(`/vault?${params.toString()}`);
                }}
                style={{
                  all: 'initial',
                  fontFamily: 'inherit',
                  height: '4rem',
                  fontSize: '1.125rem',
                  fontWeight: '900',
                  borderRadius: '0.75rem',
                  position: 'relative',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.3s ease',
                  color: activeTab === 'analytics' ? '#000000' : '#ffffff',
                  backgroundColor: activeTab === 'analytics' ? vaultColor : 'rgba(51, 65, 85, 0.6)',
                  textShadow: activeTab === 'analytics' ? 
                    '0 1px 3px rgba(0,0,0,0.6)' : 
                    `0 0 15px ${vaultColor}80, 0 0 25px ${vaultColor}40, 0 2px 4px rgba(0,0,0,0.8)`,
                  border: activeTab !== 'analytics' ? 
                    `1px solid ${vaultColor}80` : 'none',
                  boxShadow: activeTab === 'analytics' ? 
                    `0 4px 15px ${vaultColor}40, 0 0 0 1px rgba(255,255,255,0.2) inset` : 
                    `0 0 15px ${vaultColor}30, 0 0 25px ${vaultColor}15`,
                  transform: activeTab === 'analytics' ? 'scale(1.02)' : 'scale(1)',
                  letterSpacing: '0.5px',
                  textTransform: 'uppercase',
                  zIndex: activeTab === 'analytics' ? 10 : 1
                }}
              >
                Analytics
              </div>
              <div
                className="tab-trigger-custom"
                onClick={() => {
                  const params = new URLSearchParams(searchParams.toString());
                  params.set('tab', 'strategy');
                  router.push(`/vault?${params.toString()}`);
                }}
                style={{
                  all: 'initial',
                  fontFamily: 'inherit',
                  height: '4rem',
                  fontSize: '1.125rem',
                  fontWeight: '900',
                  borderRadius: '0.75rem',
                  position: 'relative',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.3s ease',
                  color: activeTab === 'strategy' ? '#000000' : '#ffffff',
                  backgroundColor: activeTab === 'strategy' ? vaultColor : 'rgba(51, 65, 85, 0.6)',
                  textShadow: activeTab === 'strategy' ? 
                    '0 1px 3px rgba(0,0,0,0.6)' : 
                    `0 0 15px ${vaultColor}80, 0 0 25px ${vaultColor}40, 0 2px 4px rgba(0,0,0,0.8)`,
                  border: activeTab !== 'strategy' ? 
                    `1px solid ${vaultColor}80` : 'none',
                  boxShadow: activeTab === 'strategy' ? 
                    `0 4px 15px ${vaultColor}40, 0 0 0 1px rgba(255,255,255,0.2) inset` : 
                    `0 0 15px ${vaultColor}30, 0 0 25px ${vaultColor}15`,
                  transform: activeTab === 'strategy' ? 'scale(1.02)' : 'scale(1)',
                  letterSpacing: '0.5px',
                  textTransform: 'uppercase',
                  zIndex: activeTab === 'strategy' ? 10 : 1
                }}
              >
                Strategy
              </div>
            </TabsList>

            <TabsContent value="overview">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
                {/* Performance Metrics - Enhanced */}
                <Card className="vault-solid-card relative z-10" style={{
                  background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '20px',
                  boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.1) inset'
                }}>
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-3 text-vault-primary text-xl font-bold">
                      <div className="p-2 rounded-lg" style={{
                        background: `linear-gradient(135deg, ${vaultColor}30, ${vaultColor}15)`,
                        border: `1px solid ${vaultColor}40`
                      }}>
                        <TrendingUp className="w-5 h-5" style={{ color: vaultColor }} />
                      </div>
                      Performance Metrics
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    <div className="flex justify-between items-center p-3 rounded-xl" style={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.1)'
                    }}>
                      <span className="text-muted-foreground font-medium">Win Rate</span>
                      <span className="font-bold text-green-400 text-enhanced-glow text-lg" style={{
                        textShadow: '0 0 15px rgba(34, 197, 94, 0.4)'
                      }}>
                        {(vault.performance.winRate * 100).toFixed(0)}%
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 rounded-xl" style={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.1)'
                    }}>
                      <span className="text-muted-foreground font-medium">Max Drawdown</span>
                      <span className={`font-bold text-enhanced-glow text-lg ${
                        vault.performance.maxDrawdown > 0.05 ? 'text-red-400' : 'text-green-400'
                      }`} style={{
                        textShadow: vault.performance.maxDrawdown > 0.05 ? 
                          '0 0 15px rgba(239, 68, 68, 0.4)' : 
                          '0 0 15px rgba(34, 197, 94, 0.4)'
                      }}>
                        {(vault.performance.maxDrawdown * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 rounded-xl" style={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.1)'
                    }}>
                      <span className="text-muted-foreground font-medium">Fee Tier</span>
                      <span className="font-bold text-blue-400 text-enhanced-glow text-lg" style={{
                        textShadow: '0 0 15px rgba(59, 130, 246, 0.4)'
                      }}>
                        {(vault.fee * 100).toFixed(2)}%
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 rounded-xl" style={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.1)'
                    }}>
                      <span className="text-muted-foreground font-medium">Chain ID</span>
                      <span className="font-bold text-cyan-400 text-enhanced-glow text-lg" style={{
                        textShadow: '0 0 15px rgba(6, 182, 212, 0.4)'
                      }}>
                        {vault.chainId}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                {/* Risk Analysis - Enhanced */}
                <Card className="vault-solid-card relative z-10" style={{
                  background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '20px',
                  boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.1) inset'
                }}>
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-3 text-vault-primary text-xl font-bold">
                      <div className="p-2 rounded-lg" style={{
                        background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.3), rgba(34, 197, 94, 0.15))',
                        border: '1px solid rgba(34, 197, 94, 0.4)'
                      }}>
                        <Shield className="w-5 h-5 text-green-400" />
                      </div>
                      Risk Analysis
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-5">
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
        <div 
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
          onClick={(e) => {
            console.log('[VaultDetailModal] Backdrop clicked');
            if (e.target === e.currentTarget) {
              setShowDepositModal(false);
            }
          }}
        >
          <Card className="w-full max-w-md vault-solid-card relative z-[50]">
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