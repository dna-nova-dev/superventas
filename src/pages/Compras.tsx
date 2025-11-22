import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, Variants } from "framer-motion";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { jsPDF } from "jspdf";
import { 
  Truck, 
  ShoppingBag, 
  Receipt, 
  Printer, 
  Trash, 
  Plus, 
  Search, 
  CalendarIcon, 
  X 
} from "lucide-react";

// Components
import { Layout } from "@/components/layout/Layout";
import { DataTable } from "@/components/ui/DataTable";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Hooks
import { useToast } from "@/hooks/use-toast";
import { useRolePermissions } from "@/hooks/useRolePermissions";
import { useAuth } from "@/hooks/useAuth";

// Services
import { usuarioService } from "@/services/usuarioService";
import { getCompras, deleteCompra as deleteCompraService } from "@/services/compraService";
import { getAllProveedores } from "@/services/proveedorService";
import { getCompraDetalleByCodigo } from "@/services/compraDetalleService";
import { getProductoById } from "@/services/productoService";

// Types
import type { Proveedor, Compra, CompraDetalle, Usuario, Producto } from "@/types";

// Extended type with producto information
interface CompraDetalleWithProduct extends CompraDetalle {
  producto?: {
    id: number;
    nombre: string;
    codigo: string;
  } | null;
}

// Utils
import { formatCurrency } from "@/data/mockData";

interface DetalleConProducto extends Omit<CompraDetalle, 'productoId'> {
  productoId: number;
  producto?: {
    id: number;
    nombre: string;
    codigo?: string;
  } | null;
}

type SelectedCompraDetails = {
  compra: Compra;
  detalles: DetalleConProducto[];
  proveedor?: Proveedor | null;
  usuario?: Usuario | null;
  cliente?: { id: number; nombre: string } | null;
};

type DateRangeType = {
  from: Date | undefined;
  to: Date | undefined;
};

const Compras = () => {
  // Hooks and state
  const { toast } = useToast();
  const { empresaId } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [selectedCompraDetails, setSelectedCompraDetails] = useState<SelectedCompraDetails | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [compras, setCompras] = useState<Compra[]>([]);
  const [deleteCompra, setDeleteCompra] = useState<Compra | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [detalles, setDetalles] = useState<CompraDetalle[]>([]);
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [dateRange, setDateRange] = useState<DateRangeType>({
    from: undefined,
    to: undefined,
  });
  const [dateFilter, setDateFilter] = useState<"all" | "today" | "custom">("all");
  const { getViewMode, canEdit, canDelete } = useRolePermissions();
  const viewMode = getViewMode();

  // Animation variants
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

  const tableVariants: Variants = {
    hidden: {
      opacity: 0,
      y: 20,
    },
    show: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.3,
        ease: [0.4, 0, 0.2, 1], // Using cubic-bezier values instead of string
      },
    },
  };

  // Memoized data loading functions
  const loadUsuarios = useCallback(async () => {
    try {
      const data = await usuarioService.getAllUsuarios();
      setUsuarios(data);
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudieron cargar los usuarios",
        variant: "destructive",
      });
    }
  }, [toast]);

  const loadProveedores = useCallback(async () => {
    try {
      const data = await getAllProveedores();
      setProveedores(data);
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudieron cargar los proveedores",
        variant: "destructive",
      });
    }
  }, [toast]);

  const loadCompras = useCallback(async () => {
    try {
      const data = await getCompras(empresaId || undefined);
      setCompras(data);
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudieron cargar las compras",
        variant: "destructive",
      });
    }
  }, [toast, empresaId]);

  const loadData = useCallback(async () => {
    await Promise.all([
      loadCompras(),
      loadUsuarios(),
      loadProveedores()
    ]);
  }, [loadCompras, loadUsuarios, loadProveedores]);

  // Load purchase details
  const loadDetalles = useCallback(async () => {
    if (!empresaId) return;
    
    try {
      const allDetalles = await Promise.all(
        compras
          .filter(compra => compra.empresaId === empresaId) // Only load details for the current company
          .map(compra => getCompraDetalleByCodigo(compra.codigo))
      );
      setDetalles(allDetalles.flat());
    } catch (error) {
      console.error('Error loading purchase details:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los detalles de las compras",
        variant: "destructive",
      });
    }
  }, [compras, toast]);

  // Initial data load
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Load details when compras changes
  useEffect(() => {
    if (compras.length > 0) {
      loadDetalles();
    }
  }, [compras, loadDetalles]);

  const getProveedorById = (id: number) => {
    return proveedores.find((c) => c.id === id);
  };

  const getUsuarioById = (id: number) => {
    return usuarios.find((u) => u.usuario_id === id);
  };

  const isToday = (dateString: string) => {
    const today = new Date();
    const date = new Date(dateString);

    // Reset time parts to avoid timezone issues
    const todayDate = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    );
    const compareDate = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate()
    );

    return todayDate.getTime() === compareDate.getTime();
  };

  const isInDateRange = (dateString: string) => {
    if (!dateRange || !dateRange.from) return true;

    const date = new Date(dateString);
    const from = new Date(dateRange.from);
    const to = dateRange.to ? new Date(dateRange.to) : null;

    if (from && !to) {
      return date >= from;
    } else if (from && to) {
      // Set time to end of day for the 'to' date
      const endOfDay = new Date(to);
      endOfDay.setHours(23, 59, 59, 999);
      return date >= from && date <= endOfDay;
    }

    return true;
  };

  const columns = [
    {
      header: "Código",
      accessor: (compra: Compra) => compra.codigo,
      className: "w-28",
    },
    {
      header: "Fecha",
      accessor: (compra: Compra) => {
        const fecha = new Date(compra.createdAt);
        return (
          <div>
            <div className="font-medium">
              {fecha.toLocaleDateString("es-GT")}
            </div>
            <div className="text-xs text-muted-foreground">
              {fecha.toLocaleTimeString("es-GT", { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        );
      },
    },
    {
      header: "Proveedor",
      accessor: (compra: Compra) => {
        const proveedor = getProveedorById(compra.proveedorId);
        return proveedor ? `${proveedor.nombre}` : "Proveedor no encontrado";
      },
    },
    {
      header: "Comprador",
      accessor: (compra: Compra) => {
        const usuario = getUsuarioById(compra.usuarioId);
        return usuario
          ? `${usuario.usuario_nombre} ${usuario.usuario_apellido}`
          : "Usuario no encontrado";
      },
    },
    {
      header: "Total",
      accessor: (compra: Compra) => {
        // Calculate total from detalles if available, otherwise use compra.total
        if (compra.detalles && compra.detalles.length > 0) {
          const total = compra.detalles.reduce((sum, detalle) => {
            return sum + (parseFloat(detalle.precioCompra) * detalle.cantidad);
          }, 0);
          return formatCurrency(total);
        }
        return formatCurrency(compra.total);
      },
      className: "font-medium",
    },
  ];

  const filteredCompras = compras.filter((compra) => {
    // Apply search filter
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      const codigoMatch = compra.codigo.toLowerCase().includes(searchLower);
      const fechaMatch = new Date(compra.createdAt).toLocaleDateString('es-GT').includes(searchLower);
      if (!codigoMatch && !fechaMatch) {
        return false;
      }
    }

    // Apply date filters
    if (dateFilter === "today") {
      const today = new Date();
      const compraDate = new Date(compra.createdAt);
      return (
        compraDate.getDate() === today.getDate() &&
        compraDate.getMonth() === today.getMonth() &&
        compraDate.getFullYear() === today.getFullYear()
      );
    }

    if (dateFilter === "custom" && dateRange.from) {
      const compraDate = new Date(compra.createdAt);
      const fromDate = new Date(dateRange.from);
      fromDate.setHours(0, 0, 0, 0);
      
      if (dateRange.to) {
        const toDate = new Date(dateRange.to);
        toDate.setHours(23, 59, 59, 999);
        return compraDate >= fromDate && compraDate <= toDate;
      }
      
      return compraDate >= fromDate;
    }

    return true;
  });

  const handleRowClick = async (compra: Compra) => {
    try {
      // Load the latest details for this specific purchase
      const detallesFiltrados = await getCompraDetalleByCodigo(compra.codigo);
      
      // Load product information for each detail
      const detallesConProductos = await Promise.all(detallesFiltrados.map(async (detalle) => {
        try {
          const producto = await getProductoById(detalle.productoId);
          return {
            ...detalle,
            producto: producto ? {
              id: producto.id,
              nombre: producto.nombre,
              codigo: producto.codigo
            } : null
          };
        } catch (error) {
          console.error('Error loading product:', error);
          return {
            ...detalle,
            producto: null
          };
        }
      }));
      
      setSelectedCompraDetails({
        compra,
        detalles: detallesConProductos,
        proveedor: getProveedorById(compra.proveedorId),
        usuario: getUsuarioById(compra.usuarioId),
      });
      setShowDetails(true);
    } catch (error) {
      console.error('Error in handleRowClick:', error);
      toast({
        title: "Error",
        description: "Error al cargar detalles de la compra",
        variant: "destructive",
      });
    }
  };

  const clearDateFilter = () => {
    setDateFilter("all");
    setDateRange({ from: undefined, to: undefined });
  };

  // Alias for handleRowClick to maintain compatibility
  const handleView = handleRowClick;

  const generateTicket = async (compra: Compra) => {
    try {
      const ldetails = await getCompraDetalleByCodigo(compra.codigo);
      const proveedor = getProveedorById(compra.proveedorId);
      const usuario = getUsuarioById(compra.usuarioId);

      // Tamaño de hoja A5 en orientación vertical (148.5 x 210 mm)
      const pageWidth = 148.5;
      const pageHeight = 210;
      const marginX = 10;
      const contentWidth = pageWidth - (marginX * 2);
      const centerX = pageWidth / 2;

      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a5',
        compress: true,
      });

      // Header
      let y = 15; // Start position from top
      
      // Logo y encabezado
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text("SUPERVENTAS", centerX, y, { align: "center" });
      
      // Subtítulo
      y += 8;
      doc.setFontSize(12);
      doc.setFont("helvetica", "normal");
      doc.text("ORDEN DE COMPRA", centerX, y, { align: "center" });
      
      // Línea decorativa
      y += 5;
      doc.setLineWidth(0.5);
      doc.line(marginX, y, pageWidth - marginX, y);
      y += 8;
      
      // Sección de información general
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text("N° Orden:", marginX, y);
      doc.setFont("helvetica", "normal");
      doc.text(compra.codigo, marginX + 20, y);
      
      y += 5;
      doc.setFont("helvetica", "bold");
      doc.text("Fecha:", marginX, y);
      doc.setFont("helvetica", "normal");
      const formattedDate = new Date(compra.createdAt).toLocaleDateString('es-GT', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      doc.text(`${formattedDate} ${compra.hora}`, marginX + 20, y);
      
      // Información del proveedor
      y += 10;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text("INFORMACIÓN DEL PROVEEDOR", centerX, y, { align: "center" });
      y += 6;
      
      // Marco para la información del proveedor
      const supplierYStart = y;
      
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text("Nombre:", marginX + 5, y + 5);
      doc.setFont("helvetica", "normal");
      const supplierName = proveedor?.nombre || 'No especificado';
      const supplierLines = doc.splitTextToSize(supplierName, contentWidth - 30);
      doc.text(supplierLines, marginX + 25, y + 5);
      
      y += 5 + (supplierLines.length * 4);
      
      doc.setFont("helvetica", "bold");
      doc.text("Documento:", marginX + 5, y + 5);
      doc.setFont("helvetica", "normal");
      doc.text(proveedor?.numeroDocumento || 'N/A', marginX + 35, y + 5);
      
      doc.setFont("helvetica", "bold");
      doc.text("Teléfono:", marginX + 80, y + 5);
      doc.setFont("helvetica", "normal");
      doc.text(proveedor?.telefono || 'N/A', marginX + 100, y + 5);
      
      y += 10;
      
      // Dibujar el marco después de saber la altura
      doc.rect(marginX, supplierYStart, contentWidth, y - supplierYStart);
      
      // Información del usuario que registra
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text("Registrado por:", marginX, y);
      doc.setFont("helvetica", "normal");
      doc.text(usuario ? `${usuario.usuario_nombre} ${usuario.usuario_apellido}` : 'Usuario no disponible', marginX + 30, y);
      
      y += 5;

      // Line separator - thicker and with more space
      y += 3;
      doc.setLineWidth(0.3);
      doc.line(marginX, y, pageWidth - marginX, y);
      y += 5; // More space after separator

      // Encabezado de productos
      y += 10;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text("DETALLE DE PRODUCTOS", centerX, y, { align: "center" });
      y += 8;
      
      // Fondo para el encabezado de la tabla
      const headerY = y;
      doc.setFillColor(240, 240, 240);
      doc.rect(marginX, y, contentWidth, 8, 'F');
      
      // Texto del encabezado
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      doc.text("CANT.", marginX + 5, y + 5);
      doc.text("DESCRIPCIÓN", marginX + 25, y + 5);
      doc.text("P. UNIT.", marginX + 100, y + 5, { align: "right" });
      doc.text("TOTAL", marginX + 125, y + 5, { align: "right" });
      
      // Borde inferior del encabezado
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.3);
      doc.line(marginX, y + 8, pageWidth - marginX, y + 8);
      
      y += 10; // Espacio después del encabezado

      // Lista de productos
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      
      // Guardar la posición Y inicial para el borde posterior
      const productsStartY = y;
      
      for (const detalle of ldetails) {
        // Obtener información del producto
        let productName = `Producto ${detalle.productoId}`;
        let productCode = '';
        
        try {
          const producto = await getProductoById(detalle.productoId);
          if (producto) {
            productName = producto.nombre || productName;
            productCode = producto.codigo || '';
          }
        } catch (error) {
          console.error('Error al cargar el producto:', error);
        }
        
        // Calcular espacio necesario para este producto
        const availableWidth = 80; // Ancho para la descripción
        const productLines = doc.splitTextToSize(`${productName}${productCode ? ' (' + productCode + ')' : ''}`, availableWidth);
        const lineHeight = 5;
        const productHeight = Math.max(8, productLines.length * lineHeight);
        
        // Verificar si necesitamos una nueva página
        if (y + productHeight > pageHeight - 30) {
          doc.addPage();
          y = 20;
          // Volver a dibujar el encabezado
          doc.setFontSize(10);
          doc.text("Continuación de la orden de compra", marginX, 15);
          doc.setLineWidth(0.2);
          doc.line(marginX, 18, pageWidth - marginX, 18);
          y = 25;
        }
        
        // Cantidad
        doc.text(detalle.cantidad.toString(), marginX + 5, y + (productHeight / 2) + 2);
        
        // Nombre del producto y código
        doc.text(productLines, marginX + 25, y + (productLines.length > 1 ? 0 : 3));
        
        // Precio unitario
        doc.text(
          formatCurrency(Number(detalle.precioCompra)), 
          marginX + 105, 
          y + (productHeight / 2) + 2, 
          { align: "right" }
        );
        
        // Total
        doc.setFont("helvetica", "medium");
        doc.text(
          formatCurrency(Number(detalle.total)), 
          marginX + 125, 
          y + (productHeight / 2) + 2, 
          { align: "right" }
        );
        doc.setFont("helvetica", "normal");
        
        // Línea divisoria
        doc.setDrawColor(230, 230, 230);
        doc.setLineWidth(0.1);
        doc.line(marginX, y + productHeight + 1, pageWidth - marginX, y + productHeight + 1);
        
        y += productHeight + 2;
      }
      
      // Dibujar el borde exterior de la tabla
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.3);
      doc.rect(marginX, headerY, contentWidth, y - headerY);

      // Sección de totales
      y += 10;
      
      // Línea superior del recuadro de totales
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.3);
      doc.line(pageWidth - marginX - 70, y, pageWidth - marginX, y);
      
      // Subtotal
      y += 6;
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text("Subtotal:", pageWidth - marginX - 60, y, { align: "right" });
      doc.text(formatCurrency(compra.total), pageWidth - marginX, y, { align: "right" });
      
      // Impuestos (si los hay)
      y += 5;
      doc.text("Impuestos:", pageWidth - marginX - 60, y, { align: "right" });
      doc.text("Q 0.00", pageWidth - marginX, y, { align: "right" });
      
      // Total
      y += 8;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text("TOTAL:", pageWidth - marginX - 60, y, { align: "right" });
      doc.text(formatCurrency(compra.total), pageWidth - marginX, y, { align: "right" });
      
      // Línea inferior del recuadro de totales
      y += 2;
      doc.setLineWidth(0.3);
      doc.line(pageWidth - marginX - 70, y, pageWidth - marginX, y);
      
      // Pie de página
      y = pageHeight - 20;
      
      // Línea separadora
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.2);
      doc.line(marginX, y, pageWidth - marginX, y);
      y += 3;
      
      // Texto del pie de página
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      
      // Información de la empresa
      doc.text("SUPERVENTAS - Sistema de Gestión Comercial", centerX, y, { align: "center" });
      y += 3.5;
      
      doc.setFontSize(7);
      doc.text("Documento de uso interno - No válido como factura", centerX, y, { align: "center" });
      y += 3.5;
      
      // Fecha de generación
      doc.setFont("helvetica", "italic");
      doc.text(
        `Generado el ${new Date().toLocaleString('es-GT', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        })}`, 
        centerX, 
        y, 
        { align: "center" }
      );
      
      // Restaurar color de texto
      doc.setTextColor(0, 0, 0);

      return doc;
    } catch (error) {
      console.error("Error generating purchase receipt:", error);
      throw error;
    }
  };

  const printTicket = async (compra: Compra) => {
    try {
      const doc = await generateTicket(compra);
      
      // Create a blob URL for the PDF
      const blob = doc.output('blob');
      const url = URL.createObjectURL(blob);
      
      // Create a temporary anchor element to trigger the download
      const a = document.createElement('a');
      a.href = url;
      a.download = `compra-${compra.codigo}.pdf`;
      document.body.appendChild(a);
      a.click();
      
      // Clean up
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 100);

      toast({
        title: "Ticket generado",
        description: `Ticket de compra ${compra.codigo} se está descargando`,
      });
    } catch (error) {
      console.error('Error generating ticket:', error);
      toast({
        title: "Error",
        description: `Error al generar el ticket: ${error instanceof Error ? error.message : 'Error desconocido'}`,
        variant: "destructive",
      });
    }
  };

  const handlePrint = async (compra: Compra) => {
    await printTicket(compra);
  };

  const handleAddCompra = () => {
    navigate("/comprar");
  };

  const handleDeleteClick = useCallback((compra: Compra) => {
    setDeleteCompra(compra);
    setShowDeleteConfirm(true);
  }, []);

  console.log(compras);

  return (
    <Layout>
      <motion.div
        className="space-y-6"
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
        <motion.div variants={itemVariants}>
          <h1 className="text-3xl font-bold tracking-tight flex items-center">
            <Truck className="mr-3 h-8 w-8 text-blue-500" />
            Compras
          </h1>
          <p className="text-muted-foreground">
            Administre las compras registradas en el sistema.
          </p>
        </motion.div>

        {viewMode === "cards" && (
          <motion.div variants={containerVariants}>
            <motion.div
              variants={itemVariants}
              className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4"
            >
              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Buscar por código o fecha..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 h-9 w-full sm:w-[300px] rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    variant={dateFilter === "today" ? "default" : "outline"}
                    size="sm"
                    onClick={() =>
                      setDateFilter(dateFilter === "today" ? "all" : "today")
                    }
                    className="h-9"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    Hoy
                  </Button>

                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={
                          dateFilter === "custom" ? "default" : "outline"
                        }
                        size="sm"
                        className="h-9"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dateFilter === "custom" && dateRange.from ? (
                          dateRange.to ? (
                            <>
                              {format(dateRange.from, "dd/MM/yyyy")} -{" "}
                              {format(dateRange.to, "dd/MM/yyyy")}
                            </>
                          ) : (
                            format(dateRange.from, "dd/MM/yyyy")
                          )
                        ) : (
                          "Rango de fechas"
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        initialFocus
                        mode="range"
                        defaultMonth={dateRange.from}
                        selected={dateRange}
                        onSelect={(range) => {
                          setDateRange(
                            (range as DateRangeType) || {
                              from: undefined,
                              to: undefined,
                            }
                          );
                          setDateFilter(range?.from ? "custom" : "all");
                        }}
                        locale={es}
                        numberOfMonths={2}
                      />
                    </PopoverContent>
                  </Popover>

                  {(dateFilter === "today" || dateFilter === "custom") && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearDateFilter}
                      className="h-9"
                    >
                      <X className="mr-2 h-4 w-4" />
                      Limpiar
                    </Button>
                  )}
                </div>
              </div>

              {canEdit() && (
                <button
                  onClick={handleAddCompra}
                  className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring h-9 px-4 py-2 bg-primary text-primary-foreground shadow hover:bg-primary/90 w-full sm:w-auto"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Nueva Venta
                </button>
              )}
            </motion.div>
          </motion.div>
        )}

        {viewMode === "list" && (
          <motion.div variants={tableVariants} initial="hidden" animate="show">
            <DataTable
              data={filteredCompras}
              columns={[
                ...columns,
                {
                  header: "Acciones",
                  accessor: (compra: Compra) => (
                    <div className="flex items-center justify-end gap-2">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              className="p-2 rounded-md hover:bg-blue-50 text-blue-500 border border-input"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleView(compra);
                              }}
                            >
                              <Receipt className="h-4 w-4" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Visualizar ticket</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              className="p-2 rounded-md hover:bg-green-50 text-green-500 border border-input"
                              onClick={(e) => {
                                e.stopPropagation();
                                handlePrint(compra);
                              }}
                            >
                              <Printer className="h-4 w-4" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Imprimir ticket</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      {canDelete() && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                className="p-2 rounded-md hover:bg-red-50 text-red-500 border border-input"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteClick(compra);
                                }}
                              >
                                <Trash className="h-4 w-4" />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Eliminar compra</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </div>
                  ),
                  className: "w-[150px]",
                },
              ]}
              title="Listado de Compras"
              description="Todas las compras registradas en el sistema"
              onRowClick={handleRowClick}
              searchKeys={["codigo", "fecha"]}
              searchPlaceholder="Buscar por código o fecha..."
              actions={
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="flex gap-2">
                    <Button
                      variant={dateFilter === "today" ? "default" : "outline"}
                      size="sm"
                      onClick={() =>
                        setDateFilter(dateFilter === "today" ? "all" : "today")
                      }
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      Hoy
                      {dateFilter === "today" && (
                        <X
                          className="ml-2 h-4 w-4"
                          onClick={(e) => {
                            e.stopPropagation();
                            clearDateFilter();
                          }}
                        />
                      )}
                    </Button>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant={
                            dateFilter === "custom" ? "default" : "outline"
                          }
                          size="sm"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {dateFilter === "custom" && dateRange.from ? (
                            dateRange.to ? (
                              <>
                                {format(dateRange.from, "dd/MM/yyyy")} -{" "}
                                {format(dateRange.to, "dd/MM/yyyy")}
                              </>
                            ) : (
                              format(dateRange.from, "dd/MM/yyyy")
                            )
                          ) : (
                            "Rango de fechas"
                          )}
                          {dateFilter === "custom" && (
                            <X
                              className="ml-2 h-4 w-4"
                              onClick={(e) => {
                                e.stopPropagation();
                                clearDateFilter();
                              }}
                            />
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          initialFocus
                          mode="range"
                          defaultMonth={dateRange.from}
                          selected={dateRange}
                          onSelect={(range) => {
                            setDateRange(
                              (range as DateRangeType) || {
                                from: undefined,
                                to: undefined,
                              }
                            );
                            setDateFilter(range?.from ? "custom" : "all");
                          }}
                          locale={es}
                          numberOfMonths={2}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  {canEdit() && (
                    <Button onClick={handleAddCompra}>
                      <Plus className="mr-2 h-4 w-4" />
                      Nueva Compra
                    </Button>
                  )}
                </div>
              }
              className="transition-all hover:scale-[1.01]"
            />
          </motion.div>
        )}
      </motion.div>

      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        {selectedCompraDetails && (
          <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto p-0">
            <div className="p-6">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold text-foreground mb-6">
                  Detalles de la Compra
                </DialogTitle>
              </DialogHeader>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Left Column - Purchase and Supplier Info */}
                <div className="space-y-6">
                  {/* Purchase Info Card */}
                  <div className="bg-card rounded-lg border p-5 shadow-sm">
                    <h3 className="text-lg font-semibold mb-4 pb-2 border-b text-foreground">
                      Información de la Compra
                    </h3>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span className="font-medium text-muted-foreground">Código:</span>
                        <span className="font-medium">{selectedCompraDetails.compra.codigo}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium text-muted-foreground">Fecha:</span>
                        <span>{new Date(selectedCompraDetails.compra.createdAt).toLocaleDateString('es-GT', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium text-muted-foreground">Hora:</span>
                        <span>{new Date(selectedCompraDetails.compra.createdAt).toLocaleTimeString('es-GT', { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <div className="flex justify-between pt-2 border-t mt-3">
                        <span className="font-semibold text-muted-foreground">Total:</span>
                        <span className="font-bold text-lg text-primary">
                          {formatCurrency(selectedCompraDetails.compra.total)}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Supplier Info Card */}
                  <div className="bg-card rounded-lg border p-5 shadow-sm">
                    <h3 className="text-lg font-semibold mb-4 pb-2 border-b text-foreground">
                      Información del Proveedor
                    </h3>
                    {selectedCompraDetails.proveedor ? (
                      <div className="space-y-3 text-sm">
                        <div className="flex justify-between">
                          <span className="font-medium text-muted-foreground">Nombre:</span>
                          <span className="text-right">{selectedCompraDetails.proveedor.nombre}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium text-muted-foreground">Documento:</span>
                          <span>{selectedCompraDetails.proveedor.numeroDocumento || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium text-muted-foreground">Teléfono:</span>
                          <span>{selectedCompraDetails.proveedor.telefono || 'N/A'}</span>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">Información del proveedor no disponible</p>
                    )}
                  </div>
                </div>

                {/* Right Column - Products Table */}
                <div className="space-y-6">
                  <div className="bg-card rounded-lg border shadow-sm overflow-hidden">
                    <div className="p-5 border-b">
                      <h3 className="text-lg font-semibold text-foreground">
                        Productos Comprados
                      </h3>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-border">
                        <thead className="bg-muted/30">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                              Producto
                            </th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                              Cant.
                            </th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                              P. Unitario
                            </th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                              Subtotal
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {selectedCompraDetails.detalles.map((detalle) => (
                            <tr key={detalle.id} className="hover:bg-muted/10 transition-colors">
                              <td className="px-4 py-3 text-sm">
                                <div className="font-medium">
                                  {detalle.producto?.nombre || `Producto ${detalle.productoId}`}
                                  {detalle.producto?.codigo && (
                                    <span className="text-xs text-muted-foreground block">
                                      Código: {detalle.producto.codigo}
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="px-4 py-3 text-right text-sm">
                                {detalle.cantidad}
                              </td>
                              <td className="px-4 py-3 text-right text-sm">
                                {formatCurrency(Number(detalle.precioCompra))}
                              </td>
                              <td className="px-4 py-3 text-right text-sm font-medium">
                                {formatCurrency(Number(detalle.total))}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot className="bg-muted/30">
                          <tr>
                            <td colSpan={3} className="px-4 py-3 text-right text-sm font-medium">
                              Total General
                            </td>
                            <td className="px-4 py-3 text-right text-base font-bold text-primary">
                              {formatCurrency(selectedCompraDetails.compra.total)}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3 pt-6 mt-6 border-t">
                <Button
                  variant="outline"
                  onClick={() => printTicket(selectedCompraDetails.compra)}
                  className="flex items-center gap-2 px-5"
                >
                  <Printer className="h-4 w-4" />
                  Imprimir Ticket
                </Button>
                <Button
                  onClick={() => setShowDetails(false)}
                  variant="default"
                  className="px-5"
                >
                  Cerrar
                </Button>
              </div>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </Layout>
  );
};

export default Compras;
