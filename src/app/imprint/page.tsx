import { Footer } from '@/components/layout/Footer'
import { Header } from '@/components/layout/Header'
import { LegalPageWrapper } from '@/components/legal/LegalPageWrapper'

export default function ImprintPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50">
        <div className="mx-auto max-w-4xl px-4 py-8 sm:py-12">
          <LegalPageWrapper titleKey="imprint">

            <div className="prose prose-sm max-w-none sm:prose-base lg:prose-lg">
              <div className="space-y-4 text-gray-700 sm:space-y-6">
                <div>
                  <h2 className="mb-3 text-lg font-semibold text-gray-900 sm:mb-4 sm:text-xl">
                    Angaben gemäß Art. 8 Abs. 1 des Schweizerischen Datenschutzgesetzes (DSG)
                  </h2>

                  <div className="space-y-3 sm:space-y-4">
                    <div>
                      <p className="mb-1 text-sm font-semibold text-gray-900 sm:mb-2 sm:text-base">Betreiber der Website:</p>
                      <p className="text-sm text-gray-700 sm:text-base">
                        Die Seite helvenda.ch gehört und wird betrieben durch die
                        <br />
                        <strong>Score-Max GmbH</strong>
                        <br />
                        In der Hauswiese 2<br />
                        8125 Zollikerberg
                        <br />
                        Schweiz
                      </p>
                    </div>

                    <div>
                      <p className="mb-1 text-sm font-semibold text-gray-900 sm:mb-2 sm:text-base">Handelsregister:</p>
                      <p className="text-sm text-gray-700 sm:text-base">
                        Eingetragen im Handelsregister des Kantons Zürich
                        <br />
                        Handelsregister-Nr.: CH-020.4.087.913-9
                      </p>
                    </div>

                    <div>
                      <p className="mb-1 text-sm font-semibold text-gray-900 sm:mb-2 sm:text-base">
                        Unternehmens-Identifikationsnummer (UID):
                      </p>
                      <p className="text-sm text-gray-700 sm:text-base">CHE-241.917.894</p>
                    </div>

                    <div>
                      <p className="mb-1 text-sm font-semibold text-gray-900 sm:mb-2 sm:text-base">Rechtsform:</p>
                      <p className="text-sm text-gray-700 sm:text-base">
                        Gesellschaft mit beschränkter Haftung (GmbH)
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-4 border-t border-gray-200 pt-4 sm:mt-6 sm:pt-6">
                  <h2 className="mb-3 text-lg font-semibold text-gray-900 sm:mb-4 sm:text-xl">Vertretungsberechtigte Person</h2>
                  <p className="text-sm text-gray-700 sm:text-base">
                    Lucas Rodrigues, Geschäftsführer
                  </p>
                </div>

                <div className="mt-4 border-t border-gray-200 pt-4 sm:mt-6 sm:pt-6">
                  <h2 className="mb-3 text-lg font-semibold text-gray-900 sm:mb-4 sm:text-xl">Kontakt</h2>
                  <div className="space-y-2 text-sm text-gray-700 sm:text-base">
                    <p>
                      Telefon:{' '}
                      <a href="tel:+41445082890" className="text-teal-600 hover:underline">
                        +41 44 508 28 90
                      </a>
                    </p>
                    <p>
                      E-Mail:{' '}
                      <a href="mailto:support@helvenda.ch" className="text-teal-600 hover:underline">
                        support@helvenda.ch
                      </a>
                    </p>
                  </div>
                  <p className="mt-3 text-sm text-gray-700 sm:text-base">
                    Für Fragen oder Anregungen können Sie uns jederzeit per E-Mail oder Telefon erreichen.
                  </p>
                </div>

                <div className="mt-4 border-t border-gray-200 pt-4 sm:mt-6 sm:pt-6">
                  <h2 className="mb-3 text-lg font-semibold text-gray-900 sm:mb-4 sm:text-xl">Haftungsausschluss</h2>
                  <p className="mb-3 text-sm text-gray-700 sm:mb-4 sm:text-base">
                    Der Inhalt dieser Website wurde mit größter Sorgfalt erstellt. Für die
                    Richtigkeit, Vollständigkeit und Aktualität der Inhalte können wir jedoch keine
                    Gewähr übernehmen.
                  </p>
                  <p className="text-sm text-gray-700 sm:text-base">
                    Als Diensteanbieter sind wir gemäß Art. 8 Abs. 1 DSG für eigene Inhalte auf
                    diesen Seiten nach den allgemeinen Gesetzen verantwortlich.
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
