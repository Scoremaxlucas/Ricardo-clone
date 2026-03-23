import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getUserAddresses, type AddressType } from '@/lib/address'
import { hasSellerIdentityDocumentsSubmitted } from '@/lib/verification'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Nicht autorisiert' }, { status: 401 })
    }

    // Fetch user data (address from UserAddress table)
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        verified: true,
        verifiedAt: true,
        verificationStatus: true,
        title: true,
        firstName: true,
        lastName: true,
        dateOfBirth: true,
        idDocument: true,
        idDocumentPage1: true,
        idDocumentPage2: true,
        idDocumentType: true,
        paymentMethods: true,
        profileComplete: true,
        stripeOnboardingComplete: true,
        payoutsEnabled: true,
      },
    })

    // Fetch addresses from UserAddress table (primary source)
    const addresses = await getUserAddresses(session.user.id)
    const mainAddress = addresses.find(a => a.type === 'MAIN')
    const deliveryAddress = addresses.find(a => a.type === 'DELIVERY')

    if (!user) {
      return NextResponse.json({ message: 'Benutzer nicht gefunden' }, { status: 404 })
    }

    // Build response with addresses from UserAddress table
    // Flat structure maintained for frontend compatibility
    return NextResponse.json({
      verified: user.verified === true && user.verificationStatus === 'approved',
      verifiedAt: user.verifiedAt,
      verificationStatus: user.verificationStatus,
      sellerIdentitySubmitted: hasSellerIdentityDocumentsSubmitted(user),
      stripeOnboardingComplete: user.stripeOnboardingComplete,
      payoutsEnabled: user.payoutsEnabled,
      profileComplete: user.profileComplete,
      user: {
        title: user.title,
        firstName: user.firstName,
        lastName: user.lastName,
        // Main address from UserAddress table
        street: mainAddress?.street || null,
        streetNumber: mainAddress?.streetNumber || null,
        postalCode: mainAddress?.postalCode || null,
        city: mainAddress?.city || null,
        country: mainAddress?.country || 'Schweiz',
        // Delivery address from UserAddress table
        deliveryStreet: deliveryAddress?.street || null,
        deliveryStreetNumber: deliveryAddress?.streetNumber || null,
        deliveryPostalCode: deliveryAddress?.postalCode || null,
        deliveryCity: deliveryAddress?.city || null,
        deliveryCountry: deliveryAddress?.country || null,
        dateOfBirth: user.dateOfBirth,
        idDocument: user.idDocument,
        idDocumentPage1: user.idDocumentPage1,
        idDocumentPage2: user.idDocumentPage2,
        idDocumentType: user.idDocumentType,
        paymentMethods: user.paymentMethods,
      },
      // Structured addresses from UserAddress table
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
    console.error('Error stack:', error?.stack)
    
    // Benutzerfreundliche Fehlermeldung (ohne technische Details)
    let userMessage = 'Fehler beim Laden der Verifizierungsdaten. Bitte versuchen Sie es erneut.'
    let statusCode = 500
    
    // Prisma-spezifische Fehler
    if (error?.code === 'P2025') {
      userMessage = 'Der Benutzer wurde nicht gefunden.'
      statusCode = 404
    } else if (error?.code?.startsWith?.('P')) {
      userMessage = 'Datenbankfehler. Bitte versuchen Sie es später erneut.'
    }
    
    return NextResponse.json(
      { message: userMessage },
      { status: statusCode }
    )
  }
}
