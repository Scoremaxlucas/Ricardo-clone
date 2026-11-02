/**
 * Swiss Immo Cert — Szenarien von Kauf bis Widerruf, gegen einen lokalen Testserver.
 * Start und Voraussetzungen: docs/sic-e2e-szenarien.md. Ohne sichere Umgebung wird alles übersprungen.
 */
import { expect, test, type Page } from '@playwright/test'
import {
  adminContext,
  assertSafeEnvironment,
  buyCertificate,
  certByEmail,
  db,
  deliverStripeEvent,
  E2E,
  FILES,
  isoDay,
  linksIn,
  loginWithMagicLink,
  mailsTo,
  moduleStatus,
  newSicContext,
  SIC_PREVIEW_STATE,
  payOnStripe,
  review,
  runCron,
  startCheckoutApi,
  stripe,
  uniqueEmail,
  uploadApi,
  waitForMail,
} from './helpers'

const unsafe = assertSafeEnvironment()
test.skip(unsafe.length > 0, `Szenario-Tests übersprungen: ${unsafe.join(', ')}`)
test.use({ baseURL: E2E.baseUrl, storageState: SIC_PREVIEW_STATE, bypassCSP: true })
test.setTimeout(180_000)

/**
 * Dritte Sicherung neben Startskript und Umgebungsprüfung: Liest der Server wirklich
 * die Testdatenbank? Ein widerrufenes Markierungs-Zertifikat existiert nur dort — nur
 * dann zeigt die (rein lesende) Prüfseite «widerrufen». Sonst bricht alles ab.
 */
test.beforeAll(async ({ request }) => {
  // Bremszähler früherer Läufe zurücksetzen — nur in der Testdatenbank (siehe assertSafeEnvironment).
  await db.rateLimit.deleteMany({ where: { identifier: { startsWith: 'sic-' } } })
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  const code = `SIC-2026-${Array.from({ length: 8 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join('')}`
  await db.sicCertificate.create({
    data: { email: uniqueEmail('probe'), certificateCode: code, status: 'REVOKED' },
  })
  const html = await (await request.get(`/sic/verify/${code}`)).text()
  if (!/widerrufen/i.test(html)) {
    throw new Error('ABBRUCH: Der Testserver liest nicht die Testdatenbank.')
  }
})

const TODAY = isoDay(0)
const CLEAN_EXTRACT = {
  extractDate: isoDay(-5),
  office: 'Betreibungsamt Zürich 4',
  proceedings: 'clean',
}
const VALID_ID = { documentType: 'ch_pass', validUntil: isoDay(2000) }

async function verifyPage(page: Page, code: string) {
  await page.goto(`/sic/verify/${code}`)
  return (await page.locator('main, body').first().innerText()).replace(/\s+/g, ' ')
}

// ─────────────────────────────────────────────────────────────────────────────
test.describe
  .serial('1 · Einzelperson: Kauf über die Website bis zum Zertifikat mit Siegel', () => {
  const email = uniqueEmail('single')
  let page: Page
  let certId = ''
  let code = ''

  test.beforeAll(async ({ browser }) => {
    page = await (await newSicContext(browser)).newPage()
  })
  test.afterAll(async () => page.context().close())

  test('Formular auf der Landing → Stripe (Testkarte) → Erfolgsseite → Dossier', async () => {
    await page.goto('/?subdomain=sic')
    await page.getByPlaceholder('Vorname').first().fill('Anna')
    await page.getByPlaceholder('Nachname').first().fill('Muster')
    await page.getByPlaceholder('name@beispiel.ch').first().fill(email)
    await page.locator('#anlegen button[type=submit]').click()
    await payOnStripe(page, { name: 'Anna Muster' })
    await expect
      .poll(async () => (await certByEmail(email))?.id ?? null, { timeout: 30_000 })
      .not.toBeNull()
    const cert = (await certByEmail(email))!
    certId = cert.id
    code = cert.certificateCode
    expect(cert.modules.map(m => m.status).sort()).toEqual([
      'PENDING_DOCS',
      'PENDING_DOCS',
      'PENDING_DOCS',
      'PENDING_DOCS',
    ])
    expect(cert.payments.some(p => p.status === 'PAID')).toBe(true)
    await waitForMail(email, /Quittung|Zahlung|bezahlt/i)
    await page.goto('/sic/zertifikat')
    await expect(page.getByRole('heading', { name: 'Mein Zertifikat' })).toBeVisible()
  })

  test('Vor der ersten Freigabe gibt es kein PDF und keine gültige Prüfseite', async () => {
    const pdf = await page.request.get(`/api/sic/certificate/${code}/pdf`)
    expect(pdf.status()).toBe(403)
    expect(await verifyPage(page, code)).not.toMatch(/Ausgestellt für/)
  })

  test('Upload-Regeln: falsche Datei abgelehnt, echte Datei geht in Prüfung', async () => {
    expect((await uploadApi(page.request, 'BONITAET', FILES.fake())).status).toBeGreaterThanOrEqual(
      400
    )
    // Über die Oberfläche hochladen wie ein Kunde.
    await page.goto('/sic/zertifikat')
    const mod = page.locator('#modul-BONITAET')
    if ((await mod.locator('> button').getAttribute('aria-expanded')) === 'false')
      await mod.locator('> button').click()
    await mod.locator('input[type=file]').setInputFiles(FILES.pdf())
    await expect.poll(() => moduleStatus(email, 'BONITAET'), { timeout: 20_000 }).toBe('IN_REVIEW')
  })

  test('Prüfer: Verlustscheine und offene Betreibungen lassen sich nicht freigeben', async ({
    browser,
  }) => {
    const ctx = await newSicContext(browser)
    await adminContext(ctx)
    for (const proceedings of ['loss', 'open']) {
      const r = await review(ctx.request, {
        certificateId: certId,
        moduleKind: 'BONITAET',
        action: 'approve',
        facts: { ...CLEAN_EXTRACT, proceedings },
      })
      expect(r.status, `${proceedings}: ${r.body.message}`).toBeGreaterThanOrEqual(400)
    }
    const old = await review(ctx.request, {
      certificateId: certId,
      moduleKind: 'BONITAET',
      action: 'approve',
      facts: { ...CLEAN_EXTRACT, extractDate: isoDay(-100) },
    })
    expect(old.status, 'Auszug älter als 3 Monate').toBeGreaterThanOrEqual(400)
    const ok = await review(ctx.request, {
      certificateId: certId,
      moduleKind: 'BONITAET',
      action: 'approve',
      facts: CLEAN_EXTRACT,
    })
    expect(ok.status, ok.body.message).toBe(200)
    await ctx.close()
    expect(await moduleStatus(email, 'BONITAET')).toBe('VERIFIED')
  })

  test('Nur Betreibungsauszug geprüft: «Stand der Prüfung», kein Siegel, Gültig bis = Auszug + 3 Monate', async () => {
    await waitForMail(email, /Stand der Prüfung|geprüft/i)
    const pdf = await page.request.get(`/api/sic/certificate/${code}/pdf`)
    expect(pdf.status()).toBe(200)
    expect(pdf.headers()['content-type']).toContain('application/pdf')
    expect(pdf.headers()['content-disposition']).toContain('-Stand.pdf')
    const text = await verifyPage(page, code)
    expect(text).toMatch(/STAND DER PRÜFUNG/i)
    expect(text).toContain('Keine Einträge im Betreibungsregister')
    expect(text).toMatch(/Gültig bis/i)
    expect(text).not.toMatch(/MIETER-ZERTIFIKAT GEPRÜFT/)
    const cert = (await certByEmail(email))!
    expect(cert.expiresAt?.toISOString().slice(0, 10)).toBe(
      new Date(
        Date.UTC(
          new Date(CLEAN_EXTRACT.extractDate).getUTCFullYear(),
          new Date(CLEAN_EXTRACT.extractDate).getUTCMonth() + 3,
          new Date(CLEAN_EXTRACT.extractDate).getUTCDate()
        )
      )
        .toISOString()
        .slice(0, 10)
    )
  })

  test('Ausweis: abgelaufener wird nicht freigegeben, gültiger gibt das Siegel', async ({
    browser,
  }) => {
    expect((await uploadApi(page.request, 'AUFENTHALT', FILES.png())).status).toBe(200)
    const ctx = await newSicContext(browser)
    await adminContext(ctx)
    const expired = await review(ctx.request, {
      certificateId: certId,
      moduleKind: 'AUFENTHALT',
      action: 'approve',
      facts: { documentType: 'permit_b', validUntil: TODAY },
    })
    expect(expired.status).toBeGreaterThanOrEqual(400)
    const ok = await review(ctx.request, {
      certificateId: certId,
      moduleKind: 'AUFENTHALT',
      action: 'approve',
      facts: VALID_ID,
    })
    expect(ok.status, ok.body.message).toBe(200)
    await ctx.close()
    const pdf = await page.request.get(`/api/sic/certificate/${code}/pdf`)
    expect(pdf.headers()['content-disposition']).not.toContain('-Stand.pdf')
    const text = await verifyPage(page, code)
    expect(text).toMatch(/MIETER-ZERTIFIKAT/)
    expect(text).toMatch(/GEPRÜFT/)
    expect(text).toContain('2 von 4 Angaben geprüft')
  })

  test('«Selbständig» vermerken: steht als ANGABE da, Upload danach gesperrt, zurücknehmen geht', async () => {
    await page.goto('/sic/zertifikat')
    const mod = page.locator('#modul-ARBEIT_EINKOMMEN')
    if ((await mod.locator('> button').getAttribute('aria-expanded')) === 'false')
      await mod.locator('> button').click()
    await mod.getByRole('button', { name: 'Selbständig erwerbend' }).click()
    await expect.poll(() => moduleStatus(email, 'ARBEIT_EINKOMMEN')).toBe('NOT_APPLICABLE')
    expect((await uploadApi(page.request, 'ARBEIT_EINKOMMEN')).status).toBe(409)
    const text = await verifyPage(page, code)
    expect(text).toContain('Selbständig erwerbend')
    expect(text).toContain('ANGABE')
    expect(text).toContain('2 von 4 Angaben geprüft')
    // Zurücknehmen und als Angestellte prüfen lassen — befristet ohne Enddatum wird abgelehnt.
    const back = await page.request.post('/api/sic/income-group', { data: { group: null } })
    expect(back.status()).toBe(200)
    expect(await moduleStatus(email, 'ARBEIT_EINKOMMEN')).toBe('PENDING_DOCS')
  })

  test('Lohn: befristet ohne Enddatum blockiert, mit Enddatum gedruckt', async ({ browser }) => {
    expect((await uploadApi(page.request, 'ARBEIT_EINKOMMEN')).status).toBe(200)
    const ctx = await newSicContext(browser)
    await adminContext(ctx)
    const facts = {
      incomeBand: '80_100k',
      employmentType: 'befristet',
      employedSince: '2025-01-01',
      noticeGiven: 'no',
      employerName: 'Muster AG',
    }
    expect(
      (
        await review(ctx.request, {
          certificateId: certId,
          moduleKind: 'ARBEIT_EINKOMMEN',
          action: 'approve',
          facts,
        })
      ).status
    ).toBeGreaterThanOrEqual(400)
    const ok = await review(ctx.request, {
      certificateId: certId,
      moduleKind: 'ARBEIT_EINKOMMEN',
      action: 'approve',
      facts: { ...facts, employedUntil: isoDay(400) },
    })
    expect(ok.status, ok.body.message).toBe(200)
    await ctx.close()
    const text = await verifyPage(page, code)
    expect(text).toMatch(
      /Angestellt bei Muster AG seit 01\.2025, befristet bis \d{2}\.\d{4}, ungekündigt/
    )
    expect(text).toContain('Richtwert 3×-Regel: Miete bis CHF 2’200')
  })

  test('Referenz: Ablehnung mit Grund per Mail, nachreichen, Freigabe mit «Stand Referenz»', async ({
    browser,
  }) => {
    expect((await uploadApi(page.request, 'ZUVERLAESSIGKEIT')).status).toBe(200)
    const ctx = await newSicContext(browser)
    await adminContext(ctx)
    const before = mailsTo(email).length
    const rej = await review(ctx.request, {
      certificateId: certId,
      moduleKind: 'ZUVERLAESSIGKEIT',
      action: 'reject',
      note: 'Auf dem Formular fehlt die Unterschrift.',
    })
    expect(rej.status).toBe(200)
    const mail = await waitForMail(email, /.*/, before)
    expect(mail.html + mail.text).toContain('Auf dem Formular fehlt die Unterschrift.')
    expect(await moduleStatus(email, 'ZUVERLAESSIGKEIT')).toBe('REJECTED')
    expect((await uploadApi(page.request, 'ZUVERLAESSIGKEIT')).status).toBe(200)
    expect(await moduleStatus(email, 'ZUVERLAESSIGKEIT')).toBe('IN_REVIEW')
    const ok = await review(ctx.request, {
      certificateId: certId,
      moduleKind: 'ZUVERLAESSIGKEIT',
      action: 'approve',
      facts: { tenancyFrom: '2021-01-01', paymentBehaviour: 'always_on_time' },
    })
    expect(ok.status, ok.body.message).toBe(200)
    await ctx.close()
    const text = await verifyPage(page, code)
    expect(text).toContain('4 von 4 Angaben geprüft')
    expect(text).toMatch(/Mietverhältnis seit 01\.2021 \(.*Stand Referenz \d{2}\.\d{2}\.\d{4}\)/)
  })

  test('Dossier zeigt alles als geprüft, PDF hat das Siegel', async () => {
    await page.goto('/sic/zertifikat')
    await expect(page.getByText('Dein Mieter-Zertifikat ist bereit')).toBeVisible()
    const pdf = await page.request.get(`/api/sic/certificate/${code}/pdf`)
    expect(pdf.status()).toBe(200)
    expect((await pdf.body()).length).toBeGreaterThan(10_000)
  })

  test('Neuer Prüf-Code: alter Link zeigt «ersetzt», neuer funktioniert', async () => {
    const res = await page.request.post('/api/sic/certificate/regenerate-code')
    expect(res.status(), await res.text()).toBe(200)
    const cert = (await certByEmail(email))!
    expect(cert.certificateCode).not.toBe(code)
    expect(await verifyPage(page, code)).toMatch(/ersetzt|neuer Code/i)
    expect(await verifyPage(page, cert.certificateCode)).toContain('4 von 4 Angaben geprüft')
    code = cert.certificateCode
  })

  test('Fremder Zugriff: anderes Zertifikat und Prüfer-API bleiben zu', async ({ browser }) => {
    const stranger = await newSicContext(browser)
    expect((await stranger.request.get(`/api/sic/certificate/${code}/pdf`)).status()).toBe(401)
    expect([401, 403]).toContain(
      (await stranger.request.post('/api/sic/admin/review', { data: {} })).status()
    )
    expect((await stranger.request.get('/api/cron/sic-certificate-expiry')).status()).toBe(401)
    await stranger.close()
  })

  test('Abmelden und mit Anmeldelink wieder anmelden', async () => {
    await page.request.post('/api/sic/logout')
    await page.goto('/sic/zertifikat')
    await expect(page.getByRole('button', { name: /Anmeldelink senden/ })).toBeVisible()
    await loginWithMagicLink(page, email)
    await expect(page.getByRole('heading', { name: 'Mein Zertifikat' })).toBeVisible()
    // Angemeldet: kein «Zertifikat anlegen» mehr in der Kopfzeile.
    await expect(page.locator('header').getByText(/Zertifikat anlegen|^Anlegen$/)).toHaveCount(0)
  })

  // ── Zeitabläufe: Daten in der Testdatenbank vordatieren, dann den Cron laufen lassen ──

  test('Ausweis kürzt das Zertifikat: Erinnerung zeigt auf den kostenlosen neuen Ausweis', async () => {
    const idModule = (await certByEmail(email))!.modules.find(m => m.moduleKind === 'AUFENTHALT')!
    const idEnd = isoDay(10)
    await db.sicCertificateModule.update({
      where: { id: idModule.id },
      data: { verifiedFacts: { documentType: 'permit_b', validUntil: idEnd } },
    })
    await db.sicCertificate.update({
      where: { id: certId },
      data: {
        expiresAt: new Date(`${idEnd}T00:00:00Z`),
        expiryReminder14dSentAt: null,
        expiryReminder3dSentAt: null,
      },
    })
    const before = mailsTo(email).length
    await runCron(page.request)
    const mail = await waitForMail(email, /Ausweis läuft/, before)
    expect(linksIn(mail).join(' ')).toContain('/sic/zertifikat')
    await page.goto('/sic/zertifikat')
    const mod = page.locator('#modul-AUFENTHALT')
    if ((await mod.locator('> button').getAttribute('aria-expanded')) === 'false')
      await mod.locator('> button').click()
    await expect(mod.getByRole('button', { name: 'Neuen Ausweis einreichen' })).toBeVisible()
  })

  test('Abgelaufen wegen Ausweis: Mail, Prüfseite «abgelaufen», neuer Ausweis macht es wieder gültig', async ({
    browser,
  }) => {
    await db.sicCertificate.update({
      where: { id: certId },
      data: { expiresAt: new Date(Date.now() - 60_000) },
    })
    const before = mailsTo(email).length
    await runCron(page.request)
    await waitForMail(email, /neuer Ausweis genügt/, before)
    expect((await certByEmail(email))!.status).toBe('EXPIRED')
    expect(await verifyPage(page, code)).toMatch(/abgelaufen/i)

    const renew = await page.request.post('/api/sic/id-renew')
    expect(renew.status(), await renew.text()).toBe(200)
    expect(await moduleStatus(email, 'AUFENTHALT')).toBe('PENDING_DOCS')
    expect((await uploadApi(page.request, 'AUFENTHALT', FILES.png())).status).toBe(200)
    const ctx = await newSicContext(browser)
    await adminContext(ctx)
    const ok = await review(ctx.request, {
      certificateId: certId,
      moduleKind: 'AUFENTHALT',
      action: 'approve',
      facts: VALID_ID,
    })
    expect(ok.status, ok.body.message).toBe(200)
    await ctx.close()
    const cert = (await certByEmail(email))!
    expect(cert.status).toBe('ACTIVE')
    expect(cert.expiresAt!.getTime()).toBeGreaterThan(Date.now() + 30 * 86_400_000)
    expect(await verifyPage(page, code)).toContain('4 von 4 Angaben geprüft')
  })

  test('Frühe Verlängerung (CHF 30, Testkarte): alte Werte bleiben sichtbar bis der neue Auszug geprüft ist', async ({
    browser,
  }) => {
    const res = await startCheckoutApi(page.request, { email, renewal: true })
    expect(res.status, res.message).toBe(200)
    await page.goto(res.url!)
    await payOnStripe(page)
    await expect
      .poll(() => moduleStatus(email, 'BONITAET'), { timeout: 30_000 })
      .toBe('PENDING_DOCS')
    // Zweite Verlängerung, solange eine offen ist: gesperrt.
    expect((await startCheckoutApi(page.request, { email, renewal: true })).status).toBe(409)
    const text = await verifyPage(page, code)
    expect(text).toContain('Keine Einträge im Betreibungsregister')
    expect(text).toMatch(/MIETER-ZERTIFIKAT/)

    expect((await uploadApi(page.request, 'BONITAET')).status).toBe(200)
    const ctx = await newSicContext(browser)
    await adminContext(ctx)
    const fresh = { extractDate: TODAY, office: 'Betreibungsamt Zürich 4', proceedings: 'none' }
    const ok = await review(ctx.request, {
      certificateId: certId,
      moduleKind: 'BONITAET',
      action: 'approve',
      facts: fresh,
    })
    expect(ok.status, ok.body.message).toBe(200)
    await ctx.close()
    expect(await verifyPage(page, code)).toContain('Keine offenen Betreibungen')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
test.describe
  .serial('2 · Paar: zwei Personen, Verlustscheine bei Person 2, Erstattung und Neuanfang', () => {
  const email = uniqueEmail('couple')
  let page: Page
  let certId = ''
  let code = ''

  test.beforeAll(async ({ browser }) => {
    page = await (await newSicContext(browser)).newPage()
  })
  test.afterAll(async () => page.context().close())

  test('Kauf für zwei Personen', async () => {
    const cert = await buyCertificate(page, {
      email,
      first: 'Anna',
      last: 'Muster',
      first2: 'Beat',
      last2: 'Beispiel',
    })
    certId = cert.id
    code = cert.certificateCode
    expect(cert.householdKind).toBe('COUPLE')
  })

  test('Betreibung: erst mit zwei Auszügen in Prüfung, Verlustscheine bei Person 2 blockieren', async ({
    browser,
  }) => {
    expect((await uploadApi(page.request, 'BONITAET')).status).toBe(200)
    expect(await moduleStatus(email, 'BONITAET')).toBe('PENDING_DOCS')
    expect((await uploadApi(page.request, 'BONITAET')).status).toBe(200)
    expect(await moduleStatus(email, 'BONITAET')).toBe('IN_REVIEW')
    const ctx = await newSicContext(browser)
    await adminContext(ctx)
    const both = {
      ...CLEAN_EXTRACT,
      extractDate2: isoDay(-20),
      office2: 'Betreibungsamt Bern',
      proceedings2: 'loss',
    }
    expect(
      (
        await review(ctx.request, {
          certificateId: certId,
          moduleKind: 'BONITAET',
          action: 'approve',
          facts: both,
        })
      ).status
    ).toBeGreaterThanOrEqual(400)
    const ok = await review(ctx.request, {
      certificateId: certId,
      moduleKind: 'BONITAET',
      action: 'approve',
      facts: { ...both, proceedings2: 'none' },
    })
    expect(ok.status, ok.body.message).toBe(200)
    await ctx.close()
    // Gültigkeit hängt am älteren Auszug.
    const cert = (await certByEmail(email))!
    const older = new Date(`${isoDay(-20)}T00:00:00Z`)
    expect(cert.expiresAt!.toISOString().slice(0, 10)).toBe(
      new Date(Date.UTC(older.getUTCFullYear(), older.getUTCMonth() + 3, older.getUTCDate()))
        .toISOString()
        .slice(0, 10)
    )
    const text = await verifyPage(page, code)
    expect(text).toContain('Anna Muster')
    expect(text).toContain('Beat Beispiel')
    expect(text).toContain('Keine Einträge im Betreibungsregister')
    expect(text).toContain('Keine offenen Betreibungen')
  })

  test('Ausweis: läuft einer bald ab, reicht das Paar nur diesen einen neu ein', async ({
    browser,
  }) => {
    expect((await uploadApi(page.request, 'AUFENTHALT', FILES.png())).status).toBe(200)
    expect((await uploadApi(page.request, 'AUFENTHALT', FILES.png())).status).toBe(200)
    const ctx = await newSicContext(browser)
    await adminContext(ctx)
    const soon = isoDay(20)
    const first = await review(ctx.request, {
      certificateId: certId,
      moduleKind: 'AUFENTHALT',
      action: 'approve',
      facts: {
        documentType: 'permit_b',
        validUntil: soon,
        documentType2: 'ch_pass',
        validUntil2: isoDay(2000),
      },
    })
    expect(first.status, first.body.message).toBe(200)
    expect((await certByEmail(email))!.expiresAt!.toISOString().slice(0, 10)).toBe(soon)

    await page.goto('/sic/zertifikat')
    const mod = page.locator('#modul-AUFENTHALT')
    if ((await mod.locator('> button').getAttribute('aria-expanded')) === 'false')
      await mod.locator('> button').click()
    await expect(mod.getByText('Der Ausweis von Anna Muster')).toBeVisible()
    await mod.getByRole('button', { name: 'Neuen Ausweis einreichen' }).click()
    await expect.poll(() => moduleStatus(email, 'AUFENTHALT')).toBe('PENDING_DOCS')
    // Beide bisherigen Dateien bleiben — ein neuer Upload genügt für die Prüfung.
    expect(
      (await certByEmail(email))!.documents.filter(d => d.moduleKind === 'AUFENTHALT')
    ).toHaveLength(2)
    expect((await uploadApi(page.request, 'AUFENTHALT', FILES.png())).status).toBe(200)
    expect(await moduleStatus(email, 'AUFENTHALT')).toBe('IN_REVIEW')
    // Bis zur Prüfung steht der bisherige Ausweis weiter drauf.
    expect(await verifyPage(page, code)).toContain('Aufenthaltsbewilligung B')
    const renewed = await review(ctx.request, {
      certificateId: certId,
      moduleKind: 'AUFENTHALT',
      action: 'approve',
      facts: {
        documentType: 'permit_c',
        validUntil: isoDay(1500),
        documentType2: 'ch_pass',
        validUntil2: isoDay(2000),
      },
    })
    expect(renewed.status, renewed.body.message).toBe(200)
    await ctx.close()
    const cert = (await certByEmail(email))!
    expect(cert.expiresAt!.getTime()).toBeGreaterThan(new Date(`${soon}T00:00:00Z`).getTime())
    expect(await verifyPage(page, code)).toContain('Aufenthaltsbewilligung C')
  })

  test('Lohn: nur Person 1 angestellt, Person 2 pensioniert — Richtwert aus einem Einkommen', async ({
    browser,
  }) => {
    expect((await uploadApi(page.request, 'ARBEIT_EINKOMMEN')).status).toBe(200)
    expect((await uploadApi(page.request, 'ARBEIT_EINKOMMEN')).status).toBe(200)
    const ctx = await newSicContext(browser)
    await adminContext(ctx)
    const ok = await review(ctx.request, {
      certificateId: certId,
      moduleKind: 'ARBEIT_EINKOMMEN',
      action: 'approve',
      facts: {
        incomeBand: '80_100k',
        employmentType: 'unbefristet',
        employedSince: '2020-01-01',
        noticeGiven: 'no',
        incomeGroup2: 'retired',
      },
    })
    expect(ok.status, ok.body.message).toBe(200)
    await ctx.close()
    const text = await verifyPage(page, code)
    expect(text).toContain('Pensioniert')
    expect(text).toContain('Richtwert 3×-Regel, Einkommen Anna Muster: Miete bis CHF 2’200')
  })

  test('Volle Erstattung im Stripe-Dashboard: Webhook widerruft das Zertifikat, Mail', async ({
    request,
  }) => {
    const before = mailsTo(email).length
    const paid = (await certByEmail(email))!.payments.find(
      p => p.status === 'PAID' && p.stripePaymentIntentId
    )!
    await stripe.refunds.create({ payment_intent: paid.stripePaymentIntentId! })
    const charge = (
      await stripe.charges.list({ payment_intent: paid.stripePaymentIntentId!, limit: 1 })
    ).data[0]
    expect(charge.amount_refunded).toBe(charge.amount)
    const res = await deliverStripeEvent(request, 'charge.refunded', charge)
    expect(res.status(), await res.text()).toBe(200)
    await waitForMail(email, /Erstattung|erstattet|widerrufen/i, before)
    const cert = (await certByEmail(email))!
    expect(cert.status).toBe('REVOKED')
    expect(await verifyPage(page, code)).toMatch(/widerrufen/i)
    expect((await uploadApi(page.request, 'AUFENTHALT', FILES.png())).status).toBe(403)
    // Prüfer kann nichts mehr freigeben.
  })

  test('Neuanfang nach voller Erstattung: neuer Kauf erzeugt ein frisches Zertifikat mit neuem Code', async () => {
    const res = await startCheckoutApi(page.request, {
      email,
      firstName: 'Anna',
      lastName: 'Muster',
    })
    expect(res.status, res.message).toBe(200)
    await page.goto(res.url!)
    await payOnStripe(page)
    await expect
      .poll(async () => (await certByEmail(email))?.status, { timeout: 30_000 })
      .toBe('ACTIVE')
    const cert = (await certByEmail(email))!
    expect(cert.certificateCode).not.toBe(code)
    expect(cert.modules.every(m => m.status === 'PENDING_DOCS')).toBe(true)
    expect(await verifyPage(page, code)).toMatch(/widerrufen/i)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
test.describe.serial('3 · Zahlung: Abbruch, Webhook, Missbrauch', () => {
  test('Abgebrochene Zahlung legt kein Zertifikat an', async ({ page }) => {
    const email = uniqueEmail('abort')
    const res = await startCheckoutApi(page.request, {
      email,
      firstName: 'Abbruch',
      lastName: 'Test',
    })
    expect(res.status).toBe(200)
    await page.goto(res.url!)
    await page.waitForURL(/checkout\.stripe\.com/)
    await page.goto('/sic/checkout/abbruch')
    await expect(page.locator('body')).toContainText(
      /abgebrochen|nicht abgeschlossen|keine Zahlung/i
    )
    expect(await certByEmail(email)).toBeNull()
  })

  test('Webhook: gefälschte Signatur abgelehnt, echtes Event idempotent', async ({
    page,
    request,
  }) => {
    const bad = await request.post('/api/stripe/webhook', {
      data: '{}',
      headers: { 'stripe-signature': 't=1,v1=falsch', 'content-type': 'application/json' },
    })
    expect(bad.status()).toBe(400)

    const email = uniqueEmail('webhook')
    const res = await startCheckoutApi(page.request, { email, firstName: 'Web', lastName: 'Hook' })
    await page.goto(res.url!)
    // Bezahlen, aber die Erfolgsseite nicht abwarten — der Webhook soll allein reichen.
    await page.route('**/api/sic/checkout/confirm**', r => r.abort())
    await payOnStripe(page)
    const sessionId = new URL(page.url()).searchParams.get('session_id')!
    expect(await certByEmail(email)).toBeNull()
    const session = await stripe.checkout.sessions.retrieve(sessionId)
    const payload = JSON.stringify({
      id: `evt_e2e_${Date.now()}`,
      object: 'event',
      type: 'checkout.session.completed',
      data: { object: session },
    })
    const send = () =>
      request.post('/api/stripe/webhook', {
        data: payload,
        headers: {
          'stripe-signature': stripe.webhooks.generateTestHeaderString({
            payload,
            secret: E2E.webhookSecret,
          }),
          'content-type': 'application/json',
        },
      })
    expect((await send()).status()).toBe(200)
    expect((await send()).status()).toBe(200)
    const cert = await certByEmail(email)
    expect(cert).not.toBeNull()
    expect(cert!.payments.filter(p => p.status === 'PAID')).toHaveLength(1)
  })

  test('Anmeldelink: unbekannte Adresse verrät nichts, Link nur einmal verwendbar', async ({
    page,
  }) => {
    const unknown = await page.request.post('/api/sic/magic-link', {
      data: { email: uniqueEmail('nobody') },
    })
    expect(unknown.status()).toBeLessThan(400)
    const email = uniqueEmail('once')
    await buyCertificate(page, { email, first: 'Ein', last: 'Mal' })
    await page.request.post('/api/sic/logout')
    const before = mailsTo(email).length
    await page.request.post('/api/sic/magic-link', { data: { email } })
    const mail = await waitForMail(email, /Anmeldelink/, before)
    const link = linksIn(mail)
      .find(u => u.includes('/sic/anmelden'))!
      .replace(/^https?:\/\/[^/]+/, E2E.baseUrl)
    await page.goto(link)
    await page.getByRole('button', { name: /^Anmelden/ }).click()
    await page.waitForURL(/\/sic\/(zertifikat|dossier)/)
    await page.request.post('/api/sic/logout')
    await page.goto(link)
    // Ein verbrauchter Link führt nicht mehr ins Dossier.
    await expect(page.locator('body')).toContainText(/ungültig oder abgelaufen/i)
    expect(page.url()).not.toMatch(/\/sic\/zertifikat$/)
  })
})
