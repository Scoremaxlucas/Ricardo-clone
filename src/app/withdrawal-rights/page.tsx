import { Footer } from '@/components/layout/Footer'
import { Header } from '@/components/layout/Header'
import { LegalPageWrapper } from '@/components/legal/LegalPageWrapper'

export const metadata = {
  title: 'Widerrufsbelehrung | Helvenda',
  description: 'Informationen zum Widerrufsrecht für Verbraucher bei Käufen auf Helvenda',
}

export default function WithdrawalRightsPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50">
        <div className="mx-auto max-w-4xl px-4 py-8 sm:py-12">
          <LegalPageWrapper titleKey="withdrawalRights" validSince="09.05.2026">

            <div className="prose prose-sm max-w-none sm:prose-base lg:prose-lg">
              <div className="space-y-6 text-gray-700 sm:space-y-8">
                
                {/* Einleitung */}
                <section>
                  <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 sm:p-5">
                    <h3 className="mb-2 text-base font-semibold text-blue-800 sm:text-lg">
                      Wichtiger Hinweis
                    </h3>
                    <p className="text-sm text-blue-700 sm:text-base">
                      Helvenda ist ein Marktplatz, auf dem private und gewerbliche Verkäufer ihre Produkte 
                      anbieten. Helvenda selbst ist <strong>nicht</strong> Verkäufer der Produkte. Das 
                      Widerrufsrecht richtet sich daher nach dem jeweiligen Verkäufer und dem anwendbaren Recht.
                    </p>
                  </div>
                </section>

                {/* Schweizer Recht */}
                <section>
                  <h2 className="mb-3 text-xl font-bold text-gray-900 sm:mb-4 sm:text-2xl">
                    1. Rechtslage in der Schweiz
                  </h2>
                  <p className="mb-3 text-sm sm:mb-4 sm:text-base">
                    In der Schweiz besteht bei Online-Käufen grundsätzlich <strong>kein gesetzliches 
                    Widerrufsrecht</strong>. Anders als in der EU gibt es in der Schweiz keine gesetzliche 
                    14-tägige Widerrufsfrist für Fernabsatzverträge.
                  </p>
                  <p className="mb-3 text-sm sm:mb-4 sm:text-base">
                    Ein Rückgaberecht besteht nur, wenn:
                  </p>
                  <ul className="mb-3 list-inside list-disc space-y-1 text-sm sm:mb-4 sm:text-base">
                    <li>Der Verkäufer dies ausdrücklich anbietet (z.B. Zufriedenheitsgarantie)</li>
                    <li>Die Ware mangelhaft ist (Gewährleistungsrecht)</li>
                    <li>Die Ware nicht der Beschreibung entspricht</li>
                  </ul>
                </section>

                {/* EU-Recht */}
                <section>
                  <h2 className="mb-3 text-xl font-bold text-gray-900 sm:mb-4 sm:text-2xl">
                    2. Widerrufsrecht für EU-Verbraucher
                  </h2>
                  <p className="mb-3 text-sm sm:mb-4 sm:text-base">
                    Für Käufer mit Wohnsitz in der Europäischen Union kann bei Käufen von 
                    <strong> gewerblichen Verkäufern</strong> das EU-Widerrufsrecht gelten:
                  </p>

                  <div className="mb-4 rounded-lg border border-gray-200 bg-white p-4 sm:p-5">
                    <h3 className="mb-3 text-base font-semibold text-gray-900 sm:text-lg">
                      Widerrufsbelehrung (bei gewerblichen Verkäufern)
                    </h3>
                    
                    <h4 className="mb-2 mt-4 font-semibold text-gray-900">Widerrufsrecht</h4>
                    <p className="mb-3 text-sm sm:text-base">
                      Sie haben das Recht, binnen <strong>vierzehn Tagen</strong> ohne Angabe von 
                      Gründen diesen Vertrag zu widerrufen.
                    </p>
                    <p className="mb-3 text-sm sm:text-base">
                      Die Widerrufsfrist beträgt vierzehn Tage ab dem Tag, an dem Sie oder ein von 
                      Ihnen benannter Dritter, der nicht der Beförderer ist, die Waren in Besitz 
                      genommen haben bzw. hat.
                    </p>
                    <p className="mb-3 text-sm sm:text-base">
                      Um Ihr Widerrufsrecht auszuüben, müssen Sie den Verkäufer mittels einer 
                      eindeutigen Erklärung (z.B. ein mit der Post versandter Brief oder E-Mail) 
                      über Ihren Entschluss, diesen Vertrag zu widerrufen, informieren.
                    </p>

                    <h4 className="mb-2 mt-4 font-semibold text-gray-900">Folgen des Widerrufs</h4>
                    <p className="mb-3 text-sm sm:text-base">
                      Wenn Sie diesen Vertrag widerrufen, hat der Verkäufer Ihnen alle Zahlungen, 
                      die er von Ihnen erhalten hat, einschliesslich der Lieferkosten (mit Ausnahme 
                      der zusätzlichen Kosten, die sich daraus ergeben, dass Sie eine andere Art 
                      der Lieferung als die von uns angebotene, günstigste Standardlieferung gewählt 
                      haben), unverzüglich und spätestens binnen vierzehn Tagen ab dem Tag 
                      zurückzuzahlen, an dem die Mitteilung über Ihren Widerruf dieses Vertrags 
                      bei ihm eingegangen ist.
                    </p>
                    <p className="text-sm sm:text-base">
                      Der Verkäufer kann die Rückzahlung verweigern, bis er die Waren wieder 
                      zurückerhalten hat oder bis Sie den Nachweis erbracht haben, dass Sie 
                      die Waren zurückgesandt haben.
                    </p>
                  </div>
                </section>

                {/* Ausnahmen */}
                <section>
                  <h2 className="mb-3 text-xl font-bold text-gray-900 sm:mb-4 sm:text-2xl">
                    3. Ausnahmen vom Widerrufsrecht
                  </h2>
                  <p className="mb-3 text-sm sm:mb-4 sm:text-base">
                    Das Widerrufsrecht besteht nicht bei:
                  </p>
                  <ul className="mb-3 list-inside list-disc space-y-2 text-sm sm:mb-4 sm:text-base">
                    <li>Waren, die nach Kundenspezifikation angefertigt werden oder eindeutig auf 
                        persönliche Bedürfnisse zugeschnitten sind</li>
                    <li>Waren, die schnell verderben können oder deren Verfallsdatum schnell 
                        überschritten würde</li>
                    <li>Versiegelten Waren, die aus Gründen des Gesundheitsschutzes oder der 
                        Hygiene nicht zur Rückgabe geeignet sind, wenn ihre Versiegelung nach 
                        der Lieferung entfernt wurde</li>
                    <li>Versiegelten Audio- oder Videoaufzeichnungen oder versiegelter Software, 
                        wenn die Versiegelung entfernt wurde</li>
                    <li>Zeitungen, Zeitschriften oder Illustrierten</li>
                    <li>Käufen von <strong>Privatpersonen</strong> (kein Verbraucherrecht anwendbar)</li>
                  </ul>
                </section>

                {/* Private Verkäufer */}
                <section>
                  <h2 className="mb-3 text-xl font-bold text-gray-900 sm:mb-4 sm:text-2xl">
                    4. Käufe von Privatpersonen
                  </h2>
                  <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 sm:p-5">
                    <p className="text-sm text-amber-800 sm:text-base">
                      <strong>Wichtig:</strong> Bei Käufen von privaten Verkäufern (keine Unternehmer) 
                      besteht <strong>kein gesetzliches Widerrufsrecht</strong> – weder nach Schweizer 
                      noch nach EU-Recht. Ein Rückgaberecht besteht nur bei Mängeln oder wenn der 
                      Verkäufer dies freiwillig einräumt.
                    </p>
                  </div>
                </section>

                {/* Helvenda Zahlungsschutz */}
                <section>
                  <h2 className="mb-3 text-xl font-bold text-gray-900 sm:mb-4 sm:text-2xl">
                    5. Helvenda Zahlungsschutz
                  </h2>
                  <p className="mb-3 text-sm sm:mb-4 sm:text-base">
                    Bei Käufen mit dem Helvenda Zahlungsschutz wird Ihr Geld treuhänderisch 
                    verwaltet, bis Sie den Erhalt und den ordnungsgemässen Zustand der Ware 
                    bestätigen. Dies bietet zusätzliche Sicherheit:
                  </p>
                  <ul className="mb-3 list-inside list-disc space-y-1 text-sm sm:mb-4 sm:text-base">
                    <li>Sie können innerhalb von 48 Stunden nach Erhalt Probleme melden</li>
                    <li>Bei berechtigten Reklamationen erhalten Sie Ihr Geld zurück</li>
                    <li>Streitfälle werden von Helvenda vermittelt</li>
                  </ul>
                  <p className="text-sm sm:text-base">
                    Weitere Informationen finden Sie auf unserer{' '}
                    <a href="/payment-protection" className="text-primary-600 hover:underline">
                      Seite zum Zahlungsschutz
                    </a>.
                  </p>
                </section>

                {/* Muster-Widerrufsformular */}
                <section>
                  <h2 className="mb-3 text-xl font-bold text-gray-900 sm:mb-4 sm:text-2xl">
                    6. Muster-Widerrufsformular
                  </h2>
                  <p className="mb-3 text-sm sm:mb-4 sm:text-base">
                    Wenn Sie den Vertrag widerrufen wollen, können Sie folgendes Formular verwenden 
                    (nur bei gewerblichen Verkäufern und EU-Wohnsitz):
                  </p>
                  <div className="rounded-lg border border-gray-300 bg-gray-50 p-4 sm:p-5">
                    <p className="mb-3 text-sm italic text-gray-600 sm:text-base">
                      An [Name des Verkäufers einfügen]<br />
                      [Adresse des Verkäufers einfügen]<br />
                      [E-Mail des Verkäufers einfügen]
                    </p>
                    <p className="mb-3 text-sm sm:text-base">
                      Hiermit widerrufe(n) ich/wir (*) den von mir/uns (*) abgeschlossenen Vertrag 
                      über den Kauf der folgenden Waren (*) / die Erbringung der folgenden 
                      Dienstleistung (*)
                    </p>
                    <ul className="mb-3 list-inside list-disc space-y-1 text-sm sm:text-base">
                      <li>Bestellt am (*) / erhalten am (*)</li>
                      <li>Name des/der Verbraucher(s)</li>
                      <li>Anschrift des/der Verbraucher(s)</li>
                      <li>Datum und Unterschrift (nur bei Mitteilung auf Papier)</li>
                    </ul>
                    <p className="text-xs text-gray-500 sm:text-sm">
                      (*) Unzutreffendes streichen.
                    </p>
                  </div>
                </section>

                {/* Kontakt */}
                <section className="border-t border-gray-200 pt-4 sm:pt-6">
                  <h2 className="mb-3 text-xl font-bold text-gray-900 sm:mb-4 sm:text-2xl">
                    Fragen?
                  </h2>
                  <p className="text-sm sm:text-base">
                    Bei Fragen zum Widerrufsrecht kontaktieren Sie uns unter:{' '}
                    <a href="mailto:support@helvenda.ch" className="text-primary-600 hover:underline">
                      support@helvenda.ch
                    </a>
                  </p>
                </section>

                <div className="mt-6 border-t border-gray-200 pt-4 sm:mt-8 sm:pt-6">
                  <p className="text-xs text-gray-600 sm:text-sm">
                    <strong>Stand: 09.05.2026</strong>
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
