'use client'

import React from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import Logo from './Logo';

const WalletConnectButton = dynamic(
  () => import('./WalletConnectButton').then(mod => ({ default: mod.WalletConnectButton })),
  { 
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center w-24 h-8 bg-secondary/20 animate-pulse rounded min-w-[120px] min-h-[32px]">
        <span className="text-sm text-muted-foreground">Loading...</span>
      </div>
    )
  }
);

interface NavigationProps {
  variant?: 'light' | 'dark' | 'transparent';
  className?: string;
  showWallet?: boolean;
  showLaunchApp?: boolean;
}

export function Navigation({ variant = 'transparent', className = '', showWallet = true, showLaunchApp = true }: NavigationProps) {
  const baseClasses = "fixed top-0 left-0 right-0 z-50 h-14 transition-all duration-300 m-0 p-0";
  
  const variantClasses = {
    light: "bg-white/95 backdrop-blur-md border-b border-gray-200",
    dark: "bg-background/95 backdrop-blur-md border-b border-border",
    transparent: "bg-transparent"
  };

  return (
    <nav 
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      style={{ 
        position: 'fixed', 
        height: '3.5rem',
        isolation: 'isolate',
        zIndex: 99999
      }}
    >
      <div className="simple-nav-container">
        {/* LEFT SIDE */}
        <div className="nav-left-simple">
          <Logo 
            variant="icon" 
            size={48} 
            className="flex-shrink-0"
          />
          <div className="nav-brand hidden sm:block">
            <div className="font-bold text-2xl text-foreground">SEI DLP</div>
            <div className="text-sm text-muted-foreground -mt-1">Dynamic Liquidity Protocol</div>
          </div>
        </div>

        {/* RIGHT SIDE */}
        <div className="nav-right-simple">
          {showLaunchApp && (
            <Link
              href="/vaults"
              className="btn-cyber"
            >
              <svg 
                className="w-4 h-4 flex-shrink-0" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span>Launch App</span>
            </Link>
          )}
          {showWallet && (
            <div className="wallet-container">
              <WalletConnectButton />
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navigation;
