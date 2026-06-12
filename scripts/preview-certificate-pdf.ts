/**
 * Rendert ein Vorschau-PDF des Helvenda Qualitätsnachweises mit Mock-Daten,
 * damit Designs ohne Datenbank überprüft werden können.
 *
 * Aufruf: `npx tsx scripts/preview-certificate-pdf.ts`
 * Output: `./preview-certificate.pdf`
 */
import { CertificatePdfDocument } from '@/lib/certificate/CertificatePDF'
import { renderToBuffer } from '@react-pdf/renderer'
import QRCode from 'qrcode'
import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import React from 'react'

async function main() {
  const verifyUrl = 'https://wohnen.helvenda.ch/verify/HLV-2026-R8YQH6TX'
  const qrDataUrl = await QRCode.toDataURL(verifyUrl, {
    margin: 0,
    width: 240,
    color: { dark: '#0d1411', light: '#ffffff' },
  })

  const doc = React.createElement(CertificatePdfDocument, {
    certificateCode: 'HLV-2026-R8YQH6TX',
    issuedAt: new Date('2026-04-26'),
    expiresAt: new Date('2026-07-21'),
    firstName: 'Admin',
    lastName: 'Admin',
    address: 'In der Hauswiese 2',
    zip: '8125',
    city: 'Zollikerberg',
    employmentLine: 'Angestellt bei Sanitas',
    housingSituationLabel: 'Mieter:in',
    housingSinceLabel: 'An dieser Adresse seit Februar 2025',
    incomeLabel: "Über CHF 50'000 / Monat",
    incomeQualifiesUpTo: 16666,
    creditStatus: 'CLEAR',
    creditCheckDate: new Date('2026-04-22'),
    verifiedCreditCheckCanton: 'ZH',
    creditCheckResultJson: null,
    canton: 'ZH',
    verifyUrl,
    qrDataUrl,
    year: 2026,
  })

  const buffer = await renderToBuffer(doc)
  const out = resolve(process.cwd(), 'preview-certificate.pdf')
  writeFileSync(out, buffer)
  // eslint-disable-next-line no-console
  console.log(`PDF written: ${out}`)
}

main().catch(err => {
  // eslint-disable-next-line no-console
  console.error(err)
  process.exit(1)
})
