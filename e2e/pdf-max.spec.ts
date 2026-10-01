/**
 * @fileoverview Verificación visual e2e de generación de PDFs ante cargas de datos máximos.
 * Valida casos reales con textos extensos, notas desbordadas (forzando 2 páginas) y
 * comprobantes con numeración de voucher y pasajeros extensos.
 */

import { test, expect } from '@playwright/test'
import { descargarYCapturar } from './helpers/pdfRender'
import { cadu, caduCo, maxOrder as max, maxCo, recMax } from './helpers/pdfDatos'

test.describe('Verificación visual de PDFs con datos máximos', () => {
  test('datos máximos', async ({ page }) => {
    await page.goto('/')

    // Caso real cadu en formato 2
    await descargarYCapturar(
      page,
      'e2e/screenshots/pdf-max-cadu-f2.png',
      async ({ o, c }) => {
        const mod = await import('/src/utils/pdfFormato2.ts')
        await mod.downloadOrderPdfFormat2(o, c)
      },
      { o: cadu, c: caduCo },
    )

    // Formato 1 con notas largas: verifica 2 paginas
    const resF1 = await descargarYCapturar(
      page,
      'e2e/screenshots/pdf-max-f1.png',
      async ({ o, c }) => {
        const mod = await import('/src/utils/pdfFormato1.ts')
        await mod.downloadOrderPdf(o, c)
      },
      { o: max, c: maxCo },
    )
    expect(resF1.numPages).toBe(2)

    // Formato 2 con datos maximos
    await descargarYCapturar(
      page,
      'e2e/screenshots/pdf-max-f2.png',
      async ({ o, c }) => {
        const mod = await import('/src/utils/pdfFormato2.ts')
        await mod.downloadOrderPdfFormat2(o, c)
      },
      { o: max, c: maxCo },
    )

    // Comprobante con voucher largo
    await descargarYCapturar(
      page,
      'e2e/screenshots/pdf-max-rec.png',
      async ({ r, c }) => {
        const mod = await import('/src/utils/receiptPdf.ts')
        await mod.downloadReceiptPdf(r, c)
      },
      { r: recMax, c: maxCo },
    )
  })
})
