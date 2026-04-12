import { Footer } from '@/components/layout/Footer'
import { Header } from '@/components/layout/Header'
import { prisma } from '@/lib/prisma'
import { MAIN_SHOP_ORIGIN } from '@/lib/site-urls'
import { MapPin, ShieldCheck } from 'lucide-react'
import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Helvenda Wohnungen — Mietwohnungen in der Schweiz',
  description:
    'Mietwohnungen ohne Maklergebühr: Inserieren, Betreibungsregister prüfen, Anfragen zentral auf Helvenda.',
}

function parsePhotoUrls(json: string): string[] {
  try {
    const v = JSON.parse(json) as unknown
    return Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : []
  } catch {
    return []
  }
}

export default async function WohnenHomePage() {
  const listings = await prisma.rentalListing.findMany({
    where: { status: 'active' },
    orderBy: { createdAt: 'desc' },
    take: 6,
    select: {
      id: true,
      title: true,
      city: true,
      canton: true,
      rooms: true,
      rentPerMonth: true,
      availableFrom: true,
      photos: true,
      requiresCreditCheck: true,
    },
  })

  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-50/80 to-white">
      <Header />
      <main>
        <section className="border-b border-teal-100/80 bg-white/90">
          <div className="mx-auto max-w-5xl px-4 py-14 text-center sm:py-16">
            <p className="text-sm font-medium uppercase tracking-wide text-teal-700">Helvenda Wohnungen</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Mietwohnungen — fair & digital
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-base text-gray-600">
              Inserieren ohne Maklergebühr, strukturierte Anfragen mit optionalem Betreibungsregister und alles
              auf einer Plattform mit dem Helvenda-Marktplatz verknüpft.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/wohnungen"
                className="inline-flex rounded-lg bg-primary-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-700"
              >
                Zu den Inseraten
              </Link>
              <Link
                href="/sell/rent"
                className="inline-flex rounded-lg border border-teal-300 bg-white px-6 py-3 text-sm font-semibold text-teal-900 transition hover:bg-teal-50"
              >
                Wohnung inserieren
              </Link>
            </div>
            <p className="mt-6 text-xs text-gray-500">
              Artikel & Auktionen findest du auf dem{' '}
              <a href={MAIN_SHOP_ORIGIN} className="font-medium text-teal-700 underline-offset-2 hover:underline">
                Helvenda-Marktplatz
              </a>
              .
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-4xl px-4 py-12">
          <h2 className="text-center text-xl font-semibold text-gray-900">Helvenda vs. klassische Portale</h2>
          <div className="mt-6 overflow-hidden rounded-xl border border-teal-100 bg-white shadow-sm">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-teal-100 bg-teal-50/60">
                  <th className="px-4 py-3 font-semibold text-gray-800">Thema</th>
                  <th className="px-4 py-3 font-semibold text-teal-900">Helvenda Wohnungen</th>
                  <th className="px-4 py-3 font-semibold text-gray-600">Oft anderswo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                <tr>
                  <td className="px-4 py-3 font-medium text-gray-800">Gebühren</td>
                  <td className="px-4 py-3 text-gray-700">Inserieren ohne Maklerprovision</td>
                  <td className="px-4 py-3 text-gray-500">Hohe Makler- oder Inseratsgebühren</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-medium text-gray-800">Anfragen</td>
                  <td className="px-4 py-3 text-gray-700">Strukturiert, mit Nachricht & Dokument</td>
                  <td className="px-4 py-3 text-gray-500">Unstrukturierte E-Mails / Chat</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-medium text-gray-800">Betreibungsregister</td>
                  <td className="px-4 py-3 text-gray-700">Optional integriert, Hinweise für Vermieter</td>
                  <td className="px-4 py-3 text-gray-500">Oft manuell / ausserhalb der Plattform</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-medium text-gray-800">Konto</td>
                  <td className="px-4 py-3 text-gray-700">Ein Helvenda-Login für Marktplatz & Mieten</td>
                  <td className="px-4 py-3 text-gray-500">Separate Accounts pro Portal</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section className="border-t border-teal-100/80 bg-teal-50/40 py-12">
          <div className="mx-auto max-w-3xl px-4 text-center">
            <h2 className="text-xl font-semibold text-gray-900">Wie es funktioniert</h2>
            <ol className="mt-6 space-y-4 text-left text-sm text-gray-700">
              <li className="flex gap-3 rounded-lg bg-white/90 p-4 shadow-sm ring-1 ring-teal-100">
                <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-teal-600 text-sm font-bold text-white">
                  1
                </span>
                <span>
                  <strong>Inserieren:</strong> Adresse, Miete, Fotos und Verfügbarkeit erfassen — direkt online.
                </span>
              </li>
              <li className="flex gap-3 rounded-lg bg-white/90 p-4 shadow-sm ring-1 ring-teal-100">
                <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-teal-600 text-sm font-bold text-white">
                  2
                </span>
                <span>
                  <strong>Interessenten:</strong> senden eine Nachricht und können bei Bedarf den
                  Betreibungsregisterauszug hochladen.
                </span>
              </li>
              <li className="flex gap-3 rounded-lg bg-white/90 p-4 shadow-sm ring-1 ring-teal-100">
                <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-teal-600 text-sm font-bold text-white">
                  3
                </span>
                <span>
                  <strong>Vermieter:</strong> sehen die Anfrage inkl. Auszug-Hinweisen und entscheiden nächste Schritte.
                </span>
              </li>
            </ol>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-14">
          <div className="mb-6 flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Aktuelle Inserate</h2>
              <p className="text-sm text-gray-600">Die neuesten aktiven Mietangebote.</p>
            </div>
            <Link href="/wohnungen" className="text-sm font-medium text-primary-700 hover:underline">
              Alle anzeigen →
            </Link>
          </div>
          {listings.length === 0 ? (
            <p className="rounded-xl border border-dashed border-teal-200 bg-white py-12 text-center text-gray-600">
              Noch keine aktiven Inserate —{' '}
              <Link href="/sell/rent" className="font-medium text-primary-700 hover:underline">
                jetzt inserieren
              </Link>
              .
            </p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {listings.map(l => {
                const imgs = parsePhotoUrls(l.photos)
                return (
                  <Link
                    key={l.id}
                    href={`/wohnungen/${l.id}`}
                    className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition hover:border-teal-200 hover:shadow-md"
                  >
                    <div className="relative aspect-[4/3] bg-gray-100">
                      {imgs[0] ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={imgs[0]} alt="" className="h-full w-full object-cover" />
                      ) : null}
                      {l.requiresCreditCheck ? (
                        <span className="absolute bottom-2 left-2 inline-flex items-center gap-1 rounded-full bg-teal-700/95 px-2 py-0.5 text-[11px] font-medium text-white">
                          <ShieldCheck className="h-3 w-3" />
                          Betreibungsregister
                        </span>
                      ) : null}
                    </div>
                    <div className="p-4">
                      <h3 className="line-clamp-2 font-semibold text-gray-900">{l.title}</h3>
                      <p className="mt-1 flex items-center gap-1 text-xs text-gray-600">
                        <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                        {l.city} ({l.canton})
                      </p>
                      <p className="mt-2 text-sm text-gray-600">
                        {l.rooms} Zimmer · ab {new Date(l.availableFrom).toLocaleDateString('de-CH')}
                      </p>
                      <p className="mt-2 text-lg font-semibold text-primary-700">
                        CHF {l.rentPerMonth.toLocaleString('de-CH')} / Monat
                      </p>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </section>
      </main>
      <Footer />
    </div>
  )
}
