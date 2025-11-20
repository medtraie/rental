import React, { useEffect, useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { CircularProgress } from "@/components/ui/circular-progress";
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

const getColorFromTailwind = (bgClass: string): string => {
  const colorMap: Record<string, string> = {
    'bg-primary': 'hsl(var(--primary))',
    'bg-card-blue': 'hsl(var(--card-blue))',
    'bg-card-green': 'hsl(var(--card-green))',
    'bg-card-orange': 'hsl(var(--card-orange))',
    'bg-card-red': 'hsl(var(--card-red))',
  };
  return colorMap[bgClass] || 'hsl(var(--primary))';
};

interface AnimatedStatsCardProps {
  title: string;
  value: number;
  total: number;
  icon: LucideIcon;
  color: string;
  bgColor: string;
  textColor: string;
  delay?: number;
}

export const AnimatedStatsCard: React.FC<AnimatedStatsCardProps> = ({
  title,
  value,
  total,
  icon: Icon,
  color,
  bgColor,
  textColor,
  delay = 0,
}) => {
  const [animatedValue, setAnimatedValue] = useState(0);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      let current = 0;
      const increment = value / 30; // Animate over 30 steps
      const timer = setInterval(() => {
        current += increment;
        if (current >= value) {
          current = value;
          clearInterval(timer);
        }
        setAnimatedValue(Math.floor(current));
      }, 33); // ~30fps
      
      return () => clearInterval(timer);
    }, delay);
    
    return () => clearTimeout(timer);
  }, [value, delay]);

  const percentage = total > 0 ? (value / total) * 100 : 0;

  return (
    <Card className={cn("relative overflow-hidden transition-all duration-300 hover:shadow-lg border-border", bgColor)}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-muted-foreground mb-2">{title}</p>
            <div className="flex items-center gap-4">
              <CircularProgress
                value={percentage}
                max={100}
                size={60}
                strokeWidth={6}
                color={getColorFromTailwind(color)}
                className="shrink-0"
              >
                <div className="text-center">
                  <div className={cn("text-xl font-bold", textColor)}>
                    {animatedValue}
                  </div>
                </div>
              </CircularProgress>
              <div>
                <div className={cn("text-2xl font-bold mb-1", textColor)}>
                  {animatedValue}
                </div>
                <div className="text-xs text-muted-foreground">
                  sur {total}
                </div>
              </div>
            </div>
          </div>
          <div className={cn("p-3 rounded-full shrink-0", color)}>
            <Icon className="h-6 w-6 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};