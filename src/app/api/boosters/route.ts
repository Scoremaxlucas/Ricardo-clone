import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/boosters
 * Returns all active boosters for public use (prices are public)
 * Used by the selling wizard to display booster options
 *
 * Watch-out.ch Style: Boost / Turbo-Boost / Super-Boost
 */
export async function GET(request: NextRequest) {
  // Fixed booster options - Boost/Turbo-Boost/Super-Boost system (Watch-out.ch Style)
  const boosterOptions = [
    {
      id: 'boost',
      name: 'Boost',
      description: 'Bessere Platzierung in Suchergebnissen',
      price: 19.90,
      badge: 'BOOST',
      badgeColor: '#0ea5e9', // sky-500 (blau)
    },
    {
      id: 'turbo-boost',
      name: 'Turbo-Boost',
      description: 'Sehr prominente Platzierung + erhöhte Sichtbarkeit',
      price: 39.90,
      badge: 'TURBO',
      badgeColor: '#8b5cf6', // violet-500 (lila)
    },
    {
      id: 'super-boost',
      name: 'Super-Boost',
      description: 'Top-Position + Premium-Startseite + Priorität',
      price: 69.90,
      badge: 'SUPER',
      badgeColor: '#f59e0b', // amber-500 (gold/orange)
    },
  ]

  return NextResponse.json({ boosters: boosterOptions })
}

