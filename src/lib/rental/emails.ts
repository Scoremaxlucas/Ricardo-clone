import { sendEmail } from '@/lib/email/sender'
import { isWohnenLeadEmailOverrideVerbose } from '@/lib/rental/wohnen-lead-email-override'

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function wohnenBccFromEnv(): string[] | undefined {
  const raw = process.env.WOHNEN_EMAIL_BCC
  if (!raw?.trim()) return undefined
  const list = raw.split(/[,;]+/).map(s => s.trim()).filter(Boolean)
  return list.length ? list : undefined
}
import type { EmploymentStatus, IncomeCategory } from '@prisma/client'
import {
  templateAdminCreditManualReview,
  templateAdminListingDeactivatedStaleReports,
  templateAdminListingDeactivatedUrl404,
  templateAdminListingDeactivatedUrlRented,
  templateAdminListingExpiredCalendar,
  templateAdminListingUrlUnreachableStreak,
  templateAdminRentalApplicationManualReview,
  templateLandlordNewApplication,
  templateTenantApplicationRejectedByLandlord,
  templateTenantApplicationSubmitted,
  templateTenantLandlordDirectContact,
  templateTenantLandlordNoResponseYet,
  templateLandlordListingExpiredCalendar,
  templateTenantCertificateExpired,
  templateTenantCertificateExpirySoon,
  templateTenantCreditExpiryReminder,
  templateTenantCreditExpiryReminder14d,
  templateTenantCreditManualReview,
  templateTenantCreditRejected,
  templateTenantCreditVerified,
  templateTenantViewingRequested,
} from '@/lib/rental/emailTemplates'
import type { CreditCheckResult } from '@/lib/rental/types'
import { WOHNEN_SITE_ORIGIN } from '@/lib/site-urls'

const WOHNEN_FROM = 'Helvenda Wohnungen <noreply@helvenda.ch>'

function firstName(user: { firstName?: string | null; name?: string | null }): string {
  if (user.firstName?.trim()) return user.firstName.trim()
  const n = user.name?.trim()
  if (n) return n.split(/\s+/)[0] || n
  return 'du'
}

async function sendWohnenEmail(opts: {
  to: string
  subject: string
  html: string
  text: string
  userId?: string
}): Promise<void> {
  const result = await sendEmail({
    to: opts.to,
    subject: opts.subject,
    html: opts.html,
    text: opts.text,
    userId: opts.userId,
    from: WOHNEN_FROM,
    bcc: wohnenBccFromEnv(),
  })
  if (!result.success) {
    const err = result.error || 'E-Mail konnte nicht versendet werden'
    console.error('[wohnen-email] Versand fehlgeschlagen:', { to: opts.to, subject: opts.subject, err })
    throw new Error(`[wohnen-email] ${err}`)
  }
}

export async function sendRentalLandlordNewApplicationEmail(opts: {
  landlordEmail: string
  /** Gesetzt wenn WOHNEN_LEAD_EMAIL_OVERRIDE aktiv — für Betreff und Hinweis in der Mail. */
  leadTestIntendedEmail?: string | null
  landlordUserId: string
  landlordSalutationFirstName: string | null
  listingId: string
  listingTitle: string
  applicantFullName: string
  applicantContactPhone: string | null
  applicantContactEmail: string | null
  applicantMessage?: string | null
  applicantSummary?: string | null
  requiresCreditCheck: boolean
  creditCheckResult: unknown
  employmentStatus: EmploymentStatus
  employer: string | null
  monthlyIncomeCategory: IncomeCategory
  referenceName: string | null
  referencePhone: string | null
  /** Aktiver Helvenda-Qualitätsnachweis — Link in der Mail, kein PDF-Anhang. */
  certificateCode?: string | null
  landlordCanViewOnPlatform: boolean
}): Promise<void> {
  const payload = templateLandlordNewApplication({
    landlordFirstName: opts.landlordSalutationFirstName,
    listingTitle: opts.listingTitle,
    listingId: opts.listingId,
    applicantFullName: opts.applicantFullName,
    applicantContactPhone: opts.applicantContactPhone,
    applicantContactEmail: opts.applicantContactEmail,
    employmentStatus: opts.employmentStatus,
    employer: opts.employer,
    incomeCategory: opts.monthlyIncomeCategory,
    requiresCreditCheck: opts.requiresCreditCheck,
    creditCheckResult: opts.creditCheckResult,
    referenceName: opts.referenceName,
    referencePhone: opts.referencePhone,
    applicantMessage: opts.applicantMessage ?? null,
    applicantSummary: opts.applicantSummary ?? null,
    certificateCode: opts.certificateCode ?? null,
    landlordCanViewOnPlatform: opts.landlordCanViewOnPlatform,
  })
  const intended = opts.leadTestIntendedEmail?.trim()
  const verbose = Boolean(intended && isWohnenLeadEmailOverrideVerbose())
  const testPrefix = verbose ? `[TEST · eigentlich ${intended}] ` : ''
  const testBanner =
    verbose ?
      `<div style="margin:0 0 16px 0;padding:12px 14px;background:#fff7ed;border:1px solid #fdba74;border-radius:8px;font-size:13px;line-height:1.5;color:#9a3412;"><strong>Test-Modus:</strong> Diese Lead-Mail wurde an <strong>${escapeHtml(opts.landlordEmail)}</strong> gesendet. Ursprünglich vorgesehen war <strong>${escapeHtml(intended!)}</strong>. Entferne <code>WOHNEN_LEAD_EMAIL_OVERRIDE</code> in Vercel, um echte Vermieter zu benachrichtigen.</div>`
    : ''

  await sendWohnenEmail({
    to: opts.landlordEmail,
    subject: `${testPrefix}${payload.subject}`,
    html: testBanner ? `${testBanner}${payload.html}` : payload.html,
    text: verbose ? `[TEST — Lead eigentlich für ${intended}]\n\n${payload.text}` : payload.text,
    userId: opts.landlordUserId,
  })
}

export async function sendRentalApplicantRejectedCreditEmail(opts: {
  applicantEmail: string
  applicantUserId: string
  applicantFirst: { firstName?: string | null; name?: string | null }
}): Promise<void> {
  const payload = templateTenantCreditRejected({
    tenantFirstName: firstName(opts.applicantFirst),
  })
  await sendWohnenEmail({
    to: opts.applicantEmail,
    subject: payload.subject,
    html: payload.html,
    text: payload.text,
    userId: opts.applicantUserId,
  })
}

export async function sendRentalApplicantSuccessEmail(opts: {
  applicantEmail: string
  applicantUserId: string
  applicantFirst: { firstName?: string | null; name?: string | null }
  listingTitle: string
  addressLine: string
  rooms: number
  rentPerMonth: number
}): Promise<void> {
  const payload = templateTenantApplicationSubmitted({
    tenantFirstName: firstName(opts.applicantFirst),
    listingTitle: opts.listingTitle,
    addressLine: opts.addressLine,
    rooms: opts.rooms,
    rentPerMonth: opts.rentPerMonth,
  })
  await sendWohnenEmail({
    to: opts.applicantEmail,
    subject: payload.subject,
    html: payload.html,
    text: payload.text,
    userId: opts.applicantUserId,
  })
}

export async function sendRentalApplicantRejectedByLandlordEmail(opts: {
  applicantEmail: string
  applicantUserId: string
  applicantFirst: { firstName?: string | null; name?: string | null }
  listingTitle: string
}): Promise<void> {
  const payload = templateTenantApplicationRejectedByLandlord({
    tenantFirstName: firstName(opts.applicantFirst),
    listingTitle: opts.listingTitle,
  })
  await sendWohnenEmail({
    to: opts.applicantEmail,
    subject: payload.subject,
    html: payload.html,
    text: payload.text,
    userId: opts.applicantUserId,
  })
}

export async function sendRentalApplicantLandlordDirectContactEmail(opts: {
  applicantEmail: string
  applicantUserId: string
  applicantFirst: { firstName?: string | null; name?: string | null }
  listingTitle: string
  landlordNote?: string | null
}): Promise<void> {
  const payload = templateTenantLandlordDirectContact({
    tenantFirstName: firstName(opts.applicantFirst),
    listingTitle: opts.listingTitle,
    landlordNote: opts.landlordNote ?? null,
  })
  await sendWohnenEmail({
    to: opts.applicantEmail,
    subject: payload.subject,
    html: payload.html,
    text: payload.text,
    userId: opts.applicantUserId,
  })
}

export async function sendRentalApplicantLandlordNoResponseEmail(opts: {
  applicantEmail: string
  applicantUserId: string
  applicantFirst: { firstName?: string | null; name?: string | null }
  listingTitle: string
  daysSinceApplication: number
}): Promise<void> {
  const payload = templateTenantLandlordNoResponseYet({
    tenantFirstName: firstName(opts.applicantFirst),
    listingTitle: opts.listingTitle,
    daysSinceApplication: opts.daysSinceApplication,
  })
  await sendWohnenEmail({
    to: opts.applicantEmail,
    subject: payload.subject,
    html: payload.html,
    text: payload.text,
    userId: opts.applicantUserId,
  })
}

export async function sendRentalApplicantViewingInvitationEmail(opts: {
  applicantEmail: string
  applicantUserId: string
  applicantFirst: { firstName?: string | null; name?: string | null }
  listingTitle: string
  listingAddress: string
  viewingAtIso: string
  note?: string | null
}): Promise<void> {
  const d = new Date(opts.viewingAtIso)
  const viewingAt = Number.isNaN(d.getTime()) ? new Date() : d
  const payload = templateTenantViewingRequested({
    tenantFirstName: firstName(opts.applicantFirst),
    listingTitle: opts.listingTitle,
    listingAddress: opts.listingAddress,
    viewingAt,
    landlordNote: opts.note ?? null,
  })
  await sendWohnenEmail({
    to: opts.applicantEmail,
    subject: payload.subject,
    html: payload.html,
    text: payload.text,
    userId: opts.applicantUserId,
  })
}

export async function sendRentalAdminManualReviewEmail(opts: {
  applicationId: string
  listingTitle: string
}): Promise<void> {
  const payload = templateAdminRentalApplicationManualReview({
    listingTitle: opts.listingTitle,
    applicationId: opts.applicationId,
  })
  await sendWohnenEmail({
    to: 'admin@helvenda.ch',
    subject: payload.subject,
    html: payload.html,
    text: payload.text,
  })
}

export async function sendAdminListingDeactivatedUrl404Email(opts: {
  listingId: string
  listingTitle: string
  address: string
  importedFrom: string
  deactivatedAt: Date
}): Promise<void> {
  const payload = templateAdminListingDeactivatedUrl404({
    listingId: opts.listingId,
    listingTitle: opts.listingTitle,
    address: opts.address,
    importedFrom: opts.importedFrom,
    deactivatedAt: opts.deactivatedAt,
  })
  await sendWohnenEmail({
    to: 'admin@helvenda.ch',
    subject: payload.subject,
    html: payload.html,
    text: payload.text,
  })
}

export async function sendAdminListingDeactivatedUrlRentedEmail(opts: {
  listingId: string
  listingTitle: string
  address: string
  importedFrom: string
  keyword: string
  deactivatedAt: Date
}): Promise<void> {
  const payload = templateAdminListingDeactivatedUrlRented({
    listingId: opts.listingId,
    listingTitle: opts.listingTitle,
    address: opts.address,
    importedFrom: opts.importedFrom,
    keyword: opts.keyword,
    deactivatedAt: opts.deactivatedAt,
  })
  await sendWohnenEmail({
    to: 'admin@helvenda.ch',
    subject: payload.subject,
    html: payload.html,
    text: payload.text,
  })
}

export async function sendAdminListingDeactivatedStaleReportsEmail(opts: {
  listingId: string
  listingTitle: string
  address: string
  staleReportCount: number
  lastReportAt: Date
  notes: string[]
}): Promise<void> {
  const payload = templateAdminListingDeactivatedStaleReports({
    listingId: opts.listingId,
    listingTitle: opts.listingTitle,
    address: opts.address,
    staleReportCount: opts.staleReportCount,
    lastReportAt: opts.lastReportAt,
    notes: opts.notes,
  })
  await sendWohnenEmail({
    to: 'admin@helvenda.ch',
    subject: payload.subject,
    html: payload.html,
    text: payload.text,
  })
}

export async function sendLandlordListingExpiredCalendarEmail(opts: {
  landlordEmail: string
  landlordUserId: string
  landlordFirst: { firstName?: string | null; name?: string | null }
  listingId: string
  listingTitle: string
  address: string
  listingExpiresOn: string
  deactivatedAt: Date
}): Promise<void> {
  const w = WOHNEN_SITE_ORIGIN.replace(/\/$/, '')
  const editLink = `${w}/matching/properties/${encodeURIComponent(opts.listingId)}/bearbeiten`
  const payload = templateLandlordListingExpiredCalendar({
    tenantFirstName: firstName(opts.landlordFirst),
    listingTitle: opts.listingTitle,
    listingId: opts.listingId,
    address: opts.address,
    listingExpiresOn: opts.listingExpiresOn,
    editLink,
    deactivatedAt: opts.deactivatedAt,
  })
  await sendWohnenEmail({
    to: opts.landlordEmail,
    subject: payload.subject,
    html: payload.html,
    text: payload.text,
    userId: opts.landlordUserId,
  })
}

export async function sendAdminListingExpiredCalendarEmail(opts: {
  listingId: string
  listingTitle: string
  address: string
  listingExpiresOn: string
  deactivatedAt: Date
}): Promise<void> {
  const payload = templateAdminListingExpiredCalendar({
    listingId: opts.listingId,
    listingTitle: opts.listingTitle,
    address: opts.address,
    listingExpiresOn: opts.listingExpiresOn,
    deactivatedAt: opts.deactivatedAt,
  })
  await sendWohnenEmail({
    to: 'admin@helvenda.ch',
    subject: payload.subject,
    html: payload.html,
    text: payload.text,
  })
}

export async function sendAdminListingUrlUnreachableStreakEmail(opts: {
  listingId: string
  listingTitle: string
  address: string
  importedFrom: string
}): Promise<void> {
  const payload = templateAdminListingUrlUnreachableStreak({
    listingId: opts.listingId,
    listingTitle: opts.listingTitle,
    address: opts.address,
    importedFrom: opts.importedFrom,
  })
  await sendWohnenEmail({
    to: 'admin@helvenda.ch',
    subject: payload.subject,
    html: payload.html,
    text: payload.text,
  })
}

export async function sendTenantProfileCreditCheckEmails(opts: {
  tenantEmail: string
  tenantUserId: string
  tenantFirst: { firstName?: string | null; name?: string | null }
  finalStatus: 'APPROVED' | 'REJECTED' | 'PENDING_MANUAL_REVIEW'
  creditResult: CreditCheckResult | null
  validUntil: Date | null
  /** Für Admin-Mail (PENDING_MANUAL_REVIEW) */
  userDisplayName: string
  uploadedAt: Date
  encryptedFileRef: string
}): Promise<void> {
  const fn = firstName(opts.tenantFirst)

  if (opts.finalStatus === 'REJECTED') {
    const p = templateTenantCreditRejected({ tenantFirstName: fn })
    await sendWohnenEmail({
      to: opts.tenantEmail,
      subject: p.subject,
      html: p.html,
      text: p.text,
      userId: opts.tenantUserId,
    })
    return
  }

  if (opts.finalStatus === 'APPROVED') {
    if (!opts.creditResult || !opts.validUntil) {
      console.error('[wohnen-email] APPROVED ohne creditResult oder Ablaufdatum — kein Versand')
      return
    }
    const p = templateTenantCreditVerified({
      tenantFirstName: fn,
      result: opts.creditResult,
      validUntil: opts.validUntil,
    })
    await sendWohnenEmail({
      to: opts.tenantEmail,
      subject: p.subject,
      html: p.html,
      text: p.text,
      userId: opts.tenantUserId,
    })
    return
  }

  if (opts.finalStatus === 'PENDING_MANUAL_REVIEW') {
    const p5 = templateTenantCreditManualReview({ tenantFirstName: fn })
    await sendWohnenEmail({
      to: opts.tenantEmail,
      subject: p5.subject,
      html: p5.html,
      text: p5.text,
      userId: opts.tenantUserId,
    })
    const p6 = templateAdminCreditManualReview({
      userDisplayName: opts.userDisplayName,
      userEmail: opts.tenantEmail,
      userId: opts.tenantUserId,
      uploadedAt: opts.uploadedAt,
      encryptedFileRef: opts.encryptedFileRef,
    })
    await sendWohnenEmail({
      to: 'admin@helvenda.ch',
      subject: p6.subject,
      html: p6.html,
      text: p6.text,
    })
  }
}

export async function sendTenantCreditExpiryReminderEmail(opts: {
  tenantEmail: string
  tenantUserId: string
  tenantFirst: { firstName?: string | null; name?: string | null }
  expiresOn: Date
}): Promise<void> {
  const p = templateTenantCreditExpiryReminder({
    tenantFirstName: firstName(opts.tenantFirst),
    expiresOn: opts.expiresOn,
  })
  await sendWohnenEmail({
    to: opts.tenantEmail,
    subject: p.subject,
    html: p.html,
    text: p.text,
    userId: opts.tenantUserId,
  })
}

export async function sendTenantCreditExpiryReminder14dEmail(opts: {
  tenantEmail: string
  tenantUserId: string
  tenantFirst: { firstName?: string | null; name?: string | null }
  expiresOn: Date
}): Promise<void> {
  const p = templateTenantCreditExpiryReminder14d({
    tenantFirstName: firstName(opts.tenantFirst),
    expiresOn: opts.expiresOn,
  })
  await sendWohnenEmail({
    to: opts.tenantEmail,
    subject: p.subject,
    html: p.html,
    text: p.text,
    userId: opts.tenantUserId,
  })
}

export async function sendTenantCertificateExpirySoonEmail(opts: {
  tenantEmail: string
  tenantUserId: string
  tenantFirst: { firstName?: string | null; name?: string | null }
  expiresOn: Date
  daysBefore: 14 | 3
  certificateCode: string
}): Promise<void> {
  const p = templateTenantCertificateExpirySoon({
    tenantFirstName: firstName(opts.tenantFirst),
    expiresOn: opts.expiresOn,
    daysBefore: opts.daysBefore,
    certificateCode: opts.certificateCode,
  })
  await sendWohnenEmail({
    to: opts.tenantEmail,
    subject: p.subject,
    html: p.html,
    text: p.text,
    userId: opts.tenantUserId,
  })
}

export async function sendTenantCertificateExpiredEmail(opts: {
  tenantEmail: string
  tenantUserId: string
  tenantFirst: { firstName?: string | null; name?: string | null }
}): Promise<void> {
  const renewLink = `${WOHNEN_SITE_ORIGIN.replace(/\/$/, '')}/profil/betreibungsregister`
  const p = templateTenantCertificateExpired({
    tenantFirstName: firstName(opts.tenantFirst),
    renewLink,
  })
  await sendWohnenEmail({
    to: opts.tenantEmail,
    subject: p.subject,
    html: p.html,
    text: p.text,
    userId: opts.tenantUserId,
  })
}
