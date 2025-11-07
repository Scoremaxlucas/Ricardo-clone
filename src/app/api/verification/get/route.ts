import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { message: 'Nicht autorisiert' },
        { status: 401 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        verified: true,
        verifiedAt: true,
        title: true,
        firstName: true,
        lastName: true,
        street: true,
        streetNumber: true,
        postalCode: true,
        city: true,
        country: true,
        deliveryStreet: true,
        deliveryStreetNumber: true,
        deliveryPostalCode: true,
        deliveryCity: true,
        deliveryCountry: true,
        dateOfBirth: true,
        idDocument: true,
        idDocumentPage1: true,
        idDocumentPage2: true,
        idDocumentType: true,
        paymentMethods: true
      }
    })

    if (!user) {
      return NextResponse.json(
        { message: 'Benutzer nicht gefunden' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      verified: user.verified || false,
      verifiedAt: user.verifiedAt,
      user: {
        title: user.title,
        firstName: user.firstName,
        lastName: user.lastName,
        street: user.street,
        streetNumber: user.streetNumber,
        postalCode: user.postalCode,
        city: user.city,
        country: user.country,
        deliveryStreet: user.deliveryStreet,
        deliveryStreetNumber: user.deliveryStreetNumber,
        deliveryPostalCode: user.deliveryPostalCode,
        deliveryCity: user.deliveryCity,
        deliveryCountry: user.deliveryCountry,
        dateOfBirth: user.dateOfBirth,
        idDocument: user.idDocument,
        idDocumentPage1: user.idDocumentPage1,
        idDocumentPage2: user.idDocumentPage2,
        idDocumentType: user.idDocumentType,
        paymentMethods: user.paymentMethods
      }
    })
  } catch (error: any) {
    console.error('Error fetching verification data:', error)
    return NextResponse.json(
      { message: 'Fehler beim Laden der Verifizierungsdaten: ' + error.message },
      { status: 500 }
    )
  }
}

