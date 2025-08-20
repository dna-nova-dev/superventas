import React from 'react';
import { formatCurrency } from '@/data/mockData';

interface RecentSaleCardProps {
  sale: {
    id: string | number;
    codigo: string;
    fecha: string;
    hora: string;
    total: number;
  };
}

export const RecentSaleCard: React.FC<RecentSaleCardProps> = ({ sale }) => {
  return (
    <div className="p-4 border rounded-lg bg-transparent shadow-sm hover:shadow-md transition-all">
      <div className="flex justify-between items-start mb-2">
        <div>
          <h3 className="font-medium">{sale.codigo}</h3>
          <p className="text-sm text-muted-foreground">
            {sale.fecha} - {sale.hora}
          </p>
        </div>
        <span className="font-semibold">{formatCurrency(sale.total)}</span>
      </div>
      <div className="flex items-center text-sm">
        <span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-2"></span>
        <span>Completada</span>
      </div>
    </div>
  );
};
