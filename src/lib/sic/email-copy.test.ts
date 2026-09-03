import { sicCertificateReadyCopy, sicEmailChangeConfirmCopy, sicEmailChangeNoticeCopy, sicMagicLinkEmailCopy, sicStandsOnDocLine, sicUploadReminderCopy } from '@/lib/sic/email-copy'
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
  it('calls a single-module PDF the stand of the check, not a certificate', () => {
    const copy = sicCertificateReadyCopy({
      moduleKind: 'BONITAET',
      verifiedCount: 1,
      firstVerification: true,
      pdfReady: true,
      validUntil: '28.11.2026',
    })
    expect(copy.heading).toBe('Der Stand der Prüfung ist bereit')
    expect(copy.paragraphs[0]).toBe(`Der Stand der Prüfung ist als PDF bereit. ${sicStandsOnDocLine(1)}.`)
    expect(copy.paragraphs[0]).toContain('1 von 4 steht drauf')
    expect(copy.paragraphs.join(' ')).toMatch(/noch kein Mieter-Zertifikat/i)
    expect(copy.paragraphs.join(' ')).toMatch(/Zusage/)
    expect(copy.paragraphs.join(' ')).not.toMatch(/Sekunden lesen/)
    expect(copy.subject).not.toMatch(/bewerben/)
    expect(copy.subject).not.toMatch(/Helvenda/)
    expect(copy.subject).not.toMatch(/Mieter-Zertifikat/)
  })

  it('calls it a certificate once Betreibung and Ausweis are both on the document', () => {
    const copy = sicCertificateReadyCopy({
      moduleKind: 'AUFENTHALT',
      verifiedCount: 2,
      firstVerification: false,
      pdfReady: true,
      sealReady: true,
      validUntil: '28.11.2026',
    })
    expect(copy.heading).toBe('Dein Zertifikat wurde aktualisiert')
    expect(copy.paragraphs.join(' ')).toMatch(/Zertifikat/)
    expect(copy.paragraphs.join(' ')).not.toMatch(/Stand der Prüfung/)
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
    expect(copy.paragraphs.join(' ')).toMatch(/Anmelden/)
    expect(copy.paragraphs.join(' ')).toMatch(/Mailprogramm/)
    expect(copy.footnote).toMatch(/Anmelden/)
    expect(copy.footnote).not.toMatch(/Link nicht geöffnet/)
  })

  it('does not sound like an unsolicited login when support resends', () => {
    const copy = sicMagicLinkEmailCopy('support')
    expect(copy.heading).toBe('Dein Anmeldelink')
    expect(copy.paragraphs.join(' ')).toMatch(/Zertifikat/)
    expect(copy.footnote).not.toMatch(/nicht angefordert/)
    expect(copy.buttonText).toBe('Anmeldeseite öffnen')
  })

  it('tells a paying customer the link opens the certificate', () => {
    const copy = sicMagicLinkEmailCopy('checkout')
    expect(copy.subject).toBe('Dieser Link öffnet dein Zertifikat')
    expect(copy.paragraphs[0]).toMatch(/^Dieser Link öffnet dein Zertifikat/)
    expect(copy.paragraphs.join(' ')).toMatch(/sieben Tage/)
    expect(copy.paragraphs.join(' ')).toMatch(/Anmelden/)
    expect(copy.buttonText).toBe('Zertifikat öffnen')
    expect(`${copy.subject} ${copy.paragraphs.join(' ')}`).not.toMatch(/stützen/)
  })
})

describe('email change copy', () => {
  it('asks the new inbox to confirm with a button, not a GET consume', () => {
    const copy = sicEmailChangeConfirmCopy()
    expect(copy.paragraphs.join(' ')).toMatch(/Bestätigen/)
    expect(copy.paragraphs.join(' ')).toMatch(/30 Minuten/)
    expect(copy.paragraphs.join(' ')).toMatch(/Mailprogramm/)
    expect(copy.footnote).toMatch(/Bestätigen/)
    expect(copy.buttonText).toMatch(/Bestätigung/)
    expect(`${copy.subject} ${copy.paragraphs.join(' ')}`).not.toMatch(/stützen/)
  })

  it('notifies the old address without a confirm link', () => {
    const copy = sicEmailChangeNoticeCopy('neu@example.ch')
    expect(copy.paragraphs.join(' ')).toContain('neu@example.ch')
    expect(copy.paragraphs.join(' ')).toMatch(/erst, wenn diese Adresse bestätigt/i)
    expect(copy.subject).toMatch(/angefordert/)
    expect(`${copy.subject} ${copy.paragraphs.join(' ')}`).not.toMatch(/stützen/)
  })
})
