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
import { WidgetGrid } from "@/components/dashboard/WidgetGrid";
import { StatCard } from "@/components/dashboard/StatCard";
import { RecentSaleCard } from "@/components/dashboard/RecentSaleCard";
import { CustomTooltip } from "@/components/dashboard/CustomTooltip";
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
        endEstadisticas
      );
      
      console.log("Gastos filtrados:", {
        total: result.length
      });
      return result;
    } catch (error) {
      console.error("Error filtering gastos:", error);
      return [];
    }
  }, [gastos, periodoEstadisticas, startEstadisticas, endEstadisticas]);

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
  
  // Debug: Mostrar datos cargados
  useEffect(() => {
    console.log('=== DATOS CARGADOS ===');
    console.log('Ventas:', ventas.length);
    console.log('Productos:', productos.length);
    console.log('Clientes:', clientes.length);
    console.log('Cajas:', cajas.length);
    console.log('Gastos:', gastos.length);
    console.log('Empresa ID:', empresaId);
    console.log('Filtro actual:', periodoEstadisticas);
    console.log('Fechas:', { startEstadisticas, endEstadisticas });
    console.log('Ventas filtradas:', filteredVentas.length);
    console.log('Productos filtrados:', filteredProductos.length);
    console.log('Clientes filtrados:', filteredClientes.length);
    console.log('========================');
  }, [ventas, productos, clientes, cajas, gastos, filteredVentas, filteredProductos, filteredClientes, empresaId, periodoEstadisticas, startEstadisticas, endEstadisticas]);

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
        const diffTime = Math.abs(today.getTime() - productDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays <= 7;
      });

      const newClientsLastMonth = filteredClientes.filter((cliente) => {
        const clientDate = new Date(cliente.createdAt);
        const lastMonth = new Date();
        lastMonth.setMonth(lastMonth.getMonth() - 1);
        return clientDate > lastMonth;
      });

      const totalGastos = gastos.reduce(
        (acc, gasto) => acc + parseFloat(gasto.monto),
        0
      );

      return {
        totalVentas,
        ventasTrend,
        totalProductos: filteredProductos.length,
        newProducts: productsLast7Days.length,
        totalClientes: filteredClientes.length,
        newClients: newClientsLastMonth.length,
        totalGastos,
      };
    };

    dispatch({ type: "SET_FILTERED_STATS", payload: calculateStats() });
  }, [
    filteredVentas,
    filteredProductos,
    filteredClientes,
    gastos,
    periodoEstadisticas,
    startEstadisticas,
    endEstadisticas,
  ]);

  const processSalesData = (period: string) => {
    const today = new Date();
    const filteredVentas = ventas.filter((venta) => {
      const ventaDate = new Date(venta.fecha);
      const diffDays = Math.floor(
        (today.getTime() - ventaDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      return (
        diffDays <= (period === "7days" ? 7 : period === "30days" ? 30 : 365)
      );
    });

    const groupedSales = filteredVentas.reduce((acc, venta) => {
      const date = new Date(venta.fecha);
      let key;

      switch (period) {
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
    if (period === "30days") {
      chartData.sort((a, b) => parseInt(a.name) - parseInt(b.name));
    }

    dispatch({ type: "SET_FIELD", field: "salesData", value: chartData });
  };

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
    const totalGastos = gastosFiltrados.reduce(
      (acc, gasto) => acc + parseFloat(gasto.monto),
      0
    );

    let gastosTrend = "0%";
    if (startEstadisticas && endEstadisticas) {
      // Calcular los meses involucrados en el filtro
      const mesActual = startEstadisticas.getMonth();
      const anioActual = startEstadisticas.getFullYear();
      const mesAnterior = mesActual === 0 ? 11 : mesActual - 1;
      const anioMesAnterior = mesActual === 0 ? anioActual - 1 : anioActual;
      const gastosMesActual = gastosFiltrados
        .filter((g) => {
          const fecha = new Date(g.createdAt);
          return (
            fecha.getMonth() === mesActual && fecha.getFullYear() === anioActual
          );
        })
        .reduce((acc, g) => acc + parseFloat(g.monto), 0);
      const gastosMesAnterior = gastosFiltrados
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
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
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

                if (periodFilter === "hoy") {
                  desde = new Date(
                    hoy.getFullYear(),
                    hoy.getMonth(),
                    hoy.getDate()
                  );
                  hasta = new Date(
                    hoy.getFullYear(),
                    hoy.getMonth(),
                    hoy.getDate() + 1
                  );
                } else if (periodFilter === "ayer") {
                  // Filtro para ayer
                  const ayer = new Date(hoy);
                  ayer.setDate(hoy.getDate() - 1);
                  desde = new Date(
                    ayer.getFullYear(),
                    ayer.getMonth(),
                    ayer.getDate()
                  );
                  hasta = new Date(
                    ayer.getFullYear(),
                    ayer.getMonth(),
                    ayer.getDate() + 1
                  );
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

                const ventasCaja = ventas.filter((v) => {
                  const fechaVenta = new Date(v.fecha);
                  return (
                    v.cajaId === cajaIdNum &&
                    (!desde ||
                      !hasta ||
                      (fechaVenta >= desde && fechaVenta < hasta))
                  );
                });

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
                  endDate
                ).filter((g) => {
                  return g.cajaId === cajaIdNum;
                });

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
                const totalIngresos = ventasCaja.reduce(
                  (acc, v) => acc + parseFloat(v.total),
                  0
                );
                const totalGastos = gastosCaja.reduce(
                  (acc, g) => acc + parseFloat(g.monto),
                  0
                );
                const balanceGeneral = totalIngresos - totalGastos;
                // Utilidades: ingresos - compras - gastos
                const totalCompras = detallesCaja.reduce(
                  (acc, d) => acc + parseFloat(d.precioCompra) * d.cantidad,
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

                return (
                  <>
                    <StatCard
                      icon={BarChart3}
                      title="Balance General"
                      value={formatCurrency(balanceGeneral)}
                      trend={balanceGeneral >= 0 ? "up" : "down"}
                      trendValue={balanceTrend}
                    />
                    <StatCard
                      icon={BarChart3}
                      title="Utilidades"
                      value={formatCurrency(utilidades)}
                      trend={utilidades >= 0 ? "up" : "down"}
                      trendValue={utilidadesTrend}
                    />
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
        <WidgetGrid
          storageKey="dashboard-widgets-layout"
          statsData={filteredStats}
          key={
            periodoEstadisticas +
            "-" +
            (startEstadisticas?.toISOString() ?? "") +
            "-" +
            (endEstadisticas?.toISOString() ?? "") +
            "-" +
            (selectedEstadisticasCajaId ?? "")
          }
        />

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
                    <Tooltip content={<CustomTooltip />} />
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
                {recentSales.map((sale) => (
                  <RecentSaleCard
                    key={sale.id}
                    sale={{
                      ...sale,
                      total:
                        typeof sale.total === "string"
                          ? parseFloat(sale.total)
                          : sale.total,
                    }}
                  />
                ))}
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
                  <Tooltip content={<CustomTooltip />} />
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

// Función auxiliar para normalizar fechas
const normalizarFecha = (fecha: string | Date | null | undefined): Date | null => {
  if (!fecha) return null;
  
  // Si ya es un objeto Date y es válido
  if (fecha instanceof Date && !isNaN(fecha.getTime())) {
    return new Date(fecha.getTime());
  }
  
  // Si es un string, intentar parsearlo
  if (typeof fecha === 'string') {
    // Intentar con el formato ISO
    const parsed = new Date(fecha);
    if (!isNaN(parsed.getTime())) return parsed;
    
    // Intentar con formato de fecha local (dd/mm/yyyy)
    const parts = fecha.split(/[-/]/);
    if (parts.length === 3) {
      const [day, month, year] = parts.map(Number);
      const parsedLocal = new Date(year, month - 1, day);
      if (!isNaN(parsedLocal.getTime())) return parsedLocal;
    }
  }
  
  console.warn('Fecha no válida:', fecha);
  return null;
};

// Interfaz para los parámetros de filtrado
interface FiltroFechas<T extends FiltrableItem> {
  items: T[];
  getDateFn: (item: T) => Date | string | null | undefined;
  periodo: string;
  start?: Date | string | null;
  end?: Date | string | null;
}

// Función genérica para filtrar por rango de fechas
const filtrarPorRangoFechas = <T extends FiltrableItem>({
  items,
  getDateFn,
  periodo,
  start,
  end
}: FiltroFechas<T>): T[] => {
  if (!items || items.length === 0) {
    return [];
  }

  let desde: Date | null = null;
  let hasta: Date | null = null;
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  switch (periodo) {
    case 'hoy':
      desde = new Date(hoy);
      hasta = new Date(hoy);
      hasta.setHours(23, 59, 59, 999);
      break;
    case 'ayer':
      desde = new Date(hoy);
      desde.setDate(desde.getDate() - 1);
      hasta = new Date(desde);
      hasta.setHours(23, 59, 59, 999);
      break;
    case '7dias':
      desde = new Date(hoy);
      desde.setDate(desde.getDate() - 6);
      hasta = new Date(hoy);
      hasta.setHours(23, 59, 59, 999);
      break;
    case '1mes':
      desde = new Date(hoy);
      desde.setMonth(desde.getMonth() - 1);
      hasta = new Date(hoy);
      hasta.setHours(23, 59, 59, 999);
      break;
    case 'rango':
      if (!start || !end) {
        console.warn('Rango de fechas incompleto', { start, end });
        return items;
      }
      desde = normalizarFecha(start);
      hasta = normalizarFecha(end);
      if (hasta) {
        hasta.setHours(23, 59, 59, 999);
      }
      break;
    default:
      return items;
  }

  if (!desde || !hasta) {
    console.warn('Error al establecer el rango de fechas', { desde, hasta });
    return items;
  }

  console.log(`Filtrando entre ${desde} y ${hasta}`);

  return items.filter(item => {
    const fechaItem = normalizarFecha(getDateFn(item));
    if (!fechaItem) {
      console.warn('No se pudo determinar la fecha para el item:', item);
      return false;
    }
    
    return fechaItem >= desde! && fechaItem <= hasta!;
  });
};

// Función para formatear fechas a YYYY-MM-DD para comparación
const formatDateToYMD = (date: Date) => {
  const d = new Date(date);
  return d.toISOString().split('T')[0];
};

// Función utilitaria para filtrar ventas
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
  let ventasFiltradas = ventas;
  if (cajaId) {
    const cajaIdNum = typeof cajaId === 'string' ? parseInt(cajaId, 10) : cajaId;
    if (!isNaN(cajaIdNum)) {
      ventasFiltradas = ventas.filter(v => v.cajaId === cajaIdNum);
      console.log(`Ventas después de filtrar por caja ${cajaId}:`, ventasFiltradas.length);
    }
  }

  // Luego filtramos por rango de fechas
  ventasFiltradas = filtrarPorRangoFechas<Venta>({
    items: ventasFiltradas,
    getDateFn: v => v.fecha,
    periodo,
    start,
    end
  });

  console.log(`Ventas filtradas: ${ventasFiltradas.length} de ${ventas.length}`);
  
  // Si no hay ventas en el rango, mostrar las últimas 5 como referencia
  if (ventasFiltradas.length === 0 && ventas.length > 0) {
    console.warn('No se encontraron ventas con los filtros especificados. Últimas 5 ventas:', 
      ventas.slice(0, 5).map(v => ({
        id: v.id,
        fecha: v.fecha,
        total: v.total,
        empresaId: v.empresaId,
        cajaId: v.cajaId
      }))
    );
  }
  
  return ventasFiltradas;
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
  end?: Date | string
): Gasto[] {
  console.log(`Filtrando ${gastos?.length || 0} gastos con periodo:`, periodo);
  
  if (!gastos || gastos.length === 0) {
    console.warn('No hay gastos para filtrar');
    return [];
  }

  const gastosFiltrados = filtrarPorRangoFechas<Gasto>({
    items: gastos,
    getDateFn: (g: Gasto) => g.createdAt, // Usamos solo createdAt ya que es el campo que existe en el tipo Gasto
    periodo,
    start,
    end
  });

  console.log(`Gastos filtrados: ${gastosFiltrados.length} de ${gastos.length}`);
  
  // Si no hay gastos en el rango, mostrar los últimos 5 como referencia
  if (gastosFiltrados.length === 0 && gastos.length > 0) {
    console.warn('No se encontraron gastos en el rango especificado. Últimos 5 gastos:', 
      gastos.slice(0, 5).map(g => ({
        id: g.id,
        monto: g.monto,
        fecha: g.fecha || g.createdAt,
        descripcion: g.descripcion,
        empresaId: g.empresaId
      }))
    );
  }
  
  return gastosFiltrados;
}

export default Dashboard;
