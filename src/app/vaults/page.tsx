"use client"

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Navigation from '@/components/Navigation';
import AIChat from '@/components/AIChat';
import { MessageCircle, X, Loader2 } from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import * as THREE from 'three';
import { useVaults, useDepositToVault } from '@/hooks/useVaults';
import { useSeiMarketData } from '@/hooks/useMarketData';
import { useVaultStore } from '@/stores/vaultStore';
import { useAppStore } from '@/stores/appStore';

gsap.registerPlugin(ScrollTrigger);

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

export default function VaultsPage() {
  const router = useRouter();
  const mountRef = useRef<HTMLDivElement>(null);
  const vaultCardsRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);
  const [scene, setScene] = useState<THREE.Scene | null>(null);
  const [showChat, setShowChat] = useState(false);

  // State management
  const {
    selectedVault,
    setSelectedVault,
    getFilteredVaults,
    getTotalTVL,
    isLoading: vaultLoading,
    isError: vaultError,
  } = useVaultStore()
  
  // API hooks
  const { data: vaultsData, isLoading: queryLoading, error: queryError } = useVaults()
  const { data: marketData } = useSeiMarketData()
  const depositMutation = useDepositToVault()
  
  // Combine loading states
  const isLoading = vaultLoading || queryLoading
  const error = vaultError || queryError
  
  // Get filtered vaults from store
  const filteredVaults = getFilteredVaults()
  const totalTVL = getTotalTVL()
  
  // Handler functions for vault actions
  const handleDeposit = async (vault: any) => {
    try {
      setSelectedVault(vault)
      // For now, navigate to vault page with deposit modal
      router.push(`/vault?address=${vault.address}&action=deposit`)
    } catch (error) {
      console.error('Deposit error:', error)
    }
  }
  
  const handleViewAnalytics = (vault: any) => {
    setSelectedVault(vault)
    // Navigate to vault analytics page
    router.push(`/vault?address=${vault.address}&tab=analytics`)
  }

  // Three.js Setup
  useEffect(() => {
    if (!mountRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000, 0);
    mountRef.current.appendChild(renderer.domElement);

    // Particle system
    const particleCount = 1000;
    const particles = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 100;
      positions[i + 1] = (Math.random() - 0.5) * 100;
      positions[i + 2] = (Math.random() - 0.5) * 100;

      // Colors for particles
      const color = new THREE.Color();
      color.setHSL(Math.random() * 0.3 + 0.5, 0.7, 0.5);
      colors[i] = color.r;
      colors[i + 1] = color.g;
      colors[i + 2] = color.b;
    }

    particles.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particles.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const particleMaterial = new THREE.PointsMaterial({
      size: 2,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
    });

    const particleSystem = new THREE.Points(particles, particleMaterial);
    scene.add(particleSystem);

    // Geometric shapes for depth
    const geometries = [
      new THREE.TetrahedronGeometry(2),
      new THREE.OctahedronGeometry(1.5),
      new THREE.IcosahedronGeometry(1),
    ];

    geometries.forEach((geometry, index) => {
      const material = new THREE.MeshBasicMaterial({
        color: [0x00f5d4, 0x9b5de5, 0xff206e][index],
        wireframe: true,
        transparent: true,
        opacity: 0.3,
      });
      
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(
        (Math.random() - 0.5) * 50,
        (Math.random() - 0.5) * 50,
        (Math.random() - 0.5) * 50
      );
      scene.add(mesh);
    });

    camera.position.z = 30;
    setScene(scene);

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      
      // Rotate particles
      particleSystem.rotation.x += 0.001;
      particleSystem.rotation.y += 0.002;

      // Rotate geometric shapes
      scene.children.forEach((child) => {
        if (child instanceof THREE.Mesh) {
          child.rotation.x += 0.01;
          child.rotation.y += 0.01;
        }
      });

      renderer.render(scene, camera);
    };

    animate();

    // Handle resize
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  // GSAP Animations
  useEffect(() => {
    if (vaultCardsRef.current) {
      const cards = vaultCardsRef.current.children;
      
      gsap.fromTo(
        cards,
        { 
          opacity: 0, 
          y: 100, 
          rotationX: -15,
          scale: 0.8 
        },
        { 
          opacity: 1, 
          y: 0, 
          rotationX: 0,
          scale: 1,
          duration: 1.2, 
          stagger: 0.2, 
          ease: 'back.out(1.7)',
          scrollTrigger: {
            trigger: vaultCardsRef.current,
            start: 'top 80%',
          }
        }
      );
    }

    if (statsRef.current) {
      gsap.fromTo(
        statsRef.current.children,
        { opacity: 0, y: 50 },
        { 
          opacity: 1, 
          y: 0, 
          duration: 0.8, 
          stagger: 0.1,
          scrollTrigger: {
            trigger: statsRef.current,
            start: 'top 90%',
          }
        }
      );
    }
  }, []);


  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Three.js Background */}
      <div 
        ref={mountRef} 
        className="fixed inset-0 z-0"
        style={{ 
          background: 'radial-gradient(ellipse at center, rgba(155, 93, 229, 0.15) 0%, rgba(0, 245, 212, 0.05) 50%, transparent 100%)'
        }}
      />
      
      {/* Background overlay to reduce 3D visual interference */}
      <div className="fixed inset-0 z-5 bg-gradient-to-b from-background/10 via-background/5 to-background/20 pointer-events-none" />

      {/* Navigation */}
      <Navigation variant="dark" showWallet={true} showLaunchApp={false} />

      {/* Main Content */}
      <div className="relative z-10 pt-20">
        {/* Header Section */}
        <section className="py-12 px-4">
          <div className="container mx-auto">
            <div className="text-center mb-12">
              <h1 className="text-6xl font-bold mb-6 bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                Dynamic Liquidity Vaults
              </h1>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
                AI-powered yield optimization with real-time rebalancing on SEI's 400ms finality network
              </p>
              
              {/* Live Stats */}
              <div ref={statsRef} className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
                {[
                  { 
                    label: 'Total TVL', 
                    value: isLoading ? '...' : formatCurrency(totalTVL), 
                    change: '+12.4%' 
                  },
                  { 
                    label: 'Active Vaults', 
                    value: isLoading ? '...' : filteredVaults.length.toString(), 
                    change: '+1' 
                  },
                  { 
                    label: 'Avg APY', 
                    value: isLoading ? '...' : `${filteredVaults.length > 0 ? (filteredVaults.reduce((sum, v) => sum + v.apy, 0) / filteredVaults.length).toFixed(1) : '0'}%`, 
                    change: '+3.2%' 
                  },
                  { label: 'AI Uptime', value: '99.97%', change: '+0.02%' },
                ].map((stat, index) => (
                  <Card key={index} className="glass-card border-primary/20 hover:border-primary/50 transition-all duration-300 h-20 flex items-center justify-center group">
                    <CardContent className="p-3 text-center flex flex-col justify-center h-full relative z-10">
                      <div className="text-lg font-bold text-white leading-tight" style={{
                        textShadow: '0 0 15px hsl(var(--primary)), 0 4px 8px rgba(0,0,0,0.8)'
                      }}>{stat.value}</div>
                      <div className="text-xs text-gray-200 font-medium" style={{
                        textShadow: '0 2px 4px rgba(0,0,0,0.8)'
                      }}>{stat.label}</div>
                      <div className="text-xs text-green-300 font-bold" style={{
                        textShadow: '0 0 8px #10b981, 0 2px 4px rgba(0,0,0,0.8)'
                      }}>{stat.change}</div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Vaults Grid */}
        <section className="py-12 px-4">
          <div className="container mx-auto">
            {isLoading && (
              <div className="flex justify-center items-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <span className="ml-2 text-lg">Loading vaults...</span>
              </div>
            )}
            
            {error && (
              <div className="text-center py-20">
                <div className="text-red-400 text-lg mb-4">Failed to load vaults</div>
                <div className="text-muted-foreground">
                  {typeof error === 'object' && error.message ? error.message : 'An error occurred'}
                </div>
              </div>
            )}
            
            {!isLoading && !error && (
              <div ref={vaultCardsRef} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-3 gap-6 max-w-7xl mx-auto">
                {filteredVaults.map((vault) => {
                  const vaultColor = getVaultColor(vault.strategy)
                  const riskLevel = getRiskLevel(vault.apy)
                  
                  return (
                <Card 
                  key={vault.address}
                  className="vault-card-enhanced transition-all duration-500 cursor-pointer group relative overflow-hidden w-full max-w-sm mx-auto"
                  onClick={() => {
                    setSelectedVault(vault)
                    router.push(`/vault?address=${vault.address}`)
                  }}
                  style={{
                    '--vault-color': vaultColor,
                    '--vault-color-dark': `${vaultColor}DD`,
                    '--vault-color-glow': `${vaultColor}40`,
                    '--vault-color-border': `${vaultColor}80`,
                    '--vault-color-bg': `${vaultColor}20`
                  } as React.CSSProperties}
                >
                  {/* Enhanced gradient overlay for premium readability */}
                  <div className="absolute inset-0 bg-gradient-to-br from-black/40 via-black/20 to-transparent z-0" />
                  
                  {/* Enhanced inner glow with better contrast */}
                  <div 
                    className="absolute inset-0 opacity-30 group-hover:opacity-60 transition-opacity duration-700 z-1 pointer-events-none"
                    style={{
                      background: `radial-gradient(circle at 30% 20%, ${vaultColor}30 0%, transparent 60%), radial-gradient(circle at 80% 80%, ${vaultColor}20 0%, transparent 50%)`,
                      filter: 'blur(20px)',
                    }}
                  />
                  
                  {/* Accent lines for modern touch */}
                  <div 
                    className="absolute top-0 left-0 w-full h-1 opacity-60 group-hover:opacity-100 transition-opacity duration-500 z-2"
                    style={{
                      background: `linear-gradient(90deg, transparent, ${vaultColor}, transparent)`,
                    }}
                  />
                  <div 
                    className="absolute bottom-0 right-0 w-1 h-full opacity-40 group-hover:opacity-80 transition-opacity duration-500 z-2"
                    style={{
                      background: `linear-gradient(180deg, transparent, ${vaultColor}60, transparent)`,
                    }}
                  />
                  
                  <CardHeader className="relative z-20 pb-3">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <CardTitle className="text-2xl font-black mb-1 text-white drop-shadow-lg" style={{ 
                          textShadow: `0 0 20px ${vaultColor}, 0 4px 8px rgba(0,0,0,0.8), 0 2px 4px ${vaultColor}80` 
                        }}>
                          {vault.name}
                        </CardTitle>
                        <div className="flex items-center space-x-3">
                          <div className="text-3xl font-black text-white drop-shadow-xl" style={{ 
                            textShadow: `0 0 25px ${vaultColor}, 0 4px 8px rgba(0,0,0,0.9), 0 2px 6px ${vaultColor}AA`,
                            color: '#ffffff',
                            filter: `drop-shadow(0 0 8px ${vaultColor})`
                          }}>
                            {(vault.apy * 100).toFixed(1)}% APY
                          </div>
                          <div className={`px-3 py-1 rounded-full text-xs font-bold border drop-shadow-sm ${
                            riskLevel === 'Low' ? 'bg-green-500/30 text-green-300 border-green-500/50' :
                            riskLevel === 'Medium' ? 'bg-yellow-500/30 text-yellow-300 border-yellow-500/50' :
                            'bg-red-500/30 text-red-300 border-red-500/50'
                          }`} style={{
                            textShadow: '0 1px 2px rgba(0,0,0,0.8)'
                          }}>
                            {riskLevel} Risk
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-black text-white drop-shadow-lg" style={{
                          textShadow: `0 0 15px ${vaultColor}60, 0 4px 8px rgba(0,0,0,0.9)`,
                          color: '#ffffff'
                        }}>{formatCurrency(vault.tvl)}</div>
                        <div className="text-sm font-bold text-gray-100 drop-shadow-md" style={{
                          textShadow: '0 2px 4px rgba(0,0,0,0.8)'
                        }}>TVL</div>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="relative z-20 pt-0">
                    <p className="text-gray-100 mb-4 text-sm font-medium drop-shadow-md" style={{
                      textShadow: '0 2px 4px rgba(0,0,0,0.8)'
                    }}>
                      {vault.strategy.replace('_', ' ').toUpperCase()} strategy with {vault.tokenA}-{vault.tokenB} pair
                    </p>
                    
                    {/* Advanced Metrics */}
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="space-y-1.5">
                        <div className="flex justify-between">
                          <span className="text-xs text-gray-200 font-medium" style={{
                            textShadow: '0 1px 2px rgba(0,0,0,0.8)'
                          }}>Performance</span>
                          <span className="text-xs font-bold text-green-300 drop-shadow-md" style={{
                            textShadow: '0 0 8px #10b981, 0 2px 4px rgba(0,0,0,0.8)'
                          }}>{(vault.performance.totalReturn * 100).toFixed(1)}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-xs text-gray-200 font-medium" style={{
                            textShadow: '0 1px 2px rgba(0,0,0,0.8)'
                          }}>Sharpe Ratio</span>
                          <span className="text-xs font-bold text-blue-300 drop-shadow-md" style={{
                            textShadow: '0 0 8px #3b82f6, 0 2px 4px rgba(0,0,0,0.8)'
                          }}>{vault.performance.sharpeRatio.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-xs text-gray-200 font-medium" style={{
                            textShadow: '0 1px 2px rgba(0,0,0,0.8)'
                          }}>Win Rate</span>
                          <span className="text-xs font-bold text-purple-300 drop-shadow-md" style={{
                            textShadow: '0 0 8px #a855f7, 0 2px 4px rgba(0,0,0,0.8)'
                          }}>{(vault.performance.winRate * 100).toFixed(0)}%</span>
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <div className="flex justify-between">
                          <span className="text-xs text-gray-200 font-medium" style={{
                            textShadow: '0 1px 2px rgba(0,0,0,0.8)'
                          }}>Fee Tier</span>
                          <span className="text-xs font-bold text-emerald-300 drop-shadow-md" style={{
                            textShadow: '0 0 8px #10b981, 0 2px 4px rgba(0,0,0,0.8)'
                          }}>{(vault.fee * 100).toFixed(2)}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-xs text-gray-200 font-medium" style={{
                            textShadow: '0 1px 2px rgba(0,0,0,0.8)'
                          }}>Max Drawdown</span>
                          <span className={`text-xs font-bold drop-shadow-md ${
                            vault.performance.maxDrawdown > 0.05 ? 'text-red-300' : 'text-green-300'
                          }`} style={{
                            textShadow: vault.performance.maxDrawdown > 0.05 
                              ? '0 0 8px #ef4444, 0 2px 4px rgba(0,0,0,0.8)'
                              : '0 0 8px #10b981, 0 2px 4px rgba(0,0,0,0.8)'
                          }}>
                            {(vault.performance.maxDrawdown * 100).toFixed(1)}%
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-xs text-gray-200 font-medium" style={{
                            textShadow: '0 1px 2px rgba(0,0,0,0.8)'
                          }}>Chain ID</span>
                          <span className="text-xs font-bold text-cyan-300 drop-shadow-md" style={{
                            textShadow: '0 0 8px #06b6d4, 0 2px 4px rgba(0,0,0,0.8)'
                          }}>{vault.chainId}</span>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3 mt-4">
                      <Button 
                        className="flex-1 font-bold text-base h-12 px-6 btn-primary transition-all duration-300 border-2 border-transparent hover:scale-105 active:scale-95"
                        onClick={(e) => {
                          e.stopPropagation()
                          // Handle deposit functionality
                          handleDeposit(vault)
                        }}
                        disabled={depositMutation.isPending}
                      >
                        {depositMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Deposit'}
                      </Button>
                      <Button 
                        variant="outline" 
                        className="flex-1 font-bold text-base h-12 px-6 btn-secondary transition-all duration-300 border-2 hover:scale-105 active:scale-95"
                        onClick={(e) => {
                          e.stopPropagation()
                          // Navigate to vault analytics page
                          handleViewAnalytics(vault)
                        }}
                      >
                        Analytics
                      </Button>
                    </div>
                  </CardContent>
                </Card>
                  )
                })}
              </div>
            )}
          </div>
        </section>
      </div>

      {/* AI Chat Interface */}
      {showChat && (
        <div className="fixed inset-0 z-50 flex items-end justify-end p-4 pointer-events-none">
          <div className="pointer-events-auto w-full max-w-md h-[600px] mr-4 mb-20">
            <AIChat
              className="h-full"
              vaultAddress={selectedVault?.address}
              context={{
                currentPage: 'vaults',
                vaultData: filteredVaults,
                userPreferences: {
                  preferredTimeframe: '1d',
                  riskTolerance: 'medium',
                  autoRebalance: true,
                  selectedVault: selectedVault,
                  marketData: marketData
                }
              }}
              initialMessage="🎯 Welcome to SEI DLP Vaults! I'm Liqui, your AI assistant. I can help you analyze vault performance, predict optimal ranges, and recommend rebalancing strategies. What vault would you like to optimize today?"
            />
          </div>
        </div>
      )}

      {/* Floating AI Chat Button */}
      <div className="fixed bottom-8 right-8 z-20">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full animate-pulse opacity-30"></div>
          <button
            onClick={() => setShowChat(!showChat)}
            className="relative bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white p-4 rounded-full shadow-2xl transition-all duration-300 hover:scale-110 group"
          >
            {showChat ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
            <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-black/80 text-white text-xs px-3 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
              {showChat ? 'Close AI Chat' : 'Open AI Assistant'}
            </div>
          </button>
          {!showChat && (
            <div className="absolute -top-2 -right-2 w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
          )}
        </div>
      </div>

      {/* Enhanced Custom Styles - Premium DeFi Interface */}
      <style jsx>{`
        @keyframes borderGlow {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        
        @keyframes borderFlow {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        
        @keyframes pulseGlow {
          0%, 100% { 
            box-shadow: 0 0 20px rgba(0, 245, 212, 0.3), 0 0 40px rgba(0, 245, 212, 0.1);
          }
          50% { 
            box-shadow: 0 0 30px rgba(0, 245, 212, 0.5), 0 0 60px rgba(0, 245, 212, 0.2);
          }
        }
        
        .glass-card {
          backdrop-filter: blur(32px) saturate(180%);
          -webkit-backdrop-filter: blur(32px) saturate(180%);
          background: linear-gradient(135deg, 
            rgba(8, 10, 23, 0.92) 0%,
            rgba(16, 20, 40, 0.88) 50%,
            rgba(8, 10, 23, 0.92) 100%
          );
          border: 2px solid transparent;
          background-clip: padding-box;
          position: relative;
          overflow: hidden;
          border-radius: 20px;
          box-shadow: 
            0 16px 40px rgba(0, 0, 0, 0.8),
            0 8px 32px rgba(0, 245, 212, 0.12),
            inset 0 2px 0 rgba(255, 255, 255, 0.15),
            inset 0 -1px 0 rgba(0, 245, 212, 0.08);
          transition: all 0.4s cubic-bezier(0.23, 1, 0.32, 1);
        }
        
        .glass-card::before {
          content: '';
          position: absolute;
          inset: 0;
          padding: 2px;
          background: linear-gradient(135deg, 
            rgba(0, 245, 212, 0.5) 0%,
            rgba(155, 93, 229, 0.3) 50%,
            rgba(0, 245, 212, 0.5) 100%
          );
          border-radius: 20px;
          mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          mask-composite: exclude;
          -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor;
          animation: borderFlow 2s linear infinite;
        }
        
        .glass-card:hover {
          backdrop-filter: blur(40px) saturate(200%);
          -webkit-backdrop-filter: blur(40px) saturate(200%);
          background: linear-gradient(135deg, 
            rgba(8, 10, 23, 0.95) 0%,
            rgba(16, 20, 40, 0.92) 50%,
            rgba(8, 10, 23, 0.95) 100%
          );
          box-shadow: 
            0 24px 60px rgba(0, 0, 0, 0.9),
            0 12px 48px rgba(0, 245, 212, 0.2),
            inset 0 2px 0 rgba(255, 255, 255, 0.25),
            inset 0 -1px 0 rgba(0, 245, 212, 0.15);
          transform: translateY(-6px);
        }
        
        .vault-card-enhanced {
          backdrop-filter: blur(36px) saturate(200%);
          -webkit-backdrop-filter: blur(36px) saturate(200%);
          background: linear-gradient(135deg, 
            rgba(8, 10, 23, 0.94) 0%,
            rgba(16, 20, 40, 0.90) 30%,
            rgba(24, 30, 60, 0.88) 70%,
            rgba(8, 10, 23, 0.94) 100%
          );
          border: 3px solid transparent;
          background-clip: padding-box;
          position: relative;
          overflow: hidden;
          border-radius: 24px;
          min-height: 420px;
          width: 100%;
          max-width: 420px;
          box-shadow: 
            0 20px 60px rgba(0, 0, 0, 0.85),
            0 10px 40px rgba(155, 93, 229, 0.15),
            inset 0 3px 0 rgba(255, 255, 255, 0.2),
            inset 0 -2px 0 rgba(155, 93, 229, 0.1);
          transition: all 0.5s cubic-bezier(0.23, 1, 0.32, 1);
          cursor: pointer;
        }
        
        .vault-card-enhanced::before {
          content: '';
          position: absolute;
          inset: 0;
          padding: 3px;
          background: linear-gradient(135deg, 
            rgba(0, 245, 212, 0.7) 0%,
            rgba(155, 93, 229, 0.5) 20%,
            rgba(255, 32, 110, 0.5) 40%,
            rgba(251, 174, 60, 0.5) 60%,
            rgba(155, 93, 229, 0.5) 80%,
            rgba(0, 245, 212, 0.7) 100%
          );
          background-size: 300% 300%;
          border-radius: 24px;
          mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          mask-composite: exclude;
          -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor;
          animation: borderFlow 4s ease-in-out infinite;
        }
        
        .vault-card-enhanced::after {
          content: '';
          position: absolute;
          inset: 0;
          background: radial-gradient(circle at 50% 0%, 
            rgba(155, 93, 229, 0.15) 0%, 
            transparent 80%
          );
          border-radius: 24px;
          opacity: 0;
          transition: opacity 0.5s ease;
        }
        
        .vault-card-enhanced:hover {
          backdrop-filter: blur(44px) saturate(220%);
          -webkit-backdrop-filter: blur(44px) saturate(220%);
          background: linear-gradient(135deg, 
            rgba(8, 10, 23, 0.97) 0%,
            rgba(16, 20, 40, 0.94) 30%,
            rgba(24, 30, 60, 0.92) 70%,
            rgba(8, 10, 23, 0.97) 100%
          );
          box-shadow: 
            0 32px 80px rgba(0, 0, 0, 0.95),
            0 16px 60px rgba(155, 93, 229, 0.25),
            inset 0 3px 0 rgba(255, 255, 255, 0.3),
            inset 0 -2px 0 rgba(155, 93, 229, 0.2);
          transform: translateY(-6px) scale(1.03);
        }
        
        .vault-card-enhanced:hover::after {
          opacity: 1;
        }
        
        /* Enhanced button styles */
        .vault-card-enhanced .btn-primary {
          background: linear-gradient(135deg, var(--vault-color), var(--vault-color-dark));
          border: 2px solid transparent;
          border-radius: 16px;
          color: #000;
          font-weight: 700;
          font-size: 1rem;
          min-height: 48px;
          padding: 12px 24px;
          text-shadow: 0 1px 2px rgba(0,0,0,0.3);
          box-shadow: 
            0 8px 25px rgba(0,0,0,0.3),
            0 0 35px var(--vault-color-glow),
            inset 0 1px 0 rgba(255,255,255,0.2);
          transition: all 0.3s cubic-bezier(0.23, 1, 0.32, 1);
        }
        
        .vault-card-enhanced .btn-primary:hover {
          transform: translateY(-3px) scale(1.05);
          box-shadow: 
            0 12px 35px rgba(0,0,0,0.4),
            0 0 50px var(--vault-color-glow),
            inset 0 1px 0 rgba(255,255,255,0.3);
        }
        
        .vault-card-enhanced .btn-secondary {
          background: rgba(0,0,0,0.6);
          border: 2px solid var(--vault-color-border);
          border-radius: 16px;
          color: var(--vault-color);
          font-weight: 600;
          font-size: 1rem;
          min-height: 48px;
          padding: 12px 24px;
          text-shadow: 0 0 10px var(--vault-color-glow);
          backdrop-filter: blur(10px);
          box-shadow: 
            0 6px 20px rgba(0,0,0,0.3),
            inset 0 1px 0 rgba(255,255,255,0.1);
          transition: all 0.3s cubic-bezier(0.23, 1, 0.32, 1);
        }
        
        .vault-card-enhanced .btn-secondary:hover {
          background: var(--vault-color-bg);
          border-color: var(--vault-color);
          transform: translateY(-3px) scale(1.05);
          box-shadow: 
            0 10px 30px rgba(0,0,0,0.4),
            inset 0 1px 0 rgba(255,255,255,0.2);
        }
      `}</style>
    </div>
  );
}