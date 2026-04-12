import { authOptions } from '@/lib/auth'
import { uploadImageToBlob } from '@/lib/blob-storage'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth/next'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/**
 * Kontaktanfrage inkl. optional Betreibungsregister-PDF (verschlüsselt gespeichert = Blob, Zugriff nur serverseitig).
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Nicht autorisiert' }, { status: 401 })
    }

    const { id: listingId } = await params

    const listing = await prisma.rentalListing.findUnique({
      where: { id: listingId },
    })

    if (!listing || listing.moderationStatus === 'rejected') {
      return NextResponse.json({ message: 'Inserat nicht gefunden' }, { status: 404 })
    }

    if (listing.sellerId === session.user.id) {
      return NextResponse.json({ message: 'Eigenes Inserat' }, { status: 403 })
    }

    const existing = await prisma.rentalContactRequest.findUnique({
      where: {
        rentalListingId_interestedUserId: {
          rentalListingId: listingId,
          interestedUserId: session.user.id,
        },
      },
    })
    if (existing) {
      return NextResponse.json({ message: 'Du hast diesen Vermieter bereits kontaktiert.' }, { status: 409 })
    }

    const formData = await request.formData()
    const message = (formData.get('message') as string)?.trim() || ''
    const file = formData.get('file') as File | null

    if (!message || message.length < 10) {
      return NextResponse.json({ message: 'Bitte eine Nachricht (mind. 10 Zeichen).' }, { status: 400 })
    }

    let creditUrl: string | null = null
    if (listing.requiresCreditCheck) {
      if (!file || file.size === 0) {
        return NextResponse.json(
          { message: 'Betreibungsregisterauszug (PDF) ist für dieses Inserat erforderlich.' },
          { status: 400 }
        )
      }
      if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
        return NextResponse.json({ message: 'Nur PDF-Dateien erlaubt.' }, { status: 400 })
      }
      const maxBytes = 8 * 1024 * 1024
      if (file.size > maxBytes) {
        return NextResponse.json({ message: 'PDF max. 8 MB.' }, { status: 400 })
      }

      const path = `rental-credit-reports/${listingId}/${session.user.id}/${Date.now()}.pdf`
      creditUrl = await uploadImageToBlob(file, path)
    }

    await prisma.rentalContactRequest.create({
      data: {
        rentalListingId: listingId,
        interestedUserId: session.user.id,
        message,
        creditReportBlobUrl: creditUrl,
      },
    })

    return NextResponse.json({ success: true, message: 'Anfrage gesendet.' })
  } catch (e: any) {
    console.error('[rental contact POST]', e)
    return NextResponse.json({ message: e?.message || 'Fehler' }, { status: 500 })
  }
}
