// Server Component - kein 'use client' nötig für statische Seiten

import { Footer } from '@/components/layout/Footer'
import { Header } from '@/components/layout/Header'

export default function FeesPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50">
        <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="rounded-lg border border-gray-200 bg-white p-8 shadow-sm md:p-12">
            <h1 className="mb-2 text-3xl font-bold text-gray-900">Gebührenreglement</h1>
            <p className="mb-8 text-gray-600">Gültig seit 17.01.2025</p>

            <div className="prose prose-lg max-w-none">
              <div className="space-y-8 text-gray-700">
                {/* Einleitung */}
                <section>
                  <p className="text-lg">
                    Das vorliegende Gebührenreglement ist integraler Bestandteil der Allgemeinen
                    Geschäftsbedingungen (AGB) von Helvenda und regelt die Gebühren für die Nutzung
                    des Marktplatzes.
                  </p>
                </section>

                {/* Kostenlose Nutzung */}
                <section>
                  <h2 className="mb-4 text-2xl font-bold text-gray-900">1. Grundsätze</h2>

                  <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                    <h3 className="mb-2 font-semibold text-green-800">
                      Kostenlos Einstellen und Kaufen
                    </h3>
                    <ul className="space-y-1 text-green-700">
                      <li>✓ Angebote einstellen ist kostenlos</li>
                      <li>✓ Kaufen ist kostenlos</li>
                      <li>✓ Mitgliedschaft ist kostenlos</li>
                    </ul>
                  </div>

                  <p className="mt-4">
                    Helvenda erhebt Gebühren nur bei erfolgreichem Verkauf (Erfolgsprovision) sowie
                    für optionale Zusatzleistungen (Booster).
                  </p>
                </section>

                {/* Erfolgsprovision */}
                <section>
                  <h2 className="mb-4 text-2xl font-bold text-gray-900">2. Erfolgsprovision</h2>

                  <p className="mb-4">
                    Bei einem erfolgreichen Verkauf wird eine Erfolgsprovision fällig. Diese wird
                    vom Verkäufer bezahlt.
                  </p>

                  <div className="overflow-hidden rounded-lg border border-gray-200">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                            Gebühr
                          </th>
                          <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                            Betrag
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 bg-white">
                        <tr>
                          <td className="px-6 py-4 text-sm text-gray-700">Erfolgsprovision</td>
                          <td className="px-6 py-4 text-sm font-medium text-gray-900">
                            5% des Verkaufspreises
                          </td>
                        </tr>
                        <tr>
                          <td className="px-6 py-4 text-sm text-gray-700">Höchstbetrag</td>
                          <td className="px-6 py-4 text-sm font-medium text-gray-900">
                            CHF 150.00
                          </td>
                        </tr>
                        <tr>
                          <td className="px-6 py-4 text-sm text-gray-700">
                            MwSt auf Provision (8.1%)
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-700">
                            wird zusätzlich berechnet
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-4">
                    <h4 className="mb-2 font-semibold text-blue-800">Beispiel</h4>
                    <p className="text-sm text-blue-700">
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
                  <h2 className="mb-4 text-2xl font-bold text-gray-900">3. Zahlungsgebühren</h2>

                  <p className="mb-4">
                    Bei Nutzung des Zahlungsschutzes fallen zusätzlich Zahlungsgebühren an, die vom
                    Verkäufer getragen werden:
                  </p>

                  <div className="overflow-hidden rounded-lg border border-gray-200">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                            Gebühr
                          </th>
                          <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                            Betrag
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 bg-white">
                        <tr>
                          <td className="px-6 py-4 text-sm text-gray-700">
                            Zahlungsabwicklung (Stripe)
                          </td>
                          <td className="px-6 py-4 text-sm font-medium text-gray-900">
                            2.9% + CHF 0.30
                          </td>
                        </tr>
                        <tr>
                          <td className="px-6 py-4 text-sm text-gray-700">Auszahlung</td>
                          <td className="px-6 py-4 text-sm font-medium text-gray-900">
                            0.25% + CHF 0.55
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <div className="mt-4 rounded-lg border border-green-200 bg-green-50 p-4">
                    <p className="text-sm text-green-700">
                      <strong>Für Käufer:</strong> Der Zahlungsschutz ist kostenlos. Sie zahlen nur
                      den Artikelpreis und die Versandkosten.
                    </p>
                  </div>
                </section>

                {/* Booster */}
                <section>
                  <h2 className="mb-4 text-2xl font-bold text-gray-900">4. Optionale Booster</h2>

                  <p className="mb-4">
                    Verkäufer können ihre Angebote mit kostenpflichtigen Boostern hervorheben:
                  </p>

                  <div className="overflow-hidden rounded-lg border border-gray-200">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                            Booster
                          </th>
                          <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                            Preis
                          </th>
                          <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                            Beschreibung
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 bg-white">
                        <tr>
                          <td className="px-6 py-4 text-sm font-medium text-gray-900">
                            Highlight
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-700">CHF 2.90</td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            Farblich hervorgehobener Rahmen
                          </td>
                        </tr>
                        <tr>
                          <td className="px-6 py-4 text-sm font-medium text-gray-900">
                            Top-Platzierung
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-700">CHF 4.90</td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            Angebot erscheint weiter oben in Suchergebnissen
                          </td>
                        </tr>
                        <tr>
                          <td className="px-6 py-4 text-sm font-medium text-gray-900">
                            Homepage-Feature
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-700">CHF 9.90</td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            Angebot auf der Startseite anzeigen
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <p className="mt-4 text-sm text-gray-600">
                    Booster-Gebühren werden sofort bei Aktivierung fällig und sind nicht
                    erstattungsfähig.
                  </p>
                </section>

                {/* Fälligkeit */}
                <section>
                  <h2 className="mb-4 text-2xl font-bold text-gray-900">5. Fälligkeit und Zahlung</h2>

                  <h3 className="mb-2 mt-4 text-lg font-semibold text-gray-900">
                    5.1 Zahlungsfrist
                  </h3>
                  <p className="mb-4">
                    Offene Gebühren werden 14 Tage nach Entstehung zur Zahlung fällig. Die
                    Zahlungsaufforderung wird per E-Mail zugestellt.
                  </p>

                  <h3 className="mb-2 mt-4 text-lg font-semibold text-gray-900">
                    5.2 Zahlungsmethoden
                  </h3>
                  <ul className="mb-4 list-inside list-disc space-y-1">
                    <li>Kreditkarte (Visa, Mastercard, American Express)</li>
                    <li>TWINT</li>
                    <li>Apple Pay</li>
                    <li>Banküberweisung (mit QR-Code)</li>
                  </ul>

                  <h3 className="mb-2 mt-4 text-lg font-semibold text-gray-900">
                    5.3 Mahnverfahren
                  </h3>
                  <p className="mb-2">Bei Nichtzahlung gilt folgendes Mahnverfahren:</p>
                  <ul className="list-inside list-disc space-y-1">
                    <li>Nach 30 Tagen: Erste Zahlungserinnerung</li>
                    <li>Nach 44 Tagen: Zweite Erinnerung + CHF 10.00 Mahnspesen</li>
                    <li>Nach 58 Tagen: Kontosperrung</li>
                  </ul>
                </section>

                {/* Rückerstattungen */}
                <section>
                  <h2 className="mb-4 text-2xl font-bold text-gray-900">6. Rückerstattungen</h2>

                  <h3 className="mb-2 mt-4 text-lg font-semibold text-gray-900">
                    6.1 Erfolgsprovision
                  </h3>
                  <p className="mb-4">
                    Die Erfolgsprovision wird auf Antrag zurückerstattet, wenn:
                  </p>
                  <ul className="list-inside list-disc space-y-1">
                    <li>Der Käufer den Kaufpreis nicht bezahlt hat</li>
                    <li>Die Parteien den Vertrag im gegenseitigen Einvernehmen aufheben</li>
                  </ul>
                  <p className="mt-2 text-sm text-gray-600">
                    Der Antrag muss innerhalb von 60 Tagen nach Verkaufsabschluss gestellt werden.
                  </p>

                  <h3 className="mb-2 mt-4 text-lg font-semibold text-gray-900">6.2 Booster</h3>
                  <p>Gebühren für Booster werden grundsätzlich nicht zurückerstattet.</p>
                </section>

                {/* Kontakt */}
                <section className="border-t border-gray-200 pt-6">
                  <h2 className="mb-4 text-2xl font-bold text-gray-900">Fragen?</h2>
                  <p>
                    Bei Fragen zu den Gebühren kontaktieren Sie uns unter:{' '}
                    <a
                      href="mailto:support@helvenda.ch"
                      className="text-primary-600 hover:underline"
                    >
                      support@helvenda.ch
                    </a>
                  </p>
                </section>

                <div className="mt-8 border-t border-gray-200 pt-6">
                  <p className="text-sm text-gray-600">
                    <strong>Gebührenreglement gültig seit 17.01.2025</strong>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
