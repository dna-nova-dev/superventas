import type React from "react";
import { useEffect, useState } from "react";
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
import { useAuth } from "@/contexts/AuthContext";
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
import {
  Categoria,
  Cliente,
  Empresa,
  Producto,
  Venta,
  VentaDetalle,
} from "@/types";
import { Caja } from "../types/caja.interface";

interface CategorySalesData {
  categoria: string;
  total: number;
  color?: string;
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

  const filteredVentas = ventas.filter(
    (v) => v.empresaId === currentEmpresa?.id
  );
  const filteredVentaDetalles = ventaDetalles.filter(
    (vd) => vd.empresaId === currentEmpresa?.id
  );
  const filteredCategorias = categorias.filter(
    (c) => c.empresaId === currentEmpresa?.id
  );
  const filteredClientes = clientes.filter(
    (c) => c.empresaId === currentEmpresa?.id
  );

  const reportGenerator = currentEmpresa
    ? new ReportGenerator(currentEmpresa)
    : null;

  const loadCajas = async () => {
    try {
      const allCajas = await getAllCajas();
      setCajas(allCajas);
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudieron cargar las cajas",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoading(true);
        const [
          ventasData,
          productosData,
          ventaDetallesData,
          categoriasData,
          clientesData,
        ] = await Promise.all([
          getVentas(),
          getAllProductos(),
          getVentaDetalles(),
          getAllCategorias(),
          getAllClientes(),
        ]);

        setVentas(ventasData);
        setProductos(productosData);
        setVentaDetalles(ventaDetallesData);
        setCategorias(categoriasData);
        setClientes(clientesData);
      } catch (error) {
        console.error("Error loading dashboard data:", error);
        toast({
          title: "Error",
          description: "No se pudieron cargar los datos",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadCajas();
    loadInitialData();
  }, [toast]);

  const filterVentasByPeriod = (period: string): Venta[] => {
    const today = new Date();
    let startDate: Date;

    switch (period) {
      case "7days":
        startDate = new Date(today.setDate(today.getDate() - 7));
        break;
      case "30days":
        startDate = new Date(today.setDate(today.getDate() - 30));
        break;
      case "365days":
        startDate = new Date(today.setDate(today.getDate() - 365));
        break;
      default:
        return filteredVentas;
    }

    return filteredVentas.filter((venta) => {
      const ventaDate = new Date(venta.fecha);
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

    return filteredVentaDetalles.filter((detalle) => {
      const venta = filteredVentas.find(
        (v) => v.codigo === detalle.ventaCodigo
      );
      if (!venta) return false;
      const ventaDate = new Date(venta.fecha);
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

  const getSalesByCategory = (): CategorySalesData[] => {
    return filteredCategorias
      .map((categoria, index) => {
        const productosCategoria = productos.filter(
          (p) => p.categoriaId === categoria.id
        );
        const productoIds = productosCategoria.map((p) => p.id);

        const total = filteredVentaDetallesByPeriod
          .filter((detalle) => productoIds.includes(detalle.productoId))
          .reduce((sum, detalle) => sum + parseFloat(detalle.total), 0);

        return {
          categoria: categoria.nombre,
          total,
          color: COLORS[index % COLORS.length],
        };
      })
      .filter((cat) => cat.total > 0); // Solo mostrar categorías con ventas
  };

  const totalVentasPorCategorias = getSalesByCategory();

  const handleDownloadReport = (
    reportType: string,
    format: "excel" | "pdf"
  ) => {
    try {
      if (!reportGenerator || !currentEmpresa) {
        toast({
          title: "Error",
          description: "No se pudo cargar la información de la empresa",
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
      console.error("Error al generar reporte:", error);
      toast({
        title: "Error",
        description: "Ocurrió un error al generar el reporte",
        variant: "destructive",
      });
    }
  };

  console.log(filteredVentas);

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
            <div className="p-6 pb-0">
              <h2 className="text-xl font-semibold mb-2">
                Ventas por Categoría
              </h2>
              <div className="flex justify-between items-center mb-4">
                <p className="text-sm text-muted-foreground">
                  Distribución de ventas por categorías
                </p>
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
            </div>
            <div className="px-6 h-[300px]">
              {totalVentasPorCategorias.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={totalVentasPorCategorias}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="total"
                      nameKey="categoria"
                      label={({ name, percent }) =>
                        `${name}: ${(percent * 100).toFixed(0)}%`
                      }
                    >
                      {totalVentasPorCategorias.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.color || COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number) => formatCurrency(value)}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center p-8">
                  <div className="p-4 rounded-full bg-muted mb-3">
                    <PieChart className="h-10 w-10 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-medium mb-1">
                    No hay datos disponibles
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    No se encontraron ventas para las categorías en el período
                    seleccionado
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
                <h2 className="text-xl font-semibold mb-2">Resumen</h2>
                <p className="text-sm text-muted-foreground">
                  Resumen de gastos y ventas por caja
                </p>
              </div>
            </div>
            <div className="h-[300px] flex justify-between gap-x-[20px]">
              <Select value={selectedCaja} onValueChange={setSelectedCaja}>
                <SelectTrigger className="w-[180px] bg-transparent text-foreground">
                  <SelectValue placeholder="Seleccionar caja" />
                </SelectTrigger>
                <SelectContent>
                  {cajas.map((opt) => (
                    <SelectItem key={opt.numero} value={opt.numero.toString()}>
                      Caja {opt.numero}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="h-full w-full g-transparent rounded-xl border px-[20px]">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 font-medium">Categoría</th>
                      <th className="text-right py-3 font-medium">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredVentas.map((item, index) => (
                      <tr
                        key={index}
                        className="border-b last:border-0 hover:bg-muted/50"
                      >
                        <td className="py-3">ventas</td>
                        <td className="py-3 text-right font-medium">
                          {formatCurrency(item.total)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
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
                {totalVentasPorCategorias.map((item, index) => (
                  <tr
                    key={index}
                    className="border-b last:border-0 hover:bg-muted/50"
                  >
                    <td className="py-3">{item.categoria}</td>
                    <td className="py-3 text-right font-medium">
                      {formatCurrency(item.total)}
                    </td>
                    <td className="py-3 text-right">
                      {totalVentas > 0
                        ? `${((item.total / totalVentas) * 100).toFixed(1)}%`
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
