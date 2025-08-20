import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface StatCardProps {
  icon: React.ElementType;
  title: string;
  value: string | number;
  trend: 'up' | 'down';
  trendValue: string;
}

export const StatCard: React.FC<StatCardProps> = ({ icon: Icon, title, value, trend, trendValue }) => (
  <div className="bg-transparent rounded-xl shadow-sm border p-6 transition-all animate-scale-in card-hover">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm font-medium text-muted-foreground mb-1">{title}</p>
        <h3 className="text-2xl font-bold">{value}</h3>
        <div className="flex items-center mt-2">
          {trend === "up" ? (
            <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
          ) : (
            <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
          )}
          <span className={trend === "up" ? "text-green-500" : "text-red-500"}>
            {trendValue}
          </span>
        </div>
      </div>
      <div className="p-3 rounded-full bg-primary/10">
        <Icon className="h-6 w-6 text-primary" />
      </div>
    </div>
  </div>
);
