import { authOptions } from '@/lib/auth'
import { uploadImageToBlob } from '@/lib/blob-storage'
import { prisma } from '@/lib/prisma'
import { Prisma, type CreditCheckStatus } from '@prisma/client'
import { sendTenantProfileCreditCheckEmails } from '@/lib/rental/emails'
import { encryptPdfForStorageBestEffort } from '@/lib/rental/pdf-crypto'
import { parseCreditCheckFromPdfBase64, tenantCreditCheckStatusFromParse } from '@/lib/rental/parseCreditCheck'
import type { CreditCheckResult } from '@/lib/rental/types'
import { isCreditCheckResult } from '@/lib/rental/types'
import { getServerSession } from 'next-auth/next'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const MAX_BYTES = 5 * 1024 * 1024

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const userId = session?.user?.id
    if (!userId) {
      return NextResponse.json({ message: 'Nicht autorisiert' }, { status: 401 })
    }

    const profile = await prisma.tenantProfile.findUnique({ where: { userId } })
    if (!profile?.isComplete) {
      return NextResponse.json({ message: 'Bitte zuerst dein Profil vervollständigen.' }, { status: 400 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const confirmPersonal = formData.get('confirmPersonal') === 'true' || formData.get('confirmPersonal') === 'on'

    if (!confirmPersonal) {
      return NextResponse.json(
        { message: 'Bitte bestätige, dass der Auszug auf dich ausgestellt und max. 3 Monate alt ist.' },
        { status: 400 }
      )
    }
    if (!file || file.size === 0) {
      return NextResponse.json({ message: 'Bitte eine PDF-Datei hochladen.' }, { status: 400 })
    }
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      return NextResponse.json({ message: 'Nur PDF-Dateien sind erlaubt.' }, { status: 400 })
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ message: 'PDF maximal 5 MB.' }, { status: 400 })
    }

    const pdfBuffer = Buffer.from(await file.arrayBuffer())
    const pdfBase64 = pdfBuffer.toString('base64')

    const { buffer: uploadBuf } = encryptPdfForStorageBestEffort(pdfBuffer)
    const ext = uploadBuf === pdfBuffer ? 'pdf' : 'bin'
    const path = `tenant-profiles/credit/${userId}/${Date.now()}.${ext}`
    const bytes = new Uint8Array(uploadBuf)
    const blobFile =
      ext === 'pdf'
        ? new File([bytes], 'document.pdf', { type: 'application/pdf' })
        : new File([bytes], 'document.enc', { type: 'application/octet-stream' })
    const encryptedFileRef = await uploadImageToBlob(blobFile, path)

    await prisma.tenantProfile.update({
      where: { userId },
      data: {
        creditCheckStatus: 'PENDING',
        encryptedFileRef,
        creditCheckUploadedAt: new Date(),
        creditCheckResult: Prisma.JsonNull,
        creditCheckExpiresAt: null,
        expiryReminderSentAt: null,
      },
    })

    const parseOutcome = await parseCreditCheckFromPdfBase64(pdfBase64)

    let creditJson: CreditCheckResult | null = null
    let finalStatus: CreditCheckStatus

    if (!parseOutcome.ok) {
      finalStatus = tenantCreditCheckStatusFromParse(parseOutcome)
    } else if (!isCreditCheckResult(parseOutcome.result)) {
      finalStatus = 'REJECTED'
    } else {
      creditJson = parseOutcome.result
      finalStatus = tenantCreditCheckStatusFromParse({ ok: true, result: creditJson })
    }

    const now = new Date()
    const expires =
      finalStatus === 'APPROVED' ? new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000) : null

    await prisma.tenantProfile.update({
      where: { userId },
      data: {
        creditCheckStatus: finalStatus,
        creditCheckResult:
          creditJson === null ? Prisma.JsonNull : (creditJson as unknown as Prisma.InputJsonValue),
        creditCheckExpiresAt: expires,
        creditCheckUploadedAt: now,
      },
    })

    const userRow = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, firstName: true, name: true, nickname: true },
    })
    if (
      userRow?.email &&
      (finalStatus === 'APPROVED' || finalStatus === 'REJECTED' || finalStatus === 'PENDING_MANUAL_REVIEW')
    ) {
      const display =
        userRow.nickname?.trim() || userRow.name?.trim() || userRow.firstName?.trim() || userRow.email
      try {
        await sendTenantProfileCreditCheckEmails({
          tenantEmail: userRow.email,
          tenantUserId: userId,
          tenantFirst: userRow,
          finalStatus,
          creditResult: creditJson,
          validUntil: expires,
          userDisplayName: display,
          uploadedAt: now,
          encryptedFileRef,
        })
      } catch (err) {
        console.error('[tenant-profile/credit-check] email', err)
      }
    }

    let message = 'Auswertung abgeschlossen.'
    if (finalStatus === 'APPROVED') {
      message = 'Betreibungsregisterauszug erfolgreich verifiziert.'
    } else if (finalStatus === 'REJECTED') {
      message = 'Das Dokument konnte nicht akzeptiert werden.'
    } else if (finalStatus === 'PENDING_MANUAL_REVIEW') {
      message = 'Dokument wird manuell geprüft.'
    }

    return NextResponse.json({
      status: finalStatus,
      message,
    })
  } catch (e: unknown) {
    console.error('[tenant-profile/credit-check POST]', e)
    return NextResponse.json({ message: e instanceof Error ? e.message : 'Fehler' }, { status: 500 })
  }
}
