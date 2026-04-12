import { authOptions } from '@/lib/auth'
import { uploadImageToBlob } from '@/lib/blob-storage'
import { prisma } from '@/lib/prisma'
import { creditCheckBadgeSummaryForEmail } from '@/lib/rental/badge-copy'
import {
  sendRentalAdminManualReviewEmail,
  sendRentalApplicantRejectedCreditEmail,
  sendRentalApplicantSuccessEmail,
  sendRentalLandlordNewApplicationEmail,
} from '@/lib/rental/emails'
import { encryptPdfForStorageBestEffort } from '@/lib/rental/pdf-crypto'
import { applicationStatusFromCreditParse, parseCreditCheckFromPdfBase64 } from '@/lib/rental/parse-credit-check'
import type { CreditCheckResult } from '@/lib/rental/types'
import { isCreditCheckResult } from '@/lib/rental/types'
import { getServerSession } from 'next-auth/next'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Nicht autorisiert' }, { status: 401 })
    }

    const { id: listingId } = await params

    const listing = await prisma.rentalListing.findFirst({
      where: { id: listingId, status: 'active' },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            name: true,
          },
        },
      },
    })

    if (!listing || !listing.user?.email) {
      return NextResponse.json({ message: 'Inserat nicht gefunden' }, { status: 404 })
    }

    if (listing.userId === session.user.id) {
      return NextResponse.json({ message: 'Eigenes Inserat' }, { status: 403 })
    }

    const blocking = await prisma.rentalApplication.findFirst({
      where: {
        rentalListingId: listingId,
        applicantUserId: session.user.id,
        status: { in: ['pending_credit_check', 'pending_manual_review', 'approved'] },
      },
    })
    if (blocking) {
      return NextResponse.json({ message: 'Du hast bereits eine laufende Anfrage für dieses Inserat.' }, { status: 409 })
    }

    await prisma.rentalApplication.deleteMany({
      where: {
        rentalListingId: listingId,
        applicantUserId: session.user.id,
        status: 'rejected',
      },
    })

    const formData = await request.formData()
    const message = (formData.get('message') as string)?.trim() || ''
    const file = formData.get('file') as File | null
    const confirmPersonal = formData.get('confirmPersonal') === 'true' || formData.get('confirmPersonal') === 'on'

    if (!message || message.length < 20) {
      return NextResponse.json({ message: 'Bitte eine Nachricht (mind. 20 Zeichen).' }, { status: 400 })
    }

    const applicant = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { email: true, firstName: true, name: true, nickname: true },
    })
    if (!applicant?.email) {
      return NextResponse.json({ message: 'Keine E-Mail im Profil' }, { status: 400 })
    }

    const applicantDisplay = applicant.nickname?.trim() || applicant.name?.trim() || 'Helvenda-Nutzer'

    if (!listing.requiresCreditCheck) {
      const app = await prisma.rentalApplication.create({
        data: {
          rentalListingId: listingId,
          applicantUserId: session.user.id,
          message,
          status: 'approved',
        },
      })

      const summary = 'Kein Betreibungsregister erforderlich'
      await sendRentalLandlordNewApplicationEmail({
        landlordEmail: listing.user.email,
        landlordUserId: listing.userId,
        landlordFirst: listing.user,
        listingTitle: listing.title,
        applicantName: applicantDisplay,
        applicantMessage: message,
        creditSummary: summary,
        applicationId: app.id,
      })
      await sendRentalApplicantSuccessEmail({
        applicantEmail: applicant.email,
        applicantUserId: session.user.id,
        applicantFirst: applicant,
        listingTitle: listing.title,
      })

      return NextResponse.json({
        success: true,
        applicationId: app.id,
        redirectUrl: `/wohnungen/${listingId}`,
        message: 'Anfrage gesendet.',
      })
    }

    if (!confirmPersonal) {
      return NextResponse.json(
        { message: 'Bitte bestätige, dass das Dokument auf dich ausgestellt und aktuell ist.' },
        { status: 400 }
      )
    }
    if (!file || file.size === 0) {
      return NextResponse.json({ message: 'Betreibungsregisterauszug (PDF) ist erforderlich.' }, { status: 400 })
    }
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      return NextResponse.json({ message: 'Nur PDF-Dateien erlaubt.' }, { status: 400 })
    }
    const maxBytes = 8 * 1024 * 1024
    if (file.size > maxBytes) {
      return NextResponse.json({ message: 'PDF max. 8 MB.' }, { status: 400 })
    }

    const pdfBuffer = Buffer.from(await file.arrayBuffer())
    const pdfBase64 = pdfBuffer.toString('base64')

    const parseOutcome = await parseCreditCheckFromPdfBase64(pdfBase64)

    let creditJson: CreditCheckResult | null = null
    let statusAfterParse = applicationStatusFromCreditParse(parseOutcome)
    if (parseOutcome.ok && !isCreditCheckResult(parseOutcome.result)) {
      creditJson = null
      statusAfterParse = 'pending_manual_review'
    } else if (parseOutcome.ok && isCreditCheckResult(parseOutcome.result)) {
      creditJson = parseOutcome.result
      statusAfterParse = applicationStatusFromCreditParse({ ok: true, result: creditJson })
    }

    const { buffer: uploadBuf } = encryptPdfForStorageBestEffort(pdfBuffer)
    const ext = uploadBuf === pdfBuffer ? 'pdf' : 'bin'
    const path = `rental-applications/credit/${listingId}/${session.user.id}/${Date.now()}.${ext}`
    const bytes = new Uint8Array(uploadBuf)
    const blobFile =
      ext === 'pdf'
        ? new File([bytes], 'document.pdf', { type: 'application/pdf' })
        : new File([bytes], 'document.enc', { type: 'application/octet-stream' })
    const encryptedFileRef = await uploadImageToBlob(blobFile, path)

    const app = await prisma.rentalApplication.create({
      data: {
        rentalListingId: listingId,
        applicantUserId: session.user.id,
        message,
        status: statusAfterParse,
        encryptedFileRef,
        creditCheckResult: creditJson === null ? undefined : (creditJson as object),
      },
    })

    if (statusAfterParse === 'rejected') {
      await sendRentalApplicantRejectedCreditEmail({
        applicantEmail: applicant.email,
        applicantUserId: session.user.id,
        applicantFirst: applicant,
        listingTitle: listing.title,
        listingId,
      })
      return NextResponse.json({
        success: true,
        applicationId: app.id,
        redirectUrl: `/wohnungen/${listingId}`,
        message: 'Anfrage konnte nicht akzeptiert werden.',
      })
    }

    if (statusAfterParse === 'pending_manual_review') {
      await sendRentalAdminManualReviewEmail({
        applicationId: app.id,
        listingTitle: listing.title,
      })
    }

    if (statusAfterParse === 'approved') {
      const summary = creditJson
        ? creditCheckBadgeSummaryForEmail(creditJson, 'approved')
        : 'Betreibungsregister geprüft'
      await sendRentalLandlordNewApplicationEmail({
        landlordEmail: listing.user.email,
        landlordUserId: listing.userId,
        landlordFirst: listing.user,
        listingTitle: listing.title,
        applicantName: applicantDisplay,
        applicantMessage: message,
        creditSummary: summary,
        applicationId: app.id,
      })
      await sendRentalApplicantSuccessEmail({
        applicantEmail: applicant.email,
        applicantUserId: session.user.id,
        applicantFirst: applicant,
        listingTitle: listing.title,
      })
    } else if (statusAfterParse === 'pending_manual_review') {
      await sendRentalApplicantSuccessEmail({
        applicantEmail: applicant.email,
        applicantUserId: session.user.id,
        applicantFirst: applicant,
        listingTitle: listing.title,
      })
    }

    return NextResponse.json({
      success: true,
      applicationId: app.id,
      redirectUrl: `/wohnungen/${listingId}`,
      message: 'Anfrage gesendet.',
    })
  } catch (e: unknown) {
    console.error('[rental contact POST]', e)
    const msg = e instanceof Error ? e.message : 'Fehler'
    return NextResponse.json({ message: msg }, { status: 500 })
  }
}
