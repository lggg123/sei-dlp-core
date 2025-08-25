"use client"

import React, { useState, useEffect, useRef } from 'react';
import Navigation from '@/components/Navigation';
import AIChat from '@/components/AIChat';
import { BarChart3, TrendingUp, AlertTriangle, Zap, Clock, CheckCircle, ArrowRight, RefreshCw, MessageCircle, X } from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import * as THREE from 'three';

gsap.registerPlugin(ScrollTrigger);

interface RebalanceAction {
  id: string;
  action: 'buy' | 'sell' | 'move';
  fromVault?: string;
  toVault?: string;
  token: string;
  amount: number;
  currentPrice: number;
  estimatedGas: number;
  priority: 'high' | 'medium' | 'low';
  reason: string;
}

const RebalancePage = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showRecommendations, setShowRecommendations] = useState(true);
  const [selectedActions, setSelectedActions] = useState<string[]>([]);
  const [showChat, setShowChat] = useState(false);
  // Demo simulation state
  const [isDemoMode] = useState(process.env.NEXT_PUBLIC_DEMO_MODE === 'true');
  const [executionStatus, setExecutionStatus] = useState<'idle' | 'executing' | 'success' | 'error'>('idle');
  const [executionProgress, setExecutionProgress] = useState(0);
  const [executedTransactions, setExecutedTransactions] = useState<string[]>([]);
  
  // Refs for animations
  const mountRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);
  const [scene, setScene] = useState<THREE.Scene | null>(null);

  const rebalanceActions: RebalanceAction[] = [
    {
      id: '1',
      action: 'move',
      fromVault: 'SEI-USDC LP',
      toVault: 'ETH-USDT Arbitrage',
      token: 'SEI',
      amount: 2000,
      currentPrice: 0.52,
      estimatedGas: 0.002,
      priority: 'high',
      reason: 'ETH-USDT arbitrage showing 26.7% APY vs 12.5% current yield'
    },
    {
      id: '2',
      action: 'sell',
      fromVault: 'ETH-USDT Arbitrage',
      token: 'ETH',
      amount: 15.0,
      currentPrice: 2456.89,
      estimatedGas: 0.003,
      priority: 'medium',
      reason: 'ETH exposure above target allocation (49.2% vs 35%)'
    },
    {
      id: '3',
      action: 'move',
      fromVault: 'ATOM-SEI Yield Farm',
      toVault: 'Delta Neutral Vault',
      token: 'USDC',
      amount: 5000,
      currentPrice: 1.00,
      estimatedGas: 0.001,
      priority: 'low',
      reason: 'Delta Neutral showing 15.5% APY vs 5.2% underperforming yield'
    }
  ];

  const portfolioStats = {
    totalValue: 508020.00,
    unrealizedPnL: 46234.56,
    dailyChange: 1.8,
    gasEstimate: 0.15, // SEI gas cost
    estimatedTime: '2-4 seconds', // SEI 400ms finality
    potentialYieldIncrease: 7.4 // matches agent response
  };

  const handleAnalyze = () => {
    setIsAnalyzing(true);
    setTimeout(() => {
      setIsAnalyzing(false);
      setShowRecommendations(true);
    }, 3000);
  };

  const handleActionToggle = (actionId: string) => {
    if (selectedActions.includes(actionId)) {
      setSelectedActions(selectedActions.filter(id => id !== actionId));
    } else {
      setSelectedActions([...selectedActions, actionId]);
    }
  };

  const handleExecuteRebalance = async () => {
    if (isDemoMode) {
      // DEMO MODE: Simulate rebalance execution
      console.log('🎭 [RebalancePage] Demo mode: Simulating rebalance execution');
      
      setExecutionStatus('executing');
      setExecutionProgress(0);
      setExecutedTransactions([]);

      // Simulate progressive execution of selected actions
      for (let i = 0; i < selectedActions.length; i++) {
        const action = rebalanceActions.find(a => a.id === selectedActions[i]);
        if (!action) continue;

        // Simulate transaction delay
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Generate fake transaction hash
        const fakeHash = `0x${Math.random().toString(16).substring(2, 66)}`;
        
        setExecutedTransactions(prev => [...prev, fakeHash]);
        setExecutionProgress(((i + 1) / selectedActions.length) * 100);
        
        console.log(`🎉 [RebalancePage] Executed action ${i + 1}/${selectedActions.length}: ${action.action} ${action.amount} ${action.token}`);
      }

      // Mark as complete
      setExecutionStatus('success');
      
      setTimeout(() => {
        setExecutionStatus('idle');
        setExecutionProgress(0);
        setSelectedActions([]);
        setExecutedTransactions([]);
      }, 5000);
      
      return;
    }

    // REAL MODE: Use actual smart contract integration
    alert(`Executing ${selectedActions.length} rebalance actions...`);
  };


  const getActionIcon = (action: string) => {
    switch (action) {
      case 'buy': return <TrendingUp className="w-5 h-5 text-green-400" />;
      case 'sell': return <TrendingUp className="w-5 h-5 text-red-400 rotate-180" />;
      case 'move': return <ArrowRight className="w-5 h-5 text-blue-400" />;
      default: return <RefreshCw className="w-5 h-5 text-gray-400" />;
    }
  };

  // Three.js Setup
  useEffect(() => {
    const currentMount = mountRef.current;
    if (!currentMount || scene) return;

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

    // Geometric shapes
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

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      
      particleSystem.rotation.x += 0.001;
      particleSystem.rotation.y += 0.002;

      newScene.children.forEach((child) => {
        if (child instanceof THREE.Mesh) {
          child.rotation.x += 0.01;
          child.rotation.y += 0.01;
        }
      });

      renderer.render(newScene, camera);
    };

    animate();

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
  }, [scene]);

  // GSAP Animations
  useEffect(() => {
    if (cardsRef.current) {
      const cards = cardsRef.current.children;
      
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
            trigger: cardsRef.current,
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
      
      {/* Background overlay */}
      <div className="fixed inset-0 z-5 bg-gradient-to-b from-background/70 via-background/60 to-background/70 pointer-events-none" />

      {/* Navigation */}
      <Navigation variant="dark" showWallet={true} showLaunchApp={false} />
      
      {/* Header */}
      <div className="relative z-10" style={{ paddingTop: '3.5rem' }}>
        <div 
          className="border-b border-white/10 backdrop-blur-xl"
          style={{
            background: 'linear-gradient(135deg, rgba(155, 93, 229, 0.15) 0%, rgba(0, 245, 212, 0.08) 50%, rgba(255, 32, 110, 0.12) 100%)',
            backdropFilter: 'blur(20px)',
            borderBottom: '1px solid rgba(155, 93, 229, 0.3)',
            boxShadow: '0 8px 32px rgba(0, 245, 212, 0.1)'
          }}
        >
          <div className="max-w-7xl mx-auto px-4 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div 
                  className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{
                    background: 'linear-gradient(135deg, #00f5d4 0%, #ff206e 100%)',
                    boxShadow: '0 0 30px rgba(0, 245, 212, 0.4)',
                    backdropFilter: 'blur(10px)'
                  }}
                >
                  <BarChart3 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 
                    className="text-3xl font-extrabold flex items-center gap-3"
                    style={{
                      background: 'linear-gradient(135deg, #00f5d4 0%, #9b5de5 50%, #ff206e 100%)',
                      backgroundClip: 'text',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      textShadow: '0 0 30px rgba(0, 245, 212, 0.5)'
                    }}
                  >
                    Portfolio Rebalancing
                    {isDemoMode && (
                      <span 
                        className="text-sm px-3 py-1 rounded-lg font-bold"
                        style={{
                          background: 'linear-gradient(45deg, #10b981, #059669)',
                          color: 'white',
                          boxShadow: '0 0 20px rgba(16, 185, 129, 0.4)',
                          fontSize: '0.75rem'
                        }}
                      >
                        DEMO MODE
                      </span>
                    )}
                  </h1>
                  <p className="text-gray-300 mt-1 font-medium">Optimize your yield using AI-powered analysis</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-400 font-medium">Portfolio Value</div>
                <div 
                  className="text-2xl font-black"
                  style={{
                    background: 'linear-gradient(135deg, #ffffff 0%, #00f5d4 100%)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    textShadow: '0 0 20px rgba(255, 255, 255, 0.3)'
                  }}
                >
                  ${portfolioStats.totalValue.toLocaleString()}
                </div>
                <div 
                  className={`text-sm font-bold ${
                    portfolioStats.dailyChange >= 0 ? 'text-green-400' : 'text-red-400'
                  }`}
                  style={{
                    textShadow: `0 0 10px ${portfolioStats.dailyChange >= 0 ? 'rgba(34, 197, 94, 0.5)' : 'rgba(239, 68, 68, 0.5)'}` 
                  }}
                >
                  {portfolioStats.dailyChange >= 0 ? '+' : ''}{portfolioStats.dailyChange}% (24h)
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 py-8">
        {/* Stats Overview */}
        <div ref={statsRef} className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {[
            { label: 'Unrealized P&L', value: `$${portfolioStats.unrealizedPnL.toLocaleString()}`, change: '+6.9%', color: '#10b981' },
            { label: 'Potential Yield ↑', value: `+${portfolioStats.potentialYieldIncrease}%`, change: 'APY', color: '#3b82f6' },
            { label: 'Gas Estimate', value: `${portfolioStats.gasEstimate} SEI`, change: '~$0.003', color: '#9b5de5' },
            { label: 'Execution Time', value: portfolioStats.estimatedTime, change: 'Lightning fast', color: '#f59e0b' }
          ].map((stat, index) => (
            <div 
              key={index} 
              className="transition-all duration-500 hover:scale-105 cursor-pointer group"
              style={{
                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '20px',
                padding: '1.5rem',
                boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.1) inset'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = `${stat.color}60`;
                e.currentTarget.style.boxShadow = `0 25px 50px rgba(0, 0, 0, 0.4), 0 0 30px ${stat.color}40, 0 0 0 1px rgba(255, 255, 255, 0.15) inset`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                e.currentTarget.style.boxShadow = '0 20px 40px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.1) inset';
              }}
            >
              <div className="text-gray-300 text-sm mb-2 font-medium">{stat.label}</div>
              <div 
                className="text-xl font-black mb-2"
                style={{
                  background: `linear-gradient(135deg, ${stat.color} 0%, #ffffff 100%)`,
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  textShadow: `0 0 20px ${stat.color}40`
                }}
              >
                {stat.value}
              </div>
              <div className="text-sm font-bold" style={{ color: stat.color, textShadow: `0 0 10px ${stat.color}40` }}>
                {stat.change}
              </div>
            </div>
          ))}
        </div>

        {/* Analysis Section */}
        <div ref={cardsRef}>
          <div 
            className="mb-8 group transition-all duration-500 hover:scale-[1.02]"
            style={{
              background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(155, 93, 229, 0.3)',
              borderRadius: '24px',
              padding: '2rem',
              boxShadow: '0 25px 50px rgba(0, 0, 0, 0.4), 0 0 30px rgba(155, 93, 229, 0.2), 0 0 0 1px rgba(255, 255, 255, 0.1) inset'
            }}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 
                className="text-2xl font-black flex items-center gap-3"
                style={{
                  background: 'linear-gradient(135deg, #fbae3c 0%, #ff206e 100%)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  textShadow: '0 0 30px rgba(251, 174, 60, 0.5)'
                }}
              >
                <Zap className="w-6 h-6" style={{ color: '#fbae3c', filter: 'drop-shadow(0 0 10px rgba(251, 174, 60, 0.7))' }} />
                AI Rebalance Analysis
              </h2>
              <button
                onClick={handleAnalyze}
                disabled={isAnalyzing}
                className="transition-all duration-300 hover:scale-105 active:scale-95 flex items-center gap-2 font-bold px-6 py-3 rounded-xl disabled:opacity-50"
                style={{
                  background: isAnalyzing 
                    ? 'linear-gradient(135deg, rgba(251, 174, 60, 0.3) 0%, rgba(255, 32, 110, 0.3) 100%)'
                    : 'linear-gradient(135deg, #fbae3c 0%, #ff206e 100%)',
                  color: '#000000',
                  boxShadow: '0 10px 30px rgba(251, 174, 60, 0.4), 0 0 20px rgba(255, 32, 110, 0.3)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  backdropFilter: 'blur(10px)'
                }}
              >
                {isAnalyzing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4" />
                    Re-analyze
                  </>
                )}
              </button>
            </div>

            {isAnalyzing ? (
              <div className="text-center py-12">
                <div 
                  className="w-20 h-20 rounded-full animate-spin mx-auto mb-6"
                  style={{
                    border: '4px solid rgba(251, 174, 60, 0.3)',
                    borderTop: '4px solid #fbae3c',
                    boxShadow: '0 0 40px rgba(251, 174, 60, 0.6)'
                  }}
                />
                <div 
                  className="text-xl font-black mb-3"
                  style={{
                    background: 'linear-gradient(135deg, #fbae3c 0%, #ff206e 100%)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    textShadow: '0 0 20px rgba(251, 174, 60, 0.5)'
                  }}
                >
                  Analyzing Market Conditions
                </div>
                <div className="text-gray-300 font-medium">Scanning yield opportunities across SEI DeFi...</div>
              </div>
            ) : showRecommendations ? (
              <div className="space-y-6">
                <div 
                  className="rounded-xl p-6 mb-6"
                  style={{
                    background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(16, 185, 129, 0.05) 100%)',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    backdropFilter: 'blur(10px)',
                    boxShadow: '0 10px 30px rgba(16, 185, 129, 0.2)'
                  }}
                >
                  <div className="flex items-center gap-3 text-green-400 mb-3">
                    <CheckCircle className="w-6 h-6" style={{ filter: 'drop-shadow(0 0 10px rgba(16, 185, 129, 0.7))' }} />
                    <span className="font-black text-lg">Analysis Complete</span>
                  </div>
                  <p className="text-gray-200 font-medium text-lg">
                    Found <span className="font-black text-green-400">{rebalanceActions.length}</span> optimization opportunities that could increase your yield by <span className="font-black text-green-400">{portfolioStats.potentialYieldIncrease}%</span>
                  </p>
                </div>

                {/* Recommended Actions */}
                <div className="space-y-4">
                  {rebalanceActions.map((action) => (
                    <div
                      key={action.id}
                      className="transition-all duration-500 cursor-pointer hover:scale-[1.02] group"
                      style={{
                        background: selectedActions.includes(action.id)
                          ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(59, 130, 246, 0.1) 100%)'
                          : 'linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.04) 100%)',
                        backdropFilter: 'blur(15px)',
                        border: selectedActions.includes(action.id)
                          ? '2px solid rgba(59, 130, 246, 0.5)'
                          : '1px solid rgba(255, 255, 255, 0.15)',
                        borderRadius: '20px',
                        padding: '1.5rem',
                        boxShadow: selectedActions.includes(action.id)
                          ? '0 20px 40px rgba(0, 0, 0, 0.4), 0 0 30px rgba(59, 130, 246, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.1) inset'
                          : '0 15px 35px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.08) inset'
                      }}
                      onClick={() => handleActionToggle(action.id)}
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-4">
                          <div 
                            className="flex items-center justify-center w-12 h-12 rounded-xl"
                            style={{
                              background: 'linear-gradient(135deg, rgba(0, 245, 212, 0.2) 0%, rgba(155, 93, 229, 0.2) 100%)',
                              backdropFilter: 'blur(10px)',
                              border: '1px solid rgba(0, 245, 212, 0.3)',
                              boxShadow: '0 0 20px rgba(0, 245, 212, 0.3)'
                            }}
                          >
                            {getActionIcon(action.action)}
                          </div>
                          <div>
                            <div 
                              className="font-black text-lg capitalize mb-1"
                              style={{
                                background: 'linear-gradient(135deg, #ffffff 0%, #00f5d4 100%)',
                                backgroundClip: 'text',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent'
                              }}
                            >
                              {action.action} {action.token}
                            </div>
                            <div className="text-sm text-gray-300 font-medium">
                              {action.fromVault && `From: ${action.fromVault}`}
                              {action.fromVault && action.toVault && (
                                <ArrowRight className="inline w-4 h-4 mx-2 text-blue-400" />
                              )}
                              {action.toVault && `To: ${action.toVault}`}
                            </div>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <div 
                            className="font-black text-lg"
                            style={{
                              background: 'linear-gradient(135deg, #00f5d4 0%, #9b5de5 100%)',
                              backgroundClip: 'text',
                              WebkitBackgroundClip: 'text',
                              WebkitTextFillColor: 'transparent'
                            }}
                          >
                            {action.amount} {action.token}
                          </div>
                          <div className="text-sm text-gray-400 font-bold">
                            ${(action.amount * action.currentPrice).toLocaleString()}
                          </div>
                        </div>
                        
                        <div 
                          className="px-4 py-2 rounded-xl text-sm font-bold border capitalize"
                          style={{
                            ...(() => {
                              const colors = {
                                'high': { bg: 'rgba(239, 68, 68, 0.2)', border: 'rgba(239, 68, 68, 0.5)', text: '#fecaca' },
                                'medium': { bg: 'rgba(245, 158, 11, 0.2)', border: 'rgba(245, 158, 11, 0.5)', text: '#fef3c7' },
                                'low': { bg: 'rgba(16, 185, 129, 0.2)', border: 'rgba(16, 185, 129, 0.5)', text: '#d1fae5' }
                              };
                              const color = colors[action.priority as keyof typeof colors];
                              return {
                                background: color.bg,
                                borderColor: color.border,
                                color: color.text,
                                boxShadow: `0 0 15px ${color.border}`,
                                backdropFilter: 'blur(8px)'
                              };
                            })()
                          }}
                        >
                          {action.priority}
                        </div>
                      </div>
                      
                      <div 
                        className="text-sm font-medium rounded-xl p-4"
                        style={{
                          background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.3) 0%, rgba(0, 0, 0, 0.2) 100%)',
                          border: '1px solid rgba(251, 174, 60, 0.3)',
                          backdropFilter: 'blur(10px)',
                          color: '#e5e7eb'
                        }}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <AlertTriangle className="w-4 h-4 text-yellow-400" style={{ filter: 'drop-shadow(0 0 8px rgba(251, 174, 60, 0.5))' }} />
                          <span className="font-black text-yellow-400">Reason:</span>
                        </div>
                        {action.reason}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <BarChart3 
                  className="w-20 h-20 mx-auto mb-6 opacity-50" 
                  style={{ 
                    color: '#9b5de5',
                    filter: 'drop-shadow(0 0 20px rgba(155, 93, 229, 0.3))' 
                  }} 
                />
                <div 
                  className="text-lg font-bold"
                  style={{
                    background: 'linear-gradient(135deg, #9b5de5 0%, #00f5d4 100%)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent'
                  }}
                >
                  Click "Analyze" to scan for rebalancing opportunities
                </div>
              </div>
            )}
          </div>
        </div>

          {/* Execution Panel */}
          {showRecommendations && selectedActions.length > 0 && (
            <div 
              className="group transition-all duration-500 hover:scale-[1.02]"
              style={{
                background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(139, 92, 246, 0.15) 100%)',
                backdropFilter: 'blur(25px)',
                border: '2px solid rgba(59, 130, 246, 0.4)',
                borderRadius: '24px',
                padding: '2rem',
                boxShadow: '0 30px 60px rgba(0, 0, 0, 0.5), 0 0 40px rgba(59, 130, 246, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.1) inset'
              }}
            >
              <h3 
                className="text-2xl font-black mb-6 flex items-center gap-3"
                style={{
                  background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  textShadow: '0 0 30px rgba(59, 130, 246, 0.5)'
                }}
              >
                <Zap className="w-6 h-6" style={{ color: '#3b82f6', filter: 'drop-shadow(0 0 15px rgba(59, 130, 246, 0.7))' }} />
                Execute Rebalance ({selectedActions.length} actions)
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div 
                  className="text-center p-4 rounded-xl"
                  style={{
                    background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(59, 130, 246, 0.1) 100%)',
                    border: '1px solid rgba(59, 130, 246, 0.3)',
                    backdropFilter: 'blur(10px)'
                  }}
                >
                  <div 
                    className="text-3xl font-black mb-2"
                    style={{
                      background: 'linear-gradient(135deg, #3b82f6 0%, #ffffff 100%)',
                      backgroundClip: 'text',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      textShadow: '0 0 20px rgba(59, 130, 246, 0.5)'
                    }}
                  >
                    {selectedActions.length}
                  </div>
                  <div className="text-sm text-gray-300 font-bold">Actions Selected</div>
                </div>
                <div 
                  className="text-center p-4 rounded-xl"
                  style={{
                    background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(16, 185, 129, 0.1) 100%)',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    backdropFilter: 'blur(10px)'
                  }}
                >
                  <div 
                    className="text-3xl font-black mb-2"
                    style={{
                      background: 'linear-gradient(135deg, #10b981 0%, #ffffff 100%)',
                      backgroundClip: 'text',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      textShadow: '0 0 20px rgba(16, 185, 129, 0.5)'
                    }}
                  >
                    {portfolioStats.gasEstimate} SEI
                  </div>
                  <div className="text-sm text-gray-300 font-bold">Total Gas Cost</div>
                </div>
                <div 
                  className="text-center p-4 rounded-xl"
                  style={{
                    background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, rgba(139, 92, 246, 0.1) 100%)',
                    border: '1px solid rgba(139, 92, 246, 0.3)',
                    backdropFilter: 'blur(10px)'
                  }}
                >
                  <div 
                    className="text-3xl font-black mb-2"
                    style={{
                      background: 'linear-gradient(135deg, #8b5cf6 0%, #ffffff 100%)',
                      backgroundClip: 'text',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      textShadow: '0 0 20px rgba(139, 92, 246, 0.5)'
                    }}
                  >
                    {portfolioStats.estimatedTime}
                  </div>
                  <div className="text-sm text-gray-300 font-bold">Execution Time</div>
                </div>
              </div>

              <div 
                className="rounded-xl p-6 mb-6"
                style={{
                  background: 'linear-gradient(135deg, rgba(251, 174, 60, 0.15) 0%, rgba(251, 174, 60, 0.05) 100%)',
                  border: '1px solid rgba(251, 174, 60, 0.3)',
                  backdropFilter: 'blur(15px)',
                  boxShadow: '0 15px 35px rgba(251, 174, 60, 0.2)'
                }}
              >
                <div className="flex items-center gap-3 text-yellow-400 mb-4">
                  <Clock className="w-6 h-6" style={{ filter: 'drop-shadow(0 0 10px rgba(251, 174, 60, 0.7))' }} />
                  <span className="font-black text-lg">Execution Details</span>
                </div>
                <ul className="space-y-3 text-gray-200 font-medium">
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-400" style={{ boxShadow: '0 0 8px rgba(34, 197, 94, 0.6)' }}></div>
                    Trades will execute in optimal order using SEI's 400ms finality (12,500 TPS)
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-400" style={{ boxShadow: '0 0 8px rgba(59, 130, 246, 0.6)' }}></div>
                    MEV protection enabled
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-purple-400" style={{ boxShadow: '0 0 8px rgba(139, 92, 246, 0.6)' }}></div>
                    Slippage tolerance: 0.5%
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-yellow-400" style={{ boxShadow: '0 0 8px rgba(251, 174, 60, 0.6)' }}></div>
                    You can monitor progress in real-time
                  </li>
                </ul>
              </div>

              <button
                onClick={handleExecuteRebalance}
                disabled={executionStatus === 'executing'}
                className="w-full py-5 rounded-xl text-lg font-black flex items-center justify-center gap-3 transition-all duration-300 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                style={{
                  background: executionStatus === 'executing'
                    ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.3) 0%, rgba(59, 130, 246, 0.3) 100%)'
                    : executionStatus === 'success'
                    ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                    : 'linear-gradient(135deg, #10b981 0%, #3b82f6 100%)',
                  color: '#ffffff',
                  boxShadow: executionStatus === 'executing'
                    ? '0 20px 40px rgba(0, 0, 0, 0.3)'
                    : '0 20px 40px rgba(16, 185, 129, 0.4), 0 0 30px rgba(59, 130, 246, 0.3)',
                  border: '2px solid rgba(255, 255, 255, 0.2)',
                  backdropFilter: 'blur(10px)'
                }}
              >
                {executionStatus === 'executing' ? (
                  <>
                    <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Executing... ({Math.round(executionProgress)}%)
                  </>
                ) : executionStatus === 'success' ? (
                  <>
                    <CheckCircle className="w-6 h-6" style={{ filter: 'drop-shadow(0 0 10px rgba(255, 255, 255, 0.7))' }} />
                    Rebalance Complete!
                  </>
                ) : (
                  <>
                    <Zap className="w-6 h-6" style={{ filter: 'drop-shadow(0 0 10px rgba(255, 255, 255, 0.7))' }} />
                    Execute Rebalance
                  </>
                )}
              </button>

              {/* Execution Progress */}
              {executionStatus !== 'idle' && (
                <div 
                  className="mt-6 p-6 rounded-xl"
                  style={{
                    background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    backdropFilter: 'blur(15px)',
                    boxShadow: '0 15px 35px rgba(0, 0, 0, 0.3)'
                  }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <span 
                      className="font-black text-lg"
                      style={{
                        background: executionStatus === 'success' 
                          ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                          : 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                        backgroundClip: 'text',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent'
                      }}
                    >
                      {executionStatus === 'executing' ? 'Executing Rebalance...' : 
                       executionStatus === 'success' ? 'Rebalance Completed!' : 
                       'Execution Failed'}
                    </span>
                    <span className="text-sm font-bold text-gray-300">
                      {Math.round(executionProgress)}%
                    </span>
                  </div>
                  
                  {executionStatus === 'executing' && (
                    <div 
                      className="w-full rounded-full h-3 mb-6"
                      style={{ background: 'rgba(55, 65, 81, 0.5)' }}
                    >
                      <div 
                        className="h-3 rounded-full transition-all duration-500"
                        style={{
                          background: 'linear-gradient(90deg, #10b981 0%, #3b82f6 100%)',
                          width: `${executionProgress}%`,
                          boxShadow: '0 0 20px rgba(16, 185, 129, 0.5)'
                        }}
                      ></div>
                    </div>
                  )}

                  {executedTransactions.length > 0 && (
                    <div className="space-y-3">
                      <div className="text-sm font-bold text-gray-300 mb-3">Transaction Hashes:</div>
                      {executedTransactions.map((hash, index) => (
                        <div 
                          key={index} 
                          className="text-xs font-mono font-bold p-3 rounded-xl"
                          style={{
                            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(16, 185, 129, 0.1) 100%)',
                            border: '1px solid rgba(16, 185, 129, 0.3)',
                            color: '#d1fae5',
                            backdropFilter: 'blur(10px)',
                            boxShadow: '0 5px 15px rgba(16, 185, 129, 0.2)'
                          }}
                        >
                          Action {index + 1}: {hash.substring(0, 6)}...{hash.substring(hash.length - 4)}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      {/* AI Chat Interface */}
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
                color: '#ffffff',
                overflow: 'hidden',
                position: 'relative'
              }}
            >
              <AIChat
                className="h-full ai-chat-override"
                context={{
                  currentPage: 'rebalance',
                  userPreferences: {
                    rebalanceData: rebalanceActions,
                    portfolioStats,
                    selectedActions,
                    executionStatus
                  }
                }}
                initialMessage="🎯 Welcome to Portfolio Rebalancing! I'm Liqui, your AI assistant. I can help you analyze rebalance recommendations, explain optimization strategies, and guide you through the execution process. What would you like to know about your portfolio rebalancing?"
              />
              
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
                
                .ai-chat-override * {
                  color: #ffffff;
                }
              `}</style>
            </div>
          </div>
        )}

        {/* Floating AI Chat Button */}
        <div 
          className="fixed bottom-6 right-6 z-50"
          style={{ 
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 50,
            isolation: 'isolate',
            pointerEvents: 'auto'
          }}
        >
          <div className="relative">
            {/* Glow Ring */}
            <div 
              className="absolute inset-0 rounded-full animate-pulse"
              style={{ 
                background: 'linear-gradient(45deg, #00f5d4, #ff206e, #9b5de5, #00f5d4)',
                backgroundSize: '400% 400%',
                borderRadius: '50%',
                filter: 'blur(8px)',
                opacity: '0.6',
                transform: 'scale(1.4)'
              }}
            />
            
            {/* Main Button */}
            <button
              onClick={() => setShowChat(!showChat)}
              className="relative text-white rounded-full transition-all duration-300 hover:scale-110 group"
              style={{ 
                position: 'relative',
                background: 'linear-gradient(135deg, #00f5d4 0%, #10b981 30%, #ff206e 70%, #9b5de5 100%)',
                border: '4px solid #ffffff',
                borderRadius: '50%',
                padding: '20px',
                boxShadow: '0 0 50px rgba(0, 245, 212, 0.8), 0 0 100px rgba(255, 32, 110, 0.4)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '80px',
                height: '80px',
                fontSize: '28px',
                backdropFilter: 'blur(20px)'
              }}
            >
              {showChat ? (
                <X className="w-8 h-8" style={{ filter: 'drop-shadow(0 0 10px #ffffff)' }} />
              ) : (
                <MessageCircle className="w-8 h-8" style={{ filter: 'drop-shadow(0 0 10px #ffffff)' }} />
              )}
              
              {/* Tooltip */}
              <div 
                className="absolute -top-20 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 whitespace-nowrap pointer-events-none"
                style={{
                  background: 'linear-gradient(135deg, #000000 0%, #1a1a1a 100%)',
                  backdropFilter: 'blur(20px)',
                  border: '2px solid #00f5d4',
                  borderRadius: '12px',
                  padding: '12px 16px',
                  fontSize: '14px',
                  fontWeight: '700',
                  color: '#ffffff',
                  textShadow: '0 0 10px #00f5d4',
                  boxShadow: '0 10px 30px rgba(0, 0, 0, 0.8), 0 0 50px rgba(0, 245, 212, 0.5)',
                  zIndex: 999
                }}
              >
                {showChat ? '✕ Close AI Assistant' : '🤖 Ask Liqui AI'}
              </div>
            </button>
            
            {/* Status Indicator */}
            {!showChat && (
              <div 
                className="absolute -top-1 -right-1"
                style={{
                  width: '18px',
                  height: '18px',
                  background: 'radial-gradient(circle, #00ff00 0%, #00cc00 100%)',
                  borderRadius: '50%',
                  border: '2px solid #ffffff',
                  boxShadow: '0 0 20px rgba(0, 255, 0, 0.8)',
                  animation: 'pulse 2s ease-in-out infinite'
                }}
              />
            )}
          </div>
        </div>
    </div>
  );
};

export default RebalancePage;