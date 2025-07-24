import React, { useState, useEffect } from 'react';
import { useAccount, useContractRead, useContractWrite } from 'wagmi';
import { formatUnits, parseUnits } from 'viem';

const CustomerVaultDashboard = ({ vaultAddress, vaultABI }) => {
  const { address } = useAccount();
  const [depositAmount0, setDepositAmount0] = useState('');
  const [depositAmount1, setDepositAmount1] = useState('');
  const [withdrawShares, setWithdrawShares] = useState('');

  // Read customer statistics
  const { data: customerStats } = useContractRead({
    address: vaultAddress,
    abi: vaultABI,
    functionName: 'getCustomerStats',
    args: [address],
    enabled: !!address,
  });

  // Read vault information
  const { data: vaultInfo } = useContractRead({
    address: vaultAddress,
    abi: vaultABI,
    functionName: 'getVaultInfo',
  });

  // Contract write functions
  const { write: deposit, isLoading: isDepositing } = useContractWrite({
    address: vaultAddress,
    abi: vaultABI,
    functionName: 'deposit',
  });

  const { write: withdraw, isLoading: isWithdrawing } = useContractWrite({
    address: vaultAddress,
    abi: vaultABI,
    functionName: 'withdraw',
  });

  // Parse customer stats if available
  const [shares, shareValue, totalDeposited, totalWithdrawn, depositTime, lockTimeRemaining] = customerStats || [];

  // Calculate metrics
  const unrealizedGains = shareValue && totalDeposited && totalWithdrawn 
    ? Number(formatUnits(shareValue, 18)) - Number(formatUnits(totalDeposited, 18)) + Number(formatUnits(totalWithdrawn, 18))
    : 0;

  const canWithdraw = lockTimeRemaining ? Number(lockTimeRemaining) === 0 : false;

  const handleDeposit = async () => {
    if (!depositAmount0 || !depositAmount1) return;
    
    try {
      await deposit({
        args: [
          parseUnits(depositAmount0, 18),
          parseUnits(depositAmount1, 18),
          address
        ]
      });
    } catch (error) {
      console.error('Deposit failed:', error);
    }
  };

  const handleWithdraw = async () => {
    if (!withdrawShares) return;
    
    try {
      await withdraw({
        args: [
          parseUnits(withdrawShares, 18),
          address
        ]
      });
    } catch (error) {
      console.error('Withdrawal failed:', error);
    }
  };

  const formatTimeRemaining = (seconds) => {
    if (!seconds || seconds <= 0) return 'Available';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m remaining`;
    }
    return `${minutes}m remaining`;
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-xl">
        <h1 className="text-2xl font-bold mb-2">SEI DLP Vault Dashboard</h1>
        <p className="text-blue-100">Manage your AI-driven liquidity positions</p>
      </div>

      {/* Portfolio Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Your Shares</h3>
          <p className="text-3xl font-bold text-blue-600">
            {shares ? formatUnits(shares, 18) : '0'} SEIDLPE
          </p>
          <p className="text-sm text-gray-500 mt-1">
            Value: ${shareValue ? Number(formatUnits(shareValue, 18)).toFixed(2) : '0.00'}
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Total Deposited</h3>
          <p className="text-3xl font-bold text-green-600">
            ${totalDeposited ? Number(formatUnits(totalDeposited, 18)).toFixed(2) : '0.00'}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            Withdrawn: ${totalWithdrawn ? Number(formatUnits(totalWithdrawn, 18)).toFixed(2) : '0.00'}
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Unrealized Gains</h3>
          <p className={`text-3xl font-bold ${unrealizedGains >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {unrealizedGains >= 0 ? '+' : ''}${unrealizedGains.toFixed(2)}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            {unrealizedGains >= 0 ? 'Profit' : 'Loss'}
          </p>
        </div>
      </div>

      {/* Lock Status */}
      <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-semibold text-yellow-800">Withdrawal Status</h4>
            <p className="text-yellow-700">
              {canWithdraw ? 'You can withdraw your funds' : `Lock period: ${formatTimeRemaining(lockTimeRemaining)}`}
            </p>
          </div>
          <div className={`w-4 h-4 rounded-full ${canWithdraw ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
        </div>
      </div>

      {/* Deposit Section */}
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <h3 className="text-xl font-bold mb-4">Deposit Funds</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {vaultInfo?.token0 || 'Token0'} Amount
            </label>
            <input
              type="number"
              value={depositAmount0}
              onChange={(e) => setDepositAmount0(e.target.value)}
              placeholder="0.00"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {vaultInfo?.token1 || 'Token1'} Amount
            </label>
            <input
              type="number"
              value={depositAmount1}
              onChange={(e) => setDepositAmount1(e.target.value)}
              placeholder="0.00"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
        <button
          onClick={handleDeposit}
          disabled={isDepositing || !depositAmount0 || !depositAmount1}
          className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {isDepositing ? 'Depositing...' : 'Deposit Funds'}
        </button>
        <p className="text-sm text-gray-500 mt-2">
          Note: 24-hour minimum lock period applies to new deposits
        </p>
      </div>

      {/* Withdraw Section */}
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <h3 className="text-xl font-bold mb-4">Withdraw Funds</h3>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Shares to Withdraw
          </label>
          <input
            type="number"
            value={withdrawShares}
            onChange={(e) => setWithdrawShares(e.target.value)}
            placeholder="0.00"
            max={shares ? formatUnits(shares, 18) : '0'}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
          />
          <p className="text-sm text-gray-500 mt-1">
            Available: {shares ? formatUnits(shares, 18) : '0'} SEIDLPE
          </p>
        </div>
        <button
          onClick={handleWithdraw}
          disabled={isWithdrawing || !withdrawShares || !canWithdraw}
          className="w-full bg-red-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {isWithdrawing ? 'Withdrawing...' : 'Withdraw Funds'}
        </button>
        <p className="text-sm text-gray-500 mt-2">
          Note: 0.5% withdrawal fee applies
        </p>
      </div>

      {/* Vault Information */}
      <div className="bg-gray-50 p-6 rounded-lg">
        <h3 className="text-xl font-bold mb-4">Vault Information</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-gray-600">Strategy</p>
            <p className="font-semibold">{vaultInfo?.strategy || 'AI Dynamic Liquidity'}</p>
          </div>
          <div>
            <p className="text-gray-600">Total Value Locked</p>
            <p className="font-semibold">
              ${vaultInfo?.totalValueLocked ? Number(formatUnits(vaultInfo.totalValueLocked, 18)).toFixed(2) : '0.00'}
            </p>
          </div>
          <div>
            <p className="text-gray-600">Pool Fee</p>
            <p className="font-semibold">{vaultInfo?.poolFee ? (vaultInfo.poolFee / 10000) : 0.3}%</p>
          </div>
          <div>
            <p className="text-gray-600">Status</p>
            <p className="font-semibold text-green-600">
              {vaultInfo?.isActive ? 'Active' : 'Inactive'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerVaultDashboard;
