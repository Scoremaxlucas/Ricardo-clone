import { sicCertificateReadyCopy, sicEmailChangeConfirmCopy, sicEmailChangeNoticeCopy, sicMagicLinkEmailCopy, sicStandsOnDocLine, sicUploadReminderCopy } from '@/lib/sic/email-copy'
import { SIC_DEBT_EXTRACT_ORDER_URL } from '@/lib/sic/config'
import { sanitizeEmailUrl } from '@/lib/email/url-safety'
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
  it('calls the PDF a certificate from the first module on, seal follows', () => {
    const copy = sicCertificateReadyCopy({
      moduleKind: 'BONITAET',
      verifiedCount: 1,
      firstVerification: true,
      pdfReady: true,
      validUntil: '28.11.2026',
    })
    expect(copy.heading).toBe('Dein Mieter-Zertifikat ist bereit')
    // Die Überschrift trägt «ist bereit»; der Text wiederholt sie nicht und nennt den Stand wie das Zertifikat.
    expect(copy.paragraphs[0]).toBe(`${sicStandsOnDocLine(1)}: «Betreibungsauszug». Gültig bis 28.11.2026.`)
    expect(copy.paragraphs[0]).toContain('1 von 4 Angaben geprüft')
    expect(copy.paragraphs.join(' ')).not.toMatch(/steht drauf/)
    expect(copy.paragraphs.join(' ')).toMatch(/Siegel kommt dazu/)
    expect(copy.paragraphs.join(' ')).not.toMatch(/kein Mieter-Zertifikat/i)
    expect(copy.paragraphs.join(' ')).toMatch(/Zusage/)
    expect(copy.paragraphs.join(' ')).not.toMatch(/Sekunden lesen/)
    expect(copy.subject).not.toMatch(/bewerben/)
    expect(copy.subject).not.toMatch(/Helvenda/)
    expect(copy.subject).toBe('Dein Mieter-Zertifikat ist bereit')
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
  const flat = (copy: ReturnType<typeof sicUploadReminderCopy>) =>
    [copy.intro, ...copy.groups.flatMap(g => [g.heading, ...g.items.map(x => `${x.title} ${x.before} ${x.link?.label ?? ''} ${x.after ?? ''}`)])].join(' ')

  it('leads with the next step and says the certificate counts from the first check', () => {
    const copy = sicUploadReminderCopy(SIC_MODULES.map(m => m.id))
    expect(copy.subject).toBe('Dein Zertifikat: der nächste Schritt')
    expect(copy.heading).toBe('Starte mit einem Nachweis')
    expect(copy.intro).toMatch(/ab der ersten geprüften Angabe/)
    expect(copy.groups.map(g => g.heading)).toEqual(['Am schnellsten geht es so:', 'Danach, wenn du so weit bist:'])
    expect(copy.groups[0].items.map(i => i.title)).toEqual(['Ausweis', 'Betreibungsauszug'])
    expect(copy.buttonText).toBe('Nachweis hochladen')
    expect(flat(copy)).not.toMatch(/hast du selbst|Lade alles hoch/)
  })

  it('keeps the extract order link through the outbound link filter', () => {
    expect(sanitizeEmailUrl(SIC_DEBT_EXTRACT_ORDER_URL)).toBe(SIC_DEBT_EXTRACT_ORDER_URL)
  })

  it('links the extract order and offers the opt-outs', () => {
    const copy = sicUploadReminderCopy(SIC_MODULES.map(m => m.id))
    const extract = copy.groups[0].items.find(i => i.title === 'Betreibungsauszug')
    expect(extract?.link?.url).toContain('easygov')
    expect(flat(copy)).toMatch(/Nicht angestellt\?/)
    expect(flat(copy)).toMatch(/Keinen bisherigen Vermieter\?/)
  })

  it('mentions the seal once, and not when it is already held', () => {
    const count = (t: string) => (t.match(/Siegel/g) ?? []).length
    expect(count(flat(sicUploadReminderCopy(['BONITAET', 'AUFENTHALT'])))).toBe(1)
    expect(count(flat(sicUploadReminderCopy(['AUFENTHALT'])))).toBe(1)
    expect(count(flat(sicUploadReminderCopy(['AUFENTHALT'], { sealHeld: true, state: 'valid' })))).toBe(0)
    expect(count(flat(sicUploadReminderCopy(['ZUVERLAESSIGKEIT'])))).toBe(0)
  })

  it('changes the opening once the certificate is valid', () => {
    const copy = sicUploadReminderCopy(['ZUVERLAESSIGKEIT'], { state: 'valid' })
    expect(copy.heading).toBe('Dein Zertifikat gilt bereits')
    expect(copy.groups).toHaveLength(1)
    expect(copy.groups[0].heading).toBe('Das fehlt noch:')
    expect(sicUploadReminderCopy(['BONITAET'], { state: 'other' }).intro).not.toMatch(/gilt/)
  })

  it('speaks to couples per person', () => {
    const text = flat(sicUploadReminderCopy(SIC_MODULES.map(m => m.id), { couple: true }))
    expect(text).toMatch(/für jede Person/)
    expect(text).toMatch(/Für jede Person\s+online bestellen/)
    expect(text).toMatch(/Ausbildungsbestätigung/)
  })

  it('covers every catalog module', () => {
    for (const m of SIC_MODULES) {
      expect(sicUploadReminderCopy(m.id).groups.flatMap(g => g.items).map(i => i.title)).toEqual([m.title])
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

describe('ready copy ohne Frist', () => {
  it('verspricht kein Datum, solange der neue Auszug fehlt', () => {
    const copy = sicCertificateReadyCopy({
      moduleKind: 'ARBEIT_EINKOMMEN',
      verifiedCount: 2,
      firstVerification: false,
      pdfReady: true,
      sealReady: false,
      validUntil: null,
    })
    const text = copy.paragraphs.join(' ')
    expect(text).not.toContain('Gültig bis')
    expect(text).toContain('Betreibungsauszug')
  })
})
