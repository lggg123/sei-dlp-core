import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import CustomerVaultDashboard from '../CustomerVaultDashboard';

const mockVaultAddress = '0x1234567890123456789012345678901234567890';
import { Abi } from 'viem';

const mockVaultABI: Abi = [
  {
    type: 'function',
    name: 'getCustomerStats',
    inputs: [{ name: 'user', type: 'address', internalType: 'address' }],
    outputs: [
      { name: 'shares', type: 'uint256', internalType: 'uint256' },
      { name: 'shareValue', type: 'uint256', internalType: 'uint256' },
      { name: 'totalDeposited', type: 'uint256', internalType: 'uint256' },
      { name: 'totalWithdrawn', type: 'uint256', internalType: 'uint256' },
      { name: 'depositTime', type: 'uint256', internalType: 'uint256' },
      { name: 'lockTimeRemaining', type: 'uint256', internalType: 'uint256' }
    ],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'getVaultInfo',
    inputs: [],
    outputs: [
        {
            type: 'tuple',
            name: 'info',
            components: [
                { name: 'token0', type: 'address', internalType: 'address' },
                { name: 'token1', type: 'address', internalType: 'address' },
                { name: 'strategy', type: 'string', internalType: 'string' },
                { name: 'totalValueLocked', type: 'uint256', internalType: 'uint256' },
                { name: 'poolFee', type: 'uint24', internalType: 'uint24' },
                { name: 'isActive', type: 'bool', internalType: 'bool' }
            ]
        }
    ],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'deposit',
    inputs: [
      { name: 'amount0', type: 'uint256', internalType: 'uint256' },
      { name: 'amount1', type: 'uint256', internalType: 'uint256' },
      { name: 'to', type: 'address', internalType: 'address' }
    ],
    outputs: [],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    name: 'withdraw',
    inputs: [
      { name: 'shares', type: 'uint256', internalType: 'uint256' },
      { name: 'to', type: 'address', internalType: 'address' }
    ],
    outputs: [],
    stateMutability: 'nonpayable'
  }
];

// Mock wagmi hooks
const mockWriteContract = jest.fn();
const mockUseReadContract = jest.fn();

jest.mock('wagmi', () => ({
  useAccount: () => ({ address: '0x742d35Cc6670C02fb3B5B3D7a0c5cC7b5e5a5A5A' }),
  useReadContract: () => mockUseReadContract(),
  useWriteContract: () => ({ 
    writeContract: mockWriteContract, 
    isPending: false 
  }),
}));

describe('CustomerVaultDashboard', () => {
  beforeEach(() => {
    mockWriteContract.mockClear();
    mockUseReadContract.mockImplementation(() => {
      // Default return for all contract reads
      return { data: null };
    });
  });

  describe('Basic Rendering', () => {
    beforeEach(() => {
      mockUseReadContract.mockImplementation(() => {
        return {
          data: {
            token0: 'SEI',
            token1: 'USDC',
            strategy: 'Concentrated Liquidity',
            totalValueLocked: BigInt('1000000000000000000000'), // 1000 tokens
            poolFee: 3000,
            isActive: true
          }
        };
      });
    });

    it('renders the dashboard with vault info', () => {
      render(<CustomerVaultDashboard vaultAddress={mockVaultAddress} vaultABI={mockVaultABI} />);
      
      expect(screen.getByText('SEI DLP Vault Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Your Shares')).toBeInTheDocument();
      expect(screen.getByText('Share Value')).toBeInTheDocument();
      expect(screen.getByText('Total Deposited')).toBeInTheDocument();
    });
  });

  describe('Deposit Functionality', () => {
    beforeEach(() => {
      mockUseReadContract.mockImplementation(() => {
        return {
          data: {
            token0: 'SEI',
            token1: 'USDC',
            strategy: 'Concentrated Liquidity',
            totalValueLocked: BigInt('1000000000000000000000'),
            poolFee: 3000,
            isActive: true
          }
        };
      });
    });

    it('renders deposit form', () => {
      render(<CustomerVaultDashboard vaultAddress={mockVaultAddress} vaultABI={mockVaultABI} />);
      
      expect(screen.getByText('Deposit Tokens')).toBeInTheDocument();
      expect(screen.getByLabelText(/Token 0 Amount/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Token 1 Amount/)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /deposit/i })).toBeInTheDocument();
    });

    it('handles deposit input changes', () => {
      render(<CustomerVaultDashboard vaultAddress={mockVaultAddress} vaultABI={mockVaultABI} />);
      
      const token0Input = screen.getByLabelText(/Token 0 Amount/);
      const token1Input = screen.getByLabelText(/Token 1 Amount/);
      
      fireEvent.change(token0Input, { target: { value: '100' } });
      fireEvent.change(token1Input, { target: { value: '200' } });
      
      expect(token0Input).toHaveValue('100');
      expect(token1Input).toHaveValue('200');
    });

    it('calls deposit function when form is submitted', async () => {
      render(<CustomerVaultDashboard vaultAddress={mockVaultAddress} vaultABI={mockVaultABI} />);
      
      const token0Input = screen.getByLabelText(/Token 0 Amount/);
      const token1Input = screen.getByLabelText(/Token 1 Amount/);
      const depositButton = screen.getByRole('button', { name: /deposit/i });
      
      fireEvent.change(token0Input, { target: { value: '100' } });
      fireEvent.change(token1Input, { target: { value: '200' } });
      fireEvent.click(depositButton);
      
      await waitFor(() => {
        expect(mockWriteContract).toHaveBeenCalledWith({
          address: mockVaultAddress,
          abi: mockVaultABI,
          functionName: 'deposit',
          args: [
            BigInt('100000000000000000000'), // 100 * 10^18
            BigInt('200000000000000000000'), // 200 * 10^18
            '0x742d35Cc6670C02fb3B5B3D7a0c5cC7b5e5a5A5A'
          ]
        });
      });
    });

    it('does not call deposit with empty amounts', async () => {
      render(<CustomerVaultDashboard vaultAddress={mockVaultAddress} vaultABI={mockVaultABI} />);
      
      const depositButton = screen.getByRole('button', { name: /deposit/i });
      fireEvent.click(depositButton);
      
      await waitFor(() => {
        expect(mockWriteContract).not.toHaveBeenCalled();
      });
    });

    it('does not call deposit with only one amount filled', async () => {
      render(<CustomerVaultDashboard vaultAddress={mockVaultAddress} vaultABI={mockVaultABI} />);
      
      const token0Input = screen.getByLabelText(/Token 0 Amount/);
      const depositButton = screen.getByRole('button', { name: /deposit/i });
      
      fireEvent.change(token0Input, { target: { value: '100' } });
      fireEvent.click(depositButton);
      
      await waitFor(() => {
        expect(mockWriteContract).not.toHaveBeenCalled();
      });
    });
  });

  describe('Withdrawal Functionality', () => {
    beforeEach(() => {
      mockUseReadContract.mockImplementation(() => {
        return {
          data: [
            BigInt('1000000000000000000000'), // shares: 1000
            BigInt('1100000000000000000000'), // shareValue: 1100 
            BigInt('1000000000000000000000'), // totalDeposited: 1000
            BigInt('0'),                      // totalWithdrawn: 0
            BigInt('1672531200'),            // depositTime
            BigInt('0')                      // lockTimeRemaining: 0 (can withdraw)
          ]
        };
      });
    });

    it('renders withdrawal form when user has shares', () => {
      render(<CustomerVaultDashboard vaultAddress={mockVaultAddress} vaultABI={mockVaultABI} />);
      
      expect(screen.getByText('Withdraw Shares')).toBeInTheDocument();
      expect(screen.getByLabelText(/Shares to Withdraw/)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /withdraw/i })).toBeInTheDocument();
    });

    it('handles withdrawal input changes', () => {
      render(<CustomerVaultDashboard vaultAddress={mockVaultAddress} vaultABI={mockVaultABI} />);
      
      const withdrawInput = screen.getByLabelText(/Shares to Withdraw/);
      fireEvent.change(withdrawInput, { target: { value: '500' } });
      
      expect(withdrawInput).toHaveValue('500');
    });

    it('calls withdraw function when form is submitted', async () => {
      render(<CustomerVaultDashboard vaultAddress={mockVaultAddress} vaultABI={mockVaultABI} />);
      
      const withdrawInput = screen.getByLabelText(/Shares to Withdraw/);
      const withdrawButton = screen.getByRole('button', { name: /withdraw/i });
      
      fireEvent.change(withdrawInput, { target: { value: '500' } });
      fireEvent.click(withdrawButton);
      
      await waitFor(() => {
        expect(mockWriteContract).toHaveBeenCalledWith({
          address: mockVaultAddress,
          abi: mockVaultABI,
          functionName: 'withdraw',
          args: [
            BigInt('500000000000000000000'), // 500 * 10^18
            '0x742d35Cc6670C02fb3B5B3D7a0c5cC7b5e5a5A5A'
          ]
        });
      });
    });

    it('does not call withdraw with empty shares', async () => {
      render(<CustomerVaultDashboard vaultAddress={mockVaultAddress} vaultABI={mockVaultABI} />);
      
      const withdrawButton = screen.getByRole('button', { name: /withdraw/i });
      fireEvent.click(withdrawButton);
      
      await waitFor(() => {
        expect(mockWriteContract).not.toHaveBeenCalled();
      });
    });
  });

  describe('Lock Time Functionality', () => {
    it('shows withdrawal disabled when tokens are locked', () => {
      mockUseReadContract.mockImplementation(() => {
        return {
          data: [
            BigInt('1000000000000000000000'), // shares: 1000
            BigInt('1100000000000000000000'), // shareValue: 1100 
            BigInt('1000000000000000000000'), // totalDeposited: 1000
            BigInt('0'),                      // totalWithdrawn: 0
            BigInt('1672531200'),            // depositTime
            BigInt('3600')                   // lockTimeRemaining: 1 hour
          ]
        };
      });

      render(<CustomerVaultDashboard vaultAddress={mockVaultAddress} vaultABI={mockVaultABI} />);
      
      const withdrawButton = screen.getByRole('button', { name: /withdraw/i });
      expect(withdrawButton).toBeDisabled();
    });

    it('shows time remaining when tokens are locked', () => {
      mockUseReadContract.mockImplementation(() => {
        return {
          data: [
            BigInt('1000000000000000000000'), // shares
            BigInt('1100000000000000000000'), // shareValue
            BigInt('1000000000000000000000'), // totalDeposited
            BigInt('0'),                      // totalWithdrawn
            BigInt('1672531200'),            // depositTime
            BigInt('3661')                   // lockTimeRemaining: 1 hour 1 minute 1 second
          ]
        };
      });

      render(<CustomerVaultDashboard vaultAddress={mockVaultAddress} vaultABI={mockVaultABI} />);
      
      expect(screen.getByText(/1h 1m/)).toBeInTheDocument();
    });
  });

  describe('Metrics Display', () => {
    beforeEach(() => {
      mockUseReadContract.mockImplementation(() => {
        return {
          data: [
            BigInt('1000000000000000000000'), // shares: 1000
            BigInt('1100000000000000000000'), // shareValue: 1100 (100 profit)
            BigInt('1000000000000000000000'), // totalDeposited: 1000
            BigInt('0'),                      // totalWithdrawn: 0
            BigInt('1672531200'),            // depositTime
            BigInt('0')                      // lockTimeRemaining: 0
          ]
        };
      });
    });

    it('displays user metrics correctly', () => {
      render(<CustomerVaultDashboard vaultAddress={mockVaultAddress} vaultABI={mockVaultABI} />);
      
      expect(screen.getByText('1000.00')).toBeInTheDocument(); // shares
      expect(screen.getByText('1100.00')).toBeInTheDocument(); // share value
      expect(screen.getByText('100.00')).toBeInTheDocument();  // unrealized gains
    });

    it('shows positive gains in green styling', () => {
      render(<CustomerVaultDashboard vaultAddress={mockVaultAddress} vaultABI={mockVaultABI} />);
      
      const gainsElement = screen.getByText('100.00');
      expect(gainsElement).toHaveClass('text-green-600');
    });
  });

  describe('Error Handling', () => {
    it('handles missing customer stats gracefully', () => {
      mockUseReadContract.mockImplementation(() => {
        return { data: null };
      });

      render(<CustomerVaultDashboard vaultAddress={mockVaultAddress} vaultABI={mockVaultABI} />);
      
      expect(screen.getByText('SEI DLP Vault Dashboard')).toBeInTheDocument();
      expect(screen.getByText('0.00')).toBeInTheDocument(); // Default values
    });

    it('handles deposit errors gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      mockWriteContract.mockRejectedValue(new Error('Transaction failed'));

      render(<CustomerVaultDashboard vaultAddress={mockVaultAddress} vaultABI={mockVaultABI} />);
      
      const token0Input = screen.getByLabelText(/Token 0 Amount/);
      const token1Input = screen.getByLabelText(/Token 1 Amount/);
      const depositButton = screen.getByRole('button', { name: /deposit/i });
      
      fireEvent.change(token0Input, { target: { value: '100' } });
      fireEvent.change(token1Input, { target: { value: '200' } });
      fireEvent.click(depositButton);
      
      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Deposit failed:', expect.any(Error));
      });

      consoleSpy.mockRestore();
    });
  });
});