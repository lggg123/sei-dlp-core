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
                  <Card key={index} className="glass-card border-primary/20 hover:border-primary/50 transition-all duration-300 h-20 flex items-center justify-center">
                    <CardContent className="p-3 text-center flex flex-col justify-center h-full">
                      <div className="text-lg font-bold text-primary-glow leading-tight">{stat.value}</div>
                      <div className="text-xs text-muted-foreground">{stat.label}</div>
                      <div className="text-xs text-green-400">{stat.change}</div>
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
              <div ref={vaultCardsRef} className="grid lg:grid-cols-2 gap-8">
                {filteredVaults.map((vault) => {
                  const vaultColor = getVaultColor(vault.strategy)
                  const riskLevel = getRiskLevel(vault.apy)
                  
                  return (
                <Card 
                  key={vault.address}
                  className="vault-card-enhanced border-2 hover:border-primary/70 transition-all duration-500 cursor-pointer group relative overflow-hidden"
                  onClick={() => {
                    setSelectedVault(vault)
                    router.push(`/vault?address=${vault.address}`)
                  }}
                  style={{
                    background: 'hsl(var(--card) / 0.95) !important',
                    backdropFilter: 'blur(24px) !important',
                    border: `2px solid ${vaultColor}50 !important`,
                    boxShadow: `0 8px 32px hsl(var(--primary) / 0.15), 0 0 30px ${vaultColor}30 !important`,
                    borderRadius: '16px !important',
                    minHeight: '280px !important'
                  }}
                >
                  {/* Dark overlay for better text readability */}
                  <div className="absolute inset-0 bg-black/20 z-0" />
                  
                  {/* Animated border */}
                  <div 
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-1"
                    style={{
                      background: `linear-gradient(45deg, ${vaultColor}30, transparent, ${vaultColor}30)`,
                      backgroundSize: '200% 200%',
                      animation: 'borderGlow 3s ease-in-out infinite',
                    }}
                  />
                  
                  <CardHeader className="relative z-20 pb-3">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <CardTitle className="text-xl font-bold mb-1" style={{ color: vaultColor }}>
                          {vault.name}
                        </CardTitle>
                        <div className="flex items-center space-x-3">
                          <div className="text-2xl font-bold text-primary-glow">
                            {(vault.apy * 100).toFixed(1)}% APY
                          </div>
                          <div className={`px-2 py-1 rounded-full text-xs font-bold ${
                            riskLevel === 'Low' ? 'bg-green-500/20 text-green-400' :
                            riskLevel === 'Medium' ? 'bg-yellow-500/20 text-yellow-400' :
                            'bg-red-500/20 text-red-400'
                          }`}>
                            {riskLevel} Risk
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-foreground">{formatCurrency(vault.tvl)}</div>
                        <div className="text-sm text-muted-foreground">TVL</div>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="relative z-20 pt-0">
                    <p className="text-muted-foreground mb-4 text-sm">
                      {vault.strategy.replace('_', ' ').toUpperCase()} strategy with {vault.tokenA}-{vault.tokenB} pair
                    </p>
                    
                    {/* Advanced Metrics */}
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="space-y-1.5">
                        <div className="flex justify-between">
                          <span className="text-xs text-muted-foreground">Performance</span>
                          <span className="text-xs font-bold text-primary">{(vault.performance.totalReturn * 100).toFixed(1)}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-xs text-muted-foreground">Sharpe Ratio</span>
                          <span className="text-xs font-bold text-secondary">{vault.performance.sharpeRatio.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-xs text-muted-foreground">Win Rate</span>
                          <span className="text-xs font-bold text-accent">{(vault.performance.winRate * 100).toFixed(0)}%</span>
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <div className="flex justify-between">
                          <span className="text-xs text-muted-foreground">Fee Tier</span>
                          <span className="text-xs font-bold text-green-400">{(vault.fee * 100).toFixed(2)}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-xs text-muted-foreground">Max Drawdown</span>
                          <span className={`text-xs font-bold ${vault.performance.maxDrawdown > 0.05 ? 'text-red-400' : 'text-green-400'}`}>
                            {(vault.performance.maxDrawdown * 100).toFixed(1)}%
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-xs text-muted-foreground">Chain ID</span>
                          <span className="text-xs font-bold text-primary-glow">{vault.chainId}</span>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <Button 
                        className="flex-1 font-semibold text-sm h-9 transition-all duration-300 hover:scale-105"
                        style={{
                          background: `linear-gradient(135deg, ${vaultColor}, ${vaultColor}80)`,
                          color: '#000',
                          boxShadow: `0 0 15px ${vaultColor}30`,
                        }}
                        onClick={(e) => {
                          e.stopPropagation()
                          // Navigate to individual vault page
                          router.push(`/vault?address=${vault.address}`)
                        }}
                        disabled={depositMutation.isPending}
                      >
                        {depositMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Deposit'}
                      </Button>
                      <Button 
                        variant="outline" 
                        className="flex-1 font-semibold text-sm h-9 border-primary/50 hover:border-primary transition-all duration-300"
                        onClick={(e) => {
                          e.stopPropagation()
                          // Navigate to vault analytics page
                          router.push(`/vault?address=${vault.address}&tab=analytics`)
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

      {/* Custom Styles */}
      <style jsx>{`
        @keyframes borderGlow {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        
        .glass-card {
          backdrop-filter: blur(16px);
          background: rgba(8, 10, 23, 0.95);
          border: 2px solid rgba(0, 245, 212, 0.3);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.15);
        }
        
        .glass-card:hover {
          backdrop-filter: blur(20px);
          background: rgba(8, 10, 23, 0.98);
          border-color: rgba(0, 245, 212, 0.5);
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.7), inset 0 1px 0 rgba(255, 255, 255, 0.2);
        }
        
        .vault-card-enhanced {
          backdrop-filter: blur(24px);
          background: rgba(8, 10, 23, 0.96);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.7), inset 0 1px 0 rgba(255, 255, 255, 0.15);
          border: 2px solid rgba(155, 93, 229, 0.3);
        }
        
        .vault-card-enhanced:hover {
          backdrop-filter: blur(28px);
          background: rgba(8, 10, 23, 0.98);
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.8), inset 0 1px 0 rgba(255, 255, 255, 0.2);
          border-color: rgba(155, 93, 229, 0.5);
        }
      `}</style>
    </div>
  );
}