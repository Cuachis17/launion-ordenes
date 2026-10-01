/**
 * @fileoverview Generador de orden de servicio PDF (Formato 1 con flujo elastico).
 * Previene el encimado de campos y desbordamiento horizontal dividiendo en columnas seguras
 * y acumulando la coordenada vertical conforme el contenido dinamico crece.
 */

import { jsPDF } from 'jspdf'
import unionLogo from '../assets/union.png'
import type { Order, CompanyInfo } from '../types'
import { textoSeguro, cargarImagenPdf } from './pdfTexto'
import {
  renderCajaReservaProveedor,
  renderCaja,
  renderCajasDobles,
} from './pdfBloques'
import { renderNotasConPaginacion } from './pdfNotas'

interface UsuarioConAvatar {
  id?: string | number
  avatar?: string | boolean | null
}

export async function downloadOrderPdf(
  order: Order,
  companyInfo: CompanyInfo,
  user?: unknown,
): Promise<void> {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' })
  const margin = 40
  const pageWidth = doc.internal.pageSize.getWidth()
  const boxW = pageWidth - margin * 2
  const apiUrl = import.meta.env.VITE_API_URL ?? ''
  const u = user as UsuarioConAvatar | undefined

  const avatarUrl = (u?.id && u?.avatar) ? `${apiUrl}/api/users/${u.id}/avatar` : undefined
  // cargarImagenPdf normaliza a PNG: jsPDF no soporta WebP y rasterizaria a JPEG con fondo negro.
  const img = (await cargarImagenPdf(avatarUrl)) ?? (await cargarImagenPdf(unionLogo as string))

  doc.setFont('helvetica', 'normal')
  doc.setTextColor(17, 24, 39)
  if (img) {
    try {
      doc.addImage(img, 'PNG', (pageWidth - 64) / 2, 18, 64, 64)
    } catch {
      // Fallback silencioso si la imagen no se puede renderizar
    }
  } else {
    doc.setFontSize(12)
    doc.text('La union de transportistas', pageWidth / 2, 46, { align: 'center' })
  }
  let startY = img ? 104 : 66
  if (companyInfo?.razonSocial) {
    const textY = img ? 94 : 64
    doc.setFontSize(11)
    doc.text(textoSeguro(companyInfo.razonSocial), pageWidth / 2, textY, { align: 'center' })
    startY = textY + 20
  }

  doc.setFontSize(14)
  doc.setTextColor(0, 0, 0)
  doc.text('VOUCHER DE TRANSPORTACION', margin, startY)
  doc.setFontSize(12)
  doc.text('ORDEN DE SERVICIO', margin, startY + 20)
  doc.setFontSize(10)
  doc.text('BITACORA DE SERVICIOS', margin, startY + 40)
  doc.setLineWidth(1.4)
  doc.line(margin, startY + 62, pageWidth - margin, startY + 62)

  const yMeta = startY + 88
  doc.setFontSize(9)
  doc.text(`Generado: ${textoSeguro(order.generatedAt)}`, margin, yMeta)
  doc.text(`No. Orden: ${textoSeguro(order.id.toUpperCase())}`, margin, yMeta + 15)
  doc.setLineWidth(0.85)
  doc.line(margin, yMeta + 35, pageWidth - margin, yMeta + 35)

  let curY = yMeta + 45
  // Cajas de orden con altura elastica y recorrido vertical acumulado
  curY += renderCajaReservaProveedor(doc, margin, curY, boxW, order.agency, order.provider) + 10
  curY += renderCaja(doc, margin, curY, boxW, 'SERVICIO', order.service) + 15
  curY += renderCajasDobles(doc, margin, curY, 'FECHA', order.date, 'HORA', order.time, 18, 36) + 16
  curY += renderCaja(doc, margin, curY, boxW, 'HOTEL', order.hotel, 50, 37, 16, 32) + 16
  const paxStr = String(order.passengers || 0)
  curY += renderCajasDobles(
    doc, margin, curY, 'PASAJEROS', paxStr, 'HABITACIÓN', order.room, 16, 34,
  ) + 18
  curY += renderCaja(doc, margin, curY, boxW, 'VUELO', order.flight, 40, 27, 16, 32) + 20

  // Seccion de notas con paginacion si desborda y pie al final del documento
  const defNotes = '• Salidas: llegar 10 minutos antes\n• Llegadas: monitorear vuelo'
    + '\n• Rescates: Dar tiempo estimado\n• No show: Todos se pagan como local 400 mxn'
  const notes = order.notes ? `${order.notes}\n\n${defNotes}` : defNotes
  renderNotasConPaginacion(doc, curY, boxW, margin, notes, 'formato1')

  doc.save(`orden_${order.id}.pdf`)
}
