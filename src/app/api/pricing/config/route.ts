import { NextRequest, NextResponse } from 'next/server'
import { getPricingConfig } from '@/lib/pricing-config'

/**
 * GET /api/pricing/config
 * Gibt die aktuelle Pricing-Konfiguration zurück (für Client-Komponenten)
 */
export async function GET(request: NextRequest) {
  try {
    const config = await getPricingConfig()
    return NextResponse.json(config)
  } catch (error: any) {
    console.error('Error fetching pricing config:', error)
    return NextResponse.json(
      { message: 'Fehler beim Laden der Pricing-Konfiguration', error: error.message },
      { status: 500 }
    )
  }
}
