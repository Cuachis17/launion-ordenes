/**
 * @fileoverview Verificación e2e de renderizado de logos WebP transparentes en PDFs.
 * Valida que los tres formatos de PDF no conviertan el canal alfa en fondo negro
 * al procesar avatares de usuario en formato WebP con transparencia.
 */

import { test, expect, type Page } from '@playwright/test'
import type { Order, Receipt, CompanyInfo } from '../src/types'
import { descargarYCapturar } from './helpers/pdfRender'

interface Coordenadas {
  x: number
  y: number
}

// Descarga un PDF, renderiza a PNG y valida que la esquina del logo no sea negra.
async function verificarPdfSinFondoNegro<T>(
  page: Page,
  salidaPng: string,
  evalFn: (arg: T) => Promise<void>,
  arg: T,
  coord: Coordenadas,
): Promise<void> {
  await descargarYCapturar(page, salidaPng, evalFn, arg)

  const pixel = await page.evaluate(({ x, y }) => {
    const canvas = document.getElementById('pdf-canvas') as HTMLCanvasElement
    const ctx = canvas.getContext('2d')
    if (!ctx) return [0, 0, 0, 0]
    const d = ctx.getImageData(x, y, 1, 1).data
    return [d[0], d[1], d[2], d[3]]
  }, coord)

  // Fondo transparente sobre pagina blanca debe dar blanco (R,G,B > 200), jamas negro.
  const esNegro = pixel[0] < 50 && pixel[1] < 50 && pixel[2] < 50
  expect(esNegro).toBe(false)
  expect(pixel[0]).toBeGreaterThan(200)
}

test.describe('Logo WebP con transparencia en PDFs', () => {
  const companyInfo: CompanyInfo = {
    razonSocial: 'Transportes Ejecutivos del Mayab S.A. de C.V.',
    direccion: 'Av. Cobá SM 22, Cancún, Q. Roo',
    sict: 'SICT-2026-TUR-001',
    cobranza: '+52 (998) 123-4567',
  }

  const user = { id: 'u1', avatar: 'x' }

  const orden: Order = {
    id: 'ord-webp-01',
    generatedAt: '01/10/2026 12:00',
    agency: 'Viajes Caribe',
    provider: 'Transportadora Peninsular',
    service: 'Traslado Hotel - Aeropuerto',
    date: '10/10/2026',
    time: '12:00',
    hotel: 'Hotel Nizuc Resort & Spa',
    passengers: 2,
    room: 'Villa 10',
    flight: 'AM-432',
    notes: 'Servicio con logo WebP transparente',
  }

  const receipt: Receipt = {
    id: 'rec-webp-01',
    voucher: 'V-WEBP-01',
    generatedAt: '2026-10-01T12:00:00.000Z',
    passenger: 'Yukino Yukinoshita',
    pax: 2,
    service: 'hotel',
    date: '2026-10-10',
    time: '12:00',
    pickup: 'Hotel Nizuc',
    dropoff: 'Aeropuerto T4',
    flight: 'AM-432',
    total: 1200,
    paid: 1200,
    currency: 'MXN',
  }

  test.beforeEach(async ({ page }) => {
    await page.goto('/')

    // Generar imagen WebP con circulo de color sobre fondo transparente
    const webpDataUrl = await page.evaluate(() => {
      const canvas = document.createElement('canvas')
      canvas.width = 120
      canvas.height = 120
      const ctx = canvas.getContext('2d')
      if (!ctx) throw new Error('Canvas no soportado')
      ctx.clearRect(0, 0, 120, 120)
      ctx.beginPath()
      ctx.arc(60, 60, 40, 0, Math.PI * 2)
      ctx.fillStyle = '#2563eb'
      ctx.fill()
      return canvas.toDataURL('image/webp')
    })

    const base64Data = webpDataUrl.split('base64,')[1]
    const webpBuffer = Buffer.from(base64Data, 'base64')

    // Interceptar avatar del usuario sirviendo WebP con canal alfa
    await page.route('**/api/users/*/avatar', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'image/webp',
        body: webpBuffer,
      })
    })
  })

  test('Formato 1: conserva transparencia del logo WebP', async ({ page }) => {
    await verificarPdfSinFondoNegro(
      page,
      'e2e/screenshots/pdf-logo-transparente-formato1.png',
      async ({ o, c, u }) => {
        const mod = await import('/src/utils/pdfFormato1.ts')
        await mod.downloadOrderPdf(o, c, u)
      },
      { o: orden, c: companyInfo, u: user },
      { x: 535, y: 40 },
    )
  })

  test('Formato 2: conserva transparencia del logo WebP', async ({ page }) => {
    await verificarPdfSinFondoNegro(
      page,
      'e2e/screenshots/pdf-logo-transparente-formato2.png',
      async ({ o, c, u }) => {
        const mod = await import('/src/utils/pdfFormato2.ts')
        await mod.downloadOrderPdfFormat2(o, c, u)
      },
      { o: orden, c: companyInfo, u: user },
      { x: 84, y: 64 },
    )
  })

  test('Comprobante: conserva transparencia del logo WebP', async ({ page }) => {
    await verificarPdfSinFondoNegro(
      page,
      'e2e/screenshots/pdf-logo-transparente-comprobante.png',
      async ({ r, c, u }) => {
        const mod = await import('/src/utils/receiptPdf.ts')
        await mod.downloadReceiptPdf(r, c, u)
      },
      { r: receipt, c: companyInfo, u: user },
      { x: 84, y: 64 },
    )
  })
})
