import { Footer } from '@/components/layout/Footer'
import { Header } from '@/components/layout/Header'
import { LegalPageWrapper } from '@/components/legal/LegalPageWrapper'

export default function FeesPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50">
        <div className="mx-auto max-w-4xl px-4 py-8 sm:py-12">
          <LegalPageWrapper titleKey="fees" validSince="18.01.2026">

            <div className="prose prose-sm max-w-none sm:prose-base lg:prose-lg">
              <div className="space-y-6 text-gray-700 sm:space-y-8">
                {/* Einleitung */}
                <section>
                  <p className="text-base sm:text-lg">
                    Das vorliegende Gebührenreglement ist integraler Bestandteil der Allgemeinen
                    Geschäftsbedingungen (AGB) von Helvenda und regelt die Gebühren für die Nutzung
                    des Marktplatzes.
                  </p>
                </section>

                {/* Kostenlose Nutzung */}
                <section>
                  <h2 className="mb-3 text-xl font-bold text-gray-900 sm:mb-4 sm:text-2xl">1. Grundsätze</h2>

                  <div className="rounded-lg border border-green-200 bg-green-50 p-3 sm:p-4">
                    <h3 className="mb-2 text-sm font-semibold text-green-800 sm:text-base">
                      Kostenlos Einstellen und Kaufen
                    </h3>
                    <ul className="space-y-1 text-sm text-green-700 sm:text-base">
                      <li>✓ Angebote einstellen ist kostenlos</li>
                      <li>✓ Kaufen ist kostenlos</li>
                      <li>✓ Mitgliedschaft ist kostenlos</li>
                    </ul>
                  </div>

                  <p className="mt-3 text-sm sm:mt-4 sm:text-base">
                    Helvenda erhebt Gebühren nur bei erfolgreichem Verkauf (Erfolgsprovision) sowie
                    für optionale Zusatzleistungen (Booster).
                  </p>
                </section>

                {/* Erfolgsprovision */}
                <section>
                  <h2 className="mb-3 text-xl font-bold text-gray-900 sm:mb-4 sm:text-2xl">2. Erfolgsprovision</h2>

                  <p className="mb-3 text-sm sm:mb-4 sm:text-base">
                    Bei einem erfolgreichen Verkauf wird eine Erfolgsprovision fällig. Diese wird
                    vom Verkäufer bezahlt.
                  </p>

                  {/* Mobile: Karten-Layout */}
                  <div className="space-y-3 sm:hidden">
                    <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                      <div className="text-xs font-medium uppercase tracking-wide text-gray-500">Erfolgsprovision</div>
                      <div className="mt-1 text-base font-semibold text-gray-900">5% des Verkaufspreises</div>
                    </div>
                    <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                      <div className="text-xs font-medium uppercase tracking-wide text-gray-500">Höchstbetrag</div>
                      <div className="mt-1 text-base font-semibold text-gray-900">CHF 150.00</div>
                    </div>
                    <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                      <div className="text-xs font-medium uppercase tracking-wide text-gray-500">MwSt auf Provision (8.1%)</div>
                      <div className="mt-1 text-base text-gray-700">wird zusätzlich berechnet</div>
                    </div>
                  </div>

                  {/* Desktop: Tabelle */}
                  <div className="hidden overflow-hidden rounded-lg border border-gray-200 sm:block">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 md:px-6">
                            Gebühr
                          </th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 md:px-6">
                            Betrag
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 bg-white">
                        <tr>
                          <td className="px-4 py-3 text-sm text-gray-700 md:px-6 md:py-4">Erfolgsprovision</td>
                          <td className="px-4 py-3 text-sm font-medium text-gray-900 md:px-6 md:py-4">
                            5% des Verkaufspreises
                          </td>
                        </tr>
                        <tr>
                          <td className="px-4 py-3 text-sm text-gray-700 md:px-6 md:py-4">Höchstbetrag</td>
                          <td className="px-4 py-3 text-sm font-medium text-gray-900 md:px-6 md:py-4">
                            CHF 150.00
                          </td>
                        </tr>
                        <tr>
                          <td className="px-4 py-3 text-sm text-gray-700 md:px-6 md:py-4">
                            MwSt auf Provision (8.1%)
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700 md:px-6 md:py-4">
                            wird zusätzlich berechnet
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <div className="mt-3 rounded-lg border border-blue-200 bg-blue-50 p-3 sm:mt-4 sm:p-4">
                    <h4 className="mb-1 text-sm font-semibold text-blue-800 sm:mb-2 sm:text-base">Beispiel</h4>
                    <p className="text-xs text-blue-700 sm:text-sm">
                      Verkaufspreis: CHF 1&apos;000.00
                      <br />
                      Erfolgsprovision (5%): CHF 50.00
                      <br />
                      MwSt (8.1%): CHF 4.05
                      <br />
                      <strong>Total Gebühren: CHF 54.05</strong>
                    </p>
                  </div>
                </section>

                {/* Zahlungsgebühren */}
                <section>
                  <h2 className="mb-3 text-xl font-bold text-gray-900 sm:mb-4 sm:text-2xl">3. Zahlungsgebühren</h2>

                  <p className="mb-3 text-sm sm:mb-4 sm:text-base">
                    Bei Nutzung des Zahlungsschutzes fallen zusätzlich Zahlungsgebühren an, die vom
                    Verkäufer getragen werden:
                  </p>

                  {/* Mobile: Karten-Layout */}
                  <div className="space-y-3 sm:hidden">
                    <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                      <div className="text-xs font-medium uppercase tracking-wide text-gray-500">Zahlungsabwicklung (Stripe)</div>
                      <div className="mt-1 text-base font-semibold text-gray-900">2.9% + CHF 0.30</div>
                    </div>
                    <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                      <div className="text-xs font-medium uppercase tracking-wide text-gray-500">Auszahlung</div>
                      <div className="mt-1 text-base font-semibold text-gray-900">0.25% + CHF 0.55</div>
                    </div>
                  </div>

                  {/* Desktop: Tabelle */}
                  <div className="hidden overflow-hidden rounded-lg border border-gray-200 sm:block">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 md:px-6">
                            Gebühr
                          </th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 md:px-6">
                            Betrag
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 bg-white">
                        <tr>
                          <td className="px-4 py-3 text-sm text-gray-700 md:px-6 md:py-4">
                            Zahlungsabwicklung (Stripe)
                          </td>
                          <td className="px-4 py-3 text-sm font-medium text-gray-900 md:px-6 md:py-4">
                            2.9% + CHF 0.30
                          </td>
                        </tr>
                        <tr>
                          <td className="px-4 py-3 text-sm text-gray-700 md:px-6 md:py-4">Auszahlung</td>
                          <td className="px-4 py-3 text-sm font-medium text-gray-900 md:px-6 md:py-4">
                            0.25% + CHF 0.55
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <div className="mt-3 rounded-lg border border-green-200 bg-green-50 p-3 sm:mt-4 sm:p-4">
                    <p className="text-xs text-green-700 sm:text-sm">
                      <strong>Für Käufer:</strong> Der Zahlungsschutz ist kostenlos. Sie zahlen nur
                      den Artikelpreis und die Versandkosten.
                    </p>
                  </div>
                </section>

                {/* Booster */}
                <section>
                  <h2 className="mb-3 text-xl font-bold text-gray-900 sm:mb-4 sm:text-2xl">4. Optionale Booster</h2>

                  <p className="mb-3 text-sm sm:mb-4 sm:text-base">
                    Verkäufer können ihre Angebote mit kostenpflichtigen Boostern hervorheben und so die Sichtbarkeit erhöhen:
                  </p>

                  {/* Mobile: Karten-Layout */}
                  <div className="space-y-3 sm:hidden">
                    {/* Boost */}
                    <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-500 text-xs text-white">⚡</span>
                          <span className="font-medium text-gray-900">Boost</span>
                        </div>
                        <span className="text-sm font-semibold text-blue-600">CHF 5.00</span>
                      </div>
                      <p className="mt-2 text-xs text-gray-600">Bessere Platzierung in Suchergebnissen und erhöhte Sichtbarkeit</p>
                    </div>
                    {/* Turbo-Boost */}
                    <div className="rounded-lg border border-violet-200 bg-violet-50 p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-violet-500 text-xs text-white">🚀</span>
                          <span className="font-medium text-gray-900">Turbo-Boost</span>
                        </div>
                        <span className="text-sm font-semibold text-violet-600">CHF 10.00</span>
                      </div>
                      <p className="mt-2 text-xs text-gray-600">Sehr prominente Platzierung + alle Boost-Vorteile inklusive</p>
                    </div>
                    {/* Super-Boost */}
                    <div className="rounded-lg border border-orange-200 bg-orange-50 p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-orange-500 text-xs text-white">👑</span>
                          <span className="font-medium text-gray-900">Super-Boost</span>
                        </div>
                        <span className="text-sm font-semibold text-orange-600">CHF 25.00</span>
                      </div>
                      <p className="mt-2 text-xs text-gray-600">Höchste Sichtbarkeit, Top-Position + Startseiten-Präsenz</p>
                    </div>
                  </div>

                  {/* Desktop: Tabelle */}
                  <div className="hidden overflow-x-auto rounded-lg border border-gray-200 sm:block">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 md:px-6">
                            Booster
                          </th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 md:px-6">
                            Preis
                          </th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 md:px-6">
                            Vorteile
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 bg-white">
                        <tr className="bg-blue-50/30">
                          <td className="whitespace-nowrap px-4 py-3 text-sm md:px-6 md:py-4">
                            <div className="flex items-center gap-2">
                              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-500 text-sm text-white">⚡</span>
                              <span className="font-medium text-gray-900">Boost</span>
                            </div>
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-sm font-semibold text-blue-600 md:px-6 md:py-4">CHF 5.00</td>
                          <td className="px-4 py-3 text-sm text-gray-600 md:px-6 md:py-4">
                            <ul className="list-inside list-disc space-y-0.5">
                              <li>Verbesserte Sichtbarkeit</li>
                              <li>Bessere Platzierung in Suchergebnissen</li>
                              <li>Erhöhte Klickrate</li>
                            </ul>
                          </td>
                        </tr>
                        <tr className="bg-violet-50/30">
                          <td className="whitespace-nowrap px-4 py-3 text-sm md:px-6 md:py-4">
                            <div className="flex items-center gap-2">
                              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-violet-500 text-sm text-white">🚀</span>
                              <span className="font-medium text-gray-900">Turbo-Boost</span>
                            </div>
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-sm font-semibold text-violet-600 md:px-6 md:py-4">CHF 10.00</td>
                          <td className="px-4 py-3 text-sm text-gray-600 md:px-6 md:py-4">
                            <ul className="list-inside list-disc space-y-0.5">
                              <li>Alle Boost-Vorteile inklusive</li>
                              <li>Sehr prominente Platzierung in Listen</li>
                              <li>Erhöhte Sichtbarkeit in Suchergebnissen</li>
                            </ul>
                          </td>
                        </tr>
                        <tr className="bg-orange-50/30">
                          <td className="whitespace-nowrap px-4 py-3 text-sm md:px-6 md:py-4">
                            <div className="flex items-center gap-2">
                              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-orange-500 text-sm text-white">👑</span>
                              <span className="font-medium text-gray-900">Super-Boost</span>
                            </div>
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-sm font-semibold text-orange-600 md:px-6 md:py-4">CHF 25.00</td>
                          <td className="px-4 py-3 text-sm text-gray-600 md:px-6 md:py-4">
                            <ul className="list-inside list-disc space-y-0.5">
                              <li>Alle Turbo-Boost-Vorteile inklusive</li>
                              <li>Höchste Sichtbarkeit auf der Plattform</li>
                              <li>Top-Position in Kategorie-Übersichten</li>
                              <li>Erhöhte Sichtbarkeit auf der Startseite</li>
                            </ul>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <p className="mt-3 text-xs text-gray-600 sm:mt-4 sm:text-sm">
                    Booster-Gebühren werden bei Veröffentlichung des Angebots fällig. Alle Preise inkl. MwSt.
                    Booster können jederzeit auf eine höhere Stufe upgegradet werden.
                  </p>
                </section>

                {/* Fälligkeit */}
                <section>
                  <h2 className="mb-3 text-xl font-bold text-gray-900 sm:mb-4 sm:text-2xl">5. Fälligkeit und Zahlung</h2>

                  <h3 className="mb-2 mt-3 text-base font-semibold text-gray-900 sm:mt-4 sm:text-lg">
                    5.1 Zahlungsfrist
                  </h3>
                  <p className="mb-3 text-sm sm:mb-4 sm:text-base">
                    Offene Gebühren werden 14 Tage nach Entstehung zur Zahlung fällig. Die
                    Zahlungsaufforderung wird per E-Mail zugestellt.
                  </p>

                  <h3 className="mb-2 mt-3 text-base font-semibold text-gray-900 sm:mt-4 sm:text-lg">
                    5.2 Zahlungsmethoden
                  </h3>
                  <ul className="mb-3 list-inside list-disc space-y-1 text-sm sm:mb-4 sm:text-base">
                    <li>Kreditkarte (Visa, Mastercard, American Express)</li>
                    <li>TWINT</li>
                    <li>Apple Pay</li>
                    <li>Banküberweisung (mit QR-Code)</li>
                  </ul>

                  <h3 className="mb-2 mt-3 text-base font-semibold text-gray-900 sm:mt-4 sm:text-lg">
                    5.3 Mahnverfahren
                  </h3>
                  <p className="mb-2 text-sm sm:text-base">Bei Nichtzahlung gilt folgendes Mahnverfahren:</p>
                  <ul className="list-inside list-disc space-y-1 text-sm sm:text-base">
                    <li>Nach 30 Tagen: Erste Zahlungserinnerung</li>
                    <li>Nach 44 Tagen: Zweite Erinnerung + CHF 10.00 Mahnspesen</li>
                    <li>Nach 58 Tagen: Kontosperrung</li>
                  </ul>
                </section>

                {/* Rückerstattungen */}
                <section>
                  <h2 className="mb-3 text-xl font-bold text-gray-900 sm:mb-4 sm:text-2xl">6. Rückerstattungen</h2>

                  <h3 className="mb-2 mt-3 text-base font-semibold text-gray-900 sm:mt-4 sm:text-lg">
                    6.1 Erfolgsprovision
                  </h3>
                  <p className="mb-3 text-sm sm:mb-4 sm:text-base">
                    Die Erfolgsprovision wird auf Antrag zurückerstattet, wenn:
                  </p>
                  <ul className="list-inside list-disc space-y-1 text-sm sm:text-base">
                    <li>Der Käufer den Kaufpreis nicht bezahlt hat</li>
                    <li>Die Parteien den Vertrag im gegenseitigen Einvernehmen aufheben</li>
                  </ul>
                  <p className="mt-2 text-xs text-gray-600 sm:text-sm">
                    Der Antrag muss innerhalb von 60 Tagen nach Verkaufsabschluss gestellt werden.
                  </p>

                  <h3 className="mb-2 mt-3 text-base font-semibold text-gray-900 sm:mt-4 sm:text-lg">6.2 Booster</h3>
                  <p className="text-sm sm:text-base">Gebühren für Booster werden grundsätzlich nicht zurückerstattet.</p>
                </section>

                {/* Kontakt */}
                <section className="border-t border-gray-200 pt-4 sm:pt-6">
                  <h2 className="mb-3 text-xl font-bold text-gray-900 sm:mb-4 sm:text-2xl">Fragen?</h2>
                  <p className="text-sm sm:text-base">
                    Bei Fragen zu den Gebühren kontaktieren Sie uns unter:{' '}
                    <a
                      href="mailto:support@helvenda.ch"
                      className="text-primary-600 hover:underline"
                    >
                      support@helvenda.ch
                    </a>
                  </p>
                </section>

                <div className="mt-6 border-t border-gray-200 pt-4 sm:mt-8 sm:pt-6">
                  <p className="text-xs text-gray-600 sm:text-sm">
                    <strong>Gebührenreglement gültig seit 18.01.2026</strong>
                  </p>
                </div>
              </div>
            </div>
          </LegalPageWrapper>
        </div>
      </main>
      <Footer />
    </>
  )
}
