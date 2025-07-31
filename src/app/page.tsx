"use client"

import { useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Hero3D from '@/components/Hero3D';
import VaultCard from '@/components/VaultCard';
import AIWorkflow from '@/components/AIWorkflow';
import Navigation from '@/components/Navigation';
import glassCardStyles from '@/components/GlassCard.module.css';
import heroStyles from '@/components/Hero.module.css';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const vaultData = [
    {
        name: 'StableMax Vault',
        apy: 12.8,
        tvl: '$2.4M',
        risk: 'Low' as const,
        color: '#00f5d4',
        description: 'Stable yield farming with algorithmic rebalancing across blue-chip pairs.',
    },
    {
        name: 'SEI Hypergrowth',
        apy: 24.5,
        tvl: '$1.8M',
        risk: 'Medium' as const,
        color: '#9b5de5',
        description: 'Native SEI ecosystem exposure with automated liquidity provision.',
    },
    {
        name: 'BlueChip Vault',
        apy: 18.2,
        tvl: '$3.1M',
        risk: 'Low' as const,
        color: '#ff206e',
        description: 'Diversified exposure to top DeFi protocols with risk mitigation.',
    },
];

export default function DLPLanding() {
    const heroTextRef = useRef<HTMLDivElement>(null);
    const ctaRef = useRef<HTMLDivElement>(null);
    const statsRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (heroTextRef.current) {
            const textElements = heroTextRef.current.children;
            // Skip the h1 element to avoid GSAP conflicts with CSS animations
            const elementsToAnimate = Array.from(textElements).slice(1); // Skip the h1
            gsap.fromTo(
                elementsToAnimate,
                { opacity: 0, y: 50, filter: 'blur(10px)' },
                { opacity: 1, y: 0, filter: 'blur(0px)', duration: 1.2, stagger: 0.3, ease: 'power3.out', delay: 0.5 }
            );
        }
        if (ctaRef.current) {
            gsap.fromTo(
                ctaRef.current,
                { opacity: 0, scale: 0.8 },
                { opacity: 1, scale: 1, duration: 0.8, delay: 2, ease: 'back.out(1.7)' }
            );
        }
        if (statsRef.current) {
            gsap.fromTo(
                statsRef.current,
                { opacity: 0, y: 30 },
                { opacity: 1, y: 0, duration: 1, delay: 2.5, ease: 'power2.out' }
            );
        }
    }, []);

    return (
        <div className="min-h-screen bg-background">
            {/* Navigation */}
            <Navigation variant="transparent" />
            
            {/* Hero Section */}
            <section className={`${heroStyles.section} hero-section`}>
                {/* Background Grid */}
                <div className={`absolute inset-0 ${heroStyles.neuralGrid} opacity-30`} />

                {/* Floating Data Streams */}
                <div className="absolute inset-0">
                    {Array.from({ length: 8 }).map((_, i) => (
                        <div
                            key={i}
                            className={heroStyles.dataStream}
                            style={{
                                left: `${10 + i * 12}%`,
                                animationDelay: `${i * 0.5}s`,
                                height: '200px',
                            }}
                        />
                    ))}
                </div>

                <div className={`${heroStyles.grid} relative z-10`}>
                    {/* 3D Hero Visual */}
                    <div className={heroStyles.container3d}>
                        <Hero3D />
                        <div
                            ref={statsRef}
                            className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 w-full"
                        >
                            <div className="grid grid-cols-3 gap-4 max-w-lg mx-auto">
                                {[
                                    { value: '$8.3M', label: 'Total TVL' },
                                    { value: '400ms', label: 'Block Time' },
                                    { value: '18.5%', label: 'Avg APY' },
                                ].map((stat, i) => (
                                    <Card key={i} className={`${glassCardStyles.glassCard} p-4 text-center`}>
                                        <div className="text-lg font-bold text-primary-glow">
                                            {stat.value}
                                        </div>
                                        <div className="text-xs text-primary-glow">
                                            {stat.label}
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Hero Text */}
                    <div ref={heroTextRef} className={heroStyles.textContainer}>
                        <h1 className="text-5xl lg:text-7xl font-bold mb-8 leading-tight">
                          <span className={heroStyles.heroTitleAnimated}>
                            Your Liquidity,
                          </span>
                          <br />
                          <span className={heroStyles.heroTitleAnimated}>
                            Evolved
                          </span>
                        </h1>

                        <p className="text-xl lg:text-2xl text-primary-glow mb-20 max-w-2xl">
                            Harness the power of AI-driven liquidity optimization on SEI.
                            Maximize yields, minimize risk, and let ElizaOS handle the
                            complexity.
                        </p>

                        <div
                            ref={ctaRef}
                            className="flex flex-row gap-8 mb-16 justify-start"
                            style={{ marginTop: '2rem' }}
                        >
                            <Button
                                className="text-2xl px-16 py-8 font-bold"
                                onClick={() => window.location.href = '/vaults'}
                                style={{
                                    background: 'linear-gradient(135deg, hsl(180 100% 48%), hsl(262 80% 60%))',
                                    color: 'hsl(216 100% 4%)',
                                    boxShadow: '0 0 20px hsl(180 100% 48% / 0.3), 0 0 40px hsl(180 100% 48% / 0.1)',
                                    border: 'none',
                                    borderRadius: '16px',
                                    transition: 'all 300ms ease-in-out',
                                    minWidth: '240px',
                                    minHeight: '60px',
                                    fontSize: '1.25rem'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = 'scale(1.05)';
                                    e.currentTarget.style.boxShadow = '0 0 30px hsl(180 100% 48% / 0.4), 0 0 60px hsl(180 100% 48% / 0.2)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'scale(1)';
                                    e.currentTarget.style.boxShadow = '0 0 20px hsl(180 100% 48% / 0.3), 0 0 40px hsl(180 100% 48% / 0.1)';
                                }}
                            >
                                Launch App
                            </Button>
                            <Button
                                variant="outline"
                                className="text-2xl px-16 py-8 font-bold"
                                style={{
                                    borderColor: 'hsl(180 100% 48%)',
                                    color: 'hsl(180 100% 48%)',
                                    background: 'transparent',
                                    borderRadius: '16px',
                                    transition: 'all 300ms ease-in-out',
                                    minWidth: '240px',
                                    minHeight: '60px',
                                    fontSize: '1.25rem',
                                    borderWidth: '3px'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.background = 'hsl(180 100% 48% / 0.1)';
                                    e.currentTarget.style.borderColor = 'hsl(180 100% 48%)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.background = 'transparent';
                                    e.currentTarget.style.borderColor = 'hsl(180 100% 48%)';
                                }}
                            >
                                View Documentation
                            </Button>
                        </div>

                        <div className="space-y-4" style={{ marginTop: '4rem' }}>
                            {[
                                { icon: '⚡', text: 'Real-time AI optimization' },
                                { icon: '🛡️', text: '62% reduced impermanent loss' },
                                { icon: '🚀', text: 'SEI native integration' },
                            ].map((feature, i) => (
                                <div
                                    key={i}
                                    className="flex items-center space-x-3 text-primary-glow"
                                >
                                    <span className="text-xl">{feature.icon}</span>
                                    <span>{feature.text}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* Vault Showcase */}
            <section className="py-20 relative">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold mb-4 holo-text">
                            Intelligent Vault Ecosystem
                        </h2>
                        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                            Choose from our curated selection of AI-optimized vaults,
                            each designed for different risk profiles and market conditions.
                        </p>
                    </div>

                    <div className="flex flex-row justify-center items-stretch gap-8 overflow-x-auto pb-4 max-w-7xl mx-auto px-4">
                        {vaultData.map((vault, index) => (
                            <VaultCard key={vault.name} vault={vault} index={index} />
                        ))}
                    </div>
                </div>
            </section>

            {/* AI Workflow Section */}
            <AIWorkflow />

            {/* Performance Comparison */}
            <section>
                <div className="py-20" style={{ background: 'hsl(var(--card) / 0.2)' }}>
                    <div className="container mx-auto px-4">
                        <div className="text-center mb-16">
                            <h2 className="text-4xl font-bold mb-4 holo-text">
                                Superior Performance Metrics
                            </h2>
                            <p className="text-xl text-muted-foreground">
                                See how DLP outperforms traditional liquidity provision
                            </p>
                        </div>

                        <div className="flex flex-wrap justify-center items-stretch gap-8 max-w-7xl mx-auto px-4">
                            {[
                                {
                                    metric: '62%',
                                    description: 'Reduced Impermanent Loss',
                                    comparison: 'vs Traditional LPs',
                                    positive: true,
                                    color: '#00f5d4'
                                },
                                {
                                    metric: '3.2x',
                                    description: 'Higher Capital Efficiency',
                                    comparison: 'vs Manual Strategies',
                                    positive: true,
                                    color: '#9b5de5'
                                },
                                {
                                    metric: '24/7',
                                    description: 'Automated Monitoring',
                                    comparison: 'Zero Downtime',
                                    positive: true,
                                    color: '#ff206e'
                                },
                                {
                                    metric: '400ms',
                                    description: 'SEI Block Time',
                                    comparison: 'Lightning Fast',
                                    positive: true,
                                    color: '#00f5d4'
                                },
                            ].map((item, index) => (
                                <Card
                                    key={index}
                                    className="cursor-pointer group relative overflow-hidden hover:scale-105 transition-all duration-300"
                                    style={{
                                        width: '300px',
                                        minHeight: '220px',
                                        backdropFilter: 'blur(24px)',
                                        WebkitBackdropFilter: 'blur(24px)',
                                        border: '2px solid hsl(var(--primary) / 0.2)',
                                        background: 'hsl(var(--card) / 0.8)',
                                        borderRadius: '12px',
                                        padding: '1.5rem',
                                        boxShadow: '0 8px 32px hsl(var(--primary) / 0.15), inset 0 1px 0 hsl(var(--border) / 0.4)',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        textAlign: 'center'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.borderColor = 'hsl(var(--primary) / 0.4)';
                                        e.currentTarget.style.boxShadow = '0 20px 60px hsl(var(--primary) / 0.2), inset 0 1px 0 hsl(var(--border) / 0.5)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.borderColor = 'hsl(var(--primary) / 0.2)';
                                        e.currentTarget.style.boxShadow = '0 8px 32px hsl(var(--primary) / 0.15), inset 0 1px 0 hsl(var(--border) / 0.4)';
                                    }}
                                >
                                    {/* Background gradient effect */}
                                    <div 
                                        className="absolute inset-0 opacity-10 transition-opacity duration-500 group-hover:opacity-20"
                                        style={{
                                            background: `linear-gradient(45deg, ${item.color}20, transparent)`
                                        }}
                                    />
                                    
                                    {/* Data Streams */}
                                    <div 
                                        className="absolute top-0 left-1/4 w-px h-24 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                                        style={{
                                            background: `linear-gradient(to bottom, transparent 0%, ${item.color} 50%, transparent 100%)`,
                                            animation: 'streamFlow 2s linear infinite'
                                        }}
                                    />
                                    <div 
                                        className="absolute top-0 right-1/4 w-px h-24 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                                        style={{
                                            background: `linear-gradient(to bottom, transparent 0%, ${item.color} 50%, transparent 100%)`,
                                            animation: 'streamFlow 2s linear infinite 0.5s'
                                        }}
                                    />
                                    
                                    <div 
                                        className="text-4xl font-bold mb-4 relative z-10 transition-all duration-300"
                                        style={{ 
                                            color: item.color,
                                            filter: `drop-shadow(0 0 12px ${item.color})`,
                                            fontWeight: '800'
                                        }}
                                    >
                                        {item.metric}
                                    </div>
                                    <div className="text-lg font-semibold mb-2 relative z-10" style={{ color: 'hsl(var(--foreground))' }}>
                                        {item.description}
                                    </div>
                                    <div className="text-sm text-muted-foreground relative z-10 mb-4">
                                        {item.comparison}
                                    </div>
                                    
                                    {/* Status indicator */}
                                    <div className="flex items-center gap-2 relative z-10">
                                        <div 
                                            className="w-2 h-2 rounded-full animate-pulse-glow"
                                            style={{ backgroundColor: item.color }}
                                        />
                                        <span className="text-xs text-muted-foreground">Active & Optimizing</span>
                                    </div>
                                    
                                    {/* Pulsing indicator */}
                                    <div 
                                        className="absolute -top-2 -right-2 w-4 h-4 rounded-full animate-pulse-glow"
                                        style={{ backgroundColor: item.color }}
                                    />
                                </Card>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 relative overflow-hidden">
                <div
                    className="absolute inset-0"
                    style={{
                        background: 'linear-gradient(90deg, hsl(var(--primary) / 0.1), hsl(var(--secondary) / 0.1), hsl(var(--accent) / 0.1))',
                    }}
                />
                <div className="container mx-auto px-4 relative z-10">
                    <div className="text-center max-w-4xl mx-auto">
                        <h2 className="text-4xl lg:text-5xl font-bold mb-6 holo-text">
                            Ready to Evolve Your DeFi Strategy?
                        </h2>
                        <p className="text-xl text-muted-foreground mb-8">
                            Join the future of liquidity provision with AI-powered optimization on
                            SEI
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Button 
                                className="text-lg px-8 py-3 font-bold"
                                style={{
                                    background: 'linear-gradient(135deg, hsl(180 100% 48%), hsl(262 80% 60%))',
                                    color: 'hsl(216 100% 4%)',
                                    boxShadow: '0 0 20px hsl(180 100% 48% / 0.3), 0 0 40px hsl(180 100% 48% / 0.1)',
                                    border: 'none',
                                    borderRadius: '12px',
                                    transition: 'all 300ms ease-in-out',
                                    minWidth: '160px',
                                    minHeight: '44px'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = 'scale(1.05)';
                                    e.currentTarget.style.boxShadow = '0 0 30px hsl(180 100% 48% / 0.4), 0 0 60px hsl(180 100% 48% / 0.2)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'scale(1)';
                                    e.currentTarget.style.boxShadow = '0 0 20px hsl(180 100% 48% / 0.3), 0 0 40px hsl(180 100% 48% / 0.1)';
                                }}
                            >
                                Start Earning Now
                            </Button>
                            <Button
                                variant="outline"
                                className="text-lg px-8 py-3 font-bold"
                                style={{
                                    borderColor: 'hsl(180 100% 48%)',
                                    color: 'hsl(180 100% 48%)',
                                    background: 'transparent',
                                    borderRadius: '12px',
                                    transition: 'all 300ms ease-in-out',
                                    minWidth: '160px',
                                    minHeight: '44px',
                                    borderWidth: '2px'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.background = 'hsl(180 100% 48% / 0.1)';
                                    e.currentTarget.style.borderColor = 'hsl(180 100% 48%)';
                                    e.currentTarget.style.transform = 'scale(1.05)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.background = 'transparent';
                                    e.currentTarget.style.borderColor = 'hsl(180 100% 48%)';
                                    e.currentTarget.style.transform = 'scale(1)';
                                }}
                            >
                                Read Whitepaper
                            </Button>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}