"use client"

import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Navigation from '@/components/Navigation';
import AIChat from '@/components/AIChat';
import { MessageCircle, X } from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import * as THREE from 'three';

gsap.registerPlugin(ScrollTrigger);

interface VaultData {
  id: string;
  name: string;
  apy: number;
  tvl: string;
  risk: 'Low' | 'Medium' | 'High';
  color: string;
  description: string;
  totalDeposits: string;
  activeStrategies: number;
  lastRebalance: string;
  aiConfidence: number;
  dailyVolume: string;
  impermanentLoss: number;
}

const vaultsData: VaultData[] = [
  {
    id: 'stable-max',
    name: 'StableMax Vault',
    apy: 12.8,
    tvl: '$2.4M',
    risk: 'Low',
    color: '#00f5d4',
    description: 'AI-optimized stable farming with cross-protocol yield aggregation and minimal IL exposure.',
    totalDeposits: '$2,437,892',
    activeStrategies: 3,
    lastRebalance: '2 hours ago',
    aiConfidence: 94,
    dailyVolume: '$847,293',
    impermanentLoss: -0.12,
  },
  {
    id: 'sei-hypergrowth',
    name: 'SEI Hypergrowth',
    apy: 24.5,
    tvl: '$1.8M',
    risk: 'Medium',
    color: '#9b5de5',
    description: 'Native SEI ecosystem exposure with 400ms rebalancing and concentrated liquidity management.',
    totalDeposits: '$1,847,203',
    activeStrategies: 5,
    lastRebalance: '23 minutes ago',
    aiConfidence: 87,
    dailyVolume: '$1,294,847',
    impermanentLoss: -2.31,
  },
  {
    id: 'bluechip-vault',
    name: 'BlueChip Vault',
    apy: 18.2,
    tvl: '$3.1M',
    risk: 'Low',
    color: '#ff206e',
    description: 'Diversified blue-chip DeFi exposure with advanced risk mitigation and yield optimization.',
    totalDeposits: '$3,127,485',
    activeStrategies: 4,
    lastRebalance: '1 hour ago',
    aiConfidence: 91,
    dailyVolume: '$674,529',
    impermanentLoss: -0.87,
  },
  {
    id: 'meta-arbitrage',
    name: 'Meta Arbitrage',
    apy: 31.7,
    tvl: '$956K',
    risk: 'High',
    color: '#ffa500',
    description: 'Cross-exchange MEV extraction with advanced arbitrage strategies across SEI ecosystem.',
    totalDeposits: '$956,247',
    activeStrategies: 7,
    lastRebalance: '12 minutes ago',
    aiConfidence: 79,
    dailyVolume: '$2,847,193',
    impermanentLoss: -4.23,
  },
];

export default function VaultsPage() {
  const mountRef = useRef<HTMLDivElement>(null);
  const vaultCardsRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);
  const [selectedVault, setSelectedVault] = useState<VaultData | null>(null);
  const [scene, setScene] = useState<THREE.Scene | null>(null);
  const [showChat, setShowChat] = useState(false);

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

  const handleVaultSelect = (vault: VaultData) => {
    setSelectedVault(vault);
  };

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

      {/* Navigation */}
      <Navigation variant="dark" />

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
                  { label: 'Total TVL', value: '$8.3M', change: '+12.4%' },
                  { label: 'Active Vaults', value: '4', change: '+1' },
                  { label: 'Avg APY', value: '21.8%', change: '+3.2%' },
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
            <div ref={vaultCardsRef} className="grid lg:grid-cols-2 gap-8">
              {vaultsData.map((vault, index) => (
                <Card 
                  key={vault.id}
                  className="glass-card border-2 border-primary/20 hover:border-primary/60 transition-all duration-500 cursor-pointer group relative overflow-hidden"
                  onClick={() => handleVaultSelect(vault)}
                  style={{
                    boxShadow: `0 0 30px ${vault.color}20`,
                  }}
                >
                  {/* Animated border */}
                  <div 
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    style={{
                      background: `linear-gradient(45deg, ${vault.color}30, transparent, ${vault.color}30)`,
                      backgroundSize: '200% 200%',
                      animation: 'borderGlow 3s ease-in-out infinite',
                    }}
                  />
                  
                  <CardHeader className="relative z-10 pb-3">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <CardTitle className="text-xl font-bold mb-1" style={{ color: vault.color }}>
                          {vault.name}
                        </CardTitle>
                        <div className="flex items-center space-x-3">
                          <div className="text-2xl font-bold text-primary-glow">
                            {vault.apy}% APY
                          </div>
                          <div className={`px-2 py-1 rounded-full text-xs font-bold ${
                            vault.risk === 'Low' ? 'bg-green-500/20 text-green-400' :
                            vault.risk === 'Medium' ? 'bg-yellow-500/20 text-yellow-400' :
                            'bg-red-500/20 text-red-400'
                          }`}>
                            {vault.risk} Risk
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-foreground">{vault.tvl}</div>
                        <div className="text-sm text-muted-foreground">TVL</div>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="relative z-10 pt-0">
                    <p className="text-muted-foreground mb-4 text-sm">{vault.description}</p>
                    
                    {/* Advanced Metrics */}
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="space-y-1.5">
                        <div className="flex justify-between">
                          <span className="text-xs text-muted-foreground">AI Confidence</span>
                          <span className="text-xs font-bold text-primary">{vault.aiConfidence}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-xs text-muted-foreground">Active Strategies</span>
                          <span className="text-xs font-bold text-secondary">{vault.activeStrategies}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-xs text-muted-foreground">Daily Volume</span>
                          <span className="text-xs font-bold text-accent">{vault.dailyVolume}</span>
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <div className="flex justify-between">
                          <span className="text-xs text-muted-foreground">Last Rebalance</span>
                          <span className="text-xs font-bold text-green-400">{vault.lastRebalance}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-xs text-muted-foreground">IL Impact</span>
                          <span className={`text-xs font-bold ${vault.impermanentLoss < -2 ? 'text-red-400' : 'text-green-400'}`}>
                            {vault.impermanentLoss}%
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-xs text-muted-foreground">Total Deposits</span>
                          <span className="text-xs font-bold text-primary-glow">{vault.totalDeposits}</span>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <Button 
                        className="flex-1 font-semibold text-sm h-9 transition-all duration-300 hover:scale-105"
                        style={{
                          background: `linear-gradient(135deg, ${vault.color}, ${vault.color}80)`,
                          color: '#000',
                          boxShadow: `0 0 15px ${vault.color}30`,
                        }}
                      >
                        Deposit
                      </Button>
                      <Button 
                        variant="outline" 
                        className="flex-1 font-semibold text-sm h-9 border-primary/50 hover:border-primary transition-all duration-300"
                      >
                        Analytics
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      </div>

      {/* AI Chat Interface */}
      {showChat && (
        <div className="fixed inset-0 z-50 flex items-end justify-end p-4 pointer-events-none">
          <div className="pointer-events-auto w-full max-w-md h-[600px] mr-4 mb-20">
            <AIChat
              className="h-full"
              vaultAddress={selectedVault?.id}
              context={{
                currentPage: 'vaults',
                vaultData: vaultsData,
                userPreferences: {
                  preferredTimeframe: '1d',
                  riskTolerance: 'medium',
                  autoRebalance: true
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
          backdrop-filter: blur(10px);
          background: rgba(0, 0, 0, 0.2);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .glass-card:hover {
          backdrop-filter: blur(15px);
          background: rgba(0, 0, 0, 0.3);
        }
      `}</style>
    </div>
  );
}