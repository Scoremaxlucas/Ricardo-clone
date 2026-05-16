import { buildApplicantSummaryForLandlord } from '@/lib/rental/build-applicant-summary'
import { findApplicationByLandlordLeadToken } from '@/lib/rental/landlord-lead-token'
import { employmentSummaryDe, incomeCategoryLabelDe } from '@/lib/tenant-profile/labels'
import { formatCHF } from '@/lib/utils/formatCurrency'
import { formatRentalListingAddress } from '@/lib/rental/format-listing-address'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(_: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const found = await findApplicationByLandlordLeadToken(decodeURIComponent(token))
  if (!found) {
    return NextResponse.json({ ok: false, reason: 'NOT_FOUND' }, { status: 404 })
  }
  if (found.expired) {
    return NextResponse.json({ ok: false, reason: 'EXPIRED' }, { status: 410 })
  }

  const app = found.application
  const tp = app.tenantProfile
  const applicantName =
    tp ?
      `${tp.firstName} ${tp.lastName}`.trim()
    : 'Bewerber/in'
  const alreadyResponded = Boolean(
    app.landlordRespondedAt || app.rejectedAt || app.viewingRequestedAt,
  )

  return NextResponse.json({
    ok: true,
    listing: {
      title: app.listing.title,
      addressLine: formatRentalListingAddress({
        address: app.listing.address,
        zip: app.listing.zip,
        city: app.listing.city,
      }),
      rentPerMonth: app.listing.rentPerMonth,
      rentLabel: formatCHF(app.listing.rentPerMonth),
    },
    applicant: {
      fullName: applicantName,
      phone: tp?.contactPhone?.trim() || app.applicant.phone?.trim() || null,
      email: tp?.applicationEmail?.trim() || app.applicant.email?.trim() || null,
      employmentLine:
        tp ?
          employmentSummaryDe(tp.employmentStatus, tp.employer, tp.jobTitle, tp.employedSince)
        : null,
      incomeLabel: tp ? incomeCategoryLabelDe(tp.monthlyIncomeCategory) : null,
      summary:
        tp ?
          buildApplicantSummaryForLandlord({
            employmentStatus: tp.employmentStatus,
            employer: tp.employer,
            jobTitle: tp.jobTitle,
            employedSince: tp.employedSince,
            monthlyIncomeCategory: tp.monthlyIncomeCategory,
            householdTotalPersons: tp.householdTotalPersons,
            householdChildrenCount: tp.householdChildrenCount,
            requiresCreditCheck: app.listing.requiresCreditCheck,
            creditCheckResult: tp.creditCheckResult,
          })
        : null,
      message: app.message,
    },
    state: {
      alreadyResponded,
      rejected: Boolean(app.rejectedAt),
      viewingRequested: Boolean(app.viewingRequestedAt),
      viewingDate: app.viewingDate?.toISOString() ?? null,
    },
  })
}
