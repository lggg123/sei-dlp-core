"use client"

import React, { useState } from 'react';
import Navigation from '@/components/Navigation';
import { TrendingUp, PieChart, DollarSign, Activity, Plus, ArrowRight, Wallet, BarChart3, Settings, Bell } from 'lucide-react';
import CustomerVaultDashboard from '@/components/CustomerVaultDashboard';
import Link from 'next/link';

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

  const getStrategyColor = (strategy: string) => {
    switch (strategy) {
      case 'concentrated_liquidity': return 'text-blue-400 bg-blue-400/10';
      case 'yield_farming': return 'text-green-400 bg-green-400/10';
      case 'arbitrage': return 'text-purple-400 bg-purple-400/10';
      case 'delta_neutral': return 'text-orange-400 bg-orange-400/10';
      default: return 'text-gray-400 bg-gray-400/10';
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      {/* Navigation */}
      <Navigation variant="dark" showWallet={true} showLaunchApp={false} />
      
      {/* Header */}
      <div className="border-b border-white/10 bg-black/20 backdrop-blur-xl sticky z-50" style={{ top: '3.5rem' }}>
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-pink-400 rounded-xl flex items-center justify-center">
                <PieChart className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  Vault Dashboard
                </h1>
                <p className="text-gray-400 mt-1">Manage your DeFi positions on SEI Testnet</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button className="p-2 bg-white/5 rounded-xl hover:bg-white/10 transition-all">
                <Bell className="w-5 h-5 text-gray-400" />
              </button>
              <button className="p-2 bg-white/5 rounded-xl hover:bg-white/10 transition-all">
                <Settings className="w-5 h-5 text-gray-400" />
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
      </div>

      <section className="py-8 relative">
        <div className="container mx-auto px-4">
          <div className="max-w-7xl mx-auto">
        {/* Portfolio Overview Stats */}
        <div className="space-y-4 mb-8">
          {/* Main stats row */}
          <div className="dashboard-stats-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4"
               style={{ 
                 display: 'grid', 
                 gridTemplateColumns: 'repeat(1, minmax(0, 1fr))',
                 gap: '1rem'
               }}>
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
              <div 
                key={index} 
                className="dashboard-card-bg bg-slate-800/60 border border-slate-700/50 rounded-xl p-4 hover:bg-slate-700/50 transition-all backdrop-blur-3xl"
                style={{ 
                  backgroundColor: 'rgb(30 41 59 / 0.6)', 
                  backdropFilter: 'blur(24px)',
                  WebkitBackdropFilter: 'blur(24px)',
                  border: '1px solid rgb(51 65 85 / 0.5)'
                }}
              >
                <div className="flex items-start justify-between mb-2">
                  <stat.icon className={`w-5 h-5 text-${stat.color}-400 flex-shrink-0`} />
                  <div className={`text-xs font-medium px-2 py-1 rounded ${
                    stat.trend === 'up' 
                      ? `text-green-400 bg-green-400/10` 
                      : `text-red-400 bg-red-400/10`
                  }`}>
                    {stat.change}
                  </div>
                </div>
                <div className="text-xl font-bold mb-1 text-white">{stat.value}</div>
                <div className="text-slate-400 text-xs leading-tight">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Main Dashboard Content */}
        <div 
          className="dashboard-card-bg bg-slate-800/60 border border-slate-700/50 rounded-2xl p-6 backdrop-blur-3xl"
          style={{ 
            backgroundColor: 'rgb(30 41 59 / 0.6)', 
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            border: '1px solid rgb(51 65 85 / 0.5)'
          }}
        >
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-white">
            <Activity className="w-5 h-5 text-purple-400" />
            Your Positions
          </h2>
          <div className="dashboard-positions flex flex-col gap-4"
               style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {vaultPositions.map((position) => (
              <Link href={`/dashboard/${position.address}`} key={position.address}>
                <div 
                  className="bg-slate-700/30 border border-slate-600/30 rounded-xl p-4 hover:bg-slate-600/40 hover:border-slate-500/50 transition-all cursor-pointer"
                  style={{
                    backgroundColor: 'rgb(51 65 85 / 0.3)',
                    border: '1px solid rgb(71 85 105 / 0.3)',
                    borderRadius: '0.75rem',
                    padding: '1rem'
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="flex-1">
                          <div className="font-semibold text-white text-base">{position.name}</div>
                          <div className={`text-xs px-2 py-1 rounded inline-block mt-1 ${getStrategyColor(position.strategy)}`}>
                            {position.strategy.replace('_', ' ').toUpperCase()}
                          </div>
                        </div>
                        <ArrowRight className="w-5 h-5 text-slate-400" />
                      </div>
                      <div className="grid grid-cols-4 gap-4">
                        <div>
                          <div className="text-slate-400 text-xs mb-1">Value</div>
                          <div className="font-semibold text-white">{formatCurrency(position.value)}</div>
                        </div>
                        <div>
                          <div className="text-slate-400 text-xs mb-1">P&L</div>
                          <div className={`font-semibold ${position.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            +{formatCurrency(position.pnl)} ({position.pnlPercent}%)
                          </div>
                        </div>
                        <div>
                          <div className="text-slate-400 text-xs mb-1">APY</div>
                          <div className="font-semibold text-blue-400">{position.apy}%</div>
                        </div>
                        <div>
                          <div className="text-slate-400 text-xs mb-1">Daily Yield</div>
                          <div className="font-semibold text-green-400">{formatCurrency(position.dailyYield)}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
          <div className="mt-6 pt-6 border-t border-slate-600/30">
            <Link
              href="/vaults"
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 rounded-xl font-semibold hover:from-purple-600 hover:to-pink-600 transition-all flex items-center justify-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Add New Position
            </Link>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href="/dashboard/rebalance"
            className="dashboard-card-bg bg-slate-800/60 border border-slate-700/50 text-white p-6 rounded-2xl hover:bg-slate-700/50 hover:border-slate-600/60 transition-all text-left block group backdrop-blur-3xl"
            style={{ backgroundColor: 'rgb(30 41 59 / 0.6)', backdropFilter: 'blur(24px)' }}
          >
            <BarChart3 className="w-8 h-8 text-yellow-400 mb-3 group-hover:scale-110 transition-transform" />
            <div className="font-semibold mb-1 text-white">Portfolio Rebalancing</div>
            <div className="text-sm text-slate-400">Optimize your yield with AI-powered analysis</div>
          </Link>

          <Link
            href="/dashboard/active-trades"
            className="dashboard-card-bg bg-slate-800/60 border border-slate-700/50 text-white p-6 rounded-2xl hover:bg-slate-700/50 hover:border-slate-600/60 transition-all text-left block group backdrop-blur-3xl"
            style={{ backgroundColor: 'rgb(30 41 59 / 0.6)', backdropFilter: 'blur(24px)' }}
          >
            <Activity className="w-8 h-8 text-green-400 mb-3 group-hover:scale-110 transition-transform" />
            <div className="font-semibold mb-1 text-white">Active Trades</div>
            <div className="text-sm text-slate-400">Monitor your trades in real-time</div>
          </Link>

          <Link
            href="/market"
            className="dashboard-card-bg bg-slate-800/60 border border-slate-700/50 text-white p-6 rounded-2xl hover:bg-slate-700/50 hover:border-slate-600/60 transition-all text-left block group backdrop-blur-3xl"
            style={{ backgroundColor: 'rgb(30 41 59 / 0.6)', backdropFilter: 'blur(24px)' }}
          >
            <TrendingUp className="w-8 h-8 text-purple-400 mb-3 group-hover:scale-110 transition-transform" />
            <div className="font-semibold mb-1 text-white">Market Overview</div>
            <div className="text-sm text-slate-400">Explore trading opportunities</div>
          </Link>
        </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default DashboardPage;
