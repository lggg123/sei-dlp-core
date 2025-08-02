'use client'

import VaultCard from '@/components/VaultCard';
import { useState } from 'react';
import DepositModal from '@/components/DepositModal';

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
    const [showDepositModal, setShowDepositModal] = useState(false);
    const [selectedVault, setSelectedVault] = useState(null);

    const handleDeposit = (vault) => {
        setSelectedVault(vault);
        setShowDepositModal(true);
    };

    const handleCloseModal = () => {
        setShowDepositModal(false);
        setSelectedVault(null);
    };

    return (
        <section className="py-32 relative">
            <div className="container mx-auto px-4">
                <div className="text-center mb-20" style={{ marginBottom: '5rem' }}>
                    <h2 
                        className="text-5xl lg:text-6xl font-bold mb-6 holo-text"
                        style={{ 
                            fontSize: 'clamp(3rem, 6vw, 4.5rem)',
                            fontWeight: 'bold',
                            marginBottom: '2rem',
                            lineHeight: '1.1'
                        }}
                    >
                        Intelligent Vault Ecosystem
                    </h2>
                    <p 
                        className="text-2xl text-muted-foreground max-w-4xl mx-auto"
                        style={{ 
                            fontSize: '1.5rem',
                            marginTop: '2rem',
                            maxWidth: '64rem',
                            margin: '2rem auto 0'
                        }}
                    >
                        Choose from our curated selection of AI-optimized vaults,
                        each designed for different risk profiles and market conditions.
                    </p>
                </div>

                <div 
                    className="vault-container-override"
                    style={{
                        display: 'flex',
                        flexDirection: 'row',
                        flexWrap: 'wrap',
                        justifyContent: 'center',
                        alignItems: 'stretch',
                        gap: '2.5rem',
                        maxWidth: '1200px',
                        margin: '0 auto',
                        padding: '0 1rem',
                        rowGap: '2.5rem',
                        columnGap: '2.5rem'
                    }}
                >
                    <style jsx>{`
                        .vault-container-override {
                            display: flex !important;
                            flex-direction: row !important;
                            flex-wrap: wrap !important;
                            justify-content: center !important;
                            align-items: stretch !important;
                            gap: 2.5rem !important;
                            row-gap: 2.5rem !important;
                            column-gap: 2.5rem !important;
                            max-width: 1200px !important;
                            margin: 0 auto !important;
                            padding: 0 1rem !important;
                        }
                        .vault-card-wrapper {
                            flex: 0 0 auto !important;
                            width: 320px !important;
                            max-width: 320px !important;
                            min-width: 280px !important;
                            margin: 1rem !important;
                            padding: 0 !important;
                        }
                    `}</style>
                    {vaultData.map((vault, index) => (
                        <div 
                            key={vault.name}
                            className="vault-card-wrapper"
                            style={{
                                flex: '0 0 auto',
                                width: '320px',
                                maxWidth: '320px',
                                minWidth: '280px',
                                margin: '1rem',
                                padding: '0'
                            }}
                        >
                            <VaultCard vault={vault} index={index} onDeposit={() => handleDeposit(vault)} />
                        </div>
                    ))}
                </div>
            </div>
            <DepositModal
                vault={selectedVault}
                isOpen={showDepositModal}
                onClose={handleCloseModal}
            />
        </section>
    );
}