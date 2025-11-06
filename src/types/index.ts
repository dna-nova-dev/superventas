import { Caja } from "./caja.interface";

// Data Types for the sales system

export type EstadoVenta = 'pendiente' | 'completada' | 'cancelada' | 'devuelta';

export interface ProductoVentaPendiente {
  id: number;
  nombre: string;
  cantidad: number;
  precioVenta: string;
  total: string;
  descripcion?: string;
}

export interface VentaPendiente {
  usuarioId: number;
  empresaId: number;
  id: number;
  productos: ProductoVentaPendiente[]; // JSON string with products information
  clienteId: number; // Foreign key to Cliente
  clienteName: string; // Client's name
  total: string; // Total amount as decimal string (e.g., "1000.00")
  nombreVendedor: string; // Salesperson's name
  estado: string; // Status (e.g., "pendiente", "vendido")
  fecha: string; // Date string (YYYY-MM-DD)
  createdAt: string; // Creation timestamp (ISO string)
  updatedAt: string; // Last update timestamp (ISO string)
  // Optional fields that might be populated by the frontend
  cliente?: Cliente;
  productosData?: ProductoVentaPendiente[]; // Parsed productos JSON
}

export interface CreateVentaPendiente {
  productos: ProductoVentaPendiente[]; // JSON string with products information
  clienteId: number; // Client ID (required)
  clienteName: string; // Client name (required)
  total: string; // Total amount as decimal string (e.g., "1000.00") (required)
  nombreVendedor: string; // Salesperson name (required)
  estado: string; // Status (e.g., "pendiente") (required)
  fecha: string; // Date in format "YYYY-MM-DD" (required)
}

export interface Categoria {
  id: number;
  empresaId: number;
  nombre: string;
  ubicacion: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface Cliente {
  id: number;
  empresaId: number;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  tipoDocumento: string;
  numeroDocumento: string;
  nombre: string;
  apellido: string;
  departamento: string;
  municipio: string;
  direccion: string;
  telefono: string;
  email: string;
}

export interface Proveedor {
  id: number;
  empresaId: number;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  tipoDocumento: string;
  numeroDocumento: string;
  nombre: string;
  departamento: string;
  municipio: string;
  direccion: string;
  telefono: string;
  email: string;
}

export interface Empresa {
  id: number;
  nombre: string;
  nit: string;
  telefono: string;
  owner: number;
  email: string;
  direccion: string;
  foto: string;
}

export interface CreateEmpresa {
  nombre: string;
  nit: string;
  telefono: string;
  owner: number;
  email: string;
  direccion: string;
  foto: string;
}

export interface Producto {
  id: number;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  codigo: string;
  nombre: string;
  stockTotal: number;
  tipoUnidad: string;
  precioCompra: string;
  precioVenta: string;
  marca: string;
  modelo: string;
  estado: string;
  foto: string;
  categoriaId: number;
  empresaId: number;
}

export interface Usuario {
  id: number;
  empresaId: number;
  nombre: string;
  apellido: string;
  email: string;
  usuario: string;
  clave: string;
  cargo: string;
  foto: string;
  cajaId: number;
  estado: string;
  hasChangedPassword: boolean;
  // Backwards compatibility
  usuario_id?: number;
  usuario_nombre?: string;
  usuario_apellido?: string;
  usuario_email?: string;
  usuario_usuario?: string;
  usuario_clave?: string;
  usuario_cargo?: string;
  usuario_foto?: string;
  caja_id?: number;
  usuario_creado?: string;
  usuario_actualizado?: string;
  usuario_eliminado?: string | null;
  has_changed_password?: boolean;
}

export interface Venta {
  id: number;
  empresaId: number;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  codigo: string;
  fecha: string;
  hora: string;
  total: string;
  pagado: string;
  cambio: string;
  usuarioId: number;
  clienteId: number;
  cajaId: number;
  estado: EstadoVenta;
  detalles: VentaDetalle[];
  // Relations
  cliente?: Cliente;
  usuario?: Usuario;
}

export interface CreateVenta extends Record<string, unknown> {
  codigo: string;
  empresaId: number;
  fecha: string;
  hora: string;
  total: string;
  pagado: string;
  cambio: string;
  usuarioId: number;
  clienteId: number;
  cajaId: number;
  detalles: CreateVentaDetalle[];
  estado?: string; // Agregado para soportar ventas pendientes
}

export interface VentaDetalle {
  id: number;
  empresaId: number;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  cantidad: number;
  precioCompra: string;
  precioVenta: string;
  total: string;
  descripcion: string;
  ventaCodigo: string;
  productoId: number;
}
export interface CreateVentaDetalle {
  cantidad: number;
  precioCompra: string;
  precioVenta: string;
  total: string;
  descripcion: string;
  ventaCodigo: string;
  productoId: number;
  empresaId?: number; // Agregado para mantener consistencia con el modelo
}

export interface Gasto {
  id: number;
  empresaId: number;
  createdAt: string;
  updatedAt: string;
  deletedAt: null | string;
  razon: string;
  monto: string;
  fondo: "Efectivo" | "Transferencia" | "Tarjeta";
  cajaId: number;
}

export interface Compra {
  id: number;
  empresaId: number;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  codigo: string;
  fecha: string;
  hora: string;
  total: string;
  pagado: string;
  cambio: string;
  usuarioId: number;
  proveedorId: number;
  cajaId: number;
  detalles: CompraDetalle[];
}

export interface CreateCompra {
  codigo: string;
  empresaId: number;
  fecha: string;
  hora: string;
  total: string;
  pagado: string;
  cambio: string;
  usuarioId: number;
  proveedorId: number;
  cajaId: number;
  detalles: CreateCompraDetalle[];
}

export interface CompraDetalle {
  id: number;
  empresaId: number;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  cantidad: number;
  precioCompra: string;
  total: string;
  productoId: number;
  compraCodigo: string;
}
export interface CreateCompraDetalle {
  [key: string]: unknown;
  cantidad: number;
  precioCompra: string;
  total: string;
  descripcion: string;
  productoId: number;
  empresaId: number;
}

export interface AppData {
  caja: Caja[];
  categoria: Categoria[];
  cliente: Cliente[];
  proveedor: Proveedor[];
  empresa: Empresa[];
  producto: Producto[];
  usuario: Usuario[];
  venta: Venta[];
  venta_detalle: VentaDetalle[];
  compra: Compra[];
  compra_detalle: CompraDetalle[];
  gastos: Gasto[];
}
