import Link from 'next/link'

export default function LandlordLeadNotFound() {
  return (
    <main className="mx-auto max-w-lg px-4 py-16 text-center">
      <h1 className="text-xl font-bold text-slate-900">Link ungültig oder abgelaufen</h1>
      <p className="mt-3 text-sm leading-relaxed text-slate-600">
        Dieser Bewerbungslink ist nicht mehr gültig. Bitte prüfe die E-Mail von Helvenda oder kontaktiere uns, falls du
        Hilfe brauchst.
      </p>
      <Link href="/" className="mt-6 inline-block text-sm font-semibold text-teal-800 hover:underline">
        Zu Helvenda Wohnungen
      </Link>
    </main>
  )
}
