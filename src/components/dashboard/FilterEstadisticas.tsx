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

interface FilterEstadisticasProps {
  periodoEstadisticas: string;
  setPeriodoEstadisticas: (value: string) => void;
  startEstadisticas: Date | null;
  endEstadisticas: Date | null;
  setStartEstadisticas: (date: Date | null) => void;
  setEndEstadisticas: (date: Date | null) => void;
  cajas?: { id: number; nombre: string }[];
  selectedCajaId?: string;
  setSelectedCajaId?: (id: string) => void;
}

const FilterEstadisticas: React.FC<FilterEstadisticasProps> = ({
  periodoEstadisticas,
  setPeriodoEstadisticas,
  startEstadisticas,
  endEstadisticas,
  setStartEstadisticas,
  setEndEstadisticas,
  cajas = [],
  selectedCajaId = '',
  setSelectedCajaId,
}) => {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className="flex items-center gap-2 px-3 py-2 rounded-md border hover:bg-muted transition text-sm font-medium"
          title="Filtros Estadísticas"
        >
          <Filter className="h-4 w-4" />
          Filtros
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[300px] transition-all duration-200 transform opacity-0 scale-95 data-[state=open]:opacity-100 data-[state=open]:scale-100"
        sideOffset={8}
      >
        <h3 className="font-semibold mb-2">Filtros Estadísticas</h3>
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">Período</label>
            <Select onValueChange={setPeriodoEstadisticas} value={periodoEstadisticas}>
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

          {periodoEstadisticas === 'rango' && (
            <>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium">Fecha inicial</label>
                <input
                  type="date"
                  className="border rounded-md px-3 py-2 bg-background"
                  value={startEstadisticas ? startEstadisticas.toISOString().split('T')[0] : ''}
                  onChange={(e) =>
                    setStartEstadisticas(e.target.value ? new Date(e.target.value) : null)
                  }
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium">Fecha final</label>
                <input
                  type="date"
                  className="border rounded-md px-3 py-2 bg-background"
                  value={endEstadisticas ? endEstadisticas.toISOString().split('T')[0] : ''}
                  onChange={(e) =>
                    setEndEstadisticas(e.target.value ? new Date(e.target.value) : null)
                  }
                />
              </div>
            </>
          )}

          {cajas.length > 0 && setSelectedCajaId && (
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium">Caja</label>
              <Select value={selectedCajaId} onValueChange={setSelectedCajaId}>
                <SelectTrigger className="w-full bg-background">
                  <SelectValue placeholder="Seleccionar caja" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {cajas.map((caja) => (
                    <SelectItem key={caja.id} value={caja.id.toString()}>
                      {caja.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default FilterEstadisticas;
