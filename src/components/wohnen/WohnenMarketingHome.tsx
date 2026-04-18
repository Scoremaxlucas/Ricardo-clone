import { CreditCheckBadge } from '@/components/rental/CreditCheckBadge'
import { WohnenPublicNav } from '@/components/wohnen/WohnenPublicNav'
import { MAIN_SHOP_ORIGIN } from '@/lib/site-urls'
import { loadWohnenHomeListings } from '@/lib/rental/wohnen-home-listings'
import type { CreditCheckResult } from '@/lib/rental/types'
import { Building2, FileText, Home, MapPin, Rocket, ShieldCheck, User } from 'lucide-react'
import Link from 'next/link'
import type { ReactNode } from 'react'

const previewClean: CreditCheckResult = {
  isValid: true,
  issueDate: 'März 2026',
  isRecent: true,
  hasEntries: false,
  entryCount: 0,
  totalAmountCategory: 'none',
  fullName: '',
  canton: 'ZH',
}

const previewWithEntry: CreditCheckResult = {
  isValid: true,
  issueDate: 'März 2026',
  isRecent: true,
  hasEntries: true,
  entryCount: 1,
  totalAmountCategory: 'low',
  fullName: '',
  canton: 'ZH',
}

function StepCard({
  n,
  icon,
  title,
  body,
}: {
  n: number
  icon: ReactNode
  title: string
  body: string
}) {
  return (
    <div className="relative rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
      <span className="absolute left-4 top-4 flex h-7 w-7 items-center justify-center rounded-full bg-teal-700 text-xs font-bold text-white">
        {n}
      </span>
      <div className="mb-3 mt-6 flex justify-center text-teal-700">{icon}</div>
      <h3 className="text-center text-base font-bold text-slate-900">{title}</h3>
      <p className="mt-2 text-center text-sm leading-relaxed text-slate-600">{body}</p>
    </div>
  )
}

export async function WohnenMarketingHome() {
  const listings = await loadWohnenHomeListings(6)
  const now = Date.now()
  const isNew = (d: Date) => now - d.getTime() < 48 * 3600000

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <WohnenPublicNav />

      {/* Hero */}
      <section className="bg-gradient-to-b from-teal-50/50 via-white to-white px-4 pb-16 pt-10 sm:px-6 sm:pb-20 sm:pt-14 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wide text-teal-800">🇨🇭 Der faire Schweizer Mietmarkt</p>
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl lg:text-[2.75rem] lg:leading-tight">
            Die Wohnungsplattform, die auf deiner Seite ist.
          </h1>
          <p className="mt-5 text-lg text-slate-600 sm:text-xl">
            Kostenlos inserieren für Vermieter. Keine Abo-Pflicht für Mieter. Nur verifizierte Anfragen — dank
            integriertem Betreibungsregister.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
            <Link
              href="/matching/properties/new"
              className="inline-flex w-full min-w-[200px] justify-center rounded-xl bg-[#18a87c] px-6 py-3.5 text-sm font-semibold text-white shadow-md transition hover:opacity-95 sm:w-auto"
            >
              Wohnung inserieren
            </Link>
            <Link
              href="/wohnungen"
              className="inline-flex w-full min-w-[200px] justify-center rounded-xl border-2 border-teal-700 bg-white px-6 py-3.5 text-sm font-semibold text-teal-800 shadow-sm transition hover:bg-teal-50 sm:w-auto"
            >
              Wohnung suchen
            </Link>
          </div>
          <div className="mt-10 flex flex-wrap justify-center gap-2 sm:gap-3">
            {['Inserieren kostenlos', 'Nur verifizierte Bewerber', 'Kein Pflicht-Abo'].map(t => (
              <span
                key={t}
                className="inline-flex items-center rounded-full border border-teal-200 bg-white/90 px-4 py-1.5 text-xs font-medium text-teal-900 shadow-sm sm:text-sm"
              >
                ✓ {t}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Vergleich */}
      <section className="border-t border-slate-100 px-4 py-14 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center text-2xl font-bold text-slate-900 sm:text-3xl">Warum Helvenda Wohnungen?</h2>
          <p className="mx-auto mt-3 max-w-2xl text-center text-slate-600">
            Wir haben das Modell der grossen Portale auf den Kopf gestellt.
          </p>
          <div className="mt-10 overflow-x-auto rounded-2xl border border-slate-200 shadow-sm">
            <table className="w-full min-w-[640px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="px-4 py-3 font-semibold text-slate-800 sm:px-5">Thema</th>
                  <th className="px-4 py-3 font-semibold text-slate-500 sm:px-5">Homegate / ImmoScout</th>
                  <th className="relative bg-[#e8f7f2] px-4 py-3 font-semibold text-teal-800 sm:px-5">
                    <span className="mr-2 inline-flex items-center rounded-full bg-teal-700 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                      ✓ Deine Wahl
                    </span>
                    Helvenda Wohnungen
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {[
                  ['Inserat inserieren', 'CHF 14–28 pro Tag', 'Kostenlos'],
                  ['Mieter kontaktieren', 'CHF 39.95 / Monat Pflicht-Abo', 'Kostenlos, sofort'],
                  ['Bewerbungsqualität', 'Unstrukturierte E-Mails', 'Verifiziert mit Betreibungsregister'],
                  ['Login', 'Separates Konto pro Plattform', 'Ein Helvenda-Konto für alles'],
                ].map(([thema, comp, hel]) => (
                  <tr key={String(thema)}>
                    <td className="px-4 py-3 font-medium text-slate-800 sm:px-5">{thema}</td>
                    <td className="px-4 py-3 text-slate-500 line-through decoration-slate-400 sm:px-5">{comp}</td>
                    <td className="bg-[#e8f7f2] px-4 py-3 text-sm font-bold text-teal-800 sm:px-5">{hel}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Wie es funktioniert */}
      <section className="border-t border-slate-100 bg-slate-50/40 px-4 py-14 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-center text-2xl font-bold text-slate-900 sm:text-3xl">So einfach funktioniert es</h2>
          <div className="mt-10 grid gap-8 lg:grid-cols-2">
            <div>
              <div className="rounded-t-xl bg-teal-700 px-4 py-2 text-center text-sm font-bold text-white">Für Vermieter</div>
              <div className="space-y-4 rounded-b-xl rounded-tr-xl border border-t-0 border-slate-200 bg-white p-4 sm:p-5">
                <StepCard
                  n={1}
                  icon={<Home className="h-10 w-10" />}
                  title="Wohnung inserieren"
                  body="Kostenlos und in wenigen Minuten. Bestehendes Inserat von einer anderen Plattform importieren mit einem Klick."
                />
                <StepCard
                  n={2}
                  icon={<ShieldCheck className="h-10 w-10" />}
                  title="Nur verifizierte Anfragen erhalten"
                  body="Jeder Bewerber hat sein Betreibungsregister bereits hochgeladen. Keine unqualifizierten Anfragen mehr."
                />
                <StepCard
                  n={3}
                  icon={<MapPin className="h-10 w-10" />}
                  title="Direkt Kontakt aufnehmen"
                  body="Wähle geeignete Mieter aus und vereinbare die Besichtigung direkt auf der Plattform."
                />
              </div>
            </div>
            <div>
              <div className="rounded-t-xl bg-slate-800 px-4 py-2 text-center text-sm font-bold text-white">Für Mietende</div>
              <div className="space-y-4 rounded-b-xl rounded-tr-xl border border-t-0 border-slate-200 bg-white p-4 sm:p-5">
                <StepCard
                  n={1}
                  icon={<User className="h-10 w-10" />}
                  title="Profil einmalig erstellen"
                  body="Name, Einkommen, Beschäftigung — alles an einem Ort."
                />
                <StepCard
                  n={2}
                  icon={<FileText className="h-10 w-10" />}
                  title="Betreibungsregister einmal hochladen"
                  body="Gilt automatisch für alle deine Bewerbungen. Vermieter sehen nur: Einträge ja/nein."
                />
                <StepCard
                  n={3}
                  icon={<Rocket className="h-10 w-10" />}
                  title="Mit einem Klick bewerben"
                  body="Kein erneutes Ausfüllen von Formularen. Einmal verifiziert, überall bewerben."
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Betreibungsregister */}
      <section className="border-t border-slate-100 bg-[#e8f7f2] px-4 py-14 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-2 lg:gap-14">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Was ist das Betreibungsregister?</h2>
            <p className="mt-4 text-sm leading-relaxed text-slate-700 sm:text-base">
              Das Betreibungsregister zeigt ob eine Person offene Schulden oder laufende Betreibungen hat. In der
              Schweiz verlangen Vermieter diesen Auszug standardmässig — bei Helvenda ist er direkt und kostenlos in die
              Plattform integriert.
            </p>
            <ul className="mt-6 space-y-3 text-sm text-slate-800">
              <li className="flex gap-2">
                <span aria-hidden>🔒</span>
                <span>Dein Dokument wird verschlüsselt gespeichert</span>
              </li>
              <li className="flex gap-2">
                <span aria-hidden>👁</span>
                <span>Vermieter sehen nur: «Keine Einträge ✅» oder «Einträge vorhanden ⚠️» — keine Detaildaten</span>
              </li>
              <li className="flex gap-2">
                <span aria-hidden>♻️</span>
                <span>Einmal hochladen — gilt für alle Bewerbungen, 3 Monate gültig</span>
              </li>
            </ul>
          </div>
          <div>
            <p className="mb-3 text-sm font-semibold text-slate-800">So sieht es der Vermieter</p>
            <div className="space-y-4">
              <CreditCheckBadge status="approved" creditCheckResult={previewClean} />
              <CreditCheckBadge status="approved" creditCheckResult={previewWithEntry} />
            </div>
            <p className="mt-4 text-xs text-slate-600">
              Das Originaldokument bleibt verschlüsselt — Vermieter sehen nie den vollen Inhalt.
            </p>
          </div>
        </div>
      </section>

      {/* Listings */}
      <section className="border-t border-slate-100 px-4 py-14 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-center text-2xl font-bold text-slate-900 sm:text-3xl">Aktuelle Wohnungen</h2>
          <p className="mt-2 text-center text-slate-600">Neu eingestellt auf Helvenda Wohnungen</p>

          {listings.length === 0 ? (
            <div className="mx-auto mt-12 max-w-md rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 px-6 py-12 text-center">
              <p className="text-slate-700">Noch keine Inserate — sei der Erste!</p>
              <Link
                href="/matching/properties/new"
                className="mt-6 inline-flex rounded-xl bg-[#18a87c] px-5 py-2.5 text-sm font-semibold text-white"
              >
                Wohnung kostenlos inserieren
              </Link>
            </div>
          ) : (
            <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {listings.map(l => (
                <Link
                  key={l.id}
                  href={`/wohnungen/${l.id}`}
                  className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:border-teal-300 hover:shadow-md"
                >
                  <div className="relative aspect-[4/3] bg-slate-100">
                    {l.firstPhotoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={l.firstPhotoUrl} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-slate-400">
                        <Building2 className="h-14 w-14" aria-hidden />
                      </div>
                    )}
                    <div className="absolute left-2 top-2 flex flex-wrap gap-1">
                      {isNew(l.createdAt) ? (
                        <span className="rounded-full bg-amber-500 px-2 py-0.5 text-[11px] font-semibold text-white">
                          Neu
                        </span>
                      ) : null}
                    </div>
                    {l.requiresCreditCheck ? (
                      <span className="absolute bottom-2 left-2 inline-flex items-center gap-1 rounded-full bg-teal-800/95 px-2 py-0.5 text-[11px] font-medium text-white">
                        📄 Betreibungsregister erforderlich
                      </span>
                    ) : null}
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-slate-900 line-clamp-2 group-hover:text-teal-800">{l.title}</h3>
                    <p className="mt-1 text-sm text-slate-600">
                      {l.rooms} Zi. · {l.areaSqm} m²
                      {l.floor != null ? ` · Etage ${l.floor}` : ''}
                    </p>
                    <p className="mt-2 text-lg font-bold text-teal-800">
                      CHF {l.rentPerMonth.toLocaleString('de-CH')} / Monat
                      {l.utilitiesPerMonth != null ? (
                        <span className="text-sm font-normal text-slate-500">
                          {' '}
                          + NK CHF {l.utilitiesPerMonth.toLocaleString('de-CH')}
                        </span>
                      ) : null}
                    </p>
                    <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                      <MapPin className="h-3.5 w-3.5 shrink-0" />
                      {l.zip} {l.city} · {l.canton}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {listings.length > 0 ? (
            <div className="mt-10 text-center">
              <Link
                href="/wohnungen"
                className="inline-flex text-sm font-semibold text-teal-800 underline-offset-2 hover:underline"
              >
                Alle Wohnungen anzeigen →
              </Link>
            </div>
          ) : null}
        </div>
      </section>

      {/* Footer CTA */}
      <section className="bg-[#18a87c] px-4 py-14 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center text-white">
          <h2 className="text-2xl font-bold sm:text-3xl">Bereit loszulegen?</h2>
          <p className="mt-3 text-sm text-white/95 sm:text-base">
            Kostenlos registrieren — als Vermieter oder Mietende.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
            <Link
              href="/matching/properties/new"
              className="inline-flex w-full min-w-[180px] justify-center rounded-xl bg-white px-6 py-3 text-sm font-semibold text-[#18a87c] shadow-md sm:w-auto"
            >
              Wohnung inserieren
            </Link>
            <Link
              href="/register"
              className="inline-flex w-full min-w-[180px] justify-center rounded-xl border-2 border-white bg-transparent px-6 py-3 text-sm font-semibold text-white hover:bg-white/10 sm:w-auto"
            >
              Jetzt registrieren
            </Link>
          </div>
          <p className="mt-8 text-xs text-white/80">
            <a href={MAIN_SHOP_ORIGIN} className="underline-offset-2 hover:underline">
              Artikel & Auktionen auf dem Schweizer Marktplatz → helvenda.ch
            </a>
          </p>
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-500">
        © {new Date().getFullYear()} Helvenda Wohnungen
      </footer>
    </div>
  )
}
