import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import { SicDossierClient } from '@/components/sic/SicDossierClient'
import type { SicDossierView } from '@/lib/sic/dossier'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: () => {}, push: () => {} }),
}))

const dossier: SicDossierView = {
  email: 'test@beispiel.ch',
  canChangeEmail: false,
  pendingEmail: null,
  certificateCode: 'SIC-2026-TEST1234',
  status: 'ACTIVE',
  issuedAt: '2026-06-01T10:00:00.000Z',
  certifiedAt: null,
  expiresAt: null,
  expired: false,
  validityMonths: 3,
  holderName: 'Test Person',
  holderFirstName: 'Test',
  holderLastName: 'Person',
  holder2FirstName: null,
  holder2LastName: null,
  householdKind: 'SINGLE',
  couple: false,
  hasVerifiedModule: false,
  landlordPdfReady: false,
  certificateSealReady: false,
  progress: {
    totalModules: 4,
    catalogModules: 4,
    verifiedCount: 0,
    pendingDocsCount: 4,
    inReviewCount: 0,
    rejectedCount: 0,
  },
  renewal: { available: false, recommended: false, priceChf: 0, refreshes: [] },
  purchasedModules: [
    {
      moduleKind: 'BONITAET',
      title: 'Betreibungsauszug',
      summary: 'Der Auszug vom Betreibungsamt zeigt, ob offene Betreibungen bestehen.',
      landlordSees: 'Dass keine offenen Betreibungen bestehen — mit Datum und Amt.',
      requiredDocuments: ['Auszug vom Betreibungsamt (max. 3 Monate alt)'],
      checklist: [
        { id: 'upload:a', label: 'Auszug vom Betreibungsamt (max. 3 Monate alt)', kind: 'upload' },
      ],
      status: 'PENDING_DOCS',
      documentCount: 0,
      documents: [],
      reviewNote: null,
      certificateLines: [],
    },
    {
      moduleKind: 'ARBEIT_EINKOMMEN',
      title: 'Lohn & Arbeitsstelle',
      summary: 'Lohnabrechnung und Arbeitgeberbestätigung zeigen, was du verdienst.',
      landlordSees: 'Einkommensband und 3×-Regel.',
      requiredDocuments: ['Lohnabrechnung der letzten 3 Monate'],
      checklist: [
        {
          id: 'template:employer',
          label: 'Arbeitgeberbestätigung (SIC-PDF zum Ausfüllen und Unterzeichnen)',
          kind: 'template',
          templateId: 'employer',
        },
        { id: 'upload:payslip', label: 'Lohnabrechnung der letzten 3 Monate', kind: 'upload' },
      ],
      status: 'PENDING_DOCS',
      documentCount: 0,
      documents: [],
      reviewNote: null,
      certificateLines: [],
    },
  ],
  availableModules: [],
}

describe('SicDossierClient — lean layout', () => {
  const html = renderToStaticMarkup(<SicDossierClient dossier={dossier} />)

  it('drops the phone-call disclaimer and repeated per-card hints', () => {
    expect(html).not.toContain('rufen niemanden an')
    expect(html).not.toContain('Das brauchst du dafür')
    expect(html).not.toContain('Sobald die erste Datei da ist')
    expect(html).not.toContain('Der Vermieter sieht:')
    expect(html).not.toContain('Mehrere Dateien nacheinander')
  })

  it('keeps the essentials per module', () => {
    expect(html).toContain('Deine Unterlagen')
    expect(html).toContain('Auszug vom Betreibungsamt (max. 3 Monate alt)')
    expect(html).toContain('Lohnabrechnung der letzten 3 Monate')
    expect(html).toContain('Datei hochladen')
    expect(html).toContain('Vorlage herunterladen')
  })

  it('does not duplicate template rows in the checklist', () => {
    expect(html).not.toContain('SIC-PDF zum Ausfüllen und Unterzeichnen')
  })

  it('shortens the intro without losing the seal requirement', () => {
    expect(html).toContain('Sobald die erste Angabe geprüft ist, gibt es das PDF.')
    expect(html).toContain('Betreibungsauszug und Ausweis')
  })

  it('surfaces the review SLA once under Unterlagen when docs are pending', () => {
    expect(html).toContain('in der Regel innerhalb eines Werktags nach Eingang')
    expect(html).toContain('Namen oder Haushalt ändern')
    expect(html).toContain('Eingereichte Unterlagen prüfen wir')
  })

  it('shows a next-step banner toward the first upload', () => {
    expect(html).toContain('Nächster Schritt')
    expect(html).toContain('Betreibungsauszug')
    expect(html).toContain('Jetzt erledigen')
    expect(html).toContain('href="#modul-BONITAET"')
  })

  it('renders a visual four-module progress strip', () => {
    expect(html).toContain('Betreibung')
    expect(html).toContain('Ausweis')
    expect(html).toContain('Lohn')
    expect(html).toContain('Referenz')
  })

  it('keeps email change out of the hero and in Zugang', () => {
    expect(html).not.toContain('E-Mail falsch geschrieben?')
    // Fixture has canChangeEmail: false — Zugang section only when changeable/pending
  })
})
