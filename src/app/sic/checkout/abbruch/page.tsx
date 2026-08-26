import { sicPaths } from '@/lib/sic/config'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default function SicCheckoutCancelPage() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-5 py-20 text-center">
      <h1 className="text-2xl font-bold text-sic-navy">Zahlung abgebrochen</h1>
      <p className="mt-3 text-slate-600">
        Es wurde nichts belastet. Sie können Ihr Zertifikat jederzeit erneut zusammenstellen.
      </p>
      <Link
        href={sicPaths.landing}
        className="mt-6 rounded-xl bg-sic-action hover:bg-sic-action-deep px-5 py-3 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5"
      >
        Zurück zur Startseite
      </Link>
    </div>
  )
}
