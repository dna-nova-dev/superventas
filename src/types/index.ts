import { Caja } from "./caja.interface";

// Data Types for the sales system

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
  usuario_id: number;
  empresaId: number;
  usuario_nombre: string;
  usuario_apellido: string;
  usuario_email: string;
  usuario_usuario: string;
  usuario_clave: string;
  usuario_cargo: string;
  usuario_foto: string;
  caja_id: number;
  usuario_creado: string;
  usuario_actualizado: string;
  usuario_eliminado: string | null;
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
  detalles: VentaDetalle[];
}
export interface CreateVenta {
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
  cantidad: number;
  precioCompra: string;
  total: string;
  compraCodigo: string;
  productoId: number;
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
