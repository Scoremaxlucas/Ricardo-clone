import { WohnenHomeHowItWorks } from '@/components/wohnen/WohnenHomeHowItWorks'
import { WohnenHomeListingCards, type WohnenHomeListingSerialized } from '@/components/wohnen/WohnenHomeListingCards'
import { loadWohnenHomeListings } from '@/lib/rental/wohnen-home-listings'
import { prisma } from '@/lib/prisma'
import { RentalListingStatus } from '@prisma/client'
import Link from 'next/link'
import type { ReactNode } from 'react'

function serializeListingsForClient(
  listings: Awaited<ReturnType<typeof loadWohnenHomeListings>>
): WohnenHomeListingSerialized[] {
  return listings.map(l => ({
    ...l,
    createdAt: l.createdAt.toISOString(),
    availableFrom: l.availableFrom.toISOString(),
  }))
}

function HomegateCell({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-start gap-2 text-[15px] text-slate-600">
      <span className="mt-0.5 shrink-0 text-red-500/85" aria-hidden>
        ✗
      </span>
      <span>{children}</span>
    </span>
  )
}

function HelvendaCell({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-start gap-2 text-[15px] font-bold text-teal-900">
      <span className="mt-0.5 shrink-0 text-emerald-600" aria-hidden>
        ✓
      </span>
      <span>{children}</span>
    </span>
  )
}

function StaticListingPlaceholders() {
  return (
    <div
      className="-mx-4 flex gap-4 overflow-x-auto px-4 pb-3 scroll-smooth snap-x snap-mandatory md:mx-0 md:grid md:grid-cols-2 md:gap-5 md:overflow-visible md:px-0 md:snap-none lg:grid-cols-3"
      style={{ WebkitOverflowScrolling: 'touch' }}
    >
      {[1, 2, 3].map(i => (
        <div
          key={i}
          className="flex min-h-[220px] min-w-[85vw] shrink-0 snap-start flex-col justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50/90 px-6 py-10 text-center md:min-w-0"
        >
          <p className="text-[15px] font-normal leading-relaxed text-[#5a7a6e]">
            Hier erscheinen bald echte Inserate. Schau später wieder vorbei — oder inseriere die erste Wohnung.
          </p>
        </div>
      ))}
    </div>
  )
}

export async function WohnenMarketingHome({
  primaryHref = '/wohnungen',
  primaryLabel = 'Wohnungen suchen',
}: {
  primaryHref?: string
  primaryLabel?: string
}) {
  const [listings, activeCount] = await Promise.all([
    loadWohnenHomeListings(6),
    prisma.rentalListing.count({ where: { status: RentalListingStatus.active } }),
  ])

  const serialized = serializeListingsForClient(listings)

  const comparisonRows: { tema: string; hg: string; hv: string }[] = [
    { tema: 'Inserat inserieren', hg: 'CHF 14–28 pro Tag', hv: 'Kostenlos' },
    { tema: 'Mieter kontaktieren', hg: 'CHF 39.95 / Monat Pflicht-Abo', hv: 'Kostenlos, sofort' },
    { tema: 'Bewerbungsqualität', hg: 'Unstrukturierte E-Mails', hv: 'Verifiziert mit Betreibungsregisterauszug' },
    { tema: 'Login', hg: 'Separates Konto pro Plattform', hv: 'Ein Helvenda-Konto für alles' },
    { tema: 'Inserate-Qualität', hg: 'Keine Vorprüfung', hv: 'Betreibungsregisterauszug inklusive' },
    { tema: 'Mieterplus-Abo', hg: 'CHF 39.95/Monat Pflicht', hv: 'Nie — kostenlos für alle' },
  ]

  return (
    <div className="bg-white text-slate-900">
      <style
        dangerouslySetInnerHTML={{
          __html: `
          @keyframes whomeFadeInUp {
            from { opacity: 0; transform: translateY(24px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @keyframes whomePulseDot {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.45; }
          }
          .whome-anim { opacity: 0; animation: whomeFadeInUp 0.5s ease forwards; }
          .whome-d0 { animation-delay: 0s; }
          .whome-d1 { animation-delay: 0.1s; }
          .whome-d2 { animation-delay: 0.2s; }
          .whome-d3 { animation-delay: 0.3s; }
          .whome-d4 { animation-delay: 0.4s; }
          .whome-pulse-dot { animation: whomePulseDot 1.6s ease-in-out infinite; }
        `,
        }}
      />

      {/* 1. Hero */}
      <section
        className="relative flex min-h-[85vh] flex-col justify-center bg-white px-5 pt-12 pb-16 sm:px-6 sm:pt-20 sm:pb-20 md:px-8 md:pt-20"
        style={{ backgroundImage: 'linear-gradient(180deg, #e8f7f2 0%, #ffffff 40%)' }}
      >
        <div className="mx-auto max-w-4xl text-center">
          <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[#18a87c] md:text-[13px]">
            🇨🇭 DER FAIRE SCHWEIZER MIETMARKT
          </p>

          <h1 className="mx-auto mt-5 max-w-[22ch] text-[36px] font-black leading-[1.05] tracking-[-0.02em] text-slate-900 sm:max-w-none md:mt-6 md:max-w-[18ch] md:text-[72px] md:leading-none">
            <span className="block text-slate-900">Wohnung finden.</span>
            <span className="mt-2 block text-[#18a87c] md:mt-3">
              Ohne Abo.
              <br className="md:hidden" /> Ohne Abzocke.
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-[600px] text-base font-normal leading-relaxed text-[#5a7a6e] md:mt-8 md:text-[22px] md:leading-[1.6]">
            Wohnungssuche in der Schweiz ist stressig genug.
            <br />
            Bei Helvenda bewirbst du dich einmal — und wirst überall sofort ernst genommen.
          </p>

          <div className="mx-auto mt-8 flex max-w-xl flex-col items-stretch justify-center gap-3 sm:mt-10 sm:flex-row sm:items-center sm:gap-6">
            <Link
              href={primaryHref}
              className="inline-flex h-[52px] w-full items-center justify-center rounded-xl bg-[#18a87c] px-6 text-base font-semibold text-white shadow-sm transition hover:opacity-95 md:h-auto md:px-10 md:py-4 md:text-lg"
            >
              {primaryLabel}
            </Link>
            <Link
              href="/matching/properties/new"
              className="flex h-[52px] w-full items-center justify-center text-center text-base font-semibold text-[#5a7a6e] transition hover:text-[#18a87c] sm:h-auto sm:w-auto sm:py-4 md:text-lg"
            >
              Als Vermieter inserieren →
            </Link>
          </div>

          <div className="mx-auto mt-8 flex max-w-2xl flex-wrap justify-center gap-x-2 gap-y-2 text-xs font-normal text-[#8aa89e] sm:mt-10 sm:gap-x-6 sm:text-sm md:text-[14px]">
            <span>✓ Inserieren kostenlos</span>
            <span>✓ Nur verifizierte Bewerber</span>
            <span>✓ Kein Pflicht-Abo</span>
          </div>

          {activeCount > 0 ?
            <p className="mx-auto mt-4 flex flex-wrap items-center justify-center gap-2 text-sm font-bold text-[#18a87c] sm:mt-5 md:text-base">
              <span className="whome-pulse-dot inline-block text-[#18a87c]" aria-hidden>
                ●
              </span>
              <span>
                Aktuell {activeCount.toLocaleString('de-CH')} Wohnungen verfügbar in der Schweiz
              </span>
            </p>
          : null}
        </div>
      </section>

      {/* 2. Listings */}
      <section className="whome-anim whome-d0 border-t border-slate-100 px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-center text-[28px] font-extrabold tracking-[-0.04em] text-slate-900 sm:text-[36px] sm:tracking-[-0.06em]">
            Aktuelle Wohnungen
          </h2>
          <div className="mt-10">
            {listings.length === 0 ?
              <StaticListingPlaceholders />
            : <WohnenHomeListingCards listings={serialized} />}
          </div>
        </div>
      </section>

      {/* 3. Wie es funktioniert */}
      <section
        id="wie-es-funktioniert"
        className="whome-anim whome-d1 border-t border-slate-100 bg-[#f5fdfb] px-4 py-16 sm:px-6 lg:px-8"
        style={{ backgroundImage: 'linear-gradient(to bottom, #f5fdfb 0%, #f5fdfb 78%, #ffffff 100%)' }}
      >
        <WohnenHomeHowItWorks />
      </section>

      {/* 4. Vergleich */}
      <section className="whome-anim whome-d2 border-t border-slate-100 px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center text-[28px] font-extrabold tracking-[-0.04em] text-slate-900 sm:text-[36px] sm:tracking-[-0.06em]">
            Warum Helvenda — und nicht Homegate?
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-center text-base font-normal text-[#5a7a6e]">Die Antwort in Zahlen.</p>
          <div
            className="table-wrapper mt-10 rounded-2xl border border-slate-200 shadow-sm [-webkit-overflow-scrolling:touch]"
            style={{ WebkitOverflowScrolling: 'touch' }}
          >
            <table className="w-full min-w-[640px] border-collapse text-left">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="px-4 py-4 text-[13px] font-semibold uppercase tracking-wide text-slate-800 sm:px-5">Thema</th>
                  <th className="px-4 py-4 text-[13px] font-semibold uppercase tracking-wide text-slate-500 sm:px-5">
                    Homegate / ImmoScout
                  </th>
                  <th className="relative bg-[#e8f7f2] px-4 py-4 text-[13px] font-semibold text-teal-900 sm:px-5">
                    <span className="mr-2 inline-flex items-center rounded-full bg-teal-700 px-2 py-0.5 text-[11px] font-bold uppercase tracking-[0.12em] text-white">
                      ✓ Deine Wahl
                    </span>
                    Helvenda Wohnungen
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {comparisonRows.map(row => (
                  <tr key={row.tema}>
                    <td className="px-4 py-4 text-[15px] font-semibold text-slate-800 sm:px-5">{row.tema}</td>
                    <td className="px-4 py-4 sm:px-5">
                      <HomegateCell>{row.hg}</HomegateCell>
                    </td>
                    <td className="bg-[#e8f7f2] px-4 py-4 sm:px-5">
                      <HelvendaCell>{row.hv}</HelvendaCell>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* 5. Footer CTA */}
      <section className="whome-anim whome-d3 bg-[#18a87c] px-4 py-14 sm:px-6 sm:py-16 lg:px-8">
        <div className="mx-auto max-w-6xl text-white">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 md:gap-8">
            <div className="pr-0 md:pr-8">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white">FÜR MIETENDE</p>
              <h2 className="mt-3 text-[28px] font-extrabold leading-[1.2] tracking-[-0.03em] text-white sm:text-[34px]">
                Einmal verifiziert.
                <br />
                Überall sofort bewerben.
              </h2>
              <p className="mt-4 text-[15px] leading-relaxed text-white/75">
                Kein Formular. Kein Abo.
                <br />
                Nur echte Wohnungen.
              </p>
              <div className="mt-7">
                <Link
                  href={primaryHref}
                  className="inline-flex min-h-[46px] w-full items-center justify-center rounded-[10px] bg-white px-6 py-3 text-base font-bold text-[#18a87c] shadow-sm transition hover:bg-white/95 sm:w-auto"
                >
                  Jetzt Wohnungen suchen →
                </Link>
              </div>
            </div>

            <div className="border-t border-white/20 pt-8 md:border-l md:border-t-0 md:pl-8 md:pt-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white">FÜR VERMIETER</p>
              <h2 className="mt-3 text-[28px] font-extrabold leading-[1.2] tracking-[-0.03em] text-white sm:text-[34px]">
                Schluss mit 80 unqualifizierten
                <br />
                Anfragen.
              </h2>
              <p className="mt-4 text-[15px] leading-relaxed text-white/75">
                Kostenlos inserieren.
                <br />
                Nur verifizierte Bewerber.
              </p>
              <div className="mt-7">
                <Link
                  href="/matching/properties/new"
                  className="inline-flex min-h-[46px] w-full items-center justify-center rounded-[10px] border border-white bg-transparent px-6 py-3 text-base font-bold text-white transition hover:bg-white/10 sm:w-auto"
                >
                  Wohnung inserieren →
                </Link>
              </div>
            </div>
          </div>

          <div className="mt-8 border-t border-white/25 pt-5 text-center sm:mt-10">
            <p className="text-[12px] uppercase tracking-[0.08em] text-white/45">
              Kein Abo · Keine versteckten Kosten · Jederzeit kündbar
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
