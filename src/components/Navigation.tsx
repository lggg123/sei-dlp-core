'use client'

import React from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import Logo from './Logo';

const WalletConnectButton = dynamic(
  () => import('./WalletConnectButton').then(mod => ({ default: mod.WalletConnectButton })),
  { 
    ssr: false,
    loading: () => <div className="w-24 h-8 bg-secondary/20 animate-pulse rounded" />
  }
);

interface NavigationProps {
  variant?: 'light' | 'dark' | 'transparent';
  className?: string;
  showWallet?: boolean;
  showLaunchApp?: boolean;
}

export function Navigation({ variant = 'transparent', className = '', showWallet = true, showLaunchApp = true }: NavigationProps) {
  const baseClasses = "fixed top-0 left-0 right-0 z-50 transition-all duration-300";
  
  const variantClasses = {
    light: "bg-white/95 backdrop-blur-md border-b border-gray-200",
    dark: "bg-background/95 backdrop-blur-md border-b border-border",
    transparent: "bg-transparent"
  };

  return (
    <nav className={`${baseClasses} ${variantClasses[variant]} ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          
          {/* Logo and Brand */}
          <div className="flex items-center space-x-3">
            <Link href="/" className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
              <Logo variant="icon" size={32} className="flex-shrink-0" />
              <div className="hidden sm:block">
                <div className="font-bold text-lg text-foreground">SEI DLP</div>
                <div className="text-xs text-muted-foreground -mt-1">Dynamic Liquidity Protocol</div>
              </div>
            </Link>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-8">
            <Link 
              href="/vaults" 
              className="text-foreground hover:text-primary transition-colors"
            >
              Vaults
            </Link>
            <Link 
              href="/analytics" 
              className="text-foreground hover:text-primary transition-colors"
            >
              Analytics
            </Link>
            <Link 
              href="/docs" 
              className="text-foreground hover:text-primary transition-colors"
            >
              Docs
            </Link>
            <Link 
              href="/logo-showcase" 
              className="text-foreground hover:text-primary transition-colors"
            >
              Logo
            </Link>
          </div>

          {/* Right side - Launch App, Connect Wallet & Mobile Menu */}
          <div 
            className="flex items-center space-x-4"
            style={{ 
              marginLeft: 'auto',
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              justifyContent: 'flex-end'
            }}
          >
            {showLaunchApp && (
              <Link
                href="/vaults"
                className="flex items-center gap-2 px-6 py-2.5 text-sm font-semibold bg-gradient-to-r from-primary to-secondary text-black hover:from-primary/90 hover:to-secondary/90 transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-primary/25"
                style={{
                  background: 'linear-gradient(135deg, hsl(180 100% 48%), hsl(262 80% 60%)) !important',
                  color: 'hsl(216 100% 4%) !important',
                  borderRadius: '12px !important',
                  boxShadow: '0 4px 20px hsl(180 100% 48% / 0.3), inset 0 1px 0 rgba(255,255,255,0.2) !important',
                  border: 'none !important',
                  textDecoration: 'none !important',
                  display: 'flex !important',
                  alignItems: 'center !important',
                  gap: '0.5rem !important',
                  padding: '0.625rem 1.5rem !important',
                  fontSize: '0.875rem !important',
                  fontWeight: '600 !important',
                  transition: 'all 300ms ease-in-out !important'
                }}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Launch App
              </Link>
            )}
            {showWallet && <WalletConnectButton />}
            
            {/* Mobile Menu Button */}
            <button className="md:hidden text-foreground hover:text-primary ml-2">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navigation;
