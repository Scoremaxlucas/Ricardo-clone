/**
 * Helvenda Wohnungen — transaktionale E-Mail-Templates (reine Funktionen, keine Side Effects).
 * Layout: Teal-Header, weisser Body (max. 600px), grauer Footer — alles Inline-CSS.
 */

import type { EmploymentStatus, IncomeCategory } from '@prisma/client'
import { employmentLabelDe, incomeCategoryLabelDe } from '@/lib/tenant-profile/labels'
import { WOHNEN_SITE_ORIGIN } from '@/lib/site-urls'
import { LANDLORD_LEAD_TOKEN_TTL_DAYS } from '@/lib/rental/landlord-lead-token'
import type { CreditCheckResult } from '@/lib/rental/types'
import { isCreditCheckResult } from '@/lib/rental/types'
import {
  multilingualTransactionalNoticeHtml,
  multilingualTransactionalNoticePlaintext,
} from '@/lib/email/transactional-multilingual-notice'

export type WohnenEmailPayload = { subject: string; html: string; text: string }

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function appendWohnenPublicNotice(text: string, publicNotice: boolean): string {
  if (!publicNotice) return text
  return text + multilingualTransactionalNoticePlaintext('wohnungen')
}

function wohnenOrigin(): string {
  return WOHNEN_SITE_ORIGIN.replace(/\/$/, '')
}

function wohnenAdminListingEditLink(listingId: string): string {
  return `${wohnenOrigin()}/admin/listings/${encodeURIComponent(listingId)}/bearbeiten`
}

function formatChf(n: number): string {
  return new Intl.NumberFormat('de-CH', { maximumFractionDigits: 0 }).format(n)
}

function formatRoomsDe(rooms: number): string {
  const s = Number.isInteger(rooms) ? String(rooms) : String(rooms).replace('.', ',')
  return `${s} Zi`
}

function layout(innerHtml: string, options?: { publicNotice?: boolean }): string {
  const publicNotice = options?.publicNotice !== false
  const origin = wohnenOrigin()
  const notice = publicNotice ? multilingualTransactionalNoticeHtml('wohnungen', 'light') : ''
  return `<!DOCTYPE html>
<html lang="de">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background-color:#f4f4f5;">
<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color:#f4f4f5;">
<tr><td align="center" style="padding:24px 12px;">
<table role="presentation" cellpadding="0" cellspacing="0" width="600" style="max-width:600px;width:100%;border-collapse:collapse;background-color:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
<tr>
<td style="background-color:#18a87c;padding:22px 24px;text-align:center;">
<span style="font-family:Arial,Helvetica,sans-serif;font-size:20px;font-weight:700;color:#ffffff;">Helvenda Wohnungen</span>
</td>
</tr>
<tr>
<td style="background-color:#ffffff;padding:28px 24px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.6;color:#1f2937;">
${innerHtml}
</td>
</tr>
<tr>
<td style="background-color:#e5e7eb;padding:18px 24px;text-align:center;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.55;color:#6b7280;">
© 2026 Helvenda Wohnungen · Score-Max GmbH<br>
<a href="${escapeHtml(origin)}" style="color:#18a87c;text-decoration:underline;">wohnen.helvenda.ch</a>
${notice}
</td>
</tr>
</table>
</td></tr>
</table>
</body>
</html>`
}

function buttonRow(href: string, label: string): string {
  const h = escapeHtml(href)
  const l = escapeHtml(label)
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:22px 0 8px 0;">
<tr><td align="left">
<a href="${h}" style="display:inline-block;background-color:#18a87c;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:6px;font-weight:600;font-size:15px;font-family:Arial,Helvetica,sans-serif;">${l}</a>
</td></tr>
</table>`
}

function betreibungsLineForLandlord(requiresCredit: boolean, result: unknown): string {
  if (!requiresCredit) return 'Nicht vorhanden'
  if (!result || !isCreditCheckResult(result)) return 'Nicht vorhanden'
  const r = result as CreditCheckResult
  if (!r.hasEntries) return 'Keine Einträge ✅'
  return `${r.entryCount} Einträge ⚠️`
}

function betreibungsLineForTenantVerified(result: CreditCheckResult): string {
  if (!result.hasEntries) return 'Keine Einträge ✅'
  return `${result.entryCount} Einträge ⚠️`
}

function employmentLine(status: EmploymentStatus, employer: string | null): string {
  const st = employmentLabelDe(status)
  const em = employer?.trim()
  if (em) return `${escapeHtml(st)} · ${escapeHtml(em)}`
  return escapeHtml(st)
}

function referenceLine(refName: string | null, refPhone: string | null): string {
  if (refName?.trim() && refPhone?.trim()) return 'Vorhanden ✓'
  return 'Nicht vorhanden'
}

/** Template 1 — Neue Bewerbung (Vermieter) */
export function templateLandlordNewApplication(input: {
  /** Vorname für «Hallo …»; leer/null → neutrales «Guten Tag,» */
  landlordFirstName: string | null
  listingTitle: string
  listingId: string
  applicantFullName: string
  applicantContactPhone: string | null
  applicantContactEmail: string | null
  employmentStatus: EmploymentStatus
  employer: string | null
  incomeCategory: IncomeCategory
  requiresCreditCheck: boolean
  creditCheckResult: unknown
  referenceName: string | null
  referencePhone: string | null
  applicantMessage: string | null
  /** Automatische Kurz-Zusammenfassung aus dem Mieterprofil (immer, wenn gesetzt). */
  applicantSummary: string | null
  certificateCode: string | null
  /** false = Admin-Inserat / externer Vermieter ohne Helvenda-Konto */
  landlordCanViewOnPlatform: boolean
  /** Magic-Link für externe Vermieter — Bewerbung ohne Konto verwalten */
  landlordMagicLinkUrl?: string | null
}): WohnenEmailPayload {
  const o = wohnenOrigin()
  const platformLink = `${o}/matching/properties/${encodeURIComponent(input.listingId)}/bewerbungen`
  const magicLink = input.landlordMagicLinkUrl?.trim() || null
  const verifyLink =
    input.certificateCode?.trim() ?
      `${o}/verify/${encodeURIComponent(input.certificateCode.trim())}`
    : null
  const certBlock =
    verifyLink ?
      `<p style="margin:0 0 14px 0;"><strong>Helvenda Qualitätsnachweis:</strong> öffentliche Prüfseite mit den geprüften Angaben (Betreibungsregister, Einkommen):<br>
<a href="${escapeHtml(verifyLink)}" style="color:#0f766e;font-weight:600;">${escapeHtml(verifyLink)}</a></p>`
    : ''
  const summaryBox =
    input.applicantSummary?.trim() ?
      `<div style="margin:16px 0;padding:14px 16px;background-color:#f0faf5;border-left:4px solid #18a87c;border-radius:4px;color:#1f2937;font-size:14px;line-height:1.55;"><strong style="color:#0f766e;">Kurzprofil (Helvenda):</strong><br>${escapeHtml(input.applicantSummary.trim())}</div>`
    : ''
  const msgBox =
    input.applicantMessage?.trim() ?
      `<div style="margin:16px 0;padding:14px 16px;background-color:#f9fafb;border-left:4px solid #94a3b8;border-radius:4px;color:#374151;font-size:14px;"><strong>Zusätzliche Nachricht:</strong><br>${escapeHtml(input.applicantMessage.trim())}</div>`
    : ''

  const greetingLine =
    input.landlordFirstName?.trim() ?
      `Hallo ${escapeHtml(input.landlordFirstName.trim())},`
    : 'Guten Tag,'

  const ctaBlock =
    input.landlordCanViewOnPlatform ?
      buttonRow(platformLink, 'Bewerbung ansehen')
    : magicLink ?
      `${buttonRow(magicLink, 'Bewerbung verwalten')}
<p style="margin:12px 0 0 0;font-size:13px;line-height:1.55;color:#4b5563;">Über diesen Link kannst du Besichtigung anfragen, ablehnen oder dich direkt melden — ohne Helvenda-Konto. Der Link ist ${LANDLORD_LEAD_TOKEN_TTL_DAYS} Tage gültig.</p>
${verifyLink ? `<p style="margin:14px 0 0 0;font-size:14px;line-height:1.55;color:#4b5563;">Qualitätsnachweis des Bewerbers: <a href="${escapeHtml(verifyLink)}" style="color:#0f766e;font-weight:600;">Prüfseite öffnen</a></p>` : ''}`
    : `${verifyLink ? buttonRow(verifyLink, 'Qualitätsnachweis prüfen') : ''}
<p style="margin:${verifyLink ? '12px' : '18px'} 0 0 0;font-size:14px;line-height:1.55;color:#4b5563;">Telefon und E-Mail des Bewerbers stehen oben. Die Prüfseite ist öffentlich — kein Helvenda-Konto nötig.</p>`

  const textCtaLines =
    input.landlordCanViewOnPlatform ?
      [platformLink]
    : magicLink ?
      [magicLink, verifyLink ? `Qualitätsnachweis: ${verifyLink}` : ''].filter(Boolean)
    : [verifyLink ? `Qualitätsnachweis: ${verifyLink}` : ''].filter(Boolean)

  const inner = `
<p style="margin:0 0 14px 0;">${greetingLine}</p>
<p style="margin:0 0 14px 0;">du hast eine neue Bewerbung für dein Inserat <strong>„${escapeHtml(input.listingTitle)}“</strong> erhalten.</p>
<p style="margin:0 0 6px 0;"><strong>Bewerber:</strong> ${escapeHtml(input.applicantFullName)}</p>
${
  input.applicantContactPhone?.trim() ?
    `<p style="margin:0 0 6px 0;"><strong>Telefon:</strong> ${escapeHtml(input.applicantContactPhone.trim())}</p>`
  : ''
}
${
  input.applicantContactEmail?.trim() ?
    `<p style="margin:0 0 6px 0;"><strong>E-Mail (Kontakt):</strong> ${escapeHtml(input.applicantContactEmail.trim())}</p>`
  : ''
}
<p style="margin:0 0 6px 0;"><strong>Beschäftigung:</strong> ${employmentLine(input.employmentStatus, input.employer)}</p>
<p style="margin:0 0 6px 0;"><strong>Einkommen:</strong> ${escapeHtml(incomeCategoryLabelDe(input.incomeCategory))}</p>
<p style="margin:0 0 6px 0;"><strong>Betreibungsregisterauszug:</strong> ${escapeHtml(betreibungsLineForLandlord(input.requiresCreditCheck, input.creditCheckResult))}</p>
<p style="margin:0 0 18px 0;"><strong>Referenz:</strong> ${escapeHtml(referenceLine(input.referenceName, input.referencePhone))}</p>
${certBlock}
${summaryBox}
${msgBox}
${ctaBlock}
`

  const subject = `Neue Bewerbung für „${input.listingTitle}“ — ${input.applicantFullName}`
  const textGreeting =
    input.landlordFirstName?.trim() ? `Hallo ${input.landlordFirstName.trim()},` : 'Guten Tag,'

  const text = [
    textGreeting,
    '',
    `Du hast eine neue Bewerbung für dein Inserat „${input.listingTitle}“ erhalten.`,
    `Bewerber: ${input.applicantFullName}`,
    input.applicantContactPhone?.trim() ? `Telefon: ${input.applicantContactPhone.trim()}` : '',
    input.applicantContactEmail?.trim() ? `E-Mail (Kontakt): ${input.applicantContactEmail.trim()}` : '',
    `Beschäftigung: ${employmentLabelDe(input.employmentStatus)}${input.employer?.trim() ? ` · ${input.employer.trim()}` : ''}`,
    `Einkommen: ${incomeCategoryLabelDe(input.incomeCategory)}`,
    `Betreibungsregisterauszug: ${betreibungsLineForLandlord(input.requiresCreditCheck, input.creditCheckResult)}`,
    `Referenz: ${referenceLine(input.referenceName, input.referencePhone)}`,
    verifyLink ? `Qualitätsnachweis (Prüfseite): ${verifyLink}` : '',
    input.applicantSummary?.trim() ? `\nKurzprofil (Helvenda):\n${input.applicantSummary.trim()}` : '',
    input.applicantMessage?.trim() ? `\nZusätzliche Nachricht:\n${input.applicantMessage.trim()}` : '',
    '',
    ...textCtaLines,
  ]
    .filter(Boolean)
    .join('\n')

  return { subject, html: layout(inner), text: appendWohnenPublicNotice(text, true) }
}

/** Template — Bewerbung nicht berücksichtigt (Mieter, nach Vermieter-Absage) */
export function templateTenantApplicationRejectedByLandlord(input: {
  tenantFirstName: string
  listingTitle: string
}): WohnenEmailPayload {
  const o = wohnenOrigin()
  const link = `${o}/meine-bewerbungen`
  const inner = `
<p style="margin:0 0 14px 0;">Hallo ${escapeHtml(input.tenantFirstName)},</p>
<p style="margin:0 0 14px 0;">der Vermieter von <strong>„${escapeHtml(input.listingTitle)}“</strong> hat uns mitgeteilt, dass deine Bewerbung für diese Wohnung leider nicht weiterverfolgt wird.</p>
<p style="margin:0 0 14px 0;">Das bedeutet nicht, dass etwas mit deinem Profil nicht stimmt — auf dem Schweizer Mietmarkt sind viele Bewerbungen gleichzeitig im Rennen.</p>
${buttonRow(link, 'Weitere Bewerbungen')}
`
  const subject = `Update zu „${input.listingTitle}“`
  const text = [
    `Hallo ${input.tenantFirstName},`,
    '',
    `Der Vermieter von „${input.listingTitle}“ verfolgt deine Bewerbung nicht weiter.`,
    '',
    link,
  ].join('\n')
  return { subject, html: layout(inner), text: appendWohnenPublicNotice(text, true) }
}

/** Template — Vermieter meldet sich direkt (Mieter) */
export function templateTenantLandlordDirectContact(input: {
  tenantFirstName: string
  listingTitle: string
  landlordNote: string | null
}): WohnenEmailPayload {
  const o = wohnenOrigin()
  const link = `${o}/meine-bewerbungen`
  const noteBlock =
    input.landlordNote?.trim() ?
      `<p style="margin:14px 0 0 0;padding:12px 14px;background-color:#f0faf5;border-radius:4px;font-size:14px;color:#374151;"><strong>Notiz:</strong><br>${escapeHtml(input.landlordNote.trim())}</p>`
    : ''
  const inner = `
<p style="margin:0 0 14px 0;">Hallo ${escapeHtml(input.tenantFirstName)},</p>
<p style="margin:0 0 14px 0;">gute Nachrichten: Der Vermieter von <strong>„${escapeHtml(input.listingTitle)}“</strong> hat deine Bewerbung erhalten und wird sich <strong>direkt bei dir</strong> melden (Telefon oder E-Mail).</p>
${noteBlock}
${buttonRow(link, 'Meine Bewerbungen')}
`
  const subject = `Der Vermieter meldet sich — „${input.listingTitle}“`
  const text = [
    `Hallo ${input.tenantFirstName},`,
    '',
    `Der Vermieter von „${input.listingTitle}“ meldet sich direkt bei dir.`,
    input.landlordNote?.trim() ? `Notiz: ${input.landlordNote.trim()}` : '',
    '',
    link,
  ]
    .filter(Boolean)
    .join('\n')
  return { subject, html: layout(inner), text: appendWohnenPublicNotice(text, true) }
}

/** Template — Keine Vermieter-Rückmeldung nach Frist (Mieter) */
export function templateTenantLandlordNoResponseYet(input: {
  tenantFirstName: string
  listingTitle: string
  daysSinceApplication: number
}): WohnenEmailPayload {
  const o = wohnenOrigin()
  const link = `${o}/meine-bewerbungen`
  const inner = `
<p style="margin:0 0 14px 0;">Hallo ${escapeHtml(input.tenantFirstName)},</p>
<p style="margin:0 0 14px 0;">zu deiner Bewerbung für <strong>„${escapeHtml(input.listingTitle)}“</strong>: Der Vermieter hat über Helvenda noch keine Rückmeldung erfasst (seit ${input.daysSinceApplication} Tagen).</p>
<p style="margin:0 0 14px 0;">Das kommt vor — viele Vermieter bearbeiten Anfragen per E-Mail oder Telefon. Deine Bewerbung wurde mit Qualitätsnachweis zugestellt; du musst nichts weiter tun.</p>
<p style="margin:0 0 14px 0;">In «Meine Bewerbungen» kannst du die Bewerbung nach einigen Tagen als «keine Rückmeldung» melden, falls das Inserat veraltet wirkt.</p>
${buttonRow(link, 'Meine Bewerbungen')}
`
  const subject = `Stand deiner Bewerbung — „${input.listingTitle}“`
  const text = [
    `Hallo ${input.tenantFirstName},`,
    '',
    `Zu „${input.listingTitle}“: noch keine Rückmeldung vom Vermieter über Helvenda (${input.daysSinceApplication} Tage).`,
    'Das ist häufig normal — viele Vermieter antworten direkt.',
    '',
    link,
  ].join('\n')
  return { subject, html: layout(inner), text: appendWohnenPublicNotice(text, true) }
}

/** Template 2 — Bewerbung abgeschickt (Mieter) */
export function templateTenantApplicationSubmitted(input: {
  tenantFirstName: string
  listingTitle: string
  addressLine: string
  rooms: number
  rentPerMonth: number
}): WohnenEmailPayload {
  const o = wohnenOrigin()
  const link = `${o}/meine-bewerbungen`
  const inner = `
<p style="margin:0 0 14px 0;">Hallo ${escapeHtml(input.tenantFirstName)},</p>
<p style="margin:0 0 14px 0;">deine Bewerbung für die folgende Wohnung wurde erfolgreich übermittelt:</p>
<p style="margin:0 0 8px 0;"><strong>${escapeHtml(input.listingTitle)}</strong><br>
<span style="color:#4b5563;">${escapeHtml(input.addressLine)} · ${escapeHtml(formatRoomsDe(input.rooms))} · CHF ${escapeHtml(formatChf(input.rentPerMonth))}/Monat</span></p>
<p style="margin:0 0 14px 0;">Der Vermieter wurde benachrichtigt und wird sich bei dir melden.<br>
Du kannst den Status deiner Bewerbung jederzeit hier einsehen:</p>
${buttonRow(link, 'Meine Bewerbungen')}
<p style="margin:18px 0 0 0;font-size:14px;color:#4b5563;"><strong>Tipp:</strong> Beantworte Nachrichten des Vermieters schnell — das erhöht deine Chancen erheblich.</p>
`
  const subject = `Deine Bewerbung für „${input.listingTitle}“ wurde übermittelt ✅`
  const text = [
    `Hallo ${input.tenantFirstName},`,
    '',
    'Deine Bewerbung wurde erfolgreich übermittelt:',
    `${input.listingTitle}`,
    `${input.addressLine} · ${formatRoomsDe(input.rooms)} · CHF ${formatChf(input.rentPerMonth)}/Monat`,
    '',
    'Meine Bewerbungen:',
    link,
    '',
    'Tipp: Beantworte Nachrichten des Vermieters schnell.',
  ].join('\n')
  return { subject, html: layout(inner), text: appendWohnenPublicNotice(text, true) }
}

/** Neues Inserat passt zu Suchpräferenzen (Mieter, Cron) */
export function templateTenantNewListingMatch(input: {
  tenantFirstName: string
  listingTitle: string
  listingId: string
  addressLine: string
  rooms: number
  rentPerMonth: number
}): WohnenEmailPayload {
  const o = wohnenOrigin()
  const listingLink = `${o}/wohnungen/${encodeURIComponent(input.listingId)}`
  const matchesLink = `${o}/meine-matches`
  const inner = `
<p style="margin:0 0 14px 0;">Hallo ${escapeHtml(input.tenantFirstName)},</p>
<p style="margin:0 0 14px 0;">es gibt ein neues Inserat auf Helvenda Wohnungen, das zu deinen Suchkriterien passt:</p>
<p style="margin:0 0 8px 0;"><strong>${escapeHtml(input.listingTitle)}</strong><br>
<span style="color:#4b5563;">${escapeHtml(input.addressLine)} · ${escapeHtml(formatRoomsDe(input.rooms))} · CHF ${escapeHtml(formatChf(input.rentPerMonth))}/Monat</span></p>
${buttonRow(listingLink, 'Inserat ansehen')}
<p style="margin:16px 0 0 0;font-size:14px;color:#4b5563;">Mit deinem Helvenda-Profil kannst du dich in einem Klick bewerben. <a href="${escapeHtml(matchesLink)}" style="color:#18a87c;">Alle Matches</a></p>
`
  const subject = `Neue Wohnung: „${input.listingTitle}“`
  const text = [
    `Hallo ${input.tenantFirstName},`,
    '',
    'Neues Inserat, das zu deiner Suche passt:',
    input.listingTitle,
    `${input.addressLine} · ${formatRoomsDe(input.rooms)} · CHF ${formatChf(input.rentPerMonth)}/Monat`,
    '',
    listingLink,
  ].join('\n')
  return { subject, html: layout(inner), text: appendWohnenPublicNotice(text, true) }
}

/** Template 3 — Betreibungsregisterauszug ungültig (Mieter) */
export function templateTenantCreditRejected(input: { tenantFirstName: string }): WohnenEmailPayload {
  const o = wohnenOrigin()
  const link = `${o}/profil/betreibungsregister`
  const inner = `
<p style="margin:0 0 14px 0;">Hallo ${escapeHtml(input.tenantFirstName)},</p>
<p style="margin:0 0 14px 0;">leider konnten wir deinen Betreibungsregisterauszug nicht verarbeiten.</p>
<p style="margin:0 0 10px 0;"><strong>Mögliche Gründe:</strong></p>
<ul style="margin:0 0 16px 0;padding-left:20px;color:#374151;">
<li style="margin:4px 0;">Das Dokument ist älter als 3 Monate</li>
<li style="margin:4px 0;">Es handelt sich nicht um einen offiziellen Schweizer Auszug</li>
<li style="margin:4px 0;">Das Dokument ist unleserlich oder beschädigt</li>
</ul>
<p style="margin:0 0 14px 0;">Bitte lade einen neuen, gültigen Auszug hoch:</p>
${buttonRow(link, 'Neuen Auszug hochladen')}
<p style="margin:20px 0 0 0;font-size:14px;color:#4b5563;"><strong>Wo bekommst du den Auszug?</strong><br>
Bestelle ihn beim Betreibungsamt deines Wohnorts (ca. CHF 17.—).<br>
Online: <a href="https://betreibungsaemter.ch" style="color:#18a87c;">betreibungsaemter.ch</a></p>
`
  const subject = 'Dein Betreibungsregisterauszug konnte nicht verarbeitet werden'
  const text = [
    `Hallo ${input.tenantFirstName},`,
    '',
    'Leider konnten wir deinen Betreibungsregisterauszug nicht verarbeiten.',
    'Mögliche Gründe: Dokument >3 Monate, kein offizieller CH-Auszug, unleserlich.',
    '',
    'Neu hochladen:',
    link,
    '',
    'betreibungsaemter.ch',
  ].join('\n')
  return { subject, html: layout(inner), text: appendWohnenPublicNotice(text, true) }
}

/** Template 4 — Betreibungsregisterauszug verifiziert (Mieter) */
export function templateTenantCreditVerified(input: {
  tenantFirstName: string
  result: CreditCheckResult
  validUntil: Date
}): WohnenEmailPayload {
  const o = wohnenOrigin()
  const link = `${o}/wohnungen`
  const until = input.validUntil.toLocaleDateString('de-CH', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
  const statusLine = betreibungsLineForTenantVerified(input.result)
  const inner = `
<p style="margin:0 0 14px 0;">Hallo ${escapeHtml(input.tenantFirstName)},</p>
<p style="margin:0 0 14px 0;">dein Betreibungsregisterauszug wurde erfolgreich verifiziert.</p>
<p style="margin:0 0 6px 0;"><strong>Status:</strong> ${escapeHtml(statusLine)}</p>
<p style="margin:0 0 18px 0;"><strong>Gültig bis:</strong> ${escapeHtml(until)}</p>
<p style="margin:0 0 14px 0;">Du kannst dich jetzt auf Wohnungen bewerben.<br>
Dein Auszug gilt automatisch für alle deine Bewerbungen und muss nicht erneut hochgeladen werden.</p>
${buttonRow(link, 'Wohnungen suchen')}
`
  const subject = 'Dein Betreibungsregisterauszug wurde verifiziert ✅'
  const text = [
    `Hallo ${input.tenantFirstName},`,
    '',
    'Dein Betreibungsregisterauszug wurde verifiziert.',
    `Status: ${statusLine}`,
    `Gültig bis: ${until}`,
    '',
    link,
  ].join('\n')
  return { subject, html: layout(inner), text: appendWohnenPublicNotice(text, true) }
}

/** Template 5 — Manuelle Prüfung (Mieter) */
export function templateTenantCreditManualReview(input: { tenantFirstName: string }): WohnenEmailPayload {
  const o = wohnenOrigin()
  const link = `${o}/profil`
  const inner = `
<p style="margin:0 0 14px 0;">Hallo ${escapeHtml(input.tenantFirstName)},</p>
<p style="margin:0 0 14px 0;">dein Betreibungsregisterauszug konnte nicht automatisch verarbeitet werden und wird nun manuell geprüft.</p>
<p style="margin:0 0 14px 0;">Dies dauert in der Regel 1–2 Werktage.<br>
Du erhältst eine E-Mail sobald die Prüfung abgeschlossen ist.</p>
${buttonRow(link, 'Zu meinem Profil')}
`
  const subject = 'Dein Betreibungsregisterauszug wird manuell geprüft'
  const text = [
    `Hallo ${input.tenantFirstName},`,
    '',
    'Dein Auszug wird manuell geprüft (1–2 Werktage).',
    link,
  ].join('\n')
  return { subject, html: layout(inner), text: appendWohnenPublicNotice(text, true) }
}

/** Template 6 — Manuelle Prüfung (Admin, Profil-Credit-Check) */
export function templateAdminCreditManualReview(input: {
  userDisplayName: string
  userEmail: string
  userId: string
  uploadedAt: Date
  encryptedFileRef: string
}): WohnenEmailPayload {
  const adminLink = `${wohnenOrigin()}/admin/wohnen`
  const uploaded = input.uploadedAt.toLocaleString('de-CH', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
  const inner = `
<p style="margin:0 0 14px 0;">Ein Betreibungsregisterauszug konnte nicht automatisch verarbeitet werden und benötigt manuelle Prüfung.</p>
<p style="margin:0 0 6px 0;"><strong>User:</strong> ${escapeHtml(input.userDisplayName)} (${escapeHtml(input.userEmail)})</p>
<p style="margin:0 0 6px 0;"><strong>User-ID:</strong> ${escapeHtml(input.userId)}</p>
<p style="margin:0 0 6px 0;"><strong>Hochgeladen am:</strong> ${escapeHtml(uploaded)}</p>
<p style="margin:0 0 18px 0;"><strong>Datei-Referenz:</strong> ${escapeHtml(input.encryptedFileRef)}</p>
${buttonRow(adminLink, 'Zum Admin-Bereich')}
<p style="margin:16px 0 0 0;font-size:13px;color:#6b7280;">Admin-E-Mail: admin@helvenda.ch</p>
`
  const subject = `[ADMIN] Manuelles Credit Check Review erforderlich — ${input.userDisplayName}`
  const text = [
    'Manuelles Credit Check Review erforderlich.',
    `User: ${input.userDisplayName} (${input.userEmail})`,
    `User-ID: ${input.userId}`,
    `Hochgeladen: ${uploaded}`,
    `Datei: ${input.encryptedFileRef}`,
    adminLink,
  ].join('\n')
  return { subject, html: layout(inner, { publicNotice: false }), text: appendWohnenPublicNotice(text, false) }
}

/** Admin: Mietanfrage mit PDF — manuelle Prüfung (Legacy-Kontaktflow) */
export function templateAdminRentalApplicationManualReview(input: {
  listingTitle: string
  applicationId: string
}): WohnenEmailPayload {
  const o = wohnenOrigin()
  const link = `${o}/wohnungen/anfragen/${encodeURIComponent(input.applicationId)}`
  const inner = `
<p style="margin:0 0 14px 0;">Die Prüfung eines Betreibungsregisterauszugs aus einer Mietanfrage konnte nicht automatisch abgeschlossen werden.</p>
<p style="margin:0 0 6px 0;"><strong>Inserat:</strong> ${escapeHtml(input.listingTitle)}</p>
<p style="margin:0 0 18px 0;"><strong>Anfrage-ID:</strong> ${escapeHtml(input.applicationId)}</p>
${buttonRow(link, 'Anfrage öffnen')}
`
  const subject = `[Helvenda] Manuelle Prüfung — ${input.listingTitle}`
  const text = [`Manuelle Prüfung Mietanfrage`, `Inserat: ${input.listingTitle}`, `ID: ${input.applicationId}`, link].join('\n')
  return { subject, html: layout(inner, { publicNotice: false }), text: appendWohnenPublicNotice(text, false) }
}

/** Template 7 — Besichtigung angefragt (Mieter) */
export function templateTenantViewingRequested(input: {
  tenantFirstName: string
  listingTitle: string
  listingAddress: string
  viewingAt: Date
  landlordNote: string | null
}): WohnenEmailPayload {
  const o = wohnenOrigin()
  const link = `${o}/meine-bewerbungen`
  const d = input.viewingAt
  const weekday = d.toLocaleDateString('de-CH', { weekday: 'long' })
  const dateStr = d.toLocaleDateString('de-CH', { day: '2-digit', month: 'long', year: 'numeric' })
  const timeStr = d.toLocaleTimeString('de-CH', { hour: '2-digit', minute: '2-digit' })
  const noteBlock =
    input.landlordNote?.trim() ?
      `<p style="margin:14px 0 0 0;padding:12px 14px;background-color:#f9fafb;border-radius:4px;font-size:14px;color:#374151;"><strong>Notiz des Vermieters:</strong><br>${escapeHtml(input.landlordNote.trim())}</p>`
    : ''
  const inner = `
<p style="margin:0 0 14px 0;">Hallo ${escapeHtml(input.tenantFirstName)},</p>
<p style="margin:0 0 14px 0;">gute Neuigkeiten! Der Vermieter von <strong>„${escapeHtml(input.listingTitle)}“</strong> möchte dir die Wohnung zeigen.</p>
<p style="margin:0 0 6px 0;"><strong>Datum:</strong> ${escapeHtml(weekday)}, ${escapeHtml(dateStr)}</p>
<p style="margin:0 0 6px 0;"><strong>Uhrzeit:</strong> ${escapeHtml(timeStr)} Uhr</p>
<p style="margin:0 0 14px 0;"><strong>Adresse:</strong> ${escapeHtml(input.listingAddress)}</p>
${noteBlock}
<p style="margin:18px 0 14px 0;">Bitte bestätige dem Vermieter deine Teilnahme.</p>
${buttonRow(link, 'Meine Bewerbungen')}
<p style="margin:16px 0 0 0;font-size:14px;color:#4b5563;">Falls dieser Termin nicht passt, kontaktiere den Vermieter direkt über die Plattform.</p>
`
  const subject = `Besichtigungsanfrage für „${input.listingTitle}“ — ${dateStr}`
  const text = [
    `Hallo ${input.tenantFirstName},`,
    '',
    `Besichtigung für „${input.listingTitle}“`,
    `${weekday}, ${dateStr} um ${timeStr}`,
    `Adresse: ${input.listingAddress}`,
    input.landlordNote?.trim() ? `Notiz: ${input.landlordNote.trim()}` : '',
    '',
    link,
  ]
    .filter(Boolean)
    .join('\n')
  return { subject, html: layout(inner), text: appendWohnenPublicNotice(text, true) }
}

/** Template 8 — Betreibungsregisterauszug läuft bald ab (Mieter) */
export function templateTenantCreditExpiryReminder(input: {
  tenantFirstName: string
  expiresOn: Date
}): WohnenEmailPayload {
  const o = wohnenOrigin()
  const link = `${o}/profil/betreibungsregister`
  const exp = input.expiresOn.toLocaleDateString('de-CH', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
  const inner = `
<p style="margin:0 0 14px 0;">Hallo ${escapeHtml(input.tenantFirstName)},</p>
<p style="margin:0 0 14px 0;">dein Betreibungsregisterauszug läuft am <strong>${escapeHtml(exp)}</strong> ab.</p>
<p style="margin:0 0 14px 0;">Nach Ablauf kannst du dich nicht mehr auf neue Wohnungen bewerben bis du einen neuen Auszug hochlädst.</p>
${buttonRow(link, 'Jetzt erneuern')}
<p style="margin:20px 0 0 0;font-size:14px;color:#4b5563;"><strong>Wo bekommst du den Auszug?</strong><br>
Bestelle ihn beim Betreibungsamt deines Wohnorts (ca. CHF 17.—).<br>
Online: <a href="https://betreibungsaemter.ch" style="color:#18a87c;">betreibungsaemter.ch</a></p>
`
  const subject = 'Dein Betreibungsregisterauszug läuft in 3 Tagen ab ⚠️'
  const text = [
    `Hallo ${input.tenantFirstName},`,
    '',
    `Dein Auszug läuft am ${exp} ab.`,
    link,
    'betreibungsaemter.ch',
  ].join('\n')
  return { subject, html: layout(inner), text: appendWohnenPublicNotice(text, true) }
}

/** Template 8b — Betreibungsregisterauszug: frühe Erinnerung (~14 Tage) */
export function templateTenantCreditExpiryReminder14d(input: {
  tenantFirstName: string
  expiresOn: Date
}): WohnenEmailPayload {
  const o = wohnenOrigin()
  const link = `${o}/profil/betreibungsregister`
  const exp = input.expiresOn.toLocaleDateString('de-CH', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
  const inner = `
<p style="margin:0 0 14px 0;">Hallo ${escapeHtml(input.tenantFirstName)},</p>
<p style="margin:0 0 14px 0;">dein Betreibungsregisterauszug läuft am <strong>${escapeHtml(exp)}</strong> ab — in etwa zwei Wochen.</p>
<p style="margin:0 0 14px 0;">Wenn du frühzeitig einen neuen Auszug bestellst und hochlädst, bleiben dein Profil und dein Helvenda Qualitätsnachweis ohne Unterbruch gültig.</p>
${buttonRow(link, 'Auszug vorbereiten')}
<p style="margin:20px 0 0 0;font-size:14px;color:#4b5563;"><strong>Wo bestellen?</strong><br>
Betreibungsamt deines Wohnorts oder online: <a href="https://betreibungsaemter.ch" style="color:#18a87c;">betreibungsaemter.ch</a></p>
`
  const subject = 'Erinnerung: Betreibungsregisterauszug läuft in ca. 14 Tagen ab'
  const text = [
    `Hallo ${input.tenantFirstName},`,
    '',
    `Dein Auszug läuft am ${exp} ab (ca. 14 Tage).`,
    link,
    'betreibungsaemter.ch',
  ].join('\n')
  return { subject, html: layout(inner), text: appendWohnenPublicNotice(text, true) }
}

/** Qualitätsnachweis läuft bald ab (ACTIVE, vor Ablaufdatum) */
export function templateTenantCertificateExpirySoon(input: {
  tenantFirstName: string
  expiresOn: Date
  daysBefore: 14 | 3
  certificateCode: string
}): WohnenEmailPayload {
  const o = wohnenOrigin()
  const zertLink = `${o}/zertifikat`
  const registerLink = `${o}/profil/betreibungsregister`
  const exp = input.expiresOn.toLocaleDateString('de-CH', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
  const phase =
    input.daysBefore === 14 ?
      'In etwa zwei Wochen läuft dein Helvenda Qualitätsnachweis ab.'
    : 'Dein Helvenda Qualitätsnachweis läuft in den nächsten 3 Tagen ab.'
  const inner = `
<p style="margin:0 0 14px 0;">Hallo ${escapeHtml(input.tenantFirstName)},</p>
<p style="margin:0 0 14px 0;">${escapeHtml(phase)}</p>
<p style="margin:0 0 10px 0;"><strong>Gültig bis:</strong> ${escapeHtml(exp)}</p>
<p style="margin:0 0 10px 0;"><strong>Code:</strong> <span style="font-family:ui-monospace,monospace;">${escapeHtml(input.certificateCode)}</span></p>
<p style="margin:0 0 14px 0;">Nach Ablauf funktionieren PDF und Prüf-Link für Vermieter nicht mehr. Stelle bei Bedarf ein neues Zertifikat aus, sobald dein Betreibungsregister wieder gültig ist.</p>
${buttonRow(zertLink, 'Zum Qualitätsnachweis')}
<p style="margin:16px 0 0 0;font-size:14px;color:#4b5563;">Register erneuern: <a href="${escapeHtml(registerLink)}" style="color:#18a87c;">${escapeHtml(registerLink)}</a></p>
`
  const subject =
    input.daysBefore === 14 ?
      'Dein Helvenda Qualitätsnachweis läuft in ca. 14 Tagen ab'
    : 'Dein Helvenda Qualitätsnachweis läuft bald ab ⚠️'
  const text = [
    `Hallo ${input.tenantFirstName},`,
    '',
    phase,
    `Gültig bis: ${exp}`,
    `Code: ${input.certificateCode}`,
    '',
    zertLink,
    registerLink,
  ].join('\n')
  return { subject, html: layout(inner), text: appendWohnenPublicNotice(text, true) }
}

/** Admin: Inserat automatisch deaktiviert — URL 404 */
export function templateAdminListingDeactivatedUrl404(input: {
  listingTitle: string
  address: string
  importedFrom: string
  listingId: string
  deactivatedAt: Date
}): WohnenEmailPayload {
  const adminLink = wohnenAdminListingEditLink(input.listingId)
  const when = input.deactivatedAt.toLocaleString('de-CH', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
  const inner = `
<p style="margin:0 0 14px 0;">Das folgende Inserat wurde automatisch deaktiviert, weil die Original-URL einen 404-Fehler zurückgegeben hat:</p>
<p style="margin:0 0 6px 0;"><strong>Titel:</strong> ${escapeHtml(input.listingTitle)}</p>
<p style="margin:0 0 6px 0;"><strong>Adresse:</strong> ${escapeHtml(input.address)}</p>
<p style="margin:0 0 6px 0;"><strong>Original-URL:</strong> ${escapeHtml(input.importedFrom)}</p>
<p style="margin:0 0 18px 0;"><strong>Deaktiviert am:</strong> ${escapeHtml(when)}</p>
${buttonRow(adminLink, 'Inserat prüfen')}
<p style="margin:16px 0 0 0;font-size:14px;color:#4b5563;">Falls die Wohnung noch verfügbar ist, kannst du das Inserat manuell wieder aktivieren.</p>
`
  const subject = '[ADMIN] Inserat automatisch deaktiviert — URL 404'
  const text = [
    'Inserat automatisch deaktiviert (404).',
    `Titel: ${input.listingTitle}`,
    `Adresse: ${input.address}`,
    `Original-URL: ${input.importedFrom}`,
    `Deaktiviert am: ${when}`,
    '',
    adminLink,
    '',
    'Falls die Wohnung noch verfügbar ist, Inserat manuell wieder aktivieren.',
  ].join('\n')
  return { subject, html: layout(inner, { publicNotice: false }), text: appendWohnenPublicNotice(text, false) }
}

/** Admin: Inserat automatisch deaktiviert — „vergeben“ laut URL-Text */
export function templateAdminListingDeactivatedUrlRented(input: {
  listingTitle: string
  address: string
  importedFrom: string
  listingId: string
  keyword: string
  deactivatedAt: Date
}): WohnenEmailPayload {
  const adminLink = wohnenAdminListingEditLink(input.listingId)
  const when = input.deactivatedAt.toLocaleString('de-CH', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
  const inner = `
<p style="margin:0 0 14px 0;">Das folgende Inserat wurde automatisch deaktiviert, weil die Original-URL auf eine vergebene Wohnung hindeutet:</p>
<p style="margin:0 0 6px 0;"><strong>Titel:</strong> ${escapeHtml(input.listingTitle)}</p>
<p style="margin:0 0 6px 0;"><strong>Adresse:</strong> ${escapeHtml(input.address)}</p>
<p style="margin:0 0 6px 0;"><strong>Original-URL:</strong> ${escapeHtml(input.importedFrom)}</p>
<p style="margin:0 0 6px 0;"><strong>Erkanntes Keyword:</strong> ${escapeHtml(input.keyword)}</p>
<p style="margin:0 0 18px 0;"><strong>Deaktiviert am:</strong> ${escapeHtml(when)}</p>
${buttonRow(adminLink, 'Inserat prüfen')}
<p style="margin:16px 0 0 0;font-size:14px;color:#4b5563;">Falls die Wohnung noch verfügbar ist, kannst du das Inserat manuell wieder aktivieren.</p>
`
  const subject = '[ADMIN] Inserat automatisch deaktiviert — Wohnung vergeben'
  const text = [
    'Inserat automatisch deaktiviert (vergeben laut URL).',
    `Titel: ${input.listingTitle}`,
    `Adresse: ${input.address}`,
    `Original-URL: ${input.importedFrom}`,
    `Keyword: ${input.keyword}`,
    `Deaktiviert am: ${when}`,
    '',
    adminLink,
  ].join('\n')
  return { subject, html: layout(inner, { publicNotice: false }), text: appendWohnenPublicNotice(text, false) }
}

/** Admin: Inserat wegen mehrerer Bewerber-Meldungen deaktiviert */
export function templateAdminListingDeactivatedStaleReports(input: {
  listingTitle: string
  address: string
  listingId: string
  staleReportCount: number
  lastReportAt: Date
  notes: string[]
}): WohnenEmailPayload {
  const adminLink = wohnenAdminListingEditLink(input.listingId)
  const last = input.lastReportAt.toLocaleString('de-CH', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
  const notesBlock =
    input.notes.length ?
      `<ul style="margin:8px 0 0 0;padding-left:20px;">${input.notes
        .map(n => `<li style="margin:4px 0;">${escapeHtml(n)}</li>`)
        .join('')}</ul>`
    : '<p style="margin:8px 0 0 0;color:#6b7280;">(Keine Notizen)</p>'
  const inner = `
<p style="margin:0 0 14px 0;">Das folgende Inserat wurde deaktiviert, weil 2 Bewerber gemeldet haben, dass die Wohnung nicht mehr verfügbar ist:</p>
<p style="margin:0 0 6px 0;"><strong>Titel:</strong> ${escapeHtml(input.listingTitle)}</p>
<p style="margin:0 0 6px 0;"><strong>Adresse:</strong> ${escapeHtml(input.address)}</p>
<p style="margin:0 0 6px 0;"><strong>Anzahl Meldungen:</strong> ${escapeHtml(String(input.staleReportCount))}</p>
<p style="margin:0 0 10px 0;"><strong>Letzte Meldung:</strong> ${escapeHtml(last)}</p>
<p style="margin:0 0 4px 0;"><strong>Meldungs-Notizen:</strong></p>
${notesBlock}
${buttonRow(adminLink, 'Inserat prüfen')}
<p style="margin:16px 0 0 0;font-size:14px;color:#4b5563;">Falls die Wohnung noch verfügbar ist, kannst du das Inserat manuell wieder aktivieren.</p>
`
  const subject = '[ADMIN] Inserat deaktiviert — 2 Bewerber melden „vergeben“'
  const text = [
    'Inserat deaktiviert (2 Bewerber-Meldungen).',
    `Titel: ${input.listingTitle}`,
    `Adresse: ${input.address}`,
    `Meldungen: ${input.staleReportCount}`,
    `Letzte Meldung: ${last}`,
    'Notizen:',
    ...input.notes.map(n => `- ${n}`),
    '',
    adminLink,
  ].join('\n')
  return { subject, html: layout(inner, { publicNotice: false }), text: appendWohnenPublicNotice(text, false) }
}

/** Admin: URL mehrfach nicht erreichbar (3 aufeinanderfolgende UNREACHABLE) */
export function templateAdminListingUrlUnreachableStreak(input: {
  listingTitle: string
  address: string
  importedFrom: string
  listingId: string
}): WohnenEmailPayload {
  const adminLink = wohnenAdminListingEditLink(input.listingId)
  const inner = `
<p style="margin:0 0 14px 0;">Die Original-URL eines aktiven Inserats war bei <strong>3 aufeinanderfolgenden</strong> automatischen Prüfungen nicht erreichbar (Timeout oder Netzwerkfehler):</p>
<p style="margin:0 0 6px 0;"><strong>Titel:</strong> ${escapeHtml(input.listingTitle)}</p>
<p style="margin:0 0 6px 0;"><strong>Adresse:</strong> ${escapeHtml(input.address)}</p>
<p style="margin:0 0 18px 0;"><strong>Original-URL:</strong> ${escapeHtml(input.importedFrom)}</p>
${buttonRow(adminLink, 'Inserat prüfen')}
<p style="margin:16px 0 0 0;font-size:14px;color:#4b5563;">Bitte prüfen, ob die URL blockiert oder das Inserat manuell zu pflegen ist.</p>
`
  const subject = '[ADMIN] Inserat-URL 3× nicht erreichbar — manuelle Prüfung'
  const text = [
    'URL 3× nicht erreichbar.',
    `Titel: ${input.listingTitle}`,
    `Adresse: ${input.address}`,
    `URL: ${input.importedFrom}`,
    '',
    adminLink,
  ].join('\n')
  return { subject, html: layout(inner, { publicNotice: false }), text: appendWohnenPublicNotice(text, false) }
}

/** Vermieter:in: Inserat wegen abgelaufenem «Gültig bis» archiviert */
export function templateLandlordListingExpiredCalendar(input: {
  tenantFirstName: string
  listingTitle: string
  listingId: string
  address: string
  listingExpiresOn: string
  editLink: string
  deactivatedAt: Date
}): WohnenEmailPayload {
  const when = input.deactivatedAt.toLocaleString('de-CH', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
  const inner = `
<p style="margin:0 0 14px 0;">Hallo ${escapeHtml(input.tenantFirstName)},</p>
<p style="margin:0 0 14px 0;">dein Miet-Inserat <strong>${escapeHtml(input.listingTitle)}</strong> (${escapeHtml(
    input.address,
  )}) wurde automatisch archiviert, weil das eingetragene <strong>Gültig bis</strong>-Datum (<strong>${escapeHtml(
    input.listingExpiresOn,
  )}</strong>) erreicht ist.</p>
<p style="margin:0 0 14px 0;">Wenn die Wohnung noch verfügbar ist, kannst du ein neues Gültigkeitsdatum setzen und das Inserat wieder aktivieren.</p>
${buttonRow(input.editLink, 'Inserat bearbeiten')}
<p style="margin:16px 0 0 0;font-size:13px;color:#6b7280;">Archiviert am: ${escapeHtml(when)} · Inserat-ID: ${escapeHtml(
    input.listingId,
  )}</p>
`
  const subject = `Dein Miet-Inserat wurde archiviert (Gültigkeit ${input.listingExpiresOn})`
  const text = [
    `Hallo ${input.tenantFirstName},`,
    '',
    `Dein Inserat «${input.listingTitle}» (${input.address}) wurde archiviert.`,
    `Gültig bis: ${input.listingExpiresOn}`,
    `Archiviert am: ${when}`,
    '',
    input.editLink,
  ].join('\n')
  return { subject, html: layout(inner), text: appendWohnenPublicNotice(text, true) }
}

/** Admin: Kalender-Gültigkeit abgelaufen — Prüfung / Verlängern / Entfernen */
export function templateAdminListingExpiredCalendar(input: {
  listingTitle: string
  address: string
  listingId: string
  listingExpiresOn: string
  deactivatedAt: Date
}): WohnenEmailPayload {
  const adminLink = wohnenAdminListingEditLink(input.listingId)
  const when = input.deactivatedAt.toLocaleString('de-CH', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
  const inner = `
<p style="margin:0 0 14px 0;">Ein Miet-Inserat wurde automatisch archiviert, weil das <strong>Gültig bis</strong>-Datum erreicht ist (ohne oder zusätzlich zur URL-Überwachung):</p>
<p style="margin:0 0 6px 0;"><strong>Titel:</strong> ${escapeHtml(input.listingTitle)}</p>
<p style="margin:0 0 6px 0;"><strong>Adresse:</strong> ${escapeHtml(input.address)}</p>
<p style="margin:0 0 6px 0;"><strong>Gültig bis:</strong> ${escapeHtml(input.listingExpiresOn)}</p>
<p style="margin:0 0 18px 0;"><strong>Archiviert am:</strong> ${escapeHtml(when)}</p>
${buttonRow(adminLink, 'Inserat prüfen')}
<p style="margin:16px 0 0 0;font-size:14px;color:#4b5563;">Bitte im Admin entscheiden: verlängern (neues Datum, reaktivieren), dauerhaft entfernen oder die Prüfung in der Inserat-Liste als erledigt markieren.</p>
`
  const subject = '[ADMIN] Miet-Inserat archiviert — «Gültig bis» abgelaufen'
  const text = [
    'Inserat archiviert (Kalender-Gültigkeit).',
    `Titel: ${input.listingTitle}`,
    `Adresse: ${input.address}`,
    `Gültig bis: ${input.listingExpiresOn}`,
    `Archiviert am: ${when}`,
    '',
    adminLink,
  ].join('\n')
  return { subject, html: layout(inner, { publicNotice: false }), text: appendWohnenPublicNotice(text, false) }
}

export function templateTenantCertificateExpired(input: {
  tenantFirstName: string
  renewLink: string
}): WohnenEmailPayload {
  const inner = `
<p style="margin:0 0 14px 0;">Hallo ${escapeHtml(input.tenantFirstName)},</p>
<p style="margin:0 0 14px 0;">dein <strong>Helvenda Qualitätsnachweis</strong> ist abgelaufen.</p>
<p style="margin:0 0 14px 0;">Wenn du deinen Betreibungsregisterauszug erneuerst und erneut von uns geprüft wird, kannst du ein neues Zertifikat ausstellen lassen — ideal für Bewerbungen ausserhalb von Helvenda.</p>
${buttonRow(input.renewLink, 'Betreibungsregister erneuern')}
<p style="margin:20px 0 0 0;font-size:13px;color:#6b7280;">Hinweis: Der Verifikations-Link auf deinem alten PDF ist nicht mehr gültig.</p>
`
  const subject = 'Dein Helvenda Qualitätsnachweis ist abgelaufen'
  const text = [
    `Hallo ${input.tenantFirstName},`,
    '',
    'Dein Helvenda Qualitätsnachweis ist abgelaufen.',
    'Erneuere deinen Betreibungsregisterauszug, um ein neues Zertifikat auszustellen.',
    input.renewLink,
  ].join('\n')
  return { subject, html: layout(inner), text: appendWohnenPublicNotice(text, true) }
}
