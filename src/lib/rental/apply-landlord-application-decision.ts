import { RentalApplicationStatus } from '@prisma/client'
import {
  sendRentalApplicantRejectedByLandlordEmail,
  sendRentalApplicantViewingInvitationEmail,
  sendRentalApplicantLandlordDirectContactEmail,
} from '@/lib/rental/emails'
import { prisma } from '@/lib/prisma'

export type LandlordApplicationAction =
  | 'reject'
  | 'request_viewing'
  /** Vermieter meldet sich direkt beim Bewerber (kein Termin über Helvenda). */
  | 'contact_directly'

export type ApplyLandlordDecisionInput = {
  applicationId: string
  action: LandlordApplicationAction
  viewingDate?: string | Date | null
  viewingNote?: string | null
  rejectionNote?: string | null
  directContactNote?: string | null
}

export type ApplyLandlordDecisionResult =
  | { ok: true; applicationId: string }
  | { ok: false; status: number; message: string }

type AppRow = {
  id: string
  status: RentalApplicationStatus
  rejectedAt: Date | null
  viewingRequestedAt: Date | null
  viewingDate: Date | null
  rejectionNote: string | null
  landlordRespondedAt: Date | null
  listing: {
    id: string
    title: string
    address: string
    zip: string
    city: string
  }
  applicant: {
    id: string
    email: string | null
    firstName: string | null
    name: string | null
  }
}

export async function applyLandlordApplicationDecision(
  input: ApplyLandlordDecisionInput
): Promise<ApplyLandlordDecisionResult> {
  const app = await prisma.rentalApplication.findUnique({
    where: { id: input.applicationId },
    include: {
      listing: {
        select: { id: true, title: true, address: true, zip: true, city: true },
      },
      applicant: { select: { id: true, email: true, firstName: true, name: true } },
    },
  })

  if (!app?.listing) {
    return { ok: false, status: 404, message: 'Bewerbung nicht gefunden' }
  }

  const row = app as unknown as AppRow
  const listingAddress = `${row.listing.address}, ${row.listing.zip} ${row.listing.city}`
  const now = new Date()

  if (input.action === 'reject') {
    if (row.rejectedAt != null || row.status === RentalApplicationStatus.rejected) {
      return { ok: false, status: 400, message: 'Bereits abgelehnt' }
    }
    const rejectionNote =
      typeof input.rejectionNote === 'string' ? input.rejectionNote.trim() || null : null

    await prisma.rentalApplication.update({
      where: { id: row.id },
      data: {
        status: RentalApplicationStatus.rejected,
        rejectedAt: now,
        rejectionNote,
        landlordRespondedAt: now,
      },
    })

    if (row.applicant.email) {
      try {
        await sendRentalApplicantRejectedByLandlordEmail({
          applicantEmail: row.applicant.email,
          applicantUserId: row.applicant.id,
          applicantFirst: row.applicant,
          listingTitle: row.listing.title,
        })
      } catch (e) {
        console.error('[applyLandlordDecision] reject email', e)
      }
    }
    return { ok: true, applicationId: row.id }
  }

  if (input.action === 'request_viewing') {
    if (row.rejectedAt != null || row.status === RentalApplicationStatus.rejected) {
      return { ok: false, status: 400, message: 'Abgelehnte Bewerbung' }
    }
    if (row.viewingRequestedAt) {
      return { ok: false, status: 400, message: 'Besichtigung wurde bereits angefragt' }
    }
    const vd =
      input.viewingDate != null ? new Date(input.viewingDate) : null
    if (!vd || Number.isNaN(vd.getTime())) {
      return { ok: false, status: 400, message: 'Besichtigungstermin erforderlich' }
    }
    if (vd.getTime() < Date.now() - 60_000) {
      return { ok: false, status: 400, message: 'Besichtigung muss in der Zukunft liegen' }
    }
    const viewingNote =
      typeof input.viewingNote === 'string' ? input.viewingNote.trim() || null : null

    await prisma.rentalApplication.update({
      where: { id: row.id },
      data: {
        viewingDate: vd,
        viewingRequestedAt: now,
        landlordRespondedAt: now,
      },
    })

    if (row.applicant.email) {
      try {
        await sendRentalApplicantViewingInvitationEmail({
          applicantEmail: row.applicant.email,
          applicantUserId: row.applicant.id,
          applicantFirst: row.applicant,
          listingTitle: row.listing.title,
          listingAddress,
          viewingAtIso: vd.toISOString(),
          note: viewingNote,
        })
      } catch (e) {
        console.error('[applyLandlordDecision] viewing email', e)
      }
    }
    return { ok: true, applicationId: row.id }
  }

  if (input.action === 'contact_directly') {
    if (row.rejectedAt != null || row.status === RentalApplicationStatus.rejected) {
      return { ok: false, status: 400, message: 'Abgelehnte Bewerbung' }
    }
    const note =
      typeof input.directContactNote === 'string' ? input.directContactNote.trim() || null : null

    await prisma.rentalApplication.update({
      where: { id: row.id },
      data: { landlordRespondedAt: now },
    })

    if (row.applicant.email) {
      try {
        await sendRentalApplicantLandlordDirectContactEmail({
          applicantEmail: row.applicant.email,
          applicantUserId: row.applicant.id,
          applicantFirst: row.applicant,
          listingTitle: row.listing.title,
          landlordNote: note,
        })
      } catch (e) {
        console.error('[applyLandlordDecision] direct contact email', e)
      }
    }
    return { ok: true, applicationId: row.id }
  }

  return { ok: false, status: 400, message: 'Unbekannte Aktion' }
}
