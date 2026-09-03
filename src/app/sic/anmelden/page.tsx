import { SicDossierLogin } from '@/components/sic/SicDossierLogin'
import { sicPaths } from '@/lib/sic/config'
import { peekSicMagicLink, safeSicNextPath } from '@/lib/sic/magic-link'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Anmelden',
  robots: { index: false, follow: false },
}

export default async function SicLoginConfirmPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; next?: string }>
}) {
  const params = await searchParams
  const token = (params.token || '').trim()
  const next = safeSicNextPath(params.next)
  const status = await peekSicMagicLink(token)

  if (status !== 'valid') {
    return (
      <div>
        <div className="border-b border-amber-200 bg-amber-50 px-5 py-3 text-center text-sm text-amber-900">
          Anmeldelink ungültig oder abgelaufen — fordere unten einen neuen an.
        </div>
        <SicDossierLogin nextPath={next === sicPaths.certificateWorkspace ? undefined : next} />
      </div>
    )
  }

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col justify-center px-5 py-16">
      <h1 className="font-sic-serif text-2xl font-bold tracking-tight text-sic-navy sm:text-3xl">Anmelden</h1>
      <p className="mt-2 text-slate-600">
        Tippe auf «Anmelden», um dein Zertifikat zu öffnen. Erst dieser Klick löst den Link ein — nicht das
        Öffnen der Seite.
      </p>
      <form action={sicPaths.authCallback} method="post" className="mt-6">
        <input type="hidden" name="token" value={token} />
        <input type="hidden" name="next" value={next} />
        <button
          type="submit"
          className="min-h-11 w-full rounded-xl bg-sic-action px-5 py-3.5 text-sm font-semibold text-white hover:bg-sic-action-deep"
        >
          Anmelden
        </button>
      </form>
      <p className="mt-4 text-center text-xs text-slate-400">
        Der Link ist 30 Minuten gültig und nur einmal verwendbar.
      </p>
    </div>
  )
}
