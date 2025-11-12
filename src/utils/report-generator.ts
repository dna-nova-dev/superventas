import type { Empresa } from "@/types"
import { ExcelExporter } from "./excel-exporter"
import { PDFExporter } from "./pdf-exporter"
import { formatCurrency } from "@/data/mockData"
import type { ReportFilter, ReportInfo, ReportData } from "@/types/report.interface"

export class ReportGenerator {
  private excelExporter: ExcelExporter
  private pdfExporter: PDFExporter
  private empresa: Empresa

  constructor(empresa: Empresa, companyLogo?: string) {
    this.empresa = empresa
    this.excelExporter = new ExcelExporter(empresa.nombre, companyLogo)
    this.pdfExporter = new PDFExporter(empresa.nombre)
  }

  public generateReport(reportType: string, format: "excel" | "pdf", data: ReportData, filters?: ReportFilter): void {
    const reportData = this.generateReportData(reportType, data)

    const now = new Date().toLocaleString()
    const reportInfo: ReportInfo = {
      title: `Reporte de ${reportType}`,
      subtitle: `${this.empresa.nombre} - Sistema de Gestión`,
      date: now,
      filters: filters ? this.formatFilters(filters) : undefined,
    }

    const fileName = `${this.empresa.nombre}_Reporte_${reportType.replace(/\s+/g, "_")}_${this.formatDateForFileName(new Date())}`

    if (format === "excel") {
      this.excelExporter.exportToExcel(reportData, fileName, reportInfo)
    } else {
      this.pdfExporter.exportToPDF(reportData, fileName, reportInfo)
    }
  }

  private generateReportData(reportType: string, data: ReportData): Array<Record<string, string | number>> {
    const { ventas, productos, ventaDetalles, categorias } = data

    switch (reportType) {
      case "Ventas":
        return ventas.map((venta) => {
          const cliente = data.clientes?.find((c) => c.id === venta.clienteId)
          // Use createdAt instead of fecha, and ensure we have a valid date
          const fechaVenta = venta.createdAt || venta.fecha || new Date().toISOString();
          return {
            ID: venta.id,
            Fecha: new Date(fechaVenta).toLocaleDateString(),
            Hora: new Date(fechaVenta).toLocaleTimeString(),
            Cliente: cliente?.nombre || `ID: ${venta.clienteId}`, 
            Total: formatCurrency(Number.parseFloat(venta.total)),
            Estado: "Completada",
          }
        })
      

      case "Inventario":
        return productos.map((prod) => ({
          ID: prod.id,
          Código: prod.codigo,
          Producto: prod.nombre,
          Categoría: categorias.find((cat) => cat.id === prod.categoriaId)?.nombre || "Sin categoría",
          "Precio Compra": formatCurrency(Number.parseFloat(prod.precioCompra)),
          "Precio Venta": formatCurrency(Number.parseFloat(prod.precioVenta)),
          Stock: prod.stockTotal,
          "Valor Total": formatCurrency(Number.parseFloat(prod.precioCompra) * prod.stockTotal),
        }))

      case "Productos Populares": {
        interface ProductoVentas {
          cantidad: number;
          total: number;
        }
        
        const productoVentas = ventaDetalles.reduce<Record<string, ProductoVentas>>(
          (acc, detalle) => {
            const productoId = detalle.productoId;
            if (!acc[productoId]) {
              acc[productoId] = {
                cantidad: 0,
                total: 0,
              };
            }
            acc[productoId].cantidad += detalle.cantidad;
            acc[productoId].total += Number.parseFloat(detalle.total);
            return acc;
          },
          {}
        );

        return Object.entries(productoVentas)
          .map(([productoId, datos]) => {
            const prod = productos.find((p) => p.id === Number.parseInt(productoId));
            return {
              ID: productoId,
              Código: prod?.codigo || "N/A",
              Producto: prod?.nombre || "Producto desconocido",
              Categoría: prod
                ? categorias.find((cat) => cat.id === prod.categoriaId)?.nombre || "Sin categoría"
                : "Sin categoría",
              "Unidades Vendidas": datos.cantidad,
              "Total Vendido": formatCurrency(datos.total),
              "Precio Unitario": prod ? formatCurrency(Number.parseFloat(prod.precioVenta)) : "N/A",
            };
          })
          .sort((a, b) => (b["Unidades Vendidas"] as number) - (a["Unidades Vendidas"] as number));
      }

      case "Ventas por Categoría":
        return this.generateVentasPorCategoria(data)

      default:
        return []
    }
  }

  private generateVentasPorCategoria(data: ReportData): Array<Record<string, string | number>> {
    const { ventas, productos, ventaDetalles, categorias } = data

    const totalVentas = ventas.reduce((acc, venta) => acc + Number.parseFloat(venta.total), 0)

    return categorias
      .map((categoria) => {
        const productosCategoria = productos.filter((p) => p.categoriaId === categoria.id)
        const productoIds = productosCategoria.map((p) => p.id)

        let total = 0
        ventaDetalles.forEach((detalle) => {
          if (productoIds.includes(detalle.productoId)) {
            total += Number.parseFloat(detalle.total)
          }
        })

        const porcentaje = totalVentas > 0 ? (total / totalVentas) * 100 : 0

        return {
          Categoría: categoria.nombre,
          Ubicación: categoria.ubicacion,
          "Total Vendido": formatCurrency(total),
          Porcentaje: `${porcentaje.toFixed(1)}%`,
          "Cantidad": productosCategoria.length,
        }
      })
      .sort((a, b) => {
        const totalA = Number.parseFloat(a["Total Vendido"].replace(/[^0-9.-]+/g, ""))
        const totalB = Number.parseFloat(b["Total Vendido"].replace(/[^0-9.-]+/g, ""))
        return totalB - totalA
      })
  }

  private formatFilters(filters: ReportFilter): string {
    const formattedFilters = []

    if (filters.period) {
      const periodMap: Record<string, string> = {
        "7days": "Últimos 7 días",
        "30days": "Último mes",
        "365days": "Último año",
        all: "Todas las ventas",
        month: "Este mes",
        year: "Este año",
      }

      formattedFilters.push(`Período: ${periodMap[filters.period] || filters.period}`)
    }

    if (filters.startDate && filters.endDate) {
      formattedFilters.push(`Desde: ${filters.startDate} Hasta: ${filters.endDate}`)
    }

    if (filters.category) {
      formattedFilters.push(`Categoría: ${filters.category}`)
    }

    return formattedFilters.join(", ")
  }

  private formatDateForFileName(date: Date): string {
    // Ensure we have a valid date
    const safeDate = date instanceof Date ? date : new Date(date || new Date().toISOString());
    
    const year = safeDate.getFullYear();
    const month = String(safeDate.getMonth() + 1).padStart(2, "0");
    const day = String(safeDate.getDate()).padStart(2, "0");
    const hours = String(safeDate.getHours()).padStart(2, "0");
    const minutes = String(safeDate.getMinutes()).padStart(2, "0");

    return `${year}${month}${day}_${hours}${minutes}`;
  }
}

