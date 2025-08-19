"use client"

import React, { useState } from 'react';
import { Rocket, Settings, DollarSign, Shield, TrendingUp, AlertTriangle, CheckCircle, Code, Zap } from 'lucide-react';

interface VaultConfig {
  name: string;
  symbol: string;
  strategy: string;
  tokenA: string;
  tokenB: string;
  fee: number;
  initialLiquidity: string;
  maxTVL: string;
  performanceFee: number;
  managementFee: number;
}

const DeployVaultPage = () => {
  const [step, setStep] = useState(1);
  const [isDeploying, setIsDeploying] = useState(false);
  const [deploymentHash, setDeploymentHash] = useState('');
  
  const [config, setConfig] = useState<VaultConfig>({
    name: '',
    symbol: '',
    strategy: 'concentrated_liquidity',
    tokenA: 'SEI',
    tokenB: 'USDC',
    fee: 0.003,
    initialLiquidity: '',
    maxTVL: '',
    performanceFee: 2.0,
    managementFee: 0.5
  });

  const strategies = [
    { id: 'concentrated_liquidity', name: 'Concentrated Liquidity', description: 'Capital efficient liquidity provision', risk: 'Medium' },
    { id: 'yield_farming', name: 'Yield Farming', description: 'Automated yield optimization', risk: 'Low' },
    { id: 'arbitrage', name: 'Arbitrage', description: 'Cross-DEX arbitrage opportunities', risk: 'High' },
    { id: 'delta_neutral', name: 'Delta Neutral', description: 'Market neutral strategies', risk: 'Low' },
    { id: 'hedge', name: 'Hedge Strategy', description: 'Risk hedging mechanisms', risk: 'Medium' }
  ];

  const tokens = ['SEI', 'USDC', 'USDT', 'ETH', 'BTC', 'ATOM', 'DAI'];

  const handleDeploy = async () => {
    setIsDeploying(true);
    
    // Simulate deployment process
    setTimeout(() => {
      setDeploymentHash('0x' + Math.random().toString(16).substr(2, 64));
      setStep(4);
      setIsDeploying(false);
    }, 3000);
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'Low': return 'text-green-400 bg-green-400/10';
      case 'Medium': return 'text-yellow-400 bg-yellow-400/10';
      case 'High': return 'text-red-400 bg-red-400/10';
      default: return 'text-gray-400 bg-gray-400/10';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      {/* Header */}
      <div className="border-b border-white/10 bg-black/20 backdrop-blur-xl">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-400 rounded-xl flex items-center justify-center">
              <Rocket className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Deploy New Vault
              </h1>
              <p className="text-gray-400 mt-1">Create and deploy custom yield strategies on SEI</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-8">
          {[1, 2, 3, 4].map((stepNum) => (
            <React.Fragment key={stepNum}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                step >= stepNum 
                  ? 'bg-blue-500 border-blue-500 text-white' 
                  : 'border-gray-600 text-gray-400'
              }`}>
                {step > stepNum ? <CheckCircle className="w-6 h-6" /> : stepNum}
              </div>
              {stepNum < 4 && (
                <div className={`w-20 h-0.5 transition-all ${
                  step > stepNum ? 'bg-blue-500' : 'bg-gray-600'
                }`} />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Step Content */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Settings className="w-5 h-5 text-blue-400" />
                Basic Configuration
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Vault Name</label>
                  <input
                    type="text"
                    value={config.name}
                    onChange={(e) => setConfig({...config, name: e.target.value})}
                    placeholder="e.g., SEI Optimized Yield Vault"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-blue-400"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Symbol</label>
                  <input
                    type="text"
                    value={config.symbol}
                    onChange={(e) => setConfig({...config, symbol: e.target.value.toUpperCase()})}
                    placeholder="e.g., SOYV"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-blue-400"
                  />
                </div>
              </div>
            </div>

            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
              <h3 className="text-lg font-bold mb-4">Strategy Selection</h3>
              <div className="grid grid-cols-1 gap-4">
                {strategies.map((strategy) => (
                  <div
                    key={strategy.id}
                    onClick={() => setConfig({...config, strategy: strategy.id})}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      config.strategy === strategy.id
                        ? 'border-blue-400 bg-blue-400/10'
                        : 'border-white/10 bg-white/5 hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-semibold">{strategy.name}</div>
                        <div className="text-gray-400 text-sm">{strategy.description}</div>
                      </div>
                      <div className={`px-3 py-1 rounded-lg text-sm font-medium ${getRiskColor(strategy.risk)}`}>
                        {strategy.risk} Risk
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={() => setStep(2)}
              disabled={!config.name || !config.symbol}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white py-3 rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:from-blue-600 hover:to-purple-600 transition-all"
            >
              Continue to Token Configuration
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-green-400" />
                Token Configuration
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Token A</label>
                  <select
                    value={config.tokenA}
                    onChange={(e) => setConfig({...config, tokenA: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-400"
                  >
                    {tokens.map(token => (
                      <option key={token} value={token} className="bg-gray-800">{token}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Token B</label>
                  <select
                    value={config.tokenB}
                    onChange={(e) => setConfig({...config, tokenB: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-400"
                  >
                    {tokens.map(token => (
                      <option key={token} value={token} className="bg-gray-800">{token}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Pool Fee (%)</label>
                  <input
                    type="number"
                    step="0.001"
                    value={config.fee}
                    onChange={(e) => setConfig({...config, fee: parseFloat(e.target.value)})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-400"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <button
                onClick={() => setStep(1)}
                className="bg-white/5 border border-white/10 text-white py-3 rounded-xl font-semibold hover:bg-white/10 transition-all"
              >
                Back
              </button>
              <button
                onClick={() => setStep(3)}
                className="bg-gradient-to-r from-blue-500 to-purple-500 text-white py-3 rounded-xl font-semibold hover:from-blue-600 hover:to-purple-600 transition-all"
              >
                Continue to Review
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5 text-yellow-400" />
                Review & Deploy
              </h2>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><span className="text-gray-400">Name:</span> {config.name}</div>
                  <div><span className="text-gray-400">Symbol:</span> {config.symbol}</div>
                  <div><span className="text-gray-400">Strategy:</span> {strategies.find(s => s.id === config.strategy)?.name}</div>
                  <div><span className="text-gray-400">Pair:</span> {config.tokenA}-{config.tokenB}</div>
                  <div><span className="text-gray-400">Fee:</span> {(config.fee * 100).toFixed(3)}%</div>
                  <div><span className="text-gray-400">Network:</span> SEI Testnet</div>
                </div>

                <div className="bg-yellow-400/10 border border-yellow-400/20 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-yellow-400 mb-2">
                    <AlertTriangle className="w-5 h-5" />
                    <span className="font-semibold">Deployment Requirements</span>
                  </div>
                  <ul className="text-sm space-y-1 text-gray-300">
                    <li>• Gas fee: ~0.1 SEI</li>
                    <li>• Minimum initial liquidity: 1 SEI</li>
                    <li>• Contract will be verified on SeiTrace</li>
                    <li>• Deployment typically takes 30-60 seconds</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <button
                onClick={() => setStep(2)}
                className="bg-white/5 border border-white/10 text-white py-3 rounded-xl font-semibold hover:bg-white/10 transition-all"
              >
                Back
              </button>
              <button
                onClick={handleDeploy}
                disabled={isDeploying}
                className="bg-gradient-to-r from-green-500 to-blue-500 text-white py-3 rounded-xl font-semibold hover:from-green-600 hover:to-blue-600 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isDeploying ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Deploying...
                  </>
                ) : (
                  <>
                    <Rocket className="w-5 h-5" />
                    Deploy Vault
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="text-center space-y-6">
            <div className="bg-green-400/10 border border-green-400/20 rounded-2xl p-8">
              <div className="w-16 h-16 bg-green-400 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-black" />
              </div>
              <h2 className="text-2xl font-bold text-green-400 mb-2">Vault Deployed Successfully!</h2>
              <p className="text-gray-300 mb-4">Your vault has been deployed to SEI testnet</p>
              
              <div className="bg-black/20 rounded-xl p-4 mb-4">
                <div className="text-sm text-gray-400 mb-1">Transaction Hash</div>
                <div className="font-mono text-blue-400 break-all">{deploymentHash}</div>
              </div>

              <div className="flex items-center justify-center gap-4">
                <button className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg transition-colors flex items-center gap-2">
                  <Code className="w-4 h-4" />
                  View on SeiTrace
                </button>
                <button 
                  onClick={() => window.location.href = '/vaults'}
                  className="bg-purple-500 hover:bg-purple-600 text-white px-6 py-2 rounded-lg transition-colors flex items-center gap-2"
                >
                  <TrendingUp className="w-4 h-4" />
                  Manage Vault
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DeployVaultPage;