// Selección centralizada del PDF de orden: comparte la regla entre historial y aviso de creación.
import type { CompanyInfo, Order } from '../types'
import { downloadOrderPdf, downloadOrderPdfFormat2 } from './pdf'

export function descargarPdfOrden(
  order: Order, company: CompanyInfo, user: unknown,
): Promise<void> {
  // La sesión, sin distinguir rol, es la condición histórica del formato personalizado.
  return user
    ? downloadOrderPdfFormat2(order, company, user)
    : downloadOrderPdf(order, company, user)
}
