import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * POST /api/admin/seed-shipping-rates
 * Seeds the shipping rate catalog with Swiss Post rates
 */
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  const secret = request.nextUrl.searchParams.get('secret')

  // Auth: Admin oder Secret
  if (secret !== process.env.CRON_SECRET && !session?.user?.isAdmin) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  const rates = [
    // Base Rates - Economy
    {
      code: 'post_economy_2kg',
      labelDe: 'Versand als Paket Economy (B-Post) bis 2 kg',
      basePriceChf: 9.0,
      rateSetId: 'default_ch_post',
      isAddon: false,
      addonType: null,
      service: 'economy',
      weightTier: 2,
      isActive: true,
    },
    {
      code: 'post_economy_10kg',
      labelDe: 'Versand als Paket Economy (B-Post) bis 10 kg',
      basePriceChf: 12.0,
      rateSetId: 'default_ch_post',
      isAddon: false,
      addonType: null,
      service: 'economy',
      weightTier: 10,
      isActive: true,
    },
    {
      code: 'post_economy_30kg',
      labelDe: 'Versand als Paket Economy (B-Post) bis 30 kg',
      basePriceChf: 21.0,
      rateSetId: 'default_ch_post',
      isAddon: false,
      addonType: null,
      service: 'economy',
      weightTier: 30,
      isActive: true,
    },
    // Base Rates - Priority
    {
      code: 'post_priority_2kg',
      labelDe: 'Versand als Paket Priority (A-Post) bis 2 kg',
      basePriceChf: 13.5,
      rateSetId: 'default_ch_post',
      isAddon: false,
      addonType: null,
      service: 'priority',
      weightTier: 2,
      isActive: true,
    },
    {
      code: 'post_priority_10kg',
      labelDe: 'Versand als Paket Priority (A-Post) bis 10 kg',
      basePriceChf: 15.0,
      rateSetId: 'default_ch_post',
      isAddon: false,
      addonType: null,
      service: 'priority',
      weightTier: 10,
      isActive: true,
    },
    {
      code: 'post_priority_30kg',
      labelDe: 'Versand als Paket Priority (A-Post) bis 30 kg',
      basePriceChf: 24.0,
      rateSetId: 'default_ch_post',
      isAddon: false,
      addonType: null,
      service: 'priority',
      weightTier: 30,
      isActive: true,
    },
    // Add-ons
    {
      code: 'addon_sperrgut',
      labelDe: 'Sperrgut-Zuschlag',
      basePriceChf: 13.0,
      rateSetId: 'default_ch_post',
      isAddon: true,
      addonType: 'sperrgut',
      service: null,
      weightTier: null,
      isActive: true,
    },
    {
      code: 'addon_pickhome',
      labelDe: 'Pick@home-Zuschlag',
      basePriceChf: 3.4,
      rateSetId: 'default_ch_post',
      isAddon: true,
      addonType: 'pickhome',
      service: null,
      weightTier: null,
      isActive: true,
    },
  ]

  const results: string[] = []

  for (const rate of rates) {
    try {
      await prisma.shippingRateCatalog.upsert({
        where: { code: rate.code },
        update: rate,
        create: rate,
      })
      results.push(`✅ ${rate.code}: CHF ${rate.basePriceChf}`)
    } catch (error: any) {
      results.push(`❌ ${rate.code}: ${error.message}`)
    }
  }

  return NextResponse.json({
    success: true,
    message: `Seeded ${rates.length} shipping rates`,
    results,
  })
}

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  const secret = request.nextUrl.searchParams.get('secret')

  if (secret !== process.env.CRON_SECRET && !session?.user?.isAdmin) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  // List current rates
  const rates = await prisma.shippingRateCatalog.findMany({
    where: { isActive: true },
    orderBy: { code: 'asc' },
  })

  return NextResponse.json({
    count: rates.length,
    rates: rates.map(r => ({
      code: r.code,
      price: r.basePriceChf,
      label: r.labelDe,
    })),
  })
}
