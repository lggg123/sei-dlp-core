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
        <div className="relative">
          <div className="flex flex-col lg:flex-row items-center justify-between space-y-8 lg:space-y-0 lg:space-x-4">
            {workflowSteps.map((step, index) => (
              <div key={step.id} className="flex flex-col items-center relative">
                {/* Step Card */}
                <Card
                  ref={el => { stepsRef.current[index] = el; }}
                  className="glass-card p-6 w-64 text-center group hover:scale-105 transition-all duration-300"
                >
                  <div 
                    className="text-4xl mb-4 filter drop-shadow-lg"
                    style={{ filter: `drop-shadow(0 0 10px ${step.color})` }}
                  >
                    {step.icon}
                  </div>
                  <h3 className="text-lg font-bold mb-2 text-foreground">
                    {step.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {step.description}
                  </p>
                  
                  {/* Pulsing Indicator */}
                  <div 
                    className="absolute -top-2 -right-2 w-4 h-4 rounded-full animate-pulse-glow"
                    style={{ backgroundColor: step.color }}
                  />
                </Card>

                {/* Connector Arrow (hidden on last item) */}
                {index < workflowSteps.length - 1 && (
                  <div className="hidden lg:block absolute -right-8 top-1/2 transform -translate-y-1/2">
                    <div
                      ref={el => { connectorsRef.current[index] = el; }}
                      className="w-8 h-px bg-gradient-to-r from-primary to-secondary origin-left"
                    />
                    <div className="absolute right-0 top-1/2 transform -translate-y-1/2 translate-x-1">
                      <div className="w-0 h-0 border-l-4 border-l-primary border-t-2 border-b-2 border-t-transparent border-b-transparent" />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Central AI Character */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 hidden lg:block">
            <div className="w-32 h-32 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 backdrop-blur-xl border border-primary/30 flex items-center justify-center animate-float">
              <div className="text-4xl animate-pulse">🤖</div>
              <div className="absolute inset-0 rounded-full border-2 border-primary/50 animate-spin" style={{ animationDuration: '3s' }} />
            </div>
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { metric: '62%', label: 'Less Impermanent Loss', color: '#00f5d4' },
            { metric: '400ms', label: 'SEI Block Time', color: '#9b5de5' },
            { metric: '24/7', label: 'AI Monitoring', color: '#ff206e' }
          ].map((item, index) => (
            <Card key={index} className="glass-card p-6 text-center">
              <div 
                className="text-3xl font-bold mb-2"
                style={{ color: item.color }}
              >
                {item.metric}
              </div>
              <div className="text-muted-foreground">{item.label}</div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}