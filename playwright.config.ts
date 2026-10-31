import { defineConfig, devices } from '@playwright/test'

/**
 * Browser-Tests für Swiss Immo Cert.
 *
 * Ziel per E2E_BASE_URL, z. B. eine Vercel-Preview oder https://www.swissimmocert.ch.
 * Ohne Angabe: lokaler Dev-Server (`npm run dev`), SIC-Ansicht über ?subdomain=sic.
 * Die Standard-Tests lesen nur. Was Daten anlegt, läuft nur mit E2E_CHECKOUT=1 —
 * nie gegen Produktion.
 */
const baseURL = process.env.E2E_BASE_URL?.replace(/\/$/, '') || 'http://localhost:3002'

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list']],
  use: {
    baseURL,
    locale: 'de-CH',
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
  ],
})
