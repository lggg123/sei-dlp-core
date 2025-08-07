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
        <div className="flex justify-between items-center h-16 w-full relative">
          
          {/* Left side - Logo, Brand and Navigation Links */}
          <div className="flex items-center gap-8 z-10 flex-1">
            <Link href="/" className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
              <Logo variant="icon" size={48} className="flex-shrink-0" />
              <div className="hidden sm:block">
                <div className="font-bold text-2xl text-foreground">SEI DLP</div>
                <div className="text-sm text-muted-foreground -mt-1">Dynamic Liquidity Protocol</div>
              </div>
            </Link>

            {/* Navigation Links */}
            <div className="hidden md:flex items-center space-x-8">
              <Link 
                href="/vaults" 
                className="text-foreground hover:text-primary transition-colors"
                style={{ textDecoration: 'none' }}
              >
                Vaults
              </Link>
              <Link 
                href="/analytics" 
                className="text-foreground hover:text-primary transition-colors"
                style={{ textDecoration: 'none' }}
              >
                Analytics
              </Link>
              <Link 
                href="/docs" 
                className="text-foreground hover:text-primary transition-colors"
                style={{ textDecoration: 'none' }}
              >
                Docs
              </Link>
              <Link 
                href="/logo-showcase" 
                className="text-foreground hover:text-primary transition-colors"
                style={{ textDecoration: 'none' }}
              >
                Logo
              </Link>
            </div>
          </div>

          {/* Right side - Launch App, Connect Wallet & Mobile Menu */}
          <div className="flex items-center gap-4 z-20 flex-shrink-0 ml-auto">
            {showLaunchApp && (
              <Link
                href="/vaults"
                className="btn-cyber flex items-center gap-2 whitespace-nowrap"
              >
                <svg 
                  className="w-4 h-4 flex-shrink-0" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
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
