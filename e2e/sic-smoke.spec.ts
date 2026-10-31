import { expect, test, type Page } from '@playwright/test'

const local = /localhost|127\.0\.0\.1/.test(process.env.E2E_BASE_URL || 'http://localhost:3002')
const production = /(^|\/\/)(www\.)?swissimmocert\.ch/.test(process.env.E2E_BASE_URL || '')

/** Lokal schaltet ?subdomain=sic die SIC-Ansicht frei (Preview-Cookie). */
async function openSic(page: Page, path = '/') {
  if (local) await page.goto('/?subdomain=sic')
  return page.goto(path)
}

test.describe('Swiss Immo Cert — öffentliche Seiten', () => {
  test('Landing lädt ohne Konsolenfehler und zeigt das Anlegen-Formular', async ({ page }) => {
    const errors: string[] = []
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text())
    })
    page.on('pageerror', err => errors.push(err.message))

    const res = await openSic(page, '/')
    expect(res?.status()).toBe(200)
    await expect(page).toHaveTitle(/Swiss Immo Cert/)
    await expect(page.locator('#sic-hero-email')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Zertifikat anlegen' })).toBeVisible()
    // CSP-Verstösse erscheinen als Konsolenfehler — die Liste muss leer bleiben.
    expect(errors).toEqual([])
  })

  for (const [path, heading] of [
    ['/sic/agb', /AGB|Allgemeine Geschäftsbedingungen/],
    ['/sic/datenschutz', /Datenschutz/],
    ['/sic/impressum', /Impressum/],
    ['/sic/faq', /Häufige Fragen/],
  ] as const) {
    test(`${path} ist erreichbar`, async ({ page }) => {
      const res = await openSic(page, path)
      expect(res?.status()).toBe(200)
      await expect(page.getByRole('heading', { level: 1 })).toHaveText(heading)
    })
  }

  test('Prüfseite meldet einen unbekannten Code', async ({ page }) => {
    await openSic(page, '/sic/verify/SIC-2026-ZZZZZZZZ')
    await expect(page.getByText('Kein Zertifikat gefunden')).toBeVisible()
  })

  test('Dossier ohne Anmeldung zeigt kein fremdes Zertifikat', async ({ page }) => {
    await openSic(page, '/sic/zertifikat')
    await expect(page.locator('#sic-pdf')).toHaveCount(0)
  })

  test('Sicherheits-Header sind gesetzt', async ({ request }) => {
    test.skip(local, 'Header kommen erst mit dem Produktions-Build (next.config.js, Host-Regel)')
    const res = await request.get('/')
    const csp = res.headers()['content-security-policy'] || ''
    expect(csp).toContain("frame-ancestors 'none'")
    expect(csp).not.toContain('unsafe-eval')
    expect(res.headers()['x-content-type-options']).toBe('nosniff')
  })

  test('Marktplatz-Routen sind auf dem SIC-Host nicht erreichbar', async ({ request }) => {
    test.skip(local, 'Host-Trennung greift nur auf swissimmocert.ch')
    const res = await request.get('/api/stripe/create-payment-intent', { maxRedirects: 0 })
    expect([301, 302, 307, 308, 404, 405]).toContain(res.status())
  })
})

test.describe('Swiss Immo Cert — Checkout-Start', () => {
  test.skip(process.env.E2E_CHECKOUT !== '1', 'Legt eine Zahlung an — nur mit E2E_CHECKOUT=1 auf Staging')
  test.skip(production, 'Nie gegen Produktion')

  test('Formular führt zum Zahlungsanbieter', async ({ page }) => {
    await openSic(page, '/')
    await page.locator('#sic-hero-first').fill('Erika')
    await page.locator('#sic-hero-last').fill('Muster')
    await page.locator('#sic-hero-email').fill(`e2e+${Date.now()}@beispiel.ch`)
    await page.getByRole('button', { name: 'Zertifikat anlegen' }).click()
    await page.waitForURL(/checkout\.stripe\.com|payrexx\.com/, { timeout: 20_000 })
  })
})
