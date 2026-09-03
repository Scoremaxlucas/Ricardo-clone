import { sicPaths } from '@/lib/sic/config'
import { peekSicEmailChange, sicEmailChangeConfirmMessage } from '@/lib/sic/email-change'
import type { Metadata } from 'next'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'E-Mail bestätigen',
  robots: { index: false, follow: false },
}

export default async function SicEmailConfirmPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; error?: string }>
}) {
  const params = await searchParams
  const token = (params.token || '').trim()
  const taken = params.error === 'taken'
  const status = await peekSicEmailChange(token)

  if (taken) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-md flex-col justify-center px-5 py-16">
        <h1 className="font-sic-serif text-2xl font-bold tracking-tight text-sic-navy sm:text-3xl">
          Adresse bereits vergeben
        </h1>
        <p className="mt-2 text-slate-600">{sicEmailChangeConfirmMessage('taken')}</p>
        <Link
          href={sicPaths.certificateWorkspace}
          className="mt-6 flex min-h-11 w-full items-center justify-center rounded-xl bg-sic-action px-5 py-3.5 text-sm font-semibold text-white hover:bg-sic-action-deep"
        >
          Zu Mein Zertifikat
        </Link>
      </div>
    )
  }

  if (status !== 'valid') {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-md flex-col justify-center px-5 py-16">
        <h1 className="font-sic-serif text-2xl font-bold tracking-tight text-sic-navy sm:text-3xl">
          Link ungültig
        </h1>
        <p className="mt-2 text-slate-600">
          {sicEmailChangeConfirmMessage('invalid')} Unter «Mein Zertifikat» kannst du die Änderung erneut
          anfordern, solange du angemeldet bist.
        </p>
        <Link
          href={sicPaths.certificateWorkspace}
          className="mt-6 flex min-h-11 w-full items-center justify-center rounded-xl bg-sic-action px-5 py-3.5 text-sm font-semibold text-white hover:bg-sic-action-deep"
        >
          Zu Mein Zertifikat
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col justify-center px-5 py-16">
      <h1 className="font-sic-serif text-2xl font-bold tracking-tight text-sic-navy sm:text-3xl">
        E-Mail-Adresse bestätigen
      </h1>
      <p className="mt-2 text-slate-600">
        Tippe auf «Bestätigen», damit diese Adresse dein Zugang wird. Erst dieser Klick ändert die E-Mail —
        nicht das Öffnen der Seite.
      </p>
      <form action={sicPaths.emailConfirmApi} method="post" className="mt-6">
        <input type="hidden" name="token" value={token} />
        <button
          type="submit"
          className="min-h-11 w-full rounded-xl bg-sic-action px-5 py-3.5 text-sm font-semibold text-white hover:bg-sic-action-deep"
        >
          Bestätigen
        </button>
      </form>
      <p className="mt-4 text-center text-xs text-slate-400">
        Der Link ist 30 Minuten gültig und nur einmal verwendbar.
      </p>
    </div>
  )
}
