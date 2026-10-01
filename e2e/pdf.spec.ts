/**
 * @fileoverview Verificación visual e2e de generación de PDFs ante datos extremos.
 * Renderiza Orden Formato 1, Formato 2 y Comprobantes con emojis y textos largos,
 * capturando la salida en PNG mediante pdf.js en canvas para validar que no haya colisiones.
 */

import { test, expect } from '@playwright/test'
import { descargarYCapturar } from './helpers/pdfRender'
import {
  companyInfo,
  ordenBase,
  ordenExtrema1,
  comprobanteExtremo,
  comprobanteOtro,
} from './helpers/pdfDatos'

test.describe('Verificación visual de PDFs con datos extremos', () => {
  test('Orden Formato 1 con datos extremos', async ({ page }) => {
    await page.goto('/')
    await descargarYCapturar(
      page,
      'e2e/screenshots/pdf-formato1.png',
      async ({ o, c }) => {
        const mod = await import('/src/utils/pdfFormato1.ts')
        await mod.downloadOrderPdf(o, c)
      },
      { o: ordenExtrema1, c: companyInfo },
    )
  })

  test('Generación de Orden Formato 2 con datos extremos y captura PNG', async ({ page }) => {
    await page.goto('/')
    await descargarYCapturar(
      page,
      'e2e/screenshots/pdf-formato2.png',
      async ({ o, c }) => {
        const mod = await import('/src/utils/pdfFormato2.ts')
        await mod.downloadOrderPdfFormat2(o, c)
      },
      { o: ordenBase, c: companyInfo },
    )
  })

  test('Generación de Comprobante con datos extremos y captura PNG', async ({ page }) => {
    await page.goto('/')
    await descargarYCapturar(
      page,
      'e2e/screenshots/pdf-comprobante.png',
      async ({ r, c }) => {
        const mod = await import('/src/utils/receiptPdf.ts')
        await mod.downloadReceiptPdf(r, c)
      },
      { r: comprobanteExtremo, c: companyInfo },
    )
  })

  test('Comprobante Otro conserva el servicio personalizado en el PDF', async ({ page }) => {
    await page.goto('/')
    const { buffer: pdfBuffer } = await descargarYCapturar(
      page,
      'e2e/screenshots/pdf-comprobante-otro.png',
      async ({ r, c }) => {
        const mod = await import('/src/utils/receiptPdf.ts')
        await mod.downloadReceiptPdf(r, c)
      },
      { r: comprobanteOtro, c: companyInfo },
    )
    const contenido = pdfBuffer.toString('latin1')
    expect(contenido).toContain('BODA EN XCARET')
    expect(contenido).toContain('Servicio de Boda en Xcaret')
  })
})
