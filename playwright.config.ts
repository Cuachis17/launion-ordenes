import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  expect: { timeout: 8_000 },
  fullyParallel: true,
  reporter: [['list']],
  use: { baseURL: 'http://localhost:5175', locale: 'es-MX', hasTouch: true },
  webServer: {
    command: 'npx vite --port 5175',
    url: 'http://localhost:5175',
    reuseExistingServer: !process.env.CI,
  },
  projects: [
    { name: 'movil-360', use: { viewport: { width: 360, height: 740 }, isMobile: true } },
    { name: 'movil-390', use: { viewport: { width: 390, height: 844 }, isMobile: true } },
    { name: 'escritorio-1280', use: { viewport: { width: 1280, height: 800 } } },
  ],
})
