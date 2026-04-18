/**
 * Helvenda Wohnungen — transaktionale E-Mail-Templates (reine Funktionen, keine Side Effects).
 * Layout: Teal-Header, weisser Body (max. 600px), grauer Footer — alles Inline-CSS.
 */

import type { EmploymentStatus, IncomeCategory } from '@prisma/client'
import { employmentLabelDe, incomeCategoryLabelDe } from '@/lib/tenant-profile/labels'
import { MAIN_SHOP_ORIGIN, WOHNEN_SITE_ORIGIN } from '@/lib/site-urls'
import type { CreditCheckResult } from '@/lib/rental/types'
import { isCreditCheckResult } from '@/lib/rental/types'

export type WohnenEmailPayload = { subject: string; html: string; text: string }

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function wohnenOrigin(): string {
  return WOHNEN_SITE_ORIGIN.replace(/\/$/, '')
}

function mainOrigin(): string {
  return MAIN_SHOP_ORIGIN.replace(/\/$/, '')
}

function formatChf(n: number): string {
  return new Intl.NumberFormat('de-CH', { maximumFractionDigits: 0 }).format(n)
}

function formatRoomsDe(rooms: number): string {
  const s = Number.isInteger(rooms) ? String(rooms) : String(rooms).replace('.', ',')
  return `${s} Zi`
}

function layout(innerHtml: string): string {
  const origin = wohnenOrigin()
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
  landlordFirstName: string
  listingTitle: string
  listingId: string
  applicantFullName: string
  employmentStatus: EmploymentStatus
  employer: string | null
  incomeCategory: IncomeCategory
  requiresCreditCheck: boolean
  creditCheckResult: unknown
  referenceName: string | null
  referencePhone: string | null
  applicantMessage: string | null
}): WohnenEmailPayload {
  const o = wohnenOrigin()
  const link = `${o}/matching/properties/${encodeURIComponent(input.listingId)}/bewerbungen`
  const msgBox =
    input.applicantMessage?.trim() ?
      `<div style="margin:16px 0;padding:14px 16px;background-color:#f9fafb;border-left:4px solid #18a87c;border-radius:4px;color:#374151;font-size:14px;">${escapeHtml(input.applicantMessage.trim())}</div>`
    : ''

  const inner = `
<p style="margin:0 0 14px 0;">Hallo ${escapeHtml(input.landlordFirstName)},</p>
<p style="margin:0 0 14px 0;">du hast eine neue Bewerbung für dein Inserat <strong>„${escapeHtml(input.listingTitle)}“</strong> erhalten.</p>
<p style="margin:0 0 6px 0;"><strong>Bewerber:</strong> ${escapeHtml(input.applicantFullName)}</p>
<p style="margin:0 0 6px 0;"><strong>Beschäftigung:</strong> ${employmentLine(input.employmentStatus, input.employer)}</p>
<p style="margin:0 0 6px 0;"><strong>Einkommen:</strong> ${escapeHtml(incomeCategoryLabelDe(input.incomeCategory))}</p>
<p style="margin:0 0 6px 0;"><strong>Betreibungsregister:</strong> ${escapeHtml(betreibungsLineForLandlord(input.requiresCreditCheck, input.creditCheckResult))}</p>
<p style="margin:0 0 18px 0;"><strong>Referenz:</strong> ${escapeHtml(referenceLine(input.referenceName, input.referencePhone))}</p>
${msgBox}
${buttonRow(link, 'Bewerbung ansehen')}
`

  const subject = `Neue Bewerbung für „${input.listingTitle}“ — ${input.applicantFullName}`
  const text = [
    `Hallo ${input.landlordFirstName},`,
    '',
    `Du hast eine neue Bewerbung für dein Inserat „${input.listingTitle}“ erhalten.`,
    `Bewerber: ${input.applicantFullName}`,
    `Beschäftigung: ${employmentLabelDe(input.employmentStatus)}${input.employer?.trim() ? ` · ${input.employer.trim()}` : ''}`,
    `Einkommen: ${incomeCategoryLabelDe(input.incomeCategory)}`,
    `Betreibungsregister: ${betreibungsLineForLandlord(input.requiresCreditCheck, input.creditCheckResult)}`,
    `Referenz: ${referenceLine(input.referenceName, input.referencePhone)}`,
    input.applicantMessage?.trim() ? `\nNachricht:\n${input.applicantMessage.trim()}` : '',
    '',
    link,
  ]
    .filter(Boolean)
    .join('\n')

  return { subject, html: layout(inner), text }
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
  return { subject, html: layout(inner), text }
}

/** Template 3 — Betreibungsregister ungültig (Mieter) */
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
  return { subject, html: layout(inner), text }
}

/** Template 4 — Betreibungsregister verifiziert (Mieter) */
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
  const subject = 'Dein Betreibungsregister wurde verifiziert ✅'
  const text = [
    `Hallo ${input.tenantFirstName},`,
    '',
    'Dein Betreibungsregisterauszug wurde verifiziert.',
    `Status: ${statusLine}`,
    `Gültig bis: ${until}`,
    '',
    link,
  ].join('\n')
  return { subject, html: layout(inner), text }
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
  const subject = 'Dein Betreibungsregister wird manuell geprüft'
  const text = [
    `Hallo ${input.tenantFirstName},`,
    '',
    'Dein Auszug wird manuell geprüft (1–2 Werktage).',
    link,
  ].join('\n')
  return { subject, html: layout(inner), text }
}

/** Template 6 — Manuelle Prüfung (Admin, Profil-Credit-Check) */
export function templateAdminCreditManualReview(input: {
  userDisplayName: string
  userEmail: string
  userId: string
  uploadedAt: Date
  encryptedFileRef: string
}): WohnenEmailPayload {
  const m = mainOrigin()
  const adminLink = `${m}/admin`
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
  return { subject, html: layout(inner), text }
}

/** Admin: Mietanfrage mit PDF — manuelle Prüfung (Legacy-Kontaktflow) */
export function templateAdminRentalApplicationManualReview(input: {
  listingTitle: string
  applicationId: string
}): WohnenEmailPayload {
  const o = wohnenOrigin()
  const link = `${o}/wohnungen/anfragen/${encodeURIComponent(input.applicationId)}`
  const inner = `
<p style="margin:0 0 14px 0;">Eine Betreibungsregister-Analyse aus einer Mietanfrage konnte nicht automatisch abgeschlossen werden.</p>
<p style="margin:0 0 6px 0;"><strong>Inserat:</strong> ${escapeHtml(input.listingTitle)}</p>
<p style="margin:0 0 18px 0;"><strong>Anfrage-ID:</strong> ${escapeHtml(input.applicationId)}</p>
${buttonRow(link, 'Anfrage öffnen')}
`
  const subject = `[Helvenda] Manuelle Prüfung — ${input.listingTitle}`
  const text = [`Manuelle Prüfung Mietanfrage`, `Inserat: ${input.listingTitle}`, `ID: ${input.applicationId}`, link].join('\n')
  return { subject, html: layout(inner), text }
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
  return { subject, html: layout(inner), text }
}

/** Template 8 — Betreibungsregister läuft bald ab (Mieter) */
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
  const subject = 'Dein Betreibungsregister läuft in 3 Tagen ab ⚠️'
  const text = [
    `Hallo ${input.tenantFirstName},`,
    '',
    `Dein Auszug läuft am ${exp} ab.`,
    link,
    'betreibungsaemter.ch',
  ].join('\n')
  return { subject, html: layout(inner), text }
}
