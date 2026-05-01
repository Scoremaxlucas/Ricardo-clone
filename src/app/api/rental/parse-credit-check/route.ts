import { authOptions } from '@/lib/auth'
import { parseCreditCheckFromPdfBase64 } from '@/lib/rental/parseCreditCheck'
import { getServerSession } from 'next-auth/next'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/**
 * Test / intern: PDF als Base64 senden, JSON-Ergebnis erhalten.
 * Produktiv: Auszug im Profil unter /profil/betreibungsregister; Bewerbungen via POST /api/rental-applications.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Nicht autorisiert' }, { status: 401 })
    }

    const body = await request.json().catch(() => null)
    const pdfBase64 = body?.pdfBase64 as string | undefined
    if (!pdfBase64 || typeof pdfBase64 !== 'string') {
      return NextResponse.json({ message: 'pdfBase64 fehlt' }, { status: 400 })
    }

    const outcome = await parseCreditCheckFromPdfBase64(pdfBase64)
    return NextResponse.json({ outcome })
  } catch (e: unknown) {
    console.error('[parse-credit-check]', e)
    const msg = e instanceof Error ? e.message : 'Fehler'
    return NextResponse.json({ message: msg }, { status: 500 })
  }
}
