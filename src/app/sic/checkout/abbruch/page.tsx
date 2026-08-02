import { sicPaths } from '@/lib/sic/config'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default function SicCheckoutCancelPage() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-5 py-20 text-center">
      <h1 className="text-2xl font-bold text-slate-900">Zahlung abgebrochen</h1>
      <p className="mt-3 text-slate-600">
        Es wurde nichts belastet. Sie können Ihr Zertifikat jederzeit erneut zusammenstellen.
      </p>
      <Link
        href={sicPaths.landing}
        className="mt-6 rounded-xl bg-teal-700 px-5 py-3 text-sm font-semibold text-white hover:bg-teal-800"
      >
        Zurück zur Startseite
      </Link>
    </div>
  )
}
