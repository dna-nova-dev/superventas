import { jsPDF } from "jspdf"

export class PDFExporter {
  private companyName: string
  private companyLogo?: string
  private primaryColor: [number, number, number] = [173, 216, 230] 
  private secondaryColor: [number, number, number] = [245, 245, 245]
  private accentColor: [number, number, number] = [82, 145, 255]
  private fontFamily = "helvetica"

  constructor(
    companyName: string,
    options?: {
      companyLogo?: string
      primaryColor?: [number, number, number]
      secondaryColor?: [number, number, number]
      accentColor?: [number, number, number]
      fontFamily?: "helvetica" | "courier" | "times"
    },
  ) {
    this.companyName = companyName

    if (options) {
      this.companyLogo = options.companyLogo
      this.primaryColor = options.primaryColor || this.primaryColor
      this.secondaryColor = options.secondaryColor || this.secondaryColor
      this.accentColor = options.accentColor || this.accentColor
      this.fontFamily = options.fontFamily || this.fontFamily
    }
  }

  public exportToPDF(
    data: any[],
    fileName: string,
    reportInfo: {
      title: string
      subtitle?: string
      date: string
      filters?: string
      orientation?: "portrait" | "landscape"
      pageSize?: "a4" | "letter" | "legal"
      includeTableOfContents?: boolean
    },
  ): void {
    const orientation = reportInfo.orientation || "portrait"
    const pageSize = reportInfo.pageSize || "a4"

    const doc = new jsPDF({
      orientation: orientation,
      unit: "mm",
      format: pageSize,
    })

    doc.setProperties({
      title: reportInfo.title,
      subject: reportInfo.subtitle || "",
      author: this.companyName,
      creator: this.companyName,
    })

    this.addHeader(doc, reportInfo)

    let startY = 50
    if (reportInfo.includeTableOfContents && data.length > 20) {
      startY = this.addTableOfContents(doc, data, startY)
    }

    this.addDataTable(doc, data, startY)

    this.addFooter(doc)

    doc.save(`${fileName}.pdf`)
  }

  private addHeader(
    doc: jsPDF,
    reportInfo: {
      title: string
      subtitle?: string
      date: string
      filters?: string
    },
  ): void {
    const pageWidth = doc.internal.pageSize.width
    const margin = 15

    let logoHeight = 0
    if (this.companyLogo) {
      try {
        const logoSize = this.addLogo(doc, this.companyLogo, margin, 10, 40)
        logoHeight = logoSize.height
      } catch (error) {
        console.error("Error adding logo:", error)
      }
    }

    const yStart = Math.max(15, logoHeight + 5)
    doc.setFontSize(16)
    doc.setFont(this.fontFamily, "bold")
    doc.setTextColor(this.primaryColor[0], this.primaryColor[1], this.primaryColor[2])
    doc.text(this.companyName, margin, yStart)

    doc.setDrawColor(this.primaryColor[0], this.primaryColor[1], this.primaryColor[2])
    doc.setLineWidth(0.5)
    doc.line(margin, yStart + 2, pageWidth - margin, yStart + 2)

    doc.setFillColor(250, 250, 250)
    doc.roundedRect(margin, yStart + 5, pageWidth - margin * 2, 25, 2, 2, "F")

    doc.setFontSize(14)
    doc.setTextColor(60, 60, 60)
    doc.text(reportInfo.title, margin + 3, yStart + 12)

    let yPos = yStart + 12
    if (reportInfo.subtitle) {
      yPos += 7
      doc.setFontSize(11)
      doc.setFont(this.fontFamily, "normal")
      doc.setTextColor(90, 90, 90)
      doc.text(reportInfo.subtitle, margin + 3, yPos)
    }

    doc.setFontSize(9)
    doc.setTextColor(100, 100, 100)

    yPos += 6
    doc.setFont(this.fontFamily, "normal")
    doc.text(`Generado: ${reportInfo.date}`, margin + 3, yPos)

    // Filters if provided
    if (reportInfo.filters) {
      yPos += 5
      doc.setFont(this.fontFamily, "normal")
      doc.text(`Filtros: ${reportInfo.filters}`, margin + 3, yPos)
    }
  }

  private addLogo(
    doc: jsPDF,
    logoUrl: string,
    x: number,
    y: number,
    maxWidth: number,
  ): { width: number; height: number } {
    try {
      const logoWidth = 30
      const logoHeight = 15

      doc.setFillColor(this.primaryColor[0], this.primaryColor[1], this.primaryColor[2])
      doc.roundedRect(x, y, logoWidth, logoHeight, 2, 2, "F")

      doc.setFontSize(8)
      doc.setTextColor(255, 255, 255)
      doc.text("LOGO", x + logoWidth / 2 - 6, y + logoHeight / 2 + 2)

      return { width: logoWidth, height: logoHeight }
    } catch (error) {
      console.error("Error loading logo:", error)
      return { width: 0, height: 0 }
    }
  }

  private addTableOfContents(doc: jsPDF, data: any[], startY: number): number {
    const margin = 15
    const pageWidth = doc.internal.pageSize.width

    doc.setFontSize(12)
    doc.setFont(this.fontFamily, "bold")
    doc.setTextColor(60, 60, 60)
    doc.text("Tabla de Contenidos", margin, startY)

    startY += 5

    doc.setDrawColor(this.accentColor[0], this.accentColor[1], this.accentColor[2])
    doc.setLineWidth(0.3)
    doc.line(margin, startY, pageWidth - margin, startY)

    startY += 5

    const groupSize = 10
    const groups = Math.ceil(data.length / groupSize)

    doc.setFontSize(10)
    doc.setFont(this.fontFamily, "normal")
    doc.setTextColor(80, 80, 80)

    for (let i = 0; i < groups; i++) {
      const start = i * groupSize + 1
      const end = Math.min((i + 1) * groupSize, data.length)
      doc.text(`Registros ${start} - ${end}`, margin, startY + i * 6)
    }

    startY += groups * 6 + 10

    if (startY > doc.internal.pageSize.height - 50) {
      doc.addPage()
      startY = 20
    }

    return startY
  }

  private addDataTable(doc: jsPDF, data: any[], startY: number): void {
    if (data.length === 0) return

    const headers = Object.keys(data[0])
    const margin = 15
    const pageWidth = doc.internal.pageSize.width
    const tableWidth = pageWidth - margin * 2
    const colWidths = this.calculateColumnWidths(headers, tableWidth)

    doc.setFillColor(this.primaryColor[0], this.primaryColor[1], this.primaryColor[2])
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(10)
    doc.setFont(this.fontFamily, "bold")

    doc.rect(margin, startY, tableWidth, 10, "F")

    let xOffset = margin
    headers.forEach((header, i) => {
      doc.text(this.formatHeaderText(header), xOffset + 2, startY + 6)
      xOffset += colWidths[i]
    })

    doc.setTextColor(50, 50, 50)
    doc.setFontSize(9)
    doc.setFont(this.fontFamily, "normal")

    let y = startY + 10
    const rowHeight = 8

    data.forEach((row, rowIndex) => {
      if (y > doc.internal.pageSize.height - 20) {
        doc.addPage()
        this.addFooter(doc)
        y = 20

        doc.setFillColor(this.primaryColor[0], this.primaryColor[1], this.primaryColor[2])
        doc.setTextColor(255, 255, 255)
        doc.setFontSize(10)
        doc.setFont(this.fontFamily, "bold")

        doc.rect(margin, y, tableWidth, 10, "F")

        xOffset = margin
        headers.forEach((header, i) => {
          doc.text(this.formatHeaderText(header), xOffset + 2, y + 6)
          xOffset += colWidths[i]
        })

        doc.setTextColor(50, 50, 50)
        doc.setFontSize(9)
        doc.setFont(this.fontFamily, "normal")

        y += 10
      }

      if (rowIndex % 2 === 0) {
        doc.setFillColor(this.secondaryColor[0], this.secondaryColor[1], this.secondaryColor[2])
        doc.rect(margin, y, tableWidth, rowHeight, "F")
      }

      doc.setDrawColor(220, 220, 220)
      doc.setLineWidth(0.1)

      doc.line(margin, y + rowHeight, margin + tableWidth, y + rowHeight)

      // Draw cell content
      xOffset = margin
      headers.forEach((header, i) => {
        if (i > 0) {
          doc.line(xOffset, y, xOffset, y + rowHeight)
        }

        const text = row[header]?.toString() || ""
        const truncatedText = this.truncateText(text, colWidths[i] - 4, doc)
        doc.text(truncatedText, xOffset + 2, y + 5)
        xOffset += colWidths[i]
      })

      doc.line(margin + tableWidth, y, margin + tableWidth, y + rowHeight)

      y += rowHeight
    })
  }

  private calculateColumnWidths(headers: string[], tableWidth: number): number[] {
    const colWidths: number[] = []

    const totalRatio = headers.reduce((sum, header) => {
      if (header.toLowerCase().includes("fecha") || header.toLowerCase().includes("date")) {
        return sum + 1.5
      } else if (header.toLowerCase().includes("id")) {
        return sum + 0.8
      } else if (header.toLowerCase().includes("descripcion") || header.toLowerCase().includes("description")) {
        return sum + 2.5
      } else if (header.toLowerCase().includes("precio") || header.toLowerCase().includes("price")) {
        return sum + 1.2
      } else {
        return sum + 1
      }
    }, 0)

    headers.forEach((header) => {
      let ratio = 1
      if (header.toLowerCase().includes("fecha") || header.toLowerCase().includes("date")) {
        ratio = 1.5
      } else if (header.toLowerCase().includes("id")) {
        ratio = 0.8
      } else if (header.toLowerCase().includes("descripcion") || header.toLowerCase().includes("description")) {
        ratio = 2.5
      } else if (header.toLowerCase().includes("precio") || header.toLowerCase().includes("price")) {
        ratio = 1.2
      }

      colWidths.push((ratio / totalRatio) * tableWidth)
    })

    return colWidths
  }

  private formatHeaderText(text: string): string {
    return text.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase())
  }

  private truncateText(text: string, maxWidth: number, doc: jsPDF): string {
    const textWidth = (doc.getStringUnitWidth(text) * doc.getFontSize()) / doc.internal.scaleFactor

    if (textWidth <= maxWidth) {
      return text
    }

    let truncated = text
    while (
      (doc.getStringUnitWidth(truncated + "...") * doc.getFontSize()) / doc.internal.scaleFactor > maxWidth &&
      truncated.length > 0
    ) {
      truncated = truncated.slice(0, -1)
    }

    return truncated + "..."
  }

  private addFooter(doc: jsPDF): void {
    const pageCount = (doc as any).internal.getNumberOfPages()
    const pageWidth = doc.internal.pageSize.width
    const pageHeight = doc.internal.pageSize.height
    const margin = 15

    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i)

      doc.setFillColor(248, 248, 248)
      doc.rect(0, pageHeight - 15, pageWidth, 15, "F")

      doc.setDrawColor(this.accentColor[0], this.accentColor[1], this.accentColor[2])
      doc.setLineWidth(0.3)
      doc.line(margin, pageHeight - 15, pageWidth - margin, pageHeight - 15)

      doc.setFontSize(8)
      doc.setFont(this.fontFamily, "bold")
      doc.setTextColor(this.primaryColor[0], this.primaryColor[1], this.primaryColor[2])
      doc.text(this.companyName, margin, pageHeight - 10)

      const now = new Date().toLocaleString()
      doc.setFont(this.fontFamily, "normal")
      doc.setTextColor(100, 100, 100)
      doc.text(now, pageWidth / 2 - 20, pageHeight - 10)

      doc.setFont(this.fontFamily, "bold")
      doc.text(`Página ${i} de ${pageCount}`, pageWidth - margin - 25, pageHeight - 10)
    }
  }

  public addChart(
    doc: jsPDF,
    chartData: { labels: string[]; values: number[] },
    options: {
      title: string
      x: number
      y: number
      width: number
      height: number
      type: "bar" | "pie"
    },
  ): void {
    const { x, y, width, height, title, type } = options

    // Add chart title
    doc.setFontSize(11)
    doc.setFont(this.fontFamily, "bold")
    doc.setTextColor(60, 60, 60)
    doc.text(title, x, y - 5)

    if (type === "bar") {
      this.drawBarChart(doc, chartData, x, y, width, height)
    } else if (type === "pie") {
      this.drawPieChart(doc, chartData, x, y, width, height)
    }
  }

  private drawBarChart(
    doc: jsPDF,
    chartData: { labels: string[]; values: number[] },
    x: number,
    y: number,
    width: number,
    height: number,
  ): void {
    const { labels, values } = chartData
    const maxValue = Math.max(...values)
    const barWidth = width / labels.length - 2

    doc.setDrawColor(100, 100, 100)
    doc.setLineWidth(0.3)
    doc.line(x, y, x, y + height)
    doc.line(x, y + height, x + width, y + height) 

    labels.forEach((label, index) => {
      const barHeight = (values[index] / maxValue) * height
      const barX = x + index * (barWidth + 2)
      const barY = y + height - barHeight

      doc.setFillColor(this.primaryColor[0], this.primaryColor[1], this.primaryColor[2], 0.7)
      doc.rect(barX, barY, barWidth, barHeight, "F")

      doc.setFontSize(7)
      doc.setTextColor(80, 80, 80)
      doc.text(label, barX + barWidth / 2 - 3, y + height + 5)

      doc.setFontSize(8)
      doc.text(values[index].toString(), barX + barWidth / 2 - 3, barY - 2)
    })
  }

  private drawPieChart(
    doc: jsPDF,
    chartData: { labels: string[]; values: number[] },
    x: number,
    y: number,
    width: number,
    height: number,
  ): void {
    const { labels, values } = chartData
    const total = values.reduce((sum, value) => sum + value, 0)
    const radius = Math.min(width, height) / 2
    const centerX = x + width / 2
    const centerY = y + height / 2

    let startAngle = 0
    const colors = [this.primaryColor, this.accentColor, [255, 99, 132], [54, 162, 235], [255, 206, 86], [75, 192, 192]]

    const legendX = centerX + radius + 10
    const legendY = centerY - radius

    doc.setFontSize(8)

    labels.forEach((label, index) => {
      const percentage = (values[index] / total) * 100
      const endAngle = startAngle + (percentage / 100) * 2 * Math.PI

      doc.setFillColor(
        colors[index % colors.length][0],
        colors[index % colors.length][1],
        colors[index % colors.length][2],
      )

      doc.circle(centerX, centerY, radius, "S")

      doc.setFillColor(
        colors[index % colors.length][0],
        colors[index % colors.length][1],
        colors[index % colors.length][2],
      )
      doc.rect(legendX, legendY + index * 10, 5, 5, "F")

      doc.setTextColor(60, 60, 60)
      doc.text(`${label}: ${percentage.toFixed(1)}%`, legendX + 8, legendY + index * 10 + 4)

      startAngle = endAngle
    })
  }

  public addWatermark(doc: jsPDF, text: string): void {
    const pageCount = (doc as any).internal.getNumberOfPages()
    const pageWidth = doc.internal.pageSize.width
    const pageHeight = doc.internal.pageSize.height

    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i)

      doc.setFontSize(30)
      doc.setTextColor(220, 220, 220)
      doc.setFont(this.fontFamily, "bold")

      doc.saveGraphicsState()
      doc.text(text, -pageWidth / 4, 0)
      doc.restoreGraphicsState()
    }
  }
}

