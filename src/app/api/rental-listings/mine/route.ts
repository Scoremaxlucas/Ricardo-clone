import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth/next'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/** Eingeloggt: ob der User mindestens ein Miet-Inserat (RentalListing) hat — für Navbar. */
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ hasListings: false })
    }
    const count = await prisma.rentalListing.count({
      where: { userId: session.user.id },
    })
    return NextResponse.json({ hasListings: count > 0 })
  } catch (e: unknown) {
    console.error('[rental-listings/mine GET]', e)
    return NextResponse.json({ hasListings: false }, { status: 500 })
  }
}
