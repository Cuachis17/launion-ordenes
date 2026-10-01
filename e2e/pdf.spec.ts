/**
 * @fileoverview Verificacion visual e2e de generacion de PDFs ante datos extremos.
 * Renderiza Orden Formato 1, Formato 2 y Comprobantes con emojis y textos largos,
 * capturando la salida en PNG mediante pdf.js en canvas para validar que no haya colisiones.
 */

import { test, expect, type Page } from '@playwright/test'
import fs from 'node:fs'
import path from 'node:path'
import type { Order, Receipt, CompanyInfo } from '../src/types'

async function renderizarPdfAPng(page: Page, buffer: Buffer, salidaPng: string): Promise<number> {
  const base64 = buffer.toString('base64')
  await page.setContent(
    '<!DOCTYPE html><html><head>' +
    '<script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script>' +
    '<style>body { margin: 0; background: #fff; }</style></head>' +
    '<body><canvas id="pdf-canvas"></canvas></body></html>',
  )

  const numPages = await page.evaluate(async (b64) => {
    // @ts-expect-error pdfjsLib inyectado via CDN
    pdfjsLib.GlobalWorkerOptions.workerSrc =
      'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'
    const bin = atob(b64)
    const bytes = new Uint8Array(bin.length)
    for (let i = 0; i < bin.length; i++) {
      bytes[i] = bin.charCodeAt(i)
    }
    // @ts-expect-error pdfjsLib inyectado via CDN
    const pdf = await pdfjsLib.getDocument({ data: bytes }).promise
    const pag = await pdf.getPage(1)
    const viewport = pag.getViewport({ scale: 2.0 })
    const canvas = document.getElementById('pdf-canvas') as HTMLCanvasElement
    canvas.width = viewport.width
    canvas.height = viewport.height
    await pag.render({ canvasContext: canvas.getContext('2d'), viewport }).promise
    return pdf.numPages as number
  }, base64)

  const canvas = page.locator('#pdf-canvas')
  const dir = path.dirname(salidaPng)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
  await canvas.screenshot({ path: salidaPng })
  return numPages
}

// Descarga un PDF disparado desde el navegador y genera su captura PNG para aserciones visuales.
async function descargarYCapturar<T>(
  page: Page,
  salidaPng: string,
  evalFn: (arg: T) => Promise<void>,
  arg: T,
): Promise<{ buffer: Buffer; numPages: number }> {
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.evaluate(evalFn, arg),
  ])
  const pdfPath = await download.path()
  expect(pdfPath).toBeTruthy()
  const buffer = fs.readFileSync(pdfPath!)
  const numPages = await renderizarPdfAPng(page, buffer, salidaPng)
  expect(fs.existsSync(salidaPng)).toBe(true)
  return { buffer, numPages }
}

test.describe('Verificación visual de PDFs con datos extremos', () => {
  const companyInfo: CompanyInfo = {
    razonSocial: 'Transportes Ejecutivos y Turísticos de la Península de Yucatán S.A. de C.V.',
    direccion: 'Avenida Tulum Manzana 12 Lote 34 Supermanzana 56, Cancún Centro, Quintana Roo',
    sict: 'SICT-0987654321-EXP-2026',
    cobranza: '+52 (998) 876-5432',
  }

  const ordenBase: Order = {
    id: 'ord-extrema-99',
    generatedAt: '01/10/2026 10:30',
    agency: 'Agencia de Viajes Internacionales y Excursiones del Caribe “Riviera Maya”',
    provider: 'Transportadora Turística del Caribe Mexicano S.A. de C.V. — Unidad 104',
    service: 'Servicio VIP “Exclusivo” — Especial 🚗 ✓ con todo incluido',
    date: '15/10/2026',
    time: '14:30',
    hotel: 'Hotel Riu Palace Costa Mujeres All Inclusive Adults Only',
    passengers: 8,
    room: 'Suite Presidencial 1204-B',
    flight: 'AM-1234',
    notes: 'Cliente “VIP” solicita chofer bilingüe — no olvidar'
      + ' silla de bebé 👶 ✓ ni agua fría',
    paymentType: 'credito',
  }

  test('Orden Formato 1 con datos extremos', async ({ page }) => {
    await page.goto('/')
    const ordenExtrema1: Order = {
      ...ordenBase,
      id: 'ord-extrema-01',
      service: 'Boda en Xcaret — traslado redondo',
      provider: 'Transportadora Turística del Caribe Mexicano S.A. de C.V. 🚐 — Unidad 104',
    }
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
    const comprobanteExtremo: Receipt = {
      id: 'rec-extremo-55555555',
      voucher: 'V-99999',
      generatedAt: '2026-10-01T10:30:00.000Z',
      passenger: 'Lic. María de los Ángeles Hernández y Villalpando',
      pax: 4,
      service: 'hotel',
      date: '2026-10-15',
      time: '15:00',
      pickup: 'Hotel Riu Palace Costa Mujeres All Inclusive Adults Only',
      dropoff: 'Avenida Tulum Manzana 12 Lote 34 Supermanzana 56, Cancún Centro, Quintana Roo',
      flight: 'VB-4567',
      total: 3500,
      paid: 1000,
      currency: 'MXN',
    }

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
    const receipt: Receipt = {
      id: 'rec-otro-55555555',
      voucher: 'V-OTRO',
      generatedAt: '2026-10-01T10:30:00.000Z',
      passenger: 'María Hernández',
      pax: 4,
      service: 'otro',
      serviceOther: 'Boda en Xcaret',
      date: '2026-10-15',
      time: '15:00',
      pickup: 'Hotel Riu Palace',
      dropoff: 'Xcaret',
      total: 3500,
      paid: 1000,
      currency: 'MXN',
    }
    const { buffer: pdfBuffer } = await descargarYCapturar(
      page,
      'e2e/screenshots/pdf-comprobante-otro.png',
      async ({ r, c }) => {
        const mod = await import('/src/utils/receiptPdf.ts')
        await mod.downloadReceiptPdf(r, c)
      },
      { r: receipt, c: companyInfo },
    )
    const contenido = pdfBuffer.toString('latin1')
    expect(contenido).toContain('BODA EN XCARET')
    expect(contenido).toContain('Servicio de Boda en Xcaret')
  })

  test('datos máximos', async ({ page }) => {
    const cadu: Order = {
      id: '7f0r8ugx',
      generatedAt: '27 de septiembre de 2026',
      agency: 'CADU / STAFF.',
      provider: 'TierraMar',
      service: 'Tour',
      date: '28 - septiembre - 2026',
      time: '05:00',
      hotel: 'OFICINAS CADO / Villas de Tulum Residencial',
      passengers: 17,
      room: 'PRIVADO',
      flight: 'TRASLADO CORPORATIVO STAFF',
      notes: 'Transportación corporativa precontratada CADU - TIERRAMAR',
    }
    const caduCo: CompanyInfo = {
      razonSocial: 'EL CIELO Y LA SELVA DE TULUM (TierraMar)',
      direccion: 'TULUM CENTRO',
      sict: '***. ***. ***. ***',
      cobranza: '+19156136956',
    }

    const W = 'WWWWWWWWWW MMMMMMMMMM '
    const max: Order = {
      id: 'ABCDEFGHIJKLMNOP',
      generatedAt: '30 de septiembre de 2026 a las 23:59:59 hrs',
      agency:
        'AGENCIA DE VIAJES INTERNACIONALES Y EXCURSIONES DEL CARIBE MEXICANO RIVIERA MAYA SA DE CV',
      provider: 'TRANSPORTADORA TURÍSTICA DEL CARIBE MEXICANO S.A. DE C.V. UNIDAD 104 SPRINTER',
      service: 'TRASLADO REDONDO BODA EN XCARET CON PARADA EN PLAYA DEL CARMEN Y TULUM',
      date: '28 - septiembre - 2026',
      time: '05:00 a 23:00 hrs (con espera)',
      hotel:
        'HOTEL RIU PALACE COSTA MUJERES ALL INCLUSIVE ADULTS ONLY / VILLAS DE TULUM RESIDENCIAL',
      passengers: 99999,
      room: 'SUITE PRESIDENCIAL 1204-B TORRE NORTE PISO 12 VISTA AL MAR',
      flight: 'TRASLADO CORPORATIVO STAFF AEROMEXICO AM-1234 / VOLARIS Y4-5678 / VIVA VB-9012',
      notes: (W + 'Notas muy largas sin espacios: ' + 'X'.repeat(160) + ' ').repeat(4),
    }
    const maxCo: CompanyInfo = {
      razonSocial: 'EL CIELO Y LA SELVA DE TULUM SOCIEDAD ANÓNIMA DE CAPITAL VARIABLE (TIERRAMAR)',
      direccion:
        'AVENIDA TULUM MANZANA 12 LOTE 34 SUPERMANZANA 56 TULUM CENTRO QUINTANA ROO CP 77780',
      sict: 'SICT-0987654321-EXP-2026-PERMISO-FEDERAL-AUTOTRANSPORTE-TURISMO',
      cobranza: '+52 (998) 876-5432 / +1 (915) 613-6956 WhatsApp',
    }
    const recMax: Receipt = {
      id: 'rec-extremo-55555555',
      voucher: 'VCH-99999999999999',
      generatedAt: '2026-10-01T10:30:00.000Z',
      passenger: 'LIC. MARÍA DE LOS ÁNGELES HERNÁNDEZ Y VILLALPANDO DE LA CRUZ GUTIÉRREZ',
      pax: 99999,
      service: 'otro',
      serviceOther: 'TRASLADO REDONDO BODA EN XCARET CON PARADA EN PLAYA DEL CARMEN',
      date: '2026-10-15',
      time: '15:00',
      pickup: max.hotel,
      dropoff: 'AEROPUERTO INTERNACIONAL DE CANCÚN TERMINAL 4 SALIDAS INTERNACIONALES PUERTA 12',
      flight: max.flight,
      currency: 'MXN',
      total: 99999999.99,
      paid: 1.5,
    }

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
