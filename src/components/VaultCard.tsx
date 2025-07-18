import { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import gsap from 'gsap';

interface VaultData {
  name: string;
  apy: number;
  tvl: string;
  risk: 'Low' | 'Medium' | 'High';
  color: string;
  description: string;
}

interface VaultCardProps {
  vault: VaultData;
  index: number;
}

export default function VaultCard({ vault, index }: VaultCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const apyRef = useRef<HTMLSpanElement>(null);
  const [displayApy, setDisplayApy] = useState(0);

  useEffect(() => {
    if (cardRef.current) {
      // Card entrance animation
      gsap.fromTo(cardRef.current,
        { 
          opacity: 0, 
          y: 50,
          scale: 0.9
        },
        { 
          opacity: 1, 
          y: 0,
          scale: 1,
          duration: 0.8, 
          delay: index * 0.2,
          ease: "back.out(1.7)"
        }
      );
    }

    // Animate APY counter
    gsap.to({ value: 0 }, {
      value: vault.apy,
      duration: 2,
      delay: index * 0.2 + 0.5,
      ease: "power2.out",
      onUpdate: function() {
        setDisplayApy(Number(this.targets()[0].value.toFixed(1)));
      }
    });
  }, [vault.apy, index]);

  const handleHover = () => {
    if (cardRef.current) {
      gsap.to(cardRef.current, {
        scale: 1.05,
        duration: 0.3,
        ease: "power2.out"
      });
    }
  };

  const handleLeave = () => {
    if (cardRef.current) {
      gsap.to(cardRef.current, {
        scale: 1,
        duration: 0.3,
        ease: "power2.out"
      });
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'Low': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'Medium': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'High': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  return (
    <Card 
      ref={cardRef}
      className="vault-card cursor-pointer group relative overflow-hidden"
      onMouseEnter={handleHover}
      onMouseLeave={handleLeave}
    >
      {/* Animated Background Gradient */}
      <div 
        className="absolute inset-0 opacity-10 group-hover:opacity-20 transition-opacity duration-500"
        style={{
          background: `linear-gradient(45deg, ${vault.color}20, transparent)`
        }}
      />
      
      {/* Data Streams */}
      <div className="absolute top-0 left-1/4 data-stream opacity-0 group-hover:opacity-100" />
      <div className="absolute top-0 right-1/4 data-stream opacity-0 group-hover:opacity-100" style={{ animationDelay: '0.5s' }} />
      
      <CardHeader className="relative z-10">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-bold text-foreground">
            {vault.name}
          </CardTitle>
          <Badge className={`${getRiskColor(vault.risk)} border`}>
            {vault.risk} Risk
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="relative z-10">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">APY</span>
            <span 
              ref={apyRef}
              className="text-2xl font-bold holo-text"
            >
              {displayApy}%
            </span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">TVL</span>
            <span className="font-semibold text-foreground">{vault.tvl}</span>
          </div>
          
          <p className="text-sm text-muted-foreground leading-relaxed">
            {vault.description}
          </p>
          
          {/* Vault Status Indicator */}
          <div className="flex items-center space-x-2">
            <div 
              className="w-2 h-2 rounded-full animate-pulse-glow"
              style={{ backgroundColor: vault.color }}
            />
            <span className="text-xs text-muted-foreground">Active & Optimizing</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}