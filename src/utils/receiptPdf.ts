/**
 * @fileoverview Generador de comprobante de venta PDF para el pasajero.
 * Calcula avances dinamicos de coordenadas segun la altura real de cada bloque,
 * delimitando razones sociales y textos largos para evitar encimados y cortes.
 */

import { jsPDF } from 'jspdf'
import type { Receipt, CompanyInfo } from '../types'
import { pendingAmount, etiquetaServicio, requiereVuelo } from '../types'
import { formatMoney } from './receiptStorage'
import { textoSeguro, textoEnCaja } from './pdfTexto'
import { dibujarEncabezado, dibujarPie } from './receiptPdfPartes'
import { logoDelUsuario } from './receiptPdfLogo'

function construirPdf(receipt: Receipt, companyInfo: CompanyInfo, logoUsuario: string | null) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' })
  const margen = 40
  const ancho = doc.internal.pageSize.getWidth()
  const util = ancho - margen * 2
  const saldo = pendingAmount(receipt)

  const linea = (yPos: number, grosor = 0.8) => {
    doc.setLineWidth(grosor)
    doc.setDrawColor(203, 213, 225)
    doc.line(margen, yPos, ancho - margen, yPos)
  }
  const gris = (n: number) => doc.setTextColor(n, n, n)

  const contexto = { doc, receipt, companyInfo, logoUsuario, margen, ancho, util, gris, linea }
  dibujarEncabezado(contexto)

  // Datos principales: el avance de y es dinamico segun la altura devuelta por textoEnCaja.
  let y = 146
  const bloque = (rotulo: string, valor: string, tam = 15) => {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    gris(130)
    doc.text(textoSeguro(rotulo.toUpperCase()), margen, y)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(tam)
    gris(17)
    const alt = textoEnCaja(doc, valor || '—', margen, y + 18, util, {
      interlineado: Math.round(tam * 1.25),
    })
    y += 18 + alt + 12
  }

  bloque('Pasajero', `${receipt.passenger}   ·   ${receipt.pax} pax`, 16)

  const [aa, mm, dd] = String(receipt.date).split('-')
  const fecha = dd && mm && aa ? `${dd}/${mm}/${aa}` : receipt.date
  bloque('Fecha y hora de recogida', `${fecha}   ·   ${receipt.time} hrs`, 18)

  bloque('Se recoge en', receipt.pickup, 13)
  bloque('Destino', receipt.dropoff, 13)
  if (requiereVuelo(receipt.service) && receipt.flight) {
    bloque('Número de vuelo', receipt.flight.toUpperCase(), 15)
  }

  // Cobro
  linea(y - 8)
  y += 14

  doc.setFillColor(248, 250, 252)
  doc.roundedRect(margen, y, util, 92, 6, 6, 'F')

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  gris(110)
  doc.text('Total del servicio', margen + 16, y + 24)
  doc.text('Anticipo pagado', margen + 16, y + 46)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  gris(17)
  doc.text(formatMoney(receipt.total, receipt.currency), margen + util / 2 - 16, y + 24, {
    align: 'right',
  })
  doc.setTextColor(4, 120, 87)
  doc.text(formatMoney(receipt.paid, receipt.currency), margen + util / 2 - 16, y + 46, {
    align: 'right',
  })

  // El saldo es lo que el pasajero busca primero: caja aparte y el numero mayor.
  const xCaja = margen + util / 2
  if (saldo > 0) {
    doc.setFillColor(254, 243, 199)
  } else {
    doc.setFillColor(209, 250, 229)
  }
  doc.roundedRect(xCaja, y + 8, util / 2 - 8, 76, 6, 6, 'F')

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  if (saldo > 0) {
    doc.setTextColor(146, 64, 14)
  } else {
    doc.setTextColor(6, 95, 70)
  }
  doc.text(saldo > 0 ? 'SALDO A PAGAR AL ABORDAR' : 'PAGADO COMPLETO', xCaja + 16, y + 32)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(saldo > 0 ? 21 : 17)
  doc.text(saldo > 0 ? formatMoney(saldo, receipt.currency) : 'NADA POR PAGAR', xCaja + 16, y + 62)
  if (saldo > 0) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.text(receipt.currency, xCaja + util / 2 - 24, y + 62, { align: 'right' })
  }

  y += 116

  dibujarPie(contexto, y)

  return doc
}

function nombreArchivo(receipt: Receipt): string {
  const orden = (receipt.voucher || receipt.id.slice(0, 8)).replace(/[^\w-]/g, '')
  return `comprobante-${orden}.pdf`
}

function textoParaCompartir(receipt: Receipt): { title: string; text: string } {
  const [a, m, d] = String(receipt.date).split('-')
  const fecha = d && m && a ? `${d}/${m}/${a}` : receipt.date
  const tipo = etiquetaServicio(receipt)
  return {
    title: textoSeguro(`Comprobante ${receipt.voucher}`),
    text: textoSeguro(
      `Comprobante ${receipt.voucher} · ${tipo}\n${receipt.passenger} · ${receipt.pax} pax\n`
      + `${fecha} a las ${receipt.time} hrs\n${receipt.pickup} → ${receipt.dropoff}`,
    ),
  }
}

export async function downloadReceiptPdf(
  receipt: Receipt,
  companyInfo: CompanyInfo,
  user?: unknown,
) {
  const logo = await logoDelUsuario(user)
  construirPdf(receipt, companyInfo, logo).save(nombreArchivo(receipt))
}

export async function shareReceiptPdf(
  receipt: Receipt,
  companyInfo: CompanyInfo,
  user?: unknown,
): Promise<'compartido' | 'descargado' | 'cancelado'> {
  const logo = await logoDelUsuario(user)
  const doc = construirPdf(receipt, companyInfo, logo)
  const nombre = nombreArchivo(receipt)
  const blob = doc.output('blob') as Blob
  const archivo = new File([blob], nombre, { type: 'application/pdf' })
  const { title, text } = textoParaCompartir(receipt)

  const puedeCompartir =
    typeof navigator !== 'undefined' &&
    typeof navigator.share === 'function' &&
    typeof navigator.canShare === 'function' &&
    navigator.canShare({ files: [archivo] })

  if (puedeCompartir) {
    try {
      await navigator.share({ files: [archivo], title, text })
      return 'compartido'
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') {
        return 'cancelado'
      }
    }
  }

  doc.save(nombre)
  return 'descargado'
}
