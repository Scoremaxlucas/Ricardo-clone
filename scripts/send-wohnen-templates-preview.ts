/**
 * Einmaliger Versand aller Helvenda-Wohnungen-E-Mail-Templates (Dummy-Daten) an eine Adresse.
 *
 * Nutzung:
 *   npm run wohnen:templates-preview -- du@example.com
 *
 * Voraussetzung: RESEND_API_KEY (oder SMTP_USER/SMTP_PASS) wie im restlichen Projekt.
 */

import * as fs from 'fs'
import * as path from 'path'

const envPath = path.join(process.cwd(), '.env')
if (fs.existsSync(envPath)) {
  const envFile = fs.readFileSync(envPath, 'utf-8')
  envFile.split('\n').forEach(line => {
    const trimmed = line.trim()
    if (trimmed && !trimmed.startsWith('#')) {
      const match = trimmed.match(/^([^=:#]+)=(.*)$/)
      if (match) {
        const key = match[1].trim()
        let value = match[2].trim()
        if (
          (value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))
        ) {
          value = value.slice(1, -1)
        }
        if (!process.env[key]) {
          process.env[key] = value
        }
      }
    }
  })
}

import { sendEmail } from '../src/lib/email'
import {
  templateAdminCreditManualReview,
  templateAdminRentalApplicationManualReview,
  templateLandlordNewApplication,
  templateTenantApplicationSubmitted,
  templateTenantCreditExpiryReminder,
  templateTenantCreditManualReview,
  templateTenantCreditRejected,
  templateTenantCreditVerified,
  templateTenantViewingRequested,
} from '../src/lib/rental/emailTemplates'
import type { CreditCheckResult } from '../src/lib/rental/types'

const FROM = 'Helvenda Wohnungen <noreply@helvenda.ch>'

const sampleCreditNoEntries: CreditCheckResult = {
  isValid: true,
  issueDate: '2026-03-15',
  isRecent: true,
  hasEntries: false,
  entryCount: 0,
  totalAmountCategory: 'none',
  fullName: 'Max Muster',
  canton: 'ZH',
}

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function main() {
  const to = process.argv[2]?.trim() || process.env.WOHNEN_TEMPLATE_PREVIEW_EMAIL?.trim()
  if (!to) {
    console.error('Bitte Empfänger angeben: npm run wohnen:templates-preview -- du@example.com')
    process.exit(1)
  }

  const validUntil = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
  const viewingAt = new Date('2026-04-12T15:30:00')
  const expiresOn = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
  const uploadedAt = new Date()

  const payloads = [
    { name: '1 Vermieter — neue Bewerbung', ...templateLandlordNewApplication({
      landlordFirstName: 'Anna',
      listingTitle: '3.5-Zi-Wohnung mit Balkon',
      listingId: 'clxxxxxxxxxxxxxx',
      applicantFullName: 'Max Muster',
      applicantContactPhone: '+41 79 000 00 00',
      applicantContactEmail: 'bewerbung@example.com',
      employmentStatus: 'EMPLOYED',
      employer: 'Muster AG',
      incomeCategory: 'FROM_4000_TO_5500',
      requiresCreditCheck: true,
      creditCheckResult: sampleCreditNoEntries,
      referenceName: 'R. Freund',
      referencePhone: '+41 79 000 00 00',
      applicantMessage: 'Guten Tag, ich interessiere mich sehr für die Wohnung.',
      certificateCode: 'HLV-PREVIEW',
    }) },
    { name: '2 Mieter — Bewerbung übermittelt', ...templateTenantApplicationSubmitted({
      tenantFirstName: 'Max',
      listingTitle: '3.5-Zi-Wohnung mit Balkon',
      addressLine: 'Musterstrasse 1, 8000 Zürich',
      rooms: 3.5,
      rentPerMonth: 1850,
    }) },
    { name: '3 Mieter — Betreibungsregisterauszug ungültig', ...templateTenantCreditRejected({ tenantFirstName: 'Max' }) },
    { name: '4 Mieter — Betreibungsregisterauszug verifiziert', ...templateTenantCreditVerified({
      tenantFirstName: 'Max',
      result: sampleCreditNoEntries,
      validUntil,
    }) },
    { name: '5 Mieter — manuelle Prüfung', ...templateTenantCreditManualReview({ tenantFirstName: 'Max' }) },
    { name: '6 Admin — Credit Check manuell', ...templateAdminCreditManualReview({
      userDisplayName: 'Max Muster',
      userEmail: to,
      userId: 'user_preview_cuid',
      uploadedAt,
      encryptedFileRef: 'https://blob.example/preview/encrypted.bin',
    }) },
    { name: '7 Mieter — Besichtigung', ...templateTenantViewingRequested({
      tenantFirstName: 'Max',
      listingTitle: '3.5-Zi-Wohnung mit Balkon',
      listingAddress: 'Musterstrasse 1, 8000 Zürich',
      viewingAt,
      landlordNote: 'Bitte pünktlich; Treffpunkt vor dem Haupteingang.',
    }) },
    { name: '8 Mieter — Ablauf in 3 Tagen', ...templateTenantCreditExpiryReminder({
      tenantFirstName: 'Max',
      expiresOn,
    }) },
    { name: '9 Admin — Mietanfrage manuell (Legacy)', ...templateAdminRentalApplicationManualReview({
      listingTitle: '3.5-Zi-Wohnung mit Balkon',
      applicationId: 'app_preview_cuid',
    }) },
  ]

  console.log(`Sende ${payloads.length} Preview-Mails an ${to} …\n`)

  for (const p of payloads) {
    const r = await sendEmail({
      to,
      subject: `[Preview] ${p.name} — ${p.subject}`,
      html: p.html,
      text: p.text,
      from: FROM,
    })
    if (!r.success) {
      console.error(`❌ ${p.name}:`, r.error)
    } else {
      console.log(`✅ ${p.name}`)
    }
    await delay(600)
  }

  console.log('\nFertig.')
}

main().catch(e => {
  console.error(e)
  process.exit(1)
})
