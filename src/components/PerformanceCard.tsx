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
      return <TrendingUp size={32} />;
    } else if (description.toLowerCase().includes('value') || description.toLowerCase().includes('tvl')) {
      return <DollarSign size={32} />;
    } else if (description.toLowerCase().includes('loss') || description.toLowerCase().includes('security')) {
      return <Shield size={32} />;
    } else {
      return <Activity size={32} />;
    }
  };

  return (
    <Card 
      ref={cardRef}
      className={`${styles.performanceCard} group relative overflow-hidden cursor-pointer transition-all duration-300 hover:scale-105`}
      style={{ perspective: '1000px' }}
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
            color: color,
            filter: `drop-shadow(0 0 12px ${color})`
          }}
        >
          {metric}
        </div>
        <div className={`${styles.description} text-lg font-semibold mb-2 text-foreground`}>
          {description}
        </div>
        <div className={`${styles.comparison} text-sm text-muted-foreground mb-4`}>
          {comparison}
        </div>
        
        <div className={`${styles.statusRow} flex items-center justify-center gap-2`}>
          <div 
            className={`${styles.statusIndicator} w-2 h-2 rounded-full animate-pulse`}
            style={{ backgroundColor: color }}
          />
          <span className="text-xs text-muted-foreground">Active</span>
        </div>
      </CardContent>
    </Card>
  );
}