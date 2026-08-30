import type { Receipt } from '../types'

// Los comprobantes viven en localStorage, no en cookies como las órdenes.
// Motivo medido: un comprobante ocupa ~565 bytes ya codificado y una cookie
// tope a ~4 KB, así que sólo caben unos 7 antes de empezar a perder datos en
// silencio. En localStorage (~5 MB) caben del orden de 14 000.
const KEY = 'union_receipts'

export function loadReceipts(): Receipt[] {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return []
    const datos = JSON.parse(raw)
    return Array.isArray(datos) ? (datos as Receipt[]) : []
  } catch {
    return []
  }
}

export function saveReceipts(receipts: Receipt[]): boolean {
  try {
    localStorage.setItem(KEY, JSON.stringify(receipts))
    return true
  } catch {
    // Cuota llena o almacenamiento bloqueado (navegación privada).
    return false
  }
}

// Formato de dinero según la moneda del propio comprobante.
export function formatMoney(amount: number, currency: 'MXN' | 'USD'): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(Number(amount) || 0)
}
