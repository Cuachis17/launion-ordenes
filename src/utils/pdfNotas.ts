/**
 * @fileoverview Helpers para notas paginadas y pies de pagina de ordenes de servicio.
 * Permite separar notas largas en nueva pagina y colocar el pie en la ultima hoja.
 */

import type { jsPDF } from 'jspdf'
import { textoSeguro, textoEnCaja } from './pdfTexto'
import type { CompanyInfo } from '../types'

/**
 * Renderiza el bloque de notas con salto de pagina si el contenido excede el espacio disponible.
 */
export function renderNotasConPaginacion(
  doc: jsPDF,
  startY: number,
  contentWidth: number,
  margin: number,
  notes: string,
  estilo: 'formato1' | 'formato2',
  companyInfo?: CompanyInfo,
): void {
  const anchoNotas = estilo === 'formato1' ? contentWidth - 24 : contentWidth - 40
  const padX = estilo === 'formato1' ? 12 : 20
  const lineasTotales: string[] = doc.splitTextToSize(textoSeguro(notes), anchoNotas)
  const maxEspacioP1 = 730 - startY - 45 - 20
  const lineasP1 = Math.floor(maxEspacioP1 / 12)

  if (lineasTotales.length <= Math.max(lineasP1, 2)) {
    renderCajaNotas(doc, startY, contentWidth, margin, notes, padX, anchoNotas, estilo, false)
    const nBoxH = Math.max(80, 36 + lineasTotales.length * 12 + 10)
    const footY = Math.max(740, startY + nBoxH + 20)
    if (estilo === 'formato1') {
      dibujarPieOrdenFormato1(doc, footY)
    } else {
      dibujarPieOrdenFormato2(doc, footY, companyInfo!)
    }
  } else {
    const lim = Math.max(lineasP1, 2)
    const chunk1 = lineasTotales.slice(0, lim).join('\n')
    const chunk2 = lineasTotales.slice(lim).join('\n')
    renderCajaNotas(doc, startY, contentWidth, margin, chunk1, padX, anchoNotas, estilo, false)

    doc.addPage()
    const p2Y = margin + 20
    const lineasRest = doc.splitTextToSize(chunk2, anchoNotas).length
    const nBoxH2 = Math.max(80, 36 + lineasRest * 12 + 10)
    renderCajaNotas(doc, p2Y, contentWidth, margin, chunk2, padX, anchoNotas, estilo, true)
    const footY = Math.max(740, p2Y + nBoxH2 + 20)
    if (estilo === 'formato1') {
      dibujarPieOrdenFormato1(doc, footY)
    } else {
      dibujarPieOrdenFormato2(doc, footY, companyInfo!)
    }
  }
}

function renderCajaNotas(
  doc: jsPDF,
  y: number,
  w: number,
  m: number,
  txt: string,
  padX: number,
  anchoTxt: number,
  estilo: 'formato1' | 'formato2',
  esContinuacion: boolean,
): void {
  const lineas = doc.splitTextToSize(txt, anchoTxt).length
  const tit = esContinuacion ? 'NOTAS IMPORTANTES (continuación)' : 'NOTAS IMPORTANTES'

  if (estilo === 'formato1') {
    const nBoxH = Math.max(50, 28 + 12 + lineas * 12 + 6)
    doc.setFillColor(248, 250, 252)
    doc.rect(m, y, w, nBoxH, 'F')
    doc.setFillColor(49, 46, 129)
    doc.rect(m, y, w, 28, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(10)
    doc.text(tit, m + padX, y + 19)
    doc.setTextColor(0, 0, 0)
    doc.setFontSize(9)
    textoEnCaja(doc, txt, m + padX, y + 40, anchoTxt, { interlineado: 12 })
  } else {
    const nBoxH = Math.max(80, 36 + lineas * 12 + 10)
    doc.setDrawColor(240, 230, 190)
    doc.setFillColor(255, 253, 240)
    doc.roundedRect(m, y, w, nBoxH, 6, 6, 'FD')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.setTextColor(110, 60, 10)
    doc.text(tit, m + padX, y + 22)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(60, 60, 60)
    textoEnCaja(doc, txt, m + padX, y + 38, anchoTxt, { interlineado: 12 })
  }
}

/**
 * Dibuja el pie de pagina estandar para ordenes de servicio formato 1.
 */
export function dibujarPieOrdenFormato1(doc: jsPDF, y: number): void {
  const margin = 40
  const pageWidth = doc.internal.pageSize.getWidth()
  doc.setLineWidth(0.78)
  doc.setDrawColor(0, 0, 0)
  doc.line(margin, y, pageWidth - margin, y)
  doc.setFontSize(8)
  doc.setTextColor(107, 114, 128)
  doc.text(
    'Este documento es una orden de servicio generada electrónicamente',
    pageWidth / 2,
    y + 20,
    { align: 'center' },
  )
}

/**
 * Dibuja el pie de pagina con linea y telefono de cobranza para ordenes formato 2.
 */
export function dibujarPieOrdenFormato2(
  doc: jsPDF,
  y: number,
  companyInfo: CompanyInfo,
): void {
  const margin = 40
  const pageWidth = doc.internal.pageSize.getWidth()
  doc.setDrawColor(20, 30, 60)
  doc.setLineWidth(1.5)
  doc.line(margin, y, pageWidth - margin, y)
  doc.setFont('helvetica', 'italic')
  doc.setFontSize(8)
  doc.setTextColor(120, 120, 120)
  const pie = 'Este documento es una orden de servicio generada electrónicamente.'
  doc.text(pie, margin, y + 18)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.setTextColor(50, 50, 50)
  doc.text('Teléfono de cobranza:', pageWidth - margin - 190, y + 18)
  doc.setFont('helvetica', 'normal')
  textoEnCaja(doc, companyInfo?.cobranza || '', pageWidth - margin - 85, y + 18, 85)
}
