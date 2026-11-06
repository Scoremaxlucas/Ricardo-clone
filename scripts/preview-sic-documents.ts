/**
 * Rendert alle Kundendokumente von Swiss Immo Cert mit Beispieldaten — über denselben
 * Weg wie die Website (gleiche Zeilen, gleiches Siegel, gleiche Formulare). Ohne Datenbank.
 *
 * Aufruf: `npx tsx scripts/preview-sic-documents.ts <Zielordner>`
 */
import { certificateVerifyQrDataUrl } from '@/lib/certificate/qrDataUrl'
import { SicCertificatePdfDocument } from '@/lib/sic/CertificatePdf'
import {
  joinHouseholdHolderName,
  sicFactLineOptsFromHolders,
  sicVerifiedRowCount,
  verifiedModuleLineItems,
} from '@/lib/sic/dossier-core'
import { SIC_DEBT_CONSENT_KEY } from '@/lib/sic/facts'
import { renderSicTemplatePdf } from '@/lib/sic/form-kit/render'
import { isSicCertificateSealReady, SIC_SCOPE_NOTE, sicCompletenessLabel } from '@/lib/sic/modules'
import { renderToBuffer } from '@react-pdf/renderer'
import { mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import React from 'react'

type Status = 'VERIFIED' | 'NOT_APPLICABLE' | 'PENDING_DOCS' | 'REJECTED'
type Module = { moduleKind: string; status: Status; verifiedFacts?: unknown }
type Sample = {
  file: string
  code: string
  first: string
  last: string
  first2?: string
  last2?: string
  modules: Module[]
}

const day = (offset: number) => new Date(Date.now() + offset * 86_400_000).toISOString().slice(0, 10)
const EXTRACT = { extractDate: day(-6), office: 'Betreibungsamt Zürich 4', proceedings: 'clean' }
const ID = { documentType: 'ch_pass', validUntil: '2031-05-31' }
const JOB = {
  incomeBand: '80_100k',
  employmentType: 'unbefristet',
  employedSince: '2020-03-01',
  noticeGiven: 'no',
  employerName: 'Muster AG',
}
const REFERENCE = { tenancyFrom: '2021-01-01', paymentBehaviour: 'always_on_time' }

const SAMPLES: Sample[] = [
  {
    file: 'zertifikat-1-einzelperson-mit-siegel',
    code: 'SIC-2026-R8YQH6TX',
    first: 'Anna',
    last: 'Muster',
    modules: [
      { moduleKind: 'BONITAET', status: 'VERIFIED', verifiedFacts: EXTRACT },
      { moduleKind: 'AUFENTHALT', status: 'VERIFIED', verifiedFacts: ID },
      { moduleKind: 'ARBEIT_EINKOMMEN', status: 'VERIFIED', verifiedFacts: JOB },
      { moduleKind: 'ZUVERLAESSIGKEIT', status: 'VERIFIED', verifiedFacts: REFERENCE },
    ],
  },
  {
    file: 'zertifikat-2-ohne-siegel-selbstaendig',
    code: 'SIC-2026-K4M7P2WD',
    first: 'Luca',
    last: 'Bernasconi',
    modules: [
      { moduleKind: 'BONITAET', status: 'VERIFIED', verifiedFacts: { ...EXTRACT, proceedings: 'none' } },
      { moduleKind: 'AUFENTHALT', status: 'PENDING_DOCS' },
      { moduleKind: 'ARBEIT_EINKOMMEN', status: 'NOT_APPLICABLE', verifiedFacts: { incomeGroup: 'self_employed' } },
      { moduleKind: 'ZUVERLAESSIGKEIT', status: 'VERIFIED', verifiedFacts: REFERENCE },
    ],
  },
  {
    file: 'zertifikat-3-paar-lange-namen',
    code: 'SIC-2026-T9B3XN5C',
    first: 'Maximilian-Alexander',
    last: 'von Hohenzollern-Sigmaringen',
    first2: 'Anne-Sophie Charlotte',
    last2: 'Müller-Lüdenscheidt',
    modules: [
      {
        moduleKind: 'BONITAET',
        status: 'VERIFIED',
        verifiedFacts: {
          ...EXTRACT,
          office: 'Betreibungsamt Zürich 11 (Affoltern, Oerlikon, Seebach)',
          extractDate2: day(-12),
          office2: 'Betreibungs- und Konkursamt Bern-Mittelland, Dienststelle Mittelland',
          proceedings2: 'none',
        },
      },
      {
        moduleKind: 'AUFENTHALT',
        status: 'VERIFIED',
        verifiedFacts: { ...ID, documentType2: 'permit_c', validUntil2: '2029-08-31' },
      },
      {
        moduleKind: 'ARBEIT_EINKOMMEN',
        status: 'VERIFIED',
        verifiedFacts: {
          ...JOB,
          employerName: 'Schweizerische Rückversicherungs-Gesellschaft AG',
          incomeBand2: '60_80k',
          employmentType2: 'befristet',
          employedSince2: '2025-02-01',
          employedUntil2: day(420),
          noticeGiven2: 'no',
          employerName2: 'Universitätsspital Zürich',
        },
      },
      { moduleKind: 'ZUVERLAESSIGKEIT', status: 'VERIFIED', verifiedFacts: REFERENCE },
    ],
  },
  {
    file: 'zertifikat-4-paar-kleine-betreibung-pensioniert',
    code: 'SIC-2026-H6D8QF2V',
    first: 'Sara',
    last: 'Keller',
    first2: 'Peter',
    last2: 'Keller',
    modules: [
      {
        moduleKind: 'BONITAET',
        status: 'VERIFIED',
        verifiedFacts: {
          ...EXTRACT,
          proceedings: 'open',
          openCount: '1',
          openAmountChf: '320',
          objected: 'yes',
          [SIC_DEBT_CONSENT_KEY]: 'yes',
          extractDate2: day(-6),
          office2: 'Betreibungsamt Zürich 4',
          proceedings2: 'clean',
        },
      },
      { moduleKind: 'AUFENTHALT', status: 'VERIFIED', verifiedFacts: { ...ID, documentType2: 'ch_pass', validUntil2: '2030-01-31' } },
      { moduleKind: 'ARBEIT_EINKOMMEN', status: 'VERIFIED', verifiedFacts: { ...JOB, incomeGroup2: 'retired' } },
      { moduleKind: 'ZUVERLAESSIGKEIT', status: 'NOT_APPLICABLE' },
    ],
  },
]

async function renderCertificate(sample: Sample, outDir: string) {
  const couple = Boolean(sample.first2)
  const names = {
    couple,
    firstName: sample.first,
    lastName: sample.last,
    firstName2: sample.first2 ?? null,
    lastName2: sample.last2 ?? null,
  }
  const verifiedModules = verifiedModuleLineItems(sample.modules, sicFactLineOptsFromHolders(names))
  const verifyUrl = `https://swissimmocert.ch/sic/verify/${sample.code}`
  const extract = new Date(EXTRACT.extractDate)
  const expiresAt = new Date(Date.UTC(extract.getUTCFullYear(), extract.getUTCMonth() + 3, extract.getUTCDate()))
  const doc = React.createElement(SicCertificatePdfDocument, {
    certificateCode: sample.code,
    holderName: joinHouseholdHolderName(names) ?? '',
    issuedAt: extract,
    expiresAt,
    verifiedModules,
    completenessLabel: sicCompletenessLabel(sicVerifiedRowCount(verifiedModules)),
    scopeNote: SIC_SCOPE_NOTE,
    verifyUrl,
    qrDataUrl: await certificateVerifyQrDataUrl(verifyUrl),
    presentation: isSicCertificateSealReady(verifiedModules.map(m => m.id)) ? 'certificate' : 'working',
  })
  const file = resolve(outDir, `${sample.file}.pdf`)
  writeFileSync(file, await renderToBuffer(doc))
  // eslint-disable-next-line no-console
  console.log(file)
}

async function main() {
  const outDir = resolve(process.argv[2] || './sic-dokumente-vorschau')
  mkdirSync(outDir, { recursive: true })
  for (const sample of SAMPLES) await renderCertificate(sample, outDir)
  for (const id of ['employer_confirmation', 'landlord_reference'] as const) {
    const prefilled = { employeeName: 'Anna Muster', tenantName: 'Anna Muster' }
    for (const [suffix, values] of [['leer', {}], ['vorausgefuellt', prefilled]] as const) {
      const file = resolve(outDir, `formular-${id}-${suffix}.pdf`)
      writeFileSync(file, await renderSicTemplatePdf(id, values))
      // eslint-disable-next-line no-console
      console.log(file)
    }
  }
}

main().catch(err => {
  // eslint-disable-next-line no-console
  console.error(err)
  process.exit(1)
})
