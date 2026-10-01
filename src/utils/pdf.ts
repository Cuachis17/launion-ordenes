/**
 * @fileoverview Fachada y reexportacion de generadores de orden de servicio PDF.
 * Mantiene compatibilidad con imports existentes delegando en pdfFormato1 y pdfFormato2.
 */

export { downloadOrderPdf } from './pdfFormato1'
export { downloadOrderPdfFormat2 } from './pdfFormato2'
