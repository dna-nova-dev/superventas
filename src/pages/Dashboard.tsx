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
import { getCompras } from "@/services/compraService";

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
      return '';
    }

    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  } catch (error) {
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

  if (!ventas || ventas.length === 0) {
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
    }
  }

  // Si no hay filtro de fecha, retornar las ventas filtradas por caja
  if (!periodo && !start && !end) {
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

    // Función para normalizar fechas a timestamp para comparación
    const toTimestamp = (date: Date | string | null): number | null => {
      if (!date) return null;

      // Si ya es un timestamp
      if (typeof date === 'number') return date;

      // Si es un string, intentar convertirlo a Date
      const d = date instanceof Date ? date : new Date(date);

      // Usar getTime() para obtener el timestamp en milisegundos
      return isNaN(d.getTime()) ? null : d.getTime();
    };

    // Obtener timestamps para comparación
    const ventaTimestamp = toTimestamp(fechaVenta);
    const inicioTimestamp = toTimestamp(fechaInicio);
    const finTimestamp = toTimestamp(fechaFin);

    // Si no se pudo obtener el timestamp de la venta, no incluirla
    if (ventaTimestamp === null) return false;

    // Debug: Mostrar información detallada de la comparación

    try {
      // Si hay un rango de fechas, verificar si la venta está dentro del rango
      if (inicioTimestamp !== null && finTimestamp !== null) {
        // Ajustar para incluir todo el día de la fecha fin
        const finDelDia = new Date(finTimestamp);
        finDelDia.setHours(23, 59, 59, 999);
        const finDelDiaTimestamp = finDelDia.getTime();

        const cumpleRango = ventaTimestamp >= inicioTimestamp && ventaTimestamp <= finDelDiaTimestamp;

        return cumpleRango;
      }
      // Si solo hay fecha de inicio
      else if (inicioTimestamp !== null) {
        const cumpleRango = ventaTimestamp >= inicioTimestamp;
        return cumpleRango;
      }
      // Si solo hay fecha de fin
      else if (finTimestamp !== null) {
        const cumpleRango = ventaTimestamp <= finTimestamp;
        return cumpleRango;
      }
    } catch (error) {
      // En caso de error, incluir la venta para evitar pérdida de datos
      return true;
    }

    // Si llegamos aquí, no hay fechas de filtro válidas, así que incluimos la venta
    return true;
  };

  // Filtrar las ventas por fecha
  const ventasFiltradasPorFecha = ventasFiltradas.filter(venta => {
    if (!venta.fecha) {
      return false;
    }

    // Si no hay fechas de filtro, incluir todas las ventas
    if (!fechaInicio && !fechaFin) {
      return true;
    }

    return isInDateRange(venta.fecha, venta.id, fechaInicio, fechaFin || new Date());
  });

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
  compras: [],
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
        return [];
      }

      const result = filtrarGastos(
        gastos,
        periodoEstadisticas,
        startEstadisticas,
        endEstadisticas,
        selectedEstadisticasCajaId || undefined
      );

      return result;
    } catch (error) {
      return [];
    }
  }, [gastos, periodoEstadisticas, startEstadisticas, endEstadisticas, selectedEstadisticasCajaId]);

  const filteredVentas = useMemo<Array<Venta>>(() => {
    try {
      const filtradas = filtrarVentas(
        ventas,
        periodoEstadisticas,
        startEstadisticas,
        endEstadisticas,
        selectedEstadisticasCajaId || undefined
      );

      if (filtradas.length === 0 && ventas.length > 0) {
        return [];
      }

      return filtradas;
    } catch (error) {
      return [];
    }
  }, [ventas, periodoEstadisticas, startEstadisticas, endEstadisticas, selectedEstadisticasCajaId]);

  const filteredProductos = useMemo<Array<Producto>>(() => {
    try {
      return [...productos];
    } catch (error) {
      return [];
    }
  }, [productos]);

  const filteredClientes = useMemo<Array<Cliente>>(() => {
    try {
      return [...clientes];
    } catch (error) {
      return [];
    }
  }, [clientes]);

  // Función para cargar datos iniciales
  const loadInitialData = useCallback(async () => {
    try {
      dispatch({ type: "SET_FIELD", field: "loading", value: true });

      const gastosData = await getGastos().catch(err => {
        return [];
      });

      const [
        ventasData,
        productosData,
        clientesData,
        cajasData,
        detallesData,
        comprasData
      ] = await Promise.all([
        getVentas().catch(err => {
          return [];
        }),
        getAllProductos().catch(err => {
          return [];
        }),
        getAllClientes().catch(err => {
          return [];
        }),
        getAllCajas().catch(err => {
          return [];
        }),
        getVentaDetalles().catch(err => {
          return [];
        }),
        getCompras().catch(err => {
          console.error('Error cargando compras:', err);
          return [];
        }),
      ]);

      const gastosFiltrados = Array.isArray(gastosData)
        ? gastosData.filter((g: Gasto) => g.empresaId === empresaId)
        : [];

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
          compras: Array.isArray(comprasData) ? comprasData.filter((c: any) => c.empresaId === empresaId) : [],
          gastos: gastosFiltrados,
        },
      });
    } catch (error) {
    } finally {
      dispatch({ type: "SET_FIELD", field: "loading", value: false });
    }
  }, [empresaId]);

  // Efecto para cargar datos al montar el componente
  useEffect(() => {
    loadInitialData();

    // Configurar un intervalo para actualizar los datos cada minuto
    const intervalId = setInterval(() => {
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
            return false;
          }
        });

        // Calcular total de gastos
        const totalGastos = Array.isArray(gastos) ? gastos.reduce(
          (acc, g) => acc + (parseFloat(g?.monto) || 0),
          0
        ) : 0;

        // Calcular tendencia de gastos
        const currentMonthGastos = Array.isArray(gastos) ? gastos
          .filter((g) => {
            try {
              const gastoDate = new Date(g.fecha || g.createdAt);
              return gastoDate.getMonth() === currentMonth &&
                gastoDate.getFullYear() === currentYear;
            } catch (e) {
              return false;
            }
          })
          .reduce((acc, g) => acc + (parseFloat(g?.monto) || 0), 0) : 0;

        const lastMonthGastos = Array.isArray(gastos) ? gastos
          .filter((g) => {
            try {
              const gastoDate = new Date(g.fecha || g.createdAt);
              return gastoDate.getMonth() === lastMonth &&
                gastoDate.getFullYear() === lastMonthYear;
            } catch (e) {
              return false;
            }
          })
          .reduce((acc, g) => acc + (parseFloat(g?.monto) || 0), 0) : 0;

        let gastosTrend = "0%";
        if (lastMonthGastos > 0) {
          const trend = ((currentMonthGastos - lastMonthGastos) / lastMonthGastos) * 100;
          gastosTrend = `${trend > 0 ? '+' : ''}${trend.toFixed(1)}%`;
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
        ? "0"
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
    const totalGastos = gastosFiltrados.reduce(
      (acc, g) => acc + parseFloat(g.monto),
      0
    );
    // Tendencia de gastos
    let gastosTrend = "0%";
    if (startEstadisticas && endEstadisticas) {
      // Calcular los meses involucrados en el filtro
      const mesActual = startEstadisticas.getMonth();
      const anioActual = startEstadisticas.getFullYear();
      const mesAnterior = mesActual === 0 ? 11 : mesActual - 1;
      const anioMesAnterior = mesActual === 0 ? anioActual - 1 : anioActual;
      const gastosMesActual = gastosFiltrados
        .filter((g) => {
          const fechaValida = typeof g.fecha === 'string' ? g.fecha :
            typeof g.createdAt === 'string' ? g.createdAt :
              null;
          if (!fechaValida) return false;
          const gastoDate = new Date(fechaValida);
          if (isNaN(gastoDate.getTime())) return false;
          return (
            gastoDate.getMonth() === mesActual &&
            gastoDate.getFullYear() === anioActual
          );
        })
        .reduce((acc, g) => acc + parseFloat(g.monto), 0);
      const gastosMesAnterior = gastosFiltrados
        .filter((g) => {
          const fechaValida = typeof g.fecha === 'string' ? g.fecha :
            typeof g.createdAt === 'string' ? g.createdAt :
              null;
          if (!fechaValida) return false;
          const gastoDate = new Date(fechaValida);
          if (isNaN(gastoDate.getTime())) return false;
          return (
            gastoDate.getMonth() === mesAnterior &&
            gastoDate.getFullYear() === anioMesAnterior
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
    } else {
      // Sin filtro, tendencia global
      const now = new Date();
      const mesActual = now.getMonth();
      const anioActual = now.getFullYear();
      const gastosMesActual = gastos
        .filter((g) => {
          const fechaValida = typeof g.fecha === 'string' ? g.fecha :
            typeof g.createdAt === 'string' ? g.createdAt :
              null;
          if (!fechaValida) return false;
          const gastoDate = new Date(fechaValida);
          if (isNaN(gastoDate.getTime())) return false;
          return (
            gastoDate.getMonth() === mesActual &&
            gastoDate.getFullYear() === anioActual
          );
        })
        .reduce((acc, g) => acc + parseFloat(g.monto), 0);
      const mesAnterior = mesActual === 0 ? 11 : mesActual - 1;
      const anioMesAnterior = mesActual === 0 ? anioActual - 1 : anioActual;
      const gastosMesAnterior = gastos
        .filter((g) => {
          const fechaValida = typeof g.fecha === 'string' ? g.fecha :
            typeof g.createdAt === 'string' ? g.createdAt :
              null;
          if (!fechaValida) return false;
          const gastoDate = new Date(fechaValida);
          if (isNaN(gastoDate.getTime())) return false;
          return (
            gastoDate.getMonth() === mesAnterior &&
            gastoDate.getFullYear() === anioMesAnterior
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
  ]);

  useEffect(() => {
    if (!empresaId) return;

    const today = new Date();
    
    const filteredVentas = ventas.filter((venta) => {
      if (venta.empresaId !== empresaId) return false;
      
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
  }, [ventas, salesPeriod, empresaId, categorias, productos, categoryPeriod, dispatch]);

  useEffect(() => {
    if (!empresaId) return;

    const today = new Date();
    
    const filteredVentas = ventas.filter((venta) => {
      if (venta.empresaId !== empresaId) return false;
      
      const ventaDate = new Date(venta.fecha);
      const diffDays = Math.floor(
        (today.getTime() - ventaDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      
      return diffDays <= (salesPeriod === "30days" ? 30 : salesPeriod === "60days" ? 60 : 90);
    });

    const groupedSales = filteredVentas.reduce((acc, venta) => {
      const fechaVenta = new Date(venta.fecha);
      const diaVenta = fechaVenta.getDate();
      const mesVenta = fechaVenta.getMonth() + 1;
      const anioVenta = fechaVenta.getFullYear();
      const fechaFormateada = `${diaVenta}/${mesVenta}/${anioVenta}`;
      
      acc[fechaFormateada] = (acc[fechaFormateada] || 0) + parseFloat(venta.total);
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
  }, [ventas, salesPeriod, empresaId, dispatch]);

  // Categorías y productos filtrados por empresa
  const filteredCategorias = useMemo(() => 
    categorias.filter(cat => cat.empresaId === empresaId)
  , [categorias, empresaId]);

  

  // Efecto para calcular datos de categorías
  useEffect(() => {
    if (!empresaId) return;

    const today = new Date();
    
    const filteredVentas = ventas.filter((venta) => {
      if (venta.empresaId !== empresaId) return false;
      
      const ventaDate = new Date(venta.fecha);
      const diffMonths = today.getMonth() - ventaDate.getMonth() + 
                        12 * (today.getFullYear() - ventaDate.getFullYear());
      
      return diffMonths <= (categoryPeriod === "month" ? 1 : categoryPeriod === "quarter" ? 3 : 12);
    });

    const categoryTotals = filteredCategorias.map((categoria) => {
      const total = filteredVentas.reduce((acc, venta) => {
        if (venta.ventaDetalles?.length > 0) {
          return acc + venta.ventaDetalles.reduce((detailAcc, detalle) => {
            const product = filteredProductos.find(p => p.id === detalle.productoId);
            if (product && product.categoriaId === categoria.id) {
              return detailAcc + (parseFloat(detalle.total) || 0);
            }
            return detailAcc;
          }, 0);
        }
        
        return acc + (parseFloat(venta.total) || 0) / Math.max(1, filteredCategorias.length);
      }, 0);

      return {
        name: categoria.nombre,
        value: parseFloat(total.toFixed(2)),
      };
    }).filter(cat => cat.value > 0);

    dispatch({
      type: "SET_FIELD",
      field: "categoryData",
      value: categoryTotals,
    });
  }, [categorias, productos, ventas, categoryPeriod, empresaId, dispatch, filteredCategorias, filteredProductos]);

  // Efecto para calcular datos de ventas
  useEffect(() => {
    if (!empresaId) return;

    const today = new Date();
    
    const filteredVentas = ventas.filter((venta) => {
      if (venta.empresaId !== empresaId) return false;
      
      const ventaDate = new Date(venta.fecha);
      const diffDays = Math.floor(
        (today.getTime() - ventaDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      
      return diffDays <= (salesPeriod === "30days" ? 30 : salesPeriod === "60days" ? 60 : 90);
    });

    const groupedSales = filteredVentas.reduce((acc, venta) => {
      const fechaVenta = new Date(venta.fecha);
      const diaVenta = fechaVenta.getDate();
      const mesVenta = fechaVenta.getMonth() + 1;
      const anioVenta = fechaVenta.getFullYear();
      const fechaFormateada = `${diaVenta}/${mesVenta}/${anioVenta}`;
      
      acc[fechaFormateada] = (acc[fechaFormateada] || 0) + parseFloat(venta.total);
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
  }, [ventas, salesPeriod, empresaId, dispatch]);

  const stats = filteredStats;
  const recentSales = [...ventas]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 3)
    .map(venta => ({
      ...venta,
      // Usar createdAt para mostrar la fecha y hora exactas de la venta
      fecha: (() => {
        try {
          const fechaVenta = new Date(venta.createdAt);
          const fechaFormateada = fechaVenta.toLocaleDateString('es-GT');
          const horaFormateada = fechaVenta.toLocaleTimeString('es-GT', {
            hour: '2-digit',
            minute: '2-digit'
          });
          return `${fechaFormateada} ${horaFormateada}`;
        } catch (error) {
          return venta.fecha || 'Fecha no disponible';
        }
      })()
    }));

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

                // Declarar variables de fecha con tipos explícitos
                let desde: Date | null = null;
                let hasta: Date | null = null;

                // Función para normalizar fechas al inicio del día en hora local
                const normalizarFechaInicioDia = (fecha: Date): Date => {
                  const local = new Date(fecha);
                  return new Date(local.getFullYear(), local.getMonth(), local.getDate());
                };

                // Función para normalizar fechas al final del día en hora local
                const normalizarFechaFinDia = (fecha: Date): Date => {
                  const local = new Date(fecha);
                  return new Date(local.getFullYear(), local.getMonth(), local.getDate(), 23, 59, 59, 999);
                };

                // Establecer fechas según el filtro seleccionado
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
                  desde = startDate instanceof Date ? startDate : new Date(startDate);
                  hasta = endDate instanceof Date ? new Date(endDate) : new Date(endDate);
                  hasta.setDate(hasta.getDate() + 1);
                }

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

                      return cumple;
                    }

                    // Para rangos personalizados, usar las fechas directamente
                    if (desde && hasta) {
                      try {
                        // Asegurarse de que desde y hasta sean objetos Date válidos
                        const desdeDate = desde instanceof Date ? desde : new Date(desde);
                        const hastaDate = hasta instanceof Date ? hasta : new Date(hasta);

                        // Formatear a YYYY-MM-DD
                        const formatDate = (date: Date): string => {
                          const year = date.getFullYear();
                          const month = String(date.getMonth() + 1).padStart(2, '0');
                          const day = String(date.getDate()).padStart(2, '0');
                          return `${year}-${month}-${day}`;
                        };

                        const desdeStr = formatDate(desdeDate);
                        const hastaStr = formatDate(hastaDate);

                        return fechaVentaStr >= desdeStr && fechaVentaStr <= hastaStr;
                      } catch (error) {
                        return false; // En caso de error en el formato de fechas, no incluir en los resultados
                      }
                    }

                    // Si no hay filtro de fechas, incluir todas las ventas de la caja
                    return true;

                  } catch (error) {
                    return false;
                  }
                });

                const ventasDeEstaCaja = ventas.filter(v => {
                  const id = typeof v.cajaId === 'string' ? parseInt(v.cajaId, 10) : v.cajaId;
                  return id === cajaIdNum;
                });

                const totalVentas = ventasCaja.reduce((sum, v) => sum + parseFloat(v.total), 0);
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
                if (caja && caja.efectivo !== undefined) {
                  saldoInicial = parseFloat(String(caja.efectivo)) || 0;
                } else {
                  // Si no hay saldoInicial, usar 0
                  saldoInicial = 0;
                }
                // Balance general: ingresos - gastos
                const totalIngresos = (ventasCaja || []).reduce(
                  (acc, v) => acc + (parseFloat(v?.total) || 0),
                  0
                );

                // Filtrar compras para la caja y rango de fechas seleccionados
                const comprasCaja = (state.compras || []).filter(compra => {
                  try {
                    // Asegurar que los tipos coincidan para la comparación de cajaId
                    const compraCajaId = typeof compra.cajaId === 'string' ? parseInt(compra.cajaId, 10) : compra.cajaId;

                    // Si la caja no coincide, filtrar
                    if (compraCajaId !== cajaIdNum) return false;

                    // Parsear la fecha de la compra
                    const fechaCompra = new Date(compra.createdAt || compra.fecha);
                    const fechaCompraStr = formatDate(fechaCompra);

                    // Aplicar filtros de fecha según el período seleccionado
                    if (periodFilter === 'hoy') {
                      const hoyLocal = formatDate(new Date());
                      return fechaCompraStr === hoyLocal;
                    }

                    if (periodFilter === 'ayer') {
                      const ayer = new Date();
                      ayer.setDate(ayer.getDate() - 1);
                      const ayerStr = formatDate(ayer);
                      return fechaCompraStr === ayerStr;
                    }

                    // Para rangos personalizados
                    if (desde && hasta) {
                      const desdeDate = desde instanceof Date ? desde : new Date(desde);
                      const hastaDate = hasta instanceof Date ? hasta : new Date(hasta);

                      const fechaCompraDate = new Date(fechaCompraStr);
                      return fechaCompraDate >= desdeDate && fechaCompraDate <= hastaDate;
                    }

                    // Si no hay filtro de fechas, incluir todas las compras de la caja
                    return true;
                  } catch (error) {
                    console.error('Error al filtrar compras:', error);
                    return false;
                  }
                });

                // Calcular el total de compras
                const totalCompras = comprasCaja.reduce((sum, compra) => {
                  return sum + parseFloat(compra.total || '0');
                }, 0);

                // Calcular gastos totales
                const totalGastos = (gastosCaja || []).reduce(
                  (acc, g) => acc + (parseFloat(g?.monto) || 0),
                  0
                );

                // Calcular balance general y utilidades
                const balanceGeneral = saldoInicial + totalIngresos - totalGastos;
                const utilidades = totalIngresos - totalCompras - totalGastos;

                // Calcular tendencias
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

                // Filtrar productos activos
                const productosActivos = (productos || []).filter(p => {
                  const isActive = p?.estado?.toLowerCase() === 'activo';
                  return isActive;
                });


                // Filtrar productos por período si hay fechas definidas
                const productosFiltrados = desde && hasta
                  ? productosActivos.filter(p => {
                    const fechaStr = p.fechaCreacion || p.createdAt || p.fecha_creacion;

                    if (!fechaStr) return false;

                    // Parsear la fecha del producto
                    const fechaProducto = parseDate(fechaStr);
                    if (!fechaProducto) {
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


                return (
                  <>
                    <div className="bg-card p-4 rounded-lg border shadow flex flex-col h-full">
                      <div className="flex-1">
                        <div className="h-full">
                          <p className="text-sm font-medium text-muted-foreground">Balance General</p>
                          <p className="text-2xl font-bold">{formatCurrency(balanceGeneral)}</p>
                          <div className="mt-2 text-xs text-muted-foreground space-y-1">
                            <div className="flex justify-between">
                              <span>Saldo inicial:</span>
                              <span>{formatCurrency(saldoInicial)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>+ Ventas:</span>
                              <span className="text-green-500">+{formatCurrency(totalIngresos)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>- Compras:</span>
                              <span className="text-amber-500">-{formatCurrency(totalCompras)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>- Gastos:</span>
                              <span className="text-rose-500">-{formatCurrency(totalGastos)}</span>
                            </div>
                            <div className="border-t border-border pt-1 mt-1">
                              <div className="flex justify-between font-medium">
                                <span>Total:</span>
                                <span>{formatCurrency(balanceGeneral)}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-card p-4 rounded-lg border shadow flex flex-col h-full">
                      <div className="flex-1">
                        <div className="h-full flex flex-col">
                          <p className="text-sm font-medium text-muted-foreground mb-2">Utilidades</p>
                          <p className={`text-2xl font-bold mb-3 ${utilidades >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                            {utilidades >= 0 ? '+' : ''}{formatCurrency(utilidades)}
                          </p>
                          <div className="mt-auto space-y-1 text-xs">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Total entradas:</span>
                              <span className="text-green-500">+{formatCurrency(totalIngresos)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Total salidas:</span>
                              <span className="text-red-500">-{formatCurrency(totalCompras + totalGastos)}</span>
                            </div>
                            <div className="pt-1 text-xs text-muted-foreground">
                              (Compras: {formatCurrency(totalCompras)} + Gastos: {formatCurrency(totalGastos)})
                            </div>
                          </div>
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
                                  ({comprasCaja.length} {comprasCaja.length === 1 ? 'compra' : 'compras'})
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
                          {sale.fecha || 'Fecha no disponible'}
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
                            className={`h-2 w-2 rounded-full mr-2 ${producto.stockTotal > 50
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

      break;
    }
    case 'ayer': {
      // Obtener la fecha de ayer
      const ayer = new Date();
      ayer.setDate(ayer.getDate() - 1);
      const ayerStr = formatDate(ayer);

      desdeStr = ayerStr;
      hastaStr = ayerStr;

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

      break;
    }
    default:
      return items;
  }

  // Si no se pudieron determinar las fechas, retornar todos los items
  if (!desdeStr || !hastaStr) {
    return items;
  }

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

    // Comparar directamente como strings
    const cumple = itemDateStr >= desdeStr && itemDateStr <= hastaStr;

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
  if (!productos || productos.length === 0) {
    return [];
  }

  const productosFiltrados = filtrarPorRangoFechas<Producto>({
    items: productos,
    getDateFn: p => p.createdAt,
    periodo,
    start,
    end
  });

  // Si no hay productos en el rango, devolver array vacío
  if (productosFiltrados.length === 0) {
    return [];
  }

  return productosFiltrados;
}

// Función utilitaria para filtrar clientes por fecha de creación
function filtrarClientes(clientes: Cliente[], periodo: string, start?: Date | string, end?: Date | string): Cliente[] {
  if (!clientes || clientes.length === 0) {
    return [];
  }

  const clientesFiltrados = filtrarPorRangoFechas<Cliente>({
    items: clientes,
    getDateFn: c => c.createdAt,
    periodo,
    start,
    end
  });

  // Si no hay clientes en el rango, devolver array vacío
  if (clientesFiltrados.length === 0) {
    return [];
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
  if (!gastos || gastos.length === 0) {
    return [];
  }
  if (!gastos || gastos.length === 0) {
    return [];
  }

  // Función para normalizar fechas a string YYYY-MM-DD
  const normalizeToDateString = (dateInput: unknown): string | null => {
    // Manejar valores nulos o indefinidos
    if (!dateInput && dateInput !== 0) return null;

    // Si es un booleano, devolvemos null ya que no es una fecha válida
    if (typeof dateInput === 'boolean') {
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
      return null;
    }

    // Verificar si la fecha es válida
    if (isNaN(date.getTime())) {
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