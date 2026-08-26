/**
 * Rendert ein Vorschau-PDF des Swiss Immo Cert Zertifikats mit Mock-Daten.
 *
 * Aufruf: `npx tsx scripts/preview-sic-certificate.ts`
 * Output: `./preview-sic-certificate.pdf`
 */
import { SicCertificatePdfDocument } from '@/lib/sic/CertificatePdf'
import { sicFactLines, type SicFacts } from '@/lib/sic/facts'
import { SIC_MODULES, SIC_SCOPE_NOTE, sicCompletenessLabel } from '@/lib/sic/modules'
import { renderToBuffer } from '@react-pdf/renderer'
import QRCode from 'qrcode'
import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import React from 'react'

async function main() {
  const verifyUrl = 'https://swissimmocert.ch/sic/verify/SIC-2026-R8YQH6TX'
  const qrDataUrl = await QRCode.toDataURL(verifyUrl, {
    margin: 0,
    width: 240,
    color: { dark: '#0f2b5e', light: '#ffffff' },
  })

  // Beispielwerte wie nach einer echten Prüfung — nicht die generischen Zeilen.
  const exampleFacts: Record<string, SicFacts> = {
    BONITAET: { extractDate: '2026-04-20', office: 'Betreibungsamt Zürich' },
    AUFENTHALT: { documentType: 'ch_pass', validUntil: '2031-03-31' },
    ARBEIT_EINKOMMEN: {
      incomeBand: '80_100k',
      employmentType: 'unbefristet',
      employedSince: '2022-09-01',
      employerName: 'Muster AG',
    },
    ZUVERLAESSIGKEIT: { tenancyFrom: '2021-05-01', paymentBehaviour: 'always_on_time' },
  }

  const verifiedModules = SIC_MODULES.map(m => {
    const lines = sicFactLines(m.id, exampleFacts[m.id] ?? null)
    return { id: m.id, title: m.title, lines: lines.length > 0 ? lines : m.lineItems }
  })

  const doc = React.createElement(SicCertificatePdfDocument, {
    certificateCode: 'SIC-2026-R8YQH6TX',
    holderName: 'Lucas Maximilian Rodrigues',
    issuedAt: new Date('2026-04-26'),
    expiresAt: new Date('2026-07-26'),
    verifiedModules,
    completenessLabel: sicCompletenessLabel(verifiedModules.length),
    scopeNote: SIC_SCOPE_NOTE,
    verifyUrl,
    qrDataUrl,
  })

  const buffer = await renderToBuffer(doc)
  const out = resolve(process.cwd(), 'preview-sic-certificate.pdf')
  writeFileSync(out, buffer)
  // eslint-disable-next-line no-console
  console.log(`PDF written: ${out} (${buffer.length} bytes)`)
}

main().catch(err => {
  // eslint-disable-next-line no-console
  console.error(err)
  process.exit(1)
})
