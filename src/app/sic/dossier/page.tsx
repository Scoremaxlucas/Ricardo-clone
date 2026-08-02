import { SicDossierClient } from '@/components/sic/SicDossierClient'
import { SicDossierLogin } from '@/components/sic/SicDossierLogin'
import { sicPaths } from '@/lib/sic/config'
import { getSicDossierView } from '@/lib/sic/dossier'
import { getSicSession } from '@/lib/sic/session-cookie'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export const metadata = { title: 'Mein Dossier' }

export default async function SicDossierPage() {
  const session = getSicSession()
  if (!session) return <SicDossierLogin />

  const dossier = await getSicDossierView(session.email)
  if (!dossier) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-md flex-col justify-center px-5 py-16 text-center">
        <h1 className="text-2xl font-bold text-[#0f2b5e]">Noch kein Zertifikat</h1>
        <p className="mt-3 text-slate-600">
          Zu dieser Anmeldung wurde noch kein Zertifikat gefunden. Erstellen Sie jetzt Ihr geprüftes Mieterdossier.
        </p>
        <Link
          href={sicPaths.landing}
          className="mt-6 inline-block rounded-xl bg-[#c8102e] px-5 py-3 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5"
        >
          Zertifikat erstellen
        </Link>
      </div>
    )
  }

  return <SicDossierClient dossier={dossier} />
}
