"use client"

import React, { useState } from 'react';
import { TrendingUp, TrendingDown, DollarSign, BarChart3, Activity, Eye, Clock, Zap } from 'lucide-react';

interface MarketData {
  symbol: string;
  price: number;
  change24h: number;
  volume24h: number;
  marketCap: number;
  liquidity: number;
  apy: number;
}

const MarketPage = () => {
  const [selectedTimeframe, setSelectedTimeframe] = useState('24h');

  // Mock market data for SEI ecosystem
  const marketData: MarketData[] = [
    {
      symbol: 'SEI-USDC',
      price: 0.52,
      change24h: 8.4,
      volume24h: 2400000,
      marketCap: 156000000,
      liquidity: 8900000,
      apy: 12.4
    },
    {
      symbol: 'ATOM-SEI',
      price: 12.76,
      change24h: -2.1,
      volume24h: 890000,
      marketCap: 34000000,
      liquidity: 4200000,
      apy: 18.7
    },
    {
      symbol: 'ETH-SEI',
      price: 2456.89,
      change24h: 5.2,
      volume24h: 5600000,
      marketCap: 89000000,
      liquidity: 12000000,
      apy: 15.3
    },
    {
      symbol: 'BTC-SEI',
      price: 42356.78,
      change24h: 3.8,
      volume24h: 8900000,
      marketCap: 178000000,
      liquidity: 15600000,
      apy: 9.8
    }
  ];

  const formatNumber = (num: number, decimals = 2) => {
    if (num >= 1000000) return `$${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `$${(num / 1000).toFixed(0)}K`;
    return `$${num.toFixed(decimals)}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      {/* Header */}
      <div className="border-b border-white/10 bg-black/20 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                SEI Market Overview
              </h1>
              <p className="text-gray-400 mt-2">Real-time trading data and liquidity metrics</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-green-400">Live Data</span>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-400">Chain ID</div>
                <div className="text-lg font-bold text-blue-400">1328</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {[
            { label: 'Total Volume 24h', value: '$18.2M', change: '+12.4%', icon: BarChart3, color: 'blue' },
            { label: 'Total Liquidity', value: '$40.7M', change: '+5.8%', icon: DollarSign, color: 'green' },
            { label: 'Active Pairs', value: '24', change: '+2', icon: Activity, color: 'purple' },
            { label: 'Avg APY', value: '14.1%', change: '+0.8%', icon: TrendingUp, color: 'orange' }
          ].map((stat, index) => (
            <div key={index} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <stat.icon className={`w-8 h-8 text-${stat.color}-400`} />
                <div className={`text-sm font-medium text-${stat.color}-400 bg-${stat.color}-400/10 px-2 py-1 rounded-lg`}>
                  {stat.change}
                </div>
              </div>
              <div className="text-2xl font-bold mb-1">{stat.value}</div>
              <div className="text-gray-400 text-sm">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Timeframe Selector */}
        <div className="flex items-center gap-4 mb-6">
          <span className="text-gray-400">Timeframe:</span>
          {['1h', '24h', '7d', '30d'].map((timeframe) => (
            <button
              key={timeframe}
              onClick={() => setSelectedTimeframe(timeframe)}
              className={`px-4 py-2 rounded-lg transition-all duration-200 ${
                selectedTimeframe === timeframe
                  ? 'bg-blue-500 text-white'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10'
              }`}
            >
              {timeframe}
            </button>
          ))}
        </div>

        {/* Market Data Table */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden">
          <div className="p-6 border-b border-white/10">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Eye className="w-5 h-5 text-blue-400" />
              Trading Pairs
            </h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-white/5">
                  <th className="text-left p-4 font-medium text-gray-400">Pair</th>
                  <th className="text-right p-4 font-medium text-gray-400">Price</th>
                  <th className="text-right p-4 font-medium text-gray-400">24h Change</th>
                  <th className="text-right p-4 font-medium text-gray-400">Volume</th>
                  <th className="text-right p-4 font-medium text-gray-400">Liquidity</th>
                  <th className="text-right p-4 font-medium text-gray-400">APY</th>
                  <th className="text-center p-4 font-medium text-gray-400">Action</th>
                </tr>
              </thead>
              <tbody>
                {marketData.map((item, index) => (
                  <tr key={index} className="border-t border-white/5 hover:bg-white/5 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-400 rounded-full flex items-center justify-center text-sm font-bold">
                          {item.symbol.split('-')[0]}
                        </div>
                        <div>
                          <div className="font-semibold">{item.symbol}</div>
                          <div className="text-sm text-gray-400">SEI Network</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <div className="font-semibold">{formatNumber(item.price)}</div>
                    </td>
                    <td className="p-4 text-right">
                      <div className={`flex items-center justify-end gap-1 ${
                        item.change24h >= 0 ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {item.change24h >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                        {Math.abs(item.change24h)}%
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <div className="font-semibold">{formatNumber(item.volume24h)}</div>
                    </td>
                    <td className="p-4 text-right">
                      <div className="font-semibold">{formatNumber(item.liquidity)}</div>
                    </td>
                    <td className="p-4 text-right">
                      <div className="text-orange-400 font-semibold">{item.apy}%</div>
                    </td>
                    <td className="p-4 text-center">
                      <button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2 mx-auto">
                        <Zap className="w-4 h-4" />
                        Trade
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer Note */}
        <div className="mt-8 text-center text-gray-400 text-sm">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Clock className="w-4 h-4" />
            Last updated: {new Date().toLocaleTimeString()}
          </div>
          <p>Market data refreshes every 30 seconds • Powered by SEI Network</p>
        </div>
      </div>
    </div>
  );
};

export default MarketPage;