import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { qualifyTenant } from '@/lib/rental/qualifyTenant'
import { resolveLandlordApplicationNotifyEmail } from '@/lib/rental/resolve-landlord-notify-email'
import { getServerSession } from 'next-auth/next'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  const userId = session?.user?.id
  if (!userId) {
    return NextResponse.json({ qualified: false, requiresLogin: true })
  }

  const listingId = request.nextUrl.searchParams.get('listingId')
  if (!listingId) {
    return NextResponse.json({ error: 'Missing listingId' }, { status: 400 })
  }

  const [profile, listing] = await Promise.all([
    prisma.tenantProfile.findUnique({ where: { userId } }),
    prisma.rentalListing.findUnique({
      where: { id: listingId },
      select: {
        id: true,
        rentPerMonth: true,
        utilitiesPerMonth: true,
        status: true,
        landlordNotifyEmail: true,
        landlordContact: true,
        user: { select: { email: true } },
      },
    }),
  ])

  if (!listing || listing.status !== 'active') {
    return NextResponse.json({ error: 'Listing not found' }, { status: 404 })
  }

  if (!profile) {
    return NextResponse.json({
      qualified: false,
      issues: [
        {
          code: 'NO_PROFILE',
          message: 'Du hast noch kein Mieterprofil erstellt.',
          action: 'Profil erstellen',
          actionUrl: '/profil/erstellen',
          blocking: true,
        },
      ],
    })
  }

  const result = qualifyTenant(profile, listing)
  const issues = [...result.reasons]
  let qualified = result.qualified

  const landlordTo = resolveLandlordApplicationNotifyEmail({
    landlordNotifyEmail: listing.landlordNotifyEmail,
    landlordContactStored: listing.landlordContact,
    ownerAccountEmail: listing.user?.email ?? null,
  })
  if (qualified && !landlordTo) {
    qualified = false
    issues.push({
      code: 'NO_LANDLORD_NOTIFY_EMAIL',
      message:
        'Für dieses Inserat ist keine gültige Vermieter-E-Mail hinterlegt — Bewerbungen sind momentan nicht möglich.',
      action: 'Zurück',
      actionUrl: `/wohnungen/${listing.id}`,
      blocking: true,
    })
  }

  return NextResponse.json({ qualified, issues })
}
