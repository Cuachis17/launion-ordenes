// Pruebas de administración móvil: permisos, reversión y suspensión de sesión.
import { expect, test, type Page } from '@playwright/test'
const admin = { _id: 'admin', username: 'Administradora', role: 'admin', phone: '111' }
const cuenta = { _id: 'otro', username: 'Ana', role: 'user', phone: '222', status: 'active' }
const aviso = 'Tu cuenta está suspendida. Contacta al administrador.'
async function preparar(page: Page, role = 'admin') {
  await page.route('**/api/verify', route => route.fulfill({
    json: { user: { ...admin, role } },
  }))
  await page.route('**/api/admin/users', route => route.fulfill({
    json: [{ ...admin, status: 'active' }, cuenta],
  }))
  await page.goto('/')
}
async function abrirUsuarios(page: Page) {
  await page.getByRole('button', { name: 'Abrir menú de aplicaciones' }).click()
  await page.getByRole('button', { name: /Usuarios Activar/ }).click()
}
test('admin busca y revierte una suspensión rechazada sin desbordar móvil', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await preparar(page)
  await abrirUsuarios(page)
  await expect(page.getByText('2 activos · 0 suspendidos')).toBeVisible()
  await expect(page.getByText('Tú', { exact: true })).toBeVisible()
  await page.getByLabel('Buscar por nombre o teléfono').fill('222')
  const interruptor = page.getByRole('switch', { name: 'Suspender a Ana' })
  await interruptor.click()
  await expect(page.getByText(/¿Suspender a Ana/)).toBeVisible()
  await page.getByRole('button', { name: 'Cancelar', exact: true }).click()
  await expect(interruptor).toHaveAttribute('aria-checked', 'true')
  await page.route('**/api/admin/users/otro/status', route => route.fulfill({
    status: 500, json: { message: 'Estado rechazado' },
  }))
  await interruptor.click()
  await page.getByRole('button', { name: 'Suspender', exact: true }).click()
  await expect(page.getByRole('alert')).toContainText('Estado rechazado')
  await expect(interruptor).toHaveAttribute('aria-checked', 'true')
  const ancho = await page.evaluate(() => document.documentElement.scrollWidth)
  expect(ancho).toBeLessThanOrEqual(390)
})
test('un usuario sin rol admin no ve Usuarios', async ({ page }) => {
  await preparar(page, 'user')
  await page.getByRole('button', { name: 'Abrir menú de aplicaciones' }).click()
  await expect(page.getByRole('button', { name: /Usuarios Activar/ })).toHaveCount(0)
  await expect(page.getByRole('button', { name: /Órdenes de servicio/ })).toBeVisible()
})
test('INACTIVE vuelve a órdenes y conserva su captura sin sesión', async ({ page }) => {
  await preparar(page)
  await abrirUsuarios(page)
  await page.route('**/api/verify', route => route.fulfill({
    status: 403, json: { code: 'INACTIVE' },
  }))
  await page.evaluate(() => window.dispatchEvent(new Event('focus')))
  await expect(page.getByRole('alert')).toContainText(aviso)
  await expect(page.getByRole('heading', { name: 'Usuarios', exact: true })).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Crear Reserva' })).toBeVisible()
})
test('login explica una cuenta suspendida', async ({ page }) => {
  await page.route('**/api/verify', route => route.fulfill({ status: 401, json: {} }))
  await page.route('**/api/login', route => route.fulfill({ status: 403, json: {} }))
  await page.goto('/')
  await page.getByRole('button', { name: 'Iniciar sesión' }).first().click()
  await page.getByLabel('Teléfono o correo').fill('222')
  await page.getByLabel('Contraseña', { exact: true }).fill('ejemplo')
  await page.getByRole('button', { name: 'Entrar', exact: true }).click()
  await expect(page.getByRole('alert')).toContainText(aviso)
})
test('suspende optimistamente y permite activar después', async ({ page }) => {
  await preparar(page)
  await abrirUsuarios(page)
  let resolver: (() => void) | undefined
  await page.route('**/api/admin/users/otro/status', async route => {
    const { status } = route.request().postDataJSON()
    if (status === 'inactive') await new Promise<void>(resolve => { resolver = resolve })
    await route.fulfill({ json: { ...cuenta, status } })
  })
  await page.getByRole('switch', { name: 'Suspender a Ana' }).click()
  await page.getByRole('button', { name: 'Suspender', exact: true }).click()
  const activar = page.getByRole('switch', { name: 'Activar a Ana' })
  await expect(activar).toHaveAttribute('aria-checked', 'false')
  await expect(activar).toBeDisabled()
  await expect(page.getByText('1 activos · 1 suspendidos')).toBeVisible()
  await expect.poll(() => Boolean(resolver)).toBe(true)
  resolver?.()
  await expect(activar).toBeEnabled()
  await activar.click()
  await expect(page.getByRole('switch', { name: 'Suspender a Ana' })).toBeEnabled()
  await expect(page.getByText('2 activos · 0 suspendidos')).toBeVisible()
})
