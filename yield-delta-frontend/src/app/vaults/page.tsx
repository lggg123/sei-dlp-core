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
// import styles from './page.module.css'; // Commented out as not used

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

const getRiskBadgeStyle = (riskLevel: 'Low' | 'Medium' | 'High') => {
  const styles = {
    Low: {
      background: 'linear-gradient(45deg, rgba(16, 185, 129, 0.25), rgba(16, 185, 129, 0.45))',
      color: '#d1fae5',
      border: '1px solid rgba(16, 185, 129, 0.6)',
      boxShadow: '0 0 12px rgba(16, 185, 129, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
    },
    Medium: {
      background: 'linear-gradient(45deg, rgba(245, 158, 11, 0.25), rgba(245, 158, 11, 0.45))',
      color: '#fef3c7',
      border: '1px solid rgba(245, 158, 11, 0.6)',
      boxShadow: '0 0 12px rgba(245, 158, 11, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
    },
    High: {
      background: 'linear-gradient(45deg, rgba(239, 68, 68, 0.25), rgba(239, 68, 68, 0.45))',
      color: '#fecaca',
      border: '1px solid rgba(239, 68, 68, 0.6)',
      boxShadow: '0 0 12px rgba(239, 68, 68, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
    }
  }
  return styles[riskLevel]
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

  // Debug chat state changes
  useEffect(() => {
    console.log('[AI Chat] showChat state changed to:', showChat);
  }, [showChat]);

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
    <div className="min-h-screen bg-background relative">
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

      {/* Live Stats Ticker - Positioned right after navigation */}
      <div className="relative z-10" style={{ paddingTop: '3.5rem' }}>
        <div className="w-full" style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.25rem', marginTop: '0.125rem' }}>
          <div 
            ref={statsRef}
            style={{
              background: 'linear-gradient(135deg, rgba(155, 93, 229, 0.15) 0%, rgba(0, 245, 212, 0.08) 50%, rgba(255, 32, 110, 0.12) 100%)',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(155, 93, 229, 0.3)',
              borderRadius: '16px',
              padding: '6px 20px',
              boxShadow: '0 8px 32px rgba(0, 245, 212, 0.1), 0 0 0 1px rgba(155, 93, 229, 0.2)',
              overflow: 'hidden',
              position: 'relative',
              display: 'inline-block',
              width: '100%',
              maxWidth: '1400px'
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
                width: '100%',
                justifyContent: 'center'
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

      {/* Main Content - Header and Vaults */}
      <div className="relative z-10" style={{ paddingTop: '0' }}>
        {/* Header Section - Enhanced with minimal spacing */}
        <section className="py-0 px-4" style={{ paddingTop: '0' }}>
          <div className="container mx-auto max-w-7xl"> {/* Ensure consistent max-width */}
            <div className="text-center mb-2">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-primary via-accent to-secondary">
                AI-Powered Yield Optimization on SEI
              </h1>
            </div>
          </div>
        </section>

        {/* Vaults Grid */}
        <section className="py-1 px-4">
          <div className="container mx-auto max-w-7xl"> {/* Ensure consistent max-width */}
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
                  const riskLevel = getRiskLevel(vault.apy, vault.strategy)
                  
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
                              ...getRiskBadgeStyle(riskLevel),
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

      {/* AI Chat Interface - Fixed CSS Overrides */}
      {showChat && (
        <div 
          className="fixed inset-0 z-40 flex items-end justify-end p-4 pointer-events-none"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 40,
            pointerEvents: 'none',
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'flex-end',
            padding: '1rem'
          }}
        >
          <div 
            className="pointer-events-auto w-full max-w-md h-[600px] mr-4 mb-20"
            style={{
              pointerEvents: 'auto',
              width: '100%',
              maxWidth: '28rem',
              minWidth: '320px',
              height: '600px',
              marginRight: '1rem',
              marginBottom: '5rem',
              borderRadius: '20px',
              boxShadow: '0 25px 50px rgba(0, 0, 0, 0.5), 0 0 30px rgba(0, 245, 212, 0.2)',
              // Force text color inheritance
              color: '#ffffff',
              overflow: 'hidden',
              position: 'relative'
            }}
          >
            {/* Debug Info - Improved Styling */}
            <div style={{ 
              position: 'absolute', 
              top: '10px', 
              right: '10px', 
              background: 'rgba(0, 245, 212, 0.9)', 
              color: 'black', 
              padding: '4px 8px', 
              borderRadius: '6px', 
              fontSize: '10px',
              fontWeight: '600',
              zIndex: 1000,
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)'
            }}>
              Chat: {showChat ? 'ACTIVE' : 'CLOSED'}
            </div>
            
            <AIChat
              className="h-full ai-chat-override"
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
            
            {/* Inline CSS Override for AI Chat Input - Highest Specificity */}
            <style jsx>{`
              .ai-chat-override input {
                background: linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.05) 100%) !important;
                border: 1px solid rgba(255, 255, 255, 0.2) !important;
                color: #ffffff !important;
                font-size: 14px !important;
                padding: 12px 16px !important;
                border-radius: 12px !important;
                backdrop-filter: blur(10px) !important;
                outline: none !important;
              }
              
              .ai-chat-override input:focus {
                border-color: rgba(0, 245, 212, 0.5) !important;
                background: linear-gradient(135deg, rgba(255, 255, 255, 0.12) 0%, rgba(255, 255, 255, 0.08) 100%) !important;
                box-shadow: 0 0 20px rgba(0, 245, 212, 0.2) !important;
              }
              
              .ai-chat-override input::placeholder {
                color: rgba(255, 255, 255, 0.4) !important;
              }
              
              .ai-chat-override .text-xs {
                color: rgba(255, 255, 255, 0.5) !important;
                font-size: 11px !important;
              }
              
              .ai-chat-override * {
                color: #ffffff;
              }
            `}</style>
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

      {/* Floating AI Chat Button - Ultra-Enhanced Visibility Design */}
      <div 
        className="ai-chat-button-container-override"
        style={{ 
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 999999,
          isolation: 'isolate',
          pointerEvents: 'auto'
        }}
      >
        {/* Mobile responsive positioning */}
        <style jsx>{`
          @media (max-width: 768px) {
            .ai-chat-button-container-override {
              bottom: 20px !important;
              right: 20px !important;
            }
            .ai-chat-button-main-override {
              width: 70px !important;
              height: 70px !important;
              padding: 18px !important;
            }
          }
          @media (max-width: 480px) {
            .ai-chat-button-container-override {
              bottom: 16px !important;
              right: 16px !important;
            }
            .ai-chat-button-main-override {
              width: 64px !important;
              height: 64px !important;
              padding: 16px !important;
            }
          }
        `}</style>
        <div className="relative" style={{ isolation: 'isolate' }}>
          {/* Ultra-Bright Glow Ring for Maximum Visibility */}
          <div 
            className="absolute inset-0 rounded-full"
            style={{ 
              background: 'linear-gradient(45deg, #00f5d4, #ff206e, #9b5de5, #00f5d4)',
              backgroundSize: '400% 400%',
              borderRadius: '50%',
              animation: 'aiChatGlow 3s ease-in-out infinite',
              filter: 'blur(8px)',
              opacity: '0.6',
              transform: 'scale(1.4)'
            }}
          ></div>
          
          {/* High-Contrast Border Ring */}
          <div 
            className="absolute inset-0 rounded-full"
            style={{ 
              background: 'conic-gradient(from 0deg, #ffffff, #00f5d4, #ffffff, #ff206e, #ffffff)',
              borderRadius: '50%',
              padding: '3px',
              animation: 'aiChatBorderSpin 4s linear infinite'
            }}
          >
            <div style={{ 
              background: '#000000',
              borderRadius: '50%',
              width: '100%',
              height: '100%'
            }}></div>
          </div>
          
          {/* Main Ultra-Visible Button */}
          <button
            onClick={() => {
              console.log('[AI Chat] Button clicked, current showChat:', showChat);
              setShowChat(!showChat);
              console.log('[AI Chat] Setting showChat to:', !showChat);
            }}
            className="ai-chat-button-main-override relative text-white rounded-full transition-all duration-300 hover:scale-110 group"
            style={{ 
              position: 'relative',
              background: 'linear-gradient(135deg, #00f5d4 0%, #10b981 30%, #ff206e 70%, #9b5de5 100%)',
              border: '4px solid #ffffff',
              borderRadius: '50%',
              padding: '20px',
              boxShadow: '0 0 50px rgba(0, 245, 212, 0.8), 0 0 100px rgba(255, 32, 110, 0.4), inset 0 0 30px rgba(255, 255, 255, 0.2)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '80px',
              height: '80px',
              fontSize: '28px',
              zIndex: 999999,
              isolation: 'isolate',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = '0 0 80px rgba(0, 245, 212, 1), 0 0 150px rgba(255, 32, 110, 0.6), inset 0 0 40px rgba(255, 255, 255, 0.3)';
              e.currentTarget.style.transform = 'scale(1.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = '0 0 50px rgba(0, 245, 212, 0.8), 0 0 100px rgba(255, 32, 110, 0.4), inset 0 0 30px rgba(255, 255, 255, 0.2)';
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            {showChat ? <X className="w-8 h-8" style={{ filter: 'drop-shadow(0 0 10px #ffffff)' }} /> : <MessageCircle className="w-8 h-8" style={{ filter: 'drop-shadow(0 0 10px #ffffff)' }} />}
            
            {/* Ultra-Bright Tooltip */}
            <div 
              className="absolute -top-20 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 whitespace-nowrap pointer-events-none"
              style={{
                background: 'linear-gradient(135deg, #000000 0%, #1a1a1a 100%)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border: '2px solid #00f5d4',
                borderRadius: '12px',
                padding: '12px 16px',
                fontSize: '14px',
                fontWeight: '700',
                color: '#ffffff',
                textShadow: '0 0 10px #00f5d4',
                boxShadow: '0 10px 30px rgba(0, 0, 0, 0.8), 0 0 50px rgba(0, 245, 212, 0.5)',
                zIndex: 9999999
              }}
            >
              {showChat ? '✕ Close AI Assistant' : '🤖 Ask Liqui AI'}
              <div 
                className="absolute top-full left-1/2 transform -translate-x-1/2"
                style={{
                  width: 0,
                  height: 0,
                  borderLeft: '8px solid transparent',
                  borderRight: '8px solid transparent',
                  borderTop: '8px solid #00f5d4'
                }}
              ></div>
            </div>
          </button>
          
          {/* Ultra-Bright Status Indicator - Fixed positioning to prevent cutoff */}
          {!showChat && (
            <div 
              className="absolute -top-1 -right-1"
              style={{
                width: '18px',
                height: '18px',
                background: 'radial-gradient(circle, #00ff00 0%, #00cc00 100%)',
                borderRadius: '50%',
                border: '2px solid #ffffff',
                boxShadow: '0 0 20px rgba(0, 255, 0, 0.8), 0 0 40px rgba(0, 255, 0, 0.4)',
                animation: 'aiChatPulse 2s ease-in-out infinite',
                zIndex: 9999999,
                transform: 'translate(-2px, -2px)' // Ensure it stays within button bounds
              }}
            ></div>
          )}
        </div>
      </div>

    </div>
  );
}
