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
      className="flex gap-4 overflow-x-auto overflow-y-hidden pb-3 pl-[max(1rem,env(safe-area-inset-left,0px))] pr-[max(1rem,env(safe-area-inset-right,0px))] scroll-smooth scroll-pl-4 scroll-pr-4 snap-x snap-mandatory [-ms-overflow-style:none] [scrollbar-width:none] sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-5 sm:overflow-visible sm:px-0 sm:pb-0 sm:pl-0 sm:pr-0 sm:snap-none lg:grid-cols-3 [&::-webkit-scrollbar]:hidden"
      style={{ WebkitOverflowScrolling: 'touch' }}
    >
      {[1, 2, 3].map(i => (
        <div
          key={i}
          className="flex min-h-[200px] w-[min(100%,calc(100vw-2.5rem-env(safe-area-inset-left)-env(safe-area-inset-right)))] max-w-[320px] shrink-0 snap-start flex-col justify-center gap-3 rounded-xl border border-dashed border-slate-300 bg-slate-50/90 px-5 py-7 text-center sm:min-w-0 sm:w-auto sm:max-w-none"
        >
          <p className="text-[14px] font-normal leading-relaxed text-[#5a7a6e]">
            {i === 1 ?
              <>
                Hier erscheinen passende Inserate — mit Nachweis, wo Vermieter ihn verlangen.
                <span className="mt-3 block text-[13px] text-slate-500">
                  Vermieter?{' '}
                  <Link href="/matching/properties/new" className="font-semibold text-teal-800 underline-offset-2 hover:underline">
                    Kostenlos inserieren
                  </Link>
                </span>
              </>
            : i === 2 ?
              <Link href="/help/wohnungen-qualitaetsnachweis-pruefen" className="text-[13px] text-teal-800 underline-offset-2 hover:underline">
                Qualitätsnachweis für ausserhalb von Helvenda
              </Link>
            : 'Weitere Regionen folgen, sobald Inserate live sind.'}
          </p>
        </div>
      ))}
    </div>
  )
}

export async function WohnenMarketingHome({
  primaryHref = '/wohnungen',
  primaryLabel = 'Wohnungen suchen',
  signedIn = false,
}: {
  primaryHref?: string
  primaryLabel?: string
  signedIn?: boolean
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
    {
      tema: 'Nachweis für externe Bewerbungen',
      hg: 'Kein standardisierter Nachweis',
      hv: 'Helvenda Qualitätsnachweis (PDF + Online-Prüfung)',
    },
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

      {/* 1. Hero — Mieter-first, weniger parallele Claims */}
      <section
        className="relative flex min-h-[min(88dvh,760px)] flex-col justify-center bg-white px-4 pb-12 pt-[max(5.25rem,calc(3.5rem+env(safe-area-inset-top,0px)+1rem))] sm:px-6 sm:pb-16 sm:pt-[max(5.5rem,calc(3.5rem+env(safe-area-inset-top,0px)+1.5rem))] md:min-h-[min(78vh,820px)] md:px-8 md:pt-20"
        style={{ backgroundImage: 'linear-gradient(180deg, #e8f7f2 0%, #ffffff 45%)' }}
      >
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#18a87c] sm:text-[12px]">
            Schweizer Mietmarkt — fair für Mieter
          </p>

          <h1 className="mx-auto mt-4 max-w-[20ch] text-[clamp(1.75rem,6.5vw,2.1rem)] font-black leading-[1.06] tracking-[-0.02em] text-slate-900 sm:max-w-none sm:text-[2.25rem] md:mt-5 md:text-[clamp(2.5rem,7vw,3.25rem)] md:leading-[1.05]">
            <span className="block text-slate-900">Wohnung finden.</span>
            <span className="mt-1.5 block text-[#18a87c] md:mt-2">
              Ohne Abo.
              <br className="md:hidden" /> Ohne Abzocke.
            </span>
          </h1>

          <p className="mx-auto mt-5 max-w-[34rem] text-[0.9375rem] leading-relaxed text-[#5a7a6e] sm:mt-6 sm:text-[1.0625rem] md:text-[1.125rem] md:leading-[1.55]">
            Einmal Profil und Betreibungsregister — dann passende Inserate und ein Nachweis, den du auch ausserhalb von Helvenda nutzen kannst.
          </p>

          <div className="mx-auto mt-8 max-w-md sm:mt-9">
            <Link
              href={primaryHref}
              className="inline-flex h-[52px] w-full items-center justify-center rounded-xl bg-[#18a87c] px-6 text-base font-semibold text-white shadow-sm transition hover:opacity-95 md:h-[54px] md:text-[1.0625rem]"
            >
              {primaryLabel}
            </Link>
            <p className="mt-4 text-center text-sm text-slate-500">
              <Link href="/matching/properties/new" className="font-medium text-[#2d6a4f] underline-offset-2 hover:text-[#18a87c] hover:underline">
                Vermieter?
              </Link>{' '}
              Inserieren ist kostenlos.
            </p>
          </div>

          <p className="mx-auto mt-8 max-w-xl text-[12px] leading-relaxed text-slate-500 sm:mt-9 sm:text-[13px]">
            <span className="text-slate-400">✓</span> Kostenlos für Mieter &nbsp;·&nbsp; verifizierte Bewerbungen &nbsp;·&nbsp; kein Pflicht-Abo
            {activeCount > 0 ?
              <>
                {' '}
                ·{' '}
                <span className="whome-pulse-dot font-semibold text-[#18a87c]" aria-hidden>
                  ●
                </span>{' '}
                <span className="font-medium text-[#2d6a4f]">{activeCount.toLocaleString('de-CH')} Inserate online</span>
              </>
            : null}
          </p>
        </div>
      </section>

      {/* 2. Listings */}
      <section className="whome-anim whome-d0 border-t border-slate-100 px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-center text-[1.375rem] font-extrabold leading-tight tracking-[-0.03em] text-slate-900 sm:text-[1.75rem] sm:tracking-[-0.04em] md:text-[2.25rem] md:tracking-[-0.06em]">
            Aktuelle Wohnungen
          </h2>
          <div className="mt-10">
            {listings.length === 0 ?
              <StaticListingPlaceholders />
            : <WohnenHomeListingCards listings={serialized} />}
          </div>
        </div>
      </section>

      {/* Qualitätsnachweis — nach Listings, kompakt (Anker #qualitaetsnachweis) */}
      <section
        id="qualitaetsnachweis"
        className="whome-anim whome-d1 border-t border-slate-100 bg-gradient-to-b from-[#f8fdfb] to-white px-4 py-10 sm:px-6 sm:py-12 lg:px-8"
      >
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col gap-5 rounded-2xl border border-[#bfe8d4] bg-white/95 px-5 py-5 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:gap-8 sm:px-7 sm:py-6">
            <div className="min-w-0 flex-1 text-left">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#18a87c]">Helvenda Qualitätsnachweis</p>
              <p className="mt-1.5 text-lg font-extrabold tracking-tight text-slate-900 sm:text-xl">
                PDF + Prüf-Link — auch für Bewerbungen ausserhalb von Helvenda
              </p>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-[#5a7a6e]">
                Sobald Profil und Betreibungsregister passen, stellst du den Nachweis in wenigen Klicks aus.
              </p>
            </div>
            <div className="flex shrink-0 flex-col gap-2.5 sm:flex-row sm:items-center">
              <Link
                href={signedIn ? '/zertifikat' : '/register'}
                className="inline-flex h-11 items-center justify-center rounded-xl bg-[#18a87c] px-5 text-sm font-bold text-white shadow-sm transition hover:opacity-95 sm:min-w-[10.5rem]"
              >
                {signedIn ? 'Zum Nachweis' : 'Konto erstellen'}
              </Link>
              <Link
                href="#wie-es-funktioniert"
                className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:border-[#18a87c] hover:text-[#18a87c]"
              >
                So funktioniert’s
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Wie es funktioniert */}
      <section
        id="wie-es-funktioniert"
        className="whome-anim whome-d2 border-t border-slate-100 bg-[#f5fdfb] px-4 py-16 sm:px-6 lg:px-8"
        style={{ backgroundImage: 'linear-gradient(to bottom, #f5fdfb 0%, #f5fdfb 78%, #ffffff 100%)' }}
      >
        <WohnenHomeHowItWorks />
      </section>

      {/* 4. Vergleich */}
      <section className="whome-anim whome-d3 border-t border-slate-100 px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center text-[1.25rem] font-extrabold leading-snug tracking-[-0.03em] text-slate-900 sm:text-[1.5rem] md:text-[2.25rem] md:tracking-[-0.06em]">
            Warum Helvenda — und nicht Homegate?
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-center text-[0.9375rem] font-normal leading-relaxed text-[#5a7a6e] sm:text-base">
            Die Antwort in Zahlen.
          </p>

          <div className="mt-8 space-y-3 md:hidden">
            {comparisonRows.map(row => (
              <article
                key={row.tema}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
              >
                <h3 className="text-[0.8125rem] font-semibold uppercase tracking-wide text-slate-500">{row.tema}</h3>
                <div className="mt-3 space-y-3">
                  <div>
                    <p className="mb-1.5 text-[0.6875rem] font-semibold uppercase tracking-wide text-slate-400">
                      Homegate / ImmoScout
                    </p>
                    <HomegateCell>{row.hg}</HomegateCell>
                  </div>
                  <div className="rounded-xl bg-[#e8f7f2] p-3">
                    <p className="mb-1.5 text-[0.6875rem] font-semibold uppercase tracking-wide text-teal-900">Helvenda</p>
                    <HelvendaCell>{row.hv}</HelvendaCell>
                  </div>
                </div>
              </article>
            ))}
          </div>

          <div
            className="table-wrapper mt-10 hidden max-w-full overflow-x-auto rounded-2xl border border-slate-200 shadow-sm md:block [-webkit-overflow-scrolling:touch]"
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
      <section className="whome-anim whome-d4 bg-[#18a87c] px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <div className="mx-auto max-w-6xl text-white">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 md:gap-8">
            <div className="pr-0 md:pr-8">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white">FÜR MIETENDE</p>
              <h2 className="mt-3 text-[1.375rem] font-extrabold leading-[1.2] tracking-[-0.03em] text-white sm:text-[1.75rem] md:text-[2.125rem]">
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
              <h2 className="mt-3 text-[1.375rem] font-extrabold leading-[1.2] tracking-[-0.03em] text-white sm:text-[1.75rem] md:text-[2.125rem]">
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
