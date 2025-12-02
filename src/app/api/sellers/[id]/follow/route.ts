import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// POST - Verkäufer folgen
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  // Follow-Funktionalität ist derzeit nicht verfügbar (Follow Model fehlt im Schema)
  return NextResponse.json({ error: 'Follow-Funktionalität ist derzeit nicht verfügbar' }, { status: 501 })
}

// DELETE - Verkäufer entfolgen
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  // Follow-Funktionalität ist derzeit nicht verfügbar (Follow Model fehlt im Schema)
  return NextResponse.json({ error: 'Follow-Funktionalität ist derzeit nicht verfügbar' }, { status: 501 })
}

// GET - Follow-Status prüfen
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  // Follow-Funktionalität ist derzeit nicht verfügbar (Follow Model fehlt im Schema)
  return NextResponse.json({ isFollowing: false })
}
