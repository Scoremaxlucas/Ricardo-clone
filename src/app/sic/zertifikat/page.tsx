import { SicDossierClient } from '@/components/sic/SicDossierClient'
import { SicDossierLogin } from '@/components/sic/SicDossierLogin'
import { sicPaths } from '@/lib/sic/config'
import { getSicDossierView } from '@/lib/sic/dossier'
import { getSicSession } from '@/lib/sic/session-cookie'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export const metadata = { title: 'Mein Zertifikat' }

export default async function SicZertifikatPage() {
  const session = getSicSession()
  if (!session) return <SicDossierLogin />

  const dossier = await getSicDossierView(session.email)
  if (!dossier) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-md flex-col justify-center px-5 py-16 text-center">
        <h1 className="font-sic-serif text-2xl font-bold tracking-tight text-sic-navy sm:text-3xl">Noch kein Zertifikat</h1>
        <p className="mt-3 text-slate-600">
          Zu dieser Anmeldung gehört kein Zertifikat. Falls du die E-Mail geändert hast, fordere den
          Anmeldelink an die neue Adresse an.
        </p>
        <Link
          href={sicPaths.landing}
          className="mt-6 inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-sic-action px-5 py-3 text-sm font-semibold text-white hover:bg-sic-action-deep sm:w-auto"
        >
          Zertifikat anlegen
        </Link>
      </div>
    )
  }

  return <SicDossierClient dossier={dossier} />
}
