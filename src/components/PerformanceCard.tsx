"use client"

import { Card, CardContent } from '@/components/ui/card';
import styles from './PerformanceCard.module.css';
import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { TrendingUp, DollarSign, Shield, Activity } from 'lucide-react';

interface PerformanceCardProps {
  metric: string;
  description: string;
  comparison: string;
  color: string;
  positive?: boolean;
}

export default function PerformanceCard({ 
  metric, 
  description, 
  comparison, 
  color, 
  positive = true 
}: PerformanceCardProps) {
  const iconRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (iconRef.current) {
      // 3D floating animation
      gsap.to(iconRef.current, {
        y: -10,
        rotationX: 15,
        rotationY: 10,
        duration: 2,
        repeat: -1,
        yoyo: true,
        ease: "power2.inOut"
      });
    }

    if (cardRef.current) {
      // Entrance animation
      gsap.fromTo(cardRef.current, 
        { 
          opacity: 0, 
          y: 30,
          rotationX: -15
        },
        { 
          opacity: 1, 
          y: 0,
          rotationX: 0,
          duration: 0.8,
          ease: "back.out(1.7)"
        }
      );
    }
  }, []);

  const getIcon = () => {
    if (description.toLowerCase().includes('apy') || description.toLowerCase().includes('trend')) {
      return <TrendingUp size={48} />;
    } else if (description.toLowerCase().includes('value') || description.toLowerCase().includes('tvl')) {
      return <DollarSign size={48} />;
    } else if (description.toLowerCase().includes('loss') || description.toLowerCase().includes('security')) {
      return <Shield size={48} />;
    } else {
      return <Activity size={48} />;
    }
  };

  return (
    <Card 
      ref={cardRef}
      className={`${styles.performanceCard} group relative overflow-hidden cursor-pointer transition-all duration-300 hover:scale-105`}
      style={{ 
        perspective: '1000px !important',
        minHeight: '200px !important',
        width: '100% !important',
        display: 'flex !important',
        flexDirection: 'column !important',
        backdropFilter: 'blur(24px) !important',
        WebkitBackdropFilter: 'blur(24px) !important',
        border: '2px solid hsl(var(--primary) / 0.3) !important',
        background: 'hsl(var(--card) / 0.9) !important',
        borderRadius: '12px !important',
        boxShadow: '0 8px 32px hsl(var(--primary) / 0.2), inset 0 1px 0 hsl(var(--border) / 0.5) !important',
        transition: 'all 300ms ease-in-out !important'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'hsl(var(--primary) / 0.5)';
        e.currentTarget.style.boxShadow = '0 20px 60px hsl(var(--primary) / 0.3), inset 0 1px 0 hsl(var(--border) / 0.6)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'hsl(var(--primary) / 0.3)';
        e.currentTarget.style.boxShadow = '0 8px 32px hsl(var(--primary) / 0.2), inset 0 1px 0 hsl(var(--border) / 0.5)';
      }}
    >
      <CardContent 
        className="p-6 text-center h-full flex flex-col justify-center"
        style={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          marginTop: '20px',
          paddingTop: '20px'
        }}
      >
        {/* 3D Animated Icon */}
        <div 
          ref={iconRef}
          className="mb-4 flex justify-center"
          style={{
            transformStyle: 'preserve-3d',
            filter: `drop-shadow(0 4px 8px ${color}40)`
          }}
        >
          <div style={{ color: color }}>
            {getIcon()}
          </div>
        </div>
        
        <div 
          className={`${styles.metric} text-4xl font-bold mb-4 transition-all duration-300`}
          style={{ 
            color: `${color} !important`,
            filter: `drop-shadow(0 0 12px ${color}) !important`,
            fontSize: '3rem !important',
            fontWeight: '800 !important',
            lineHeight: '1 !important',
            marginBottom: '1rem !important',
            textAlign: 'center !important'
          }}
        >
          {metric}
        </div>
        <div 
          className={`${styles.description} text-lg font-semibold mb-2 text-foreground`}
          style={{
            fontSize: '1.25rem !important',
            fontWeight: '600 !important',
            lineHeight: '1.3 !important',
            marginBottom: '0.75rem !important',
            color: 'hsl(var(--foreground)) !important',
            textAlign: 'center !important'
          }}
        >
          {description}
        </div>
        <div 
          className={`${styles.comparison} text-sm text-muted-foreground mb-4`}
          style={{
            fontSize: '1rem !important',
            lineHeight: '1.4 !important',
            opacity: '0.9 !important',
            marginBottom: '1rem !important',
            color: 'hsl(var(--muted-foreground)) !important',
            textAlign: 'center !important'
          }}
        >
          {comparison}
        </div>
        
        <div 
          className={`${styles.statusRow} flex items-center justify-center gap-2`}
          style={{
            marginTop: 'auto !important',
            display: 'flex !important',
            alignItems: 'center !important',
            justifyContent: 'center !important',
            gap: '0.5rem !important'
          }}
        >
          <div 
            className={`${styles.statusIndicator} w-2 h-2 rounded-full animate-pulse`}
            style={{ 
              backgroundColor: `${color} !important`,
              width: '8px !important',
              height: '8px !important',
              borderRadius: '50% !important',
              flexShrink: '0 !important',
              animation: 'pulseGlow 2s ease-in-out infinite !important'
            }}
          />
          <span 
            className="text-xs text-muted-foreground"
            style={{
              fontSize: '0.75rem !important',
              color: 'hsl(var(--muted-foreground)) !important'
            }}
          >
            Active
          </span>
        </div>
      </CardContent>
    </Card>
  );
}