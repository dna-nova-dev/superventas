import React, { useState, useEffect } from 'react';
import { DndContext, closestCenter } from '@dnd-kit/core';
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { motion } from 'framer-motion';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { SlidersHorizontal, RefreshCw, EyeOff, BarChart3, Package, Users, ShoppingCart, Wallet } from 'lucide-react';
import { StatCard } from './StatCard';
import { formatCurrency } from '@/data/mockData';

interface WidgetConfig {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  enabled: boolean;
}

interface WidgetGridProps {
  storageKey: string;
  statsData?: any;
  headerButtons?: React.ReactNode;
}

const GRID_COLS = 16;
const GRID_ROWS = 3;
const CELL_SIZE = 110;

// --- Sistema de slots: cada widget define su tamaño en la grilla ---
// Analiza el tipo de widget y asigna tamaño adecuado según diseño visual
const widgetSizes: Record<string, {w: number, h: number}> = {
  ventas: { w: 3, h: 2 },
  productos: { w: 3, h: 2 },
  clientes: { w: 3, h: 2 },
  cajas: { w: 3, h: 2 },
  gastos: { w: 3, h: 2 },
  grafica: { w: 3, h: 2 },
  recientes: { w: 3, h: 2 },
  // ...agrega más ids según tus widgets reales
};

function getWidgetSize(id: string): {w: number, h: number} {
  return widgetSizes[id] || {w: 1, h: 1};
}

// --- Algoritmo de ordenamiento robusto: acomoda widgets por slots ocupados ---
function orderWidgetsBySlots(widgets: {id: string}[]): WidgetConfig[] {
  const layout: WidgetConfig[] = [];
  // Creamos una matriz para marcar slots ocupados
  const grid: (string|null)[][] = Array.from({length: GRID_ROWS}, () => Array(GRID_COLS).fill(null));

  for (const w of widgets) {
    const size = getWidgetSize(w.id);
    // Busca el primer hueco libre donde quepa el widget
    outer: for (let y = 0; y <= GRID_ROWS - size.h; y++) {
      for (let x = 0; x <= GRID_COLS - size.w; x++) {
        // ¿Cabe aquí?
        let fits = true;
        for (let dy = 0; dy < size.h; dy++) {
          for (let dx = 0; dx < size.w; dx++) {
            if (grid[y+dy][x+dx]) {
              fits = false;
              break;
            }
          }
          if (!fits) break;
        }
        if (fits) {
          // Marca slots ocupados
          for (let dy = 0; dy < size.h; dy++) {
            for (let dx = 0; dx < size.w; dx++) {
              grid[y+dy][x+dx] = w.id;
            }
          }
          layout.push({
            id: w.id,
            x,
            y,
            w: size.w,
            h: size.h,
            enabled: true
          });
          break outer;
        }
      }
    }
  }
  return layout;
}

// --- Algoritmo random que respeta slots ---
function randomizeLayoutBySlots(widgets: {id: string}[]): WidgetConfig[] {
  const shuffled = [...widgets].sort(() => Math.random() - 0.5);
  return orderWidgetsBySlots(shuffled);
}

// Widgets core configurables
const defaultWidgets = [
  { id: 'ventas', label: 'Ventas', enabled: true },
  { id: 'productos', label: 'Productos', enabled: true },
  { id: 'clientes', label: 'Clientes', enabled: true },
  { id: 'cajas', label: 'Cajas', enabled: true },
  { id: 'gastos', label: 'Gastos', enabled: true },
];

export const WidgetGrid: React.FC<WidgetGridProps> = ({ storageKey, statsData, headerButtons }) => {
  // layout solo para posición y tamaño, no para enabled
  const [layout, setLayout] = useState<WidgetConfig[]>([]);
  const [widgets, setWidgets] = useState(defaultWidgets);
  const [popoverOpen, setPopoverOpen] = useState(false);

  // --- Botón y popover para activar/desactivar widgets ---
  const configButton = (
    <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
      <PopoverTrigger asChild>
        <Button size="sm" variant="outline" onClick={() => setPopoverOpen(true)}>
          <SlidersHorizontal className="w-4 h-4 mr-1" /> Widgets
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-56">
        <div className="font-semibold mb-2">Mostrar widgets</div>
        {widgets.map(widget => (
          <div key={widget.id} className="flex items-center gap-2 mb-1">
            <input
              type="checkbox"
              checked={widget.enabled}
              onChange={() => setWidgets(widgets => widgets.map(w => w.id === widget.id ? { ...w, enabled: !w.enabled } : w))}
              id={`widget-toggle-${widget.id}`}
            />
            <label htmlFor={`widget-toggle-${widget.id}`}>{widget.label}</label>
          </div>
        ))}
      </PopoverContent>
    </Popover>
  );

  // --- Botón para reordenar widgets activos ---
  const reorderButton = (
    <Button size="sm" variant="outline" onClick={() => {
      let x = 0;
      const y = Math.floor(GRID_ROWS / 2) * CELL_SIZE;
      const ordered = layout.map(w => {
        if (!w.enabled) return w;
        const slotW = w.w || 1;
        const width = slotW * CELL_SIZE;
        const newPos = { ...w, x, y };
        x += width + 12; // Espacio entre widgets
        return newPos;
      });
      setLayout(ordered);
      if (storageKey) {
        localStorage.setItem(storageKey, JSON.stringify(ordered));
      }
    }} className="ml-2">
      <RefreshCw className="w-4 h-4 mr-1" /> Reordenar activos
    </Button>
  );

  // --- Widgets activos ---
  const activeWidgets = widgets.filter(w => w.enabled);

  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      setLayout(JSON.parse(saved));
    } else {
      setLayout([]);
    }
  }, [storageKey]);

  useEffect(() => {
    if (layout.length > 0) {
      localStorage.setItem(storageKey, JSON.stringify(layout));
    }
  }, [layout, storageKey]);

  // --- Drag & Drop con dnd-kit ---
  function DraggableWidget({ id, children }: { id: string; children: React.ReactNode }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      zIndex: isDragging ? 2 : 1,
      opacity: isDragging ? 0.7 : 1,
    };
    return (
      <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
        {children}
      </div>
    );
  }

  // --- Render ---
  return (
    <div className="w-full flex flex-col items-center">
      <div className="w-full flex items-center gap-2 mb-3">
        {configButton}
        {reorderButton}
        {headerButtons}
      </div>
      <DndContext
        collisionDetection={closestCenter}
        onDragEnd={(event) => {
          const { active, over } = event;
          if (active.id !== over?.id) {
            const oldIndex = activeWidgets.findIndex(w => w.id === active.id);
            const newIndex = activeWidgets.findIndex(w => w.id === over?.id);
            const reordered = arrayMove(activeWidgets, oldIndex, newIndex);
            // Actualiza el orden en widgets manteniendo los deshabilitados
            const newWidgets = [
              ...reordered,
              ...widgets.filter(w => !w.enabled)
            ];
            setWidgets(newWidgets);
          }
        }}
      >
        <SortableContext
          items={activeWidgets.map(w => w.id)}
          strategy={verticalListSortingStrategy}
        >
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            {activeWidgets.map(widget => (
              <DraggableWidget key={widget.id} id={widget.id}>
                {widget.id === 'ventas' && (
                  <StatCard
                    icon={BarChart3}
                    title="Ventas"
                    value={formatCurrency(statsData?.totalVentas ?? 0)}
                    trend="up"
                    trendValue={statsData?.ventasTrend ?? ''}
                  />
                )}
                {widget.id === 'productos' && (
                  <StatCard
                    icon={Package}
                    title="Productos"
                    value={statsData?.totalProductos ?? 0}
                    trend="up"
                    trendValue={statsData?.productsLast7Days ?? ''}
                  />
                )}
                {widget.id === 'clientes' && (
                  <StatCard
                    icon={Users}
                    title="Clientes"
                    value={statsData?.totalClientes ?? 0}
                    trend="up"
                    trendValue={statsData?.clientsLast7Days ?? ''}
                  />
                )}
                {widget.id === 'cajas' && (
                  <StatCard
                    icon={ShoppingCart}
                    title="Cajas"
                    value={statsData?.totalCajas ?? 0}
                    trend="up"
                    trendValue={statsData?.activeCajasTrend ?? ''}
                  />
                )}
                {widget.id === 'gastos' && (
                  <StatCard
                    icon={Wallet}
                    title="Gastos"
                    value={statsData?.totalGastos ?? 0}
                    trend="down"
                    trendValue={statsData?.gastosTrend ?? ''}
                  />
                )}
              </DraggableWidget>
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
};
