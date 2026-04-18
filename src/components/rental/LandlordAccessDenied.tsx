import Link from 'next/link'

export function LandlordAccessDenied() {
  return (
    <main className="mx-auto max-w-lg px-4 py-20 text-center">
      <p className="text-sm font-semibold text-red-700">403 — Zugriff verweigert</p>
      <h1 className="mt-2 text-xl font-bold text-slate-900">Kein Zugriff auf dieses Inserat</h1>
      <p className="mt-3 text-sm text-slate-600">Dieses Inserat gehört nicht zu deinem Konto.</p>
      <Link href="/matching/properties" className="mt-8 inline-block text-sm font-semibold text-teal-800 underline">
        Zu meinen Inseraten
      </Link>
    </main>
  )
}
