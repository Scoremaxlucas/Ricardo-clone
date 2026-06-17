import { authOptions } from '@/lib/auth'
import {
  getForbiddenRentalImportSource,
  rentalImportSourceBlockedFetchMessage,
} from '@/lib/rental/ingest-source-policy'
import { checkRentalListingImportRateLimit } from '@/lib/rental/listing-import-rate-limit'
import {
  assertUrlSafeForServerFetch,
  extractListingFromPlainText,
  fetchListingHtml,
  htmlToListingPlainText,
} from '@/lib/rental/listing-url-import-server'
import { getServerSession } from 'next-auth/next'
import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

type Body = { url?: string }

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  const userId = session?.user?.id
  if (!userId) {
    return NextResponse.json({ ok: false, message: 'Nicht angemeldet.' }, { status: 401 })
  }

  const rl = await checkRentalListingImportRateLimit(userId)
  if (!rl.allowed) {
    return NextResponse.json(
      { ok: false, code: 'rate_limit', message: 'Zu viele Anfragen. Bitte später erneut versuchen.' },
      { status: 429 }
    )
  }

  let body: Body
  try {
    body = (await request.json()) as Body
  } catch {
    return NextResponse.json({ ok: false, message: 'Ungültige Anfrage.' }, { status: 400 })
  }

  const rawUrl = typeof body.url === 'string' ? body.url : ''
  if (!rawUrl.trim()) {
    return NextResponse.json({ ok: false, message: 'Bitte eine URL angeben.' }, { status: 400 })
  }

  // Gesperrte Konkurrenz-Portale (Homegate, ImmoScout) niemals abrufen — vor jedem Fetch ablehnen.
  const forbiddenSource = getForbiddenRentalImportSource(rawUrl)
  if (forbiddenSource) {
    return NextResponse.json(
      {
        ok: false,
        code: 'forbidden_source',
        message: rentalImportSourceBlockedFetchMessage(forbiddenSource.label),
      },
      { status: 422 }
    )
  }

  let safeUrl: URL
  try {
    safeUrl = await assertUrlSafeForServerFetch(rawUrl)
  } catch (e) {
    const code = e instanceof Error ? e.message : 'INVALID_URL'
    if (code === 'INVALID_URL') {
      return NextResponse.json({ ok: false, message: 'Ungültige URL. Nur http(s)://-Links sind erlaubt.' }, { status: 400 })
    }
    if (code === 'DNS_FAILED') {
      return NextResponse.json(
        {
          ok: false,
          message: 'Die Domain konnte nicht aufgelöst werden. Bitte URL prüfen.',
        },
        { status: 400 }
      )
    }
    return NextResponse.json(
      {
        ok: false,
        code: 'blocked',
        message: 'Diese URL darf nicht abgerufen werden (localhost / internes Netz).',
      },
      { status: 400 }
    )
  }

  let html: string
  let status: number
  try {
    ;({ html, status } = await fetchListingHtml(safeUrl))
  } catch (e) {
    const aborted = e instanceof Error && e.name === 'AbortError'
    return NextResponse.json(
      {
        ok: false,
        code: aborted ? 'timeout' : 'fetch',
        message: aborted
          ? 'Seite nicht erreichbar. Ist die URL öffentlich zugänglich?'
          : 'Diese Seite konnte nicht geladen werden. Bitte stelle sicher dass die URL öffentlich zugänglich ist.',
      },
      { status: 502 }
    )
  }

  if (status === 403 || status === 401) {
    return NextResponse.json(
      {
        ok: false,
        code: 'blocked_http',
        message:
          'Diese Plattform erlaubt keinen automatischen Zugriff. Bitte fülle das Formular manuell aus.',
      },
      { status: 403 }
    )
  }

  if (status >= 400) {
    return NextResponse.json(
      {
        ok: false,
        code: 'http_error',
        message: 'Diese Seite konnte nicht geladen werden. Bitte stelle sicher dass die URL öffentlich zugänglich ist.',
      },
      { status: 502 }
    )
  }

  const plain = htmlToListingPlainText(html)
  if (!plain.trim()) {
    return NextResponse.json(
      {
        ok: false,
        code: 'empty',
        message: 'Die Inserat-Daten konnten nicht ausgelesen werden. Bitte fülle das Formular manuell aus.',
      },
      { status: 422 }
    )
  }

  let extracted
  try {
    extracted = await extractListingFromPlainText(plain)
  } catch (e) {
    console.error('import-listing anthropic', e)
    return NextResponse.json(
      {
        ok: false,
        code: 'ai',
        message: 'Automatische Analyse nicht möglich. Bitte fülle das Formular manuell aus.',
      },
      { status: 502 }
    )
  }

  if (!extracted) {
    return NextResponse.json(
      {
        ok: false,
        code: 'ai',
        message: 'Die Inserat-Daten konnten nicht ausgelesen werden. Bitte fülle das Formular manuell aus.',
      },
      { status: 422 }
    )
  }

  return NextResponse.json({ ok: true, data: extracted })
}
