import { getHelvendaEmailTemplate } from '@/lib/email/base-template'
import { sendEmail } from '@/lib/email/sender'
import { getRentalPublicBaseUrl } from '@/lib/site-urls'

function firstName(user: { firstName?: string | null; name?: string | null }): string {
  if (user.firstName?.trim()) return user.firstName.trim()
  const n = user.name?.trim()
  if (n) return n.split(/\s+/)[0] || n
  return 'du'
}

export async function sendRentalLandlordNewApplicationEmail(opts: {
  landlordEmail: string
  landlordUserId: string
  landlordFirst: { firstName?: string | null; name?: string | null }
  listingTitle: string
  applicantName: string
  applicantMessage: string
  creditSummary: string
  applicationId: string
}): Promise<void> {
  const base = getRentalPublicBaseUrl().replace(/\/$/, '')
  const link = `${base}/wohnungen/anfragen/${opts.applicationId}`
  const fn = firstName(opts.landlordFirst)
  const html = getHelvendaEmailTemplate({
    title: `Neue Anfrage für „${opts.listingTitle}“`,
    greeting: `Hallo ${fn},`,
    content: `
      <p>du hast eine neue Anfrage für deine Wohnung <strong>${escapeHtml(opts.listingTitle)}</strong> erhalten.</p>
      <p><strong>Interessent:</strong> ${escapeHtml(opts.applicantName)}</p>
      <p><strong>Betreibungsregister:</strong> ${escapeHtml(opts.creditSummary)}</p>
      <p><strong>Nachricht:</strong></p>
      <blockquote style="border-left:3px solid #0d9488;padding-left:12px;margin:12px 0;color:#374151;">${escapeHtml(opts.applicantMessage)}</blockquote>
    `,
    buttonText: 'Zur Anfrage',
    buttonUrl: link,
    userId: opts.landlordUserId,
  })
  await sendEmail({
    to: opts.landlordEmail,
    subject: `Neue Anfrage für „${opts.listingTitle}“`,
    html,
    userId: opts.landlordUserId,
  })
}

export async function sendRentalApplicantRejectedCreditEmail(opts: {
  applicantEmail: string
  applicantUserId: string
  applicantFirst: { firstName?: string | null; name?: string | null }
  listingTitle: string
  listingId: string
}): Promise<void> {
  const base = getRentalPublicBaseUrl().replace(/\/$/, '')
  const link = `${base}/wohnungen/${opts.listingId}`
  const fn = firstName(opts.applicantFirst)
  const html = getHelvendaEmailTemplate({
    title: `Deine Anfrage für „${opts.listingTitle}“`,
    greeting: `Hallo ${fn},`,
    content: `
      <p>leider konnten wir deinen Betreibungsregisterauszug nicht verarbeiten.</p>
      <p>Mögliche Gründe: Das Dokument ist älter als 3 Monate, oder es handelt sich nicht um einen offiziellen Schweizer Auszug.</p>
      <p>Bitte lade ein aktuelles Dokument hoch und versuche es erneut.</p>
    `,
    buttonText: 'Zum Inserat',
    buttonUrl: link,
    userId: opts.applicantUserId,
  })
  await sendEmail({
    to: opts.applicantEmail,
    subject: `Deine Anfrage für „${opts.listingTitle}“`,
    html,
    userId: opts.applicantUserId,
  })
}

export async function sendRentalApplicantSuccessEmail(opts: {
  applicantEmail: string
  applicantUserId: string
  applicantFirst: { firstName?: string | null; name?: string | null }
  listingTitle: string
}): Promise<void> {
  const fn = firstName(opts.applicantFirst)
  const html = getHelvendaEmailTemplate({
    title: 'Deine Anfrage wurde übermittelt',
    greeting: `Hallo ${fn},`,
    content: `
      <p>deine Anfrage für <strong>${escapeHtml(opts.listingTitle)}</strong> wurde erfolgreich an den Vermieter weitergeleitet.</p>
      <p>Du erhältst eine Benachrichtigung sobald der Vermieter antwortet.</p>
    `,
    userId: opts.applicantUserId,
  })
  await sendEmail({
    to: opts.applicantEmail,
    subject: 'Deine Anfrage wurde übermittelt',
    html,
    userId: opts.applicantUserId,
  })
}

export async function sendRentalAdminManualReviewEmail(opts: {
  applicationId: string
  listingTitle: string
}): Promise<void> {
  const base = getRentalPublicBaseUrl().replace(/\/$/, '')
  const link = `${base}/wohnungen/anfragen/${opts.applicationId}`
  const html = getHelvendaEmailTemplate({
    title: 'Mietanfrage: manuelle Prüfung',
    greeting: 'Hallo Team,',
    content: `
      <p>Eine Betreibungsregister-Analyse konnte nicht automatisch abgeschlossen werden.</p>
      <p><strong>Inserat:</strong> ${escapeHtml(opts.listingTitle)}</p>
      <p><strong>Anwendungs-ID:</strong> ${escapeHtml(opts.applicationId)}</p>
    `,
    buttonText: 'Anfrage öffnen',
    buttonUrl: link,
  })
  await sendEmail({
    to: 'admin@helvenda.ch',
    subject: `[Helvenda] Manuelle Prüfung — ${opts.listingTitle}`,
    html,
  })
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
