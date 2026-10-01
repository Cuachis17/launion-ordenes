/**
 * @fileoverview Helpers reutilizables para el dibujado de bloques y cajas en PDFs.
 * Centraliza calculo de dimensiones y renderizado de celdas para cumplir limite de lineas.
 */

import type { jsPDF } from 'jspdf'
import { textoSeguro, textoEnCaja } from './pdfTexto'
import type { CompanyInfo } from '../types'

/**
 * Calcula la altura vertical requerida por un texto envuelto a 10pt.
 * Ajusta la fuente a 10pt para asegurar consistencia con splitTextToSize.
 */
export function altoTexto(doc: jsPDF, val: unknown, ancho: number): number {
  doc.setFontSize(10)
  return Math.max(doc.splitTextToSize(textoSeguro(val || '—'), ancho).length, 1) * 13
}

/**
 * Renderiza la caja de Titulo de Reserva y Proveedor dividida en dos columnas seguras.
 */
export function renderCajaReservaProveedor(
  doc: jsPDF,
  x: number,
  y: number,
  w: number,
  agencia: unknown,
  proveedor: unknown,
): number {
  const mitadW = Math.floor(w / 2)
  const h1 = altoTexto(doc, agencia, mitadW - 24)
  const h2 = altoTexto(doc, proveedor, w - mitadW - 24)
  const hBox = Math.max(50, 37 + Math.max(h1, h2))
  doc.setFillColor(248, 250, 252)
  doc.rect(x, y, w, hBox, 'F')
  doc.setTextColor(79, 70, 229)
  doc.setFontSize(9)
  doc.text('TÍTULO DE RESERVA', x + 12, y + 15)
  doc.text('PROVEEDOR', x + mitadW + 12, y + 15)
  doc.setTextColor(0, 0, 0)
  doc.setFontSize(10)
  textoEnCaja(doc, agencia || '—', x + 12, y + 31, mitadW - 24)
  textoEnCaja(doc, proveedor || '—', x + mitadW + 12, y + 31, w - mitadW - 24)
  return hBox
}

/**
 * Renderiza una caja de ancho completo con etiqueta indigo y texto envuelto.
 */
export function renderCaja(
  doc: jsPDF,
  x: number,
  y: number,
  w: number,
  label: string,
  val: unknown,
  hMin = 50,
  yOff = 37,
  dyLabel = 15,
  dyVal = 31,
): number {
  const hBox = Math.max(hMin, yOff + altoTexto(doc, val, w - 24))
  doc.setFillColor(248, 250, 252)
  doc.rect(x, y, w, hBox, 'F')
  doc.setTextColor(79, 70, 229)
  doc.setFontSize(9)
  doc.text(label, x + 12, y + dyLabel)
  doc.setTextColor(0, 0, 0)
  doc.setFontSize(10)
  textoEnCaja(doc, val || '—', x + 12, y + dyVal, w - 24)
  return hBox
}

/**
 * Renderiza dos cajas contiguas coordinando su altura segun el contenido mas largo.
 */
export function renderCajasDobles(
  doc: jsPDF,
  x: number,
  y: number,
  l1: string,
  v1: unknown,
  l2: string,
  v2: unknown,
  dyLabel: number,
  dyVal: number,
): number {
  const hBox = Math.max(50, 37 + Math.max(altoTexto(doc, v1, 222), altoTexto(doc, v2, 218)))
  doc.setFillColor(248, 250, 252)
  doc.rect(x, y, 246, hBox, 'F')
  doc.rect(x + 264, y, 246, hBox, 'F')
  doc.setTextColor(79, 70, 229)
  doc.setFontSize(9)
  doc.text(l1, x + 12, y + dyLabel)
  doc.text(l2, x + 280, y + dyLabel)
  doc.setTextColor(0, 0, 0)
  doc.setFontSize(10)
  textoEnCaja(doc, v1 || '—', x + 12, y + dyVal, 222)
  textoEnCaja(doc, v2 || '—', x + 280, y + dyVal, 218)
  return hBox
}

/**
 * Dibuja seccion de empresa y SICT en formato 2 retornando la coordenada inferior.
 */
export function renderEmpresaSictF2(
  doc: jsPDF,
  sec1Y: number,
  contentWidth: number,
  margin: number,
  companyInfo: CompanyInfo,
): number {
  const mitadW = (contentWidth / 2) - 15
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(100, 100, 100)
  doc.text('RAZÓN SOCIAL / DIRECCIÓN:', margin, sec1Y)
  doc.text('PERMISO SICT:', margin + mitadW + 30, sec1Y)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.setTextColor(30, 30, 30)
  const razon = [companyInfo?.razonSocial, companyInfo?.direccion].filter(Boolean).join(' / ')
  const hRazon = textoEnCaja(doc, razon || '—', margin, sec1Y + 14, mitadW, { maxLineas: 2 })
  const hSict = textoEnCaja(
    doc,
    companyInfo?.sict || '—',
    margin + mitadW + 30,
    sec1Y + 14,
    mitadW,
    { maxLineas: 2 },
  )

  const sec1Bot = sec1Y + 14 + Math.max(hRazon, hSict, 12)
  doc.setLineDashPattern([2, 2], 0)
  doc.line(margin, sec1Bot + 4, margin + mitadW, sec1Bot + 4)
  const pageWidth = doc.internal.pageSize.getWidth()
  doc.line(margin + mitadW + 30, sec1Bot + 4, pageWidth - margin, sec1Bot + 4)
  doc.setLineDashPattern([], 0)
  return sec1Bot
}
