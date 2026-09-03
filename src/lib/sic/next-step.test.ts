import { describe, expect, it } from 'vitest'
import type { SicDossierView } from '@/lib/sic/dossier'
import { sicNextStep } from '@/lib/sic/next-step'

function base(over: Partial<SicDossierView> = {}): SicDossierView {
  return {
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
      pendingDocsCount: 1,
      inReviewCount: 0,
      rejectedCount: 0,
    },
    renewal: { available: false, recommended: false, priceChf: 0, refreshes: [] },
    purchasedModules: [
      {
        moduleKind: 'BONITAET',
        title: 'Betreibungsauszug',
        summary: '…',
        landlordSees: '…',
        requiredDocuments: [],
        checklist: [],
        status: 'PENDING_DOCS',
        documentCount: 0,
        documents: [],
        reviewNote: null,
        certificateLines: [],
      },
    ],
    availableModules: [],
    ...over,
  }
}

describe('sicNextStep', () => {
  it('asks for the name first', () => {
    const step = sicNextStep(base({ holderName: null, holderFirstName: null, holderLastName: null }))
    expect(step?.title).toMatch(/Name/)
    expect(step?.anchor).toBe('#sic-name')
  })

  it('prefers seal modules when uploading', () => {
    const step = sicNextStep(
      base({
        purchasedModules: [
          {
            moduleKind: 'ARBEIT_EINKOMMEN',
            title: 'Lohn & Arbeitsstelle',
            summary: '…',
            landlordSees: '…',
            requiredDocuments: [],
            checklist: [],
            status: 'PENDING_DOCS',
            documentCount: 0,
            documents: [],
            reviewNote: null,
            certificateLines: [],
          },
          {
            moduleKind: 'BONITAET',
            title: 'Betreibungsauszug',
            summary: '…',
            landlordSees: '…',
            requiredDocuments: [],
            checklist: [],
            status: 'PENDING_DOCS',
            documentCount: 0,
            documents: [],
            reviewNote: null,
            certificateLines: [],
          },
        ],
      })
    )
    expect(step?.title).toContain('Betreibungsauszug')
    expect(step?.anchor).toBe('#modul-BONITAET')
    expect(step?.detail).toMatch(/Werktag/)
  })

  it('surfaces waiting state with SLA', () => {
    const step = sicNextStep(
      base({
        progress: {
          totalModules: 1,
          catalogModules: 4,
          verifiedCount: 0,
          pendingDocsCount: 0,
          inReviewCount: 1,
          rejectedCount: 0,
        },
        purchasedModules: [
          {
            moduleKind: 'BONITAET',
            title: 'Betreibungsauszug',
            summary: '…',
            landlordSees: '…',
            requiredDocuments: [],
            checklist: [],
            status: 'IN_REVIEW',
            documentCount: 1,
            documents: [],
            reviewNote: null,
            certificateLines: [],
          },
        ],
      })
    )
    expect(step?.kind).toBe('wait')
    expect(step?.detail).toMatch(/Werktag/)
  })

  it('points to the PDF when the seal is ready', () => {
    const step = sicNextStep(
      base({
        certificateSealReady: true,
        landlordPdfReady: true,
        hasVerifiedModule: true,
        progress: {
          totalModules: 4,
          catalogModules: 4,
          verifiedCount: 4,
          pendingDocsCount: 0,
          inReviewCount: 0,
          rejectedCount: 0,
        },
        purchasedModules: [],
      })
    )
    expect(step?.title).toMatch(/bereit/)
    expect(step?.anchor).toBe('#sic-pdf')
  })
})
