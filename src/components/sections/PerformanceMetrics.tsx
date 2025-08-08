'use client'

import PerformanceCard from '@/components/PerformanceCard';

export default function PerformanceMetrics() {
    return (
        <section className="py-32 relative" style={{ paddingTop: '12rem', paddingBottom: '12rem' }}>
            <div className="container mx-auto px-4">
                <div className="text-center mb-20" style={{ marginBottom: '6rem' }}>
                    <h2 
                        className="text-5xl lg:text-6xl font-bold mb-6 holo-text"
                        style={{ 
                            fontSize: 'clamp(3rem, 6vw, 4.5rem)',
                            fontWeight: 'bold',
                            marginBottom: '2rem',
                            lineHeight: '1.1'
                        }}
                    >
                        Real-Time Performance
                    </h2>
                    <p 
                        style={{
                            fontSize: '2.25rem',
                            fontWeight: '500',
                            lineHeight: '1.4',
                            color: 'hsl(var(--muted-foreground))',
                            maxWidth: '64rem',
                            margin: '0 auto',
                            textAlign: 'center',
                            letterSpacing: '-0.01em',
                            opacity: '0.9'
                        }}
                    >
                        Track your vault performance with AI-powered analytics and real-time metrics.
                    </p>
                </div>
                
                <div 
                    className="performance-grid"
                    style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                        gap: '2rem',
                        maxWidth: '1200px',
                        margin: '0 auto',
                        padding: '0 1rem'
                    }}
                >
                    <style jsx>{`
                        @media (min-width: 768px) {
                            .performance-grid {
                                grid-template-columns: repeat(3, 1fr) !important;
                            }
                        }
                        @media (max-width: 767px) {
                            .performance-grid {
                                grid-template-columns: repeat(2, 1fr) !important;
                            }
                        }
                        @media (max-width: 640px) {
                            .performance-grid {
                                grid-template-columns: 1fr !important;
                            }
                        }
                    `}</style>
                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                        <PerformanceCard
                            metric="24.5%"
                            description="Average APY"
                            comparison="+12.3% from last month"
                            color="#00f5d4"
                            positive={true}
                        />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                        <PerformanceCard
                            metric="$8.3M"
                            description="Total Value Locked"
                            comparison="+18% this week"
                            color="#9b5de5"
                            positive={true}
                        />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                        <PerformanceCard
                            metric="0.012%"
                            description="Impermanent Loss"
                            comparison="-62% vs traditional AMMs"
                            color="#ff206e"
                            positive={true}
                        />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                        <PerformanceCard
                            metric="99.8%"
                            description="Uptime"
                            comparison="AI optimization active"
                            color="#fee75c"
                            positive={true}
                        />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                        <PerformanceCard
                            metric="3.2s"
                            description="Avg Response Time"
                            comparison="Lightning fast execution"
                            color="#00bcd4"
                            positive={true}
                        />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                        <PerformanceCard
                            metric="127"
                            description="Active Strategies"
                            comparison="Continuously optimizing"
                            color="#ff9800"
                            positive={true}
                        />
                    </div>
                </div>
            </div>
        </section>
    );
}
