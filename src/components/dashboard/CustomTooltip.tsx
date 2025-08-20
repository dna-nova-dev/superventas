import React from 'react';
import { formatCurrency } from '@/data/mockData';

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
}

export const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 border shadow-sm rounded-md">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-sm text-blue-600">{formatCurrency(payload[0].value)}</p>
      </div>
    );
  }
  return null;
};
