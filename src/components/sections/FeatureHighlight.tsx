'use client'

import { useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const features = [
    {
        title: 'Advanced Risk Management',
        description: 'Sophisticated algorithms continuously monitor and adjust positions to minimize impermanent loss while maximizing yield opportunities.',
        icon: '🛡️',
        color: '#00f5d4',
        gradient: 'from-cyan-400/20 to-emerald-400/20'
    },
    {
        title: 'Lightning-Fast Execution',
        description: 'Leverage SEI\'s 400ms block times for instant rebalancing and optimal trade execution across DeFi protocols.',
        icon: '⚡',
        color: '#9b5de5',
        gradient: 'from-purple-400/20 to-violet-400/20'
    },
    {
        title: 'Intelligent Portfolio Optimization',
        description: 'AI-driven analysis identifies the most profitable liquidity provision opportunities and automatically allocates capital.',
        icon: '🧠',
        color: '#ff206e',
        gradient: 'from-pink-400/20 to-rose-400/20'
    }
];

export default function FeatureHighlight() {
    const containerRef = useRef<HTMLDivElement>(null);
    const cardsRef = useRef<(HTMLDivElement | null)[]>([]);
    const centerImageRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!containerRef.current) return;

        // Animate cards on scroll
        cardsRef.current.forEach((card, index) => {
            if (card) {
                gsap.fromTo(card,
                    { 
                        opacity: 0, 
                        y: 60,
                        scale: 0.8,
                        rotationY: index % 2 === 0 ? -15 : 15
                    },
                    {
                        opacity: 1,
                        y: 0,
                        scale: 1,
                        rotationY: 0,
                        duration: 1,
                        delay: index * 0.2,
                        ease: "back.out(1.7)",
                        scrollTrigger: {
                            trigger: card,
                            start: "top 80%",
                            end: "bottom 20%",
                            toggleActions: "play none none reverse"
                        }
                    }
                );
            }
        });

        // Animate center 3D element
        if (centerImageRef.current) {
            gsap.fromTo(centerImageRef.current,
                { 
                    opacity: 0,
                    scale: 0.5,
                    rotationY: 180
                },
                {
                    opacity: 1,
                    scale: 1,
                    rotationY: 0,
                    duration: 1.5,
                    ease: "power3.out",
                    scrollTrigger: {
                        trigger: centerImageRef.current,
                        start: "top 75%",
                        end: "bottom 25%",
                        toggleActions: "play none none reverse"
                    }
                }
            );
        }

        return () => {
            ScrollTrigger.getAll().forEach(trigger => trigger.kill());
        };
    }, []);

    return (
        <section className="py-40 relative overflow-hidden">
            {/* Animated Background */}
            <div className="absolute inset-0">
                <div className="absolute inset-0 opacity-30">
                    <div 
                        className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-3xl animate-pulse"
                        style={{
                            background: 'radial-gradient(circle, #00f5d4 0%, transparent 70%)',
                            animationDelay: '0s'
                        }}
                    />
                    <div 
                        className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full blur-3xl animate-pulse"
                        style={{
                            background: 'radial-gradient(circle, #9b5de5 0%, transparent 70%)',
                            animationDelay: '2s'
                        }}
                    />
                    <div 
                        className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-72 h-72 rounded-full blur-3xl animate-pulse"
                        style={{
                            background: 'radial-gradient(circle, #ff206e 0%, transparent 70%)',
                            animationDelay: '4s'
                        }}
                    />
                </div>
            </div>

            <div ref={containerRef} className="container mx-auto px-4 relative z-10">
                <div className="text-center mb-24">
                    <h2 className="text-5xl lg:text-6xl font-bold mb-6 holo-text">
                        Next-Generation DeFi Features
                    </h2>
                    <p className="text-2xl text-muted-foreground max-w-4xl mx-auto">
                        Experience the future of decentralized finance with cutting-edge technology built for the SEI ecosystem
                    </p>
                </div>

                <div className="grid lg:grid-cols-3 gap-12 max-w-7xl mx-auto items-center">
                    {/* Left Feature */}
                    <div 
                        ref={el => { cardsRef.current[0] = el; }}
                        className="lg:text-right space-y-8"
                    >
                        <Card className="p-8 bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-xl border-2 border-primary/20 hover:border-primary/40 transition-all duration-500 transform hover:scale-105 hover:-rotate-1">
                            <div className="flex lg:justify-end justify-start items-center mb-6">
                                <div 
                                    className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl transform hover:scale-110 transition-transform duration-300"
                                    style={{
                                        background: `linear-gradient(135deg, ${features[0].color}20, ${features[0].color}40)`,
                                        boxShadow: `0 8px 32px ${features[0].color}30`
                                    }}
                                >
                                    {features[0].icon}
                                </div>
                            </div>
                            <h3 className="text-2xl font-bold mb-4 text-foreground">
                                {features[0].title}
                            </h3>
                            <p className="text-lg text-muted-foreground leading-relaxed">
                                {features[0].description}
                            </p>
                        </Card>
                    </div>

                    {/* Center 3D Element */}
                    <div className="flex justify-center">
                        <div 
                            ref={centerImageRef}
                            className="relative w-80 h-80 mx-auto"
                        >
                            {/* Main 3D Container */}
                            <div className="relative w-full h-full transform-gpu perspective-1000">
                                {/* Central Orb */}
                                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/30 via-secondary/20 to-accent/30 backdrop-blur-xl border-2 border-primary/40 animate-float">
                                    {/* Inner Glow */}
                                    <div className="absolute inset-4 rounded-full bg-gradient-to-br from-primary/20 to-transparent blur-sm animate-pulse"></div>
                                    
                                    {/* Core AI Symbol */}
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="text-6xl transform hover:scale-110 transition-transform duration-300" style={{ filter: 'drop-shadow(0 0 20px hsl(var(--primary)))' }}>
                                            🌟
                                        </div>
                                    </div>
                                    
                                    {/* Rotating Rings */}
                                    <div className="absolute inset-0 rounded-full border-2 border-primary/60 animate-spin" style={{ animationDuration: '8s' }} />
                                    <div className="absolute inset-6 rounded-full border border-secondary/60 animate-spin" style={{ animationDuration: '6s', animationDirection: 'reverse' }} />
                                    <div className="absolute inset-12 rounded-full border border-accent/40 animate-spin" style={{ animationDuration: '4s' }} />
                                </div>

                                {/* Floating Data Points */}
                                {[0, 1, 2, 3, 4, 5].map((i) => (
                                    <div
                                        key={i}
                                        className="absolute w-4 h-4 rounded-full animate-ping"
                                        style={{
                                            background: `${features[i % 3].color}`,
                                            top: `${20 + Math.sin(i * Math.PI / 3) * 25}%`,
                                            left: `${50 + Math.cos(i * Math.PI / 3) * 35}%`,
                                            animationDelay: `${i * 0.5}s`,
                                            animationDuration: '3s'
                                        }}
                                    />
                                ))}

                                {/* Connecting Lines */}
                                <svg className="absolute inset-0 w-full h-full opacity-40" viewBox="0 0 320 320">
                                    <defs>
                                        <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                            <stop offset="0%" stopColor="#00f5d4" stopOpacity="0.8"/>
                                            <stop offset="50%" stopColor="#9b5de5" stopOpacity="0.6"/>
                                            <stop offset="100%" stopColor="#ff206e" stopOpacity="0.8"/>
                                        </linearGradient>
                                    </defs>
                                    {[0, 1, 2].map((i) => (
                                        <line
                                            key={i}
                                            x1="160"
                                            y1="160"
                                            x2={160 + Math.cos(i * Math.PI * 2 / 3) * 100}
                                            y2={160 + Math.sin(i * Math.PI * 2 / 3) * 100}
                                            stroke="url(#lineGradient)"
                                            strokeWidth="2"
                                            className="animate-pulse"
                                            style={{ animationDelay: `${i * 0.5}s` }}
                                        />
                                    ))}
                                </svg>
                            </div>
                        </div>
                    </div>

                    {/* Right Features */}
                    <div className="space-y-8">
                        {features.slice(1).map((feature, index) => (
                            <Card 
                                key={feature.title}
                                ref={el => { cardsRef.current[index + 1] = el; }}
                                className="p-8 bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-xl border-2 border-primary/20 hover:border-primary/40 transition-all duration-500 transform hover:scale-105 hover:rotate-1"
                            >
                                <div className="flex items-center mb-6">
                                    <div 
                                        className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl transform hover:scale-110 transition-transform duration-300"
                                        style={{
                                            background: `linear-gradient(135deg, ${feature.color}20, ${feature.color}40)`,
                                            boxShadow: `0 8px 32px ${feature.color}30`
                                        }}
                                    >
                                        {feature.icon}
                                    </div>
                                </div>
                                <h3 className="text-2xl font-bold mb-4 text-foreground">
                                    {feature.title}
                                </h3>
                                <p className="text-lg text-muted-foreground leading-relaxed">
                                    {feature.description}
                                </p>
                            </Card>
                        ))}
                    </div>
                </div>

                {/* Bottom CTA Section */}
                <div className="text-center mt-24">
                    <div className="inline-flex items-center space-x-4 px-8 py-4 bg-gradient-to-r from-primary/10 via-secondary/10 to-accent/10 backdrop-blur-sm border border-primary/20 rounded-full">
                        <span className="text-lg font-medium text-primary">Ready to experience the future?</span>
                        <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                    </div>
                </div>
            </div>
        </section>
    );
}