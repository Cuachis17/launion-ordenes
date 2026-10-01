/**
 * @fileoverview Renderizado de encabezado y pie elastico para comprobante PDF.
 * Delimita razon social segun ancho dinamico del voucher y pie con datos de empresa.
 */
import type { jsPDF } from 'jspdf'
import unionLogo from '../assets/union.png'
import type { Receipt, CompanyInfo } from '../types'
import { etiquetaServicio } from '../types'
import { textoSeguro, textoEnCaja } from './pdfTexto'

interface ContextoPdf {
  doc: jsPDF
  receipt: Receipt
  companyInfo: CompanyInfo
  logoUsuario: string | null
  margen: number
  ancho: number
  util: number
  gris: (n: number) => void
  linea: (yPos: number, grosor?: number) => void
}

export function dibujarEncabezado(ctx: ContextoPdf): void {
  const { doc, receipt, companyInfo, logoUsuario, margen, ancho, gris, linea } = ctx
  const esLlegada = receipt.service === 'llegada'
  // Encabezado
  try {
    doc.addImage(logoUsuario ?? unionLogo, 'PNG', margen, 30, 54, 54)
  } catch {
    try {
      doc.addImage(unionLogo, 'PNG', margen, 30, 54, 54)
    } catch {
      // omite fallo de logo
    }
  }

  // Voucher grande a la derecha: se calcula fuente y posicion para no montar el bloque izquierdo.
  const textoVoucher = textoSeguro(receipt.voucher.toUpperCase())
  let tamVoucher = 26
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(tamVoucher)
  const maxAnchoVoucher = ctx.util * 0.45
  while (tamVoucher > 12 && doc.getTextWidth(textoVoucher) > maxAnchoVoucher) {
    tamVoucher -= 1
    doc.setFontSize(tamVoucher)
  }
  const anchoVoucherReal = doc.getTextWidth(textoVoucher)
  const xVoucher = ancho - margen - anchoVoucherReal
  const anchoEncabezado = Math.max(50, xVoucher - 12 - (margen + 66))

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(13)
  gris(17)
  textoEnCaja(doc, companyInfo?.razonSocial || 'La Union', margen + 66, 52, anchoEncabezado, {
    maxLineas: 1,
  })

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  gris(110)
  if (companyInfo?.direccion) {
    textoEnCaja(doc, String(companyInfo.direccion), margen + 66, 65, anchoEncabezado, {
      maxLineas: 1,
    })
  }
  if (companyInfo?.sict) {
    textoEnCaja(doc, `SICT: ${companyInfo.sict}`, margen + 66, 76, anchoEncabezado, {
      maxLineas: 1,
    })
  }

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  gris(90)
  doc.text('COMPROBANTE DE VENTA', ancho - margen, 52, { align: 'right' })

  // Voucher grande y pildora de tipo de servicio: lo que identifica el papel.
  doc.setFontSize(tamVoucher)
  gris(17)
  doc.text(textoVoucher, ancho - margen, 76, { align: 'right' })

  const etiqueta = textoSeguro(etiquetaServicio(receipt).toUpperCase())
  doc.setFontSize(9)
  // Un servicio libre puede ser largo: la píldora debe permanecer dentro de los márgenes.
  const anchoPill = Math.min(doc.getTextWidth(etiqueta) + 22, ancho - margen * 2)
  if (esLlegada) {
    doc.setFillColor(224, 231, 255)
  } else if (receipt.service === 'hotel') {
    doc.setFillColor(220, 252, 231)
  } else {
    doc.setFillColor(226, 232, 240)
  }
  doc.roundedRect(ancho - margen - anchoPill, 84, anchoPill, 18, 9, 9, 'F')
  if (esLlegada) {
    doc.setTextColor(67, 56, 202)
  } else if (receipt.service === 'hotel') {
    doc.setTextColor(21, 128, 61)
  } else {
    doc.setTextColor(51, 65, 85)
  }
  textoEnCaja(doc, etiqueta, ancho - margen - anchoPill / 2, 96, anchoPill - 22, {
    maxLineas: 1,
    align: 'center',
  })

  linea(116, 1.4)

}

export function dibujarPie(ctx: ContextoPdf, yInicial: number): void {
  const { doc, receipt, companyInfo, logoUsuario, margen, ancho, util, gris, linea } = ctx
  let y = yInicial
  // Letra chica
  linea(y)
  y += 16
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.5)
  gris(140)
  const notas = [
    'Preséntese en el punto de recogida 10 minutos antes de la hora indicada.'
      + ' La tolerancia de espera es de 15 minutos.',
    'El saldo pendiente, si lo hubiera, se liquida directamente con el operador'
      + ' al abordar la unidad.',
    'Conserve este comprobante durante todo el traslado.'
      + ' Es el documento que ampara su servicio.',
    companyInfo?.cobranza ? `Contacto de cobranza: ${companyInfo.cobranza}` : '',
  ].filter(Boolean)
  for (const nota of notas) {
    const altNota = textoEnCaja(doc, nota, margen, y, util, { interlineado: 10 })
    y += altNota + 3
  }

  y += 4
  doc.setFontSize(7)
  gris(165)
  const folio = receipt.id.slice(0, 8).toUpperCase()
  const fechaStr = new Date(receipt.generatedAt).toLocaleString('es-MX')
  const emitido = `Emitido: ${fechaStr}   ·   Folio interno: ${folio}`
  textoEnCaja(doc, emitido, margen, y, util, { maxLineas: 1 })

  // Banda al pie de pagina
  const alto = doc.internal.pageSize.getHeight()
  doc.setFillColor(248, 250, 252)
  doc.rect(0, alto - 54, ancho, 54, 'F')
  doc.setDrawColor(226, 232, 240)
  doc.setLineWidth(0.8)
  doc.line(0, alto - 54, ancho, alto - 54)

  const anchoPieIzq = (ancho / 2) - margen - 20
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  gris(60)
  textoEnCaja(doc, companyInfo?.razonSocial || 'La Union', margen, alto - 32, anchoPieIzq, {
    maxLineas: 1,
  })
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  gris(140)
  doc.text('Gracias por viajar con nosotros. Buen viaje.', margen, alto - 19)

  if (logoUsuario) {
    try {
      doc.addImage(unionLogo, 'PNG', ancho / 2 - 14, alto - 44, 28, 28)
      doc.setFontSize(6)
      gris(165)
      doc.text('Operado por La Unión', ancho / 2, alto - 12, { align: 'center' })
    } catch {
      // sello opcional
    }
  }
  doc.setFontSize(8)
  const voucherTxt = textoSeguro(receipt.voucher.toUpperCase())
  doc.text(voucherTxt, ancho - margen, alto - 32, { align: 'right' })
  // Las etiquetas fijas van en minúscula; Otro conserva los nombres propios escritos.
  const etiqueta = etiquetaServicio(receipt)
  const servicio = receipt.service === 'otro' ? etiqueta : etiqueta.toLowerCase()
  const lblServ = `Servicio de ${servicio}`
  // La descripción libre no debe cruzar el sello central ni la información de empresa.
  textoEnCaja(doc, lblServ, ancho - margen, alto - 19, anchoPieIzq, {
    maxLineas: 1,
    align: 'right',
  })

}
