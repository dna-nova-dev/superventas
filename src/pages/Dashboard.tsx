import React, { useReducer, useEffect, useMemo, useCallback, useState } from "react";
import { Layout } from "@/components/layout/Layout";
import FilterCuadre from "@/components/dashboard/FilterCuadre";
import FilterEstadisticas from "@/components/dashboard/FilterEstadisticas";
import { useAuth } from "@/hooks/useAuth";
import { formatCurrency } from "@/data/mockData";

// Import types from the types file
import {
  BarChart3,
  ShoppingCart,
  Package,
  Users,
  TrendingUp,
  TrendingDown,
  Filter,
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from "recharts";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { motion } from "framer-motion";
import type { Variants } from "framer-motion";
import { getVentas } from "@/services/ventaService";
import { getAllProductos } from "@/services/productoService";
import { getAllClientes } from "@/services/clienteService";
import { getAllCajas } from "@/services/cajaService";
import { getVentaDetalles } from "@/services/ventaDetalleService";
import { getGastos } from "@/services/gastosService";

// Tipos para las funciones de filtrado
interface FiltroFechas {
  periodo?: string;
  start?: Date | string;
  end?: Date | string;
  cajaId?: string | number;
}

// Función para comparar si dos fechas son el mismo día (ignorando la hora)
const isSameDay = (date1: Date, date2: Date): boolean => {
  return date1.getFullYear() === date2.getFullYear() &&
         date1.getMonth() === date2.getMonth() &&
         date1.getDate() === date2.getDate();
};

// Función para obtener la fecha de inicio del día (00:00:00) en zona horaria local
const getStartOfDay = (date: Date): Date => {
  const local = new Date(date);
  return new Date(local.getFullYear(), local.getMonth(), local.getDate());
};

// Función para obtener la fecha de fin del día (23:59:59.999) en zona horaria local
const getEndOfDay = (date: Date): Date => {
  const local = new Date(date);
  return new Date(local.getFullYear(), local.getMonth(), local.getDate(), 23, 59, 59, 999);
};

// Función para formatear fecha como YYYY-MM-DD para comparación
const formatDateToYMD = (date: Date | string | null | undefined): string => {
  if (!date) return '';
  
  try {
    // Si es un string, intentar convertirlo a Date
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    // Verificar si la fecha es válida
    if (isNaN(dateObj.getTime())) {
      console.warn('Fecha inválida:', date);
      return '';
    }
    
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  } catch (error) {
    console.error('Error al formatear fecha:', error);
    return '';
  }
};

// Función para formatear fecha a YYYY-MM-DD usando la zona horaria local
const formatDate = (date: Date): string => {
  // Usar los métodos getFullYear, getMonth, getDate que ya devuelven en la zona horaria local
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Función para obtener la fecha actual en la zona horaria local
const getTodayLocal = (): string => {
  const now = new Date();
  // Ajustar al mediodía para evitar problemas con cambios de horario
  now.setHours(12, 0, 0, 0);
  return formatDate(now);
};

// Función para parsear fechas de la base de datos como fechas locales
const parseDate = (dateValue: string | Date | null | undefined): Date | null => {
  if (!dateValue) return null;
  
  try {
    // Si ya es un objeto Date, devolver una copia
    if (dateValue instanceof Date) {
      return new Date(dateValue.getTime());
    }
    
    // Para strings, asumimos que ya están en la zona horaria local
    if (typeof dateValue === 'string') {
      // Formato YYYY-MM-DD
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
        const [year, month, day] = dateValue.split('-').map(Number);
        return new Date(year, month - 1, day);
      }
      
      // Formato YYYY-MM-DD HH:MM:SS o similar
      if (/^\d{4}-\d{2}-\d{2}[T\s]\d{2}:\d{2}(:\d{2}(\.\d+)?)?$/.test(dateValue)) {
        // Extraer los componentes de la fecha y hora
        const [datePart, timePart] = dateValue.split(/[T\s]/);
        const [year, month, day] = datePart.split('-').map(Number);
        
        let hours = 0, minutes = 0, seconds = 0;
        if (timePart) {
          const [h, m, s] = timePart.split(':');
          hours = parseInt(h, 10) || 0;
          minutes = parseInt(m, 10) || 0;
          seconds = s ? Math.floor(parseFloat(s)) : 0;
        }
        
        // Crear fecha local (sin conversión de zona horaria)
        return new Date(year, month - 1, day, hours, minutes, seconds);
      }
    }
    
    // Para otros formatos, intentar crear un objeto Date
    const date = new Date(dateValue);
    return isNaN(date.getTime()) ? null : date;
    
  } catch (e) {
    console.error('Error al parsear fecha:', e, 'Valor:', dateValue);
    return null;
  }
};

// Función para filtrar ventas
function filtrarVentas(
  ventas: Venta[], 
  periodo: string, 
  start?: Date | string, 
  end?: Date | string,
  cajaId?: string | number
): Venta[] {
  console.log(`Filtrando ${ventas?.length || 0} ventas con periodo:`, periodo, 'y cajaId:', cajaId);
  
  if (!ventas || ventas.length === 0) {
    console.warn('No hay ventas para filtrar');
    return [];
  }

  // Primero filtramos por caja si se especificó
  let ventasFiltradas = [...ventas];
  if (cajaId !== undefined && cajaId !== '') {
    const cajaIdNum = typeof cajaId === 'string' ? parseInt(cajaId, 10) : cajaId;
    
    if (!isNaN(cajaIdNum)) {
      ventasFiltradas = ventasFiltradas.filter(v => {
        const vCajaId = typeof v.cajaId === 'string' ? parseInt(v.cajaId, 10) : v.cajaId;
        return vCajaId === cajaIdNum;
      });
      
      console.log(`Ventas después de filtrar por caja ${cajaId}:`, ventasFiltradas.length);
    }
  }

  // Si no hay filtro de fecha, retornar las ventas filtradas por caja
  if (!periodo && !start && !end) {
    console.log(`Ventas filtradas: ${ventasFiltradas.length} de ${ventas.length}`);
    return ventasFiltradas;
  }

  // Obtener fechas de inicio y fin para el filtro (pueden ser Date o string en formato YYYY-MM-DD)
  let fechaInicio: Date | string | null = null;
  let fechaFin: Date | string | null = null;
  
  // Si hay un rango personalizado, usarlo
  if (start || end) {
    fechaInicio = start ? getStartOfDay(parseDate(start) || new Date()) : null;
    fechaFin = end ? getEndOfDay(parseDate(end) || new Date()) : null;
  } 
  // Si hay un período predefinido, calcular las fechas
  else if (periodo) {
    const hoy = new Date();
    
    switch (periodo) {
      case 'hoy': {
        // Obtener componentes de fecha local
        const year = hoy.getFullYear();
        const month = hoy.getMonth();
        const day = hoy.getDate();
        
        // Crear fechas de inicio y fin en la zona horaria local
        const hoyInicio = new Date(year, month, day, 0, 0, 0, 0);
        const hoyFin = new Date(year, month, day, 23, 59, 59, 999);
        
        console.log('=== FILTRO HOY ===');
        console.log('Año:', year, 'Mes:', month, 'Día:', day);
        console.log('Hoy (inicio):', hoyInicio);
        console.log('Hoy (fin):', hoyFin);
        console.log('Hoy (inicio ISO):', hoyInicio.toISOString());
        console.log('Hoy (fin ISO):', hoyFin.toISOString());
        
        fechaInicio = hoyInicio;
        fechaFin = hoyFin;
        break;
      }
        
      case 'ayer': {
        // Crear fecha de ayer
        const ayer = new Date();
        ayer.setDate(ayer.getDate() - 1);
        
        // Obtener componentes de fecha local
        const year = ayer.getFullYear();
        const month = ayer.getMonth();
        const day = ayer.getDate();
        
        // Crear fechas de inicio y fin en la zona horaria local
        const ayerInicio = new Date(year, month, day, 0, 0, 0, 0);
        const ayerFin = new Date(year, month, day, 23, 59, 59, 999);
        
        console.log('=== FILTRO AYER ===');
        console.log('Año:', year, 'Mes:', month, 'Día:', day);
        console.log('Ayer (inicio):', ayerInicio);
        console.log('Ayer (fin):', ayerFin);
        console.log('Ayer (inicio ISO):', ayerInicio.toISOString());
        console.log('Ayer (fin ISO):', ayerFin.toISOString());
        
        fechaInicio = ayerInicio;
        fechaFin = ayerFin;
        break;
      }
        
      case 'semana': {
        const primerDiaSemana = new Date(hoy);
        primerDiaSemana.setDate(hoy.getDate() - hoy.getDay() + (hoy.getDay() === 0 ? -6 : 1));
        fechaInicio = getStartOfDay(primerDiaSemana);
        fechaFin = getEndOfDay(hoy);
        break;
      }
        
      case '7dias': {
        const hace7Dias = new Date(hoy);
        hace7Dias.setDate(hoy.getDate() - 7);
        fechaInicio = getStartOfDay(hace7Dias);
        fechaFin = getEndOfDay(hoy);
        break;
      }
        
      case 'mes': {
        fechaInicio = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
        fechaFin = getEndOfDay(hoy);
        break;
      }
        
      case 'anio': {
        fechaInicio = new Date(hoy.getFullYear(), 0, 1);
        fechaFin = getEndOfDay(hoy);
        break;
      }
    }
  }
  
  // La función formatDateToYMD ha sido movida al inicio del archivo con las demás utilidades

  // Obtener la fecha actual en formato YYYY-MM-DD
  const hoy = new Date();
  const hoyStr = formatDateToYMD(hoy);
  
  // Debug: Mostrar información de las fechas
  console.log('=== DEBUG FECHAS ===');
  console.log('Hoy (local):', hoyStr);
  console.log('Rango de filtro:', {
    desde: fechaInicio ? formatDateToYMD(fechaInicio) : 'sin fecha',
    hasta: fechaFin ? formatDateToYMD(fechaFin) : 'sin fecha',
    periodo
  });

  // Función para normalizar fechas a formato YYYY-MM-DD
  const normalizeDateStr = (date: Date | string | null): string | null => {
    if (!date) return null;
    
    if (typeof date === 'string') {
      // Si ya está en formato YYYY-MM-DD, devolverlo directamente
      if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return date;
      }
      // Si es una fecha ISO, extraer solo la parte de la fecha
      if (date.includes('T')) {
        return date.split('T')[0];
      }
      return date;
    }
    
    // Si es un objeto Date, formatearlo a YYYY-MM-DD
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Función para verificar si una fecha está en el rango
  const isInDateRange = (fechaVenta: string, ventaId: number, fechaInicio: Date | string | null, fechaFin: Date | string | null): boolean => {
    // Si no hay fechas de filtro, incluir todas las ventas
    if (!fechaInicio && !fechaFin) {
      return true;
    }

    // Función para normalizar fechas a formato YYYY-MM-DD
    const toYMD = (date: Date | string | null): string | null => {
      if (!date) return null;
      
      // Si ya es un string en formato YYYY-MM-DD, devolverlo directamente
      if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return date;
      }
      
      // Si es un objeto Date o string ISO, convertirlo a YYYY-MM-DD
      const d = date instanceof Date ? date : new Date(date);
      if (isNaN(d.getTime())) return null;
      
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    // Normalizar fechas a formato YYYY-MM-DD para comparación
    const fechaVentaStr = toYMD(fechaVenta) || '';
    const fechaInicioStr = toYMD(fechaInicio);
    const fechaFinStr = toYMD(fechaFin);

    // Debug: Mostrar información detallada de la comparación
    console.log('=== DEBUG COMPARACIÓN DE FECHAS ===');
    console.log('Venta ID:', ventaId);
    console.log('Fecha venta (original):', fechaVenta);
    console.log('Fecha venta (normalizada):', fechaVentaStr);
    console.log('Rango de filtro:', {
      desde: fechaInicioStr,
      hasta: fechaFinStr
    });

    try {
      // Si hay un rango de fechas, verificar si la venta está dentro del rango
      if (fechaInicioStr && fechaFinStr) {
        // Comparación directa de strings en formato YYYY-MM-DD
        const cumpleRango = fechaVentaStr >= fechaInicioStr && fechaVentaStr <= fechaFinStr;
        
        console.log(`Comparación: ${fechaVentaStr} entre ${fechaInicioStr} y ${fechaFinStr} -> ${cumpleRango ? 'DENTRO' : 'FUERA'}`);
        
        if (!cumpleRango) {
          console.log(`Venta ${ventaId} fuera de rango`);
          console.log('Tipo de fechas:', {
            venta: typeof fechaVenta,
            inicio: typeof fechaInicio,
            fin: typeof fechaFin
          });
        }
        return cumpleRango;
      }
      // Si solo hay fecha de inicio
      else if (fechaInicioStr) {
        const cumpleRango = fechaVentaStr >= fechaInicioStr;
        console.log(`Comparación inicio: ${fechaVentaStr} >= ${fechaInicioStr} -> ${cumpleRango ? 'DENTRO' : 'FUERA'}`);
        return cumpleRango;
      }
      // Si solo hay fecha de fin
      else if (fechaFinStr) {
        const cumpleRango = fechaVentaStr <= fechaFinStr;
        console.log(`Comparación fin: ${fechaVentaStr} <= ${fechaFinStr} -> ${cumpleRango ? 'DENTRO' : 'FUERA'}`);
        return cumpleRango;
      }
    } catch (error) {
      console.error('Error al comparar fechas:', error);
      // En caso de error, incluir la venta para evitar pérdida de datos
      return true;
    }
    
    // Si llegamos aquí, no hay fechas de filtro válidas, así que incluimos la venta
    return true;
  };

  // Filtrar las ventas por fecha
  const ventasFiltradasPorFecha = ventasFiltradas.filter(venta => {
    if (!venta.fecha) {
      console.log('Venta sin fecha:', venta.id);
      return false;
    }
    
    // Si no hay fechas de filtro, incluir todas las ventas
    if (!fechaInicio && !fechaFin) {
      console.log('Sin filtro de fechas, incluyendo todas las ventas');
      return true;
    }
    
    return isInDateRange(venta.fecha, venta.id, fechaInicio, fechaFin || new Date());
  });

  console.log(`Ventas filtradas: ${ventasFiltradasPorFecha.length} de ${ventas.length}`);
  console.log('Rango de fechas:', { inicio: fechaInicio, fin: fechaFin });
  
  return ventasFiltradasPorFecha;
}


import { 
  Venta as VentaType, 
  Producto as ProductoType, 
  Cliente as ClienteType, 
  Categoria, 
  VentaDetalle, 
  Gasto as GastoType 
} from "@/types";
import { Caja as CajaType } from "@/types/caja.interface";

// Definición de tipos adicionales para propiedades extendidas
interface ExtendedVentaProps {
  // Agregar aquí propiedades adicionales específicas de Venta si son necesarias
  // Ejemplo:
  // descuentoAplicado?: number;
  // metodoPago?: string;
  [key: string]: string | number | boolean | Date | null | undefined;
}

interface ExtendedProductoProps {
  // Propiedades adicionales específicas de Producto
  // Ejemplo:
  // categoriaNombre?: string;
  // stockDisponible?: number;
  [key: string]: string | number | boolean | Date | null | undefined;
}

interface ExtendedClienteProps {
  // Propiedades adicionales específicas de Cliente
  // Ejemplo:
  // totalCompras?: number;
  // ultimaCompra?: Date;
  [key: string]: string | number | boolean | Date | null | undefined;
}

interface ExtendedCajaProps {
  montoInicial: string;
  // Otras propiedades específicas de Caja
  // Ejemplo:
  // estado?: 'abierta' | 'cerrada';
  [key: string]: string | number | boolean | Date | null | undefined;
}

interface ExtendedGastoProps {
  // Propiedades adicionales específicas de Gasto
  // Ejemplo:
  // comprobanteUrl?: string;
  [key: string]: string | number | boolean | Date | null | undefined;
}

// Tipos finales que extienden los tipos importados
type Venta = VentaType & ExtendedVentaProps;
type Producto = ProductoType & ExtendedProductoProps;
type Cliente = ClienteType & ExtendedClienteProps;
type Caja = CajaType & ExtendedCajaProps;
type Gasto = GastoType & ExtendedGastoProps;
import { getAllCategorias } from "@/services/categoriaService";
import { Button } from "@/components/ui/button";
import { SlidersHorizontal, RefreshCw } from "lucide-react";

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { 
    opacity: 1, 
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 100,
      damping: 10
    }
  },
};

const chartVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.95,
  },
  show: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.4,
      ease: "easeOut",
    },
  },
};

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"];

// Función para obtener la fecha de inicio y fin del día actual
const getTodayRange = () => {
  const today = new Date();
  const start = new Date(today);
  start.setHours(0, 0, 0, 0);
  const end = new Date(today);
  end.setHours(23, 59, 59, 999);
  return { start, end };
};

// Estado inicial agrupado
const initialState = {
  selectedCajaId: "1",
  periodFilter: "hoy",
  startDate: getTodayRange().start,
  endDate: getTodayRange().end,
  periodoEstadisticas: "hoy",
  startEstadisticas: getTodayRange().start,
  endEstadisticas: getTodayRange().end,
  selectedEstadisticasCajaId: "",
  ventas: [],
  productos: [],
  clientes: [],
  cajas: [],
  ventaDetalles: [],
  gastos: [],
  salesPeriod: "7days",
  categoryPeriod: "month",
  trendPeriod: "6months",
  loading: true,
  salesData: [],
  categoryData: [],
  trendData: [],
  widgetPopoverOpen: false,
  dashboardWidgets: [
    { id: "ventas", label: "Ventas", enabled: true },
    { id: "productos", label: "Productos", enabled: true },
    { id: "clientes", label: "Clientes", enabled: true },
    { id: "cajas", label: "Cajas", enabled: true },
  ],
  categorias: [],
  filteredStats: {
    totalVentas: 0,
    ventasTrend: "0%",
    totalProductos: 0,
    totalClientes: 0,
    totalCajas: 0,
    productsLast7Days: 0,
    clientsLast7Days: 0,
    activeCajasTrend: "",
    totalGastos: 0,
    gastosTrend: "0%",
  },
};

function dashboardReducer(state, action) {
  switch (action.type) {
    case "SET_FIELD":
      return { ...state, [action.field]: action.value };
    case "SET_MULTIPLE":
      return { ...state, ...action.payload };
    case "SET_DASHBOARD_WIDGETS":
      return { ...state, dashboardWidgets: action.payload };
    case "SET_FILTERED_STATS":
      return { ...state, filteredStats: action.payload };
    default:
      return state;
  }
}

const Dashboard = () => {
  const { empresaId } = useAuth();
  const [state, dispatch] = useReducer(dashboardReducer, initialState);
  const [showEmptyGastos, setShowEmptyGastos] = useState(false);

  // Desestructurar los estados para facilidad de uso
  const {
    selectedCajaId,
    periodFilter,
    startDate,
    endDate,
    periodoEstadisticas,
    startEstadisticas,
    endEstadisticas,
    selectedEstadisticasCajaId,
    ventas = [],
    productos = [],
    clientes = [],
    cajas = [],
    ventaDetalles = [],
    gastos = [],
    salesPeriod,
    categoryPeriod,
    trendPeriod,
    loading,
    salesData,
    categoryData,
    trendData,
    widgetPopoverOpen,
    dashboardWidgets,
    categorias = [],
    filteredStats,
  } = state;

  // Memoized filtered data - defined at the top to ensure they're available for all hooks
  const filteredGastos = useMemo<Array<Gasto>>(() => {
    try {
      if (!gastos || !Array.isArray(gastos)) {
        console.warn("Datos de gastos no válidos:", gastos);
        return [];
      }
      
      console.log("Filtrando gastos con:", {
        totalGastos: gastos.length,
        periodoEstadisticas,
        startEstadisticas,
        endEstadisticas,
        selectedEstadisticasCajaId
      });
      
      // Si no hay gastos, devolver array vacío
      if (gastos.length === 0) {
        console.log("No hay gastos para filtrar");
        return [];
      }
      
      const result = filtrarGastos(
        gastos,
        periodoEstadisticas,
        startEstadisticas,
        endEstadisticas,
        selectedEstadisticasCajaId || undefined
      );
      
      console.log("Gastos filtrados:", {
        total: result.length,
        muestra: result.slice(0, 3).map(g => ({
          id: g.id,
          monto: g.monto,
          fecha: g.fecha || g.createdAt,
          cajaId: g.cajaId,
          descripcion: g.descripcion
        }))
      });
      return result;
    } catch (error) {
      console.error("Error filtering gastos:", error);
      return [];
    }
  }, [gastos, periodoEstadisticas, startEstadisticas, endEstadisticas, selectedEstadisticasCajaId]);

  const filteredVentas = useMemo<Array<Venta>>(() => {
    try {
      console.log('=== FILTRANDO VENTAS ===');
      console.log('Total ventas:', ventas.length);
      console.log('Periodo:', periodoEstadisticas);
      console.log('Rango:', { start: startEstadisticas, end: endEstadisticas });
      console.log('Caja seleccionada:', selectedEstadisticasCajaId);
      
      const filtradas = filtrarVentas(
        ventas,
        periodoEstadisticas,
        startEstadisticas,
        endEstadisticas,
        selectedEstadisticasCajaId || undefined
      );
    
      console.log('Ventas filtradas:', filtradas.length);
      if (filtradas.length === 0 && ventas.length > 0) {
        console.warn('No se encontraron ventas con los filtros actuales');
        console.log('Primeras 3 ventas (sin filtrar):', ventas.slice(0, 3).map(v => ({
          id: v.id,
          fecha: v.fecha,
          total: v.total,
          empresaId: v.empresaId,
          cajaId: v.cajaId
        })));
      }
      
      return filtradas;
    } catch (error) {
      console.error('Error al filtrar ventas:', error);
      return [];
    }
  }, [ventas, periodoEstadisticas, startEstadisticas, endEstadisticas, selectedEstadisticasCajaId]);

  const filteredProductos = useMemo<Array<Producto>>(() => {
    try {
      console.log('=== MOSTRANDO TODOS LOS PRODUCTOS SIN FILTRO ===');
      console.log('Total productos:', productos.length);
      
      // Devolver todos los productos sin filtrar por fecha
      return [...productos];
    } catch (error) {
      console.error('Error al cargar productos:', error);
      return [];
    }
  }, [productos]);

  const filteredClientes = useMemo<Array<Cliente>>(() => {
    try {
      console.log('=== MOSTRANDO TODOS LOS CLIENTES SIN FILTRO ===');
      console.log('Total clientes:', clientes.length);
      
      // Devolver todos los clientes sin filtrar por fecha
      return [...clientes];
    } catch (error) {
      console.error('Error al cargar clientes:', error);
      return [];
    }
  }, [clientes]);

  // Función para cargar datos iniciales
  const loadInitialData = useCallback(async () => {
    try {
      dispatch({ type: "SET_FIELD", field: "loading", value: true });
      
      console.log("Cargando datos iniciales...");
      console.log("Empresa ID:", empresaId);
      
      // Primero cargamos los gastos para verificar si hay datos
      const gastosData = await getGastos().catch(err => {
        console.error("Error cargando gastos:", err);
        return [];
      });
      
      console.log("Datos de gastos cargados:", gastosData);
      
      // Luego cargamos el resto de los datos en paralelo
      const [
        ventasData,
        productosData,
        clientesData,
        cajasData,
        detallesData,
      ] = await Promise.all([
        getVentas().catch(err => {
          console.error("Error cargando ventas:", err);
          return [];
        }),
        getAllProductos().catch(err => {
          console.error("Error cargando productos:", err);
          return [];
        }),
        getAllClientes().catch(err => {
          console.error("Error cargando clientes:", err);
          return [];
        }),
        getAllCajas().catch(err => {
          console.error("Error cargando cajas:", err);
          return [];
        }),
        getVentaDetalles().catch(err => {
          console.error("Error cargando detalles de venta:", err);
          return [];
        }),
      ]);

      console.log("Datos cargados:", {
        ventas: ventasData.length,
        productos: productosData.length,
        clientes: clientesData.length,
        cajas: cajasData.length,
        detalles: detallesData.length,
        gastos: gastosData.length,
      });

      // Verificar si hay gastos para la empresa actual
      const gastosFiltrados = Array.isArray(gastosData) 
        ? gastosData.filter((g: Gasto) => g.empresaId === empresaId)
        : [];
      
      console.log(`Gastos filtrados para empresa ${empresaId}:`, gastosFiltrados);
      
      dispatch({
        type: "SET_MULTIPLE",
        payload: {
          ventas: Array.isArray(ventasData) ? ventasData.filter((v: Venta) => v.empresaId === empresaId) : [],
          productos: Array.isArray(productosData) ? productosData.filter(
            (p: Producto) => p.empresaId === empresaId
          ) : [],
          clientes: Array.isArray(clientesData) ? clientesData.filter(
            (c: Cliente) => c.empresaId === empresaId
          ) : [],
          cajas: Array.isArray(cajasData) ? cajasData.filter(
            (caja: Caja) => caja.empresaId === empresaId
          ) : [],
          ventaDetalles: Array.isArray(detallesData) ? detallesData : [],
          gastos: gastosFiltrados,
        },
      });
      
      // Si no hay gastos, mostrar un mensaje informativo
      if (gastosFiltrados.length === 0) {
        console.warn("No se encontraron gastos para la empresa", empresaId);
      }
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    } finally {
      dispatch({ type: "SET_FIELD", field: "loading", value: false });
    }
  }, [empresaId]);

  // Efecto para cargar datos al montar el componente
  useEffect(() => {
    loadInitialData();
    
    // Configurar un intervalo para actualizar los datos cada minuto
    const intervalId = setInterval(() => {
      console.log("Actualizando datos del dashboard...");
      loadInitialData();
    }, 60000);
    
    // Limpiar el intervalo al desmontar el componente
    return () => clearInterval(intervalId);
  }, [loadInitialData]);
  
  useEffect(() => {
    const fetchCategorias = async () => {
      const fetchedCategorias = await getAllCategorias();
      dispatch({
        type: "SET_FIELD",
        field: "categorias",
        value: fetchedCategorias,
      });
    };
    fetchCategorias();
  }, []);

  useEffect(() => {
    const calculateStats = () => {
      try {
        // Calcular total de ventas y tendencia
        const totalVentas = filteredVentas.reduce(
          (acc, venta) => acc + (parseFloat(venta?.total) || 0),
          0
        );

        // Calcular ventas del mes actual y mes anterior para la tendencia
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
        const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

        const currentMonthVentas = filteredVentas
          .filter((venta) => {
            try {
              const ventaDate = new Date(venta.fecha);
              return ventaDate.getMonth() === currentMonth && 
                     ventaDate.getFullYear() === currentYear;
            } catch (e) {
              console.error('Error procesando fecha de venta:', venta.fecha, e);
              return false;
            }
          })
          .reduce((acc, venta) => acc + (parseFloat(venta?.total) || 0), 0);

        const lastMonthVentas = filteredVentas
          .filter((venta) => {
            try {
              const ventaDate = new Date(venta.fecha);
              return ventaDate.getMonth() === lastMonth && 
                     ventaDate.getFullYear() === lastMonthYear;
            } catch (e) {
              console.error('Error procesando fecha de venta:', venta.fecha, e);
              return false;
            }
          })
          .reduce((acc, venta) => acc + (parseFloat(venta?.total) || 0), 0);

        // Calcular tendencia de ventas
        let ventasTrend = "0%";
        if (lastMonthVentas > 0) {
          const trendValue = ((currentMonthVentas - lastMonthVentas) / lastMonthVentas) * 100;
          ventasTrend = `${trendValue > 0 ? '+' : ''}${trendValue.toFixed(1)}%`;
        } else if (currentMonthVentas > 0) {
          ventasTrend = "+100%";
        }

        // Calcular productos agregados en los últimos 7 días
        const productsLast7Days = filteredProductos.filter((producto) => {
          try {
            const productDate = new Date(producto.createdAt);
            const diffTime = now.getTime() - productDate.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            return diffDays <= 7;
          } catch (e) {
            console.error('Error procesando fecha de producto:', producto.createdAt, e);
            return false;
          }
        });

        // Calcular clientes nuevos del mes actual
        const newClientsThisMonth = filteredClientes.filter((cliente) => {
          try {
            const clientDate = new Date(cliente.createdAt);
            return clientDate.getMonth() === currentMonth && 
                   clientDate.getFullYear() === currentYear;
          } catch (e) {
            console.error('Error procesando fecha de cliente:', cliente.createdAt, e);
            return false;
          }
        });

        // Calcular total de gastos
        const totalGastos = Array.isArray(gastos) ? gastos.reduce(
          (acc, gasto) => acc + (parseFloat(gasto?.monto) || 0),
          0
        ) : 0;

        // Calcular tendencia de gastos
        const currentMonthGastos = Array.isArray(gastos) ? gastos
          .filter((gasto) => {
            try {
              const gastoDate = new Date(gasto.fecha || gasto.createdAt);
              return gastoDate.getMonth() === currentMonth && 
                     gastoDate.getFullYear() === currentYear;
            } catch (e) {
              console.error('Error procesando fecha de gasto:', gasto.fecha || gasto.createdAt, e);
              return false;
            }
          })
          .reduce((acc, gasto) => acc + (parseFloat(gasto?.monto) || 0), 0) : 0;

        const lastMonthGastos = Array.isArray(gastos) ? gastos
          .filter((gasto) => {
            try {
              const gastoDate = new Date(gasto.fecha || gasto.createdAt);
              return gastoDate.getMonth() === lastMonth && 
                     gastoDate.getFullYear() === lastMonthYear;
            } catch (e) {
              console.error('Error procesando fecha de gasto:', gasto.fecha || gasto.createdAt, e);
              return false;
            }
          })
          .reduce((acc, gasto) => acc + (parseFloat(gasto?.monto) || 0), 0) : 0;

        let gastosTrend = "0%";
        if (lastMonthGastos > 0) {
          const trendValue = ((currentMonthGastos - lastMonthGastos) / lastMonthGastos) * 100;
          gastosTrend = `${trendValue > 0 ? '+' : ''}${trendValue.toFixed(1)}%`;
        } else if (currentMonthGastos > 0) {
          gastosTrend = "+100%";
        }

        return {
          totalVentas,
          ventasTrend,
          totalProductos: filteredProductos.length,
          productsLast7Days: productsLast7Days.length > 0 ? `+${productsLast7Days.length} este mes` : 'Sin cambios',
          totalClientes: filteredClientes.length,
          clientsLast7Days: newClientsThisMonth.length > 0 ? `+${newClientsThisMonth.length} este mes` : 'Sin cambios',
          totalGastos,
          gastosTrend,
          // Agregar datos para las cajas si es necesario
          totalCajas: cajas.length,
          activeCajasTrend: cajas.filter(c => c.estado === 'abierta').length > 0 ? 
            `${cajas.filter(c => c.estado === 'abierta').length} abiertas` : 'Todas cerradas'
        };
      } catch (error) {
        console.error('Error calculando estadísticas:', error);
        // Retornar valores por defecto en caso de error
        return {
          totalVentas: 0,
          ventasTrend: '0%',
          totalProductos: 0,
          productsLast7Days: '0',
          totalClientes: 0,
          clientsLast7Days: '0',
          totalGastos: 0,
          gastosTrend: '0%',
          totalCajas: 0,
          activeCajasTrend: 'N/A'
        };
      }
    };

    dispatch({ type: "SET_FILTERED_STATS", payload: calculateStats() });
  }, [
    filteredVentas,
    filteredProductos,
    filteredClientes,
    gastos,
    cajas
  ]);

  // Función para procesar los datos de ventas para el gráfico
  const processSalesData = useCallback((period: string) => {
    try {
      if (!ventas || ventas.length === 0) {
        console.warn('No hay datos de ventas para procesar');
        return [];
      }
      const today = new Date();
      
      // Filtrar por caja seleccionada
      let filteredVentas = ventas;
      if (selectedEstadisticasCajaId) {
        filteredVentas = ventas.filter(venta => 
          venta.cajaId === (typeof selectedEstadisticasCajaId === 'string' 
            ? parseInt(selectedEstadisticasCajaId, 10) 
            : selectedEstadisticasCajaId)
        );
      }

      // Filtrar por período
      filteredVentas = filteredVentas.filter((venta) => {
        try {
          const ventaDate = new Date(venta.fecha);
          const diffTime = today.getTime() - ventaDate.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          
          switch (period) {
            case "7days":
              return diffDays <= 7;
            case "30days":
              return diffDays <= 30;
            case "365days":
              return diffDays <= 365;
            default:
              return true;
          }
        } catch (e) {
          console.error('Error procesando fecha de venta:', venta.fecha, e);
          return false;
        }
      });

      // Agrupar ventas
      const groupedSales = filteredVentas.reduce((acc, venta) => {
        try {
          const date = new Date(venta.fecha);
          let key;

          switch (period) {
            case "7days":
              key = date.toLocaleDateString("es-ES", { weekday: "short" });
              break;
            case "30days":
              key = date.getDate().toString() + " " + 
                    date.toLocaleDateString("es-ES", { month: "short" });
              break;
            case "365days":
              key = date.toLocaleDateString("es-ES", { month: "short" }) + " " + 
                    date.getFullYear();
              break;
            default:
              key = date.toLocaleDateString("es-ES", { weekday: "short" });
          }

          acc[key] = (acc[key] || 0) + parseFloat(venta.total);
          return acc;
        } catch (e) {
          console.error('Error agrupando venta:', venta, e);
          return acc;
        }
      }, {} as Record<string, number>);

      // Convertir a array y ordenar
      const chartData = Object.entries(groupedSales).map(([name, ventas]) => ({
        name,
        ventas,
      }));

      // Ordenar según el período
      if (period === "7days") {
        const days = ['lun', 'mar', 'mié', 'jue', 'vie', 'sáb', 'dom'];
        chartData.sort((a, b) => days.indexOf(a.name.toLowerCase()) - days.indexOf(b.name.toLowerCase()));
      } else if (period === "30days") {
        chartData.sort((a, b) => {
          const [dayA] = a.name.split(' ');
          const [dayB] = b.name.split(' ');
          return parseInt(dayA) - parseInt(dayB);
        });
      } else if (period === "365days") {
        const months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
        chartData.sort((a, b) => {
          const [monthA, yearA] = a.name.split(' ');
          const [monthB, yearB] = b.name.split(' ');
          if (yearA !== yearB) return parseInt(yearA) - parseInt(yearB);
          return months.indexOf(monthA.toLowerCase()) - months.indexOf(monthB.toLowerCase());
        });
      }

      console.log('Datos del gráfico de ventas:', chartData);
      return chartData;
    } catch (error) {
      console.error('Error en processSalesData:', error);
      return [];
    }
  }, [ventas, selectedEstadisticasCajaId]);

  // Efecto para actualizar los datos de ventas cuando cambian las dependencias
  useEffect(() => {
    if (!salesPeriod) return;
    
    const updateSalesData = () => {
      const chartData = processSalesData(salesPeriod);
      dispatch({ type: "SET_FIELD", field: "salesData", value: chartData });
    };
    
    updateSalesData();
  }, [processSalesData, salesPeriod, dispatch]);

  const processCategoryData = async (period: string) => {
    const categorias = await getAllCategorias();
    const today = new Date();
    const filteredVentas = ventas.filter((venta) => {
      const ventaDate = new Date(venta.fecha);
      const diffMonths =
        today.getMonth() -
        ventaDate.getMonth() +
        12 * (today.getFullYear() - ventaDate.getFullYear());
      return (
        diffMonths <= (period === "month" ? 1 : period === "quarter" ? 3 : 12)
      );
    });

    const categoryTotals = categorias.map((categoria) => {
      const categoryProducts = productos.filter(
        (p) => p.categoriaId === categoria.id
      );
      const total = filteredVentas.reduce((acc, venta) => {
        return acc + parseFloat(venta.total) / categorias.length;
      }, 0);

      return {
        name: categoria.nombre,
        value: total,
      };
    });

    dispatch({
      type: "SET_FIELD",
      field: "categoryData",
      value: categoryTotals,
    });
  };

  const processTrendData = (period: string) => {
    const months = period === "6months" ? 6 : 12;
    const data = [];
    const today = new Date();

    for (let i = months - 1; i >= 0; i--) {
      const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const monthName = date.toLocaleDateString("es-GT", { month: "short" });

      const monthVentas = ventas.filter((venta) => {
        const ventaDate = new Date(venta.fecha);
        return (
          ventaDate.getMonth() === date.getMonth() &&
          ventaDate.getFullYear() === date.getFullYear()
        );
      });

      const total = monthVentas.reduce(
        (acc, venta) => acc + parseFloat(venta.total),
        0
      );

      data.push({
        name: monthName,
        ventas: total,
      });
    }

    dispatch({ type: "SET_FIELD", field: "trendData", value: data });
  };

  

  const calculateStats = () => {
    const totalVentas = filteredVentas.reduce(
      (acc, venta) => acc + parseFloat(venta.total),
      0
    );
    const lastMonthVentas = filteredVentas
      .filter((venta) => {
        const ventaDate = new Date(venta.fecha);
        const lastMonth = new Date();
        lastMonth.setMonth(lastMonth.getMonth() - 1);
        return ventaDate.getMonth() === lastMonth.getMonth();
      })
      .reduce((acc, venta) => acc + parseFloat(venta.total), 0);

    const currentMonthVentas = filteredVentas
      .filter((venta) => {
        const ventaDate = new Date(venta.fecha);
        const now = new Date();
        return ventaDate.getMonth() === now.getMonth();
      })
      .reduce((acc, venta) => acc + parseFloat(venta.total), 0);

    const ventasTrend =
      lastMonthVentas === 0
        ? "0"
        : (
            ((currentMonthVentas - lastMonthVentas) / lastMonthVentas) *
            100
          ).toFixed(1);

    const productsLast7Days = filteredProductos.filter((producto) => {
      const productDate = new Date(producto.createdAt);
      const today = new Date();
      const diffDays = Math.floor(
        (today.getTime() - productDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      return diffDays <= 7;
    }).length;

    const clientsLast7Days = filteredClientes.filter((cliente) => {
      const clientDate = new Date(cliente.createdAt);
      const today = new Date();
      const diffDays = Math.floor(
        (today.getTime() - clientDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      return diffDays <= 7;
    }).length;

    const activeCajas = cajas.filter(
      (caja) => parseFloat(caja.efectivo) > 0
    ).length;
    let activeCajasTrend = "";

    if (activeCajas === cajas.length) {
      activeCajasTrend = "Todas operativas";
    } else if (activeCajas === 0) {
      activeCajasTrend = "Ninguna operativa";
    } else {
      activeCajasTrend = `${activeCajas} de ${cajas.length} operativas`;
    }

    // --- GASTOS ---
    const gastosFiltrados = filtrarGastos(
      gastos,
      periodoEstadisticas,
      startEstadisticas,
      endEstadisticas
    );
    const totalGastos = gastosFiltrados.reduce(
      (acc, g) => acc + parseFloat(g.monto),
      0
    );
    // Tendencia de gastos
    let gastosTrend = "0%";
    if (periodoEstadisticas === "1mes") {
      const gastosMesActual = gastosFiltrados.reduce(
        (acc, g) => acc + parseFloat(g.monto),
        0
      );
      const gastosMesAnterior = filtrarGastos(
        gastos,
        "1mes",
        startEstadisticas,
        endEstadisticas
      ).reduce((acc, g) => acc + parseFloat(g.monto), 0);
      if (gastosMesAnterior > 0) {
        const trend =
          ((gastosMesActual - gastosMesAnterior) / gastosMesAnterior) * 100;
        gastosTrend = `${trend.toFixed(1)}% respecto al mes anterior`;
      } else if (gastosMesActual > 0) {
        gastosTrend = "+100% mes actual";
      }
    }

    return {
      totalVentas,
      ventasTrend,
      totalProductos: filteredProductos.length,
      totalClientes: filteredClientes.length,
      totalCajas: cajas.length,
      productsLast7Days,
      clientsLast7Days,
      activeCajasTrend,
      totalGastos,
      gastosTrend,
    };
  };

  useEffect(() => {
    const today = new Date();
    let desde: Date | null = null;
    let hasta: Date | null = null;

    if (periodoEstadisticas === "hoy") {
      desde = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      hasta = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate() + 1
      );
    } else if (periodoEstadisticas === "7dias") {
      desde = new Date(today);
      desde.setDate(today.getDate() - 7);
      hasta = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate() + 1
      );
    } else if (periodoEstadisticas === "1mes") {
      desde = new Date(today);
      desde.setMonth(today.getMonth() - 1);
      hasta = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate() + 1
      );
    } else if (
      periodoEstadisticas === "rango" &&
      startEstadisticas &&
      endEstadisticas
    ) {
      desde = startEstadisticas;
      hasta = new Date(endEstadisticas);
      hasta.setDate(hasta.getDate() + 1);
    }

    const ventasFiltradas = filteredVentas;
    const productosFiltrados = filteredProductos;
    const clientesFiltrados = filteredClientes;
    const cajasFiltradas = cajas; // Las cajas no tienen fecha, así que se muestran todas

    const totalVentas = ventasFiltradas.reduce(
      (acc, v) => acc + parseFloat(v.total),
      0
    );

    const lastMonthVentas = ventasFiltradas
      .filter((venta) => {
        const ventaDate = new Date(venta.fecha);
        const lastMonth = new Date();
        lastMonth.setMonth(lastMonth.getMonth() - 1);
        return ventaDate.getMonth() === lastMonth.getMonth();
      })
      .reduce((acc, venta) => acc + parseFloat(venta.total), 0);

    const currentMonthVentas = ventasFiltradas
      .filter((venta) => {
        const ventaDate = new Date(venta.fecha);
        const now = new Date();
        return ventaDate.getMonth() === now.getMonth();
      })
      .reduce((acc, venta) => acc + parseFloat(venta.total), 0);

    const ventasTrend =
      lastMonthVentas === 0
        ? "0%"
        : (
            ((currentMonthVentas - lastMonthVentas) / lastMonthVentas) *
            100
          ).toFixed(1);

    const productsLast7Days = productosFiltrados.filter((producto) => {
      const productDate = new Date(producto.createdAt);
      const today = new Date();
      const diffDays = Math.floor(
        (today.getTime() - productDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      return diffDays <= 7;
    }).length;

    const clientsLast7Days = clientesFiltrados.filter((cliente) => {
      const clientDate = new Date(cliente.createdAt);
      const today = new Date();
      const diffDays = Math.floor(
        (today.getTime() - clientDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      return diffDays <= 7;
    }).length;

    const activeCajas = cajasFiltradas.length;
    let activeCajasTrend = "";

    if (activeCajas === cajasFiltradas.length) {
      activeCajasTrend = "Todas operativas";
    } else if (activeCajas === 0) {
      activeCajasTrend = "Ninguna operativa";
    } else {
      activeCajasTrend = `${activeCajas} de ${cajasFiltradas.length} operativas`;
    }

    const gastosFiltrados = filtrarGastos(
      gastos,
      periodoEstadisticas,
      startEstadisticas,
      endEstadisticas
    );
    console.log("DEBUG gastosFiltrados:", gastosFiltrados, {
      startEstadisticas,
      endEstadisticas,
      gastos,
    });
    
    // Asegurarse de que gastosFiltrados sea un array antes de usar reduce
    const totalGastos = Array.isArray(gastosFiltrados) 
      ? gastosFiltrados.reduce(
          (acc, gasto) => acc + (parseFloat(gasto?.monto || '0') || 0),
          0
        )
      : 0;

    let gastosTrend = "0%";
    if (startEstadisticas && endEstadisticas) {
      // Calcular los meses involucrados en el filtro
      const mesActual = startEstadisticas.getMonth();
      const anioActual = startEstadisticas.getFullYear();
      const mesAnterior = mesActual === 0 ? 11 : mesActual - 1;
      const anioMesAnterior = mesActual === 0 ? anioActual - 1 : anioActual;
      // Asegurarse de que gastosFiltrados sea un array antes de usar filter y reduce
      const gastosMesActual = Array.isArray(gastosFiltrados)
        ? gastosFiltrados
            .filter((g) => {
              if (!g?.createdAt) return false;
              const fecha = new Date(g.createdAt);
              return (
                !isNaN(fecha.getTime()) &&
                fecha.getMonth() === mesActual && 
                fecha.getFullYear() === anioActual
              );
            })
            .reduce((acc, g) => {
              const monto = parseFloat(g?.monto || '0');
              return acc + (isNaN(monto) ? 0 : monto);
            }, 0)
        : 0;
      const gastosMesAnterior = Array.isArray(gastosFiltrados)
        ? gastosFiltrados
            .filter((g) => {
              if (!g?.createdAt) return false;
              const fecha = new Date(g.createdAt);
              return (
                !isNaN(fecha.getTime()) &&
                fecha.getMonth() === mesAnterior &&
                fecha.getFullYear() === anioMesAnterior
              );
            })
            .reduce((acc, g) => {
              const monto = parseFloat(g?.monto || '0');
              return acc + (isNaN(monto) ? 0 : monto);
            }, 0)
        : 0;
      if (gastosMesAnterior > 0) {
        const trend =
          ((gastosMesActual - gastosMesAnterior) / gastosMesAnterior) * 100;
        gastosTrend = `${trend.toFixed(1)}% respecto al mes anterior`;
      } else if (gastosMesActual > 0) {
        gastosTrend = "+100% mes actual";
      }
    } else {
      // Sin filtro, tendencia global
      const now = new Date();
      const mesActual = now.getMonth();
      const anioActual = now.getFullYear();
      const gastosMesActual = gastos
        .filter((g) => {
          const fecha = new Date(g.createdAt);
          return (
            fecha.getMonth() === mesActual && fecha.getFullYear() === anioActual
          );
        })
        .reduce((acc, g) => acc + parseFloat(g.monto), 0);
      const mesAnterior = mesActual === 0 ? 11 : mesActual - 1;
      const anioMesAnterior = mesActual === 0 ? anioActual - 1 : anioActual;
      const gastosMesAnterior = gastos
        .filter((g) => {
          const fecha = new Date(g.createdAt);
          return (
            fecha.getMonth() === mesAnterior &&
            fecha.getFullYear() === anioMesAnterior
          );
        })
        .reduce((acc, g) => acc + parseFloat(g.monto), 0);
      if (gastosMesAnterior > 0) {
        const trend =
          ((gastosMesActual - gastosMesAnterior) / gastosMesAnterior) * 100;
        gastosTrend = `${trend.toFixed(1)}% respecto al mes anterior`;
      } else if (gastosMesActual > 0) {
        gastosTrend = "+100% mes actual";
      }
    }

    dispatch({
      type: "SET_FILTERED_STATS",
      payload: {
        totalVentas,
        ventasTrend,
        totalProductos: productosFiltrados.length,
        totalClientes: clientesFiltrados.length,
        totalCajas: cajasFiltradas.length,
        productsLast7Days,
        clientsLast7Days,
        activeCajasTrend,
        totalGastos,
        gastosTrend,
      },
    });
  }, [
    periodoEstadisticas,
    startEstadisticas,
    endEstadisticas,
    ventas,
    productos,
    clientes,
    cajas,
    selectedEstadisticasCajaId,
    filteredVentas,
    filteredProductos,
    filteredClientes,
    gastos
  ]);

  useEffect(() => {
    const today = new Date();
    const filteredVentas = ventas.filter((venta) => {
      const ventaDate = new Date(venta.fecha);
      const diffDays = Math.floor(
        (today.getTime() - ventaDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      return diffDays <= 7;
    });

    const groupedSales = filteredVentas.reduce((acc, venta) => {
      const date = new Date(venta.fecha);
      let key;

      switch (salesPeriod) {
        case "7days":
          key = date.toLocaleDateString("es-GT", { weekday: "short" });
          break;
        case "30days":
          key = date.getDate().toString();
          break;
        case "365days":
          key = date.toLocaleDateString("es-GT", { month: "short" });
          break;
        default:
          key = date.toLocaleDateString("es-GT", { weekday: "short" });
      }

      acc[key] = (acc[key] || 0) + parseFloat(venta.total);
      return acc;
    }, {} as Record<string, number>);

    const chartData = Object.entries(groupedSales).map(([name, ventas]) => ({
      name,
      ventas,
    }));

    // Sort data based on period
    if (salesPeriod === "30days") {
      chartData.sort((a, b) => parseInt(a.name) - parseInt(b.name));
    }

    dispatch({ type: "SET_FIELD", field: "salesData", value: chartData });
  }, [ventas, salesPeriod]);

  useEffect(() => {
    const today = new Date();
    const filteredVentas = ventas.filter((venta) => {
      const ventaDate = new Date(venta.fecha);
      const diffMonths =
        today.getMonth() -
        ventaDate.getMonth() +
        12 * (today.getFullYear() - ventaDate.getFullYear());
      return (
        diffMonths <=
        (categoryPeriod === "month" ? 1 : categoryPeriod === "quarter" ? 3 : 12)
      );
    });

    const categoryTotals = categorias.map((categoria) => {
      const categoryProducts = productos.filter(
        (p) => p.categoriaId === categoria.id
      );
      const total = filteredVentas.reduce((acc, venta) => {
        return acc + parseFloat(venta.total) / categorias.length;
      }, 0);

      return {
        name: categoria.nombre,
        value: total,
      };
    });

    dispatch({
      type: "SET_FIELD",
      field: "categoryData",
      value: categoryTotals,
    });
  }, [ventas, categoryPeriod, categorias, productos]);

  useEffect(() => {
    const months = trendPeriod === "6months" ? 6 : 12;
    const data = [];
    const today = new Date();

    for (let i = months - 1; i >= 0; i--) {
      const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const monthName = date.toLocaleDateString("es-GT", { month: "short" });

      const monthVentas = ventas.filter((venta) => {
        const ventaDate = new Date(venta.fecha);
        return (
          ventaDate.getMonth() === date.getMonth() &&
          ventaDate.getFullYear() === date.getFullYear()
        );
      });

      const total = monthVentas.reduce(
        (acc, venta) => acc + parseFloat(venta.total),
        0
      );

      data.push({
        name: monthName,
        ventas: total,
      });
    }

    dispatch({ type: "SET_FIELD", field: "trendData", value: data });
  }, [ventas, trendPeriod]);

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  const stats = filteredStats;
  const recentSales = [...ventas]
    .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
    .slice(0, 3);

  const getTrendPercentage = (initial: number, final: number) => {
    if (initial === 0) return final === 0 ? "0%" : "+100%";
    const percent = ((final - initial) / Math.abs(initial)) * 100;
    const sign = percent > 0 ? "+" : "";
    return `${sign}${percent.toFixed(1)}%`;
  };

  return (
    <Layout>
      <motion.div
        className="space-y-8"
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
        <motion.div variants={itemVariants}>
          <div className="mb-4">
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground">
              Vista general del sistema de ventas.
            </p>
          </div>
        </motion.div>

        <div className="flex justify-between items-center mt-4 mb-2">
          <h2 className="text-xl font-semibold">Cuadre de Activos</h2>
          <FilterCuadre
            periodFilter={periodFilter}
            setPeriodFilter={(value) =>
              dispatch({ type: "SET_FIELD", field: "periodFilter", value })
            }
            startDate={startDate}
            endDate={endDate}
            setStartDate={(value) =>
              dispatch({ type: "SET_FIELD", field: "startDate", value })
            }
            setEndDate={(value) =>
              dispatch({ type: "SET_FIELD", field: "endDate", value })
            }
            selectedCajaId={selectedCajaId}
            setSelectedCajaId={(value) =>
              dispatch({ type: "SET_FIELD", field: "selectedCajaId", value })
            }
            cajas={cajas}
          />
        </div>
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
          variants={containerVariants}
          initial="hidden"
          animate="show"
        >
          {selectedCajaId && (
            <>
              {(() => {
                const cajaIdNum = parseInt(selectedCajaId);

                const hoy = new Date();
                let desde: Date | null = null;
                let hasta: Date | null = null;

                // Función para normalizar fechas al inicio del día en hora local
                const normalizarFechaInicioDia = (fecha: Date) => {
                  const local = new Date(fecha);
                  return new Date(local.getFullYear(), local.getMonth(), local.getDate());
                };
                
                // Función para normalizar fechas al final del día en hora local
                const normalizarFechaFinDia = (fecha: Date) => {
                  const local = new Date(fecha);
                  return new Date(local.getFullYear(), local.getMonth(), local.getDate(), 23, 59, 59, 999);
                };

                if (periodFilter === "hoy") {
                  desde = normalizarFechaInicioDia(hoy);
                  hasta = normalizarFechaFinDia(hoy);
                } else if (periodFilter === "ayer") {
                  const ayer = new Date(hoy);
                  ayer.setDate(hoy.getDate() - 1);
                  desde = normalizarFechaInicioDia(ayer);
                  hasta = normalizarFechaFinDia(ayer);
                } else if (periodFilter === "7dias") {
                  desde = new Date(hoy);
                  desde.setDate(hoy.getDate() - 7);
                  hasta = new Date(
                    hoy.getFullYear(),
                    hoy.getMonth(),
                    hoy.getDate() + 1
                  );
                } else if (periodFilter === "1mes") {
                  desde = new Date(hoy);
                  desde.setMonth(hoy.getMonth() - 1);
                  hasta = new Date(
                    hoy.getFullYear(),
                    hoy.getMonth(),
                    hoy.getDate() + 1
                  );
                } else if (periodFilter === "rango" && startDate && endDate) {
                  desde = startDate;
                  hasta = new Date(endDate);
                  hasta.setDate(hasta.getDate() + 1);
                }

                console.log('=== DEBUG VENTAS CAJA ===');
                console.log('Caja seleccionada ID:', cajaIdNum, 'Tipo:', typeof cajaIdNum);
                console.log('Total de ventas:', ventas.length);
                console.log('Ventas con cajaId coincidente:', ventas.filter(v => {
                  const id = typeof v.cajaId === 'string' ? parseInt(v.cajaId, 10) : v.cajaId;
                  return id === cajaIdNum;
                }).length);
                
                // Función para normalizar fechas sin ajustes de zona horaria
                const normalizeToLocalDate = (dateStr: string | Date) => {
                  if (!dateStr) {
                    console.error('Fecha vacía recibida');
                    return null;
                  }
                  try {
                    // Si ya es un objeto Date, devolverlo directamente
                    if (dateStr instanceof Date) {
                      return dateStr;
                    }
                    
                    // Si es un string con formato ISO (incluye hora)
                    if (dateStr.includes('T') || dateStr.includes('Z')) {
                      const date = new Date(dateStr);
                      // Asegurarse de que la fecha sea válida
                      if (isNaN(date.getTime())) {
                        console.error('Fecha ISO inválida:', dateStr);
                        return null;
                      }
                      return date;
                    }
                    
                    // Si es un string con formato YYYY-MM-DD
                    const [year, month, day] = dateStr.split('-').map(Number);
                    if (isNaN(year) || isNaN(month) || isNaN(day)) {
                      console.error('Formato de fecha inválido (YYYY-MM-DD):', dateStr);
                      return null;
                    }
                    
                    // Crear fecha en la zona horaria local sin ajustes
                    // Usar el constructor de Date con componentes individuales para evitar problemas de zona horaria
                    return new Date(Date.UTC(year, month - 1, day, 0, 0, 0));
                  } catch (e) {
                    console.error('Error al normalizar fecha:', dateStr, e);
                    return null;
                  }
                };

                console.log('=== EJEMPLO DE VENTAS ===');
                ventas.slice(0, 3).forEach((v, i) => {
                  console.log(`Venta ${i + 1}:`, {
                    id: v.id,
                    cajaId: v.cajaId,
                    tipoCajaId: typeof v.cajaId,
                    fecha: v.fecha,
                    total: v.total,
                    fechaNormalizada: normalizeToLocalDate(v.fecha)?.toISOString()
                  });
                });

                console.log('Rango de fechas de filtrado:', { 
                  desde: desde?.toISOString(), 
                  hasta: hasta?.toISOString(),
                  periodFilter,
                  desdeLocal: desde?.toLocaleString(),
                  hastaLocal: hasta?.toLocaleString()
                });

                const ventasCaja = ventas.filter((v) => {
                  try {
                    // Asegurar que los tipos coincidan para la comparación de cajaId
                    const vCajaId = typeof v.cajaId === 'string' ? parseInt(v.cajaId, 10) : v.cajaId;
                    
                    // Si no coincide la caja, descartar de inmediato
                    if (vCajaId !== cajaIdNum) return false;
                    
                    // Usar la fecha de creación (createdAt) que incluye la hora local
                    // Convertir la fecha de la base de datos a objeto Date
                    const fechaVenta = new Date(v.createdAt || v.fecha);
                    // Formatear a 'YYYY-MM-DD' en la zona horaria local
                    const fechaVentaStr = formatDate(fechaVenta);
                    
                    // Para el filtro 'hoy', comparar con la fecha actual en la zona horaria local
                    if (periodFilter === 'hoy') {
                      // Obtener la fecha actual en la zona horaria local
                      const ahora = new Date();
                      const hoyLocal = formatDate(ahora);
                      
                      // Comparar las fechas como strings en formato 'YYYY-MM-DD'
                      const cumple = fechaVentaStr === hoyLocal;
                      
                      console.log('=== COMPARACIÓN DE FECHAS (HOY) ===');
                      console.log('Venta ID:', v.id);
                      console.log('Fecha venta (BD):', fechaVentaStr);
                      console.log('Hoy (local):', hoyLocal);
                      console.log('Hora actual (local):', ahora.toString());
                      console.log('Hora actual (UTC):', ahora.toISOString());
                      console.log('¿Coincide?', cumple);
                      
                      return cumple;
                    }
                    
                    // Para el filtro 'ayer', usar la fecha de ayer en formato 'YYYY-MM-DD'
                    if (periodFilter === 'ayer') {
                      // Obtener la fecha de ayer en la zona horaria local
                      const ayer = new Date();
                      ayer.setDate(ayer.getDate() - 1);
                      const ayerStr = formatDate(ayer);
                      
                      // Comparar las fechas como strings en formato 'YYYY-MM-DD'
                      const cumple = fechaVentaStr === ayerStr;
                      
                      console.log('=== COMPARACIÓN DE FECHAS (AYER) ===');
                      console.log('Venta ID:', v.id);
                      console.log('Fecha venta (BD):', fechaVentaStr);
                      console.log('Ayer (local):', ayerStr);
                      console.log('Hora actual (local):', new Date().toString());
                      console.log('Hora actual (UTC):', new Date().toISOString());
                      console.log('¿Coincide?', cumple);
                      
                      return cumple;
                    }
                    
                    // Para rangos personalizados, usar las fechas directamente
                    if (desde && hasta) {
                      // Asegurarse de que desde y hasta son strings o Date
                      const desdeDate = typeof desde === 'string' ? new Date(desde) : new Date(desde);
                      const hastaDate = typeof hasta === 'string' ? new Date(hasta) : new Date(hasta);
                      
                      // Formatear a YYYY-MM-DD
                      const formatDate = (date: Date): string => {
                        const year = date.getFullYear();
                        const month = String(date.getMonth() + 1).padStart(2, '0');
                        const day = String(date.getDate()).padStart(2, '0');
                        return `${year}-${month}-${day}`;
                      };
                      
                      const desdeStr = formatDate(desdeDate);
                      const hastaStr = formatDate(hastaDate);
                      
                      const cumpleRango = fechaVentaStr >= desdeStr && fechaVentaStr <= hastaStr;
                      
                      console.log('=== COMPARACIÓN DE FECHAS (RANGO) ===');
                      console.log('Venta ID:', v.id);
                      console.log('Fecha venta (BD):', fechaVentaStr);
                      console.log('Rango:', { desde: desdeStr, hasta: hastaStr });
                      console.log('¿Está en rango?', cumpleRango);
                      
                      return cumpleRango;
                    }
                    
                    // Si no hay filtro de fechas, incluir todas las ventas de la caja
                    return true;
                    
                  } catch (error) {
                    console.error('Error al procesar venta:', v.id, error);
                    return false;
                  }
                });

                console.log('=== RESULTADOS DEL FILTRADO ===');
                console.log(`Ventas encontradas para la caja ${cajaIdNum}:`, ventasCaja.length, 'de', ventas.length, 'ventas totales');
                
                // Verificar si hay ventas para esta caja que no pasaron el filtro
                const ventasDeEstaCaja = ventas.filter(v => {
                  const id = typeof v.cajaId === 'string' ? parseInt(v.cajaId, 10) : v.cajaId;
                  return id === cajaIdNum;
                });
                
                console.log(`Ventas totales para caja ${cajaIdNum}:`, ventasDeEstaCaja.length);
                
                if (ventasCaja.length === 0 && ventasDeEstaCaja.length > 0) {
                  console.warn('¡Hay ventas para esta caja pero no coinciden con el filtro de fecha!');
                  console.log('Ejemplo de ventas de esta caja (primeras 3):', 
                    ventasDeEstaCaja.slice(0, 3).map(v => ({
                      id: v.id,
                      fecha: v.fecha,
                      total: v.total,
                      cajaId: v.cajaId
                    }))
                  );
                }
                
                // Mostrar resumen de montos
                if (ventasCaja.length > 0) {
                  const totalVentas = ventasCaja.reduce((sum, v) => sum + parseFloat(v.total), 0);
                  console.log('Total de ventas en el período:', formatCurrency(totalVentas));
                  console.log('Primeras 3 ventas del período:', 
                    ventasCaja.slice(0, 3).map(v => ({
                      id: v.id,
                      fecha: v.fecha,
                      total: v.total
                    }))
                  );
                }

                const codigosVentasCaja = ventasCaja.map((v) => v.codigo);

                const detallesCaja = ventaDetalles.filter((d) => {
                  const venta = ventasCaja.find(
                    (v) => v.codigo === d.ventaCodigo
                  );
                  return !!venta;
                });

                const gastosCaja = filtrarGastos(
                  gastos,
                  periodFilter,
                  startDate,
                  endDate,
                  cajaIdNum // Pasar el cajaId como parámetro para filtrar
                );

                // --- Calcular montos iniciales para el periodo ---
                // Buscar el saldo inicial de la caja en el inicio del periodo
                let saldoInicial = 0;
                const caja = cajas.find((c) => c.id === cajaIdNum);
                if (caja && caja.saldoInicial !== undefined) {
                  saldoInicial = parseFloat(caja.saldoInicial) || 0;
                } else {
                  // Si no hay saldoInicial, usar 0
                  saldoInicial = 0;
                }
                // Balance general: ingresos - gastos
                const totalIngresos = (ventasCaja || []).reduce(
                  (acc, v) => acc + (parseFloat(v?.total) || 0),
                  0
                );
                const totalGastos = (gastosCaja || []).reduce(
                  (acc, g) => acc + (parseFloat(g?.monto) || 0),
                  0
                );
                const balanceGeneral = totalIngresos - totalGastos;
                // Utilidades: ingresos - compras - gastos
                const totalCompras = (detallesCaja || []).reduce(
                  (acc, d) => acc + (parseFloat(d?.precioCompra) || 0) * (d?.cantidad || 0),
                  0
                );
                const utilidades = totalIngresos - totalCompras - totalGastos;
                // --- Calcular porcentaje de mejora respecto al saldo inicial ---
                const balanceTrend = getTrendPercentage(
                  saldoInicial,
                  saldoInicial + balanceGeneral
                );
                const utilidadesTrend = getTrendPercentage(
                  saldoInicial,
                  saldoInicial + utilidades
                );

                // Initialize gastosCaja as empty array if undefined
                const safeGastosCaja = gastosCaja || [];
                const safeDetallesCaja = detallesCaja || [];
                
                // Debug: Log all products and their status
                console.log('=== DEBUG PRODUCTOS ===');
                console.log('Total productos:', productos?.length || 0);
                console.log('Ejemplo de producto:', productos?.[0]);
                
                // Filtrar productos activos
                const productosActivos = (productos || []).filter(p => {
                  const isActive = p?.estado?.toLowerCase() === 'activo';
                  console.log(`Producto ID: ${p?.id}, Estado: ${p?.estado}, Activo: ${isActive}`);
                  return isActive;
                });
                
                console.log('Productos activos encontrados:', productosActivos.length);
                
                // Filtrar productos por período si hay fechas definidas
                const productosFiltrados = desde && hasta 
                  ? productosActivos.filter(p => {
                      const fechaStr = p.fechaCreacion || p.createdAt || p.fecha_creacion;
                      console.log(`Producto ID: ${p.id}, Fecha: ${fechaStr}`);
                      
                      if (!fechaStr) return false;
                      
                      // Parsear la fecha del producto
                      const fechaProducto = parseDate(fechaStr);
                      if (!fechaProducto) {
                        console.warn(`Fecha inválida para producto ${p.id}:`, fechaStr);
                        return false;
                      }
                      
                      // Normalizar fechas a mediodía para evitar problemas de zona horaria
                      fechaProducto.setHours(12, 0, 0, 0);
                      
                      // Crear copias de las fechas de filtro para no modificar las originales
                      const desdeDate = new Date(desde);
                      const hastaDate = new Date(hasta);
                      
                      // Normalizar fechas de filtro a mediodía
                      desdeDate.setHours(12, 0, 0, 0);
                      hastaDate.setHours(12, 0, 0, 0);
                      
                      // Verificar si la fecha del producto está dentro del rango
                      return fechaProducto >= desdeDate && fechaProducto <= hastaDate;
                    })
                  : productosActivos;
                  
                console.log('Productos después de filtrar por fecha:', productosFiltrados.length);

                return (
                  <>
                    <div className="bg-card p-4 rounded-lg border shadow flex flex-col h-full">
                      <div className="flex-1">
                        <div className="h-full">
                          <p className="text-sm font-medium text-muted-foreground">Balance General</p>
                          <p className="text-2xl font-bold">{formatCurrency(balanceGeneral)}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-card p-4 rounded-lg border shadow flex flex-col h-full">
                      <div className="flex-1">
                        <div className="h-full">
                          <p className="text-sm font-medium text-muted-foreground">Utilidades</p>
                          <p className="text-2xl font-bold">{formatCurrency(utilidades)}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-card p-4 rounded-lg border shadow flex flex-col h-full">
                      <div className="flex-1 flex flex-col">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-sm font-medium text-muted-foreground">Gastos y Compras</p>
                        </div>
                        
                        <div className="space-y-3 flex-1 flex flex-col justify-between">
                          <div className="space-y-2">
                            {/* Gastos */}
                            <div className="flex items-center justify-between">
                              <div className="flex items-center">
                                <span className="w-2.5 h-2.5 rounded-full bg-red-500 mr-2"></span>
                                <span className="text-sm font-medium">Gastos</span>
                              </div>
                              <div className="flex items-center">
                                <span className="text-red-500 font-medium text-sm sm:text-base">-{formatCurrency(totalGastos || 0)}</span>
                                <span className="ml-2 text-xs text-muted-foreground hidden sm:inline">
                                  ({safeGastosCaja.length} {safeGastosCaja.length === 1 ? 'reg.' : 'regs.'})
                                </span>
                              </div>
                            </div>
                            
                            {/* Compras */}
                            <div className="flex items-center justify-between">
                              <div className="flex items-center">
                                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 mr-2"></span>
                                <span className="text-sm font-medium">Compras</span>
                              </div>
                              <div className="flex items-center">
                                <span className="text-amber-500 font-medium text-sm sm:text-base">-{formatCurrency(totalCompras || 0)}</span>
                                <span className="ml-2 text-xs text-muted-foreground hidden sm:inline">
                                  ({safeDetallesCaja.length} {safeDetallesCaja.length === 1 ? 'reg.' : 'regs.'})
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          {/* Total */}
                          <div className="border-t border-border pt-2 mt-auto">
                            <div className="flex items-center justify-between font-medium">
                              <span className="text-sm sm:text-base">Total</span>
                              <span className="text-red-500 text-base sm:text-lg">-{formatCurrency(totalGastos + totalCompras)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-card p-4 rounded-lg border shadow flex flex-col h-full">
                      <div className="flex-1">
                        <div className="flex items-center justify-between h-full">
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Productos Activos</p>
                            <p className="text-2xl font-bold">{productosActivos.length}</p>
                          </div>
                          <div className="text-muted-foreground text-right">
                            <p className="text-sm whitespace-nowrap">
                              Total de productos
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                );
              })()}
            </>
          )}
        </motion.div>

        <div className="flex justify-between items-center mt-6 mb-2">
          <h2 className="text-xl font-semibold">Estadísticas del negocio</h2>
          <FilterEstadisticas
            periodoEstadisticas={periodoEstadisticas}
            setPeriodoEstadisticas={(value) =>
              dispatch({
                type: "SET_FIELD",
                field: "periodoEstadisticas",
                value,
              })
            }
            startEstadisticas={startEstadisticas}
            endEstadisticas={endEstadisticas}
            setStartEstadisticas={(value) =>
              dispatch({ type: "SET_FIELD", field: "startEstadisticas", value })
            }
            setEndEstadisticas={(value) =>
              dispatch({ type: "SET_FIELD", field: "endEstadisticas", value })
            }
            cajas={cajas.map((c) => ({ id: c.id, nombre: c.nombre }))}
            selectedCajaId={selectedEstadisticasCajaId}
            setSelectedCajaId={(value) =>
              dispatch({
                type: "SET_FIELD",
                field: "selectedEstadisticasCajaId",
                value,
              })
            }
          />
        </div>
        
        <motion.div
          className="grid grid-cols-1 lg:grid-cols-3 gap-6"
          variants={containerVariants}
        >
          <motion.div className="lg:col-span-2" variants={chartVariants}>
            <div className="bg-transparent p-6 rounded-xl border shadow-sm space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Resumen de Ventas</h2>
                <Select
                  defaultValue={salesPeriod}
                  onValueChange={(value) =>
                    dispatch({ type: "SET_FIELD", field: "salesPeriod", value })
                  }
                >
                  <SelectTrigger className="w-[180px] bg-transparent text-foreground">
                    <SelectValue placeholder="Seleccionar período" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7days">Últimos 7 días</SelectItem>
                    <SelectItem value="30days">Último mes</SelectItem>
                    <SelectItem value="365days">Último año</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={salesData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--background))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '0.5rem',
                        padding: '0.5rem 1rem',
                        color: 'hsl(var(--foreground))'
                      }}
                      labelStyle={{ color: 'hsl(var(--muted-foreground))' }}
                      formatter={(value) => [formatCurrency(Number(value)), 'Ventas']}
                    />
                    <Bar
                      dataKey="ventas"
                      fill="#3b82f6"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </motion.div>

          <motion.div variants={chartVariants}>
            <div className="bg-transparent p-6 rounded-xl border shadow-sm">
              <h2 className="text-xl font-semibold mb-4">Ventas Recientes</h2>
              <div className="space-y-3">
                {recentSales.slice(0, 5).map((sale) => {
                  const total = typeof sale.total === 'string' ? parseFloat(sale.total) : sale.total;
                  return (
                    <div 
                      key={sale.id}
                      className="flex items-center justify-between p-3 bg-card rounded-lg border"
                    >
                      <div>
                        <p className="font-medium">
                          {sale.cliente?.nombre || 'Cliente no especificado'}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(sale.fecha).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">
                          {formatCurrency(total)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {sale.estado || 'Completada'}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        </motion.div>

        <motion.div
          className="grid grid-cols-1 lg:grid-cols-2 gap-6"
          variants={containerVariants}
        >
          <motion.div
            className="bg-transparent p-6 rounded-xl border shadow-sm space-y-4"
            variants={chartVariants}
          >
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Ventas por Categoría</h2>
              <Select
                defaultValue={categoryPeriod}
                onValueChange={(value) =>
                  dispatch({
                    type: "SET_FIELD",
                    field: "categoryPeriod",
                    value,
                  })
                }
              >
                <SelectTrigger className="w-[180px] bg-transparent text-foreground">
                  <SelectValue placeholder="Seleccionar período" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="month">Este mes</SelectItem>
                  <SelectItem value="quarter">Último trimestre</SelectItem>
                  <SelectItem value="year">Este año</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) =>
                      `${name} ${(percent * 100).toFixed(0)}%`
                    }
                  >
                    {categoryData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => formatCurrency(value as number)}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          <motion.div
            className="bg-transparent p-6 rounded-xl border shadow-sm space-y-4"
            variants={chartVariants}
          >
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Tendencia Mensual</h2>
              <Select
                defaultValue={trendPeriod}
                onValueChange={(value) =>
                  dispatch({ type: "SET_FIELD", field: "trendPeriod", value })
                }
              >
                <SelectTrigger className="w-[180px] bg-transparent text-foreground">
                  <SelectValue placeholder="Seleccionar período" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="6months">Últimos 6 meses</SelectItem>
                  <SelectItem value="12months">Último año</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={trendData}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '0.5rem',
                      padding: '0.5rem 1rem',
                      color: 'hsl(var(--foreground))'
                    }}
                    labelStyle={{ color: 'hsl(var(--muted-foreground))' }}
                    formatter={(value) => [formatCurrency(Number(value)), 'Ventas']}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="ventas"
                    stroke="#3b82f6"
                    activeDot={{ r: 8 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        </motion.div>

        <motion.div
          className="bg-transparent p-6 rounded-xl border shadow-sm"
          variants={chartVariants}
        >
          <h2 className="text-xl font-semibold mb-4">Productos Populares</h2>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 font-medium">Producto</th>
                  <th className="text-left py-3 font-medium">Código</th>
                  <th className="text-left py-3 font-medium">Categoría</th>
                  <th className="text-left py-3 font-medium">Precio</th>
                  <th className="text-left py-3 font-medium">Stock</th>
                </tr>
              </thead>
              <tbody>
                {productos.map((producto) => {
                  const categoria = categorias.find(
                    (c) => c.id === producto.categoriaId
                  );

                  return (
                    <tr
                      key={producto.id}
                      className="border-b last:border-0 hover:bg-muted/50"
                    >
                      <td className="py-3">{producto.nombre}</td>
                      <td className="py-3">{producto.codigo}</td>
                      <td className="py-3">{categoria?.nombre}</td>
                      <td className="py-3">
                        {formatCurrency(producto.precioVenta)}
                      </td>
                      <td className="py-3">
                        <div className="inline-flex items-center">
                          <span
                            className={`h-2 w-2 rounded-full mr-2 ${
                              producto.stockTotal > 50
                                ? "bg-green-500"
                                : producto.stockTotal > 10
                                ? "bg-yellow-500"
                                : "bg-red-500"
                            }`}
                          ></span>
                          {producto.stockTotal}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </motion.div>
      </motion.div>
    </Layout>
  );
};

// Tipo para los elementos que pueden ser filtrados
type FiltrableItem = Venta | Producto | Cliente | Gasto;

// Función para normalizar empresaId a number
const normalizarEmpresaId = (id: unknown): number => {
  if (id === null || id === undefined) return 0;
  if (typeof id === 'number') return id;
  if (typeof id === 'string') {
    const parsed = parseInt(id, 10);
    return isNaN(parsed) ? 0 : parsed;
  }
  return 0;
};

// Función auxiliar para normalizar fechas al inicio del día (00:00:00)
const normalizeToStartOfDay = (date: Date): Date => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

// Función auxiliar para normalizar fechas al final del día (23:59:59.999)
const normalizeToEndOfDay = (date: Date): Date => {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
};

// Función para convertir una fecha a formato YYYY-MM-DD
const toISODateString = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Función para normalizar una fecha a objeto Date en la zona horaria local
const parseLocalDate = (date: string | Date | null | undefined): Date | null => {
  if (!date) return null;
  
  if (date instanceof Date) {
    return new Date(date.getTime());
  }
  
  // Si es un string en formato YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    // Crear la fecha en la zona horaria local
    const [year, month, day] = date.split('-').map(Number);
    return new Date(year, month - 1, day);
  }
  
  // Para otros formatos, intentar parsear con Date
  const parsed = new Date(date);
  return isNaN(parsed.getTime()) ? null : parsed;
};

// Interfaz para elementos que pueden tener un ID opcional
interface ItemWithOptionalId {
  id?: string | number;
  // Otras propiedades comunes que podrían existir en los ítems
  [key: string]: string | number | boolean | Date | null | undefined;
}

// Función genérica para filtrar por rango de fechas
function filtrarPorRangoFechas<T extends ItemWithOptionalId>(
  params: {
    items: T[];
    getDateFn: (item: T) => string | Date | null | undefined;
    periodo?: string;
    start?: Date | string;
    end?: Date | string;
  }
): T[] {
  const { items, getDateFn, periodo = 'todos', start, end } = params;
  
  // Si no hay items, retornar array vacío
  if (!items || items.length === 0) {
    return [];
  }

  // Si el período es 'todos', retornar todos los items
  if (periodo === 'todos') {
    return items;
  }

  // Obtener fechas de inicio y fin como strings en formato YYYY-MM-DD
  let desdeStr: string | null = null;
  let hastaStr: string | null = null;

  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  // Función para formatear fecha a YYYY-MM-DD usando la zona horaria local
  const formatDate = (date: Date): string => {
    // Usar los métodos getFullYear, getMonth, getDate que ya devuelven en la zona horaria local
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  
  // Función para obtener la fecha actual en la zona horaria local
  const getTodayLocal = (): string => {
    const now = new Date();
    // Ajustar al mediodía para evitar problemas con cambios de horario
    now.setHours(12, 0, 0, 0);
    return formatDate(now);
  };

  switch (periodo) {
    case 'hoy': {
      // Usar la fecha actual en formato YYYY-MM-DD con la zona horaria local
      const hoyStr = getTodayLocal();
      desdeStr = hoyStr;
      hastaStr = hoyStr;
      
      console.log('Filtro HOY:', { 
        desde: desdeStr, 
        hasta: hastaStr,
        fechaLocal: new Date().toString(),
        fechaISO: new Date().toISOString()
      });
      break;
    }
    case 'ayer': {
      // Obtener la fecha de ayer
      const ayer = new Date();
      ayer.setDate(ayer.getDate() - 1);
      const ayerStr = formatDate(ayer);
      
      desdeStr = ayerStr;
      hastaStr = ayerStr;
      
      console.log('Filtro AYER:', { 
        desde: desdeStr, 
        hasta: hastaStr
      });
      break;
    }
    case 'semana': {
      // Obtener el primer día de la semana (lunes)
      const hoy = new Date();
      const dia = hoy.getDay();
      const diff = hoy.getDate() - dia + (dia === 0 ? -6 : 1); // Ajuste para que la semana empiece en lunes
      const primerDiaSemana = new Date(hoy);
      primerDiaSemana.setDate(diff);
      
      // Obtener el último día de la semana (domingo)
      const ultimoDiaSemana = new Date(primerDiaSemana);
      ultimoDiaSemana.setDate(primerDiaSemana.getDate() + 6);
      
      // Formatear fechas
      desdeStr = formatDate(primerDiaSemana);
      hastaStr = formatDate(ultimoDiaSemana);
      
      console.log('Filtro SEMANA:', { 
        desde: desdeStr, 
        hasta: hastaStr
      });
      break;
    }
    case 'mes': {
      // Obtener el primer día del mes actual
      const hoy = new Date();
      const primerDiaMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
      
      // Obtener el último día del mes actual
      const ultimoDiaMes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);
      
      // Formatear fechas
      desdeStr = formatDate(primerDiaMes);
      hastaStr = formatDate(ultimoDiaMes);
      
      console.log('Filtro MES:', { 
        desde: desdeStr, 
        hasta: hastaStr
      });
      break;
    }
    case 'rango': {
      if (!start || !end) return items;
      
      // Si se proporcionan fechas personalizadas, formatearlas correctamente
      if (typeof start === 'string') {
        // Si la fecha incluye hora, tomar solo la parte de la fecha
        desdeStr = start.includes('T') ? start.split('T')[0] : start;
      } else {
        desdeStr = formatDate(start);
      }
      
      if (typeof end === 'string') {
        hastaStr = end.includes('T') ? end.split('T')[0] : end;
      } else {
        hastaStr = formatDate(end);
      }
      
      console.log('Filtro RANGO PERSONALIZADO:', { 
        desde: desdeStr, 
        hasta: hastaStr
      });
      break;
    }
    default:
      return items;
  }

  // Si no se pudieron determinar las fechas, retornar todos los items
  if (!desdeStr || !hastaStr) {
    console.warn('No se pudieron determinar las fechas de filtrado');
    return items;
  }

  console.log('Filtrando entre', desdeStr, 'y', hastaStr);

  // Filtrar los ítems usando las fechas exactamente como vienen de la base de datos
  return items.filter(item => {
    const itemDate = getDateFn(item);
    if (!itemDate) return false;
    
    // Obtener la fecha como string (ya debería estar en formato YYYY-MM-DD)
    let itemDateStr = String(itemDate);
    
    // Si por alguna razón la fecha incluye hora, tomar solo la parte de la fecha
    if (itemDateStr.includes('T')) {
      itemDateStr = itemDateStr.split('T')[0];
    }
    
    // Para depuración: mostrar solo las fechas que nos interesan
    const showDebug = itemDateStr === '2025-11-11' || itemDateStr === '2025-11-10';
    
    if (showDebug) {
      console.log('=== FILTRO FECHA ===');
      console.log('ID del ítem:', item.id);
      console.log('Fecha en BD (raw):', itemDate);
      console.log('Fecha normalizada:', itemDateStr);
      console.log('Rango de filtro:', { desde: desdeStr, hasta: hastaStr });
    }
    
    // Comparar directamente como strings
    const cumple = itemDateStr >= desdeStr && itemDateStr <= hastaStr;
    
    if (showDebug) {
      console.log('¿Cumple el filtro?', cumple);
    }
    
    return cumple;
  });
}

// Función auxiliar para normalizar fechas
const normalizarFecha = (fecha: string | Date | null | undefined): Date | null => {
  if (!fecha) return null;
  
  // Si ya es un objeto Date y es válido
  if (fecha instanceof Date && !isNaN(fecha.getTime())) {
    return normalizeToStartOfDay(fecha);
  }
  
  // Si es un string, intentar parsearlo
  if (typeof fecha === 'string') {
    // Si la fecha termina en 'T00:00:00.000Z', manejarla como fecha sin hora
    if (fecha.endsWith('T00:00:00.000Z')) {
      const [year, month, day] = fecha.substring(0, 10).split('-').map(Number);
      return new Date(year, month - 1, day);
    }
    
    // Intentar con el formato ISO
    const parsed = new Date(fecha);
    if (!isNaN(parsed.getTime())) {
      return normalizeToStartOfDay(parsed);
    }
    
    // Intentar con formato de fecha local (dd/mm/yyyy)
    const parts = fecha.split(/[-/]/);
    if (parts.length === 3) {
      const [day, month, year] = parts.map(Number);
      const parsedLocal = new Date(year, month - 1, day);
      if (!isNaN(parsedLocal.getTime())) return parsedLocal;
    }
  }

  return null;
}

// Función utilitaria para filtrar productos por fecha de creación
function filtrarProductos(productos: Producto[], periodo: string, start?: Date | string, end?: Date | string): Producto[] {
  console.log(`Filtrando ${productos?.length || 0} productos con periodo:`, periodo);
  
  if (!productos || productos.length === 0) {
    console.warn('No hay productos para filtrar');
    return [];
  }

  const productosFiltrados = filtrarPorRangoFechas<Producto>({
    items: productos,
    getDateFn: p => p.createdAt,
    periodo,
    start,
    end
  });

  console.log(`Productos filtrados: ${productosFiltrados.length} de ${productos.length}`);
  
  // Si no hay productos en el rango, mostrar los últimos 5 como referencia
  if (productosFiltrados.length === 0 && productos.length > 0) {
    console.warn('No se encontraron productos en el rango especificado. Últimos 5 productos:', 
      productos.slice(0, 5).map(p => ({
        id: p.id,
        nombre: p.nombre,
        createdAt: p.createdAt,
        empresaId: p.empresaId
      }))
    );
  }
  
  return productosFiltrados;
}

// Función utilitaria para filtrar clientes por fecha de creación
function filtrarClientes(clientes: Cliente[], periodo: string, start?: Date | string, end?: Date | string): Cliente[] {
  console.log(`Filtrando ${clientes?.length || 0} clientes con periodo:`, periodo);
  
  if (!clientes || clientes.length === 0) {
    console.warn('No hay clientes para filtrar');
    return [];
  }

  const clientesFiltrados = filtrarPorRangoFechas<Cliente>({
    items: clientes,
    getDateFn: c => c.createdAt,
    periodo,
    start,
    end
  });

  console.log(`Clientes filtrados: ${clientesFiltrados.length} de ${clientes.length}`);
  
  // Si no hay clientes en el rango, mostrar los últimos 5 como referencia
  if (clientesFiltrados.length === 0 && clientes.length > 0) {
    console.warn('No se encontraron clientes en el rango especificado. Últimos 5 clientes:', 
      clientes.slice(0, 5).map(c => ({
        id: c.id,
        nombre: c.nombre,
        apellido: c.apellido,
        createdAt: c.createdAt,
        empresaId: c.empresaId
      }))
    );
  }
  
  return clientesFiltrados;
}

// Función utilitaria para filtrar gastos
function filtrarGastos(
  gastos: Gasto[],
  periodo: string,
  start?: Date | string,
  end?: Date | string,
  cajaId?: string | number
): Gasto[] {
  console.log(`Filtrando ${gastos?.length || 0} gastos con periodo:`, periodo, 'y cajaId:', cajaId);
  
  if (!gastos || gastos.length === 0) {
    console.warn('No hay gastos para filtrar');
    return [];
  }
  console.log(`Filtrando ${gastos?.length || 0} gastos con periodo:`, periodo, 'y cajaId:', cajaId);
  
  if (!gastos || gastos.length === 0) {
    console.warn('No hay gastos para filtrar');
    return [];
  }

  // Función para normalizar fechas a string YYYY-MM-DD
  const normalizeToDateString = (dateInput: unknown): string | null => {
    // Manejar valores nulos o indefinidos
    if (!dateInput && dateInput !== 0) return null;
    
    // Si es un booleano, devolvemos null ya que no es una fecha válida
    if (typeof dateInput === 'boolean') {
      console.warn('Se recibió un valor booleano como fecha');
      return null;
    }
    
    // Si es un string en formato YYYY-MM-DD, lo devolvemos tal cual
    if (typeof dateInput === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
      return dateInput;
    }
    
    // Para cualquier otro formato, intentamos convertirlo a fecha
    let date: Date;
    
    if (dateInput instanceof Date) {
      date = dateInput;
    } else if (typeof dateInput === 'number') {
      date = new Date(dateInput);
    } else if (typeof dateInput === 'string') {
      date = new Date(dateInput);
    } else {
      console.warn('Tipo de fecha no soportado:', typeof dateInput);
      return null;
    }
    
    // Verificar si la fecha es válida
    if (isNaN(date.getTime())) {
      console.warn('Fecha inválida:', dateInput);
      return null;
    }
    
    // Convertir a YYYY-MM-DD en hora local
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  };

  // Primero filtramos por caja si se especificó
  let gastosFiltrados = [...gastos];
  
  
  if (cajaId !== undefined && cajaId !== '') {
    const cajaIdNum = typeof cajaId === 'string' ? parseInt(cajaId, 10) : cajaId;
    if (!isNaN(cajaIdNum)) {
      // Asegurarse de que ambos sean del mismo tipo para la comparación
      gastosFiltrados = gastosFiltrados.filter(g => {
        const gCajaId = g.cajaId !== null && g.cajaId !== undefined 
          ? (typeof g.cajaId === 'string' ? parseInt(g.cajaId, 10) : g.cajaId)
          : null;
        
        const match = gCajaId === cajaIdNum;
        return match;
      });
      
    }
  }

  // Aplicar el filtro de caja a los gastos
  if (cajaId !== undefined && cajaId !== '') {
    const cajaIdNum = typeof cajaId === 'string' ? parseInt(cajaId, 10) : cajaId;
    if (!isNaN(cajaIdNum)) {
      gastosFiltrados = gastosFiltrados.filter(g => {
        // Asegurarse de que ambos sean del mismo tipo para la comparación
        const gCajaId = typeof g.cajaId === 'string' ? parseInt(g.cajaId as string, 10) : g.cajaId;
        return gCajaId === cajaIdNum;
      });
      
      console.log(`Gastos después de filtrar por caja ${cajaId}:`, gastosFiltrados.length);
    }
  }

  // Luego filtramos por rango de fechas
  const gastosFiltradosPorFecha = filtrarPorRangoFechas<Gasto>({
    items: gastosFiltrados,
    getDateFn: (g: Gasto) => {
      try {
        // Usar la fecha del gasto o la fecha de creación como respaldo
        const fecha = g.fecha || g.createdAt;
        
        // Asegurarse de que la fecha sea un string o un objeto Date
        const fechaValida = typeof fecha === 'string' || fecha instanceof Date ? fecha : '';
        
        // Intentar parsear la fecha
        const fechaObj = new Date(fechaValida);
        if (isNaN(fechaObj.getTime())) {
          // Fecha inválida manejada silenciosamente
          return ''; // Devolver cadena vacía para que el filtro la maneje
        }
        
        // Devolver la fecha en formato YYYY-MM-DD
        const year = fechaObj.getFullYear();
        const month = String(fechaObj.getMonth() + 1).padStart(2, '0');
        const day = String(fechaObj.getDate()).padStart(2, '0');
        
        return `${year}-${month}-${day}`;
      } catch (error) {
        // Error manejado silenciosamente
        return ''; // Devolver cadena vacía en caso de error
      }
    },
    periodo,
    start,
    end
  });

  
  return gastosFiltradosPorFecha;
}

export default Dashboard;