"use client"

import { useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const workflowSteps = [
  { 
    id: 'deposit', 
    title: 'User Deposit', 
    description: 'Capital enters the protocol',
    icon: '💰',
    color: '#00f5d4'
  },
  { 
    id: 'analysis', 
    title: 'AI Analysis', 
    description: 'ElizaOS analyzes market conditions',
    icon: '🧠',
    color: '#9b5de5'
  },
  { 
    id: 'allocation', 
    title: 'Smart Allocation', 
    description: 'Funds distributed across strategies',
    icon: '⚡',
    color: '#ff206e'
  },
  { 
    id: 'optimization', 
    title: 'Continuous Optimization', 
    description: 'Real-time strategy adjustments',
    icon: '🔄',
    color: '#00f5d4'
  },
  { 
    id: 'returns', 
    title: 'Enhanced Returns', 
    description: 'Maximized yield with reduced risk',
    icon: '📈',
    color: '#9b5de5'
  }
];

export default function AIWorkflow() {
  const containerRef = useRef<HTMLDivElement>(null);
  const stepsRef = useRef<(HTMLDivElement | null)[]>([]);
  const connectorsRef = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    if (!containerRef.current) return;

    // Create timeline for workflow animation
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: containerRef.current,
        start: "top 70%",
        end: "bottom 30%",
        scrub: 1,
        onEnter: () => {
          // Animate steps in sequence
          stepsRef.current.forEach((step, index) => {
            if (step) {
              gsap.fromTo(step,
                { opacity: 0, scale: 0.5, y: 50 },
                { 
                  opacity: 1, 
                  scale: 1, 
                  y: 0,
                  duration: 0.6,
                  delay: index * 0.2,
                  ease: "back.out(1.7)"
                }
              );
            }
          });

          // Animate connectors after steps
          connectorsRef.current.forEach((connector, index) => {
            if (connector) {
              gsap.fromTo(connector,
                { scaleX: 0 },
                { 
                  scaleX: 1,
                  duration: 0.5,
                  delay: (index + 1) * 0.2 + 0.3,
                  ease: "power2.out"
                }
              );
            }
          });
        }
      }
    });

    return () => {
      ScrollTrigger.getAll().forEach(trigger => trigger.kill());
    };
  }, []);

  return (
    <div ref={containerRef} className="py-20 neural-grid">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4 holo-text">
            AI-Powered Liquidity Engine
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Watch how ElizaOS optimizes your capital in real-time across SEI's DeFi ecosystem
          </p>
        </div>

        {/* Workflow Steps */}
        <div className="relative py-12">
          <div className="flex flex-row items-center justify-center gap-12 overflow-x-auto pb-8 max-w-full px-8">
            {workflowSteps.map((step, index) => (
              <div key={step.id} className="flex flex-col items-center relative">
                {/* Step Card */}
                <Card
                  ref={el => { stepsRef.current[index] = el; }}
                  className="cursor-pointer group relative overflow-hidden transition-all duration-300"
                  style={{
                    width: '180px !important',
                    maxWidth: '180px !important',
                    minHeight: '160px !important',
                    maxHeight: '160px !important',
                    flexShrink: 0,
                    backdropFilter: 'blur(24px)',
                    WebkitBackdropFilter: 'blur(24px)',
                    border: '2px solid hsl(var(--primary) / 0.2)',
                    background: 'hsl(var(--card) / 0.8)',
                    borderRadius: '12px',
                    padding: '0.75rem !important',
                    boxShadow: '0 8px 32px hsl(var(--primary) / 0.15), inset 0 1px 0 hsl(var(--border) / 0.4)',
                    textAlign: 'center'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'hsl(var(--primary) / 0.4)';
                    e.currentTarget.style.boxShadow = '0 20px 60px hsl(var(--primary) / 0.2), inset 0 1px 0 hsl(var(--border) / 0.5)';
                    e.currentTarget.style.transform = 'scale(1.05)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'hsl(var(--primary) / 0.2)';
                    e.currentTarget.style.boxShadow = '0 8px 32px hsl(var(--primary) / 0.15), inset 0 1px 0 hsl(var(--border) / 0.4)';
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                >
                  {/* Animated Background Effects */}
                  <div className="absolute inset-0 opacity-10 transition-opacity duration-300 group-hover:opacity-20">
                    <div 
                      className="absolute inset-0"
                      style={{
                        background: `linear-gradient(45deg, ${step.color}20, transparent)`
                      }}
                    />
                  </div>
                  
                  {/* Data Streams */}
                  <div 
                    className="absolute top-0 left-1/4 w-px h-24 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    style={{
                      background: `linear-gradient(to bottom, transparent 0%, ${step.color} 50%, transparent 100%)`,
                      animation: 'streamFlow 2s linear infinite'
                    }}
                  />
                  <div 
                    className="absolute top-0 right-1/4 w-px h-24 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    style={{
                      background: `linear-gradient(to bottom, transparent 0%, ${step.color} 50%, transparent 100%)`,
                      animation: 'streamFlow 2s linear infinite 0.5s'
                    }}
                  />
                  
                  <div 
                    className="text-4xl mb-4 filter drop-shadow-lg relative z-10"
                    style={{ filter: `drop-shadow(0 0 10px ${step.color})` }}
                  >
                    {step.icon}
                  </div>
                  <h3 className="text-lg font-bold mb-2 text-foreground relative z-10">
                    {step.title}
                  </h3>
                  <p className="text-sm text-muted-foreground relative z-10">
                    {step.description}
                  </p>
                  
                  {/* Pulsing Indicator */}
                  <div 
                    className="absolute -top-2 -right-2 w-4 h-4 rounded-full animate-pulse-glow"
                    style={{ backgroundColor: step.color }}
                  />
                </Card>

                {/* Enhanced Connector Arrow (hidden on last item) */}
                {index < workflowSteps.length - 1 && (
                  <div className="absolute -right-12 top-1/2 transform -translate-y-1/2 z-20">
                    <div
                      ref={el => { connectorsRef.current[index] = el; }}
                      className="w-16 h-0.5 bg-gradient-to-r from-primary via-secondary to-primary origin-left opacity-70 shadow-lg"
                      style={{
                        boxShadow: '0 0 8px hsl(var(--primary) / 0.4), 0 0 16px hsl(var(--secondary) / 0.2)'
                      }}
                    />
                    <div className="absolute right-0 top-1/2 transform -translate-y-1/2 translate-x-1">
                      <div 
                        className="w-0 h-0 border-l-4 border-l-primary border-t-2 border-b-2 border-t-transparent border-b-transparent opacity-70"
                        style={{
                          filter: 'drop-shadow(0 0 4px hsl(var(--primary) / 0.6))'
                        }}
                      />
                    </div>
                    {/* Animated Flow Indicator */}
                    <div className="absolute top-1/2 left-0 w-2 h-2 bg-primary rounded-full transform -translate-y-1/2 animate-ping opacity-60" />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Central AI Character - Enhanced 3D Look */}
          <div className="mt-16 flex flex-col items-center">
            <div className="relative">
              <div className="w-40 h-40 rounded-full bg-gradient-to-br from-primary/30 via-secondary/20 to-accent/30 backdrop-blur-xl border-2 border-primary/40 flex items-center justify-center animate-float shadow-2xl">
                {/* Inner glow effect */}
                <div className="absolute inset-4 rounded-full bg-gradient-to-br from-primary/20 to-transparent blur-sm"></div>
                
                {/* AI Character */}
                <div className="relative z-10 text-6xl animate-pulse" style={{ filter: 'drop-shadow(0 0 20px hsl(var(--primary)))' }}>
                  🤖
                </div>
                
                {/* Rotating outer ring */}
                <div className="absolute inset-0 rounded-full border-2 border-primary/60 animate-spin" style={{ animationDuration: '4s' }} />
                
                {/* Counter-rotating inner ring */}
                <div className="absolute inset-6 rounded-full border border-secondary/60 animate-spin" style={{ animationDuration: '3s', animationDirection: 'reverse' }} />
                
                {/* Pulsing dots */}
                <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-primary rounded-full animate-ping"></div>
                <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-secondary rounded-full animate-ping" style={{ animationDelay: '0.5s' }}></div>
                <div className="absolute top-1/2 -left-2 transform -translate-y-1/2 w-2 h-2 bg-accent rounded-full animate-ping" style={{ animationDelay: '1s' }}></div>
                <div className="absolute top-1/2 -right-2 transform -translate-y-1/2 w-2 h-2 bg-primary rounded-full animate-ping" style={{ animationDelay: '1.5s' }}></div>
              </div>
            </div>
            
            {/* AI Description */}
            <div className="mt-6 text-center max-w-md">
              <h3 className="text-xl font-bold text-foreground mb-2">AI-Powered Optimization</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Our advanced AI continuously monitors market conditions, optimizes liquidity positions, and minimizes impermanent loss through intelligent rebalancing.
              </p>
            </div>
          </div>
        </div>

        {/* Section Divider */}
        <div className="mt-32 mb-16 flex items-center justify-center">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent max-w-xs"></div>
          <div className="mx-4 px-4 py-2 bg-card/50 backdrop-blur-sm border border-primary/20 rounded-full">
            <span className="text-sm text-primary font-medium">Performance Metrics</span>
          </div>
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent max-w-xs"></div>
        </div>

        {/* Performance Metrics */}
        <div className="max-w-5xl mx-auto px-6">
          <div className="flex justify-center items-stretch gap-12">
          {[
            { metric: '62%', label: 'Less Impermanent Loss', color: '#00f5d4' },
            { metric: '400ms', label: 'SEI Block Time', color: '#9b5de5' },
            { metric: '24/7', label: 'AI Monitoring', color: '#ff206e' }
          ].map((item, index) => (
            <Card 
              key={index} 
              className="cursor-pointer group relative overflow-hidden hover:scale-105 transition-all duration-300"
              style={{
                width: '280px',
                flex: '0 0 280px',
                backdropFilter: 'blur(24px)',
                WebkitBackdropFilter: 'blur(24px)',
                border: '2px solid hsl(var(--primary) / 0.2)',
                background: 'hsl(var(--card) / 0.8)',
                borderRadius: '12px',
                padding: '1.5rem',
                boxShadow: '0 8px 32px hsl(var(--primary) / 0.15), inset 0 1px 0 hsl(var(--border) / 0.4)',
                textAlign: 'center',
                minHeight: '140px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'hsl(var(--primary) / 0.4)';
                e.currentTarget.style.boxShadow = '0 20px 60px hsl(var(--primary) / 0.2), inset 0 1px 0 hsl(var(--border) / 0.5)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'hsl(var(--primary) / 0.2)';
                e.currentTarget.style.boxShadow = '0 8px 32px hsl(var(--primary) / 0.15), inset 0 1px 0 hsl(var(--border) / 0.4)';
              }}
            >
              {/* Background gradient effect */}
              <div 
                className="absolute inset-0 opacity-10 transition-opacity duration-500 group-hover:opacity-20"
                style={{
                  background: `linear-gradient(45deg, ${item.color}20, transparent)`
                }}
              />
              
              <div 
                className="text-2xl font-bold mb-1 relative z-10"
                style={{ 
                  color: item.color,
                  filter: `drop-shadow(0 0 8px ${item.color})`,
                  fontWeight: '800'
                }}
              >
                {item.metric}
              </div>
              <div className="text-sm text-muted-foreground relative z-10">{item.label}</div>
              
              {/* Pulsing indicator */}
              <div 
                className="absolute -top-2 -right-2 w-3 h-3 rounded-full animate-pulse-glow"
                style={{ backgroundColor: item.color }}
              />
            </Card>
          ))}
          </div>
        </div>
      </div>
    </div>
  );
}