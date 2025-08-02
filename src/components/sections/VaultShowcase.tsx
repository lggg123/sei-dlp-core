'use client'

import VaultCard from '@/components/VaultCard';

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

export default function VaultShowcase() {
    return (
        <section className="py-32 relative">
            <div className="container mx-auto px-4">
                <div className="text-center mb-20">
                    <h2 className="text-5xl lg:text-6xl font-bold mb-6 holo-text">
                        Intelligent Vault Ecosystem
                    </h2>
                    <p className="text-2xl text-muted-foreground max-w-4xl mx-auto">
                        Choose from our curated selection of AI-optimized vaults,
                        each designed for different risk profiles and market conditions.
                    </p>
                </div>

                <div className="flex flex-row justify-center items-stretch gap-10 overflow-x-auto pb-6 max-w-6xl mx-auto px-8 scrollbar-hide" style={{ minHeight: '280px' }}>
                    {vaultData.map((vault, index) => (
                        <VaultCard key={vault.name} vault={vault} index={index} />
                    ))}
                </div>
            </div>
        </section>
    );
}