import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'

// Follow/Unfollow einen User
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  // Follow-Funktionalität ist derzeit nicht verfügbar (Follow Model fehlt im Schema)
  return NextResponse.json({ error: 'Follow-Funktionalität ist derzeit nicht verfügbar' }, { status: 501 })
}

// Prüfe ob aktueller User diesem User folgt
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  // Follow-Funktionalität ist derzeit nicht verfügbar (Follow Model fehlt im Schema)
  return NextResponse.json({ isFollowing: false })
}
