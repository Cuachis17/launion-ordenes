import { jsPDF } from 'jspdf'
import unionLogo from '../assets/union.png'
import type { Receipt, CompanyInfo } from '../types'
import { pendingAmount, ETIQUETAS_SERVICIO, requiereVuelo } from '../types'
import { formatMoney } from './receiptStorage'

// El comprobante lo lee el pasajero, muchas veces con prisa en el lobby de un
// hotel y desde el móvil. Por eso la jerarquía es agresiva: lo que necesita ver
// de lejos va grande, y lo legal va en letra chica al pie.
// Construye el documento. Se separa del guardado porque el mismo PDF se
// descarga, se comparte o se abre, según lo que permita el dispositivo.
// El logo principal es el del usuario, que vive en su sesión del servidor
// (el mismo avatar que muestra el header). Se descarga y se convierte a data
// URI porque jsPDF necesita los bytes, no una URL. Si falla —sin sesión, sin
// avatar, servidor caído— se cae al logo de La Unión y el comprobante sale igual.
async function logoDelUsuario(user: any): Promise<string | null> {
  // Cadena vacía es válida: el API se pide al propio origen a través del proxy.
  const api = import.meta.env.VITE_API_URL ?? ''
  if (!user?.id || !user?.avatar) return null
  try {
    const res = await fetch(`${api}/api/users/${user.id}/avatar`, { credentials: 'include' })
    if (!res.ok) return null
    const blob = await res.blob()
    if (!blob.type.startsWith('image/')) return null
    return await new Promise<string | null>((resolver) => {
      const lector = new FileReader()
      lector.onloadend = () => resolver(typeof lector.result === 'string' ? lector.result : null)
      lector.onerror = () => resolver(null)
      lector.readAsDataURL(blob)
    })
  } catch {
    return null
  }
}

function construirPdf(receipt: Receipt, companyInfo: CompanyInfo, logoUsuario: string | null) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' })
  const margen = 40
  const ancho = doc.internal.pageSize.getWidth()
  const util = ancho - margen * 2
  const esLlegada = receipt.service === 'llegada'
  const saldo = pendingAmount(receipt)

  const linea = (y: number, grosor = 0.8) => {
    doc.setLineWidth(grosor)
    doc.setDrawColor(203, 213, 225)
    doc.line(margen, y, ancho - margen, y)
  }
  const gris = (n: number) => doc.setTextColor(n, n, n)

  // ── Encabezado ────────────────────────────────────────────────────────────
  try {
    doc.addImage(logoUsuario ?? unionLogo, 'PNG', margen, 30, 54, 54)
  } catch {
    // Un logo dañado no puede impedir que se emita el comprobante.
    try { doc.addImage(unionLogo, 'PNG', margen, 30, 54, 54) } catch { /* sin logo */ }
  }

  doc.setFont('helvetica', 'bold'); doc.setFontSize(13); gris(17)
  doc.text(companyInfo?.razonSocial || 'La Union', margen + 66, 52)
  doc.setFont('helvetica', 'normal'); doc.setFontSize(8); gris(110)
  if (companyInfo?.direccion) doc.text(String(companyInfo.direccion), margen + 66, 65, { maxWidth: util - 210 })
  if (companyInfo?.sict) doc.text(`SICT: ${companyInfo.sict}`, margen + 66, 76)

  doc.setFont('helvetica', 'bold'); doc.setFontSize(9); gris(90)
  doc.text('COMPROBANTE DE VENTA', ancho - margen, 52, { align: 'right' })

  // Voucher grande y píldora de tipo de servicio: lo que identifica el papel.
  doc.setFontSize(22); gris(17)
  doc.text(receipt.voucher.toUpperCase(), ancho - margen, 76, { align: 'right' })

  const etiqueta = ETIQUETAS_SERVICIO[receipt.service].toUpperCase()
  doc.setFontSize(9)
  const anchoPill = doc.getTextWidth(etiqueta) + 22
  if (esLlegada) doc.setFillColor(224, 231, 255)
  else if (receipt.service === 'hotel') doc.setFillColor(220, 252, 231)
  else doc.setFillColor(226, 232, 240)
  doc.roundedRect(ancho - margen - anchoPill, 84, anchoPill, 18, 9, 9, 'F')
  if (esLlegada) doc.setTextColor(67, 56, 202)
  else if (receipt.service === 'hotel') doc.setTextColor(21, 128, 61)
  else doc.setTextColor(51, 65, 85)
  doc.text(etiqueta, ancho - margen - anchoPill / 2, 96, { align: 'center' })

  linea(116, 1.4)

  // ── Datos principales ─────────────────────────────────────────────────────
  let y = 146
  const bloque = (rotulo: string, valor: string, tam = 15) => {
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8); gris(130)
    doc.text(rotulo.toUpperCase(), margen, y)
    doc.setFont('helvetica', 'bold'); doc.setFontSize(tam); gris(17)
    doc.text(valor || '—', margen, y + 19, { maxWidth: util })
    y += 46
  }

  bloque('Pasajero', `${receipt.passenger}   ·   ${receipt.pax} pax`, 16)

  const [aa, mm, dd] = String(receipt.date).split('-')
  const fecha = dd && mm && aa ? `${dd}/${mm}/${aa}` : receipt.date
  bloque('Fecha y hora de recogida', `${fecha}   ·   ${receipt.time} hrs`, 18)

  bloque('Se recoge en', receipt.pickup, 13)
  bloque('Destino', receipt.dropoff, 13)
  if (requiereVuelo(receipt.service) && receipt.flight) bloque('Número de vuelo', receipt.flight.toUpperCase(), 15)

  // ── Cobro ─────────────────────────────────────────────────────────────────
  linea(y - 8)
  y += 14

  doc.setFillColor(248, 250, 252)
  doc.roundedRect(margen, y, util, 92, 6, 6, 'F')

  doc.setFont('helvetica', 'normal'); doc.setFontSize(9); gris(110)
  doc.text('Total del servicio', margen + 16, y + 24)
  doc.text('Anticipo pagado', margen + 16, y + 46)

  doc.setFont('helvetica', 'bold'); doc.setFontSize(11); gris(17)
  doc.text(formatMoney(receipt.total, receipt.currency), margen + util / 2 - 16, y + 24, { align: 'right' })
  doc.setTextColor(4, 120, 87)
  doc.text(formatMoney(receipt.paid, receipt.currency), margen + util / 2 - 16, y + 46, { align: 'right' })

  // El saldo es lo que el pasajero busca primero: caja aparte y el número mayor.
  const xCaja = margen + util / 2
  if (saldo > 0) doc.setFillColor(254, 243, 199); else doc.setFillColor(209, 250, 229)
  doc.roundedRect(xCaja, y + 8, util / 2 - 8, 76, 6, 6, 'F')

  doc.setFont('helvetica', 'normal'); doc.setFontSize(9)
  if (saldo > 0) doc.setTextColor(146, 64, 14); else doc.setTextColor(6, 95, 70)
  doc.text(saldo > 0 ? 'SALDO A PAGAR AL ABORDAR' : 'PAGADO COMPLETO', xCaja + 16, y + 32)
  doc.setFont('helvetica', 'bold'); doc.setFontSize(saldo > 0 ? 21 : 17)
  doc.text(saldo > 0 ? formatMoney(saldo, receipt.currency) : 'NADA POR PAGAR', xCaja + 16, y + 62)
  if (saldo > 0) {
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8)
    doc.text(receipt.currency, xCaja + util / 2 - 24, y + 62, { align: 'right' })
  }

  y += 116

  // ── Letra chica ───────────────────────────────────────────────────────────
  linea(y)
  y += 16
  doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5); gris(140)
  const notas = [
    'Preséntese en el punto de recogida 10 minutos antes de la hora indicada. La tolerancia de espera es de 15 minutos.',
    'El saldo pendiente, si lo hubiera, se liquida directamente con el operador al abordar la unidad.',
    'Conserve este comprobante durante todo el traslado. Es el documento que ampara su servicio.',
    companyInfo?.cobranza ? `Contacto de cobranza: ${companyInfo.cobranza}` : '',
  ].filter(Boolean)
  for (const nota of notas) {
    doc.text(nota, margen, y, { maxWidth: util })
    y += 13
  }

  y += 6
  doc.setFontSize(7); gris(165)
  doc.text(`Emitido: ${new Date(receipt.generatedAt).toLocaleString('es-MX')}   ·   Folio interno: ${receipt.id.slice(0, 8).toUpperCase()}`, margen, y)

  // Banda al pie de página. Sin ella la mitad inferior queda vacía y el
  // comprobante parece cortado a la mitad.
  const alto = doc.internal.pageSize.getHeight()
  doc.setFillColor(248, 250, 252)
  doc.rect(0, alto - 54, ancho, 54, 'F')
  doc.setDrawColor(226, 232, 240); doc.setLineWidth(0.8)
  doc.line(0, alto - 54, ancho, alto - 54)

  doc.setFont('helvetica', 'bold'); doc.setFontSize(9); gris(60)
  doc.text(companyInfo?.razonSocial || 'La Union', margen, alto - 32)
  doc.setFont('helvetica', 'normal'); doc.setFontSize(8); gris(140)
  doc.text('Gracias por viajar con nosotros. Buen viaje.', margen, alto - 19)

  // Sello del operador, discreto y solo si el usuario puso su propio logo:
  // si no lo puso, el de La Unión ya está arriba y repetirlo sobra.
  if (logoUsuario) {
    try {
      doc.addImage(unionLogo, 'PNG', ancho / 2 - 14, alto - 44, 28, 28)
      doc.setFontSize(6); gris(165)
      doc.text('Operado por La Unión', ancho / 2, alto - 12, { align: 'center' })
    } catch { /* el sello es opcional */ }
  }
  doc.setFontSize(8)
  doc.text(receipt.voucher.toUpperCase(), ancho - margen, alto - 32, { align: 'right' })
  doc.text(`Servicio de ${ETIQUETAS_SERVICIO[receipt.service].toLowerCase()}`, ancho - margen, alto - 19, { align: 'right' })

  return doc
}

function nombreArchivo(receipt: Receipt): string {
  const orden = (receipt.voucher || receipt.id.slice(0, 8)).replace(/[^\w-]/g, '')
  return `comprobante-${orden}.pdf`
}

// Texto que acompaña al archivo al compartirlo. Lo primero que lee quien lo
// recibe es el número de orden, que es lo que le van a pedir.
function textoParaCompartir(receipt: Receipt): { title: string; text: string } {
  const [a, m, d] = String(receipt.date).split('-')
  const fecha = d && m && a ? `${d}/${m}/${a}` : receipt.date
  const tipo = receipt.service === 'llegada' ? 'Llegada' : 'Salida'
  return {
    title: `Comprobante ${receipt.voucher}`,
    text: `Comprobante ${receipt.voucher} · ${tipo}\n${receipt.passenger} · ${receipt.pax} pax\n${fecha} a las ${receipt.time} hrs\n${receipt.pickup} → ${receipt.dropoff}`,
  }
}

export async function downloadReceiptPdf(receipt: Receipt, companyInfo: CompanyInfo, user?: unknown) {
  const logo = await logoDelUsuario(user)
  construirPdf(receipt, companyInfo, logo).save(nombreArchivo(receipt))
}

// Abre la hoja de compartir del teléfono (WhatsApp, correo, AirDrop...). Si el
// dispositivo no la soporta, descarga el archivo, que es lo mejor que se puede
// hacer sin dejar al usuario sin nada.
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
      // El usuario cerró la hoja de compartir: no es un error que reportar.
      if (e instanceof DOMException && e.name === 'AbortError') return 'cancelado'
      // Cualquier otro fallo cae a la descarga.
    }
  }

  doc.save(nombre)
  return 'descargado'
}
