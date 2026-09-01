import { sicCertificateReadyCopy, sicMagicLinkEmailCopy, sicStandsOnDocLine, sicUploadReminderCopy } from '@/lib/sic/email-copy'
import { SIC_MODULES } from '@/lib/sic/modules'
import {
  SIC_UPLOAD_NUDGE_SELF_DAYS,
  SIC_UPLOAD_NUDGE_THIRD_PARTY_DAYS,
  sicUploadNudgeDelayDays,
  sicUploadNudgeWindows,
} from '@/lib/sic/upload-nudge'
import { describe, expect, it } from 'vitest'

describe('upload nudge windows', () => {
  it('reminds self-serve docs after one day, third-party after three', () => {
    expect(sicUploadNudgeDelayDays('BONITAET')).toBe(SIC_UPLOAD_NUDGE_SELF_DAYS)
    expect(sicUploadNudgeDelayDays('AUFENTHALT')).toBe(SIC_UPLOAD_NUDGE_SELF_DAYS)
    expect(sicUploadNudgeDelayDays('ARBEIT_EINKOMMEN')).toBe(SIC_UPLOAD_NUDGE_THIRD_PARTY_DAYS)
    expect(sicUploadNudgeDelayDays('ZUVERLAESSIGKEIT')).toBe(SIC_UPLOAD_NUDGE_THIRD_PARTY_DAYS)
  })

  it('splits query windows so day-1 Betreibung is due and day-1 Referenz is not', () => {
    const now = new Date('2026-08-28T10:00:00.000Z')
    const windows = sicUploadNudgeWindows(now)
    const self = windows[0]
    const third = windows[1]
    expect(self.moduleKinds).toEqual(['BONITAET', 'AUFENTHALT'])
    expect(third.moduleKinds).toEqual(['ARBEIT_EINKOMMEN', 'ZUVERLAESSIGKEIT'])
    expect(now.getTime() - self.paidBefore.getTime()).toBe(SIC_UPLOAD_NUDGE_SELF_DAYS * 24 * 60 * 60 * 1000)
    expect(now.getTime() - third.paidBefore.getTime()).toBe(
      SIC_UPLOAD_NUDGE_THIRD_PARTY_DAYS * 24 * 60 * 60 * 1000
    )
  })
})

describe('first verification copy', () => {
  it('says the PDF is ready, with the count on the document, not a Zusage', () => {
    const copy = sicCertificateReadyCopy({
      moduleKind: 'BONITAET',
      verifiedCount: 1,
      firstVerification: true,
      pdfReady: true,
      validUntil: '28.11.2026',
    })
    expect(copy.heading).toBe('Dein PDF ist bereit')
    expect(copy.paragraphs[0]).toBe(`Das PDF ist bereit. ${sicStandsOnDocLine(1)}.`)
    expect(copy.paragraphs[0]).toContain('1 von 4 steht drauf')
    expect(copy.paragraphs.join(' ')).toMatch(/Zusage/)
    expect(copy.paragraphs.join(' ')).toMatch(/Vermieter/)
    expect(copy.subject).not.toMatch(/bewerben/)
    expect(copy.subject).not.toMatch(/Helvenda/)
  })

  it('does not promise applying before the PDF exists', () => {
    const copy = sicCertificateReadyCopy({
      moduleKind: 'BONITAET',
      verifiedCount: 1,
      firstVerification: true,
      pdfReady: false,
      validUntil: '28.11.2026',
    })
    expect(copy.heading).not.toMatch(/bewerben/)
    expect(copy.paragraphs.join(' ')).toMatch(/Name/)
  })
})

describe('upload reminder copy', () => {
  it('tells self-serve modules they already have the document', () => {
    const copy = sicUploadReminderCopy('BONITAET')
    expect(copy.paragraphs[0]).toMatch(/selbst/)
    expect(copy.paragraphs.join(' ')).not.toMatch(/Unterschrift Dritter/)
  })

  it('gives third-party modules time for a signature', () => {
    const copy = sicUploadReminderCopy('ZUVERLAESSIGKEIT')
    expect(copy.paragraphs[0]).toMatch(/Unterschrift Dritter/)
  })

  it('covers every catalog module', () => {
    for (const m of SIC_MODULES) {
      expect(sicUploadReminderCopy(m.id).paragraphs.length).toBeGreaterThan(0)
    }
  })
})

describe('magic link copy', () => {
  it('keeps self-serve wording for a requested login', () => {
    const copy = sicMagicLinkEmailCopy('self')
    expect(copy.heading).toMatch(/Anmeldung/)
    expect(copy.paragraphs.join(' ')).toMatch(/30 Minuten/)
  })

  it('does not sound like an unsolicited login when support resends', () => {
    const copy = sicMagicLinkEmailCopy('support')
    expect(copy.heading).toBe('Dein Anmeldelink')
    expect(copy.paragraphs.join(' ')).toMatch(/Zertifikat/)
    expect(copy.footnote).not.toMatch(/nicht angefordert/)
  })
})
