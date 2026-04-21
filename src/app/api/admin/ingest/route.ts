import { authOptions } from '@/lib/auth'
import { isAdmin } from '@/lib/auth/isAdmin'
import { runAdminListingIngest, type AdminIngestMode } from '@/lib/rental/listing-ingest-orchestrator'
import { getServerSession } from 'next-auth/next'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const MODES = new Set<AdminIngestMode>(['url', 'text', 'images_text', 'combined'])

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!(await isAdmin(session))) {
      return NextResponse.json({ message: 'Zugriff verweigert' }, { status: 403 })
    }
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Nicht autorisiert' }, { status: 401 })
    }

    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ message: 'Ungültiger Body' }, { status: 400 })
    }
    const b = body as Record<string, unknown>
    const mode = b.mode
    if (typeof mode !== 'string' || !MODES.has(mode as AdminIngestMode)) {
      return NextResponse.json({ message: 'Ungültiger Modus' }, { status: 400 })
    }

    const result = await runAdminListingIngest(session.user.id, {
      mode: mode as AdminIngestMode,
      url: typeof b.url === 'string' ? b.url : undefined,
      text: typeof b.text === 'string' ? b.text : undefined,
      imageUrls: Array.isArray(b.imageUrls) ? b.imageUrls.filter((x): x is string => typeof x === 'string') : undefined,
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('[admin/ingest POST]', error)
    return NextResponse.json(
      { error: 'Interner Fehler', details: String(error) },
      { status: 500 }
    )
  }
}
