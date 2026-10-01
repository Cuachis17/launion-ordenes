/**
 * @fileoverview Generador de orden de servicio formato 2 con distribucion elastica.
 * Evita desbordamiento y encimado en textos largos para proveedores, hoteles y notas.
 */

import { jsPDF } from 'jspdf'
import unionLogo from '../assets/union.png'
import type { Order, CompanyInfo } from '../types'
import { textoSeguro, textoEnCaja, cargarImagenPdf, ponerLogoPdf } from './pdfTexto'
import { renderEmpresaSictF2 } from './pdfBloques'
import { renderNotasConPaginacion } from './pdfNotas'

interface UsuarioConAvatar {
  id?: string | number
  avatar?: string | boolean | null
}

export async function downloadOrderPdfFormat2(
  order: Order,
  companyInfo: CompanyInfo,
  user?: unknown,
): Promise<void> {
  const u = user as UsuarioConAvatar | undefined
  const api = import.meta.env.VITE_API_URL ?? ''
  const avatarUrl = (u?.id && u?.avatar) ? `${api}/api/users/${u.id}/avatar` : undefined
  const [imgUser, imgUnion] = await Promise.all([
    cargarImagenPdf(avatarUrl),
    cargarImagenPdf(unionLogo as string),
  ])

  const doc = new jsPDF({ unit: 'pt', format: 'a4' })
  const margin = 40
  const pageWidth = doc.internal.pageSize.getWidth()
  const contentWidth = pageWidth - margin * 2
  const logoH = 50

  ponerLogoPdf(doc, imgUser, margin, margin - 10, logoH)
  if (imgUnion) {
    const unionW = (imgUnion.width * logoH) / imgUnion.height
    ponerLogoPdf(doc, imgUnion, pageWidth - margin - unionW, margin - 10, logoH)
  }

  doc.setDrawColor(20, 30, 60)
  doc.setLineWidth(1.5)
  doc.line(margin, margin + 55, pageWidth - margin, margin + 55)

  const titleY = margin + 70
  doc.setDrawColor(220, 220, 220)
  doc.setLineWidth(1)
  doc.roundedRect(margin, titleY, contentWidth, 30, 4, 4, 'S')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.setTextColor(80, 90, 110)
  const tit = 'VOUCHER DE TRANSPORTACIÓN   |   ORDEN DE SERVICIO   |   BITÁCORA DE SERVICIOS'
  doc.text(textoSeguro(tit), pageWidth / 2, titleY + 19, { align: 'center' })

  const sec1Y = titleY + 54
  const sec1Bot = renderEmpresaSictF2(doc, sec1Y, contentWidth, margin, companyInfo)

  const sec2Y = sec1Bot + 18
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.setTextColor(100, 100, 100)
  doc.text('NO. ORDEN', margin, sec2Y)
  doc.text('GENERADO', margin + 140, sec2Y)
  doc.text('TÍTULO DE RESERVA', margin + 280, sec2Y)

  // Fila NO. ORDEN / GENERADO / TÍTULO DE RESERVA: cada columna delimitada con textoEnCaja
  // para evitar solapamientos y la fila avanza segun la columna mas alta.
  const wOrden = 130
  const wGenerado = 130
  const wAgencia = pageWidth - margin - (margin + 280)

  doc.setFontSize(14)
  doc.setTextColor(220, 50, 50)
  const hOrden = textoEnCaja(doc, order.id.toUpperCase(), margin, sec2Y + 16, wOrden)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(30, 30, 30)
  const hGen = textoEnCaja(doc, order.generatedAt, margin + 140, sec2Y + 16, wGenerado)

  const hAgencia = textoEnCaja(
    doc,
    order.agency || '—',
    margin + 280,
    sec2Y + 16,
    wAgencia,
    { maxLineas: 4 },
  )
  const maxSec2 = Math.max(hOrden, hGen, hAgencia, 14)
  const sec2Bot = sec2Y + 16 + maxSec2

  const sBoxY = sec2Bot + 16
  const xs = [margin + 15, margin + 150, margin + 280, margin + 410]
  const ws = [125, 120, 120, pageWidth - margin - 15 - (margin + 410)]
  const t1 = ['PROVEEDOR', 'SERVICIO', 'FECHA', 'HORA']
  const v1 = [order.provider, order.service, order.date, order.time]
  const t2 = ['PASAJEROS', 'VUELO', 'HOTEL', 'HABITACIÓN']
  const v2 = [String(order.passengers || 0), order.flight, order.hotel, order.room]

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  // Cada celda permite hasta 6 lineas para no truncar datos operativos del chofer
  const altR1 = Math.max(
    ...v1.map((v, i) => {
      const lins = doc.splitTextToSize(textoSeguro(v || '—'), ws[i]).length
      return Math.min(6, lins) * 12
    }),
    14,
  )
  const altR2 = Math.max(
    ...v2.map((v, i) => {
      const lins = doc.splitTextToSize(textoSeguro(v || '—'), ws[i]).length
      return Math.min(6, lins) * 12
    }),
    14,
  )

  const r1TitY = sBoxY + 18
  const r1ValY = r1TitY + 14
  const r2TitY = r1ValY + altR1 + 10
  const r2ValY = r2TitY + 14
  const totalBoxH = (r2ValY + altR2 + 12) - sBoxY

  doc.setDrawColor(220, 220, 220)
  doc.setFillColor(252, 252, 252)
  doc.roundedRect(margin, sBoxY, contentWidth, totalBoxH, 6, 6, 'FD')

  for (let i = 0; i < 4; i++) {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.setTextColor(120, 120, 120)
    doc.text(t1[i], xs[i], r1TitY)
    doc.text(t2[i], xs[i], r2TitY)

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.setTextColor(40, 40, 40)
    textoEnCaja(doc, v1[i] || '—', xs[i], r1ValY, ws[i], { maxLineas: 6 })

    doc.setFont('helvetica', 'normal')
    textoEnCaja(doc, v2[i] || '—', xs[i], r2ValY, ws[i], { maxLineas: 6 })
  }

  // Seccion de notas con paginacion si desborda y pie al final del documento
  const defN = '• Salidas: llegar 10 minutos antes\n• Llegadas: monitorear vuelo'
    + '\n• Rescates: Dar tiempo estimado\n• No show: Todos se pagan como local 400 mxn'
  const notes = order.notes ? `${order.notes}\n\n${defN}` : defN
  const nBoxY = sBoxY + totalBoxH + 18
  renderNotasConPaginacion(doc, nBoxY, contentWidth, margin, notes, 'formato2', companyInfo)

  doc.save(`orden_${order.id}_formato2.pdf`)
}
