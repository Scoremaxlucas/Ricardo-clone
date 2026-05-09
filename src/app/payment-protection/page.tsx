import { Footer } from '@/components/layout/Footer'
import { Header } from '@/components/layout/Header'
import { CheckCircle, Shield, Clock, AlertTriangle, CreditCard, Banknote, HelpCircle } from 'lucide-react'

export const metadata = {
  title: 'Zahlungsschutz | Helvenda',
  description: 'So funktioniert der Helvenda Zahlungsschutz – Sicher kaufen und verkaufen mit Käuferschutz',
}

export default function PaymentProtectionPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50">
        <div className="mx-auto max-w-4xl px-4 py-8 sm:py-12">
          
          {/* Hero */}
          <div className="mb-8 text-center sm:mb-12">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary-100 sm:h-20 sm:w-20">
              <Shield className="h-8 w-8 text-primary-600 sm:h-10 sm:w-10" />
            </div>
            <h1 className="mb-3 text-2xl font-bold text-gray-900 sm:mb-4 sm:text-4xl">
              Helvenda Zahlungsschutz
            </h1>
            <p className="mx-auto max-w-2xl text-base text-gray-600 sm:text-lg">
              Kaufen und verkaufen Sie mit voller Sicherheit. Ihr Geld ist geschützt, 
              bis die Ware sicher angekommen ist.
            </p>
          </div>

          {/* Kostenlos-Banner */}
          <div className="mb-8 rounded-xl border-2 border-green-300 bg-green-50 p-4 text-center sm:mb-12 sm:p-6">
            <p className="text-lg font-bold text-green-800 sm:text-xl">
              Für Käufer: 100% kostenlos
            </p>
            <p className="mt-1 text-sm text-green-700 sm:text-base">
              Keine zusätzlichen Gebühren für den Zahlungsschutz
            </p>
          </div>

          {/* So funktioniert's */}
          <section className="mb-10 sm:mb-14">
            <h2 className="mb-6 text-center text-xl font-bold text-gray-900 sm:mb-8 sm:text-2xl">
              So funktioniert der Zahlungsschutz
            </h2>
            
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {/* Step 1 */}
              <div className="rounded-xl border border-gray-200 bg-white p-4 text-center sm:p-6">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-xl font-bold text-blue-600">
                  1
                </div>
                <h3 className="mb-2 font-semibold text-gray-900">Käufer bezahlt</h3>
                <p className="text-sm text-gray-600">
                  Der Käufer bezahlt sicher mit Kreditkarte oder TWINT
                </p>
              </div>

              {/* Step 2 */}
              <div className="rounded-xl border border-gray-200 bg-white p-4 text-center sm:p-6">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-xl font-bold text-blue-600">
                  2
                </div>
                <h3 className="mb-2 font-semibold text-gray-900">Geld wird gesichert</h3>
                <p className="text-sm text-gray-600">
                  Helvenda hält das Geld treuhänderisch bis zur Lieferung
                </p>
              </div>

              {/* Step 3 */}
              <div className="rounded-xl border border-gray-200 bg-white p-4 text-center sm:p-6">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-xl font-bold text-blue-600">
                  3
                </div>
                <h3 className="mb-2 font-semibold text-gray-900">Verkäufer versendet</h3>
                <p className="text-sm text-gray-600">
                  Der Verkäufer versendet die Ware an den Käufer
                </p>
              </div>

              {/* Step 4 */}
              <div className="rounded-xl border border-gray-200 bg-white p-4 text-center sm:p-6">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-xl font-bold text-green-600">
                  4
                </div>
                <h3 className="mb-2 font-semibold text-gray-900">Geld wird freigegeben</h3>
                <p className="text-sm text-gray-600">
                  Nach Bestätigung erhält der Verkäufer sein Geld
                </p>
              </div>
            </div>
          </section>

          {/* Vorteile für Käufer */}
          <section className="mb-10 sm:mb-14">
            <h2 className="mb-6 text-xl font-bold text-gray-900 sm:mb-8 sm:text-2xl">
              Vorteile für Käufer
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex gap-4 rounded-xl border border-gray-200 bg-white p-4 sm:p-5">
                <CheckCircle className="h-6 w-6 flex-shrink-0 text-green-500" />
                <div>
                  <h3 className="font-semibold text-gray-900">Geld-zurück-Garantie</h3>
                  <p className="mt-1 text-sm text-gray-600">
                    Erhalten Sie Ihr Geld zurück, wenn die Ware nicht ankommt oder 
                    nicht der Beschreibung entspricht
                  </p>
                </div>
              </div>
              <div className="flex gap-4 rounded-xl border border-gray-200 bg-white p-4 sm:p-5">
                <Shield className="h-6 w-6 flex-shrink-0 text-blue-500" />
                <div>
                  <h3 className="font-semibold text-gray-900">Sichere Zahlung</h3>
                  <p className="mt-1 text-sm text-gray-600">
                    Bezahlen Sie mit Kreditkarte oder TWINT – Ihre Daten sind 
                    sicher verschlüsselt
                  </p>
                </div>
              </div>
              <div className="flex gap-4 rounded-xl border border-gray-200 bg-white p-4 sm:p-5">
                <Clock className="h-6 w-6 flex-shrink-0 text-amber-500" />
                <div>
                  <h3 className="font-semibold text-gray-900">48 Stunden Prüfzeit</h3>
                  <p className="mt-1 text-sm text-gray-600">
                    Nach Erhalt haben Sie 48 Stunden Zeit, die Ware zu prüfen 
                    und Probleme zu melden
                  </p>
                </div>
              </div>
              <div className="flex gap-4 rounded-xl border border-gray-200 bg-white p-4 sm:p-5">
                <HelpCircle className="h-6 w-6 flex-shrink-0 text-purple-500" />
                <div>
                  <h3 className="font-semibold text-gray-900">Streitschlichtung</h3>
                  <p className="mt-1 text-sm text-gray-600">
                    Bei Problemen vermittelt Helvenda zwischen Käufer und Verkäufer
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Vorteile für Verkäufer */}
          <section className="mb-10 sm:mb-14">
            <h2 className="mb-6 text-xl font-bold text-gray-900 sm:mb-8 sm:text-2xl">
              Vorteile für Verkäufer
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex gap-4 rounded-xl border border-gray-200 bg-white p-4 sm:p-5">
                <Banknote className="h-6 w-6 flex-shrink-0 text-green-500" />
                <div>
                  <h3 className="font-semibold text-gray-900">Garantierte Zahlung</h3>
                  <p className="mt-1 text-sm text-gray-600">
                    Das Geld ist bereits bei Helvenda, bevor Sie versenden
                  </p>
                </div>
              </div>
              <div className="flex gap-4 rounded-xl border border-gray-200 bg-white p-4 sm:p-5">
                <CreditCard className="h-6 w-6 flex-shrink-0 text-blue-500" />
                <div>
                  <h3 className="font-semibold text-gray-900">Schnelle Auszahlung</h3>
                  <p className="mt-1 text-sm text-gray-600">
                    Nach Bestätigung durch den Käufer wird das Geld automatisch 
                    auf Ihr Konto überwiesen
                  </p>
                </div>
              </div>
              <div className="flex gap-4 rounded-xl border border-gray-200 bg-white p-4 sm:p-5">
                <Shield className="h-6 w-6 flex-shrink-0 text-primary-500" />
                <div>
                  <h3 className="font-semibold text-gray-900">Mehr Vertrauen</h3>
                  <p className="mt-1 text-sm text-gray-600">
                    Käufer kaufen eher, wenn sie wissen, dass ihr Geld geschützt ist
                  </p>
                </div>
              </div>
              <div className="flex gap-4 rounded-xl border border-gray-200 bg-white p-4 sm:p-5">
                <CheckCircle className="h-6 w-6 flex-shrink-0 text-green-500" />
                <div>
                  <h3 className="font-semibold text-gray-900">Einfache Einrichtung</h3>
                  <p className="mt-1 text-sm text-gray-600">
                    Richten Sie Ihr Auszahlungskonto einmalig ein – danach läuft 
                    alles automatisch
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Problemfall */}
          <section className="mb-10 sm:mb-14">
            <h2 className="mb-6 text-xl font-bold text-gray-900 sm:mb-8 sm:text-2xl">
              Was passiert bei Problemen?
            </h2>
            <div className="space-y-4">
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 sm:p-5">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600" />
                  <div>
                    <h3 className="font-semibold text-amber-800">Ware nicht erhalten</h3>
                    <p className="mt-1 text-sm text-amber-700">
                      Wenn die Ware nicht ankommt, melden Sie dies innerhalb von 14 Tagen. 
                      Wir prüfen den Fall und erstatten Ihnen das Geld zurück.
                    </p>
                  </div>
                </div>
              </div>
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 sm:p-5">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600" />
                  <div>
                    <h3 className="font-semibold text-amber-800">Ware entspricht nicht der Beschreibung</h3>
                    <p className="mt-1 text-sm text-amber-700">
                      Wenn die Ware stark von der Beschreibung abweicht, melden Sie dies 
                      innerhalb von 48 Stunden nach Erhalt. Dokumentieren Sie das Problem 
                      mit Fotos.
                    </p>
                  </div>
                </div>
              </div>
              <div className="rounded-xl border border-gray-200 bg-white p-4 sm:p-5">
                <div className="flex items-start gap-3">
                  <HelpCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-600" />
                  <div>
                    <h3 className="font-semibold text-gray-900">Streitschlichtung</h3>
                    <p className="mt-1 text-sm text-gray-600">
                      Bei Meinungsverschiedenheiten zwischen Käufer und Verkäufer prüft 
                      unser Support-Team den Fall und entscheidet fair. In den meisten 
                      Fällen finden wir eine einvernehmliche Lösung.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Gebühren */}
          <section className="mb-10 sm:mb-14">
            <h2 className="mb-6 text-xl font-bold text-gray-900 sm:mb-8 sm:text-2xl">
              Kosten
            </h2>
            <div className="overflow-hidden rounded-xl border border-gray-200">
              <table className="w-full">
                <tbody>
                  <tr className="border-b border-gray-200 bg-green-50">
                    <td className="px-4 py-3 font-medium text-gray-900 sm:px-6">Für Käufer</td>
                    <td className="px-4 py-3 text-right font-bold text-green-600 sm:px-6">Kostenlos</td>
                  </tr>
                  <tr className="bg-white">
                    <td className="px-4 py-3 font-medium text-gray-900 sm:px-6">Für Verkäufer</td>
                    <td className="px-4 py-3 text-right text-gray-600 sm:px-6">
                      <span className="line-through">Zahlungsgebühren</span>
                      <br />
                      <span className="font-bold text-green-600">Derzeit kostenlos</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-center text-sm text-gray-500">
              Weitere Informationen zu den Gebühren finden Sie auf unserer{' '}
              <a href="/fees" className="text-primary-600 hover:underline">Gebührenseite</a>.
            </p>
          </section>

          {/* FAQ */}
          <section className="mb-10 sm:mb-14">
            <h2 className="mb-6 text-xl font-bold text-gray-900 sm:mb-8 sm:text-2xl">
              Häufige Fragen
            </h2>
            <div className="space-y-4">
              <details className="group rounded-xl border border-gray-200 bg-white">
                <summary className="flex cursor-pointer items-center justify-between p-4 font-medium text-gray-900 sm:p-5">
                  Ist der Zahlungsschutz bei jedem Kauf verfügbar?
                  <span className="ml-2 text-gray-400 transition-transform group-open:rotate-180">▼</span>
                </summary>
                <div className="border-t border-gray-200 px-4 pb-4 pt-3 text-sm text-gray-600 sm:px-5 sm:pb-5">
                  Der Zahlungsschutz ist bei allen Artikeln verfügbar, bei denen der Verkäufer 
                  Online-Zahlung aktiviert hat. Sie erkennen dies am Zahlungsschutz-Symbol 
                  in der Artikelanzeige.
                </div>
              </details>
              <details className="group rounded-xl border border-gray-200 bg-white">
                <summary className="flex cursor-pointer items-center justify-between p-4 font-medium text-gray-900 sm:p-5">
                  Wie lange dauert die Auszahlung an den Verkäufer?
                  <span className="ml-2 text-gray-400 transition-transform group-open:rotate-180">▼</span>
                </summary>
                <div className="border-t border-gray-200 px-4 pb-4 pt-3 text-sm text-gray-600 sm:px-5 sm:pb-5">
                  Nach Bestätigung durch den Käufer wird das Geld innerhalb von 2-3 Werktagen 
                  auf das hinterlegte Bankkonto des Verkäufers überwiesen.
                </div>
              </details>
              <details className="group rounded-xl border border-gray-200 bg-white">
                <summary className="flex cursor-pointer items-center justify-between p-4 font-medium text-gray-900 sm:p-5">
                  Was passiert, wenn ich als Käufer nichts bestätige?
                  <span className="ml-2 text-gray-400 transition-transform group-open:rotate-180">▼</span>
                </summary>
                <div className="border-t border-gray-200 px-4 pb-4 pt-3 text-sm text-gray-600 sm:px-5 sm:pb-5">
                  Wenn Sie die Ware erhalten haben, aber nichts melden, wird das Geld nach 
                  Ablauf der Prüfzeit automatisch an den Verkäufer freigegeben. Bei 
                  Tracking-Sendungen erfolgt dies basierend auf dem Lieferstatus.
                </div>
              </details>
              <details className="group rounded-xl border border-gray-200 bg-white">
                <summary className="flex cursor-pointer items-center justify-between p-4 font-medium text-gray-900 sm:p-5">
                  Welche Zahlungsmethoden sind verfügbar?
                  <span className="ml-2 text-gray-400 transition-transform group-open:rotate-180">▼</span>
                </summary>
                <div className="border-t border-gray-200 px-4 pb-4 pt-3 text-sm text-gray-600 sm:px-5 sm:pb-5">
                  Sie können mit Kreditkarte (Visa, Mastercard, American Express), TWINT 
                  oder Apple Pay bezahlen. Alle Zahlungen werden über unseren Partner 
                  Stripe sicher verarbeitet.
                </div>
              </details>
            </div>
          </section>

          {/* CTA */}
          <section className="text-center">
            <div className="rounded-xl border border-gray-200 bg-white p-6 sm:p-8">
              <h2 className="mb-3 text-xl font-bold text-gray-900 sm:text-2xl">
                Noch Fragen?
              </h2>
              <p className="mb-4 text-gray-600">
                Unser Support-Team hilft Ihnen gerne weiter.
              </p>
              <a
                href="mailto:support@helvenda.ch"
                className="inline-flex items-center justify-center rounded-lg bg-primary-600 px-6 py-3 font-medium text-white transition-colors hover:bg-primary-700"
              >
                Support kontaktieren
              </a>
            </div>
          </section>

        </div>
      </main>
      <Footer />
    </>
  )
}
