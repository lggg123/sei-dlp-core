'use client'

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import Logo from './Logo';
import { gsap } from 'gsap';
import { Menu, X } from 'lucide-react';

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
  const logoRef = useRef<HTMLDivElement>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const baseClasses = "fixed top-0 left-0 right-0 z-50 h-14 transition-all duration-300 m-0 p-0";
  
  const variantClasses = {
    light: "bg-white/95 backdrop-blur-md border-b border-gray-200",
    dark: "bg-background/95 backdrop-blur-md",
    transparent: "bg-transparent"
  };

  // GSAP Logo Animation - Professional breathe effect
  useEffect(() => {
    if (!logoRef.current) return;

    const logoElement = logoRef.current;
    
    // Subtle breathing effect - professional and calming
    const tl = gsap.timeline({ repeat: -1, yoyo: true });
    
    tl.to(logoElement, {
      scale: 1.05,
      filter: 'drop-shadow(0 0 12px rgba(155, 93, 229, 0.4))',
      duration: 3,
      ease: 'sine.inOut'
    });

    // Professional hover enhancement
    const hoverTl = gsap.timeline({ paused: true });
    hoverTl.to(logoElement, {
      scale: 1.1,
      filter: 'drop-shadow(0 0 20px rgba(155, 93, 229, 0.6))',
      duration: 0.3,
      ease: 'power2.out'
    });

    const handleMouseEnter = () => hoverTl.play();
    const handleMouseLeave = () => hoverTl.reverse();

    logoElement.addEventListener('mouseenter', handleMouseEnter);
    logoElement.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      tl.kill();
      hoverTl.kill();
      logoElement.removeEventListener('mouseenter', handleMouseEnter);
      logoElement.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

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
          <div 
            ref={logoRef}
            className="logo-animation-gsap"
            style={{
              transformStyle: 'preserve-3d'
            }}
          >
            <Logo 
              variant="icon" 
              size={48} 
              animated={false}
              className="flex-shrink-0"
            />
          </div>
          <div className="nav-brand hidden sm:block">
            <div 
              className="font-bold gradient-text"
              style={{ 
                fontSize: '2rem',
                lineHeight: '1.2',
                fontWeight: '800'
              }}
            >
              Yield Delta
            </div>
          </div>
        </div>

        {/* CENTER - App Navigation Links (only show when inside app) */}
        {!showLaunchApp && (
          <div className="nav-center-links hidden md:flex items-center space-x-6">
            <Link 
              href="/vaults"
              className="text-foreground hover:text-primary transition-colors no-underline font-medium"
            >
              Vaults
            </Link>
            <Link
              href="/market"
              className="text-foreground hover:text-primary transition-colors no-underline font-medium"
            >
              Market
            </Link>
            <Link
              href="/dashboard"
              className="text-foreground hover:text-primary transition-colors no-underline font-medium"
            >
              Portfolio
            </Link>
            <Link
              href="/portfolio/rebalance"
              className="text-foreground hover:text-primary transition-colors no-underline font-medium"
            >
              Rebalance
            </Link>
            <Link
              href="/vaults/deploy"
              className="text-foreground hover:text-primary transition-colors no-underline font-medium"
            >
              Deploy
            </Link>
          </div>
        )}

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
          
          {/* Mobile Menu Button (only show when inside app) */}
          {!showLaunchApp && (
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden text-foreground hover:text-primary ml-2"
              aria-label="Toggle mobile menu"
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          )}
        </div>
      </div>
      
      {/* Mobile Menu Overlay */}
      {!showLaunchApp && mobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-background/95 backdrop-blur-md border-b border-border shadow-lg">
          <div className="flex flex-col space-y-4 p-4">
            <Link 
              href="/vaults"
              className="text-foreground hover:text-primary transition-colors font-medium py-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              Vaults
            </Link>
            <Link
              href="/market"
              className="text-foreground hover:text-primary transition-colors font-medium py-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              Market
            </Link>
            <Link
              href="/dashboard"
              className="text-foreground hover:text-primary transition-colors font-medium py-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              Portfolio
            </Link>
            <Link
              href="/portfolio/rebalance"
              className="text-foreground hover:text-primary transition-colors font-medium py-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              Rebalance
            </Link>
            <Link
              href="/vaults/deploy"
              className="text-foreground hover:text-primary transition-colors font-medium py-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              Deploy Vault
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}

export default Navigation;
