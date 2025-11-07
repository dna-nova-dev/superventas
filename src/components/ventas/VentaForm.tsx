import React, { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { useNavigate, useLocation } from "react-router-dom"; // Import useLocation
import {
  Search,
  X,
  Plus,
  Minus,
  ShoppingCart,
  Filter,
  ChevronDown,
  Clock,
  ListOrdered,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { getAllProductos, getProductoById, updateProducto } from "@/services/productoService";
import { getAllCategorias } from "@/services/categoriaService";
import { getAllClientes } from "@/services/clienteService";
import { getVentas, createVenta, updateVenta } from "@/services/ventaService";
import { 
  getVentaPendienteById, 
  getVentaPendienteByCodigo, 
  createVentaPendiente, 
  updateVentaPendiente, 
  deleteVentaPendiente, 
  convertirAVentaPendiente, 
  getVentasPendientes,
  completarVentaPendiente
} from "@/services/ventaPendienteService";
import { createVentaDetalle } from "@/services/ventaDetalleService";
import type { CreateVentaDetalle } from "@/types";
import { ApiService } from "@/services/api.service";
import { useAuth } from "@/hooks/useAuth";
import { formatCurrency } from "@/data/mockData";
import type { Producto, Categoria, Cliente, VentaDetalle } from "@/types";

// Constante para el ID de cliente cuando no hay cliente seleccionado
const CLIENTE_SIN_REGISTRAR_ID = 0;
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

// Importar tipos necesarios
import type {
  ProductoVentaPendiente as ApiProductoVentaPendiente,
  VentaPendiente as ApiVentaPendiente,
} from "@/types";

// Interfaz para los productos en una venta pendiente
interface ProductoVentaPendiente {
  id: number;
  productoId: number;
  nombre: string;
  cantidad: number;
  precioVenta: string;
  total: string;
  descripcion?: string;
  // Propiedad opcional para la UI
  producto?: Producto | null;
}

interface VentaPendiente {
  id: number;
  clienteId: number | null; // Permitir null para cuando no hay cliente
  clienteName: string;
  cliente_name: string;
  productos: ProductoVentaPendiente[];
  total: string;
  estado: "pendiente" | "completada";
  fecha: string;
  usuarioId: number;
  empresaId: number;
  nombreVendedor: string;
  // Propiedad opcional para la UI
  producto?: Producto | null;
}

interface ProductoVentaResponse {
  id?: number;
  productoId?: number;
  nombre?: string;
  cantidad?: number;
  precioVenta?: string | number;
  total?: string | number;
  descripcion?: string;
  producto?: Producto | null;
}

interface VentaPendienteResponse {
  id: number;
  clienteId: number;
  clienteName?: string;
  cliente_name?: string;
  productos: unknown[] | string;
  total: string | number;
  estado: string;
  fecha?: string;
  usuarioId?: number;
  empresaId?: number;
  nombreVendedor?: string;
}

type ProductoSeleccionado = {
  producto: Producto;
  cantidad: number;
  precio: string;
};

type VentaEstado = "pendiente" | "vendido";

interface VentaFormProps {
  ventaId?: string;
}

// Usamos la interfaz VentaPendiente importada de @/types

export const VentaForm = () => {
  // Función para formatear la hora en 'h:mm am/pm'
  const formatTime = (date: Date) => {
    const hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'pm' : 'am';
    const formattedHours = hours % 12 || 12; // Convertir a formato 12 horas
    return `${formattedHours}:${minutes} ${ampm}`;
  };
  const { toast } = useToast();
  const { currentUser, empresaId: empresaIdFromAuth } = useAuth();
  const navigate = useNavigate();
  
  // Add fallback for empresaId and log its value
  const empresaId = empresaIdFromAuth || 1; // Default to 1 if not available
  console.log('Current empresaId:', empresaId);
  const location = useLocation(); // Get location object

  const [productos, setProductos] = useState<Producto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]); // Initialize with empty array
  const [clientes, setClientes] = useState<Cliente[]>([]);
  interface Caja {
    id: number;
    nombre: string;
    numero: number;
    // Add other properties as needed
  }
  const [cajas, setCajas] = useState<Caja[]>([]);
  const [selectedCajaId, setSelectedCajaId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategorias, setSelectedCategorias] = useState<number[]>([]);
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);
  const [selectedName, setSelectedName] = useState<string>("");
  const [productosSeleccionados, setProductosSeleccionados] = useState<
    ProductoSeleccionado[]
  >([]);
  const [pago, setPago] = useState(0);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false); // State for category filter popover
  const [ventasPendientes, setVentasPendientes] = useState<VentaPendiente[]>(
    []
  );
  const [loadingVentasPendientes, setLoadingVentasPendientes] =
    useState<boolean>(false);
  const [editingPendingSaleId, setEditingPendingSaleId] = useState<
    number | null
  >(null);
  const [saleToDelete, setSaleToDelete] = useState<number | null>(null); // State for delete dialog

  // Cargar datos iniciales (productos, categorias, clientes)
  useEffect(() => {
    const loadData = async () => {
      try {
        if (!empresaId) return; // Don't proceed if empresaId is not available

        setLoading(true);
        const [productosData, categoriasData, clientesData] = await Promise.all(
          [
            getAllProductos(empresaId),
            getAllCategorias(empresaId),
            getAllClientes(empresaId),
          ]
        );
        setProductos(productosData);
        setCategorias(categoriasData);
        setClientes(clientesData);
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
  }, [toast, empresaId]); // Added empresaId to dependency array

  // Cargar cajas disponibles
  useEffect(() => {
    const fetchCajas = async () => {
      try {
        const cajasData = await import("@/services/cajaService").then((mod) =>
          mod.getAllCajas(empresaId)
        );
        setCajas(cajasData);
      } catch (error) {
        toast({
          title: "Error",
          description: "No se pudieron cargar las cajas",
          variant: "destructive",
        });
      }
    };
    fetchCajas();
  }, [empresaId, toast]);

  // Cargar ventas pendientes desde la base de datos
  const loadVentasPendientes = useCallback(async () => {
    if (!empresaId) return;

    setLoadingVentasPendientes(true);
    try {
      console.log('Cargando ventas pendientes...');
      
      // Usar la función getVentasPendientes que ya maneja el filtrado por estado
      const ventas = await getVentasPendientes(empresaId) as unknown as Array<{
        id: number;
        clienteId: number;
        cliente?: {
          id: number;
          nombre: string;
          apellido?: string;
          telefono?: string;
          email?: string;
          tipoDocumento?: string;
          numeroDocumento?: string;
          direccion?: string;
          departamento?: string;
          municipio?: string;
          empresaId?: number;
        };
        clienteName?: string;
        cliente_name?: string;
        detalles?: Array<{
          id: number;
          cantidad: number;
          precioVenta: string | number;
          total: string | number;
          descripcion?: string;
          producto?: {
            id: number;
            nombre: string;
            codigo?: string;
            precioVenta?: string | number;
            precioCompra?: string | number;
            stock?: number;
            descripcion?: string;
            imagen?: string;
            categoriaId?: number;
            empresaId?: number;
          };
          productoId: number;
        }>;
        productos?: unknown[] | string;
        total: string | number;
        estado: string;
        fecha?: string;
        hora?: string;
        usuarioId?: number;
        empresaId?: number;
        nombreVendedor?: string;
        usuario?: {
          id: number;
          nombre: string;
          apellido?: string;
          email?: string;
        };
      }>;
      
      console.log('Ventas pendientes recibidas:', ventas);
      
      // Mapear los datos de la API al formato local
      const ventasMapeadas = ventas.map((venta) => {
        // Parse productos from detalles array
        let productos: ProductoVentaPendiente[] = [];

        if (Array.isArray(venta.detalles)) {
          // Map the detalles array to ProductoVentaPendiente format
          productos = venta.detalles.map((detalle) => ({
            id: detalle.id || 0,
            productoId: detalle.productoId || 0,
            nombre: detalle.producto?.nombre || detalle.descripcion || "Producto sin nombre",
            cantidad: detalle.cantidad || 1,
            precioVenta: typeof detalle.precioVenta === 'number' 
              ? detalle.precioVenta.toString() 
              : detalle.precioVenta || "0",
            total: typeof detalle.total === 'number' 
              ? detalle.total.toString() 
              : detalle.total || "0",
            descripcion: detalle.descripcion || "",
            producto: detalle.producto ? {
              id: detalle.producto.id,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              deletedAt: null,
              codigo: detalle.producto.codigo || "",
              nombre: detalle.producto.nombre,
              stockTotal: typeof detalle.producto.stock === 'number' ? detalle.producto.stock : 0,
              tipoUnidad: "unidad", // Default value
              precioCompra: typeof detalle.producto.precioCompra === 'number' 
                ? detalle.producto.precioCompra.toString() 
                : detalle.producto.precioCompra || "0",
              precioVenta: typeof detalle.producto.precioVenta === 'number' 
                ? detalle.producto.precioVenta.toString() 
                : detalle.producto.precioVenta || "0",
              marca: "", // Default value
              modelo: "", // Default value
              estado: "activo", // Default value
              foto: detalle.producto.imagen || "",
              categoriaId: detalle.producto.categoriaId || 0,
              empresaId: detalle.producto.empresaId || 0
            } : null
          }));
        } else if (Array.isArray(venta.productos)) {
          // Fallback to productos array if detalles is not available
          productos = (venta.productos as ProductoVentaResponse[]).map((p) => ({
            id: p.id || 0,
            productoId: p.productoId || 0,
            nombre: p.nombre || "Producto sin nombre",
            cantidad: p.cantidad || 1,
            precioVenta: p.precioVenta?.toString() || "0",
            total: p.total?.toString() || "0",
            descripcion: p.descripcion || "",
            producto: p.producto || null
          }));
        } else if (typeof venta.productos === "string") {
          // If productos is a JSON string, parse it
          try {
            const parsedProductos = JSON.parse(venta.productos);
            if (Array.isArray(parsedProductos)) {
              productos = (parsedProductos as ProductoVentaResponse[]).map((p) => ({
                id: p.id || 0,
                productoId: p.productoId || 0,
                nombre: p.nombre || "Producto sin nombre",
                cantidad: p.cantidad || 1,
                precioVenta: p.precioVenta?.toString() || "0",
                total: p.total?.toString() || "0",
                descripcion: p.descripcion || "",
                producto: p.producto || null
              }));
            }
          } catch (e) {
            console.error("Error parsing productos JSON:", e);
          }
        }

        // Obtener el nombre del cliente de la relación o de los campos planos
        const nombreCliente = venta.cliente 
          ? `${venta.cliente.nombre}${venta.cliente.apellido ? ' ' + venta.cliente.apellido : ''}`
          : venta.clienteName || venta.cliente_name || "Cliente no especificado";
          
        // Obtener el nombre del vendedor de la relación de usuario o del campo plano
        const nombreVendedor = venta.usuario
          ? `${venta.usuario.nombre}${venta.usuario.apellido ? ' ' + venta.usuario.apellido : ''}`
          : venta.nombreVendedor || "";
          
        return {
          id: venta.id,
          clienteId: venta.clienteId,
          clienteName: nombreCliente,
          cliente_name: nombreCliente,
          productos: productos,
          total: typeof venta.total === 'number' ? venta.total.toString() : venta.total,
          estado: (venta.estado === "pendiente" || venta.estado === "completada" 
            ? venta.estado 
            : "pendiente") as 'pendiente' | 'completada',
          fecha: venta.fecha || new Date().toISOString(),
          usuarioId: venta.usuarioId || 0,
          empresaId: venta.empresaId || empresaId || 0,
          nombreVendedor: nombreVendedor
        };
      });

      setVentasPendientes(ventasMapeadas as unknown as VentaPendiente[]);
    } catch (error) {
      console.error("Error al cargar ventas pendientes:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las ventas pendientes",
        variant: "destructive",
      });
    } finally {
      setLoadingVentasPendientes(false);
    }
  }, [empresaId, toast]);

  // Cargar ventas pendientes al montar el componente o cuando cambie empresaId
  useEffect(() => {
    loadVentasPendientes();
  }, [loadVentasPendientes, empresaId]);

  // Cargar venta pendiente desde URL al iniciar o cuando cambia la URL
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const ventaId = params.get("pendiente");

    const loadVentaPendiente = async () => {
      if (ventaId && !isNaN(Number(ventaId))) {
        try {
          // Aquí deberías implementar la lógica para cargar una venta pendiente por ID
          // desde tu API. Por ahora, lo dejamos vacío ya que la función cargarVentaPendiente
          // ya maneja la carga de datos.
        } catch (error) {
          console.error("Error al cargar la venta pendiente:", error);
          toast({
            title: "Error",
            description: "No se pudo cargar la venta pendiente",
            variant: "destructive",
          });
        }
      } else {
        // Reset form if no pending sale ID in URL
        setProductosSeleccionados([]);
        setSelectedCliente(null);
        setSelectedName("");
        setPago(0);
        setEditingPendingSaleId(null);
      }
    };

    loadVentaPendiente();
  }, [location.search, empresaId, toast]);

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
    // Verificar si el producto ya está en el carrito
    const productoExistente = productosSeleccionados.find(
      (p) => p.producto.id === producto.id
    );

    // Calcular la cantidad que se intenta agregar
    const cantidadAAgregar = productoExistente ? productoExistente.cantidad + 1 : 1;
    
    // Verificar stock disponible
    const { suficiente, mensaje } = verificarStockDisponible(producto, cantidadAAgregar);
    
    if (!suficiente) {
      toast({
        title: "Error de stock",
        description: mensaje,
        variant: "destructive",
      });
      return;
    }

    if (productoExistente) {
      // Si ya existe, incrementar la cantidad
      setProductosSeleccionados((prev) =>
        prev.map((p) =>
          p.producto.id === producto.id
            ? { ...p, cantidad: cantidadAAgregar }
            : p
        )
      );
    } else {
      // Si no existe, agregarlo al carrito
      setProductosSeleccionados((prev) => [
        ...prev,
        {
          producto,
          cantidad: 1,
          precio: producto.precioVenta.toString(),
        },
      ]);
    }
  };

  // Actualizar cantidad de producto
  const actualizarCantidad = (productoId: number, cantidad: number) => {
    if (cantidad < 1) return;

    const producto = productos.find((p) => p.id === productoId);
    if (!producto) return;

    const { suficiente, mensaje } = verificarStockDisponible(producto, cantidad);
    
    if (!suficiente) {
      toast({
        title: "Error de stock",
        description: mensaje,
        variant: "destructive",
      });
      return;
    }

    setProductosSeleccionados((prev) =>
      prev.map((p) => (p.producto.id === productoId ? { ...p, cantidad } : p))
    );
  };

  // Función para incrementar la cantidad de un producto en el carrito
  const handleIncrement = (producto: Producto) => {
    const productoEnCarrito = productosSeleccionados.find(p => p.producto.id === producto.id);
    if (!productoEnCarrito) return;

    const nuevaCantidad = productoEnCarrito.cantidad + 1;
    const { suficiente, mensaje } = verificarStockDisponible(producto, nuevaCantidad);
    
    if (!suficiente) {
      toast({
        title: "Error de stock",
        description: mensaje,
        variant: "destructive",
      });
      return;
    }

    setProductosSeleccionados((prev) =>
      prev.map((p) =>
        p.producto.id === producto.id
          ? { ...p, cantidad: nuevaCantidad }
          : p
      )
    );
  };

  // Función para eliminar un producto del carrito
  const eliminarProducto = (productoId: number) => {
    setProductosSeleccionados(prev => 
      prev.filter(p => p.producto.id !== productoId)
    );
  };

  
  // Función para verificar el stock disponible
  const verificarStockDisponible = (producto: Producto, cantidadDeseada: number): { suficiente: boolean; mensaje: string } => {
    const stockDisponible = Number(producto.stockTotal) || 0;
    if (stockDisponible <= 0) {
      return { suficiente: false, mensaje: `No hay stock disponible para ${producto.nombre}` };
    }
    if (cantidadDeseada > stockDisponible) {
      return { 
        suficiente: false, 
        mensaje: `Stock insuficiente para ${producto.nombre}. Stock disponible: ${stockDisponible}` 
      };
    }
    return { suficiente: true, mensaje: '' };
  };

  // Función para manejar la eliminación de una venta pendiente
  const handleDeleteVentaPendiente = async (ventaId: number) => {
    try {
      await deleteVentaPendiente(ventaId);
      await loadVentasPendientes();
      toast({
        title: "Venta pendiente eliminada",
        description: "La venta pendiente ha sido eliminada correctamente.",
      });

      // Si la venta que se está editando fue eliminada, limpiar el estado
      if (editingPendingSaleId === ventaId) {
        setEditingPendingSaleId(null);
        navigate("/vender", { replace: true });
      }
    } catch (error) {
      console.error("Error al eliminar venta pendiente:", error);
      toast({
        title: "Error",
        description: "No se pudo eliminar la venta pendiente",
        variant: "destructive",
      });
    }
  };

  // Cargar una venta pendiente desde la base de datos
  const cargarVentaPendiente = async (venta: VentaPendiente) => {
    try {
      // Convertir los detalles de la venta al formato esperado por el formulario
      const productosSeleccionados = venta.productos.map((item) => {
        const precioVenta =
          typeof item.precioVenta === "string"
            ? parseFloat(item.precioVenta)
            : item.precioVenta || 0;

        const producto: Producto = {
          id: item.productoId,
          nombre: item.nombre || `Producto ${item.productoId}`,
          precioVenta: precioVenta.toString(),
          stockTotal: 0,
          tipoUnidad: "unidad",
          precioCompra: "0",
          marca: "",
          modelo: "",
          estado: "activo",
          categoriaId: 1,
          empresaId: empresaId || 1,
          codigo: `PROD-${item.productoId}`,
          foto: "",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          deletedAt: null,
        };

        return {
          producto,
          cantidad: item.cantidad || 1,
          precio: precioVenta.toString(),
        };
      });

      setProductosSeleccionados(productosSeleccionados);
      // Buscar el cliente por ID si existe
      const cliente = venta.clienteId ? clientes.find(c => c.id === venta.clienteId) || null : null;
      setSelectedCliente(cliente);
      setSelectedName(cliente ? `${cliente.nombre} ${cliente.apellido || ''}`.trim() : "");
      // No es necesario establecer el estado aquí ya que se maneja en el formulario
      setPago(0);
      setEditingPendingSaleId(venta.id);

      // Actualizar la URL para reflejar la venta cargada
      navigate(`/vender?pendiente=${venta.id}`, { replace: true });

      toast({
        title: "Venta cargada",
        description: "Puedes continuar con la venta pendiente.",
      });
    } catch (error) {
      console.error("Error al cargar la venta pendiente:", error);
      toast({
        title: "Error",
        description: "No se pudo cargar la venta pendiente",
        variant: "destructive",
      });
    }
  };

  // Función para crear o actualizar una venta pendiente
  const handleConvertirAPendiente = async () => {
    if (!currentUser || !empresaId) {
      toast({
        title: "Error",
        description: "No se pudo autenticar el usuario o la empresa",
        variant: "destructive",
      });
      return;
    }

    if (productosSeleccionados.length === 0) {
      toast({
        title: "Error",
        description: "No hay productos seleccionados",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);

      // Obtener el usuario autenticado
      const authUser = currentUser;
      const nombreVendedor = authUser.nombre || "Vendedor";
      const codigoVenta = `V-${Date.now()}`;

      // Obtener fecha y hora actual
      const now = new Date();
      const fecha = now.toISOString().split("T")[0];
      
      const hora = formatTime(now);

      // Crear la venta con estado 'pendiente'
      const venta = await createVenta({
        codigo: codigoVenta,
        empresaId,
        clienteId: selectedCliente?.id || null,
        usuarioId: authUser.id || 1,
        cajaId: selectedCajaId || 1,
        estado: "pendiente",
        fecha,
        hora,
        detalles: productosSeleccionados.map((p) => ({
          cantidad: p.cantidad,
          precioCompra: p.producto.precioCompra || "0",
          precioVenta: p.precio, // Use the string value directly
          total: (p.cantidad * parseFloat(p.precio)).toString(),
          descripcion: p.producto.nombre,
          ventaCodigo: codigoVenta,
          productoId: p.producto.id,
          empresaId: empresaId || 1,
        })),
        pagado: "0",
        cambio: "0",
        total: total.toString(),
      });

      // Limpiar el formulario
      setProductosSeleccionados([]);
      setSelectedCliente(null);
      setSelectedName("");
      setPago(0);

      // Recargar la lista de ventas pendientes
      await loadVentasPendientes();

      toast({
        title: "Venta guardada como pendiente",
        description: `La venta ${venta.codigo} se ha guardado como pendiente.`,
      });

      // Redirigir a la página de ventas pendientes
      navigate("/ventas-pendientes");
    } catch (error) {
      console.error("Error al guardar venta pendiente:", error);
      toast({
        title: "Error",
        description: "No se pudo guardar la venta como pendiente",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Verificar stock antes de guardar la venta
  const verificarStockVenta = async (): Promise<{ valido: boolean; mensaje: string }> => {
    try {
      // Verificar stock para cada producto en el carrito
      for (const item of productosSeleccionados) {
        const productoActual = await getProductoById(item.producto.id);
        if (!productoActual) {
          return { 
            valido: false, 
            mensaje: `No se pudo verificar el stock para ${item.producto.nombre}` 
          };
        }

        const stockDisponible = Number(productoActual.stockTotal) || 0;
        if (stockDisponible < item.cantidad) {
          return { 
            valido: false, 
            mensaje: `Stock insuficiente para ${item.producto.nombre}. Stock disponible: ${stockDisponible}` 
          };
        }
      }
      return { valido: true, mensaje: '' };
    } catch (error) {
      console.error('Error al verificar stock:', error);
      return { 
        valido: false, 
        mensaje: 'Error al verificar el stock de los productos' 
      };
    }
  };

  // Calcular total y cambio
  const total = productosSeleccionados.reduce(
    (sum, item) => sum + item.cantidad * parseFloat(item.precio),
    0
  );

  const cambio = pago - total;

  // Guardar venta finalizada
  const guardarVenta = async () => {
    // Verificar autenticación
    if (!currentUser?.id) {
      toast({
        title: "Error",
        description: "Usuario no autenticado.",
        variant: "destructive",
      });
      return;
    }
    
    // Si no hay cliente seleccionado, usar null
    const clienteId = selectedCliente?.id || null;
    
    // Verificar productos seleccionados
    if (productosSeleccionados.length === 0) {
      toast({
        title: "Error",
        description: "Debe agregar al menos un producto",
        variant: "destructive",
      });
      return;
    }

    // Verificar pago
    if (pago < total) {
      toast({
        title: "Error",
        description: "El pago no cubre el total de la venta",
        variant: "destructive",
      });
      return;
    }

    // Verificar stock
    const resultadoVerificacion = await verificarStockVenta();
    if (!resultadoVerificacion.valido) {
      toast({
        title: "Error de stock",
        description: resultadoVerificacion.mensaje,
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      let venta;
      
      if (editingPendingSaleId) {
        // Si es una venta pendiente, usar la función completarVentaPendiente
        // que maneja correctamente la actualización del stock
        venta = await completarVentaPendiente(editingPendingSaleId, {
          pagado: pago.toFixed(2),
          cambio: cambio.toFixed(2),
          cajaId: 1, // Asegúrate de obtener el ID de caja correcto
          usuarioId: currentUser.id,
          empresaId: empresaId || 1
        });
      } else {
        // Si es una venta nueva, crearla normalmente
        const ventaData = {
          codigo: `V-${Date.now()}`,
          clienteId: clienteId, // Puede ser null si no hay cliente
          clienteName: selectedCliente 
            ? `${selectedCliente.nombre || ''} ${selectedCliente.apellido || ''}`.trim() 
            : 'Cliente no registrado',
          usuarioId: currentUser.id,
          empresaId,
          estado: 'completada',
          total: total.toString(),
          pago: pago.toString(),
          cambio: Math.max(0, cambio).toString(),
          fecha: new Date().toISOString().split('T')[0],
          nombreVendedor: currentUser.nombre || 'Vendedor',
          hora: formatTime(new Date()),
          pagado: '1', // Using '1' as string to match CreateVenta interface, will be converted to decimal by the database
          cajaId: 1, // Debe ser un número según el tipo CreateVenta
          detalles: productosSeleccionados.map(p => ({
            productoId: p.producto.id,
            cantidad: p.cantidad,
            precioVenta: p.precio,
            precioCompra: p.producto.precioCompra || '0',
            subtotal: (parseFloat(p.precio) * p.cantidad).toString(),
            total: (parseFloat(p.precio) * p.cantidad).toString(),
            descripcion: p.producto.nombre || '',
            ventaCodigo: `V-${Date.now()}`,
            empresaId: empresaId // Add empresaId to each detail item
          }))
        };

        venta = await createVenta(ventaData);

        // No es necesario actualizar el stock manualmente aquí
        // ya que el backend ya lo maneja al crear la venta
      }

      // Reset form state after successful sale
      setProductosSeleccionados([]);
      setSelectedCliente(null);
      setSelectedName("");
      setPago(0);
      setEditingPendingSaleId(null);

      // Mostrar mensaje de éxito
      toast({
        title: "¡Venta realizada!",
        description: `La venta ${venta.codigo} se ha registrado correctamente.`,
        variant: "default",
      });

      // Redirigir a la página de ventas con un parámetro para forzar recarga
      setTimeout(() => {
        navigate("/ventas?refresh=true");
      }, 1000);
    } catch (error) {
      console.error("Error al registrar la venta:", error); // Log detailed error
      toast({
        title: "Error",
        description: "No se pudo registrar la venta. Intenta de nuevo.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center">
          <ShoppingCart className="mr-2 h-6 w-6" />
          {editingPendingSaleId ? "Editando Venta Pendiente" : "Nueva Venta"}
        </h1>
        <div className="flex gap-2">
          {/* Adjusted button for responsive text */}
          <Button variant="outline" onClick={() => navigate("/ventas")}>
            <ListOrdered className="h-4 w-4 md:mr-2" />
            <span className="hidden md:inline">Lista de Ventas</span>
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
                <span className="hidden md:inline">Ventas Pendientes</span>
                {ventasPendientes.length > 0 && (
                  <span className="ml-1 rounded-full bg-primary w-5 h-5 hidden md:flex items-center justify-center text-xs text-primary-foreground">
                    {ventasPendientes.length}
                  </span>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[400px] sm:w-[540px]">
              <SheetHeader>
                <SheetTitle>Ventas Pendientes</SheetTitle>
              </SheetHeader>
              <ScrollArea className="h-[calc(100vh-8rem)] mt-4">
                <div className="space-y-4">
                  {loadingVentasPendientes ? (
                    <div className="flex justify-center py-4">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                  ) : ventasPendientes.length === 0 ? (
                    <p className="text-center text-muted-foreground py-4">
                      No hay ventas pendientes
                    </p>
                  ) : (
                    ventasPendientes.map((venta) => (
                      <div
                        key={venta.id}
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
                              setSaleToDelete(venta.id);
                            }}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                        {/* Clickable Area */}
                        <div
                          className="cursor-pointer"
                          onClick={() => cargarVentaPendiente(venta)}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <p className="font-medium">
                                {venta.productos.length} productos
                              </p>
                              <p className="font-medium">
                                {venta.clienteName || "Sin cliente"}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {new Date(venta.fecha).toLocaleDateString()}
                              </p>
                            </div>
                            <span className="font-bold">
                              {formatCurrency(venta.total)}
                            </span>
                          </div>
                          <div className="space-y-1">
                            {venta.productos.slice(0, 3).map((item) => (
                              <p
                                key={item.producto.id}
                                className="text-sm text-muted-foreground"
                              >
                                {item.cantidad}x {item.producto.nombre}
                              </p>
                            ))}
                            {venta.productos.length > 3 && (
                              <p className="text-sm text-muted-foreground">
                                Y {venta.productos.length - 3} más...
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
                onConfirm={async () => {
                  if (saleToDelete) {
                    try {
                      await handleDeleteVentaPendiente(saleToDelete);
                      setSaleToDelete(null);
                    } catch (error) {
                      console.error(
                        "Error al eliminar venta pendiente:",
                        error
                      );
                      toast({
                        title: "Error",
                        description: "No se pudo eliminar la venta pendiente",
                        variant: "destructive",
                      });
                    }
                  }
                }}
                title="Confirmar Eliminación"
                description="¿Estás seguro de que deseas eliminar esta venta pendiente? Esta acción no se puede deshacer."
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
                          {formatCurrency(producto.precioVenta)}
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
            <h2 className="font-semibold mb-4">Resumen de Venta</h2>

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
              <label className="block text-sm font-medium mb-1">Cliente</label>
              <Select
                value={selectedCliente?.id?.toString() ?? "no_cliente"}
                onValueChange={(value) => {
                  if (value === "no_cliente") {
                    setSelectedCliente(null);
                    setSelectedName("");
                  } else {
                    const cliente = clientes.find(c => c.id === Number(value));
                    if (cliente) {
                      setSelectedCliente(cliente);
                      setSelectedName(`${cliente.nombre} ${cliente.apellido || ''}`.trim());
                    }
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar cliente" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="no_cliente">Sin cliente</SelectItem>
                  {clientes.map((cliente) => (
                    <SelectItem key={cliente.id} value={cliente.id.toString()}>
                      {`${cliente.nombre || ""} ${
                        cliente.apellido || ""
                      }`.trim() || "Cliente sin nombre"}
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
                            {" "}
                            {/* Smaller text */}
                            {formatCurrency(item.precio)} c/u
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
            <div className="flex flex-col gap-2 mt-4">
              <div className="flex gap-2">
                <Button
                  className="flex-1"
                  variant="outline"
                  onClick={handleConvertirAPendiente}
                  disabled={loading || productosSeleccionados.length === 0}
                >
                  {loading ? "Guardando..." : "Guardar como pendiente"}
                </Button>
                <Button
                  className="flex-1"
                  onClick={guardarVenta}
                  disabled={
                    loading ||
                    productosSeleccionados.length === 0 ||
                    pago < total
                  }
                >
                  {loading ? "Procesando..." : "Finalizar Venta"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
