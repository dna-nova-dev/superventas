import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useNavigate, useLocation } from "react-router-dom"; // Import useLocation
import {
  Search,
  X,
  Plus,
  Minus,
  Truck,
  Filter,
  ChevronDown,
  Clock,
  ListOrdered,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { getAllProductos } from "@/services/productoService";
import { updateProducto } from "@/services/productoService";
import { getAllCategorias } from "@/services/categoriaService";
import { getAllProveedores } from "@/services/proveedorService";
import { createCompra } from "@/services/compraService";
import { createCompraDetalle } from "@/services/compraDetalleService";
import { useAuth } from "@/hooks/useAuth";
import { formatCurrency } from "@/data/mockData";
import type { Producto, Categoria, Proveedor, CompraDetalle, CreateCompraDetalle } from "@/types";
import type { Caja } from "@/types/caja.interface";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { DeleteDialog } from "@/components/dialogs/DeleteDialog";
import { ScrollArea } from "@/components/ui/scroll-area";

type ProductoSeleccionado = {
  producto: Producto;
  cantidad: number;
  precio: string; // This represents the purchase price (precioCompra)
};
interface CompraFormProps {
  compraId?: string;
}

type CompraEstado = "pendiente" | "comprado";

type CompraPendiente = {
  id: string;
  productos: ProductoSeleccionado[];
  proveedor_id: number | null;
  proveedor_name: string;
  total: number;
  estado: CompraEstado;
  fecha: string;
};

export const CompraForm = () => {
  const { toast } = useToast();
  const { currentUser, empresaId } = useAuth();
  const navigate = useNavigate();
  const location = useLocation(); // Get location object

  // Helper function to get the purchase price, falling back to 0 if not set
  const getPrecioCompra = (producto: Producto): string => {
    return producto.precioCompra || '0.00';
  };

  const [productos, setProductos] = useState<Producto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]); // Initialize with empty array
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [cajas, setCajas] = useState<Caja[]>([]);
  const [selectedCajaId, setSelectedCajaId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategorias, setSelectedCategorias] = useState<number[]>([]);
  const [selectedProveedor, setSelectedProveedor] = useState<number | null>(
    null
  );
  const [selectedName, setSelectedName] = useState<string>("");
  const [productosSeleccionados, setProductosSeleccionados] = useState<
    ProductoSeleccionado[]
  >([]);
  const [pago, setPago] = useState(0);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false); // State for category filter popover
  const [compraEstado, setCompraEstado] = useState<CompraEstado>("pendiente");
  const [comprasPendientes, setComprasPendientes] = useState<CompraPendiente[]>(
    []
  );
  const [saleToDelete, setSaleToDelete] = useState<string | null>(null); // State for delete dialog
  const [editingPendingSaleId, setEditingPendingSaleId] = useState<
    string | null
  >(null); // State for tracking edited sale

  // Cargar datos iniciales (productos, categorias, clientes)
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [productosData, categoriasData, proveedoresData] =
          await Promise.all([
            getAllProductos(empresaId),
            getAllCategorias(empresaId),
            getAllProveedores(empresaId),
          ]);
        setProductos(productosData);
        setCategorias(categoriasData);
        setProveedores(proveedoresData);
      } catch (error) {
        toast({
          title: "Error",
          description: "No se pudieron cargar los datos iniciales",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [toast, empresaId]); // Added toast and empresaId to dependency array

  // Cargar cajas disponibles
  useEffect(() => {
    const fetchCajas = async () => {
      try {
        const cajasData = await import("@/services/cajaService").then((mod) =>
          mod.getAllCajas(empresaId)
        );
        setCajas(cajasData);
        
        // Establecer la caja por defecto del usuario si está disponible
        if (currentUser?.cajaId) {
          // Verificar si la caja del usuario existe en la lista de cajas
          const cajaUsuario = cajasData.find(caja => caja.id === currentUser.cajaId);
          if (cajaUsuario) {
            setSelectedCajaId(currentUser.cajaId);
          } else if (cajasData.length > 0) {
            // Si la caja del usuario no existe, seleccionar la primera caja disponible
            setSelectedCajaId(cajasData[0].id);
          }
        } else if (cajasData.length > 0) {
          // Si no hay caja por defecto, seleccionar la primera caja disponible
          setSelectedCajaId(cajasData[0].id);
        }
      } catch (error) {
        console.error("Error al cargar las cajas:", error);
        toast({
          title: "Error",
          description: "No se pudieron cargar las cajas",
          variant: "destructive",
        });
      }
    };
    fetchCajas();
  }, [empresaId, toast]);

  // Cargar ventas pendientes desde localStorage y escuchar cambios
  useEffect(() => {
    const loadPendingSales = () => {
      const pendientes = JSON.parse(
        localStorage.getItem("comprasPendientes") || "[]"
      ) as CompraPendiente[];
      setComprasPendientes(pendientes);
    };

    loadPendingSales();
    window.addEventListener("storage", loadPendingSales); // Listen for changes in other tabs/windows
    return () => window.removeEventListener("storage", loadPendingSales);
  }, []);

  // Cargar venta pendiente desde URL al iniciar o cuando cambia la URL
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const compraId = params.get("pendiente");

    if (compraId) {
      const comprasGuardadas = JSON.parse(
        localStorage.getItem("comprasPendientes") || "[]"
      ) as CompraPendiente[];
      const compraPendiente = comprasGuardadas.find((v) => v.id === compraId);
      if (compraPendiente) {
        setProductosSeleccionados(compraPendiente.productos);
        setSelectedProveedor(compraPendiente.proveedor_id);
        setSelectedName(compraPendiente.proveedor_name);
        setCompraEstado(compraPendiente.estado);
        setEditingPendingSaleId(compraId); // Track the loaded sale ID
        setPago(compraPendiente.total); // Pre-fill payment
      } else {
        // If ID in URL doesn't match any pending sale, clear editing state
        setEditingPendingSaleId(null);
        navigate("/comprar", { replace: true }); // Optional: redirect to clean URL
      }
    } else {
      // Clear editing state if no ID in URL
      setEditingPendingSaleId(null);
      // Optionally reset form fields when switching from edit to new
      // setProductosSeleccionados([]);
      // setSelectedCliente(null);
      // setPago(0);
    }
    // Rerun effect if the search params change
  }, [location.search, navigate]); // Added dependencies

  // Filtrar productos por búsqueda y categoría
  const filteredProductos = productos.filter((producto) => {
    const matchesSearch =
      producto.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (producto.codigo &&
        producto.codigo.toLowerCase().includes(searchTerm.toLowerCase())); // Added check for codigo existence
    const matchesCategory =
      selectedCategorias.length === 0 ||
      selectedCategorias.includes(producto.categoriaId || 0); // Use categoriaId and handle potential null
    return matchesSearch && matchesCategory;
  });

  // Agregar producto a la venta
  const agregarProducto = (producto: Producto) => {
    const stockDisponible = producto.stockTotal || 0;
    if (stockDisponible <= 0) {
      toast({
        title: "Sin stock",
        description: `No hay stock disponible para ${producto.nombre}`,
        variant: "destructive",
      });
      return;
    }

    setProductosSeleccionados((prev) => {
      const existing = prev.find((p) => p.producto.id === producto.id);
      if (existing) {
        const nuevaCantidad = existing.cantidad + 1;
        if (nuevaCantidad > stockDisponible) {
          toast({
            title: "Stock insuficiente",
            description: `No hay suficiente stock de ${producto.nombre}`,
            variant: "destructive",
          });
          return prev;
        }
        return prev.map((p) =>
          p.producto.id === producto.id ? { ...p, cantidad: nuevaCantidad } : p
        );
      }
      return [
        ...prev,
        {
          producto,
          cantidad: 1,
          precio: getPrecioCompra(producto),
        },
      ];
    });
  };

  // Actualizar cantidad de producto
  const actualizarCantidad = (productoId: number, cantidad: number) => {
    if (cantidad < 1) return;

    const producto = productos.find((p) => p.id === productoId);
    if (!producto) return;

    if (cantidad > (producto.stockTotal || 0)) {
      toast({
        title: "Stock insuficiente",
        description: `No hay suficiente stock de ${producto.nombre}`,
        variant: "destructive",
      });
      return;
    }

    setProductosSeleccionados((prev) =>
      prev.map((p) => (p.producto.id === productoId ? { ...p, cantidad } : p))
    );
  };

  // Eliminar producto de la venta
  const eliminarProducto = (productoId: number) => {
    setProductosSeleccionados((prev) =>
      prev.filter((p) => p.producto.id !== productoId)
    );
  };

  // Calcular total de la venta
  const total = productosSeleccionados.reduce(
    (sum, p) => sum + p.cantidad * parseFloat(p.precio),
    0
  );

  // Calcular cambio
  const cambio = pago - total;

  // Guardar o actualizar compra pendiente en localStorage
  const guardarCompraPendiente = () => {
    if (productosSeleccionados.length === 0) {
      toast({
        title: "Error",
        description: "Agrega productos antes de guardar.",
        variant: "destructive",
      });
      return;
    }
    const comprasGuardadas = JSON.parse(
      localStorage.getItem("comprasPendientes") || "[]"
    ) as CompraPendiente[];
    let comprasActualizadas: CompraPendiente[];
    let mensajeToast = "";

    if (editingPendingSaleId) {
      // Update existing pending sale
      comprasActualizadas = comprasGuardadas.map((compra) =>
        compra.id === editingPendingSaleId
          ? {
              ...compra,
              productos: productosSeleccionados,
              proveedor_id: selectedProveedor,
              total: total,
              fecha: new Date().toISOString(), // Update timestamp
            }
          : compra
      );
      mensajeToast = "Compra pendiente actualizada";
    } else {
      // Create new pending sale
      const nuevaCompraId = Date.now().toString();
      const nuevaCompraPendiente: CompraPendiente = {
        id: nuevaCompraId,
        productos: productosSeleccionados,
        proveedor_id: selectedProveedor,
        proveedor_name: selectedName,
        total: total,
        estado: "pendiente",
        fecha: new Date().toISOString(),
      };
      comprasActualizadas = [...comprasGuardadas, nuevaCompraPendiente];
      mensajeToast = "Compra guardada como pendiente";
      setEditingPendingSaleId(nuevaCompraId); // Start tracking the new sale ID
      navigate(`/comprar?pendiente=${nuevaCompraId}`, { replace: true }); // Update URL
    }

    localStorage.setItem(
      "comprasPendientes",
      JSON.stringify(comprasActualizadas)
    );
    setComprasPendientes(comprasActualizadas); // Update state

    toast({
      title: "Éxito",
      description: mensajeToast,
    });
  };

  // Eliminar venta pendiente de localStorage y state
  const eliminarCompraPendiente = (compraId: string) => {
    const comprasGuardadas = JSON.parse(
      localStorage.getItem("comprasPendientes") || "[]"
    ) as CompraPendiente[];
    const comprasActualizadas = comprasGuardadas.filter(
      (v) => v.id !== compraId
    );
    localStorage.setItem(
      "comprasPendientes",
      JSON.stringify(comprasActualizadas)
    );
    setComprasPendientes(comprasActualizadas); // Update state directly

    // If the deleted sale was the one being edited, clear the form and URL
    if (editingPendingSaleId === compraId) {
      setEditingPendingSaleId(null);
      setProductosSeleccionados([]);
      setSelectedProveedor(null);
      setSelectedName(null);
      setPago(0);
      navigate("/comprar", { replace: true });
    }
  };

  // Guardar venta finalizada
  const guardarCompra = async () => {
    if (!currentUser?.id) {
      toast({
        title: "Error",
        description: "Usuario no autenticado.",
        variant: "destructive",
      });
      return;
    }
    if (productosSeleccionados.length === 0) {
      toast({
        title: "Error",
        description: "Debe agregar al menos un producto",
        variant: "destructive",
      });
      return;
    }
    
    if (!selectedProveedor) {
      toast({
        title: "Error",
        description: "Debe seleccionar un proveedor",
        variant: "destructive",
      });
      return;
    }
    if (pago < total) {
      toast({
        title: "Error",
        description: "El pago no cubre el total de la venta",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Generate a compra code in the format: COMPRAYYYY-XXXX
      const now = new Date();
      const year = now.getFullYear();
      // Generate a random 4-digit number for the sequential part
      const randomNum = Math.floor(1000 + Math.random() * 9000);
      const compraCodigo = `COMPRA${year}-${randomNum}`;
      
      // Prepare detalles array matching the expected API format
      const detalles = productosSeleccionados.map(p => ({
        cantidad: p.cantidad,
        precioCompra: p.precio, // Keep as string as expected by the API
        total: (p.cantidad * parseFloat(p.precio)).toFixed(2),
        descripcion: p.producto.nombre || `Producto ${p.producto.id}`,
        productoId: p.producto.id,
        empresaId: empresaId
      } as CreateCompraDetalle));

      // Crear compra en backend
      const compra = await createCompra({
        codigo: compraCodigo,
        proveedorId: selectedProveedor || null,
        usuarioId: currentUser.id,
        cajaId: selectedCajaId || currentUser.cajaId || 1,
        empresaId: empresaId,
        total: total.toFixed(2),
        pagado: pago.toFixed(2),
        cambio: cambio.toFixed(2),
        fecha: new Date().toISOString().split("T")[0],
        hora: new Date()
          .toLocaleTimeString("es-ES", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false
          }),
        detalles: detalles,
      });

      if (!compra || !compra.id) {
        throw new Error("No se pudo crear la compra correctamente");
      }

      // Actualizar el stock de los productos
      await Promise.all(
        productosSeleccionados.map(async (p) => {
          await updateProducto(p.producto.id, {
            ...p.producto,
            stockTotal: (p.producto.stockTotal || 0) + p.cantidad, // Sumar al stock en compras
          });
        })
      );

      // Si esta compra era pendiente, eliminarla de localStorage
      if (editingPendingSaleId) {
        eliminarCompraPendiente(editingPendingSaleId);
      }

      // Mostrar mensaje de éxito
      toast({
        title: "Compra registrada",
        description: "La compra se ha registrado correctamente",
        variant: "default",
      });

      // Redirigir a la página de compras
      navigate("/compras");

      toast({
        title: "Compra registrada",
        description: `Compra ${compra.codigo} registrada correctamente`,
      });
      // Reset form state after successful sale
      setProductosSeleccionados([]);
      setSelectedProveedor(null);
      setPago(0);
      navigate("/compras"); // Navegar a la lista de ventas
    } catch (error) {
      console.error("Error al registrar la compra:", error); // Log detailed error
      toast({
        title: "Error",
        description: "No se pudo registrar la compra. Intenta de nuevo.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Cargar compra pendiente seleccionada desde la Sheet
  const cargarCompraPendiente = (compra: CompraPendiente) => {
    setProductosSeleccionados(compra.productos);
    setSelectedProveedor(compra.proveedor_id);
    setSelectedName(compra.proveedor_name);
    setCompraEstado("pendiente");
    setPago(compra.total);
    setEditingPendingSaleId(compra.id); // Track the loaded sale ID
    navigate(`/comprar?pendiente=${compra.id}`, { replace: true }); // Update URL
    // Consider closing the sheet here if needed, might require passing props
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center">
          <Truck className="mr-2 h-6 w-6" />
          {editingPendingSaleId ? "Editando Compra Pendiente" : "Nueva Compra"}
        </h1>
        <div className="flex gap-2">
          {/* Adjusted button for responsive text */}
          <Button variant="outline" onClick={() => navigate("/compras")}>
            <ListOrdered className="h-4 w-4 md:mr-2" />
            <span className="hidden md:inline">Lista de Compras</span>
          </Button>
          {/* Pending Sales Sheet Trigger */}
          <Sheet>
            <SheetTrigger asChild>
              {/* Adjusted gap and added spans for responsive text/badge */}
              <Button
                variant="outline"
                className="flex items-center gap-0 md:gap-2"
              >
                <Clock className="h-4 w-4" />
                <span className="hidden md:inline">Compras Pendientes</span>
                {comprasPendientes.length > 0 && (
                  <span className="ml-1 rounded-full bg-primary w-5 h-5 hidden md:flex items-center justify-center text-xs text-primary-foreground">
                    {comprasPendientes.length}
                  </span>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[400px] sm:w-[540px]">
              <SheetHeader>
                <SheetTitle>Compras Pendientes</SheetTitle>
              </SheetHeader>
              <ScrollArea className="h-[calc(100vh-8rem)] mt-4">
                <div className="space-y-4">
                  {comprasPendientes.length === 0 ? (
                    <p className="text-center text-muted-foreground py-4">
                      No hay compras pendientes
                    </p>
                  ) : (
                    comprasPendientes.map((compra) => (
                      <div
                        key={compra.id}
                        className="p-4 border rounded-lg hover:bg-accent relative"
                      >
                        {/* Delete Button */}
                        <div className="absolute bottom-2 right-2 z-10">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-red-500 hover:bg-red-100 h-6 w-6 p-1"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSaleToDelete(compra.id);
                            }}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                        {/* Clickable Area */}
                        <div
                          className="cursor-pointer"
                          onClick={() => cargarCompraPendiente(compra)}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <p className="font-medium">
                                {compra.productos.length} productos
                              </p>
                              <p className="font-medium">
                                Proveedor: {compra.proveedor_name}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {new Date(compra.fecha).toLocaleDateString()}
                              </p>
                            </div>
                            <span className="font-bold">
                              {formatCurrency(compra.total)}
                            </span>
                          </div>
                          <div className="space-y-1">
                            {compra.productos.slice(0, 3).map((item) => (
                              <p
                                key={item.producto.id}
                                className="text-sm text-muted-foreground"
                              >
                                {item.cantidad}x {item.producto.nombre}
                              </p>
                            ))}
                            {compra.productos.length > 3 && (
                              <p className="text-sm text-muted-foreground">
                                Y {compra.productos.length - 3} más...
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
              {/* Delete Confirmation Dialog Instance */}
              <DeleteDialog
                open={!!saleToDelete}
                onOpenChange={(isOpen) => !isOpen && setSaleToDelete(null)}
                onConfirm={() => {
                  if (saleToDelete) {
                    eliminarCompraPendiente(saleToDelete);
                    setSaleToDelete(null);
                    toast({ title: "Compra pendiente eliminada" });
                  }
                }}
                title="Confirmar Eliminación"
                description="¿Estás seguro de que deseas eliminar esta compra pendiente? Esta acción no se puede deshacer."
              />
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Main Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Product Search and List */}
        <div className="lg:col-span-2 space-y-4">
          {/* Search and Filter */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar productos por nombre o código..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            {/* Category Filter Popover */}
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-[200px] flex items-center justify-between"
                >
                  <div className="flex items-center gap-2 truncate">
                    <Filter className="h-4 w-4" />
                    <span className="truncate">
                      {selectedCategorias.length === 0
                        ? "Todas las categorías"
                        : selectedCategorias.length === 1
                        ? categorias.find((c) => c.id === selectedCategorias[0])
                            ?.nombre
                        : `${selectedCategorias.length} categorías`}
                    </span>
                  </div>
                  <ChevronDown className="h-4 w-4 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[200px] p-0" align="end">
                <div className="p-2">
                  <div className="mb-2 px-2 py-1.5">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <Checkbox
                        checked={selectedCategorias.length === 0}
                        onCheckedChange={() => setSelectedCategorias([])}
                      />
                      <span className="text-sm font-medium">
                        Todas las categorías
                      </span>
                    </label>
                  </div>
                  <ScrollArea className="max-h-[300px]">
                    {categorias.map((categoria) => (
                      <div key={categoria.id} className="px-2 py-1.5">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <Checkbox
                            checked={selectedCategorias.includes(categoria.id)}
                            onCheckedChange={(checked) => {
                              setSelectedCategorias((prev) =>
                                checked
                                  ? [...prev, categoria.id]
                                  : prev.filter((id) => id !== categoria.id)
                              );
                            }}
                          />
                          <span className="text-sm">{categoria.nombre}</span>
                        </label>
                      </div>
                    ))}
                  </ScrollArea>
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {/* Available Products List */}
          <div className="border rounded-lg p-4">
            <h2 className="font-semibold mb-4">Productos Disponibles</h2>
            <ScrollArea className="h-[400px]">
              {" "}
              {/* Added ScrollArea */}
              {loading ? (
                <p className="text-muted-foreground text-center py-8">
                  Cargando productos...
                </p>
              ) : filteredProductos.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No se encontraron productos
                </p>
              ) : (
                <div className="space-y-2">
                  {filteredProductos.map((producto) => (
                    <div
                      key={producto.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer"
                      onClick={() => agregarProducto(producto)}
                    >
                      <div>
                        <p className="font-medium">{producto.nombre}</p>
                        <p className="text-sm text-muted-foreground">
                          {producto.codigo} •{" "}
                          {categorias.find((c) => c.id === producto.categoriaId)
                            ?.nombre || "Sin categoría"}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {formatCurrency(getPrecioCompra(producto))}
                        </span>
                        <Plus className="h-4 w-4 text-primary" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        </div>

        {/* Right Column: Sale Summary */}
        <div className="space-y-4">
          <div className="border rounded-lg p-4">
            <h2 className="font-semibold mb-4">Resumen de Compra</h2>

            {/* Caja Selector */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Caja</label>
              <Select
                value={selectedCajaId?.toString() ?? "no_caja"}
                onValueChange={(value) =>
                  setSelectedCajaId(value === "no_caja" ? null : Number(value))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar caja" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="no_caja">Sin caja</SelectItem>
                  {cajas.map((caja) => (
                    <SelectItem key={caja.id} value={caja.id.toString()}>
                      {caja.nombre || `Caja #${caja.numero}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Client Selector */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">
                Proveedor
              </label>
              <Select
                value={selectedProveedor?.toString()}
                onValueChange={(value) => {
                  const selectedId = value ? Number(value) : null;
                  setSelectedProveedor(selectedId);
                  if (selectedId) {
                    const selected = proveedores.find(p => p.id === selectedId);
                    setSelectedName(selected?.nombre || "");
                  } else {
                    setSelectedName("");
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar proveedor" />
                </SelectTrigger>
                <SelectContent>
                  {proveedores.map((proveedor) => (
                    <SelectItem
                      key={proveedor.id}
                      value={proveedor.id.toString()}
                    >
                      {`${proveedor.nombre}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Selected Products List */}
            <div className="space-y-3 mb-4">
              <h3 className="font-medium">Productos seleccionados</h3>
              <ScrollArea className="h-[250px]">
                {" "}
                {/* Added ScrollArea */}
                {productosSeleccionados.length === 0 ? (
                  <p className="text-muted-foreground text-sm text-center py-4">
                    No hay productos agregados
                  </p>
                ) : (
                  <div className="space-y-2 pr-2">
                    {" "}
                    {/* Added padding for scrollbar */}
                    {productosSeleccionados.map((item) => (
                      <div
                        key={item.producto.id}
                        className="flex items-center justify-between p-2 border rounded-lg"
                      >
                        <div className="flex-1 mr-2">
                          {" "}
                          {/* Added margin */}
                          <p className="font-medium text-sm truncate">
                            {item.producto.nombre}
                          </p>{" "}
                          {/* Truncate */}
                          <p className="text-xs text-muted-foreground">
                            {formatCurrency(getPrecioCompra(item.producto))} c/u
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          {" "}
                          {/* Reduced gap */}
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-6 w-6" // Smaller button
                            onClick={() =>
                              actualizarCantidad(
                                item.producto.id,
                                item.cantidad - 1
                              )
                            }
                            disabled={item.cantidad <= 1}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-8 text-center text-sm font-medium">
                            {item.cantidad}
                          </span>{" "}
                          {/* Adjusted font */}
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-6 w-6" // Smaller button
                            onClick={() =>
                              actualizarCantidad(
                                item.producto.id,
                                item.cantidad + 1
                              )
                            }
                            disabled={
                              item.cantidad >= (item.producto.stockTotal || 0)
                            }
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-red-500 hover:bg-red-100" // Smaller button
                            onClick={() => eliminarProducto(item.producto.id)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </div>

            {/* Totals Section */}
            <div className="space-y-2 border-t pt-4">
              <div className="flex justify-between">
                <span>Total:</span>
                <span className="font-bold">{formatCurrency(total)}</span>
              </div>
              <div className="flex justify-between items-center">
                {" "}
                {/* Align items */}
                <span>Pago:</span>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={pago}
                  onChange={(e) => setPago(Number(e.target.value))}
                  className="w-32 text-right h-8" // Smaller input
                />
              </div>
              <div className="flex justify-between font-medium">
                <span>Cambio:</span>
                <span
                  className={cn(
                    "font-bold",
                    cambio < 0 ? "text-red-500" : "text-green-500"
                  )}
                >
                  {formatCurrency(cambio)}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 mt-4">
              <Button
                className="flex-1"
                variant="outline"
                onClick={guardarCompraPendiente}
                disabled={loading || productosSeleccionados.length === 0}
              >
                {editingPendingSaleId
                  ? "Actualizar Pendiente"
                  : "Guardar Pendiente"}
              </Button>
              <Button
                className="flex-1"
                onClick={guardarCompra}
                disabled={
                  loading || productosSeleccionados.length === 0 || pago < total
                }
              >
                {loading ? "Procesando..." : "Finalizar Compra"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
