import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

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

    // Validierung: Adresse ist Pflichtfeld
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
    if (!/^[0-9]{4}$/.test(postalCode.trim())) {
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

    // Aktualisiere den Benutzer in der Datenbank
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        name: name.trim(),
        nickname: nickname?.trim() || null,
        phone: phone?.trim() || null,
        // Aktualisiere auch firstName und lastName falls möglich
        firstName: name.trim().split(' ')[0] || null,
        lastName: name.trim().split(' ').slice(1).join(' ') || null,
        // Adressdaten
        street: street.trim(),
        streetNumber: streetNumber.trim(), // Already String in schema, supports alphanumeric
        postalCode: postalCode.trim(), // Already String in schema, preserves leading zeros
        city: city.trim(),
        country: country.trim(),
        // Optional fields
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

    return NextResponse.json({
      message: 'Profil erfolgreich aktualisiert',
      user: updatedUser,
    })
  } catch (error) {
    console.error('Error updating profile:', error)
    return NextResponse.json({ message: 'Ein Fehler ist aufgetreten' }, { status: 500 })
  }
}
