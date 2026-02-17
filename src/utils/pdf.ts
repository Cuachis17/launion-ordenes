import { jsPDF } from 'jspdf'
import unionLogo from '../assets/union.png'
import type { Order, CompanyInfo } from '../types'

export async function downloadOrderPdf(order: Order, companyInfo: CompanyInfo) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' })
  const margin = 40
  const pageWidth = doc.internal.pageSize.getWidth()

  // Helper that renders the remainder of the PDF (starts from VOUCHER)
  function renderBody(startY = 90) {
    const yVoucher = startY
    const yOrden = yVoucher + 20
    const yBitacora = yVoucher + 40
    const yLine = yVoucher + 62
    const yMeta = yVoucher + 88

    doc.setFontSize(14)
    doc.text('VOUCHER DE TRANSPORTACION', margin, yVoucher)
    doc.setFontSize(12)
    doc.text('ORDEN DE SERVICIO', margin, yOrden)
    doc.setFontSize(10)
    doc.text('BITACORA DE SERVICIOS', margin, yBitacora)

    doc.setLineWidth(1.4)
    doc.line(margin, yLine, pageWidth - margin, yLine)

    doc.setFontSize(9)
    doc.text(`Generado: ${order.generatedAt}`, margin, yMeta)
    doc.text(`No. Orden: ${order.id.toUpperCase()}`, margin, yMeta + 15)

    doc.setLineWidth(0.85)
    doc.line(margin, yMeta + 35, pageWidth - margin, yMeta + 35)

    // Boxes
    // very light gray background for input boxes (RGB 248,250,252 == #F8FAFC)
    doc.setFillColor(248, 250, 252)
    const boxX = margin
    const boxW = pageWidth - margin * 2
    doc.rect(boxX, yMeta + 45, boxW, 50, 'F')
    doc.setTextColor(79, 70, 229)
    doc.setFontSize(9)
    // Left: TÍTULO DE RESERVA
    doc.text('TÍTULO DE RESERVA', boxX + 12, yMeta + 60)
    // Right (same line): PROVEEDOR
    const rightX = boxX + Math.floor(boxW / 2) + 12
    doc.text('PROVEEDOR', rightX, yMeta + 60)
    doc.setTextColor(0, 0, 0)
    doc.setFontSize(10)
    // Values
    doc.text(order.agency || '—', boxX + 12, yMeta + 76)
    doc.text(order.provider || '—', rightX, yMeta + 76)

    // service box - same light background
    doc.setFillColor(248, 250, 252)
    doc.rect(margin, yMeta + 105, pageWidth - margin * 2, 50, 'F')
    doc.setTextColor(79, 70, 229)
    doc.setFontSize(9)
    doc.text('SERVICIO', margin + 12, yMeta + 120)
    doc.setTextColor(0, 0, 0)
    doc.setFontSize(10)
    doc.text(order.service || '—', margin + 12, yMeta + 136)

    // Date/Time
    // date/time boxes
    doc.setFillColor(248, 250, 252)
    doc.rect(margin, yMeta + 170, 246, 50, 'F')
    doc.setFillColor(248, 250, 252)
    doc.rect(margin + 264, yMeta + 170, 246, 50, 'F')
    doc.setTextColor(79, 70, 229)
    doc.setFontSize(9)
    doc.text('FECHA', margin + 12, yMeta + 188)
    doc.text('HORA', margin + 280, yMeta + 188)
    doc.setTextColor(0, 0, 0)
    doc.setFontSize(10)
    doc.text(order.date || '—', margin + 12, yMeta + 206)
    doc.text(order.time || '—', margin + 280, yMeta + 206)

    // Hotel
    // hotel box
    doc.setFillColor(248, 250, 252)
    doc.rect(margin, yMeta + 236, pageWidth - margin * 2, 50, 'F')
    doc.setTextColor(79, 70, 229)
    doc.setFontSize(9)
    doc.text('HOTEL', margin + 12, yMeta + 252)
    doc.setTextColor(0, 0, 0)
    doc.setFontSize(10)
    doc.text(order.hotel || '—', margin + 12, yMeta + 268)

    // Passengers/Room
    // passengers and room boxes
    doc.setFillColor(248, 250, 252)
    doc.rect(margin, yMeta + 302, 246, 50, 'F')
    doc.setFillColor(248, 250, 252)
    doc.rect(margin + 264, yMeta + 302, 246, 50, 'F')
    doc.setTextColor(79, 70, 229)
    doc.setFontSize(9)
    doc.text('PASAJEROS', margin + 12, yMeta + 318)
    doc.text('HABITACIÓN', margin + 280, yMeta + 318)
    doc.setTextColor(0, 0, 0)
    doc.setFontSize(10)
    doc.text(String(order.passengers || 0), margin + 12, yMeta + 336)
    doc.text(order.room || '—', margin + 280, yMeta + 336)

    // Flight
    // flight box
    doc.setFillColor(248, 250, 252)
    doc.rect(margin, yMeta + 370, pageWidth - margin * 2, 40, 'F')
    doc.setTextColor(79, 70, 229)
    doc.setFontSize(9)
    doc.text('VUELO', margin + 12, yMeta + 386)
    doc.setTextColor(0, 0, 0)
    doc.setFontSize(10)
    doc.text(order.flight || '—', margin + 12, yMeta + 402)

    // Notes header
    // keep notes header with dark background
    doc.setFillColor(49, 46, 129)
    doc.rect(margin, yMeta + 430, pageWidth - margin * 2, 28, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(10)
    doc.text('NOTAS IMPORTANTES', margin + 12, yMeta + 449)

    doc.setTextColor(0, 0, 0)
    doc.setFontSize(9)
    const defaultNotes = '• Salidas: llegar 10 minutos antes\n• Llegadas: monitorear vuelo\n• Rescates: Dar tiempo estimado\n• No show: Todos se pagan como local 400 mxn'
    const notes = order.notes ? `${order.notes}\n\n${defaultNotes}` : defaultNotes
    const splitNotes = doc.splitTextToSize(notes, pageWidth - margin * 2)
    doc.text(splitNotes, margin + 12, yMeta + 470)

    doc.setLineWidth(0.78)
    doc.line(margin, 740, pageWidth - margin, 740)

    doc.setFontSize(8)
    // readable gray for footer text
    doc.setTextColor(107, 114, 128)
    doc.text('Este documento es una orden de servicio generada electrónicamente', pageWidth / 2, 760, { align: 'center' })

    doc.save(`orden_${order.id}.pdf`)
  }

  // Try to load and draw the logo image centered at the top; fall back to centered text if it fails
  const img = new Image()
  img.crossOrigin = 'anonymous'
  img.src = unionLogo as string
  img.onload = () => {
    // fixed size 64x64 for the logo
    const imgW = 64
    const imgH = 64
    const x = (pageWidth - imgW) / 2
    const y = 18
    try {
      doc.addImage(img, 'PNG', x, y, imgW, imgH)
    } catch {
      // if addImage fails, ignore and fallback to text below
    }

    // company name (if present) below the logo
    let headerBottom = y + imgH + 22
    if (companyInfo?.razonSocial) {
      const companyTextY = y + imgH + 12
      doc.setFont('helvetica')
      doc.setFontSize(11)
      doc.setTextColor(17, 24, 39)
      doc.text(companyInfo.razonSocial, pageWidth / 2, companyTextY, { align: 'center' })
      // leave 20px margin under the razon social
      headerBottom = companyTextY + 20
    }

    renderBody(headerBottom)
  }
  img.onerror = () => {
    // fallback to centered text if image can't be loaded
    doc.setFont('helvetica')
    doc.setFontSize(12)
    doc.setTextColor(17, 24, 39)
    // fallback text occupies about 30pt; place body below it
    const fallbackY = 46
    doc.text('La union de transportistas', pageWidth / 2, fallbackY, { align: 'center' })
    let headerBottom = fallbackY + 20
    if (companyInfo?.razonSocial) {
      const companyTextY = fallbackY + 18
      doc.setFontSize(11)
      doc.setTextColor(17, 24, 39)
      doc.text(companyInfo.razonSocial, pageWidth / 2, companyTextY, { align: 'center' })
      // leave 20px margin under the razon social
      headerBottom = companyTextY + 20
    }

    renderBody(headerBottom)
  }
}
