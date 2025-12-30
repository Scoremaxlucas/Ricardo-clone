import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/boosters
 * Returns all active boosters for public use (prices are public)
 * Used by the selling wizard to display booster options
 * 
 * Note: Hardcoded to ensure consistent Bronze/Silber/Gold naming
 */
export async function GET(request: NextRequest) {
  // Fixed booster options - Bronze/Silber/Gold system
  const boosterOptions = [
    {
      id: 'bronze',
      name: 'Bronze',
      description: 'Fette Hervorhebung in Suchergebnissen',
      price: 10.0,
      badge: 'BRONZE',
      badgeColor: '#b45309', // amber-700
    },
    {
      id: 'silber',
      name: 'Silber',
      description: 'Hervorhebung + Startseiten-Platzierung',
      price: 25.0,
      badge: 'SILBER',
      badgeColor: '#64748b', // slate-500
    },
    {
      id: 'gold',
      name: 'Gold',
      description: 'Top-Position + Premium-Startseite',
      price: 45.0,
      badge: 'GOLD',
      badgeColor: '#d97706', // amber-600
    },
  ]

  return NextResponse.json({ boosters: boosterOptions })
}

