import Link from 'next/link'

export default function MeineBewerbungenPlaceholderPage() {
  return (
    <main className="mx-auto max-w-lg px-4 py-16 text-center">
      <h1 className="text-xl font-bold text-slate-900">Meine Bewerbungen</h1>
      <p className="mt-3 text-sm text-slate-600">Diese Funktion wird in Kürze freigeschaltet.</p>
      <Link href="/wohnungen" className="mt-8 inline-block text-sm font-semibold text-teal-800 underline-offset-2 hover:underline">
        Zu den Wohnungen →
      </Link>
    </main>
  )
}
