/**
 * @fileoverview Utilidades de renderizado y captura de PDFs a PNG para pruebas e2e.
 */

import { expect, type Page } from '@playwright/test'
import fs from 'node:fs'
import path from 'node:path'

/**
 * Renderiza un buffer PDF en canvas mediante pdf.js en el navegador y guarda captura PNG.
 */
export async function renderizarPdfAPng(
  page: Page,
  buffer: Buffer,
  salidaPng: string,
): Promise<number> {
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

/**
 * Descarga un PDF disparado en el navegador y genera su captura PNG para aserciones visuales.
 */
export async function descargarYCapturar<T>(
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
