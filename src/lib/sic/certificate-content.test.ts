import { describe, expect, it } from 'vitest'
import { sicPresentedModules, verifiedModuleLineItems } from '@/lib/sic/dossier'
import {
  normalizeSicFacts,
  sicApprovalBlockers,
  sicFactGroups,
  sicFactLines,
  sicFactsLapsed,
  sicIdCapsExpiry,
  sicIdReplacementDue,
  sicIdValidUntil,
} from '@/lib/sic/facts'
import { nextModuleStatusAfterUpload } from '@/lib/sic/module-status'
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
    // Ein Ausweis, der heute endet, trägt nichts mehr — das Zertifikat endete um 00:00.
    expect(
      sicApprovalBlockers('AUFENTHALT', { documentType: 'permit_b', validUntil: '2026-11-01' }, NOW)
    ).toHaveLength(1)
    expect(
      sicApprovalBlockers('AUFENTHALT', { documentType: 'permit_b', validUntil: '2026-11-02' }, NOW)
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

describe('Randfälle aus dem Review', () => {
  const ACTIVE = { status: 'ACTIVE', expiresAt: new Date(Date.UTC(2027, 0, 20)) }

  it('macht aus «nicht angestellt» nie eine geprüfte Angabe', () => {
    expect(nextModuleStatusAfterUpload('NOT_APPLICABLE')).toBeNull()
    const presented = sicPresentedModules(
      [
        {
          moduleKind: 'ARBEIT_EINKOMMEN',
          status: 'IN_REVIEW' as const,
          verifiedFacts: { incomeGroup: 'retired' },
        },
      ],
      ACTIVE,
      NOW
    )
    expect(presented[0].status).toBe('IN_REVIEW')
  })

  it('trägt den alten Ausweis mit, solange er gilt — einen abgelaufenen nicht', () => {
    const carried = sicPresentedModules(
      [
        {
          moduleKind: 'AUFENTHALT',
          status: 'PENDING_DOCS' as const,
          verifiedFacts: { documentType: 'permit_b', validUntil: '2027-01-10' },
        },
      ],
      ACTIVE,
      NOW
    )
    expect(carried[0].status).toBe('VERIFIED')
    const lapsed = sicPresentedModules(
      [
        {
          moduleKind: 'AUFENTHALT',
          status: 'PENDING_DOCS' as const,
          verifiedFacts: { documentType: 'permit_b', validUntil: '2026-10-30' },
        },
      ],
      ACTIVE,
      NOW
    )
    expect(lapsed[0].status).toBe('PENDING_DOCS')
  })

  it('druckt eine beendete befristete Anstellung nicht mehr', () => {
    const facts = {
      incomeBand: '60_80k',
      employmentType: 'befristet',
      employedSince: '2025-01-01',
      employedUntil: '2026-10-31',
    }
    expect(sicFactsLapsed('ARBEIT_EINKOMMEN', facts, NOW)).toBe(true)
    const rows = verifiedModuleLineItems(
      [{ moduleKind: 'ARBEIT_EINKOMMEN', status: 'VERIFIED', verifiedFacts: facts }],
      undefined,
      NOW
    )
    expect(rows).toEqual([])
    expect(
      modulesResetByRenewal(
        [
          {
            moduleKind: 'ARBEIT_EINKOMMEN',
            status: 'VERIFIED',
            reviewedAt: NOW,
            verifiedFacts: facts,
          },
        ],
        NOW
      )
    ).toEqual(['ARBEIT_EINKOMMEN'])
  })

  it('erkennt, wenn nur der Ausweis das Zertifikat beendet', () => {
    const extract = { extractDate: '2026-10-20' }
    expect(sicIdCapsExpiry({ validUntil: '2026-12-10' }, extract, NOW)).toBe(true)
    expect(sicIdCapsExpiry({ validUntil: '2030-01-01' }, extract, NOW)).toBe(false)
    // Auszug selbst schon abgelaufen: dann braucht es die Verlängerung.
    expect(sicIdCapsExpiry({ validUntil: '2026-08-01' }, { extractDate: '2026-06-01' }, NOW)).toBe(
      false
    )
  })
})

describe('Paar, nur eine Person angestellt', () => {
  const names = { couple: true, person1Label: 'Anna Muster', person2Label: 'Beat Beispiel' }

  it('Person 2 nicht angestellt: ihre Lohnfelder entfallen, die 3×-Regel rechnet mit einem Einkommen', () => {
    const raw = {
      incomeBand: '80_100k',
      employmentType: 'unbefristet',
      employedSince: '2020-01-01',
      noticeGiven: 'no',
      incomeGroup2: 'retired',
    }
    const parsed = normalizeSicFacts('ARBEIT_EINKOMMEN', raw, { couple: true })
    expect(parsed.ok).toBe(true)
    const facts = parsed.ok ? parsed.facts : {}
    expect(sicApprovalBlockers('ARBEIT_EINKOMMEN', facts, NOW)).toEqual([])
    const groups = sicFactGroups('ARBEIT_EINKOMMEN', facts, names)
    expect(groups[1]).toEqual({
      label: 'Beat Beispiel',
      lines: ['Pensioniert', SIC_INCOME_NOT_CHECKED_LINE],
    })
    expect(groups[2].lines[0]).toBe(
      'Richtwert 3×-Regel, Einkommen Anna Muster: Miete bis CHF 2’200'
    )
  })

  it('ohne Gruppe bleiben die Lohnfelder beider Personen Pflicht', () => {
    const parsed = normalizeSicFacts(
      'ARBEIT_EINKOMMEN',
      {
        incomeBand: '80_100k',
        employmentType: 'unbefristet',
        employedSince: '2020-01-01',
        noticeGiven: 'no',
      },
      { couple: true }
    )
    expect(parsed.ok).toBe(false)
  })

  it('beide nicht angestellt: Freigabe gesperrt (Haushalts-Vermerk ist der Weg)', () => {
    expect(
      sicApprovalBlockers(
        'ARBEIT_EINKOMMEN',
        { incomeGroup: 'in_training', incomeGroup2: 'retired' },
        NOW
      ).length
    ).toBe(1)
  })
})

describe('Kleine offene Betreibungen (Ausnahme mit Zustimmung)', () => {
  const base = { extractDate: '2026-10-25', office: 'Betreibungsamt Zürich', proceedings: 'open' }

  it('höchstens 2, unter CHF 1’000, mit Zustimmung: freigabefähig, gedruckt als Stufe', () => {
    const facts = { ...base, openCount: '1', openAmountChf: '320', objected: 'yes' }
    expect(sicApprovalBlockers('BONITAET', facts, NOW).join(' ')).toMatch(/Zustimmung/)
    expect(sicApprovalBlockers('BONITAET', facts, NOW, { debtDisclosureConsent: true })).toEqual([])
    expect(sicFactLines('BONITAET', facts)).toContain(
      '1 offene Betreibung, zusammen unter CHF 500 (Rechtsvorschlag erhoben)'
    )
  })

  it('über der Grenze oder Verlustscheine: auch mit Zustimmung gesperrt', () => {
    const consent = { debtDisclosureConsent: true }
    expect(
      sicApprovalBlockers(
        'BONITAET',
        { ...base, openCount: '3+', openAmountChf: '200' },
        NOW,
        consent
      )
    ).toHaveLength(1)
    expect(
      sicApprovalBlockers(
        'BONITAET',
        { ...base, openCount: '2', openAmountChf: '1000' },
        NOW,
        consent
      )
    ).toHaveLength(1)
    expect(
      sicApprovalBlockers('BONITAET', { ...base, proceedings: 'loss' }, NOW, consent)
    ).toHaveLength(1)
  })

  it('zeigt nie den Betrag, nur die Stufe', () => {
    const lines = sicFactLines('BONITAET', { ...base, openCount: '2', openAmountChf: '850' }).join(
      ' '
    )
    expect(lines).toContain('2 offene Betreibungen, zusammen unter CHF 1’000')
    expect(lines).not.toContain('850')
  })

  it('Paar: Grenzen gelten je Person', () => {
    const facts = {
      ...base,
      proceedings: 'clean',
      extractDate2: '2026-10-25',
      office2: 'Betreibungsamt Bern',
      proceedings2: 'open',
      openCount2: '1',
      openAmountChf2: '150',
    }
    expect(sicApprovalBlockers('BONITAET', facts, NOW, { debtDisclosureConsent: true })).toEqual([])
    expect(
      sicFactLines('BONITAET', facts, { couple: true, person1Label: 'A', person2Label: 'B' })
    ).toContain('B: 1 offene Betreibung, zusammen unter CHF 200')
  })
})
