import React from 'react';
import { Filter } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface FilterCuadreProps {
  periodFilter: string;
  setPeriodFilter: (value: string) => void;
  startDate: Date | null;
  endDate: Date | null;
  setStartDate: (date: Date | null) => void;
  setEndDate: (date: Date | null) => void;
  selectedCajaId: string;
  setSelectedCajaId: (value: string) => void;
  cajas: { id: number; nombre: string }[];
}

const FilterCuadre: React.FC<FilterCuadreProps> = ({
  periodFilter,
  setPeriodFilter,
  startDate,
  endDate,
  setStartDate,
  setEndDate,
  selectedCajaId,
  setSelectedCajaId,
  cajas,
}) => {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className="flex items-center gap-2 px-3 py-2 rounded-md border hover:bg-muted transition text-sm font-medium"
          title="Filtros Cuadre de Activos"
        >
          <Filter className="h-4 w-4" />
          Filtros
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[300px] transition-all duration-200 transform opacity-0 scale-95 data-[state=open]:opacity-100 data-[state=open]:scale-100"
        sideOffset={8}
      >
        <h3 className="font-semibold mb-2">Cuadre de Activos</h3>
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">Caja</label>
            <Select onValueChange={setSelectedCajaId} value={selectedCajaId}>
              <SelectTrigger className="w-full bg-background">
                <SelectValue placeholder="Seleccionar caja" />
              </SelectTrigger>
              <SelectContent>
                {cajas.map((caja) => (
                  <SelectItem key={caja.id} value={caja.id.toString()}>
                    {caja.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">Período</label>
            <Select onValueChange={setPeriodFilter} value={periodFilter}>
              <SelectTrigger className="w-full bg-background">
                <SelectValue placeholder="Seleccionar período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="hoy">Hoy</SelectItem>
                <SelectItem value="ayer">Ayer</SelectItem>
                <SelectItem value="7dias">Últimos 7 días</SelectItem>
                <SelectItem value="1mes">Último mes</SelectItem>
                <SelectItem value="rango">Rango personalizado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {periodFilter === 'rango' && (
            <>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium">Fecha inicial</label>
                <input
                  type="date"
                  className="border rounded-md px-3 py-2 bg-background"
                  value={startDate ? startDate.toISOString().split('T')[0] : ''}
                  onChange={(e) =>
                    setStartDate(e.target.value ? new Date(e.target.value) : null)
                  }
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium">Fecha final</label>
                <input
                  type="date"
                  className="border rounded-md px-3 py-2 bg-background"
                  value={endDate ? endDate.toISOString().split('T')[0] : ''}
                  onChange={(e) =>
                    setEndDate(e.target.value ? new Date(e.target.value) : null)
                  }
                />
              </div>
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default FilterCuadre;
