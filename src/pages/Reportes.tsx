import type React from "react";
import { useCallback, useEffect, useState, useMemo } from "react";
import { Layout } from "@/components/layout/Layout";
import { formatCurrency } from "@/data/mockData";
import {
  FileText,
  Calendar,
  Download,
  BarChart3,
  PieChart,
  DollarSign,
  FileSpreadsheet,
  FileIcon as FilePdf,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { motion } from "framer-motion";
import { getVentas } from "@/services/ventaService";
import { getAllProductos } from "@/services/productoService";
import { getVentaDetalles } from "@/services/ventaDetalleService";
import { getAllCategorias } from "@/services/categoriaService";
import { ReportGenerator } from "@/utils/report-generator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/useAuth";
import { getAllClientes } from "@/services/clienteService";
import { getAllCajas } from "@/services/cajaService";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Pie,
  Cell,
  Line,
  Legend,
  LineChart,
} from "recharts";
import { Categoria, Cliente, Empresa as EmpresaType, Producto, Venta, VentaDetalle } from "@/types";

// Interfaz mínima requerida para el generador de reportes
interface Empresa {
  id: number;
  nombre: string;
  nit: string;
  telefono: string;
  email: string;
  direccion: string;
  propietarioId: number;
}

import { Caja } from "../types/caja.interface";

interface PieChartData {
  name: string;
  value: number;
  color: string;
  categoriaId: number;
  categoriaNombre: string;
}

const COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#A28DFF",
  "#FF6B6B",
  "#4ECDC4",
  "#FF9F1C",
];

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

const ReportCard = ({
  title,
  icon: Icon,
  description,
  onDownload,
}: {
  title: string;
  icon: React.ElementType;
  description: string;
  onDownload: (format: "excel" | "pdf") => void;
}) => (
  <motion.div
    variants={itemVariants}
    whileHover={{ scale: 1.02 }}
    whileTap={{ scale: 0.98 }}
    className="bg-transparent rounded-xl border shadow-sm p-6 transition-all card-hover"
  >
    <div className="flex items-center space-x-4">
      <div className="p-3 rounded-full bg-amber-100">
        <Icon className="h-6 w-6 text-amber-500" />
      </div>
      <div>
        <h3 className="font-medium">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
    <div className="mt-4 pt-4 border-t flex justify-end">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="text-sm text-blue-500 hover:underline flex items-center">
            <Download className="h-4 w-4 mr-1" />
            Descargar
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onClick={() => onDownload("excel")}
            className="cursor-pointer"
          >
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Excel (.xlsx)
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => onDownload("pdf")}
            className="cursor-pointer"
          >
            <FilePdf className="h-4 w-4 mr-2" />
            PDF (.pdf)
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  </motion.div>
);

const Reportes = () => {
  const { toast } = useToast();
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [ventaDetalles, setVentaDetalles] = useState<VentaDetalle[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [cajas, setCajas] = useState<Caja[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState("7days");
  const [selectedCategoryPeriod, setSelectedCategoryPeriod] = useState("all");
  const [selectedCaja, setSelectedCaja] = useState<string>("");
  const { currentEmpresa } = useAuth();

  // Obtener el ID de la empresa de manera segura
  const empresaId = currentEmpresa?.id || 1; // Usar 1 como valor por defecto temporalmente
  
  const filteredVentas = ventas.filter(
    (v) => v.empresaId === empresaId
  );
  const filteredVentaDetalles = ventaDetalles.filter(
    (vd) => vd.empresaId === empresaId
  );
  const filteredCategorias = categorias.filter(
    (c) => c.empresaId === empresaId
  );
  const filteredClientes = clientes.filter(
    (c) => c.empresaId === empresaId
  );

  console.log('Datos filtrados:', {
    filteredVentas,
    filteredVentaDetalles,
    filteredCategorias,
    filteredClientes,
    empresaId,
    currentEmpresa // Para depuración
  });

  // Solo crear el reportGenerator si tenemos una empresa válida
  const reportGenerator = useMemo(() => {
    if (!currentEmpresa) {
      console.warn('No hay una empresa seleccionada. No se puede generar el reporte.');
      return null;
    }
    
    try {
      return new ReportGenerator(currentEmpresa);
    } catch (error) {
      console.error('Error al crear el generador de reportes:', error);
      return null;
    }
  }, [currentEmpresa]);

  const loadCajas = useCallback(async () => {
    if (!empresaId) {
      console.warn('No hay una empresa seleccionada para cargar las cajas');
      return;
    }

    try {
      console.log('Cargando cajas para la empresa:', empresaId);
      const allCajas = await getAllCajas();
      
      // Filtrar cajas por empresaId
      const cajasFiltradas = allCajas.filter(caja => caja.empresaId === empresaId);
      
      console.log('Cajas cargadas:', cajasFiltradas);
      setCajas(cajasFiltradas);
      
      // Seleccionar la primera caja por defecto si hay cajas disponibles
      if (cajasFiltradas.length > 0 && !selectedCaja) {
        setSelectedCaja(cajasFiltradas[0].id.toString());
      }
    } catch (error) {
      console.error('Error al cargar cajas:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las cajas",
        variant: "destructive",
      });
    }
  }, [empresaId, toast, selectedCaja]);

  const loadInitialData = useCallback(async () => {
    if (!empresaId) return;
    
    try {
      console.log('Iniciando carga de datos para empresaId:', empresaId);
      setLoading(true);
      const [
        ventasData,
        productosData,
        ventaDetallesData,
        categoriasData,
        clientesData,
      ] = await Promise.all([
        getVentas(empresaId),
        getAllProductos(empresaId),
        getVentaDetalles(empresaId),
        getAllCategorias(empresaId),
        getAllClientes(empresaId),
      ]);

      console.log('Datos cargados:', {
        ventas: ventasData,
        productos: productosData,
        ventaDetalles: ventaDetallesData,
        categorias: categoriasData,
        clientes: clientesData,
        currentEmpresa: currentEmpresa
      });

      setVentas(ventasData);
      setProductos(productosData);
      setVentaDetalles(ventaDetallesData);
      setCategorias(categoriasData);
      setClientes(clientesData);
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast, currentEmpresa]);

  // Cargar cajas cuando cambie el ID de la empresa
  useEffect(() => {
    if (empresaId) {
      console.log('Empresa cambiada, cargando cajas para empresa:', empresaId);
      loadCajas();
    }
  }, [empresaId, loadCajas]);

  // Cargar datos iniciales
  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  const filterVentasByPeriod = (period: string): Venta[] => {
    const today = new Date();
    let startDate: Date;

    switch (period) {
      case "7days":
        startDate = new Date(today);
        startDate.setDate(today.getDate() - 7);
        break;
      case "30days":
        startDate = new Date(today);
        startDate.setDate(today.getDate() - 30);
        break;
      case "365days":
        startDate = new Date(today);
        startDate.setDate(today.getDate() - 365);
        break;
      default:
        return filteredVentas;
    }

    startDate.setHours(0, 0, 0, 0);
    
    return filteredVentas.filter((venta) => {
      const ventaDate = new Date(venta.createdAt);
      return ventaDate >= startDate;
    });
  };

  const filterVentaDetallesByPeriod = (period: string): VentaDetalle[] => {
    const today = new Date();
    let startDate: Date;

    switch (period) {
      case "month":
        startDate = new Date(today.getFullYear(), today.getMonth(), 1);
        break;
      case "year":
        startDate = new Date(today.getFullYear(), 0, 1);
        break;
      default:
        return filteredVentaDetalles;
    }

    startDate.setHours(0, 0, 0, 0);
    
    return filteredVentaDetalles.filter((detalle) => {
      const venta = filteredVentas.find(
        (v) => v.codigo === detalle.ventaCodigo
      );
      if (!venta) return false;
      const ventaDate = new Date(venta.createdAt);
      return ventaDate >= startDate;
    });
  };

  const filteredVentasByPeriod = filterVentasByPeriod(selectedPeriod);
  const filteredVentaDetallesByPeriod = filterVentaDetallesByPeriod(
    selectedCategoryPeriod
  );

  // Convertir totales de string a number para cálculos
  const totalVentas = filteredVentas.reduce(
    (acc, venta) => acc + parseFloat(venta.total),
    0
  );

  const getSalesByCategory = (): PieChartData[] => {
    // Group venta detalles by product category
    const categorySales = filteredVentaDetallesByPeriod.reduce((acc, detalle) => {
      const product = productos.find(p => p.id === detalle.productoId);
      if (!product) return acc;
      
      const category = filteredCategorias.find(c => c.id === product.categoriaId);
      if (!category) return acc;
      
      const total = typeof detalle.total === 'string' ? parseFloat(detalle.total) || 0 : Number(detalle.total) || 0;
      
      if (!acc[category.id]) {
        acc[category.id] = {
          name: category.nombre,
          value: 0,
          color: COLORS[Object.keys(acc).length % COLORS.length],
          categoriaId: category.id,
          categoriaNombre: category.nombre
        };
      }
      
      acc[category.id].value += total;
      return acc;
    }, {} as Record<number, PieChartData>);
    
    // Convert to array and filter out categories with no sales
    return Object.values(categorySales)
      .filter(item => item.value > 0)
      .map(item => ({
        ...item,
        value: Number(item.value.toFixed(2)) // Ensure 2 decimal places
      }));
  };

  const totalVentasPorCategorias = getSalesByCategory();
  
  // Debug: Log the data for the pie chart
  useEffect(() => {
    // Log the first item's structure if it exists
    if (totalVentasPorCategorias.length > 0) {
      console.log('First category item structure:', {
        ...totalVentasPorCategorias[0],
        __type: 'First category item'
      });
    }
    console.log('=== DEBUG: Pie Chart Data ===');
    console.log('totalVentasPorCategorias:', JSON.parse(JSON.stringify(totalVentasPorCategorias)));
    console.log('filteredVentaDetalles length:', filteredVentaDetalles.length);
    console.log('filteredVentaDetallesByPeriod length:', filteredVentaDetallesByPeriod.length);
    console.log('filteredCategorias:', JSON.parse(JSON.stringify(filteredCategorias)));
    console.log('productos length:', productos.length);
    console.log('selectedCategoryPeriod:', selectedCategoryPeriod);
    
    // Log detailed category data
    console.log('=== Category Details ===');
    filteredCategorias.forEach((cat, index) => {
      const catProducts = productos.filter(p => p.categoriaId === cat.id);
      const catSales = filteredVentaDetallesByPeriod
        .filter(d => catProducts.some(p => p.id === d.productoId))
        .reduce((sum, d) => {
          const total = typeof d.total === 'string' ? parseFloat(d.total) : Number(d.total);
          return sum + (isNaN(total) ? 0 : total);
        }, 0);
      
      console.log(`Category ${index + 1}:`, {
        id: cat.id,
        nombre: cat.nombre,
        productos: catProducts.length,
        ventas: catSales,
        color: COLORS[index % COLORS.length]
      });
    });
    
    console.log('============================');
  }, [totalVentasPorCategorias, filteredVentaDetalles, filteredVentaDetallesByPeriod, filteredCategorias, productos, selectedCategoryPeriod]);

  const handleDownloadReport = (
    reportType: string,
    format: "excel" | "pdf"
  ) => {
    try {
      if (!currentEmpresa) {
        toast({
          title: "Error",
          description: "No hay una empresa seleccionada. Por favor, inicia sesión nuevamente.",
          variant: "destructive",
        });
        return;
      }
      
      if (!reportGenerator) {
        toast({
          title: "Error",
          description: "No se pudo inicializar el generador de reportes. Por favor, inténtalo de nuevo.",
          variant: "destructive",
        });
        return;
      }

      const reportData = {
        ventas: filteredVentas,
        productos: productos,
        clientes: filteredClientes,
        ventaDetalles: filteredVentaDetalles,
        categorias: filteredCategorias,
        currentEmpresa,
      };

      const filters = {
        period:
          reportType === "Ventas"
            ? selectedPeriod
            : reportType === "Ventas por Categoría"
            ? selectedCategoryPeriod
            : undefined,
      };

      reportGenerator.generateReport(reportType, format, reportData, filters);

      toast({
        title: "Reporte generado",
        description: `El reporte de ${reportType} ha sido descargado en formato ${
          format === "excel" ? "Excel" : "PDF"
        }`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Ocurrió un error al generar el reporte",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <motion.div
        className="space-y-6"
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
        <motion.div
          variants={itemVariants}
          className="flex justify-between items-center"
        >
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center">
              <FileText className="mr-3 h-8 w-8 text-amber-500" />
              Reportes
            </h1>
            <p className="text-muted-foreground">
              Genere y visualice reportes del sistema.
            </p>
          </div>
        </motion.div>

        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-4"
          variants={containerVariants}
        >
          <motion.div
            variants={itemVariants}
            className="bg-transparent rounded-xl border shadow-sm p-6 transition-all card-hover"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">
                  Ventas Totales
                </p>
                <h3 className="text-2xl font-bold">
                  {formatCurrency(totalVentas)}
                </h3>
              </div>
              <div className="p-3 rounded-full bg-amber-100">
                <DollarSign className="h-6 w-6 text-amber-500" />
              </div>
            </div>
          </motion.div>

          <motion.div
            variants={itemVariants}
            className="bg-transparent rounded-xl border shadow-sm p-6 transition-all card-hover"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">
                  Productos Vendidos
                </p>
                <h3 className="text-2xl font-bold">
                  {ventaDetalles.reduce(
                    (acc, detalle) => acc + detalle.cantidad,
                    0
                  )}
                </h3>
              </div>
              <div className="p-3 rounded-full bg-purple-100">
                <BarChart3 className="h-6 w-6 text-purple-500" />
              </div>
            </div>
          </motion.div>

          <motion.div
            variants={itemVariants}
            className="bg-transparent rounded-xl border shadow-sm p-6 transition-all card-hover"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">
                  Último Reporte
                </p>
                <h3 className="text-2xl font-bold">
                  <Calendar className="h-5 w-5 text-muted-foreground inline mr-1" />
                  Hoy
                </h3>
              </div>
              <div className="p-3 rounded-full bg-green-100">
                <FileText className="h-6 w-6 text-green-500" />
              </div>
            </div>
          </motion.div>
        </motion.div>

        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
          variants={containerVariants}
        >
          <motion.div
            variants={itemVariants}
            className="bg-transparent rounded-xl border shadow-sm overflow-hidden"
          >
            <div className="p-6 pb-0">
              <h2 className="text-xl font-semibold mb-2">Ventas por Período</h2>
              <div className="flex justify-between items-center mb-4">
                <p className="text-sm text-muted-foreground">
                  Visualización de tendencias de ventas
                </p>
                <Select
                  value={selectedPeriod}
                  onValueChange={setSelectedPeriod}
                >
                  <SelectTrigger className="w-[180px] bg-transparent">
                    <SelectValue placeholder="Seleccionar período" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7days">Últimos 7 días</SelectItem>
                    <SelectItem value="30days">Último mes</SelectItem>
                    <SelectItem value="365days">Último año</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="px-6 h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={filteredVentasByPeriod}
                  margin={{
                    top: 5,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="fecha"
                    tickFormatter={(date) =>
                      new Date(date).toLocaleDateString()
                    }
                  />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="total"
                    stroke="#8884d8"
                    activeDot={{ r: 8 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          <motion.div
            variants={itemVariants}
            className="bg-transparent rounded-xl border shadow-sm overflow-hidden"
          >
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h2 className="text-xl font-semibold">
                    Ventas por Categoría
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Distribución de ventas por categorías
                  </p>
                </div>
                <Select
                  value={selectedCategoryPeriod}
                  onValueChange={setSelectedCategoryPeriod}
                >
                  <SelectTrigger className="w-[180px] bg-transparent">
                    <SelectValue placeholder="Seleccionar período" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las ventas</SelectItem>
                    <SelectItem value="month">Este mes</SelectItem>
                    <SelectItem value="year">Este año</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {totalVentasPorCategorias.length > 0 ? (
                <div className="space-y-4">
                  <div className="border rounded-lg overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            Categoría
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            Ventas
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            Porcentaje
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-transparent divide-y divide-gray-200">
                        {totalVentasPorCategorias.map((item, index) => (
                          <tr key={index} className="hover:bg-muted/10">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div 
                                  className="w-3 h-3 rounded-full mr-2" 
                                  style={{ backgroundColor: item.color }}
                                />
                                <span className="text-sm font-medium">{item.name}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              {formatCurrency(item.value)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                              {totalVentas > 0 
                                ? `${((item.value / totalVentas) * 100).toFixed(1)}%`
                                : '0%'}
                            </td>
                          </tr>
                        ))}
                        <tr className="bg-muted/10 font-medium">
                          <td className="px-6 py-4 whitespace-nowrap">
                            Total
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            {formatCurrency(totalVentas)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            100%
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="text-center p-8 border rounded-lg">
                  <div className="mx-auto w-16 h-16 bg-muted/20 rounded-full flex items-center justify-center mb-4">
                    <PieChart className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-medium mb-1">No hay datos disponibles</h3>
                  <p className="text-sm text-muted-foreground">
                    No se encontraron ventas para las categorías seleccionadas
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>

        <motion.div variants={containerVariants}>
          <motion.h2
            variants={itemVariants}
            className="text-xl font-semibold mb-4"
          >
            Generar Reportes
          </motion.h2>
          <motion.div
            className="grid grid-cols-1 md:grid-cols-3 gap-4"
            variants={containerVariants}
          >
            <ReportCard
              title="Reporte de Ventas"
              icon={FileText}
              description="Reporte detallado de ventas por período"
              onDownload={(format) => handleDownloadReport("Ventas", format)}
            />

            <ReportCard
              title="Inventario"
              icon={BarChart3}
              description="Stock actual y valoración del inventario"
              onDownload={(format) =>
                handleDownloadReport("Inventario", format)
              }
            />

            <ReportCard
              title="Productos Populares"
              icon={PieChart}
              description="Productos más vendidos y rentables"
              onDownload={(format) =>
                handleDownloadReport("Productos Populares", format)
              }
            />
          </motion.div>
        </motion.div>

        <motion.div
          variants={itemVariants}
          className="bg-transparent rounded-xl border shadow-sm overflow-hidden"
        >
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="text-xl font-semibold mb-2">
                  Ventas por Categoría
                </h2>
                <p className="text-sm text-muted-foreground">
                  Desglose de ingresos por categorías de productos
                </p>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="text-sm text-blue-500 hover:underline flex items-center">
                    <Download className="h-4 w-4 mr-1" />
                    Exportar
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() =>
                      handleDownloadReport("Ventas por Categoría", "excel")
                    }
                    className="cursor-pointer"
                  >
                    <FileSpreadsheet className="h-4 w-4 mr-2" />
                    Excel (.xlsx)
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() =>
                      handleDownloadReport("Ventas por Categoría", "pdf")
                    }
                    className="cursor-pointer"
                  >
                    <FilePdf className="h-4 w-4 mr-2" />
                    PDF (.pdf)
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 font-medium">Categoría</th>
                  <th className="text-right py-3 font-medium">Total Vendido</th>
                  <th className="text-right py-3 font-medium">Porcentaje</th>
                </tr>
              </thead>
              <tbody>
                {totalVentasPorCategorias.map((item) => (
                  <tr
                    key={`${item.categoriaId}-${item.value}`}
                    className="border-b last:border-0 hover:bg-muted/50"
                  >
                    <td className="py-3">{item.name}</td>
                    <td className="py-3 text-right font-medium">
                      {formatCurrency(item.value)}
                    </td>
                    <td className="py-3 text-right">
                      {totalVentas > 0
                        ? `${((item.value / totalVentas) * 100).toFixed(1)}%`
                        : "0%"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      </motion.div>
    </Layout>
  );
};

export default Reportes;
