import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getUserAddresses } from '@/lib/address'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Nicht autorisiert' }, { status: 401 })
    }

    // Fetch user data with legacy address fields
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        verified: true,
        verifiedAt: true,
        verificationStatus: true,
        title: true,
        firstName: true,
        lastName: true,
        // Legacy address fields (still primary source during migration)
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
        paymentMethods: true,
      },
    })

    // Also fetch from new UserAddress table (for future use)
    const addresses = await getUserAddresses(session.user.id)

    if (!user) {
      return NextResponse.json({ message: 'Benutzer nicht gefunden' }, { status: 404 })
    }

    // Build response with legacy fields (for backward compatibility)
    // New 'addresses' field contains data from UserAddress table
    return NextResponse.json({
      verified: user.verified === true && user.verificationStatus === 'approved',
      verifiedAt: user.verifiedAt,
      verificationStatus: user.verificationStatus,
      user: {
        title: user.title,
        firstName: user.firstName,
        lastName: user.lastName,
        // Legacy address fields (still used by frontend)
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
        paymentMethods: user.paymentMethods,
      },
      // New: Structured addresses from UserAddress table
      addresses: addresses.map(addr => ({
        type: addr.type,
        street: addr.street,
        streetNumber: addr.streetNumber,
        postalCode: addr.postalCode,
        city: addr.city,
        country: addr.country,
        addresszusatz: addr.addresszusatz,
        kanton: addr.kanton,
      })),
    })
  } catch (error: any) {
    console.error('Error fetching verification data:', error)
    return NextResponse.json(
      { message: 'Fehler beim Laden der Verifizierungsdaten: ' + error.message },
      { status: 500 }
    )
  }
}
