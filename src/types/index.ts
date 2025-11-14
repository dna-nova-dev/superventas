import { Caja } from "./caja.interface";

// Data Types for the sales system

export type EstadoVenta = 'pendiente' | 'completada' | 'cancelada' | 'devuelta';

// Base entity fields that are common across most models
interface BaseEntity {
  id: number;
  empresaId: number;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

// Product Interface
export interface Producto extends BaseEntity {
  codigo: string;
  nombre: string;
  descripcion?: string;
  stockTotal: number;
  tipoUnidad: string;
  precioCompra: string;
  precioVenta: string;
  marca: string;
  modelo: string;
  estado: string;
  foto: string;
  categoriaId: number | null;
}


export interface DetalleVenta {
  id?: number;
  cantidad: number;
  precioVenta: string;
  precioCompra: string;
  total: string;
  descripcion: string;
  productoId: number;
  empresaId: number;
  ventaId?: number;
  venta_codigo?: string; // Código de la venta a la que pertenece el detalle
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
  producto?: Producto;
}

export interface VentaPendiente {
  usuarioId: number;
  empresaId: number;
  id: number;
  productos: ProductoVentaPendiente[]; // For backward compatibility
  detalles?: DetalleVenta[]; // New field for detailed items
  clienteId: number | null; // Foreign key to Cliente (can be null)
  clienteName: string; // Client's name
  total: string; // Total amount as decimal string (e.g., "1000.00")
  nombreVendedor: string; // Salesperson's name
  estado: string; // Status (e.g., "pendiente", "vendido")
  fecha: string; // Date string (YYYY-MM-DD)
  hora?: string; // Time string (HH:MM:SS)
  pagado?: string; // Amount paid
  cambio?: string; // Change amount
  cajaId?: number; // Cash register ID
  codigo?: string; // Sale code
  createdAt: string; // Creation timestamp (ISO string)
  updatedAt: string; // Last update timestamp (ISO string)
  deletedAt?: string | null; // Soft delete timestamp
  // Optional fields that might be populated by the frontend or backend
  cliente?: Cliente | null;
  usuario?: Usuario; // User who created the sale
  caja?: Caja; // Cash register info
  productosData?: ProductoVentaPendiente[]; // Parsed productos JSON (legacy)
}

export interface CreateVentaPendiente {
  productos?: ProductoVentaPendiente[]; // For backward compatibility
  detalles?: DetalleVenta[]; // New field for detailed items
  clienteId: number | null; // Client ID (can be null for unregistered clients)
  clienteName: string; // Client name (required)
  total: string; // Total amount as decimal string (e.g., "1000.00") (required)
  nombreVendedor: string; // Salesperson name (required)
  estado: string; // Status (e.g., "pendiente") (required)
  fecha: string; // Date in format "YYYY-MM-DD" (required)
  usuarioId: number; // User ID who created the pending sale
  empresaId: number; // Company ID
  pagado: string; // Amount paid (required by backend) - Note: Backend expects 'pagado' not 'venta_pagado'
  cambio: string; // Change amount (required by backend)
  cajaId: number; // Cash register ID (required by backend)
  codigo?: string; // Optional sale code
  hora?: string; // Optional time
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
  descripcion?: string;  // Added missing descripcion property
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

// Sale Detail Interface
export interface VentaDetalle {
  id?: number;
  productoId: number;
  nombre?: string;
  cantidad: number;
  precioVenta: string | number;
  precioCompra?: string | number; // Made optional
  total: string | number;
  descripcion: string;
  // Backend fields
  empresaId?: number;  // Made optional for frontend use
  ventaCodigo?: string;  // Made optional for frontend use
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
  // Frontend only
  producto?: Producto | null;
}

// Alias for frontend usage
export type ProductoVentaPendiente = Omit<VentaDetalle, 'ventaCodigo' | 'createdAt' | 'updatedAt' | 'deletedAt'> & {
  producto?: Producto | null;
  nombre?: string;
  precioVenta?: string | number;
  total?: string | number;
  // Make these fields optional for frontend convenience
  empresaId?: number;
  ventaCodigo?: string;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
};

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
