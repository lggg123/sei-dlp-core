"use client"

import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import StatsCardGraphic from '@/components/StatsCardGraphic';
import Navigation from '@/components/Navigation';
import AIChat from '@/components/AIChat';
import DepositModal from '@/components/DepositModal';
import { MessageCircle, X, Loader2 } from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import * as THREE from 'three';
import { useSeiMarketData } from '@/hooks/useMarketData';
import { useVaultStore, VaultData } from '@/stores/vaultStore';
import '@/components/StatsCarousel.css';
import styles from './page.module.css';

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
    stable_max: '#10b981',
    sei_hypergrowth: '#f59e0b',
    blue_chip: '#3b82f6',
    delta_neutral: '#8b5cf6',
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
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [depositVault, setDepositVault] = useState<VaultData | null>(null);

  // State management
  const {
    selectedVault,
    setSelectedVault,
    getFilteredVaults,
    getTotalTVL,
    isLoading: vaultLoading,
    isError: vaultError,
  } = useVaultStore()
  
  // Temporary direct fetch to bypass React Query issues
  const [vaultsData, setVaultsData] = React.useState<VaultData[]>([]);
  const [queryLoading, setQueryLoading] = React.useState(true);
  const [queryError, setQueryError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    const fetchVaults = async () => {
      try {
        console.log('[VaultsPage] Direct fetch starting...');
        setQueryLoading(true);
        const response = await fetch('/api/vaults');
        console.log('[VaultsPage] Direct fetch response:', response.status, response.statusText);
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const result = await response.json();
        console.log('[VaultsPage] Direct fetch result:', result);
        
        if (result.success && result.data) {
          setVaultsData(result.data);
          console.log('[VaultsPage] Successfully loaded', result.data.length, 'vaults');
        } else {
          throw new Error(result.error || 'Invalid response format');
        }
      } catch (error) {
        console.error('[VaultsPage] Direct fetch error:', error);
        setQueryError(error as Error);
      } finally {
        setQueryLoading(false);
      }
    };

    fetchVaults();
  }, []);

  const { data: marketData } = useSeiMarketData();
  // Combine loading states
  const isLoading = vaultLoading || queryLoading
  const error = vaultError || queryError
  
  // Get filtered vaults from store - prefer API data over store
  const filteredVaults = React.useMemo(() => {
    return vaultsData && vaultsData.length > 0 ? vaultsData : getFilteredVaults()
  }, [vaultsData, getFilteredVaults])
  
  // Debug API data
  React.useEffect(() => {
    if (vaultsData) {
      console.log('[VaultsPage] API vaultsData loaded:', vaultsData.length, 'vaults');
      console.log('[VaultsPage] First vault example:', vaultsData[0]);
    }
  }, [vaultsData]);
  
  // Debug store data (throttled)
  const lastLogRef = useRef<string>('');
  React.useEffect(() => {
    const currentState = `${filteredVaults.length}|${selectedVault?.name || 'NONE'}|${depositVault?.name || 'NONE'}|${showDepositModal}`;
    if (currentState !== lastLogRef.current) {
      console.log('[VaultsPage] Store state changed:', { 
        filteredVaults: filteredVaults.length,
        selectedVault: selectedVault?.name || 'NONE',
        depositVault: depositVault?.name || 'NONE',
        showDepositModal 
      });
      lastLogRef.current = currentState;
    }
  }, [filteredVaults, selectedVault, depositVault, showDepositModal]);
  const totalTVL = vaultsData && vaultsData.length > 0 ? 
    vaultsData.reduce((total, vault) => total + vault.tvl, 0) : 
    getTotalTVL()
  
  // Handler functions for vault actions
  const handleDeposit = React.useCallback((vault: VaultData) => {
    try {
      console.log('[Deposit] handleDeposit called', { 
        vault: vault?.name || 'VAULT IS NULL/UNDEFINED',
        vaultExists: !!vault,
        vaultKeys: vault ? Object.keys(vault) : 'no keys',
        vaultStrategy: vault?.strategy,
        vaultAddress: vault?.address
      });
      
      if (!vault) {
        console.error('[Deposit] ERROR: Vault is null or undefined!');
        return;
      }
      
      // Set both store state and local state
      setSelectedVault(vault)
      setDepositVault(vault)
      setShowDepositModal(true)
      
      // Debug the state immediately
      console.log('[Deposit] State set - showModal:', true, 'vault:', vault.name);
      console.log('[Deposit] Full vault data:', JSON.stringify(vault, null, 2));
      
      // Force a re-render to check if the state persists
      setTimeout(() => {
        console.log('[Deposit] Modal state after 100ms - checking current state');
      }, 100);
    } catch (error) {
      console.error('Deposit error:', error)
    }
  }, [setSelectedVault, setDepositVault, setShowDepositModal]);

  const handleDepositSuccess = React.useCallback((txHash: string) => {
    // Optional: Show success notification or redirect to transaction
    console.log('Deposit successful:', txHash)
    // Could add toast notification here
  }, [])

  const handleCloseModal = React.useCallback(() => {
    console.log('[DepositModal] onClose called');
    setShowDepositModal(false)
    // Delay setting depositVault to null to ensure smooth transition
    setTimeout(() => {
      setDepositVault(null)
      console.log('[DepositModal] Modal state after close', {
        showDepositModal: false,
        depositVault: null
      });
    }, 300);
  }, [setDepositVault]);
  
  const handleViewAnalytics = (vault: VaultData) => {
    setSelectedVault(vault)
    // Navigate to vault analytics page
    router.push(`/vault?address=${vault.address}&tab=analytics`)
  }

  // Three.js Setup
  useEffect(() => {
    const currentMount = mountRef.current;
    if (!currentMount || scene) return; // Prevent multiple scene creations

    // Scene setup
    const newScene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000, 0);
    currentMount.appendChild(renderer.domElement);

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
      size: 1,
      vertexColors: true,
      transparent: true,
      opacity: 0.2,
    });

    const particleSystem = new THREE.Points(particles, particleMaterial);
    newScene.add(particleSystem);

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
        opacity: 0.1,
      });
      
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(
        (Math.random() - 0.5) * 50,
        (Math.random() - 0.5) * 50,
        (Math.random() - 0.5) * 50
      );
      newScene.add(mesh);
    });

    camera.position.z = 30;
    setScene(newScene);
    console.log('[VaultsPage] Three.js scene created with', newScene.children.length, 'objects');

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      
      // Rotate particles
      particleSystem.rotation.x += 0.001;
      particleSystem.rotation.y += 0.002;

      // Rotate geometric shapes
      newScene.children.forEach((child) => {
        if (child instanceof THREE.Mesh) {
          child.rotation.x += 0.01;
          child.rotation.y += 0.01;
        }
      });

      renderer.render(newScene, camera);
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
      if (currentMount && renderer.domElement) {
        currentMount.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [scene]); // Add scene as dependency to prevent recreation

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
      <div className="fixed inset-0 z-5 bg-gradient-to-b from-background/70 via-background/60 to-background/70 pointer-events-none" />

      {/* Navigation */}
      <Navigation variant="dark" showWallet={true} showLaunchApp={false} />

      {/* Main Content */}
      <div className="relative z-10 pt-20">
        {/* Header Section - Enhanced */}
        <section className="py-8 px-4">
          <div className="container mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold mb-8 text-transparent bg-clip-text bg-gradient-to-r from-primary via-accent to-secondary">
                AI-Powered Yield Optimization on SEI
              </h1>
              
              {/* Live Stats Ticker - Enhanced Design with Tight Layout */}
              <div className="w-full mb-6" style={{ display: 'flex', justifyContent: 'center' }}>
                <div 
                  ref={statsRef}
                  style={{
                    background: 'linear-gradient(135deg, rgba(155, 93, 229, 0.15) 0%, rgba(0, 245, 212, 0.08) 50%, rgba(255, 32, 110, 0.12) 100%)',
                    backdropFilter: 'blur(16px)',
                    border: '1px solid rgba(155, 93, 229, 0.3)',
                    borderRadius: '16px',
                    padding: '12px 20px',
                    boxShadow: '0 8px 32px rgba(0, 245, 212, 0.1), 0 0 0 1px rgba(155, 93, 229, 0.2)',
                    overflow: 'hidden',
                    position: 'relative',
                    display: 'inline-block',
                    maxWidth: '90vw'
                  }}
                >
                  <div 
                    className="animate-scroll"
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '12px',
                      whiteSpace: 'nowrap',
                      fontSize: '14px',
                      fontWeight: '600',
                      color: 'rgba(255, 255, 255, 0.9)',
                      width: 'fit-content'
                    }}
                  >
                    {/* First set */}
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '8px', 
                      background: 'rgba(0, 0, 0, 0.25)', 
                      borderRadius: '8px', 
                      padding: '6px 12px', 
                      border: '1px solid rgba(155, 93, 229, 0.2)',
                      whiteSpace: 'nowrap',
                      flexShrink: 0
                    }}>
                      <StatsCardGraphic type="tvl" className="w-4 h-4 flex-shrink-0" />
                      <span style={{ fontSize: '10px', color: 'rgba(255, 255, 255, 0.6)', fontWeight: '500' }}>TVL</span>
                      <span style={{ fontWeight: 'bold', color: '#00f5d4', fontSize: '13px' }}>{isLoading ? '...' : formatCurrency(totalTVL)}</span>
                    </div>
                    
                    <div style={{ width: '1px', height: '20px', background: 'linear-gradient(to bottom, transparent, rgba(155, 93, 229, 0.4), transparent)', flexShrink: 0 }} />
                    
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '8px', 
                      background: 'rgba(0, 0, 0, 0.25)', 
                      borderRadius: '8px', 
                      padding: '6px 12px', 
                      border: '1px solid rgba(155, 93, 229, 0.2)',
                      whiteSpace: 'nowrap',
                      flexShrink: 0
                    }}>
                      <StatsCardGraphic type="vaults" className="w-4 h-4 flex-shrink-0" />
                      <span style={{ fontSize: '10px', color: 'rgba(255, 255, 255, 0.6)', fontWeight: '500' }}>Vaults</span>
                      <span style={{ fontWeight: 'bold', color: '#9b5de5', fontSize: '13px' }}>{isLoading ? '...' : filteredVaults.length}</span>
                    </div>
                    
                    <div style={{ width: '1px', height: '20px', background: 'linear-gradient(to bottom, transparent, rgba(155, 93, 229, 0.4), transparent)', flexShrink: 0 }} />
                    
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '8px', 
                      background: 'rgba(0, 0, 0, 0.25)', 
                      borderRadius: '8px', 
                      padding: '6px 12px', 
                      border: '1px solid rgba(155, 93, 229, 0.2)',
                      whiteSpace: 'nowrap',
                      flexShrink: 0
                    }}>
                      <StatsCardGraphic type="apy" className="w-4 h-4 flex-shrink-0" />
                      <span style={{ fontSize: '10px', color: 'rgba(255, 255, 255, 0.6)', fontWeight: '500' }}>APY</span>
                      <span style={{ fontWeight: 'bold', color: '#10b981', fontSize: '13px' }}>{isLoading ? '...' : `${filteredVaults.length > 0 ? (filteredVaults.reduce((sum, v) => sum + v.apy, 0) / filteredVaults.length).toFixed(1) : '0'}%`}</span>
                    </div>
                    
                    <div style={{ width: '1px', height: '20px', background: 'linear-gradient(to bottom, transparent, rgba(155, 93, 229, 0.4), transparent)', flexShrink: 0 }} />
                    
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '8px', 
                      background: 'rgba(0, 0, 0, 0.25)', 
                      borderRadius: '8px', 
                      padding: '6px 12px', 
                      border: '1px solid rgba(155, 93, 229, 0.2)',
                      whiteSpace: 'nowrap',
                      flexShrink: 0
                    }}>
                      <StatsCardGraphic type="uptime" className="w-4 h-4 flex-shrink-0" />
                      <span style={{ fontSize: '10px', color: 'rgba(255, 255, 255, 0.6)', fontWeight: '500' }}>AI</span>
                      <span style={{ fontWeight: 'bold', color: '#3b82f6', fontSize: '13px' }}>99.97%</span>
                    </div>

                    {/* Duplicate set for seamless scrolling */}
                    <div style={{ width: '1px', height: '20px', background: 'linear-gradient(to bottom, transparent, rgba(155, 93, 229, 0.4), transparent)', flexShrink: 0 }} />
                    
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '8px', 
                      background: 'rgba(0, 0, 0, 0.25)', 
                      borderRadius: '8px', 
                      padding: '6px 12px', 
                      border: '1px solid rgba(155, 93, 229, 0.2)',
                      whiteSpace: 'nowrap',
                      flexShrink: 0
                    }}>
                      <StatsCardGraphic type="tvl" className="w-4 h-4 flex-shrink-0" />
                      <span style={{ fontSize: '10px', color: 'rgba(255, 255, 255, 0.6)', fontWeight: '500' }}>TVL</span>
                      <span style={{ fontWeight: 'bold', color: '#00f5d4', fontSize: '13px' }}>{isLoading ? '...' : formatCurrency(totalTVL)}</span>
                    </div>
                    
                    <div style={{ width: '1px', height: '20px', background: 'linear-gradient(to bottom, transparent, rgba(155, 93, 229, 0.4), transparent)', flexShrink: 0 }} />
                    
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '8px', 
                      background: 'rgba(0, 0, 0, 0.25)', 
                      borderRadius: '8px', 
                      padding: '6px 12px', 
                      border: '1px solid rgba(155, 93, 229, 0.2)',
                      whiteSpace: 'nowrap',
                      flexShrink: 0
                    }}>
                      <StatsCardGraphic type="vaults" className="w-4 h-4 flex-shrink-0" />
                      <span style={{ fontSize: '10px', color: 'rgba(255, 255, 255, 0.6)', fontWeight: '500' }}>Vaults</span>
                      <span style={{ fontWeight: 'bold', color: '#9b5de5', fontSize: '13px' }}>{isLoading ? '...' : filteredVaults.length}</span>
                    </div>
                    
                    <div style={{ width: '1px', height: '20px', background: 'linear-gradient(to bottom, transparent, rgba(155, 93, 229, 0.4), transparent)', flexShrink: 0 }} />
                    
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '8px', 
                      background: 'rgba(0, 0, 0, 0.25)', 
                      borderRadius: '8px', 
                      padding: '6px 12px', 
                      border: '1px solid rgba(155, 93, 229, 0.2)',
                      whiteSpace: 'nowrap',
                      flexShrink: 0
                    }}>
                      <StatsCardGraphic type="apy" className="w-4 h-4 flex-shrink-0" />
                      <span style={{ fontSize: '10px', color: 'rgba(255, 255, 255, 0.6)', fontWeight: '500' }}>APY</span>
                      <span style={{ fontWeight: 'bold', color: '#10b981', fontSize: '13px' }}>{isLoading ? '...' : `${filteredVaults.length > 0 ? (filteredVaults.reduce((sum, v) => sum + v.apy, 0) / filteredVaults.length).toFixed(1) : '0'}%`}</span>
                    </div>
                    
                    <div style={{ width: '1px', height: '20px', background: 'linear-gradient(to bottom, transparent, rgba(155, 93, 229, 0.4), transparent)', flexShrink: 0 }} />
                    
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '8px', 
                      background: 'rgba(0, 0, 0, 0.25)', 
                      borderRadius: '8px', 
                      padding: '6px 12px', 
                      border: '1px solid rgba(155, 93, 229, 0.2)',
                      whiteSpace: 'nowrap',
                      flexShrink: 0
                    }}>
                      <StatsCardGraphic type="uptime" className="w-4 h-4 flex-shrink-0" />
                      <span style={{ fontSize: '10px', color: 'rgba(255, 255, 255, 0.6)', fontWeight: '500' }}>AI</span>
                      <span style={{ fontWeight: 'bold', color: '#3b82f6', fontSize: '13px' }}>99.97%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Vaults Grid */}
        <section className="py-4 px-4">
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
              <div 
                ref={vaultCardsRef} 
                className="grid gap-8 md:gap-12 max-w-7xl mx-auto"
                style={{ 
                  gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))',
                  justifyContent: 'center',
                  gridAutoRows: '1fr',
                  gap: '2.5rem'
                }}
              >
                {filteredVaults && filteredVaults.map((vault) => {
                  const vaultColor = getVaultColor(vault.strategy)
                  const riskLevel = getRiskLevel(vault.apy)
                  
                  return (
                <Card 
                  key={vault.address}
                  className="vault-solid-card transition-all duration-500 cursor-pointer group relative overflow-hidden hover:scale-[1.02] hover:shadow-2xl"
                  style={{
                    background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '20px',
                    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.1) inset',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = `${vaultColor}60`;
                    e.currentTarget.style.boxShadow = `0 25px 50px rgba(0, 0, 0, 0.5), 0 0 30px ${vaultColor}40, 0 0 0 1px rgba(255, 255, 255, 0.15) inset`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                    e.currentTarget.style.boxShadow = '0 20px 40px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.1) inset';
                  }}
                  // Remove card click navigation to analytics, only use explicit Analytics button
                >
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <CardTitle className="text-2xl font-black mb-1 text-vault-primary">
                          {vault.name}
                        </CardTitle>
                        <div className="flex items-center justify-between" style={{ gap: '1rem', marginTop: '1.25rem', marginBottom: '1rem' }}>
                          <div className="text-3xl font-black text-enhanced-glow" style={{ color: vaultColor }}>
                            {(vault.apy * 100).toFixed(1)}% APY
                          </div>
                          {/* Enhanced Risk Badge */}
                          <div 
                            style={{
                              padding: '0.4rem 0.875rem',
                              background: 'linear-gradient(45deg, rgba(16, 185, 129, 0.25), rgba(16, 185, 129, 0.45))',
                              color: '#d1fae5',
                              border: '1px solid rgba(16, 185, 129, 0.6)',
                              boxShadow: '0 0 12px rgba(16, 185, 129, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
                              whiteSpace: 'nowrap',
                              borderRadius: '12px',
                              display: 'inline-block',
                              fontSize: '0.8125rem',
                              fontWeight: '700',
                              textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)',
                              backdropFilter: 'blur(8px)'
                            }}
                          >
                            {riskLevel} Risk
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-black text-vault-primary">{formatCurrency(vault.tvl)}</div>
                        <div className="text-sm font-bold text-muted-foreground">TVL</div>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="pt-0">
                    <p className="text-muted-foreground mb-4 text-sm font-medium">
                      {vault.strategy.replace('_', ' ').toUpperCase()} strategy with {vault.tokenA}-{vault.tokenB} pair
                    </p>
                    
                    {/* Advanced Metrics - Enhanced Layout */}
                    <div className="grid grid-cols-2 mb-6 mt-6" style={{ gap: '2rem' }}>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground font-medium">Performance</span>
                          <span className="text-sm font-bold text-green-400">{(vault.performance.totalReturn * 100).toFixed(1)}%</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground font-medium">Sharpe Ratio</span>
                          <span className="text-sm font-bold text-blue-400">{vault.performance.sharpeRatio.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground font-medium">Win Rate</span>
                          <span className="text-sm font-bold text-purple-400">{(vault.performance.winRate * 100).toFixed(0)}%</span>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground font-medium">Fee Tier</span>
                          <span className="text-sm font-bold text-emerald-400">{(vault.fee * 100).toFixed(2)}%</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground font-medium">Max Drawdown</span>
                          <span className={`text-sm font-bold ${
                            vault.performance.maxDrawdown > 0.05 ? 'text-red-400' : 'text-green-400'
                          }`}>
                            {(vault.performance.maxDrawdown * 100).toFixed(1)}%
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground font-medium">Chain ID</span>
                          <span className="text-sm font-bold text-cyan-400">{vault.chainId}</span>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons - Enhanced Spacing and Sizing */}
                    <div className="vault-action-buttons">  
                      <Button 
                        className="w-44 font-bold text-sm h-11 px-8 btn-vault-primary transition-all duration-300 border-2 border-transparent hover:scale-105 active:scale-95 relative z-20 shadow-lg"
                        onClick={(e) => {
                          console.log('[BUTTON CLICK] Deposit button clicked - IMMEDIATE', new Date().toISOString());
                          e.preventDefault();
                          e.stopPropagation();
                          console.log('[VaultsPage] Deposit button clicked for vault:', vault.name);
                          console.log('[VaultsPage] Vault object:', vault);
                          console.log('[VaultsPage] Event details:', { target: e.target, currentTarget: e.currentTarget });
                          console.log('[VaultsPage] About to call handleDeposit with vault:', vault);
                          handleDeposit(vault);
                          console.log('[VaultsPage] handleDeposit call completed');
                        }}
                        style={{
                          pointerEvents: 'auto',
                          cursor: 'pointer'
                        }}
                      >
                        Deposit
                      </Button>
                      <Button 
                        variant="outline" 
                        className="w-44 font-bold text-sm h-11 px-8 btn-vault-secondary transition-all duration-300 border-2 hover:scale-105 active:scale-95 relative z-20 shadow-lg"
                        onClick={(e) => { 
                          e.preventDefault();
                          e.stopPropagation();
                          console.log('[VaultsPage] Analytics button clicked for vault:', vault.name);
                          handleViewAnalytics(vault);
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
        <div className="fixed inset-0 z-40 flex items-end justify-end p-4 pointer-events-none">
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

      {/* Deposit Modal */}
      <DepositModal
        vault={depositVault}
        isOpen={showDepositModal}
        onClose={handleCloseModal}
        onSuccess={handleDepositSuccess}
      />

      {/* Floating AI Chat Button */}
      <div className="fixed bottom-8 right-8 z-[70]">
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

    </div>
  );
}
