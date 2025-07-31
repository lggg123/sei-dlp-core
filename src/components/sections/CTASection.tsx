'use client'

import { Button } from '@/components/ui/button';

export default function CTASection() {
    return (
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
    );
}