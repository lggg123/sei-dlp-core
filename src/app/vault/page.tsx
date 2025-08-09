"use client"

import { useEffect, useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import Navigation from '@/components/Navigation';
import { ArrowLeft, TrendingUp, Activity, Shield, Target, BarChart3, Loader2 } from 'lucide-react';
import gsap from 'gsap';
import { useVaultStore } from '@/stores/vaultStore';
import { useVaults } from '@/hooks/useVaults';
import DepositModal from '@/components/DepositModal';

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
  const [showDepositModal, setShowDepositModal] = useState(action === 'deposit');
  
  // Store and API hooks
  const { selectedVault, setSelectedVault, getVaultByAddress } = useVaultStore();
  const { data: vaultsData, isLoading } = useVaults();
  
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

  const handleDepositSuccess = (txHash: string) => {
    console.log('Deposit successful:', txHash);
    setShowDepositModal(false);
  };

  return (
    <div 
      className="min-h-screen bg-background relative vault-page vault-page-container-isolated" 
      style={{
        background: 'radial-gradient(ellipse at top, rgba(155, 93, 229, 0.1) 0%, rgba(0, 245, 212, 0.05) 50%, transparent 100%)',
        width: '100vw',
        maxWidth: 'none',
        position: 'relative',
        containIntrinsicSize: 'auto'
      }}
    >
      {/* Background overlay for better content contrast */}
      <div className="fixed inset-0 bg-gradient-to-b from-background/80 via-background/70 to-background/80 pointer-events-none" />
      
      <Navigation variant="dark" showWallet={true} showLaunchApp={false} />
      
      <div className="relative z-10 pt-12 md:pt-14 lg:pt-16 px-4 pb-12">
        <div className="container mx-auto max-w-6xl">
          {/* Header */}
          <div className="mb-8">
            <Button 
              variant="ghost" 
              onClick={() => router.push('/vaults')}
              className="mb-4 text-muted-foreground hover:text-foreground transition-all duration-200 hover:scale-105 active:scale-95"
              style={{
                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.04) 100%)',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '12px',
                padding: '0.75rem 1.5rem',
                fontSize: '0.95rem',
                fontWeight: '600',
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(255, 255, 255, 0.05) inset',
                textShadow: '0 1px 2px rgba(0,0,0,0.7)'
              }}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Vaults
            </Button>
            
                        <div ref={cardRef} className="vault-detail-header-card-optimized relative z-10" style={{
              background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.12) 0%, rgba(255, 255, 255, 0.06) 100%)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.25)',
              borderRadius: '20px',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.1) inset',
              padding: 'clamp(1rem, 2.5vw, 1.5rem)',
              position: 'relative',
              overflow: 'hidden',
              // Significantly reduced height for better content flow
              minHeight: 'clamp(140px, 18vw, 180px)'
            }}>
              {/* Enhanced Background Gradient for Header */}
              <div 
                className="absolute inset-0 opacity-30 pointer-events-none"
                style={{
                  background: `radial-gradient(circle at top right, ${vaultColor}15 0%, transparent 60%)`
                }}
              />

              {/* Deposit Button - Enhanced Fixed Positioning */}
              <div 
                className="vault-deposit-button-wrapper"
                style={{ 
                  position: 'absolute', 
                  top: '1.5rem', 
                  right: '1.5rem', 
                  zIndex: 100
                }}
              >
                <button
                  className="vault-deposit-enhanced-v2"
                  onClick={() => {
                    console.log('[VaultDetail] Enhanced Deposit button clicked');
                    setShowDepositModal(true);
                  }}
                  style={{
                    background: `linear-gradient(135deg, ${vaultColor}F0, ${vaultColor}DD, ${vaultColor}CC)`,
                    color: '#000000',
                    border: `2px solid ${vaultColor}`,
                    boxShadow: `
                      0 8px 32px ${vaultColor}50, 
                      0 0 40px ${vaultColor}30, 
                      0 0 0 1px rgba(255,255,255,0.4) inset,
                      0 4px 16px rgba(0,0,0,0.3)
                    `,
                    width: '180px',
                    height: '56px',
                    fontSize: '1rem',
                    fontWeight: '900',
                    borderRadius: '16px',
                    textShadow: '0 1px 3px rgba(0,0,0,0.7)',
                    backdropFilter: 'blur(12px)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    letterSpacing: '0.5px',
                    textTransform: 'uppercase',
                    fontFamily: 'inherit',
                    outline: 'none',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-3px) scale(1.05)';
                    e.currentTarget.style.boxShadow = `
                      0 12px 48px ${vaultColor}60, 
                      0 0 60px ${vaultColor}40, 
                      0 0 0 1px rgba(255,255,255,0.5) inset,
                      0 6px 24px rgba(0,0,0,0.4)
                    `;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0) scale(1)';
                    e.currentTarget.style.boxShadow = `
                      0 8px 32px ${vaultColor}50, 
                      0 0 40px ${vaultColor}30, 
                      0 0 0 1px rgba(255,255,255,0.4) inset,
                      0 4px 16px rgba(0,0,0,0.3)
                    `;
                  }}
                >
                  <span style={{ position: 'relative', zIndex: 2 }}>Deposit Funds</span>
                  {/* Button shine effect */}
                  <div 
                    style={{
                      position: 'absolute',
                      top: '0',
                      left: '-100%',
                      width: '100%',
                      height: '100%',
                      background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
                      transition: 'left 0.6s ease',
                      pointerEvents: 'none'
                    }}
                    className="button-shine"
                  />
                </button>
              </div>

              {/* Header Content with Compact Spacing */}
              <div className="vault-header-content" style={{ 
                marginRight: 'clamp(120px, 20vw, 160px)', 
                marginBottom: 'clamp(0.75rem, 2vw, 1.25rem)',
                position: 'relative',
                zIndex: 2
              }}>
                <div className="vault-title-section">
                  <h1 className="vault-main-title" style={{ 
                    fontSize: 'clamp(1.75rem, 5vw, 2.75rem)',
                    fontWeight: '900',
                    marginBottom: 'clamp(0.375rem, 1.5vw, 0.75rem)',
                    lineHeight: '1.1',
                    color: vaultColor,
                    textShadow: `
                      0 0 30px ${vaultColor}40, 
                      0 3px 6px rgba(0,0,0,0.4),
                      0 1px 3px rgba(0,0,0,0.6)
                    `,
                    letterSpacing: '-0.02em'
                  }}>
                    {vault.name}
                  </h1>
                  <p className="vault-subtitle" style={{
                    fontSize: 'clamp(0.875rem, 2vw, 1.125rem)',
                    color: 'rgba(255, 255, 255, 0.8)',
                    marginBottom: 'clamp(0.75rem, 2vw, 1.25rem)',
                    fontWeight: '500',
                    letterSpacing: '0.5px'
                  }}>
                    {vault.strategy.replace('_', ' ').toUpperCase()} • {vault.tokenA}-{vault.tokenB}
                  </p>
                  <div className="vault-badges" style={{ display: 'flex', alignItems: 'center', gap: 'clamp(0.5rem, 1.5vw, 0.75rem)' }}>
                    <div
                      className="vault-risk-badge-v2"
                      style={{
                        background: riskLevel === 'Low' ? 
                          'linear-gradient(135deg, #22c55e, #16a34a, #15803d)' :
                          riskLevel === 'Medium' ? 
                          'linear-gradient(135deg, #f59e0b, #d97706, #b45309)' :
                          'linear-gradient(135deg, #ef4444, #dc2626, #b91c1c)',
                        color: '#ffffff',
                        border: riskLevel === 'Low' ? '2px solid rgba(34, 197, 94, 0.6)' :
                                riskLevel === 'Medium' ? '2px solid rgba(245, 158, 11, 0.6)' :
                                '2px solid rgba(239, 68, 68, 0.6)',
                        boxShadow: riskLevel === 'Low' ? 
                          '0 0 20px rgba(34, 197, 94, 0.4), 0 4px 12px rgba(34, 197, 94, 0.2), 0 0 0 1px rgba(255, 255, 255, 0.1) inset' :
                          riskLevel === 'Medium' ? 
                          '0 0 20px rgba(245, 158, 11, 0.4), 0 4px 12px rgba(245, 158, 11, 0.2), 0 0 0 1px rgba(255, 255, 255, 0.1) inset' :
                          '0 0 20px rgba(239, 68, 68, 0.4), 0 4px 12px rgba(239, 68, 68, 0.2), 0 0 0 1px rgba(255, 255, 255, 0.1) inset',
                        textShadow: '0 1px 3px rgba(0,0,0,0.7)',
                        backdropFilter: 'blur(10px)',
                        fontWeight: '800',
                        letterSpacing: '0.5px',
                        textTransform: 'uppercase',
                        height: '40px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '20px',
                        padding: '0 24px',
                        fontSize: '0.9rem',
                        transition: 'all 0.3s ease'
                      }}
                    >
                      {riskLevel} Risk
                    </div>
                  </div>
                </div>
              </div>

              {/* Optimized Key Metrics - Responsive Bento Grid */}
              <div className="vault-metrics-optimized" style={{ 
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: 'clamp(0.75rem, 2vw, 1.25rem)',
                maxWidth: '100%',
                margin: '0 auto',
                position: 'relative',
                zIndex: 2
              }}>
                {/* APY - Compact Primary Focus with Better Centering */}
                <div className="vault-metric-primary-compact" style={{
                  gridColumn: 'span 2',
                  background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.12) 0%, rgba(255, 255, 255, 0.06) 100%)',
                  border: `1px solid ${vaultColor}50`,
                  backdropFilter: 'blur(16px)',
                  borderRadius: '18px',
                  boxShadow: `
                    0 10px 20px rgba(0, 0, 0, 0.25), 
                    0 0 30px ${vaultColor}12,
                    0 0 0 1px rgba(255, 255, 255, 0.1) inset
                  `,
                  padding: 'clamp(0.875rem, 2.5vw, 1.25rem)',
                  textAlign: 'center',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  position: 'relative',
                  overflow: 'hidden',
                  minHeight: 'clamp(85px, 12vw, 105px)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center'
                }}>
                  {/* Subtle glow effect */}
                  <div 
                    style={{
                      position: 'absolute',
                      inset: '0',
                      background: `radial-gradient(circle at center, ${vaultColor}06 0%, transparent 60%)`,
                      opacity: '0.8',
                      pointerEvents: 'none'
                    }}
                  />
                  <div style={{ position: 'relative', zIndex: 2, width: '100%' }}>
                    <div style={{ 
                      fontSize: 'clamp(1.5rem, 3.5vw, 2.25rem)',
                      fontWeight: '900',
                      marginBottom: 'clamp(0.125rem, 0.75vw, 0.375rem)',
                      color: vaultColor,
                      textShadow: `
                        0 0 25px ${vaultColor}45, 
                        0 2px 5px rgba(0,0,0,0.4)
                      `,
                      letterSpacing: '-0.01em',
                      lineHeight: '1',
                      textAlign: 'center'
                    }}>
                      {(vault.apy * 100).toFixed(1)}%
                    </div>
                    <div style={{
                      fontSize: 'clamp(0.6875rem, 1.75vw, 0.8125rem)',
                      color: 'rgba(255, 255, 255, 0.85)',
                      fontWeight: '600',
                      textTransform: 'uppercase',
                      letterSpacing: '0.75px',
                      textAlign: 'center'
                    }}>
                      Current APY
                    </div>
                  </div>
                </div>
                
                {/* TVL - More Compact Secondary */}
                <div className="vault-metric-secondary-compact" style={{
                  background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.03) 100%)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  backdropFilter: 'blur(12px)',
                  borderRadius: '14px',
                  boxShadow: '0 6px 16px rgba(0, 0, 0, 0.2)',
                  padding: 'clamp(0.625rem, 1.75vw, 0.875rem)',
                  textAlign: 'center',
                  transition: 'all 0.3s ease',
                  minHeight: 'clamp(70px, 10vw, 85px)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center'
                }}>
                  <div style={{ 
                    fontSize: 'clamp(1rem, 2.5vw, 1.25rem)',
                    fontWeight: '800',
                    marginBottom: 'clamp(0.0625rem, 0.375vw, 0.1875rem)',
                    color: '#ffffff',
                    textShadow: '0 0 12px rgba(255, 255, 255, 0.2), 0 1px 2px rgba(0,0,0,0.4)'
                  }}>
                    {formatCurrency(vault.tvl)}
                  </div>
                  <div style={{
                    fontSize: 'clamp(0.5625rem, 1.25vw, 0.6875rem)',
                    color: 'rgba(255, 255, 255, 0.65)',
                    fontWeight: '600',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    TVL
                  </div>
                </div>
                
                {/* Total Return - More Compact Secondary */}
                <div className="vault-metric-secondary-compact" style={{
                  background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.03) 100%)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  backdropFilter: 'blur(12px)',
                  borderRadius: '14px',
                  boxShadow: '0 6px 16px rgba(0, 0, 0, 0.2)',
                  padding: 'clamp(0.625rem, 1.75vw, 0.875rem)',
                  textAlign: 'center',
                  transition: 'all 0.3s ease',
                  minHeight: 'clamp(70px, 10vw, 85px)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center'
                }}>
                  <div style={{ 
                    fontSize: 'clamp(1rem, 2.5vw, 1.25rem)',
                    fontWeight: '800',
                    marginBottom: 'clamp(0.0625rem, 0.375vw, 0.1875rem)',
                    color: '#22c55e',
                    textShadow: '0 0 12px rgba(34, 197, 94, 0.4), 0 1px 2px rgba(0,0,0,0.4)'
                  }}>
                    {(vault.performance.totalReturn * 100).toFixed(1)}%
                  </div>
                  <div style={{
                    fontSize: 'clamp(0.5625rem, 1.25vw, 0.6875rem)',
                    color: 'rgba(255, 255, 255, 0.65)',
                    fontWeight: '600',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    Return
                  </div>
                </div>
                
                {/* Sharpe Ratio - More Compact Full Width */}
                <div className="vault-metric-wide-compact" style={{
                  gridColumn: 'span 4',
                  background: 'linear-gradient(135deg, rgba(155, 93, 229, 0.1) 0%, rgba(155, 93, 229, 0.035) 100%)',
                  border: '1px solid rgba(155, 93, 229, 0.2)',
                  backdropFilter: 'blur(12px)',
                  borderRadius: '14px',
                  boxShadow: '0 6px 16px rgba(155, 93, 229, 0.12)',
                  padding: 'clamp(0.625rem, 1.75vw, 0.875rem)',
                  textAlign: 'center',
                  transition: 'all 0.3s ease',
                  minHeight: 'clamp(60px, 8vw, 75px)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center'
                }}>
                  <div style={{ 
                    fontSize: 'clamp(1.125rem, 3vw, 1.5rem)',
                    fontWeight: '900',
                    marginBottom: 'clamp(0.0625rem, 0.375vw, 0.1875rem)',
                    color: '#9b5de5',
                    textShadow: '0 0 16px rgba(155, 93, 229, 0.45), 0 1px 2px rgba(0,0,0,0.4)'
                  }}>
                    {vault.performance.sharpeRatio.toFixed(2)}
                  </div>
                  <div style={{
                    fontSize: 'clamp(0.5625rem, 1.25vw, 0.75rem)',
                    color: 'rgba(255, 255, 255, 0.75)',
                    fontWeight: '600',
                    textTransform: 'uppercase',
                    letterSpacing: '0.75px'
                  }}>
                    Sharpe Ratio
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Compact Tabs Section - Smaller Height */}
          <Tabs value={activeTab} onValueChange={(value) => {
            const params = new URLSearchParams(searchParams.toString());
            params.set('tab', value);
            router.push(`/vault?${params.toString()}`);
          }}>
            <TabsList 
              className="grid w-full grid-cols-3 mb-4 h-12 p-1.5 rounded-xl relative tabs-container-compact"
              style={{
                all: 'initial',
                fontFamily: 'inherit',
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                width: '100%',
                marginBottom: 'clamp(0.75rem, 2vw, 1rem)',
                height: 'clamp(2.75rem, 6vw, 3rem)',
                padding: 'clamp(0.25rem, 0.75vw, 0.375rem)',
                borderRadius: '0.75rem',
                position: 'relative',
                backgroundColor: 'rgba(15, 23, 42, 0.8)',
                border: '1.5px solid rgba(255, 255, 255, 0.18)',
                backdropFilter: 'blur(20px)',
                boxShadow: '0 10px 35px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.08) inset'
              }}
            >
              <div
                className="tab-trigger-compact"
                onClick={() => {
                  const params = new URLSearchParams(searchParams.toString());
                  params.set('tab', 'overview');
                  router.push(`/vault?${params.toString()}`);
                }}
                style={{
                  all: 'initial',
                  fontFamily: 'inherit',
                  height: 'clamp(2.25rem, 5vw, 2.5rem)',
                  fontSize: 'clamp(0.75rem, 1.75vw, 0.9375rem)',
                  fontWeight: '800',
                  borderRadius: '0.5rem',
                  position: 'relative',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.25s ease',
                  color: activeTab === 'overview' ? '#000000' : '#ffffff',
                  backgroundColor: activeTab === 'overview' ? vaultColor : 'rgba(51, 65, 85, 0.5)',
                  textShadow: activeTab === 'overview' ? 
                    '0 1px 2px rgba(0,0,0,0.6)' : 
                    `0 0 12px ${vaultColor}70, 0 0 20px ${vaultColor}35, 0 1px 3px rgba(0,0,0,0.7)`,
                  border: activeTab !== 'overview' ? 
                    `1px solid ${vaultColor}70` : 'none',
                  boxShadow: activeTab === 'overview' ? 
                    `0 3px 12px ${vaultColor}35, 0 0 0 1px rgba(255,255,255,0.15) inset` : 
                    `0 0 12px ${vaultColor}25, 0 0 20px ${vaultColor}12`,
                  transform: activeTab === 'overview' ? 'scale(1.01)' : 'scale(1)',
                  letterSpacing: '0.375px',
                  textTransform: 'uppercase',
                  zIndex: activeTab === 'overview' ? 10 : 1,
                  textDecoration: 'none',
                  textDecorationLine: 'none',
                  textUnderlineOffset: 'initial',
                  textDecorationColor: 'transparent'
                }}
              >
                Overview
              </div>
              <div
                className="tab-trigger-compact"
                onClick={() => {
                  const params = new URLSearchParams(searchParams.toString());
                  params.set('tab', 'analytics');
                  router.push(`/vault?${params.toString()}`);
                }}
                style={{
                  all: 'initial',
                  fontFamily: 'inherit',
                  height: 'clamp(2.25rem, 5vw, 2.5rem)',
                  fontSize: 'clamp(0.75rem, 1.75vw, 0.9375rem)',
                  fontWeight: '800',
                  borderRadius: '0.5rem',
                  position: 'relative',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.25s ease',
                  color: activeTab === 'analytics' ? '#000000' : '#ffffff',
                  backgroundColor: activeTab === 'analytics' ? vaultColor : 'rgba(51, 65, 85, 0.5)',
                  textShadow: activeTab === 'analytics' ? 
                    '0 1px 2px rgba(0,0,0,0.6)' : 
                    `0 0 12px ${vaultColor}70, 0 0 20px ${vaultColor}35, 0 1px 3px rgba(0,0,0,0.7)`,
                  border: activeTab !== 'analytics' ? 
                    `1px solid ${vaultColor}70` : 'none',
                  boxShadow: activeTab === 'analytics' ? 
                    `0 3px 12px ${vaultColor}35, 0 0 0 1px rgba(255,255,255,0.15) inset` : 
                    `0 0 12px ${vaultColor}25, 0 0 20px ${vaultColor}12`,
                  transform: activeTab === 'analytics' ? 'scale(1.01)' : 'scale(1)',
                  letterSpacing: '0.375px',
                  textTransform: 'uppercase',
                  zIndex: activeTab === 'analytics' ? 10 : 1,
                  textDecoration: 'none',
                  textDecorationLine: 'none',
                  textUnderlineOffset: 'initial',
                  textDecorationColor: 'transparent'
                }}
              >
                Analytics
              </div>
              <div
                className="tab-trigger-compact"
                onClick={() => {
                  const params = new URLSearchParams(searchParams.toString());
                  params.set('tab', 'strategy');
                  router.push(`/vault?${params.toString()}`);
                }}
                style={{
                  all: 'initial',
                  fontFamily: 'inherit',
                  height: 'clamp(2.25rem, 5vw, 2.5rem)',
                  fontSize: 'clamp(0.75rem, 1.75vw, 0.9375rem)',
                  fontWeight: '800',
                  borderRadius: '0.5rem',
                  position: 'relative',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.25s ease',
                  color: activeTab === 'strategy' ? '#000000' : '#ffffff',
                  backgroundColor: activeTab === 'strategy' ? vaultColor : 'rgba(51, 65, 85, 0.5)',
                  textShadow: activeTab === 'strategy' ? 
                    '0 1px 2px rgba(0,0,0,0.6)' : 
                    `0 0 12px ${vaultColor}70, 0 0 20px ${vaultColor}35, 0 1px 3px rgba(0,0,0,0.7)`,
                  border: activeTab !== 'strategy' ? 
                    `1px solid ${vaultColor}70` : 'none',
                  boxShadow: activeTab === 'strategy' ? 
                    `0 3px 12px ${vaultColor}35, 0 0 0 1px rgba(255,255,255,0.15) inset` : 
                    `0 0 12px ${vaultColor}25, 0 0 20px ${vaultColor}12`,
                  transform: activeTab === 'strategy' ? 'scale(1.01)' : 'scale(1)',
                  letterSpacing: '0.375px',
                  textTransform: 'uppercase',
                  zIndex: activeTab === 'strategy' ? 10 : 1,
                  textDecoration: 'none',
                  textDecorationLine: 'none',
                  textUnderlineOffset: 'initial',
                  textDecorationColor: 'transparent'
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
      <DepositModal
        vault={vault}
        isOpen={showDepositModal}
        onClose={() => setShowDepositModal(false)}
        onSuccess={handleDepositSuccess}
      />

    </div>
  );
}