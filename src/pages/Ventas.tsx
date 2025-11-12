"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Layout } from "@/components/layout/Layout";
import { DataTable } from "@/components/ui/DataTable";
import { formatCurrency } from "@/data/mockData";
import { useToast } from "@/hooks/use-toast";
import {
  ShoppingBag,
  Receipt,
  Printer,
  Trash,
  Plus,
  Search,
} from "lucide-react";
import type { Venta, VentaDetalle } from "@/types";
import { useRolePermissions } from "@/hooks/useRolePermissions";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Variants, motion } from "framer-motion";
import {
  getVentas,
  deleteVenta as deleteVentaService,
} from "@/services/ventaService";
import {
  getVentaDetalles,
  getVentaDetalleByCodigo,
  getDetallesByVentaId,
  deleteVentaDetalle,
} from "@/services/ventaDetalleService";
import { getAllClientes } from "@/services/clienteService";
import type { Cliente } from "@/types";
import { usuarioService } from "@/services/usuarioService";
import type { Usuario } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerClose,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { useMediaQuery } from "@/hooks/use-media-query";
import { jsPDF } from "jspdf";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarIcon, X } from "lucide-react";

type DateRangeType = {
  from: Date | undefined;
  to: Date | undefined;
};

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

const Ventas = () => {
  const { toast } = useToast();
  const { empresaId } = useAuth();
  const { getViewMode, canEdit, canDelete } = useRolePermissions();
  const viewMode = getViewMode();
  const [searchQuery, setSearchQuery] = useState("");
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [detalles, setDetalles] = useState<VentaDetalle[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteVenta, setDeleteVenta] = useState<Venta | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  interface VentaDetails {
    venta: Venta;
    detalles: VentaDetalle[];
    cliente?: Cliente;
    usuario?: Usuario;
  }

  const [selectedVentaDetails, setSelectedVentaDetails] = useState<VentaDetails | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const isMobile = useMediaQuery("(max-width: 767px)");
  const navigate = useNavigate();
  const [dateFilter, setDateFilter] = useState<"all" | "today" | "custom">(
    "all"
  );
  const [dateRange, setDateRange] = useState<DateRangeType>({
    from: undefined,
    to: undefined,
  });

  const loadVentas = useCallback(async (forceReload = false) => {
    try {
      setLoading(true);
      console.log('Cargando ventas...');
      
      // Cargar solo las ventas completadas
      const allVentas = await getVentas('completada');
      console.log('Ventas completadas cargadas:', allVentas);
      
      if (!empresaId) {
        console.error('No se ha establecido empresaId');
        toast({
          title: "Error",
          description: "No se ha podido identificar la empresa",
          variant: "destructive",
        });
        return [];
      }
      
      const filteredVentas = allVentas.filter((v) => v.empresaId === empresaId);
      console.log('Ventas filtradas:', filteredVentas);
      
      // Ordenar por fecha y hora sin convertir a objetos Date para evitar problemas de zona horaria
      const sortedVentas = [...filteredVentas].sort((a, b) => {
        // Comparar fechas en formato 'YYYY-MM-DD' y horas en formato 'HH:MM:SS'
        const dateCompare = b.fecha.localeCompare(a.fecha);
        if (dateCompare !== 0) return dateCompare;
        // Si las fechas son iguales, comparar por hora
        return b.hora.localeCompare(a.hora);
      });
      
      setVentas(sortedVentas);
      
      if (sortedVentas.length === 0) {
        console.log('No se encontraron ventas para esta empresa');
        toast({
          title: "Información",
          description: "No se encontraron ventas registradas",
        });
      }
      
      return sortedVentas;
    } catch (error) {
      console.error('Error al cargar ventas:', error);
      toast({
        title: "Error",
        description: `No se pudieron cargar las ventas: ${error instanceof Error ? error.message : 'Error desconocido'}`,
        variant: "destructive",
      });
      return [];
    } finally {
      setLoading(false);
    }
  }, [empresaId, toast]);

  const loadDetalles = useCallback(async () => {
    try {
      const allDetalles = await getVentaDetalles();
      const filteredDetalles = allDetalles.filter(
        (d) => d.empresaId === empresaId
      );
      setDetalles(filteredDetalles);
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudieron cargar los detalles de venta",
        variant: "destructive",
      });
    }
  }, [empresaId, toast]);

  const loadClientes = useCallback(async () => {
    try {
      const data = await getAllClientes();
      setClientes(data);
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudieron cargar los clientes",
        variant: "destructive",
      });
    }
  }, [toast]);

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

  const getClienteById = (id: number) => {
    return clientes.find((c) => c.id === id);
  };

  const getUsuarioById = (id: number) => {
    return usuarios.find((u) => u.usuario_id === id);
  };

  // Cargar datos iniciales
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const refresh = params.get('refresh') === 'true';
    
    if (empresaId) {
      const loadData = async () => {
        try {
          await loadVentas(refresh);
          await Promise.all([
            loadClientes(),
            loadUsuarios(),
            loadDetalles()
          ]);
          
          // Limpiar el parámetro de la URL si existe
          if (refresh) {
            const newUrl = window.location.pathname;
            window.history.replaceState({}, '', newUrl);
          }
        } catch (error) {
          console.error('Error al cargar datos:', error);
          toast({
            title: "Error",
            description: "No se pudieron cargar los datos. Por favor, intente nuevamente.",
            variant: "destructive",
          });
        }
      };
      
      loadData();
    }
  }, [empresaId, loadVentas, loadClientes, loadUsuarios, loadDetalles, toast]);

  const isToday = (dateString: string) => {
    const today = new Date();
    const todayFormatted = today.toISOString().split('T')[0]; // Formato YYYY-MM-DD
    return dateString === todayFormatted;
  };

  const isInDateRange = (dateString: string) => {
    if (!dateRange.from) return true;

    // Convertir la fecha de la venta a objeto Date para comparación
    const [year, month, day] = dateString.split('-').map(Number);
    const ventaDate = new Date(year, month - 1, day);
    
    // Ajustar la fecha de inicio (from) a inicio del día
    const fromDate = new Date(dateRange.from);
    fromDate.setHours(0, 0, 0, 0);
    
    if (dateRange.from && !dateRange.to) {
      return ventaDate >= fromDate;
    }
    
    // Si hay fecha de fin (to), ajustarla a fin del día
    if (dateRange.to) {
      const toDate = new Date(dateRange.to);
      toDate.setHours(23, 59, 59, 999);
      return ventaDate >= fromDate && ventaDate <= toDate;
    }

    return true;
  };

  const clearDateFilter = () => {
    setDateFilter("all");
    setDateRange({ from: undefined, to: undefined });
  };

  const handleRowClick = async (venta: Venta) => {
    try {
      const detallesFiltrados = detalles.filter(
        (d) => d.ventaCodigo === venta.codigo
      );
      setSelectedVentaDetails({
        venta,
        detalles: detallesFiltrados,
        cliente: getClienteById(venta.clienteId),
        usuario: getUsuarioById(venta.usuarioId),
      });
      setShowDetails(true);
    } catch (error) {
      toast({
        title: "Error",
        description: "Error al cargar detalles de venta",
        variant: "destructive",
      });
    }
  };

  const handleView = async (venta: Venta) => {
    try {
      const detallesFiltrados = detalles.filter(
        (d) => d.ventaCodigo === venta.codigo
      );
      setSelectedVentaDetails({
        venta,
        detalles: detallesFiltrados,
        cliente: getClienteById(venta.clienteId),
        usuario: getUsuarioById(venta.usuarioId),
      });
      setShowDetails(true);
    } catch (error) {
      toast({
        title: "Error",
        description: "Error al cargar detalles de venta",
        variant: "destructive",
      });
    }
  };

  const generateTicket = async (venta: Venta) => {
    try {
      const ldetails = await getVentaDetalleByCodigo(venta.codigo);
      const cliente = getClienteById(venta.clienteId);
      const usuario = getUsuarioById(venta.usuarioId);

      const lineHeight = 4;
      const headerHeight = 60;
      const productLineHeight = 5;
      const productsHeight = ldetails.length * productLineHeight;
      const footerHeight = 30;
      const totalHeight = headerHeight + productsHeight + footerHeight;

      const doc = new jsPDF({
        unit: "mm",
        format: [80, totalHeight],
        compress: true,
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const centerX = pageWidth / 2;
      const marginX = 10;
      const contentWidth = pageWidth - marginX * 2;

      // Header
      let y = 10;
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("SUPERVENTAS", centerX, y, { align: "center" });

      y += 5;
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text("Ticket de Venta", centerX, y, { align: "center" });

      // Info Section with dashed borders
      y += 8;
      doc.setLineWidth(0.1);
      doc.line(marginX, y, pageWidth - marginX, y);
      y += 4;
      doc.setFontSize(8);
      const addInfoLine = (label: string, value: string) => {
        doc.text(label, marginX, y);
        doc.text(value, pageWidth - marginX, y, { align: "right" });
        y += lineHeight;
      };

      addInfoLine("Código:", venta.codigo);
      addInfoLine("Fecha:", new Date(venta.fecha).toLocaleDateString("es-GT"));
      addInfoLine("Hora:", venta.hora);
      addInfoLine(
        "Cliente:",
        cliente ? `${cliente.nombre} ${cliente.apellido}` : "No encontrado"
      );
      addInfoLine(
        "Vendedor:",
        usuario ? usuario.usuario_nombre : "No encontrado"
      );

      // Products section
      y += 2;
      doc.line(marginX, y, pageWidth - marginX, y);
      y += 4;
      doc.setFont("helvetica", "bold");
      doc.text("PRODUCTOS", centerX, y, { align: "center" });
      y += 4;
      doc.line(marginX, y, pageWidth - marginX, y);
      y += 4;

      // Products detail
      doc.setFont("helvetica", "normal");
      ldetails.forEach((detalle) => {
        const cantidad = detalle.cantidad;
        const precioVenta = Number.parseFloat(detalle.precioVenta);
        const subtotal = cantidad * precioVenta;

        // Product name
        const productoName =
          detalle.descripcion.length > 25
            ? detalle.descripcion.substring(0, 25) + "..."
            : detalle.descripcion;
        doc.setFont("helvetica", "bold");
        doc.text(productoName, marginX, y);
        doc.text(formatCurrency(subtotal), pageWidth - marginX, y, {
          align: "right",
        });

        // Quantity and unit price
        y += 3;
        doc.setFont("helvetica", "normal");
        doc.setFontSize(7);
        doc.text(
          `${cantidad} x ${formatCurrency(precioVenta)}`,
          marginX + 2,
          y
        );
        y += 4;
      });

      // Totals section
      y += 2;
      doc.line(marginX, y, pageWidth - marginX, y);
      y += 4;
      doc.setFontSize(8);

      const addTotalLine = (label: string, value: string, isBold = false) => {
        if (isBold) doc.setFont("helvetica", "bold");
        else doc.setFont("helvetica", "normal");
        doc.text(label, pageWidth - 40, y);
        doc.text(value, pageWidth - marginX, y, { align: "right" });
        y += lineHeight;
      };

      addTotalLine("Total:", formatCurrency(venta.total), true);
      addTotalLine("Pagado:", formatCurrency(venta.pagado));
      addTotalLine("Cambio:", formatCurrency(venta.cambio));

      // Footer
      y += 4;
      doc.setFontSize(7);
      doc.setFont("helvetica", "normal");
      doc.text("¡Gracias por su compra!", centerX, y, { align: "center" });

      return doc;
    } catch (error) {
      console.error("Error generating ticket:", error);
      throw error;
    }
  };

  const printTicket = async (venta: Venta) => {
    try {
      const doc = await generateTicket(venta);
      window.open(doc.output("bloburl"), "_blank");

      toast({
        title: "Ticket generado",
        description: `Ticket de venta ${venta.codigo} listo para imprimir`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Error al generar el ticket",
        variant: "destructive",
      });
    }
  };

  const handlePrint = async (venta: Venta) => {
    await printTicket(venta);
  };

  const handleAddVenta = () => {
    navigate("/vender");
  };

  const handleDeleteClick = useCallback((venta: Venta) => {
    setDeleteVenta(venta);
    setShowDeleteConfirm(true);
  }, []);

  const handleConfirmDelete = async () => {
    if (!deleteVenta) return;

    try {
      // Obtener detalles de la venta
      const detalles = await getDetallesByVentaId(deleteVenta.id);

      // Eliminar cada detalle
      for (const detalle of detalles) {
        await deleteVentaDetalle(detalle.id);
      }

      // Eliminar la venta
      await deleteVentaService(deleteVenta.id);

      toast({
        title: "Venta eliminada",
        description: `La venta ${deleteVenta.codigo} ha sido eliminada`,
      });
      loadVentas();
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo eliminar la venta",
        variant: "destructive",
      });
    } finally {
      setShowDeleteConfirm(false);
      setDeleteVenta(null);
    }
  };

  const DeleteConfirmation = () => {
    if (!deleteVenta) return null;

    const content = (
      <div className="space-y-4">
        <p>¿Está seguro de eliminar la siguiente venta?</p>
        <div className="border rounded-lg p-4 space-y-2">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Código:</span>
            <span className="font-medium">{deleteVenta.codigo}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Fecha:</span>
            <span>
              {new Date(deleteVenta.fecha).toLocaleDateString("es-GT")}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Total:</span>
            <span className="font-bold">
              {formatCurrency(deleteVenta.total)}
            </span>
          </div>
        </div>
      </div>
    );

    if (isDesktop) {
      return (
        <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirmar eliminación</DialogTitle>
              <DialogDescription>
                Esta acción no se puede deshacer.
              </DialogDescription>
            </DialogHeader>
            {content}
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDeleteVenta(null);
                }}
              >
                Cancelar
              </Button>
              <Button variant="destructive" onClick={handleConfirmDelete}>
                Eliminar
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      );
    }

    return (
      <Drawer open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Confirmar eliminación</DrawerTitle>
            <DrawerDescription>
              Esta acción no se puede deshacer.
            </DrawerDescription>
          </DrawerHeader>
          <div className="p-4">{content}</div>
          <DrawerFooter>
            <Button variant="destructive" onClick={handleConfirmDelete}>
              Eliminar venta
            </Button>
            <DrawerClose asChild>
              <Button variant="outline">Cancelar</Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    );
  };

  const SaleDetailsContent = () => {
    if (!selectedVentaDetails) return null;
    const { venta, detalles, cliente, usuario } = selectedVentaDetails;

    return (
      <div
        className="bg-white text-black p-4 rounded-lg shadow-md min-h-[300px] text-sm"
        style={{ fontFamily: "monospace" }}
      >
        <div className="text-center mb-6 space-y-2">
          <h2 className="text-xl font-bold">SUPERVENTAS</h2>
          <p>Ticket de Venta</p>
        </div>

        <div className="border-t border-b border-dashed py-3 space-y-1">
          <div className="flex justify-between">
            <span>Código:</span>
            <span className="font-bold">{venta.codigo}</span>
          </div>
          <div className="flex justify-between">
            <span>Fecha:</span>
            <span>{new Date(venta.fecha).toLocaleDateString("es-GT")}</span>
          </div>
          <div className="flex justify-between">
            <span>Hora:</span>
            <span>{venta.hora}</span>
          </div>
          <div className="flex justify-between">
            <span>Cliente:</span>
            <span>
              {cliente
                ? `${cliente.nombre} ${cliente.apellido}`
                : "No encontrado"}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Vendedor:</span>
            <span>{usuario ? usuario.usuario_nombre : "No encontrado"}</span>
          </div>
        </div>

        <div className="py-3">
          <div className="text-center font-bold border-b border-dashed pb-2">
            PRODUCTOS
          </div>
          <div className="mt-2 space-y-2">
            {detalles.map((detalle: VentaDetalle, index: number) => (
              <div key={index} className="text-xs">
                <div className="flex justify-between font-bold">
                  <span>{detalle.descripcion}</span>
                  <span>
                    {formatCurrency(Number(detalle.cantidad) * Number(detalle.precioVenta))}
                  </span>
                </div>
                <div className="text-gray-600 flex justify-between pl-2">
                  <span>
                    {detalle.cantidad} x {formatCurrency(detalle.precioVenta)}
                  </span>
                  <span></span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-dashed pt-3 space-y-1">
          <div className="flex justify-between text-sm font-bold">
            <span>Total:</span>
            <span>{formatCurrency(venta.total)}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span>Pagado:</span>
            <span>{formatCurrency(venta.pagado)}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span>Cambio:</span>
            <span>{formatCurrency(venta.cambio)}</span>
          </div>
        </div>

        <div className="text-center text-xs mt-6">¡Gracias por su compra!</div>
      </div>
    );
  };

  const SaleDetailsDialog = () => {
    if (isDesktop) {
      return (
        <Dialog open={showDetails} onOpenChange={setShowDetails}>
          <DialogContent className="bg-background border">
            <DialogHeader className="text-center">
              <DialogTitle>Vista previa del ticket</DialogTitle>
              <DialogDescription>
                Visualización del formato de impresión
              </DialogDescription>
            </DialogHeader>
            <div className="flex items-center justify-center p-6 bg-muted/40 rounded-md">
              <div className="w-full max-w-[300px] rotate-0 hover:rotate-0 transition-transform">
                <SaleDetailsContent />
              </div>
            </div>
          </DialogContent>
        </Dialog>
      );
    }

    return (
      <Drawer open={showDetails} onOpenChange={setShowDetails}>
        <DrawerContent className="fixed inset-x-0 bottom-0">
          <DrawerHeader className="text-center">
            <DrawerTitle>Vista previa del ticket</DrawerTitle>
            <DrawerDescription>
              Visualización del formato de impresión
            </DrawerDescription>
          </DrawerHeader>
          <div className="flex-1 bg-muted/40 p-4">
            <div className="mx-auto max-w-[300px]">
              <SaleDetailsContent />
            </div>
          </div>
          <DrawerFooter className="border-t bg-background">
            <DrawerClose asChild>
              <Button variant="outline">Cerrar</Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    );
  };

  const columns = [
    {
      header: "Código",
      accessor: (venta: Venta) => venta.codigo,
      className: "w-28",
    },
    {
      header: "Fecha",
      accessor: (venta: Venta) => (
        <div>
          <div className="font-medium">
            {new Date(venta.fecha).toLocaleDateString("es-GT")}
          </div>
          <div className="text-xs text-muted-foreground">{venta.hora}</div>
        </div>
      ),
    },
    {
      header: "Cliente",
      accessor: (venta: Venta) => {
        const cliente = getClienteById(venta.clienteId);
        return cliente
          ? `${cliente.nombre} ${cliente.apellido}`
          : "Cliente no encontrado";
      },
    },
    {
      header: "Vendedor",
      accessor: (venta: Venta) => {
        const usuario = getUsuarioById(venta.usuarioId);
        return usuario
          ? `${usuario.usuario_nombre} ${usuario.usuario_apellido}`
          : "Usuario no encontrado";
      },
    },
    {
      header: "Total",
      accessor: (venta: Venta) => formatCurrency(venta.total),
      className: "font-medium",
    },
  ];

  const filteredVentas = ventas.filter((venta) => {
    // Apply search filter
    if (
      searchQuery &&
      !venta.codigo.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !venta.fecha.includes(searchQuery)
    ) {
      return false;
    }

    // Apply date filters
    if (dateFilter === "today" && !isToday(venta.fecha)) {
      return false;
    }

    if (dateFilter === "custom" && !isInDateRange(venta.fecha)) {
      return false;
    }

    return true;
  });

  console.log(ventas);

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
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
        <motion.div variants={itemVariants}>
          <h1 className="text-3xl font-bold tracking-tight flex items-center">
            <ShoppingBag className="mr-3 h-8 w-8 text-blue-500" />
            Ventas
          </h1>
          <p className="text-muted-foreground">
            Administre las ventas registradas en el sistema.
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
                  onClick={handleAddVenta}
                  className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring h-9 px-4 py-2 bg-primary text-primary-foreground shadow hover:bg-primary/90 w-full sm:w-auto"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Nueva Venta
                </button>
              )}
            </motion.div>

            {filteredVentas.length === 0 ? (
              <motion.div 
                className="flex flex-col items-center justify-center py-12 text-center"
                variants={itemVariants}
              >
                <ShoppingBag className="h-16 w-16 text-muted-foreground/30 mb-4" />
                <h3 className="text-lg font-medium text-muted-foreground">No hay ventas registradas</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {searchQuery || dateFilter !== 'all' 
                    ? 'No se encontraron ventas que coincidan con los filtros aplicados.' 
                    : 'Comience creando una nueva venta para verla aquí.'}
                </p>
                {canEdit() && (
                  <Button 
                    onClick={handleAddVenta} 
                    className="mt-4"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Crear primera venta
                  </Button>
                )}
              </motion.div>
            ) : (
              <motion.div
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
                variants={containerVariants}
              >
                {filteredVentas.map((venta) => {
                  const cliente = getClienteById(venta.clienteId);
                  const usuario = getUsuarioById(venta.usuarioId);
                  return (
                  <motion.div
                    variants={itemVariants}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    key={venta.id}
                    className="bg-transparent rounded-xl border shadow-sm overflow-hidden transition-all card-hover"
                    onClick={() => handleRowClick(venta)}
                  >
                    <div className="p-5">
                      <div className="flex items-center justify-between mb-3">
                        <div className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                          {venta.codigo}
                        </div>
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                          <ShoppingBag className="h-4 w-4 text-blue-500" />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">
                            Fecha:
                          </span>
                          <span className="text-sm font-medium">
                            {new Date(venta.fecha).toLocaleDateString("es-GT")}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">
                            Hora:
                          </span>
                          <span className="text-sm">{venta.hora}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">
                            Cliente:
                          </span>
                          <span className="text-sm">
                            {cliente
                              ? `${cliente.nombre} ${cliente.apellido}`
                              : "No encontrado"}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">
                            Vendedor:
                          </span>
                          <span className="text-sm">
                            {usuario
                              ? `${usuario.usuario_nombre}`
                              : "No encontrado"}
                          </span>
                        </div>
                      </div>

                      <div className="mt-4 pt-4 border-t">
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">Total:</span>
                          <span className="text-xl font-bold">
                            {formatCurrency(venta.total)}
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground mt-1 flex justify-between">
                          <span>Pagado: {formatCurrency(venta.pagado)}</span>
                          <span>Cambio: {formatCurrency(venta.cambio)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-muted/30 px-5 py-3 flex justify-end space-x-2">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              className="p-2 rounded-md hover:bg-blue-50 text-blue-500 border border-input"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleView(venta);
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
                                handlePrint(venta);
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
                                  handleDeleteClick(venta);
                                }}
                              >
                                <Trash className="h-4 w-4" />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Eliminar venta</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
            )}
          </motion.div>
        )}

        {viewMode === "list" && (
          <motion.div variants={tableVariants} initial="hidden" animate="show">
            <DataTable
              data={filteredVentas}
              columns={[
                ...columns,
                {
                  header: "Acciones",
                  accessor: (venta: Venta) => (
                    <div className="flex items-center justify-end gap-2">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              className="p-2 rounded-md hover:bg-blue-50 text-blue-500 border border-input"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleView(venta);
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
                                handlePrint(venta);
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
                                  handleDeleteClick(venta);
                                }}
                              >
                                <Trash className="h-4 w-4" />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Eliminar venta</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </div>
                  ),
                  className: "w-[150px]",
                },
              ]}
              title="Listado de Ventas"
              description="Todas las ventas registradas en el sistema"
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
                    <Button onClick={handleAddVenta}>
                      <Plus className="mr-2 h-4 w-4" />
                      Nueva Venta
                    </Button>
                  )}
                </div>
              }
              className="transition-all hover:scale-[1.01]"
            />
          </motion.div>
        )}
      </motion.div>
      {SaleDetailsDialog()}
      {DeleteConfirmation()}
    </Layout>
  );
};

export default Ventas;
