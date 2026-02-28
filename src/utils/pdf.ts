import { jsPDF } from 'jspdf'
import unionLogo from '../assets/union.png'
import type { Order, CompanyInfo } from '../types'

export async function downloadOrderPdf(order: Order, companyInfo: CompanyInfo, user?: any) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' })
  const margin = 40
  const pageWidth = doc.internal.pageSize.getWidth()
  const apiUrl = import.meta.env.VITE_API_URL

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

  if (user?.avatar) {
    img.src = `${apiUrl}/api/users/${user.id}/avatar`
  } else {
    img.src = unionLogo as string
  }
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



export async function downloadOrderPdfFormat2(order: Order, companyInfo: CompanyInfo, user?: any) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' })
  const margin = 40
  const pageWidth = doc.internal.pageSize.getWidth()
  const apiUrl = import.meta.env.VITE_API_URL

  // Helper that renders the rest of the PDF
  // ... (omitting unchanged code inside renderFormat2Body)

  function renderFormat2Body() {
    // Top dividing line (moved here to render after images)
    doc.setDrawColor(20, 30, 60)
    doc.setLineWidth(1.5)
    doc.line(margin, margin + 55, pageWidth - margin, margin + 55)

    // 2. Title Box
    const titleY = margin + 70
    doc.setDrawColor(220, 220, 220)
    doc.setLineWidth(1)
    doc.roundedRect(margin, titleY, pageWidth - margin * 2, 30, 4, 4, 'S')

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.setTextColor(80, 90, 110)
    doc.text('VOUCHER DE TRANSPORTACIÓN   |   ORDEN DE SERVICIO   |   BITÁCORA DE SERVICIOS', pageWidth / 2, titleY + 19, { align: 'center' })

    // 3. Razon Social / SICT section
    const section1Y = titleY + 60
    doc.setFontSize(9)
    doc.text('RAZÓN SOCIAL / DIRECCIÓN:', margin, section1Y)
    doc.text('PERMISO SICT:', pageWidth / 2, section1Y)

    doc.setFont('helvetica', 'bold')

    // Combine razonSocial and direccion if they exist
    const combinedRazonDireccion = [companyInfo.razonSocial, companyInfo.direccion]
      .filter(Boolean)
      .join(' / ') || '—'

    doc.text(combinedRazonDireccion, margin, section1Y + 14)
    doc.text(companyInfo.sict || '—', pageWidth / 2, section1Y + 14)

    doc.setFont('helvetica', 'normal')

    doc.setLineDashPattern([2, 2], 0)
    doc.line(margin, section1Y + 20, pageWidth / 2 - 20, section1Y + 20)
    doc.line(pageWidth / 2, section1Y + 20, pageWidth - margin, section1Y + 20)
    doc.setLineDashPattern([], 0) // Reset dash

    // 4. Order Meta section
    const section2Y = section1Y + 50

    // No. Orden
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.setTextColor(100, 100, 100)
    doc.text('NO. ORDEN', margin, section2Y)

    doc.setFontSize(14)
    doc.setTextColor(220, 50, 50) // Red order number
    doc.text(order.id.toUpperCase(), margin, section2Y + 15)

    // Generado
    doc.setFontSize(9)
    doc.setTextColor(100, 100, 100)
    doc.text('GENERADO', margin + 140, section2Y)

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.setTextColor(30, 30, 30)
    doc.text(order.generatedAt, margin + 140, section2Y + 15)

    // Título de reserva (Agencia)
    doc.setFontSize(9)
    doc.setTextColor(100, 100, 100)
    doc.text('TÍTULO DE RESERVA', margin + 280, section2Y)

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.setTextColor(30, 30, 30)
    doc.text(order.agency || '—', margin + 280, section2Y + 15)

    // 5. Main Service Box
    const serviceBoxY = section2Y + 40
    doc.setDrawColor(220, 220, 220)
    doc.setFillColor(252, 252, 252)
    doc.roundedRect(margin, serviceBoxY, pageWidth - margin * 2, 90, 6, 6, 'FD')

    const col1X = margin + 15
    const col2X = margin + 150
    const col3X = margin + 280
    const col4X = margin + 410

    const row1TitleY = serviceBoxY + 20
    const row1ValueY = serviceBoxY + 36
    const row2TitleY = serviceBoxY + 60
    const row2ValueY = serviceBoxY + 76

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.setTextColor(120, 120, 120)

    // Row 1 Titles
    doc.text('PROVEEDOR', col1X, row1TitleY)
    doc.text('SERVICIO', col2X, row1TitleY)
    doc.text('FECHA', col3X, row1TitleY)
    doc.text('HORA', col4X, row1TitleY)

    // Row 2 Titles
    doc.text('PASAJEROS', col1X, row2TitleY)
    doc.text('VUELO', col2X, row2TitleY)
    doc.text('HOTEL', col3X, row2TitleY)
    doc.text('HABITACIÓN', col4X, row2TitleY)

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.setTextColor(40, 40, 40)

    // Row 1 Values
    doc.text(order.provider || '—', col1X, row1ValueY)
    doc.text(order.service || '—', col2X, row1ValueY)
    doc.text(order.date || '—', col3X, row1ValueY)
    doc.text(order.time || '—', col4X, row1ValueY)

    // Row 2 Values
    doc.setFont('helvetica', 'normal') // making these slightly lighter like the image
    doc.text(String(order.passengers || 0), col1X, row2ValueY)
    doc.text(order.flight || '—', col2X, row2ValueY)
    doc.text(order.hotel || '—', col3X, row2ValueY)
    doc.text(order.room || '—', col4X, row2ValueY)

    // 6. Notes Box
    const notesBoxY = serviceBoxY + 110
    doc.setDrawColor(240, 230, 190)
    doc.setFillColor(255, 253, 240) // Light yellow
    doc.roundedRect(margin, notesBoxY, pageWidth - margin * 2, 110, 6, 6, 'FD')

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.setTextColor(110, 60, 10) // Brownish
    doc.text('NOTAS IMPORTANTES', margin + 25, notesBoxY + 25)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(60, 60, 60)

    const defaultNotes = '• Salidas: llegar 10 minutos antes\n• Llegadas: monitorear vuelo\n• Rescates: Dar tiempo estimado\n• No show: Todos se pagan como local 400 mxn'
    const notes = order.notes ? `${order.notes}\n\n${defaultNotes}` : defaultNotes

    const splitNotes = doc.splitTextToSize(notes, pageWidth - margin * 2 - 40)
    doc.text(splitNotes, margin + 25, notesBoxY + 45)

    // 7. Footer
    const footerY = 740
    doc.setDrawColor(20, 30, 60)
    doc.setLineWidth(1.5)
    doc.line(margin, footerY, pageWidth - margin, footerY)

    doc.setFont('helvetica', 'italic')
    doc.setFontSize(8)
    doc.setTextColor(120, 120, 120)
    doc.text('Este documento es una orden de servicio generada', margin, footerY + 20)
    doc.text('electrónicamente.', margin, footerY + 30)

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.setTextColor(50, 50, 50)
    doc.text('Teléfono de', margin + 320, footerY + 20)
    doc.text('cobranza:', margin + 320, footerY + 32)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.text(companyInfo.cobranza || '', margin + 390, footerY + 28)

    doc.setDrawColor(180, 180, 180)
    doc.setLineWidth(1)
    doc.line(margin + 390, footerY + 30, pageWidth - margin, footerY + 30) // underline for phone

    doc.save(`orden_${order.id}_formato2.pdf`)
  }

  // Handle Image Loading
  const imgUserLogo = new Image()
  imgUserLogo.crossOrigin = 'anonymous'

  // Use user avatar if available, otherwise static logo
  if (user?.avatar) {
    imgUserLogo.src = `${apiUrl}/api/users/${user.id}/avatar`
  } else {
    // Skip loading and just mark as "done" to leave space blank
    setTimeout(() => checkImagesLoaded(), 0)
  }

  const imgUnion = new Image()
  imgUnion.crossOrigin = 'anonymous'
  imgUnion.src = unionLogo as string

  let loadedImages = 0
  const checkImagesLoaded = () => {
    loadedImages++
    if (loadedImages === 2) {
      renderFormat2Body()
    }
  }

  // Define a fixed height for BOTH logos
  const fixedLogoHeight = 50

  // Render left logo (User/Servans)
  imgUserLogo.onload = () => {
    try {
      // Calculate width proportionally to the fixed height
      const imgW = (imgUserLogo.width * fixedLogoHeight) / imgUserLogo.height
      const yOffset = margin - 10
      doc.addImage(imgUserLogo, 'PNG', margin, yOffset, imgW, fixedLogoHeight)
    } catch {
      // No fallback text or box, leave blank
    }
    checkImagesLoaded()
  }
  imgUserLogo.onerror = () => {
    // No fallback text or box, leave blank
    checkImagesLoaded()
  }

  // Render right logo (Union)
  imgUnion.onload = () => {
    try {
      // Calculate width proportionally to the fixed height
      const imgW = (imgUnion.width * fixedLogoHeight) / imgUnion.height
      const yOffset = margin - 10
      // Right align using calculated width
      doc.addImage(imgUnion, 'PNG', pageWidth - margin - imgW, yOffset, imgW, fixedLogoHeight)
    } catch {
      // Fallback
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(16)
      doc.setTextColor(20, 30, 60)
      doc.text('UNION', pageWidth - margin, margin + 15, { align: 'right' })
      doc.setFontSize(12)
      doc.text('TTL Q.ROO', pageWidth - margin, margin + 30, { align: 'right' })
      doc.setFont('helvetica', 'italic')
      doc.setFontSize(9)
      doc.setTextColor(100, 100, 100)
      doc.text('Driving tourism with excellence', pageWidth - margin, margin + 45, { align: 'right' })
    }
    checkImagesLoaded()
  }
  imgUnion.onerror = () => {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(16)
    doc.setTextColor(20, 30, 60)
    doc.text('UNION', pageWidth - margin, margin + 15, { align: 'right' })
    doc.setFontSize(12)
    doc.text('TTL Q.ROO', pageWidth - margin, margin + 30, { align: 'right' })
    doc.setFont('helvetica', 'italic')
    doc.setFontSize(9)
    doc.setTextColor(100, 100, 100)
    doc.text('Driving tourism with excellence', pageWidth - margin, margin + 45, { align: 'right' })
    checkImagesLoaded()
  }
}
