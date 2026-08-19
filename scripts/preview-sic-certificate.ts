/**
 * Rendert ein Vorschau-PDF des Swiss Immo Cert Zertifikats mit Mock-Daten.
 *
 * Aufruf: `npx tsx scripts/preview-sic-certificate.ts`
 * Output: `./preview-sic-certificate.pdf`
 */
import { SicCertificatePdfDocument } from '@/lib/sic/CertificatePdf'
import { SIC_MODULES } from '@/lib/sic/modules'
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

  const verifiedModules = SIC_MODULES.map(m => ({
    id: m.id,
    title: m.title,
    lines: m.lineItems,
  }))

  const doc = React.createElement(SicCertificatePdfDocument, {
    certificateCode: 'SIC-2026-R8YQH6TX',
    holderName: 'Lucas Maximilian Rodrigues',
    issuedAt: new Date('2026-04-26'),
    expiresAt: new Date('2026-07-26'),
    verifiedModules,
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
