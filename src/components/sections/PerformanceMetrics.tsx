import PerformanceCard from '@/components/PerformanceCard';

export default function PerformanceMetrics() {
    return (
        <section className="py-32 relative">
            <div className="container mx-auto px-4">
                <div className="text-center mb-20">
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
                    <p className="text-2xl text-muted-foreground max-w-4xl mx-auto">
                        Track your vault performance with AI-powered analytics and real-time metrics.
                    </p>
                </div>
                
                <div className="flex flex-wrap justify-center max-w-7xl mx-auto" style={{ gap: '2rem' }}>
                    <div className="w-full sm:w-1/2 lg:w-1/4" style={{ maxWidth: '280px', margin: '1rem' }}>
                        <PerformanceCard
                            metric="24.5%"
                            description="Average APY"
                            comparison="+12.3% from last month"
                            color="#00f5d4"
                            positive={true}
                        />
                    </div>
                    <div className="w-full sm:w-1/2 lg:w-1/4" style={{ maxWidth: '280px', margin: '1rem' }}>
                        <PerformanceCard
                            metric="$8.3M"
                            description="Total Value Locked"
                            comparison="+18% this week"
                            color="#9b5de5"
                            positive={true}
                        />
                    </div>
                    <div className="w-full sm:w-1/2 lg:w-1/4" style={{ maxWidth: '280px', margin: '1rem' }}>
                        <PerformanceCard
                            metric="0.012%"
                            description="Impermanent Loss"
                            comparison="-62% vs traditional AMMs"
                            color="#ff206e"
                            positive={true}
                        />
                    </div>
                    <div className="w-full sm:w-1/2 lg:w-1/4" style={{ maxWidth: '280px', margin: '1rem' }}>
                        <PerformanceCard
                            metric="99.8%"
                            description="Uptime"
                            comparison="AI optimization active"
                            color="#fee75c"
                            positive={true}
                        />
                    </div>
                </div>
            </div>
        </section>
    );
}
