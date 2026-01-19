import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'Endpoint funktioniert!',
    timestamp: new Date().toISOString()
  })
}

/**
 * POST /api/admin/users/cleanup-test
 *
 * DAUERHAFT DEAKTIVIERT - Dieser Endpoint war nur für den Launch-Cleanup gedacht.
 */
export async function POST(request: NextRequest) {
  return NextResponse.json(
    {
      message: 'Dieser Endpoint ist dauerhaft deaktiviert.',
      disabled: true
    },
    { status: 403 }
  )
