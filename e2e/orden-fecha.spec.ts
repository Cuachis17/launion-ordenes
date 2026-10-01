// Comprueba CampoFecha y CampoHora en órdenes, edición histórica y móvil 360/390.
import { expect, test, type Locator, type Page } from '@playwright/test'

test.use({ timezoneId: 'America/Cancun' })

async function preparar(page: Page, reloj = '2026-10-02T18:00:00Z') {
  await page.clock.setFixedTime(new Date(reloj))
  await page.route('**/api/verify', (route) => route.fulfill({ status: 401, json: {} }))
  await page.goto('/')
  await expect(page.getByRole('button', { name: 'Crear Reserva' })).toBeVisible()
  await expect(page.locator('input[type="date"], input[type="time"]')).toHaveCount(0)
}

async function sinDesbordamiento(page: Page, dialogo?: Locator) {
  const medidas = await page.evaluate(() => ({
    pagina: document.documentElement.scrollWidth,
    cuerpo: document.body.scrollWidth,
    ventana: window.innerWidth,
  }))
  const ancho = medidas.ventana
  expect(medidas.pagina).toBeLessThanOrEqual(medidas.ventana)
  expect(medidas.cuerpo).toBeLessThanOrEqual(medidas.ventana)
  if (dialogo) {
    const caja = await dialogo.boundingBox()
    expect(caja).not.toBeNull()
    expect(caja!.x).toBeGreaterThanOrEqual(0)
    expect(caja!.x + caja!.width).toBeLessThanOrEqual(ancho)
    const interno = await dialogo.evaluate((element) => ({
      contenido: element.scrollWidth,
      visible: element.clientWidth,
    }))
    expect(interno.contenido).toBeLessThanOrEqual(interno.visible)
  }
}

const NOMBRES_MES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
]

async function botonDia(calendario: Locator, iso: string): Promise<Locator> {
  const encabezado = await calendario.locator('span.capitalize').textContent()
  const [nombreMes, anioStr] = encabezado!.trim().toLowerCase().split(' ')
  const anioVista = Number(anioStr)
  const mesVista = NOMBRES_MES.indexOf(nombreMes)

  const primerDia = new Date(anioVista, mesVista, 1)
  const offsetLunes = (primerDia.getDay() + 6) % 7
  const [targetAnio, targetMes, targetDia] = iso.split('-').map(Number)
  const targetDate = new Date(targetAnio, targetMes - 1, targetDia)
  const inicio = new Date(anioVista, mesVista, 1 - offsetLunes)
  const diffDias = Math.round((targetDate.getTime() - inicio.getTime()) / (24 * 60 * 60 * 1000))
  return calendario.locator('div.grid.grid-cols-7 button').nth(diffDias)
}

async function fecha(page: Page, contenedor: Page | Locator, iso: string) {
  await contenedor.getByLabel('Fecha', { exact: true }).click()
  const calendario = page.locator('div.absolute[role="dialog"]')
  await expect(calendario).toBeVisible()
  await sinDesbordamiento(page, calendario)
  const boton = await botonDia(calendario, iso)
  await boton.click()
}

async function hora(page: Page, contenedor: Page | Locator, valor: string) {
  const [hh, mm] = valor.split(':')
  await contenedor.getByLabel('Hora', { exact: true }).click()
  const selectorHora = page.locator('div.absolute[role="dialog"]')
  await expect(selectorHora).toBeVisible()
  await sinDesbordamiento(page, selectorHora)

  const acceso = selectorHora.getByRole('button', { name: valor, exact: true })
  if (await acceso.count() > 0) {
    await acceso.click()
  } else {
    const colHora = selectorHora.locator('div:has(> p:text-is("Hora"))')
    await colHora.getByRole('button', { name: hh, exact: true }).click()
    const colMin = selectorHora.locator('div:has(> p:text-is("Min"))')
    await colMin.getByRole('button', { name: mm, exact: true }).click()
    await page.keyboard.press('Escape')
  }
}

test.beforeEach(async ({ page }, info) => {
  test.skip(!['movil-360', 'movil-390'].includes(info.project.name),
    'La regresión de anchura corresponde a móviles 360 y 390.')
  expect(page.viewportSize()).toBeTruthy()
})

test('crear y editar con CampoFecha/CampoHora sin desbordamiento horizontal', async ({
  page,
}, info) => {
  await preparar(page)
  await sinDesbordamiento(page)
  await page.getByLabel('Título de Reserva').fill('Orden fecha móvil')

  await page.getByLabel('Fecha', { exact: true }).click()
  const calendario = page.locator('div.absolute[role="dialog"]')
  await sinDesbordamiento(page, calendario)

  if (info.project.name === 'movil-390') {
    await page.screenshot({ path: 'e2e/screenshots/orden-campofecha-390.png' })
  }

  await expect(await botonDia(calendario, '2026-10-01')).toBeDisabled()
  const boton03 = await botonDia(calendario, '2026-10-03')
  await boton03.click()

  await page.getByLabel('Hora', { exact: true }).click()
  const selectorHora = page.locator('div.absolute[role="dialog"]')
  await expect(selectorHora).toBeVisible()
  await sinDesbordamiento(page, selectorHora)

  if (info.project.name === 'movil-390') {
    await page.screenshot({ path: 'e2e/screenshots/orden-campohora-390.png' })
  }
  await selectorHora.getByRole('button', { name: '15:00', exact: true }).click()

  await page.getByRole('button', { name: 'Crear Reserva' }).click()
  await page.locator('.aviso-creado').getByRole('button', { name: 'Ver', exact: true }).click()

  const orden = page.locator('article[id^="orden-"]').first()
  await expect(orden).toContainText('03 - octubre - 2026')
  await expect(orden).toContainText('15:00')

  await page.getByRole('button', { name: 'Cerrar aviso' }).click()
  await sinDesbordamiento(page)

  await orden.getByRole('button', { name: 'Editar', exact: true }).click()
  const editar = page.getByRole('dialog', { name: 'Editar Reserva', exact: true })
  await expect(editar).toBeVisible()
  await sinDesbordamiento(page, editar)
  await expect(page.locator('input[type="date"], input[type="time"]')).toHaveCount(0)

  await expect(editar.getByLabel('Fecha', { exact: true })).toContainText('03/10/2026')
  await expect(editar).toContainText('03 - octubre - 2026')
  await expect(editar.getByLabel('Hora', { exact: true })).toContainText('15:00')

  await fecha(page, editar, '2026-10-01')
  await hora(page, editar, '18:00')
  await editar.getByRole('button', { name: 'Guardar', exact: true }).click()

  await expect(orden).toContainText('01 - octubre - 2026')
  await expect(orden).toContainText('18:00')
  await sinDesbordamiento(page)
})

test('la cookie histórica conserva fecha y permite editar un día anterior', async ({ page }) => {
  const historica = {
    id: 'historica-fecha',
    agency: 'Orden histórica',
    service: 'Llegada',
    date: '01 - octubre - 2026',
    time: '14:30',
    hotel: 'Hotel histórico',
    passengers: 2,
    room: '',
    flight: '',
    generatedAt: '01/10/2026',
  }
  await page.context().addCookies([{
    name: 'union_orders',
    value: encodeURIComponent(JSON.stringify([historica])),
    url: test.info().project.use.baseURL ?? 'http://localhost:5175',
  }])
  await preparar(page)
  await page.getByRole('button', { name: 'Reservas (1)', exact: true }).click()
  const orden = page.locator('#orden-historica-fecha')
  await expect(orden).toContainText(historica.date)

  await orden.getByRole('button', { name: 'Editar', exact: true }).click()
  const editar = page.getByRole('dialog', { name: 'Editar Reserva', exact: true })
  await expect(editar.getByLabel('Fecha', { exact: true })).toContainText('01/10/2026')
  await expect(editar).toContainText('01 - octubre - 2026')
  await expect(editar.getByLabel('Hora', { exact: true })).toContainText('14:30')
  await sinDesbordamiento(page, editar)

  await editar.getByLabel('Fecha', { exact: true }).click()
  const cal = page.locator('div.absolute[role="dialog"]')
  await cal.getByRole('button', { name: 'Mes anterior', exact: true }).click()
  const boton30 = await botonDia(cal, '2026-09-30')
  await boton30.click()
  await hora(page, editar, '12:00')

  await editar.getByRole('button', { name: 'Guardar', exact: true }).click()
  await expect(orden).toContainText('30 - septiembre - 2026')
  await expect(orden).toContainText('12:00')
  await sinDesbordamiento(page)
})

test('en Cancún a las 21:00 locales el día actual está habilitado y por defecto', async ({
  page,
}) => {
  await preparar(page, '2026-10-02T02:00:00Z')
  const campoFecha = page.getByLabel('Fecha', { exact: true })
  await expect(campoFecha).toContainText('01/10/2026')
  await campoFecha.click()
  const cal = page.locator('div.absolute[role="dialog"]')
  await expect(await botonDia(cal, '2026-10-01')).toBeEnabled()
})

