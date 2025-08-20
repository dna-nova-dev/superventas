import { Layout } from "@/components/layout/Layout";
import { motion } from "framer-motion";
import { Truck } from "lucide-react";
import { formatCurrency } from "@/data/mockData";
import { DataTable } from "@/components/ui/DataTable";
import { useToast } from "@/hooks/use-toast";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  ShoppingBag,
  Receipt,
  Printer,
  Trash,
  Plus,
  Search,
} from "lucide-react";
import { CalendarIcon, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRolePermissions } from "@/hooks/useRolePermissions";
import { useState, useEffect, useCallback } from "react";
import type { Proveedor } from "@/types";
import type { Compra, CompraDetalle } from "@/types";
import type { Usuario } from "@/types";
import { usuarioService } from "@/services/usuarioService";
import { useAuth } from "@/contexts/AuthContext";
import {
  getCompras,
  deleteCompra as deleteCompraService,
} from "@/services/compraService";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { jsPDF } from "jspdf";
import { getAllProveedores } from "@/services/proveedorService";
import { getCompraDetalleByCodigo } from "@/services/compraDetalleService";

type DateRangeType = {
  from: Date | undefined;
  to: Date | undefined;
};

const Compras = () => {
  const { toast } = useToast();
  const { empresaId } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [selectedCompraDetails, setSelectedCompraDetails] = useState<any>(null);
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
  const [dateFilter, setDateFilter] = useState<"all" | "today" | "custom">(
    "all"
  );
  const { getViewMode, canEdit, canDelete } = useRolePermissions();
  const viewMode = getViewMode();

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

  const tableVariants = {
    hidden: {
      opacity: 0,
      y: 20,
    },
    show: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.3,
        ease: "easeOut",
      },
    },
  };

  useEffect(() => {
    const init = async () => {
      await Promise.all([loadCompras(), loadUsuarios(), loadProveedores()]);
    };
    init();
  }, []);

  const loadUsuarios = async () => {
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
  };

  const loadProveedores = async () => {
    try {
      const data = await getAllProveedores();
      setProveedores(data);
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudieron cargar los clientes",
        variant: "destructive",
      });
    }
  };

  const getProveedorById = (id: number) => {
    return proveedores.find((c) => c.id === id);
  };

  const getUsuarioById = (id: number) => {
    return usuarios.find((u) => u.usuario_id === id);
  };

  const loadCompras = async () => {
    try {
      setLoading(true);
      const allCompras = await getCompras();
      const filteredCompras = allCompras.filter(
        (v) => v.empresaId === empresaId
      );
      setCompras(filteredCompras);
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudieron cargar las ventas",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
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
    if (!dateRange.from) return true;

    const date = new Date(dateString);

    if (dateRange.from && !dateRange.to) {
      return date >= dateRange.from;
    }

    if (dateRange.from && dateRange.to) {
      return date >= dateRange.from && date <= dateRange.to;
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
      accessor: (compra: Compra) => (
        <div>
          <div className="font-medium">
            {new Date(compra.fecha).toLocaleDateString("es-GT")}
          </div>
          <div className="text-xs text-muted-foreground">{compra.hora}</div>
        </div>
      ),
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
      accessor: (compra: Compra) => formatCurrency(compra.total),
      className: "font-medium",
    },
  ];

  const filteredCompras = compras.filter((compra) => {
    // Apply search filter
    if (
      searchQuery &&
      !compra.codigo.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !compra.fecha.includes(searchQuery)
    ) {
      return false;
    }

    // Apply date filters
    if (dateFilter === "today" && !isToday(compra.fecha)) {
      return false;
    }

    if (dateFilter === "custom" && !isInDateRange(compra.fecha)) {
      return false;
    }

    return true;
  });

  const handleView = async (compra: Compra) => {
    try {
      const detallesFiltrados = detalles.filter(
        (d) => d.compraCodigo === compra.codigo
      );
      setSelectedCompraDetails({
        compra,
        detalles: detallesFiltrados,
        proveedor: getProveedorById(compra.proveedorId),
        usuario: getUsuarioById(compra.usuarioId),
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

  const clearDateFilter = () => {
    setDateFilter("all");
    setDateRange({ from: undefined, to: undefined });
  };

  const handleRowClick = async (compra: Compra) => {
    try {
      const detallesFiltrados = detalles.filter(
        (d) => d.compraCodigo === compra.codigo
      );
      setSelectedCompraDetails({
        compra,
        detalles: detallesFiltrados,
        cliente: getProveedorById(compra.proveedorId),
        usuario: getUsuarioById(compra.usuarioId),
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

  const generateTicket = async (compra: Compra) => {
    try {
      const ldetails = await getCompraDetalleByCodigo(compra.codigo);
      const proveedor = getProveedorById(compra.proveedorId);
      const usuario = getUsuarioById(compra.usuarioId);

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

      addInfoLine("Código:", compra.codigo);
      addInfoLine("Fecha:", new Date(compra.fecha).toLocaleDateString("es-GT"));
      addInfoLine("Hora:", compra.hora);
      addInfoLine(
        "Proveedor:",
        proveedor ? `${proveedor.nombre}` : "No encontrado"
      );
      addInfoLine(
        "Comprador:",
        usuario
          ? `${usuario.usuario_nombre} ${usuario.usuario_apellido}`
          : "No encontrado"
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
        const precioCompra = Number.parseFloat(detalle.precioCompra);
        const subtotal = cantidad * precioCompra;

        // Product name

        // Quantity and unit price
        y += 3;
        doc.setFont("helvetica", "normal");
        doc.setFontSize(7);
        doc.text(
          `${cantidad} x ${formatCurrency(precioCompra)}`,
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

      addTotalLine("Total:", formatCurrency(compra.total), true);

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

  const printTicket = async (compra: Compra) => {
    try {
      const doc = await generateTicket(compra);
      window.open(doc.output("bloburl"), "_blank");

      toast({
        title: "Ticket generado",
        description: `Ticket de venta ${compra.codigo} listo para imprimir`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Error al generar el ticket",
        variant: "destructive",
      });
    }
  };

  const handlePrint = async (compra: Compra) => {
    await printTicket(compra);
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
                </div>
              }
              className="transition-all hover:scale-[1.01]"
            />
          </motion.div>
        )}
      </motion.div>
    </Layout>
  );
};

export default Compras;
