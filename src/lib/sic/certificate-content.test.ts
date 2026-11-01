import { describe, expect, it } from 'vitest'
import { verifiedModuleLineItems } from '@/lib/sic/dossier'
import {
  sicApprovalBlockers,
  sicFactGroups,
  sicFactLines,
  sicIdReplacementDue,
  sicIdValidUntil,
} from '@/lib/sic/facts'
import { SIC_DECLARED_BADGE, SIC_INCOME_NOT_CHECKED_LINE } from '@/lib/sic/modules'
import { modulesResetByRenewal } from '@/lib/sic/renewal'
import { sicExpiresAtAfterApproval } from '@/lib/sic/validity'

const NOW = new Date(Date.UTC(2026, 10, 1, 12))

describe('Betreibungsauszug', () => {
  it('unterscheidet «keine Einträge» von «keine offenen Betreibungen»', () => {
    expect(sicFactLines('BONITAET', { proceedings: 'clean' })[0]).toBe(
      'Keine Einträge im Betreibungsregister'
    )
    expect(sicFactLines('BONITAET', { proceedings: 'none' })[0]).toBe('Keine offenen Betreibungen')
  })

  it('lehnt Verlustscheine ab und druckt sie nie', () => {
    const facts = {
      extractDate: '2026-10-20',
      office: 'Betreibungsamt Zürich',
      proceedings: 'loss',
    }
    expect(sicApprovalBlockers('BONITAET', facts, NOW).join(' ')).toContain('Verlustscheine')
    expect(sicFactLines('BONITAET', facts).join(' ')).not.toMatch(/Verlust|Betreibungen/)
  })

  it('lehnt Verlustscheine beim Paar auch für Person 2 ab', () => {
    const blockers = sicApprovalBlockers(
      'BONITAET',
      {
        extractDate: '2026-10-20',
        proceedings: 'clean',
        extractDate2: '2026-10-20',
        proceedings2: 'loss',
      },
      NOW
    )
    expect(blockers.length).toBeGreaterThan(0)
  })
})

describe('Lohn & Arbeitsstelle', () => {
  it('verlangt bei befristeter Anstellung das Enddatum und druckt es', () => {
    const base = {
      incomeBand: '60_80k',
      employmentType: 'befristet',
      employedSince: '2025-01-01',
      noticeGiven: 'no',
    }
    expect(sicApprovalBlockers('ARBEIT_EINKOMMEN', base, NOW).join(' ')).toMatch(/Enddatum/)
    expect(
      sicApprovalBlockers('ARBEIT_EINKOMMEN', { ...base, employedUntil: '2026-09-30' }, NOW).join(
        ' '
      )
    ).toMatch(/beendet/)
    const facts = { ...base, employedUntil: '2027-06-30' }
    expect(sicApprovalBlockers('ARBEIT_EINKOMMEN', facts, NOW)).toEqual([])
    expect(sicFactLines('ARBEIT_EINKOMMEN', facts).join(' | ')).toContain('befristet bis 06.2027')
  })

  it('zeigt den Mietrichtwert als Richtwert, nicht als Tragbarkeit', () => {
    const lines = sicFactLines('ARBEIT_EINKOMMEN', {
      incomeBand: '80_100k',
      employmentType: 'unbefristet',
    })
    expect(lines.join(' ')).toContain('Richtwert 3×-Regel')
    expect(lines.join(' ')).not.toMatch(/Tragbar/)
  })

  it('vermerkt «nicht angestellt» als Angabe, nicht als geprüft', () => {
    const rows = verifiedModuleLineItems([
      { moduleKind: 'BONITAET', status: 'VERIFIED', verifiedFacts: { proceedings: 'clean' } },
      {
        moduleKind: 'ARBEIT_EINKOMMEN',
        status: 'NOT_APPLICABLE',
        verifiedFacts: { incomeGroup: 'self_employed' },
      },
    ])
    const income = rows.find(r => r.id === 'ARBEIT_EINKOMMEN')
    expect(income?.badge).toBe(SIC_DECLARED_BADGE)
    expect(income?.lines).toEqual(['Selbständig erwerbend', SIC_INCOME_NOT_CHECKED_LINE])
  })

  it('lässt «nicht angestellt» bei der Verlängerung stehen', () => {
    expect(
      modulesResetByRenewal(
        [
          { moduleKind: 'BONITAET', status: 'VERIFIED', reviewedAt: NOW },
          { moduleKind: 'ARBEIT_EINKOMMEN', status: 'NOT_APPLICABLE', reviewedAt: null },
        ],
        NOW
      )
    ).toEqual(['BONITAET'])
  })
})

describe('Ausweis', () => {
  it('gibt einen abgelaufenen Ausweis nicht frei', () => {
    expect(
      sicApprovalBlockers(
        'AUFENTHALT',
        { documentType: 'permit_b', validUntil: '2026-10-31' },
        NOW
      ).join(' ')
    ).toMatch(/abgelaufen/)
    expect(
      sicApprovalBlockers('AUFENTHALT', { documentType: 'permit_b', validUntil: '2026-11-01' }, NOW)
    ).toEqual([])
  })

  it('kürzt die Gültigkeit auf das Ausweis-Ende', () => {
    const idValidUntil = sicIdValidUntil({ validUntil: '2027-01-10', validUntil2: '2028-01-01' })
    const expires = sicExpiresAtAfterApproval({
      moduleKind: 'BONITAET',
      extractDate: '2026-10-20',
      currentExpiresAt: null,
      approvedAt: NOW,
      idValidUntil,
    })
    expect(expires.toISOString().slice(0, 10)).toBe('2027-01-10')
    const uncapped = sicExpiresAtAfterApproval({
      moduleKind: 'BONITAET',
      extractDate: '2026-10-20',
      currentExpiresAt: null,
      approvedAt: NOW,
      idValidUntil: sicIdValidUntil({ validUntil: '2030-01-01' }),
    })
    expect(uncapped.toISOString().slice(0, 10)).toBe('2027-01-20')
  })

  it('bietet einen neuen Ausweis an, wenn er das Zertifikat kürzt oder bald abläuft', () => {
    const certEnd = new Date(Date.UTC(2027, 0, 20))
    expect(sicIdReplacementDue({ validUntil: '2027-01-10' }, certEnd, NOW)).toBe(true)
    expect(sicIdReplacementDue({ validUntil: '2030-01-01' }, certEnd, NOW)).toBe(false)
    expect(sicIdReplacementDue({ documentType: 'ch_pass' }, certEnd, NOW)).toBe(false)
  })
})

describe('Referenz vom Vermieter', () => {
  it('datiert ein laufendes Mietverhältnis auf die Referenz statt auf heute', () => {
    const lines = sicFactLines('ZUVERLAESSIGKEIT', {
      tenancyFrom: '2021-01-01',
      paymentBehaviour: 'always_on_time',
      referenceDate: '2026-10-12',
    })
    expect(lines[0]).toBe(
      'Mietverhältnis seit 01.2021 (5 Jahre 9 Monate, Stand Referenz 12.10.2026)'
    )
    expect(lines.join(' ')).not.toMatch(/bis heute|liegt vor/)
  })
})

describe('Paar-Gruppierung', () => {
  it('gruppiert Zeilen pro Person und hält Haushaltszeilen getrennt', () => {
    const groups = sicFactGroups(
      'ARBEIT_EINKOMMEN',
      {
        incomeBand: '80_100k',
        employmentType: 'unbefristet',
        incomeBand2: '40_60k',
        employmentType2: 'unbefristet',
      },
      { couple: true, person1Label: 'Anna Muster', person2Label: 'Luca Bianchi' }
    )
    expect(groups.map(g => g.label)).toEqual(['Anna Muster', 'Luca Bianchi', null])
    expect(groups[2].lines[0]).toContain('beide Einkommen')
    // Kein «Name: Arbeitgeber: …» mehr — der Arbeitgeber steht in der Anstellungszeile.
    const lines = sicFactLines(
      'ARBEIT_EINKOMMEN',
      { employmentType: 'unbefristet', employerName: 'Muster AG' },
      { couple: true, person1Label: 'Anna Muster', person2Label: 'Luca Bianchi' }
    )
    expect(lines[0]).toBe('Anna Muster: Unbefristet angestellt bei Muster AG')
  })
})
