import { sendEmail } from '@/lib/email/sender'
import type { EmploymentStatus, IncomeCategory } from '@prisma/client'
import {
  templateAdminCreditManualReview,
  templateAdminRentalApplicationManualReview,
  templateLandlordNewApplication,
  templateTenantApplicationSubmitted,
  templateTenantCreditExpiryReminder,
  templateTenantCreditManualReview,
  templateTenantCreditRejected,
  templateTenantCreditVerified,
  templateTenantViewingRequested,
} from '@/lib/rental/emailTemplates'
import type { CreditCheckResult } from '@/lib/rental/types'

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
  await sendEmail({
    to: opts.to,
    subject: opts.subject,
    html: opts.html,
    text: opts.text,
    userId: opts.userId,
    from: WOHNEN_FROM,
  })
}

export async function sendRentalLandlordNewApplicationEmail(opts: {
  landlordEmail: string
  landlordUserId: string
  landlordFirst: { firstName?: string | null; name?: string | null }
  listingId: string
  listingTitle: string
  applicantFullName: string
  applicantMessage?: string | null
  requiresCreditCheck: boolean
  creditCheckResult: unknown
  employmentStatus: EmploymentStatus
  employer: string | null
  monthlyIncomeCategory: IncomeCategory
  referenceName: string | null
  referencePhone: string | null
}): Promise<void> {
  const payload = templateLandlordNewApplication({
    landlordFirstName: firstName(opts.landlordFirst),
    listingTitle: opts.listingTitle,
    listingId: opts.listingId,
    applicantFullName: opts.applicantFullName,
    employmentStatus: opts.employmentStatus,
    employer: opts.employer,
    incomeCategory: opts.monthlyIncomeCategory,
    requiresCreditCheck: opts.requiresCreditCheck,
    creditCheckResult: opts.creditCheckResult,
    referenceName: opts.referenceName,
    referencePhone: opts.referencePhone,
    applicantMessage: opts.applicantMessage ?? null,
  })
  await sendWohnenEmail({
    to: opts.landlordEmail,
    subject: payload.subject,
    html: payload.html,
    text: payload.text,
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
