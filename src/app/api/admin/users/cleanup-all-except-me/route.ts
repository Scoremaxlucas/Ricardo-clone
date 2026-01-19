import { NextRequest, NextResponse } from 'next/server'

/**
 * POST /api/admin/users/cleanup-all-except-me
 *
 * DAUERHAFT DEAKTIVIERT - Dieser Endpoint war nur für den Launch-Cleanup gedacht.
 * Keine User-Löschungen mehr möglich.
 */
export async function POST(request: NextRequest) {
  return NextResponse.json(
    {
      message: 'Dieser Endpoint ist dauerhaft deaktiviert. User-Löschungen sind nicht mehr möglich.',
      disabled: true,
    },
    { status: 403 }
  )
}
