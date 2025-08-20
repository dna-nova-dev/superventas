import * as XLSX from "xlsx"

export class ExcelExporter {
  private companyName: string
  private companyLogo?: string
  private primaryColor = "#F59E0B"

  constructor(companyName: string, companyLogo?: string, primaryColor?: string) {
    this.companyName = companyName
    this.companyLogo = companyLogo
    if (primaryColor) {
      this.primaryColor = primaryColor
    }
  }

  public exportToExcel(
    data: any[],
    fileName: string,
    reportInfo: {
      title: string
      subtitle?: string
      date: string
      filters?: string
    },
  ): void {
    const workbook = XLSX.utils.book_new()

    workbook.Props = {
      Title: reportInfo.title,
      Subject: `Reporte de ${reportInfo.title}`,
      Author: this.companyName,
      Manager: this.companyName,
      Company: this.companyName,
      Category: "Reportes",
      CreatedDate: new Date(),
    }

    const processedData = this.prepareDataWithHeaderAndFooter(data, reportInfo)
    const worksheet = XLSX.utils.aoa_to_sheet(processedData)
    this.applyStyles(worksheet, processedData.length, Object.keys(data[0] || {}).length)
    XLSX.utils.book_append_sheet(workbook, worksheet, reportInfo.title.substring(0, 31))
    XLSX.writeFile(workbook, `${fileName}.xlsx`)
  }

  private prepareDataWithHeaderAndFooter(
    data: any[],
    reportInfo: {
      title: string
      subtitle?: string
      date: string
      filters?: string
    },
  ): any[][] {
    if (data.length === 0) return [["No hay datos disponibles"]]

    const headers = Object.keys(data[0])

    const headerRows: any[][] = [
      [this.companyName],
      [reportInfo.title],
      reportInfo.subtitle ? [reportInfo.subtitle] : [],
      [`Generado: ${reportInfo.date}`],
      reportInfo.filters ? [`Filtros: ${reportInfo.filters}`] : [],
      [],
      headers,
    ].filter((row) => row.length > 0)

    const dataRows = data.map((item) => headers.map((header) => item[header]))

    const footerRows: any[][] = [
      [],
      [`${this.companyName} - Todos los derechos reservados`],
      [`Reporte generado el ${new Date().toLocaleString()}`],
    ]

    return [...headerRows, ...dataRows, ...footerRows]
  }

  private applyStyles(worksheet: XLSX.WorkSheet, rowCount: number, colCount: number): void {
    const colWidths = Array(colCount).fill({ wch: 20 })
    worksheet["!cols"] = colWidths

    worksheet["!margins"] = {
      left: 0.7,
      right: 0.7,
      top: 0.75,
      bottom: 0.75,
      header: 0.3,
      footer: 0.3,
    }

    worksheet["!merges"] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: colCount - 1 } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: colCount - 1 } },
    ]
  }

  public prepareDataForExport(
    data: any[],
    reportInfo: {
      title: string
      subtitle?: string
      date: string
      filters?: string
    },
  ): any[] {
    if (data.length === 0) {
      const emptyData: any[] = []
      Object.defineProperty(emptyData, "_reportMetadata", {
        value: {
          companyName: this.companyName,
          reportTitle: reportInfo.title,
          generatedDate: reportInfo.date,
          filters: reportInfo.filters,
          isEmpty: true,
        },
        enumerable: false,
      })
      return emptyData
    }

    const processedData = JSON.parse(JSON.stringify(data))

    Object.defineProperty(processedData, "_reportMetadata", {
      value: {
        companyName: this.companyName,
        reportTitle: reportInfo.title,
        subtitle: reportInfo.subtitle,
        generatedDate: reportInfo.date,
        filters: reportInfo.filters,
        rowCount: data.length,
        columnCount: Object.keys(data[0]).length,
        isEmpty: false,
      },
      enumerable: false,
    })

    return processedData
  }
}
