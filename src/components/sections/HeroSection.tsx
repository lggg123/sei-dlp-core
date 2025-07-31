'use client'

import { useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Hero3D from '@/components/Hero3D';
import glassCardStyles from '@/components/GlassCard.module.css';
import heroStyles from '@/components/Hero.module.css';
import gsap from 'gsap';

export default function HeroSection() {
    const heroTextRef = useRef<HTMLDivElement>(null);
    const ctaRef = useRef<HTMLDivElement>(null);
    const statsRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (heroTextRef.current) {
            const textElements = heroTextRef.current.children;
            const elementsToAnimate = Array.from(textElements).slice(1);
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
        <section className={`${heroStyles.section} hero-section`}>
            <div className={`absolute inset-0 ${heroStyles.neuralGrid} opacity-30`} />

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
    );
}