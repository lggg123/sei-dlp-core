import React, { useState } from 'react';
import Link from 'next/link';
import { useAccount, useReadContract, useWriteContract } from 'wagmi';
import { formatUnits, parseUnits } from 'viem';
import { Address, Abi } from 'viem';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

interface CustomerVaultDashboardProps {
  vaultAddress: Address;
  vaultABI: Abi;
}

const CustomerVaultDashboard: React.FC<CustomerVaultDashboardProps> = ({ vaultAddress, vaultABI }) => {
  const { address } = useAccount();
  const [depositAmount0, setDepositAmount0] = useState('');
  const [depositAmount1, setDepositAmount1] = useState('');
  const [withdrawShares, setWithdrawShares] = useState('');
  // Demo simulation flag - controlled by environment variable
  const [isDemoMode] = useState(process.env.NEXT_PUBLIC_DEMO_MODE === 'true');
  const [withdrawalStatus, setWithdrawalStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle');
  const [withdrawalHash, setWithdrawalHash] = useState<string | null>(null);

  // Read customer statistics
  const { data: customerStats } = useReadContract({
    address: vaultAddress,
    abi: vaultABI,
    functionName: 'getCustomerStats',
    args: [address],
    query: {
      enabled: !!address,
    },
  }) as { data: readonly [bigint, bigint, bigint, bigint, bigint, bigint] | undefined };

  // Read vault information
  const { data: vaultInfo } = useReadContract({
    address: vaultAddress,
    abi: vaultABI,
    functionName: 'getVaultInfo',
  }) as { data: {
    token0?: string;
    token1?: string;
    strategy?: string;
    totalValueLocked?: bigint;
    poolFee?: number;
    isActive?: boolean;
  } | undefined };

  // Contract write functions
  const { writeContract: deposit, isPending: isDepositing } = useWriteContract();
  const { writeContract: withdraw, isPending: isWithdrawing } = useWriteContract();

  // Parse customer stats if available
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [shares, shareValue, totalDeposited, totalWithdrawn, _depositTime, lockTimeRemaining] = customerStats || [];

  // Calculate metrics
  const unrealizedGains = shareValue && totalDeposited && totalWithdrawn 
    ? Number(formatUnits(shareValue, 18)) - Number(formatUnits(totalDeposited, 18)) + Number(formatUnits(totalWithdrawn, 18))
    : 0;

  const canWithdraw = lockTimeRemaining ? Number(lockTimeRemaining) === 0 : false;

  const handleDeposit = async (): Promise<void> => {
    if (!depositAmount0 || !depositAmount1) return;
    
    try {
      deposit({
        address: vaultAddress,
        abi: vaultABI,
        functionName: 'deposit',
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

  const handleWithdraw = async (): Promise<void> => {
    if (!withdrawShares) return;
    
    console.log('🏦 [CustomerVaultDashboard] Withdrawal initiated', {
      withdrawShares,
      isDemoMode,
      vaultAddress
    });

    // Reset withdrawal state
    setWithdrawalStatus('pending');
    setWithdrawalHash(null);
    
    try {
      if (isDemoMode) {
        // DEMO MODE: Simulate successful withdrawal
        console.log('🎭 [CustomerVaultDashboard] Demo mode: Simulating successful withdrawal');
        
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Generate fake transaction hash
        const fakeHash = `0x${Math.random().toString(16).substr(2, 64)}`;
        setWithdrawalHash(fakeHash);
        setWithdrawalStatus('success');
        
        console.log('🎉 [CustomerVaultDashboard] Demo withdrawal completed successfully!', {
          shares: withdrawShares,
          fakeHash
        });

        // Reset withdrawal amount after success
        setTimeout(() => {
          setWithdrawShares('');
          setWithdrawalStatus('idle');
          setWithdrawalHash(null);
        }, 5000);
        
        return;
      }

      // REAL MODE: Use actual blockchain transaction
      withdraw({
        address: vaultAddress,
        abi: vaultABI,
        functionName: 'withdraw',
        args: [
          parseUnits(withdrawShares, 18),
          address
        ]
      });
    } catch (error) {
      console.error('Withdrawal failed:', error);
      setWithdrawalStatus('error');
      
      // Reset error state after a delay
      setTimeout(() => {
        setWithdrawalStatus('idle');
      }, 5000);
    }
  };

  const formatTimeRemaining = (seconds: number | bigint | undefined): string => {
    if (!seconds || Number(seconds) <= 0) return 'Available';
    
    const secondsNum = Number(seconds);
    const hours = Math.floor(secondsNum / 3600);
    const minutes = Math.floor((secondsNum % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m remaining`;
    }
    return `${minutes}m remaining`;
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-xl relative">
        <Link href="/dashboard" passHref>
          <button className="absolute top-4 left-4 bg-white text-blue-600 px-3 py-1 rounded-lg text-sm font-semibold hover:bg-gray-200 transition-colors">
            &larr; Back to Dashboard
          </button>
        </Link>
        <h1 className="text-2xl font-bold mb-2 text-center">
          SEI DLP Vault Dashboard
          {isDemoMode && (
            <span className="ml-3 text-sm bg-green-500 text-white px-2 py-1 rounded-lg font-semibold">
              DEMO MODE
            </span>
          )}
        </h1>
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
              {canWithdraw ? 'You can withdraw your funds' : `Lock period: ${formatTimeRemaining(Number(lockTimeRemaining))}`}
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
          disabled={isWithdrawing || !withdrawShares || !canWithdraw || withdrawalStatus === 'pending'}
          className="w-full bg-red-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
        >
          {withdrawalStatus === 'pending' ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Processing Withdrawal...
            </>
          ) : withdrawalStatus === 'success' ? (
            <>
              <CheckCircle2 className="w-5 h-5" />
              Withdrawal Successful!
            </>
          ) : withdrawalStatus === 'error' ? (
            <>
              <AlertCircle className="w-5 h-5" />
              Withdrawal Failed
            </>
          ) : isWithdrawing ? (
            'Withdrawing...'
          ) : (
            'Withdraw Funds'
          )}
        </button>
        
        {/* Transaction Status */}
        {withdrawalStatus !== 'idle' && (
          <div className={`mt-3 p-3 rounded-lg ${
            withdrawalStatus === 'success' ? 'bg-green-50 border border-green-200' :
            withdrawalStatus === 'error' ? 'bg-red-50 border border-red-200' :
            'bg-blue-50 border border-blue-200'
          }`}>
            <div className="flex items-center gap-2">
              {withdrawalStatus === 'pending' && <Loader2 className="w-4 h-4 animate-spin text-blue-600" />}
              {withdrawalStatus === 'success' && <CheckCircle2 className="w-4 h-4 text-green-600" />}
              {withdrawalStatus === 'error' && <AlertCircle className="w-4 h-4 text-red-600" />}
              
              <span className={`text-sm font-medium ${
                withdrawalStatus === 'success' ? 'text-green-800' :
                withdrawalStatus === 'error' ? 'text-red-800' :
                'text-blue-800'
              }`}>
                {withdrawalStatus === 'pending' && 'Transaction is being processed...'}
                {withdrawalStatus === 'success' && `Withdrawal successful! ${withdrawShares} shares withdrawn.`}
                {withdrawalStatus === 'error' && 'Transaction failed. Please try again.'}
              </span>
            </div>
            
            {withdrawalHash && withdrawalStatus === 'success' && (
              <p className="text-xs text-green-600 mt-1 font-mono">
                Transaction Hash: {withdrawalHash.substring(0, 6)}...{withdrawalHash.substring(withdrawalHash.length - 4)}
              </p>
            )}
          </div>
        )}
        
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
