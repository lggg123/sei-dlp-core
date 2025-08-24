"use client"

import React from 'react';
import Navigation from '@/components/Navigation';
import { TrendingUp, PieChart, DollarSign, Activity, Plus, ArrowRight, Wallet, BarChart3, Settings, Bell } from 'lucide-react';
import Link from 'next/link';
import styles from './page.module.css';

interface VaultPosition {
  address: string;
  name: string;
  strategy: string;
  shares: number;
  value: number;
  apy: number;
  dailyYield: number;
  pnl: number;
  pnlPercent: number;
}

const DashboardPage = () => {
  
  // Mock user portfolio data
  const portfolioOverview = {
    totalValue: 14750.89,
    totalPnL: 1250.34,
    pnlPercent: 9.3,
    dailyYield: 48.92,
    activePositions: 4,
    totalYieldEarned: 847.56
  };

  const vaultPositions: VaultPosition[] = [
    {
      address: '0xf6A791e4773A60083AA29aaCCDc3bA5E900974fE',
      name: 'SEI-USDC Concentrated LP',
      strategy: 'concentrated_liquidity',
      shares: 2450.0,
      value: 6250.45,
      apy: 12.4,
      dailyYield: 21.24,
      pnl: 450.78,
      pnlPercent: 7.8
    },
    {
      address: '0x6F4cF61bBf63dCe0094CA1fba25545f8c03cd8E6',
      name: 'ATOM-SEI Yield Farm',
      strategy: 'yield_farming',
      shares: 1800.0,
      value: 4150.32,
      apy: 18.7,
      dailyYield: 18.76,
      pnl: 325.67,
      pnlPercent: 8.5
    },
    {
      address: '0x22Fc4c01FAcE783bD47A1eF2B6504213C85906a1',
      name: 'ETH-USDT Arbitrage Bot',
      strategy: 'arbitrage',
      shares: 950.0,
      value: 2890.12,
      apy: 26.7,
      dailyYield: 6.84,
      pnl: 234.89,
      pnlPercent: 8.8
    },
    {
      address: '0xaE6F27Fdf2D15c067A0Ebc256CE05A317B671B81',
      name: 'Delta Neutral LP Vault',
      strategy: 'delta_neutral',
      shares: 1200.0,
      value: 1460.00,
      apy: 15.5,
      dailyYield: 2.08,
      pnl: 239.00,
      pnlPercent: 19.6
    }
  ];

  // Legacy function kept for backwards compatibility if needed elsewhere
  // const getStrategyColor = (strategy: string) => {
  //   switch (strategy) {
  //     case 'concentrated_liquidity': return 'text-blue-400 bg-blue-400/10';
  //     case 'yield_farming': return 'text-green-400 bg-green-400/10';
  //     case 'arbitrage': return 'text-purple-400 bg-purple-400/10';
  //     case 'delta_neutral': return 'text-orange-400 bg-orange-400/10';
  //     default: return 'text-gray-400 bg-gray-400/10';
  //   }
  // };

  const getStrategyClass = (strategy: string) => {
    switch (strategy) {
      case 'concentrated_liquidity': return 'concentrated';
      case 'yield_farming': return 'farming';
      case 'arbitrage': return 'arbitrage';
      case 'delta_neutral': return 'neutral';
      default: return 'concentrated';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  return (
    <div className={styles.dashboardContainer}>
      {/* Navigation */}
      <Navigation variant="dark" showWallet={true} showLaunchApp={false} />
      
      {/* Header */}
      <div className={styles.headerSection}>
        <div className={styles.headerContent}>
          <div className={styles.headerInfo}>
            <div className={styles.headerIcon}>
              <PieChart className="w-6 h-6" />
            </div>
            <div className={styles.headerText}>
              <h1>Vault Dashboard</h1>
              <p>Manage your DeFi positions on SEI Testnet</p>
            </div>
          </div>
          <div className={styles.headerActions}>
            <button className={styles.iconButton}>
              <Bell className="w-5 h-5" />
            </button>
            <button className={styles.iconButton}>
              <Settings className="w-5 h-5" />
            </button>
            <Link
              href="/dashboard/rebalance"
              className="bg-gradient-to-r from-yellow-500 to-orange-500 text-black px-4 py-2 rounded-xl font-semibold hover:from-yellow-600 hover:to-orange-600 transition-all flex items-center gap-2"
            >
              <BarChart3 className="w-4 h-4" />
              Rebalance
            </Link>
            <Link
              href="/vaults"
              className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-4 py-2 rounded-xl font-semibold hover:from-blue-600 hover:to-purple-600 transition-all flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              New Position
            </Link>
          </div>
        </div>
      </div>

      <section className={styles.contentSection}>
        <div className={styles.contentContainer}>
          {/* Portfolio Overview Stats */}
          <div className={styles.statsGrid}>
            {[
              { 
                label: 'Total Portfolio Value', 
                value: formatCurrency(portfolioOverview.totalValue), 
                change: `+${portfolioOverview.pnlPercent}%`, 
                icon: Wallet, 
                color: 'purple',
                trend: 'up'
              },
              { 
                label: 'Total P&L', 
                value: formatCurrency(portfolioOverview.totalPnL), 
                change: `+${portfolioOverview.pnlPercent}%`, 
                icon: TrendingUp, 
                color: 'green',
                trend: 'up'
              },
              { 
                label: 'Daily Yield', 
                value: formatCurrency(portfolioOverview.dailyYield), 
                change: '+5.2%', 
                icon: DollarSign, 
                color: 'blue',
                trend: 'up'
              },
              { 
                label: 'Active Positions', 
                value: portfolioOverview.activePositions.toString(), 
                change: '+1', 
                icon: Activity, 
                color: 'orange',
                trend: 'up'
              },
              { 
                label: 'Total Yield Earned', 
                value: formatCurrency(portfolioOverview.totalYieldEarned), 
                change: '+12.4%', 
                icon: TrendingUp, 
                color: 'pink',
                trend: 'up'
              },
              { 
                label: 'Avg APY', 
                value: '18.3%', 
                change: '+2.1%', 
                icon: BarChart3, 
                color: 'cyan',
                trend: 'up'
              }
            ].map((stat, index) => (
              <div key={index} className={`${styles.statCard} ${styles.fadeIn}`}>
                <div className={styles.statCardHeader}>
                  <div className={`${styles.statIcon} ${styles[stat.color]}`}>
                    <stat.icon className="w-5 h-5" />
                  </div>
                  <div className={`${styles.changeBadge} ${styles[stat.trend === 'up' ? 'positive' : 'negative']}`}>
                    {stat.change}
                  </div>
                </div>
                <div className={styles.statValue}>{stat.value}</div>
                <div className={styles.statLabel}>{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Main Dashboard Content */}
          <div className={styles.mainCard}>
            <div className={styles.mainCardHeader}>
              <Activity className={`w-5 h-5 ${styles.mainCardIcon}`} />
              <h2 className={styles.mainCardTitle}>Your Positions</h2>
            </div>
            <div className={styles.positionsContainer}>
              {vaultPositions.map((position) => (
                <Link href={`/dashboard/${position.address}`} key={position.address} className={styles.positionCard}>
                  <div className={styles.positionHeader}>
                    <div className={styles.positionInfo}>
                      <div className={styles.positionTitle}>{position.name}</div>
                      <div className={`${styles.strategyBadge} ${styles[getStrategyClass(position.strategy)]}`}>
                        {position.strategy.replace('_', ' ').toUpperCase()}
                      </div>
                    </div>
                    <ArrowRight className={`w-5 h-5 ${styles.arrowIcon}`} />
                  </div>
                  <div className={styles.metricsGrid}>
                    <div className={styles.metric}>
                      <div className={styles.metricLabel}>Value</div>
                      <div className={`${styles.metricValue} ${styles.white}`}>{formatCurrency(position.value)}</div>
                    </div>
                    <div className={styles.metric}>
                      <div className={styles.metricLabel}>P&L</div>
                      <div className={`${styles.metricValue} ${position.pnl >= 0 ? styles.positive : styles.negative}`}>
                        +{formatCurrency(position.pnl)} ({position.pnlPercent}%)
                      </div>
                    </div>
                    <div className={styles.metric}>
                      <div className={styles.metricLabel}>APY</div>
                      <div className={`${styles.metricValue} ${styles.blue}`}>{position.apy}%</div>
                    </div>
                    <div className={styles.metric}>
                      <div className={styles.metricLabel}>Daily Yield</div>
                      <div className={`${styles.metricValue} ${styles.green}`}>{formatCurrency(position.dailyYield)}</div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
            <div className={styles.sectionDivider}>
              <Link href="/vaults" className={styles.addPositionButton}>
                <Plus className="w-5 h-5" />
                Add New Position
              </Link>
            </div>
          </div>

          {/* Quick Actions */}
          <div className={styles.actionsGrid}>
            <Link href="/dashboard/rebalance" className={styles.actionCard}>
              <BarChart3 className={`w-8 h-8 ${styles.actionIcon} ${styles.yellow}`} />
              <div className={styles.actionTitle}>Portfolio Rebalancing</div>
              <div className={styles.actionDescription}>Optimize your yield with AI-powered analysis</div>
            </Link>

            <Link href="/dashboard/active-trades" className={styles.actionCard}>
              <Activity className={`w-8 h-8 ${styles.actionIcon} ${styles.green}`} />
              <div className={styles.actionTitle}>Active Trades</div>
              <div className={styles.actionDescription}>Monitor your trades in real-time</div>
            </Link>

            <Link href="/market" className={styles.actionCard}>
              <TrendingUp className={`w-8 h-8 ${styles.actionIcon} ${styles.purple}`} />
              <div className={styles.actionTitle}>Market Overview</div>
              <div className={styles.actionDescription}>Explore trading opportunities</div>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default DashboardPage;
