import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { upsertUserAddress, validateSwissPostalCode } from '@/lib/address'
import { getServerSession } from 'next-auth/next'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Nicht autorisiert' }, { status: 401 })
    }

    const {
      name,
      nickname,
      phone,
      street,
      streetNumber,
      postalCode,
      city,
      country,
      addresszusatz,
      kanton,
    } = await request.json()

    if (!name || !name.trim()) {
      return NextResponse.json({ message: 'Name ist erforderlich' }, { status: 400 })
    }

    // Validierung: Adresse ist optional, aber wenn angegeben, muss sie vollständig sein
    const hasPartialAddress =
      (street && street.trim()) ||
      (streetNumber && streetNumber.trim()) ||
      (postalCode && postalCode.trim()) ||
      (city && city.trim()) ||
      (country && country.trim())

    if (hasPartialAddress) {
      // If any address field is provided, all required fields must be present
      if (!street || !street.trim()) {
        return NextResponse.json({ message: 'Strasse ist erforderlich' }, { status: 400 })
      }
      if (!streetNumber || !streetNumber.trim()) {
        return NextResponse.json({ message: 'Hausnummer ist erforderlich' }, { status: 400 })
      }
      // Validate postal code format (4 digits for Switzerland)
      if (!postalCode || !postalCode.trim()) {
        return NextResponse.json({ message: 'Postleitzahl ist erforderlich' }, { status: 400 })
      }
      if (!validateSwissPostalCode(postalCode)) {
        return NextResponse.json(
          { message: 'Postleitzahl muss 4 Ziffern haben (z.B. 8000)' },
          { status: 400 }
        )
      }
      if (!city || !city.trim()) {
        return NextResponse.json({ message: 'Ort ist erforderlich' }, { status: 400 })
      }
      if (!country || !country.trim()) {
        return NextResponse.json({ message: 'Land ist erforderlich' }, { status: 400 })
      }
      // If country is provided, it should be Switzerland
      if (country.trim() !== 'Schweiz') {
        return NextResponse.json({ message: 'Land muss "Schweiz" sein' }, { status: 400 })
      }
    }

    // Use transaction for atomic update
    const result = await prisma.$transaction(async (tx) => {
      // 1. Update User (including legacy address fields for backward compatibility)
      const updatedUser = await tx.user.update({
        where: { id: session.user.id },
        data: {
          name: name.trim(),
          nickname: nickname?.trim() || null,
          phone: phone?.trim() || null,
          // Update firstName and lastName from name
          firstName: name.trim().split(' ')[0] || null,
          lastName: name.trim().split(' ').slice(1).join(' ') || null,
          // Legacy address fields (keep for backward compatibility)
          ...(street && street.trim() && { street: street.trim() }),
          ...(streetNumber && streetNumber.trim() && { streetNumber: streetNumber.trim() }),
          ...(postalCode && postalCode.trim() && { postalCode: postalCode.trim() }),
          ...(city && city.trim() && { city: city.trim() }),
          ...(country && country.trim() && { country: country.trim() }),
          addresszusatz: addresszusatz?.trim() || null,
          kanton: kanton?.trim() || null,
        },
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          nickname: true,
          firstName: true,
          lastName: true,
          phone: true,
          street: true,
          streetNumber: true,
          postalCode: true,
          city: true,
          country: true,
          addresszusatz: true,
          kanton: true,
        },
      })

      return updatedUser
    })

    // 2. Update UserAddress (new model) - outside transaction for non-blocking
    if (hasPartialAddress && street && city) {
      try {
        await upsertUserAddress(session.user.id, 'MAIN', {
          street: street.trim(),
          streetNumber: streetNumber?.trim() || '',
          postalCode: postalCode?.trim() || '',
          city: city.trim(),
          country: country?.trim() || 'Schweiz',
          addresszusatz: addresszusatz?.trim() || null,
          kanton: kanton?.trim() || null,
        })
      } catch (addressError) {
        // Log but don't fail the request - legacy fields are already saved
        console.error('[profile/update] Error updating UserAddress:', addressError)
      }
    }

    return NextResponse.json({
      message: 'Profil erfolgreich aktualisiert',
      user: result,
    })
  } catch (error) {
    console.error('Error updating profile:', error)
    return NextResponse.json({ message: 'Ein Fehler ist aufgetreten' }, { status: 500 })
  }
}
