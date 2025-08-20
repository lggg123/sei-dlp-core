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

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Portfolio Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6 mb-8">
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
            <div key={index} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all">
              <div className="flex items-center justify-between mb-4">
                <stat.icon className={`w-8 h-8 text-${stat.color}-400`} />
                <div className={`text-sm font-medium px-2 py-1 rounded-lg ${
                  stat.trend === 'up' 
                    ? `text-green-400 bg-green-400/10` 
                    : `text-red-400 bg-red-400/10`
                }`}>
                  {stat.change}
                </div>
              </div>
              <div className="text-2xl font-bold mb-1">{stat.value}</div>
              <div className="text-gray-400 text-sm">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Main Dashboard Content */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
            <Activity className="w-5 h-5 text-purple-400" />
            Your Positions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            {vaultPositions.map((position) => (
              <Link href={`/dashboard/${position.address}`} key={position.address}>
                <div className="p-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20 transition-all cursor-pointer h-full flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <div className="font-semibold text-sm">{position.name}</div>
                        <div className={`text-xs px-2 py-1 rounded-lg inline-block mt-1 ${getStrategyColor(position.strategy)}`}>
                          {position.strategy.replace('_', ' ').toUpperCase()}
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-gray-400" />
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <div className="text-gray-400 text-xs">Value</div>
                        <div className="font-semibold">{formatCurrency(position.value)}</div>
                      </div>
                      <div>
                        <div className="text-gray-400 text-xs">P&L</div>
                        <div className={`font-semibold ${position.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          +{formatCurrency(position.pnl)} ({position.pnlPercent}%)
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-400 text-xs">APY</div>
                        <div className="font-semibold text-blue-400">{position.apy}%</div>
                      </div>
                      <div>
                        <div className="text-gray-400 text-xs">Daily Yield</div>
                        <div className="font-semibold text-green-400">{formatCurrency(position.dailyYield)}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
          <div className="mt-6 pt-6 border-t border-white/10">
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
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link
            href="/dashboard/rebalance"
            className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-400/20 text-white p-6 rounded-2xl hover:bg-gradient-to-r hover:from-yellow-500/20 hover:to-orange-500/20 transition-all text-left block group"
          >
            <BarChart3 className="w-8 h-8 text-yellow-400 mb-3 group-hover:scale-110 transition-transform" />
            <div className="font-semibold mb-1">Portfolio Rebalancing</div>
            <div className="text-sm text-gray-400">Optimize your yield with AI-powered analysis</div>
          </Link>

          <Link
            href="/dashboard/active-trades"
            className="bg-gradient-to-r from-green-500/10 to-blue-500/10 border border-green-400/20 text-white p-6 rounded-2xl hover:bg-gradient-to-r hover:from-green-500/20 hover:to-blue-500/20 transition-all text-left block group"
          >
            <Activity className="w-8 h-8 text-green-400 mb-3 group-hover:scale-110 transition-transform" />
            <div className="font-semibold mb-1">Active Trades</div>
            <div className="text-sm text-gray-400">Monitor your trades in real-time</div>
          </Link>

          <Link
            href="/market"
            className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-400/20 text-white p-6 rounded-2xl hover:bg-gradient-to-r hover:from-purple-500/20 hover:to-pink-500/20 transition-all text-left block group"
          >
            <TrendingUp className="w-8 h-8 text-purple-400 mb-3 group-hover:scale-110 transition-transform" />
            <div className="font-semibold mb-1">Market Overview</div>
            <div className="text-sm text-gray-400">Explore trading opportunities</div>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
