// Tipos de órdenes y comprobantes; centraliza etiquetas y reglas del servicio.
export type Order = {
  id: string
  agency: string
  service: string
  date: string
  time: string
  hotel: string
  passengers: number
  room: string
  provider?: string
  flight: string
  notes?: string
  generatedAt: string
}

export type CompanyInfo = {
  razonSocial?: string
  direccion?: string
  sict?: string
  cobranza?: string
}

// ── Comprobantes de venta ────────────────────────────────────────────────────
// El comprobante es independiente de la orden de servicio: se captura por su
// cuenta y se le entrega al pasajero.

export type ServiceKind = 'llegada' | 'salida' | 'hotel' | 'otro'
export type Currency = 'MXN' | 'USD'

export type Receipt = {
  id: string
  voucher: string
  passenger: string
  service: ServiceKind
  serviceOther?: string
  pax: number
  pickup: string        // de dónde se recoge
  dropoff: string       // para dónde va
  date: string          // YYYY-MM-DD
  time: string          // HH:mm en 24 horas
  flight?: string       // solo cuando service === 'llegada'
  currency: Currency
  total: number         // monto total del servicio
  paid: number          // depósito recibido
  generatedAt: string
}

// El faltante nunca se captura ni se guarda: se calcula. Así no puede quedar
// una cifra que no cuadre con el total.
export function pendingAmount(r: Pick<Receipt, 'total' | 'paid'>): number {
  return Math.max(0, Number(r.total || 0) - Number(r.paid || 0))
}

export const ETIQUETAS_SERVICIO: Record<ServiceKind, string> = {
  llegada: 'Llegada',
  salida: 'Salida',
  hotel: 'Hotel a hotel',
  otro: 'Otro',
}

// El número de vuelo solo tiene sentido cuando el pasajero viene de un avión.
export function requiereVuelo(servicio: ServiceKind): boolean {
  return servicio === 'llegada'
}

// El voucher es opcional al capturar: si se deja vacío se genera el siguiente
// de la serie, para que ningún comprobante salga sin folio que dar por teléfono.
export function siguienteVoucher(existentes: Pick<Receipt, 'voucher'>[]): string {
  let mayor = 0
  for (const r of existentes) {
    const m = /(\d+)\s*$/.exec(r.voucher ?? '')
    if (m) mayor = Math.max(mayor, Number(m[1]))
  }
  return `VCH-${String(mayor + 1).padStart(5, '0')}`
}

// El texto personalizado se recorta para que un campo vacío conserve una etiqueta útil.
export function etiquetaServicio(r: Pick<Receipt, 'service' | 'serviceOther'>): string {
  return r.service === 'otro' && r.serviceOther?.trim()
    ? r.serviceOther.trim()
    : ETIQUETAS_SERVICIO[r.service]
}
