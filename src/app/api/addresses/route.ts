import { type AddressInput, type AddressType, deleteUserAddress, getUserAddresses, upsertUserAddress } from '@/lib/address'
import { authOptions } from '@/lib/auth'
import { getServerSession } from 'next-auth/next'
import { NextRequest, NextResponse } from 'next/server'

const VALID_TYPES: AddressType[] = ['MAIN', 'DELIVERY', 'BILLING']

/**
 * GET /api/addresses — Get all addresses for the current user
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Nicht autorisiert' }, { status: 401 })
    }

    const addresses = await getUserAddresses(session.user.id)
    return NextResponse.json({ addresses })
  } catch (error: any) {
    console.error('[addresses] GET error:', error)
    return NextResponse.json({ message: 'Fehler beim Laden der Adressen' }, { status: 500 })
  }
}

/**
 * POST /api/addresses — Create or update an address
 * Body: { type: 'MAIN' | 'DELIVERY' | 'BILLING', address: AddressInput }
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Nicht autorisiert' }, { status: 401 })
    }

    const { type, address } = await request.json()

    if (!type || !VALID_TYPES.includes(type)) {
      return NextResponse.json({ message: 'Ungültiger Adresstyp' }, { status: 400 })
    }

    if (!address?.street?.trim() || !address?.city?.trim() || !address?.postalCode?.trim()) {
      return NextResponse.json({ message: 'Strasse, PLZ und Ort sind erforderlich' }, { status: 400 })
    }

    // Validate Swiss postal code
    const plz = address.postalCode.trim()
    if (!/^\d{4}$/.test(plz)) {
      return NextResponse.json({ message: 'PLZ muss 4 Ziffern lang sein' }, { status: 400 })
    }

    const input: AddressInput = {
      street: address.street.trim(),
      streetNumber: (address.streetNumber || '').trim(),
      postalCode: plz,
      city: address.city.trim(),
      country: (address.country || 'Schweiz').trim(),
      addresszusatz: address.addresszusatz?.trim() || null,
      kanton: address.kanton?.trim() || null,
    }

    const saved = await upsertUserAddress(session.user.id, type, input)

    return NextResponse.json({ success: true, address: saved })
  } catch (error: any) {
    console.error('[addresses] POST error:', error)
    return NextResponse.json({ message: 'Fehler beim Speichern der Adresse' }, { status: 500 })
  }
}

/**
 * DELETE /api/addresses — Delete an address by type
 * Body: { type: 'DELIVERY' | 'BILLING' }
 * Note: MAIN address cannot be deleted
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Nicht autorisiert' }, { status: 401 })
    }

    const { type } = await request.json()

    if (type === 'MAIN') {
      return NextResponse.json({ message: 'Hauptadresse kann nicht gelöscht werden' }, { status: 400 })
    }

    if (!type || !VALID_TYPES.includes(type)) {
      return NextResponse.json({ message: 'Ungültiger Adresstyp' }, { status: 400 })
    }

    await deleteUserAddress(session.user.id, type)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('[addresses] DELETE error:', error)
    return NextResponse.json({ message: 'Fehler beim Löschen der Adresse' }, { status: 500 })
  }
}
