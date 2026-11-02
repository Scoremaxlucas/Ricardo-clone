/**
 * Hilfen für die Szenario-Tests (e2e/sic/scenarios.spec.ts).
 *
 * Laufen nur gegen einen lokalen Testserver mit eigener Testdatenbank (Neon-Branch
 * ohne Kundendaten), Stripe im Testmodus, Mail-Ablage statt Versand und lokalem
 * Dateispeicher. Siehe docs/sic-e2e-szenarien.md.
 */
import {
  expect,
  test,
  type APIRequestContext,
  type Browser,
  type BrowserContext,
  type Page,
} from '@playwright/test'
import { PrismaClient } from '@prisma/client'
import * as nextAuthJwt from 'next-auth/jwt'
import { readdirSync, readFileSync } from 'fs'
import Stripe from 'stripe'

export const E2E = {
  baseUrl: process.env.E2E_BASE_URL || 'http://localhost:3100',
  mailDir: process.env.EMAIL_SINK_DIR || '',
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
  cronSecret: process.env.CRON_SECRET || '',
  nextAuthSecret: process.env.NEXTAUTH_SECRET || '',
  adminEmail: (process.env.SIC_ADMIN_EMAILS || '').split(',')[0]?.trim() || '',
}

/** Bricht ab, bevor irgendetwas gegen Produktion laufen könnte. */
export function assertSafeEnvironment() {
  const db = process.env.DATABASE_URL || ''
  const problems: string[] = []
  if (process.env.E2E_SCENARIOS !== '1') problems.push('E2E_SCENARIOS=1 fehlt')
  if (!/^http:\/\/(localhost|127\.0\.0\.1)/.test(E2E.baseUrl))
    problems.push('E2E_BASE_URL ist nicht lokal')
  if (!db || db.includes(process.env.E2E_FORBIDDEN_DB_HOST || 'ep-muddy-king'))
    problems.push('DATABASE_URL zeigt nicht auf die Testdatenbank')
  if (!(process.env.STRIPE_SECRET_KEY || '').startsWith('sk_test_'))
    problems.push('Stripe ist nicht im Testmodus')
  if (!E2E.mailDir) problems.push('EMAIL_SINK_DIR fehlt')
  if (!process.env.SIC_BLOB_LOCAL_DIR) problems.push('SIC_BLOB_LOCAL_DIR fehlt')
  return problems
}

export const db = new PrismaClient()
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_x', {
  apiVersion: '2023-10-16' as never,
})

export function uniqueEmail(tag: string): string {
  return `e2e-${tag}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}@e2e.test`
}

// ── E-Mail-Ablage ─────────────────────────────────────────────────────────────

export type SinkMail = { to: string; subject: string; html: string; text: string; file: string }

export function mailsTo(email: string): SinkMail[] {
  if (!E2E.mailDir) return []
  let files: string[] = []
  try {
    files = readdirSync(E2E.mailDir)
      .filter(f => f.endsWith('.json'))
      .sort()
  } catch {
    return []
  }
  return files
    .map(f => ({ ...JSON.parse(readFileSync(`${E2E.mailDir}/${f}`, 'utf8')), file: f }) as SinkMail)
    .filter(m => m.to.toLowerCase() === email.toLowerCase())
}

export async function waitForMail(
  email: string,
  subject: RegExp,
  after = 0,
  timeoutMs = 20_000
): Promise<SinkMail> {
  const start = Date.now()
  for (;;) {
    const hit = mailsTo(email)
      .slice(after)
      .find(m => subject.test(m.subject))
    if (hit) return hit
    if (Date.now() - start > timeoutMs) {
      throw new Error(
        `Keine Mail «${subject}» an ${email}. Vorhanden: ${mailsTo(email)
          .map(m => m.subject)
          .join(' | ')}`
      )
    }
    await new Promise(r => setTimeout(r, 400))
  }
}

export function linksIn(mail: SinkMail): string[] {
  return Array.from(
    new Set((mail.html.match(/https?:\/\/[^"'<>\s]+/g) || []).map(u => u.replace(/&amp;/g, '&')))
  )
}

// ── Kauf ──────────────────────────────────────────────────────────────────────

/** Zahlt eine Stripe-Checkout-Seite (Testmodus) mit der Testkarte 4242. */
export async function payOnStripe(page: Page, opts: { name?: string } = {}) {
  await page.waitForURL(/checkout\.stripe\.com/, { timeout: 45_000 })
  // Stripe zeigt Karte je nach Konto als Akkordeon oder direkt.
  const cardTab = page.locator(
    '[data-testid="card-accordion-item-button"], button:has-text("Karte"), button:has-text("Card")'
  )
  if (
    await cardTab
      .first()
      .isVisible({ timeout: 5_000 })
      .catch(() => false)
  )
    await cardTab.first().click()
  await page.locator('#cardNumber').fill('4242 4242 4242 4242')
  await page.locator('#cardExpiry').fill('12 / 34')
  await page.locator('#cardCvc').fill('123')
  const holder = page.locator('#billingName')
  if (await holder.isVisible().catch(() => false)) await holder.fill(opts.name || 'Test Person')
  const country = page.locator('#billingCountry')
  if (await country.isVisible().catch(() => false)) await country.selectOption('CH').catch(() => {})
  const zip = page.locator('#billingPostalCode')
  if (await zip.isVisible().catch(() => false)) await zip.fill('8001')
  await page.locator('[data-testid="hosted-payment-submit-button"], .SubmitButton').first().click()
  await page.waitForURL(/\/sic\/checkout\/erfolg/, { timeout: 60_000 })
}

/** Startet den Checkout über die API und gibt die Stripe-URL zurück. */
export async function startCheckoutApi(
  request: APIRequestContext,
  body: Record<string, unknown>
): Promise<{ status: number; url?: string; message?: string }> {
  // Wie die Website: pro Klick eine neue attemptId (sonst liefert Stripe 5 Minuten lang dieselbe Session).
  const attemptId = `e2e${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`
  // Eigene Test-IP je Kauf: die Bremse (20 Käufe pro Stunde und Adresse) soll die Tests nicht treffen.
  const ip = `10.${Math.floor(Math.random() * 250)}.${Math.floor(Math.random() * 250)}.${Math.floor(Math.random() * 250)}`
  const res = await request.post('/api/sic/checkout', {
    data: { attemptId, ...body },
    headers: { 'x-forwarded-for': ip },
  })
  const json = (await res.json().catch(() => ({}))) as { url?: string; message?: string }
  return { status: res.status(), ...json }
}

export async function buyCertificate(
  page: Page,
  opts: { email: string; first: string; last: string; first2?: string; last2?: string }
) {
  const res = await startCheckoutApi(page.request, {
    email: opts.email,
    firstName: opts.first,
    lastName: opts.last,
    ...(opts.first2
      ? { firstName2: opts.first2, lastName2: opts.last2, householdKind: 'COUPLE' }
      : {}),
  })
  expect(res.status, res.message).toBe(200)
  expect(res.url).toContain('checkout.stripe.com')
  await page.goto(res.url!)
  await payOnStripe(page, { name: `${opts.first} ${opts.last}` })
  await expect(
    page
      .locator('main')
      .getByText(/Zertifikat|bezahlt|Zahlung/i)
      .first()
  ).toBeVisible()
  await expect
    .poll(async () => (await certByEmail(opts.email))?.id ?? null, { timeout: 30_000 })
    .not.toBeNull()
  return (await certByEmail(opts.email))!
}

export function certByEmail(email: string) {
  return db.sicCertificate.findUnique({
    where: { email },
    include: { modules: true, documents: true, payments: { orderBy: { createdAt: 'asc' } } },
  })
}

// ── Anmeldung ─────────────────────────────────────────────────────────────────

export async function loginWithMagicLink(page: Page, email: string) {
  const before = mailsTo(email).length
  const res = await page.request.post('/api/sic/magic-link', { data: { email } })
  expect(res.status()).toBeLessThan(400)
  const mail = await waitForMail(email, /Anmeldelink|öffnet dein Zertifikat/, before)
  const link = linksIn(mail).find(u => u.includes('/sic/anmelden') || u.includes('token='))
  expect(link, 'Anmeldelink in der Mail').toBeTruthy()
  await page.goto(link!.replace(/^https?:\/\/[^/]+/, E2E.baseUrl))
  await page.getByRole('button', { name: /^Anmelden/ }).click()
  await page.waitForURL(/\/sic\/(zertifikat|dossier)/)
}

// ── Prüfer ────────────────────────────────────────────────────────────────────

let adminUserId: string | null = null

export async function adminContext(context: BrowserContext) {
  if (!adminUserId) {
    const user = await db.user.upsert({
      where: { email: E2E.adminEmail },
      create: { email: E2E.adminEmail, name: 'E2E Prüfer' },
      update: {},
    })
    adminUserId = user.id
  }
  // Die Projekt-Typen erweitern 'next-auth/jwt' und verdecken dabei `encode`.
  const { encode } = nextAuthJwt as unknown as {
    encode: (p: { token: Record<string, unknown>; secret: string }) => Promise<string>
  }
  const token = await encode({
    token: { id: adminUserId, sub: adminUserId, email: E2E.adminEmail, name: 'E2E Prüfer' },
    secret: E2E.nextAuthSecret,
  })
  await context.addCookies([{ name: 'next-auth.session-token', value: token, url: E2E.baseUrl }])
}

export async function review(
  request: APIRequestContext,
  body: {
    certificateId: string
    moduleKind: string
    action: 'approve' | 'reject'
    facts?: Record<string, string>
    note?: string
  }
) {
  const res = await request.post('/api/sic/admin/review', { data: body })
  return {
    status: res.status(),
    body: (await res.json().catch(() => ({}))) as {
      ok?: boolean
      message?: string
      blockers?: string[]
    },
  }
}

// ── Kunde ─────────────────────────────────────────────────────────────────────

/** Minimal gültige Dateien (Signatur-Prüfung im Upload). */
export const FILES = {
  pdf: () => ({
    name: 'nachweis.pdf',
    mimeType: 'application/pdf',
    buffer: Buffer.from('%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF\n'),
  }),
  png: () => ({
    name: 'ausweis.png',
    mimeType: 'image/png',
    buffer: Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      'base64'
    ),
  }),
  fake: () => ({
    name: 'virus.pdf',
    mimeType: 'application/pdf',
    buffer: Buffer.from('MZ not a pdf'),
  }),
}

export async function uploadApi(
  request: APIRequestContext,
  moduleKind: string,
  file = FILES.pdf()
) {
  const res = await request.post('/api/sic/documents', { multipart: { moduleKind, file } })
  return {
    status: res.status(),
    body: (await res.json().catch(() => ({}))) as { ok?: boolean; message?: string },
  }
}

export async function moduleStatus(email: string, kind: string) {
  const cert = await certByEmail(email)
  return cert?.modules.find(m => m.moduleKind === kind)?.status
}

export async function runCron(request: APIRequestContext) {
  const res = await request.get('/api/cron/sic-certificate-expiry', {
    headers: { Authorization: `Bearer ${E2E.cronSecret}` },
  })
  expect(res.status(), await res.text()).toBe(200)
}

export function isoDay(offsetDays: number, from = new Date()): string {
  return new Date(from.getTime() + offsetDays * 86_400_000).toISOString().slice(0, 10)
}

/** Lokal öffnet erst das Preview-Cookie die SIC-Fläche (sonst 404 ausserhalb des SIC-Hosts). */
export const SIC_PREVIEW_STATE = {
  cookies: [
    {
      name: 'sic-preview',
      value: '1',
      domain: 'localhost',
      path: '/',
      expires: -1,
      httpOnly: false,
      secure: false,
      sameSite: 'Lax' as const,
    },
  ],
  origins: [],
}

export function newSicContext(browser: Browser) {
  // Geräteprofil des Projekts übernehmen (desktop/mobile), damit auch Handy-Läufe echt sind.
  const device = test.info().project.use
  // bypassCSP: «upgrade-insecure-requests» würde lokal (http) jeden Redirect auf https umbiegen.
  return browser.newContext({
    viewport: device.viewport,
    userAgent: device.userAgent,
    deviceScaleFactor: device.deviceScaleFactor,
    isMobile: device.isMobile,
    hasTouch: device.hasTouch,
    baseURL: E2E.baseUrl,
    storageState: SIC_PREVIEW_STATE,
    locale: 'de-CH',
    bypassCSP: true,
  })
}

/** Stripe-Event signiert an den lokalen Webhook schicken (wie es Stripe live täte). */
export async function deliverStripeEvent(
  request: APIRequestContext,
  type: string,
  object: unknown
) {
  const payload = JSON.stringify({
    id: `evt_e2e_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    object: 'event',
    type,
    data: { object },
  })
  return request.post('/api/stripe/webhook', {
    data: payload,
    headers: {
      'stripe-signature': stripe.webhooks.generateTestHeaderString({
        payload,
        secret: E2E.webhookSecret,
      }),
      'content-type': 'application/json',
    },
  })
}
