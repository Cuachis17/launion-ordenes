/** Verifica avisos de alta, navegación al registro y descarga PDF en móvil y escritorio. */
import { expect, test, type Page } from '@playwright/test'
import fs from 'node:fs'

const usuario = {
  _id: 'usuario-aviso',
  username: 'Usuario de prueba',
  phone: '9980000000',
  role: 'user',
  avatar: null,
}

async function preparar(page: Page, conSesion: boolean) {
  await page.route('**/api/verify', route => route.fulfill({
    status: conSesion ? 200 : 401,
    json: conSesion ? { user: usuario } : {},
  }))
  // Forzar el fallback evita depender del diálogo nativo de compartir del sistema operativo.
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'share', { configurable: true, value: undefined })
    Object.defineProperty(navigator, 'canShare', { configurable: true, value: undefined })
  })
  await page.goto('/')
  await expect(page.getByRole('button', { name: 'Crear Reserva' })).toBeVisible()
  if (conSesion) await expect(page.getByRole('button', { name: 'Abrir perfil' })).toBeVisible()
}

async function comprobarAviso(page: Page, mensaje: string, prefijo: string) {
  const aviso = page.locator('.aviso-creado')
  await expect(aviso.getByRole('status')).toContainText(mensaje)
  await expect(aviso.getByRole('status')).toHaveAttribute('aria-live', 'polite')
  await aviso.getByRole('button', { name: 'Ver', exact: true }).click()
  const registro = page.locator(`[id^="${prefijo}-"][data-id]`).first()
  await expect(registro).toBeVisible()
  await expect(registro).toHaveAttribute('data-recien-creado', 'true')
  // La fila debe estar dentro del viewport: Ver no basta si solo cambia la pestaña.
  await expect(registro).toBeInViewport()
  return { aviso, registro }
}

async function descargar(page: Page) {
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.locator('.aviso-creado').getByRole('button', { name: 'PDF', exact: true }).click(),
  ])
  const archivo = await download.path()
  expect(archivo).toBeTruthy()
  const contenido = fs.readFileSync(archivo!)
  expect(contenido.subarray(0, 5).toString()).toBe('%PDF-')
  return download.suggestedFilename()
}

test.beforeEach(async ({ page }, info) => {
  expect(page.viewportSize()).toBeTruthy()
  test.skip(!['movil-390', 'escritorio-1280'].includes(info.project.name),
    'El encargo cubre móvil 390 y escritorio 1280.')
})

for (const conSesion of [false, true]) {
  test(`orden creada → Ver → PDF ${conSesion ? 'formato 2' : 'formato 1'}`, async ({ page }) => {
    await preparar(page, conSesion)
    await page.getByLabel('Título de Reserva').fill('Reserva aviso E2E')
    await page.getByLabel('Hotel', { exact: true }).fill('Hotel Xcaret')
    await page.getByRole('button', { name: 'Crear Reserva' }).click()
    const { registro } = await comprobarAviso(page, '✓ Orden creada', 'orden')
    await expect(registro).toContainText('Reserva aviso E2E')
    const nombre = await descargar(page)
    expect(nombre).toMatch(conSesion ? /^orden_.+_formato2\.pdf$/ : /^orden_.+\.pdf$/)
    if (!conSesion) expect(nombre).not.toContain('_formato2')
  })
}

test('comprobante emitido → Ver → PDF con fallback de compartir', async ({ page }) => {
  await preparar(page, true)
  await capturarComprobante(page)
  await page.getByRole('button', { name: 'Generar comprobante' }).click()
  const { registro } = await comprobarAviso(page, '✓ Comprobante emitido', 'comprobante')
  await expect(registro).toContainText('AVISO-123')
  await expect(registro).toContainText('María Aviso')
  expect(await descargar(page)).toBe('comprobante-AVISO-123.pdf')
  await page.getByRole('button', { name: 'Cerrar aviso' }).click()
  await expect(page.locator('.aviso-creado')).toHaveCount(0)
})

async function capturarComprobante(page: Page) {
  await page.getByRole('button', { name: 'Abrir menú de aplicaciones' }).click()
  await page.getByRole('navigation', { name: 'Aplicaciones' })
    .getByRole('button', { name: /Comprobantes/ }).click()
  await page.getByLabel('Número de voucher (opcional)').fill('AVISO-123')
  await page.getByLabel('Nombre del pasajero').fill('María Aviso')
  await page.getByRole('button', { name: 'Otro', exact: true }).click()
  await page.getByLabel('¿Qué servicio?').fill('Boda en Xcaret')
  await page.getByLabel('De dónde se recoge').fill('Hotel Xcaret')
  await page.getByLabel('Para dónde va').fill('Salón de eventos')
  await page.getByLabel('Fecha', { exact: true }).click()
  await page.getByRole('button', { name: 'Hoy', exact: true }).click()
  await page.getByLabel('Hora', { exact: true }).click()
  await page.getByRole('button', { name: '15:00', exact: true }).click()
  await page.getByLabel('Monto total').fill('3500')
}


test('aviso pausa ocho segundos al recibir foco y reanuda al salir', async ({ page }) => {
  await page.clock.install()
  await preparar(page, false)
  await page.getByRole('button', { name: 'Crear Reserva' }).click()
  const aviso = page.locator('.aviso-creado')
  await expect(aviso).toBeVisible()
  await aviso.getByRole('button', { name: 'Ver', exact: true }).focus()
  await page.mouse.move(0, 0)
  await page.clock.fastForward(9000)
  await expect(aviso).toBeVisible()
  await page.getByRole('button', { name: 'Abrir menú de aplicaciones' }).focus()
  await page.clock.fastForward(8001)
  await expect(aviso).toHaveCount(0)
})

test('fallo al guardar comprobante conserva captura y evita aviso de éxito', async ({ page }) => {
  await page.addInitScript(() => {
    const guardar = Storage.prototype.setItem
    Storage.prototype.setItem = function (key, value) {
      if (key === 'union_receipts') throw new DOMException('Sin espacio', 'QuotaExceededError')
      guardar.call(this, key, value)
    }
  })
  await preparar(page, true)
  await capturarComprobante(page)
  const mensaje = page.waitForEvent('dialog').then(async dialog => {
    const contenido = dialog.message()
    await dialog.dismiss()
    return contenido
  })
  await page.getByRole('button', { name: 'Generar comprobante' }).click()
  expect(await mensaje).toContain('No se pudo guardar')
  await expect(page.locator('.aviso-creado')).toHaveCount(0)
  await expect(page.getByLabel('Nombre del pasajero')).toHaveValue('María Aviso')
  const guardados = await page.evaluate(() => localStorage.getItem('union_receipts'))
  expect(guardados).toBeNull()
})
