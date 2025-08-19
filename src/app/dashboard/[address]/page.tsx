"use client"

import CustomerVaultDashboard from '@/components/CustomerVaultDashboard';
import { useParams } from 'next/navigation';

const VaultPage = () => {
  const { address } = useParams();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white p-8">
      <div className="max-w-7xl mx-auto">
        <CustomerVaultDashboard
          vaultAddress={address as `0x${string}`}
          vaultABI={[]} // Pass the actual ABI here
        />
      </div>
    </div>
  );
};

export default VaultPage;