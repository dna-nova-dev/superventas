import { Categoria, Cliente, Empresa, Producto, Venta, VentaDetalle } from "."

export interface ReportFilter {
    period?: string
    category?: string
    startDate?: string
    endDate?: string
  }
  
  export interface ReportInfo {
    title: string
    subtitle?: string
    date: string
    filters?: string
  }
  
  export interface ReportData {
    ventas: Venta[]
    productos: Producto[]
    clientes: Cliente[]
    ventaDetalles: VentaDetalle[]
    categorias: Categoria[]
    currentEmpresa: Empresa
  }
  