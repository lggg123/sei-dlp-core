'use client'

import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function CTASection() {
    return (
        <section className="py-48 relative overflow-hidden" style={{ paddingTop: '12rem', paddingBottom: '8rem' }}>
            <div
                className="absolute inset-0"
                style={{
                    background: 'linear-gradient(90deg, hsl(var(--primary) / 0.1), hsl(var(--secondary) / 0.1), hsl(var(--accent) / 0.1))',
                }}
            />
            <div className="container mx-auto px-4 relative z-10">
                <div className="text-center max-w-4xl mx-auto">
                    <h2 
                        className="text-5xl lg:text-6xl font-bold mb-12 holo-text"
                        style={{ fontSize: 'clamp(3rem, 8vw, 4.5rem)' }}
                    >
                        Ready to Evolve Your DeFi Strategy?
                    </h2>
                    <p 
                        className="text-2xl text-muted-foreground mb-16"
                        style={{ fontSize: 'clamp(1.25rem, 4vw, 1.5rem)', marginBottom: '4rem' }}
                    >
                        Join the future of liquidity provision with AI-powered optimization on
                        SEI
                    </p>
                    <div className="flex flex-row justify-center items-center" style={{ gap: '4rem' }}>
                        <Link href="/vaults">
                            <Button 
                                className="px-16 py-6 font-bold"
                                style={{
                                    background: 'linear-gradient(135deg, hsl(180 100% 48%), hsl(262 80% 60%))',
                                    color: 'hsl(216 100% 4%)',
                                    fontSize: '1.25rem',
                                    minHeight: '64px',
                                    minWidth: '180px',
                                    boxShadow: '0 0 20px hsl(180 100% 48% / 0.3), 0 0 40px hsl(180 100% 48% / 0.1)',
                                    border: 'none',
                                    borderRadius: '16px',
                                    transition: 'all 300ms ease-in-out'
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
                        </Link>
                        <Link href="/docs">
                            <Button
                                variant="outline"
                                className="px-16 py-6 font-bold"
                                style={{
                                    borderColor: 'hsl(180 100% 48%)',
                                    color: 'hsl(180 100% 48%)',
                                    fontSize: '1.25rem',
                                    minHeight: '64px',
                                    minWidth: '180px',
                                    background: 'transparent',
                                    borderRadius: '16px',
                                    transition: 'all 300ms ease-in-out',
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
                                Learn More
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>
        </section>
    );
}