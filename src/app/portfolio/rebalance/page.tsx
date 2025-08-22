"use client"

import React, { useState } from 'react';
import Navigation from '@/components/Navigation';
import { BarChart3, TrendingUp, AlertTriangle, Zap, Clock, CheckCircle, DollarSign, ArrowRight, RefreshCw } from 'lucide-react';

interface RebalanceAction {
  id: string;
  action: 'buy' | 'sell' | 'move';
  fromVault?: string;
  toVault?: string;
  token: string;
  amount: number;
  currentPrice: number;
  estimatedGas: number;
  priority: 'high' | 'medium' | 'low';
  reason: string;
}

const RebalancePage = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showRecommendations, setShowRecommendations] = useState(true);
  const [selectedActions, setSelectedActions] = useState<string[]>([]);
  // Demo simulation state
  const [isDemoMode] = useState(process.env.NEXT_PUBLIC_DEMO_MODE === 'true');
  const [executionStatus, setExecutionStatus] = useState<'idle' | 'executing' | 'success' | 'error'>('idle');
  const [executionProgress, setExecutionProgress] = useState(0);
  const [executedTransactions, setExecutedTransactions] = useState<string[]>([]);

  const rebalanceActions: RebalanceAction[] = [
    {
      id: '1',
      action: 'move',
      fromVault: 'SEI-USDC LP',
      toVault: 'ATOM-SEI LP',
      token: 'SEI',
      amount: 500,
      currentPrice: 0.52,
      estimatedGas: 0.002,
      priority: 'high',
      reason: 'ATOM-SEI pair showing 18.7% APY vs 12.4% current yield'
    },
    {
      id: '2',
      action: 'sell',
      fromVault: 'ETH-SEI LP',
      token: 'ETH',
      amount: 0.5,
      currentPrice: 2456.89,
      estimatedGas: 0.003,
      priority: 'medium',
      reason: 'ETH exposure above target allocation (35% vs 25%)'
    },
    {
      id: '3',
      action: 'buy',
      toVault: 'Delta Neutral Vault',
      token: 'USDC',
      amount: 1000,
      currentPrice: 1.00,
      estimatedGas: 0.001,
      priority: 'low',
      reason: 'Increase stable exposure for market volatility hedge'
    }
  ];

  const portfolioStats = {
    totalValue: 12450.78,
    unrealizedPnL: 856.32,
    dailyChange: 2.4,
    gasEstimate: 0.006,
    estimatedTime: '2-3 minutes',
    potentialYieldIncrease: 4.2
  };

  const handleAnalyze = () => {
    setIsAnalyzing(true);
    setTimeout(() => {
      setIsAnalyzing(false);
      setShowRecommendations(true);
    }, 3000);
  };

  const handleActionToggle = (actionId: string) => {
    if (selectedActions.includes(actionId)) {
      setSelectedActions(selectedActions.filter(id => id !== actionId));
    } else {
      setSelectedActions([...selectedActions, actionId]);
    }
  };

  const handleExecuteRebalance = async () => {
    if (isDemoMode) {
      // DEMO MODE: Simulate rebalance execution
      console.log('🎭 [RebalancePage] Demo mode: Simulating rebalance execution');
      
      setExecutionStatus('executing');
      setExecutionProgress(0);
      setExecutedTransactions([]);

      // Simulate progressive execution of selected actions
      for (let i = 0; i < selectedActions.length; i++) {
        const action = rebalanceActions.find(a => a.id === selectedActions[i]);
        if (!action) continue;

        // Simulate transaction delay
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Generate fake transaction hash
        const fakeHash = `0x${Math.random().toString(16).substr(2, 64)}`;
        
        setExecutedTransactions(prev => [...prev, fakeHash]);
        setExecutionProgress(((i + 1) / selectedActions.length) * 100);
        
        console.log(`🎉 [RebalancePage] Executed action ${i + 1}/${selectedActions.length}: ${action.action} ${action.amount} ${action.token}`);
      }

      // Mark as complete
      setExecutionStatus('success');
      
      setTimeout(() => {
        setExecutionStatus('idle');
        setExecutionProgress(0);
        setSelectedActions([]);
        setExecutedTransactions([]);
      }, 5000);
      
      return;
    }

    // REAL MODE: Use actual smart contract integration
    alert(`Executing ${selectedActions.length} rebalance actions...`);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-400 bg-red-400/10 border-red-400/20';
      case 'medium': return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
      case 'low': return 'text-green-400 bg-green-400/10 border-green-400/20';
      default: return 'text-gray-400 bg-gray-400/10 border-gray-400/20';
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'buy': return <TrendingUp className="w-5 h-5 text-green-400" />;
      case 'sell': return <TrendingUp className="w-5 h-5 text-red-400 rotate-180" />;
      case 'move': return <ArrowRight className="w-5 h-5 text-blue-400" />;
      default: return <RefreshCw className="w-5 h-5 text-gray-400" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      {/* Navigation */}
      <Navigation variant="dark" showWallet={true} showLaunchApp={false} />
      
      {/* Header */}
      <div className="border-b border-white/10 bg-black/20 backdrop-blur-xl" style={{ marginTop: '3.5rem' }}>
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-pink-400 rounded-xl flex items-center justify-center">
                <BarChart3 className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-400 to-pink-400 bg-clip-text text-transparent flex items-center gap-3">
                  Portfolio Rebalancing
                  {isDemoMode && (
                    <span className="text-sm bg-green-500 text-white px-2 py-1 rounded-lg font-semibold">
                      DEMO MODE
                    </span>
                  )}
                </h1>
                <p className="text-gray-400 mt-1">Optimize your yield using AI-powered analysis</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-400">Portfolio Value</div>
              <div className="text-2xl font-bold">${portfolioStats.totalValue.toLocaleString()}</div>
              <div className={`text-sm ${portfolioStats.dailyChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {portfolioStats.dailyChange >= 0 ? '+' : ''}{portfolioStats.dailyChange}% (24h)
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {[
            { label: 'Unrealized P&L', value: `$${portfolioStats.unrealizedPnL.toLocaleString()}`, change: '+6.9%', color: 'green' },
            { label: 'Potential Yield ↑', value: `+${portfolioStats.potentialYieldIncrease}%`, change: 'APY', color: 'blue' },
            { label: 'Gas Estimate', value: `${portfolioStats.gasEstimate} SEI`, change: '~$0.003', color: 'purple' },
            { label: 'Execution Time', value: portfolioStats.estimatedTime, change: 'Fast finality', color: 'orange' }
          ].map((stat, index) => (
            <div key={index} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
              <div className="text-gray-400 text-sm mb-1">{stat.label}</div>
              <div className="text-xl font-bold mb-1">{stat.value}</div>
              <div className={`text-sm text-${stat.color}-400`}>{stat.change}</div>
            </div>
          ))}
        </div>

        {/* Analysis Section */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Zap className="w-5 h-5 text-yellow-400" />
              AI Rebalance Analysis
            </h2>
            <button
              onClick={handleAnalyze}
              disabled={isAnalyzing}
              className="bg-gradient-to-r from-yellow-500 to-orange-500 text-black px-6 py-2 rounded-xl font-semibold hover:from-yellow-600 hover:to-orange-600 transition-all disabled:opacity-50 flex items-center gap-2"
            >
              {isAnalyzing ? (
                <>
                  <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4" />
                  Re-analyze
                </>
              )}
            </button>
          </div>

          {isAnalyzing ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 border-4 border-yellow-400/30 border-t-yellow-400 rounded-full animate-spin mx-auto mb-4" />
              <div className="text-lg font-semibold mb-2">Analyzing Market Conditions</div>
              <div className="text-gray-400">Scanning yield opportunities across SEI DeFi...</div>
            </div>
          ) : showRecommendations ? (
            <div className="space-y-4">
              <div className="bg-green-400/10 border border-green-400/20 rounded-xl p-4 mb-4">
                <div className="flex items-center gap-2 text-green-400 mb-2">
                  <CheckCircle className="w-5 h-5" />
                  <span className="font-semibold">Analysis Complete</span>
                </div>
                <p className="text-gray-300">Found {rebalanceActions.length} optimization opportunities that could increase your yield by {portfolioStats.potentialYieldIncrease}%</p>
              </div>

              {/* Recommended Actions */}
              <div className="space-y-3">
                {rebalanceActions.map((action) => (
                  <div
                    key={action.id}
                    className={`p-4 rounded-xl border transition-all cursor-pointer ${
                      selectedActions.includes(action.id)
                        ? 'border-blue-400 bg-blue-400/10'
                        : 'border-white/10 bg-white/5 hover:bg-white/10'
                    }`}
                    onClick={() => handleActionToggle(action.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center justify-center w-10 h-10 bg-gray-800 rounded-lg">
                          {getActionIcon(action.action)}
                        </div>
                        <div>
                          <div className="font-semibold capitalize">{action.action} {action.token}</div>
                          <div className="text-sm text-gray-400">
                            {action.fromVault && `From: ${action.fromVault}`}
                            {action.fromVault && action.toVault && ' → '}
                            {action.toVault && `To: ${action.toVault}`}
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="font-semibold">{action.amount} {action.token}</div>
                        <div className="text-sm text-gray-400">${(action.amount * action.currentPrice).toLocaleString()}</div>
                      </div>
                      
                      <div className={`px-3 py-1 rounded-lg text-sm font-medium border ${getPriorityColor(action.priority)}`}>
                        {action.priority}
                      </div>
                    </div>
                    
                    <div className="mt-3 text-sm text-gray-400 bg-black/20 rounded-lg p-3">
                      <div className="flex items-center gap-1 mb-1">
                        <AlertTriangle className="w-4 h-4" />
                        <span className="font-medium">Reason:</span>
                      </div>
                      {action.reason}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">
              <BarChart3 className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <div>Click "Analyze" to scan for rebalancing opportunities</div>
            </div>
          )}
        </div>

        {/* Execution Panel */}
        {showRecommendations && selectedActions.length > 0 && (
          <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-400/20 rounded-2xl p-6">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Zap className="w-5 h-5 text-blue-400" />
              Execute Rebalance ({selectedActions.length} actions)
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-400">{selectedActions.length}</div>
                <div className="text-sm text-gray-400">Actions Selected</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-400">
                  {portfolioStats.gasEstimate} SEI
                </div>
                <div className="text-sm text-gray-400">Total Gas Cost</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-400">{portfolioStats.estimatedTime}</div>
                <div className="text-sm text-gray-400">Execution Time</div>
              </div>
            </div>

            <div className="bg-yellow-400/10 border border-yellow-400/20 rounded-xl p-4 mb-4">
              <div className="flex items-center gap-2 text-yellow-400 mb-2">
                <Clock className="w-5 h-5" />
                <span className="font-semibold">Execution Details</span>
              </div>
              <ul className="text-sm space-y-1 text-gray-300">
                <li>• Trades will execute in optimal order using SEI's fast finality</li>
                <li>• MEV protection enabled</li>
                <li>• Slippage tolerance: 0.5%</li>
                <li>• You can monitor progress in real-time</li>
              </ul>
            </div>

            <button
              onClick={handleExecuteRebalance}
              disabled={executionStatus === 'executing'}
              className="w-full bg-gradient-to-r from-green-500 to-blue-500 text-white py-4 rounded-xl font-semibold hover:from-green-600 hover:to-blue-600 transition-all text-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {executionStatus === 'executing' ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Executing... ({Math.round(executionProgress)}%)
                </>
              ) : executionStatus === 'success' ? (
                <>
                  <CheckCircle className="w-5 h-5" />
                  Rebalance Complete!
                </>
              ) : (
                <>
                  <Zap className="w-5 h-5" />
                  Execute Rebalance
                </>
              )}
            </button>

            {/* Execution Progress */}
            {executionStatus !== 'idle' && (
              <div className="mt-4 p-4 bg-white/5 rounded-xl border border-white/10">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">
                    {executionStatus === 'executing' ? 'Executing Rebalance...' : 
                     executionStatus === 'success' ? 'Rebalance Completed!' : 
                     'Execution Failed'}
                  </span>
                  <span className="text-sm text-gray-400">
                    {Math.round(executionProgress)}%
                  </span>
                </div>
                
                {executionStatus === 'executing' && (
                  <div className="w-full bg-gray-700 rounded-full h-2 mb-3">
                    <div 
                      className="bg-gradient-to-r from-green-400 to-blue-400 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${executionProgress}%` }}
                    ></div>
                  </div>
                )}

                {executedTransactions.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-xs text-gray-400 mb-2">Transaction Hashes:</div>
                    {executedTransactions.map((hash, index) => (
                      <div key={index} className="text-xs font-mono text-green-400 bg-green-400/10 p-2 rounded">
                        Action {index + 1}: {hash.substring(0, 6)}...{hash.substring(hash.length - 4)}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default RebalancePage;