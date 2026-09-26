import { test, expect, type Page } from '@playwright/test'

const abrirCotizador = async (page: Page) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Abrir menú de aplicaciones' }).click()
  await page.getByRole('navigation', { name: 'Aplicaciones' }).getByRole('button', { name: /Cotizador de traslados/ }).click()
  await expect(page.getByRole('heading', { name: 'Cotizador de traslados' })).toBeVisible()
}

const desde = (page: Page) => page.getByRole('textbox', { name: 'Desde' })
const hacia = (page: Page) => page.getByRole('textbox', { name: 'Hacia' })
const opciones = (page: Page) => page.getByRole('option')

const elegirLugar = async (page: Page, campo: 'Desde' | 'Hacia', texto: string, opcion: RegExp) => {
  const input = page.getByRole('textbox', { name: campo })
  await input.click()
  await input.fill(texto)
  await opciones(page).filter({ hasText: opcion }).first().click()
}

const shot = (page: Page, nombre: string) =>
  page.screenshot({ path: `e2e/screenshots/${test.info().project.name}-${nombre}.png`, fullPage: true })

test.describe('Cotizador de traslados', () => {
  test.beforeEach(async ({ page }) => { await abrirCotizador(page) })

  test('1. drawer abre el cotizador', async ({ page }) => {
    await expect(desde(page)).toBeVisible()
    await expect(hacia(page)).toBeVisible()
    await expect(page.getByText('Elige origen y destino')).toBeVisible()
    await shot(page, '01-inicial')
  })

  test('2. autocompletado, accesos rápidos y estado vacío', async ({ page }) => {
    await desde(page).click()
    await desde(page).fill('riu palace riv')
    const riu = opciones(page).filter({ hasText: 'Riu Palace Riviera Maya' })
    await expect(riu).toBeVisible()
    await shot(page, '02-sugerencias')
    await riu.click()
    await expect(desde(page)).toHaveValue('Riu Palace Riviera Maya')
    await expect(opciones(page)).toHaveCount(0)

    await page.getByRole('button', { name: 'Aeropuerto Cancún' }).click()
    await expect(desde(page)).toHaveValue('Aeropuerto Cancún')
    await page.getByRole('button', { name: 'Aeropuerto Tulum' }).click()
    await expect(desde(page)).toHaveValue('Aeropuerto Tulum')

    await hacia(page).click()
    await hacia(page).fill('playa centro')
    await expect(opciones(page).first()).toContainText('Playa del Carmen Centro')

    await hacia(page).fill('zzqqxx sin resultados')
    await page.waitForResponse((r) => r.url().includes('/hoteles/buscar?q=zzqqxx'))
    await expect(opciones(page)).toHaveCount(0)
    await expect(page.getByText(/Sin resultados para «zzqqxx sin resultados»/)).toBeVisible()
    await shot(page, '02-sin-resultados')
  })

  test('3. cotización Aeropuerto Cancún → Playa del Carmen Centro', async ({ page }) => {
    await page.getByRole('button', { name: 'Aeropuerto Cancún' }).click()
    await elegirLugar(page, 'Hacia', 'playa centro', /Playa del Carmen Centro/)
    await expect(page.getByText('$900', { exact: false }).first()).toBeVisible()
    await expect(page.getByText('$1,300').first()).toBeVisible()
    await expect(page.getByText('Recepción')).toBeVisible()
    await expect(page.getByText('+$50')).toBeVisible()
    await expect(page.getByText(/sin casetas/i)).toBeVisible()
    await expect(page.getByText(/Tarifas vigentes desde el 10 de diciembre de 2025/)).toBeVisible()
    await shot(page, '03-cotizacion')
  })

  test('4. intercambiar recalcula', async ({ page }) => {
    await page.getByRole('button', { name: 'Aeropuerto Cancún' }).click()
    await elegirLugar(page, 'Hacia', 'playa centro', /Playa del Carmen Centro/)
    await expect(page.getByText('+$50')).toBeVisible()
    const req = page.waitForRequest((r) => r.url().includes('/cotizar?origen=playa_centro&destino=aeropuerto_cun'))
    await page.getByRole('button', { name: 'Intercambiar origen y destino' }).click()
    await req
    await expect(desde(page)).toHaveValue('Playa del Carmen Centro')
    await expect(hacia(page)).toHaveValue('Aeropuerto Cancún')
    await expect(page.getByText(/Desde:\s*Playa del Carmen Centro/)).toBeVisible()
    await expect(page.getByText('+$50')).toHaveCount(0) // la tabla inversa no cobra recepción
    await shot(page, '04-intercambio')
  })

  test('5. ruta sin tarifa no muestra precios', async ({ page }) => {
    await elegirLugar(page, 'Desde', 'Royalton', /Royalton Riviera Cancun, An Autograph/)
    await elegirLugar(page, 'Hacia', 'aeropuerto tulum', /Aeropuerto Tulum/)
    await expect(page.getByText(/No tenemos tarifa/)).toBeVisible()
    await expect(page.locator('main')).not.toContainText('$')
    await shot(page, '05-sin-tarifa')
  })

  test('6. tours y extras con precios', async ({ page }) => {
    await page.getByRole('button', { name: 'Tours', exact: true }).click()
    await expect(page.getByRole('heading', { name: 'Tours disponibles' })).toBeVisible()
    await expect(page.getByText('Xcaret Full Day').first()).toBeVisible()
    await expect(page.getByRole('cell', { name: /^\$\d/ }).first()).toBeVisible()
    await shot(page, '06-tours')
    await page.getByRole('button', { name: 'Extras', exact: true }).click()
    await expect(page.getByRole('heading', { name: 'Extras disponibles' })).toBeVisible()
    await expect(page.getByRole('row', { name: /Mérida/ })).toContainText('$')
    await shot(page, '06-extras')
  })

  test('7. escribir rápido no deja sugerencias viejas', async ({ page }) => {
    await desde(page).click()
    await desde(page).pressSequentially('riu palace', { delay: 20 })
    await expect(opciones(page).first()).toBeVisible()
    await desde(page).fill('')
    await desde(page).pressSequentially('royalton', { delay: 20 })
    await expect(opciones(page).first()).toContainText('Royalton')
    await expect(opciones(page).filter({ hasText: 'Riu' })).toHaveCount(0)
    // Borrar a <2 letras limpia la lista
    await desde(page).fill('r')
    await expect(opciones(page)).toHaveCount(0)
    // Respuesta lenta de una búsqueda vieja no debe pisar a la nueva
    await page.route('**/hoteles/buscar?q=riu*', async (route) => { await new Promise((r) => setTimeout(r, 1500)); await route.continue() })
    await desde(page).fill('riu')
    await page.waitForTimeout(300)
    await desde(page).fill('royalton')
    await page.waitForTimeout(2000)
    await expect(opciones(page).filter({ hasText: 'Riu' })).toHaveCount(0)
    await expect(opciones(page).first()).toContainText('Royalton')
  })

  test('8. error de red en cotizar muestra mensaje amable', async ({ page }) => {
    await page.route('**/api/tarifas/cotizar**', (route) => route.abort('failed'))
    await page.getByRole('button', { name: 'Aeropuerto Cancún' }).click()
    await elegirLugar(page, 'Hacia', 'playa centro', /Playa del Carmen Centro/)
    const alerta = page.getByRole('alert')
    await expect(alerta).toBeVisible()
    await shot(page, '08-error-red')
    const texto = (await alerta.innerText()).trim()
    expect.soft(texto, `Mensaje mostrado: "${texto}"`).not.toMatch(/Failed to fetch|TypeError|NetworkError|Load failed/i)
    await expect(page.getByRole('heading', { name: 'Cotizador de traslados' })).toBeVisible()
    await expect(desde(page)).toBeEnabled()
  })

  test('9. layout: sin scroll horizontal y objetivos táctiles', async ({ page }) => {
    await page.getByRole('button', { name: 'Aeropuerto Cancún' }).click()
    await elegirLugar(page, 'Hacia', 'playa centro', /Playa del Carmen Centro/)
    await expect(page.getByText('+$50')).toBeVisible()
    for (const seccion of ['Cotizar', 'Tours', 'Extras']) {
      await page.getByRole('button', { name: seccion, exact: true }).click()
      const { sw, cw } = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }))
      expect.soft(sw, `scroll horizontal en ${seccion}`).toBeLessThanOrEqual(cw)
    }
    await page.getByRole('button', { name: 'Cotizar', exact: true }).click()

    // Botones del cotizador (y el de menú) con alto táctil >= 40px
    const chicos = await page.evaluate(() => {
      const els = [...document.querySelectorAll('main button, header button')] as HTMLElement[]
      return els.map((b) => ({ t: (b.innerText || b.getAttribute('aria-label') || '').trim(), h: Math.round(b.getBoundingClientRect().height), w: Math.round(b.getBoundingClientRect().width) }))
        .filter((b) => b.h > 0 && (b.h < 40 || b.w < 40))
    })
    expect.soft(chicos, 'botones por debajo de 40px').toEqual([])

    // Safe area: el viewport no declara viewport-fit=cover, así que iOS no mete contenido bajo el notch.
    // Verificamos que nada interactivo quede fuera del viewport horizontal.
    const fuera = await page.evaluate(() => [...document.querySelectorAll('main button, main input')]
      .map((e) => e.getBoundingClientRect()).filter((r) => r.width > 0 && (r.left < 0 || r.right > window.innerWidth)).length)
    expect(fuera).toBe(0)
    await shot(page, '09-layout')
  })
})
