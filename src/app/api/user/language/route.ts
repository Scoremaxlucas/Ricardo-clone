import { authOptions } from '@/lib/auth'
import {
  normalizeLanguage,
  setUserPreferredLanguage,
  getUserPreferredLanguage,
  type AppLanguage,
} from '@/lib/user-language'
import { getServerSession } from 'next-auth/next'
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Nicht autorisiert' }, { status: 401 })
    }

    const language = await getUserPreferredLanguage(session.user.id)
    return NextResponse.json({ language })
  } catch (error: any) {
    return NextResponse.json({ message: error?.message || 'Fehler beim Laden der Sprache' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Nicht autorisiert' }, { status: 401 })
    }

    const body = await request.json()
    const language = normalizeLanguage(body?.language) as AppLanguage
    await setUserPreferredLanguage(session.user.id, language)
    return NextResponse.json({ language })
  } catch (error: any) {
    return NextResponse.json(
      { message: error?.message || 'Fehler beim Speichern der Sprache' },
      { status: 500 }
    )
  }
}

