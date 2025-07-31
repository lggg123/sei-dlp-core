import { Card, CardContent } from '@/components/ui/card';
import styles from './PerformanceCard.module.css';

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
  return (
    <Card className={`${styles.performanceCard} group relative overflow-hidden cursor-pointer transition-all duration-300 hover:scale-105`}>
      <CardContent className="p-6 text-center">
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