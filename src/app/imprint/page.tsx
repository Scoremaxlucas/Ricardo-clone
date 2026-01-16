// Server Component - kein 'use client' nötig für statische Seiten

import { Footer } from '@/components/layout/Footer'
import { Header } from '@/components/layout/Header'

export default function ImprintPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50">
        <div className="mx-auto max-w-4xl px-4 py-8 sm:py-12">
          <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm sm:p-6 md:p-8 lg:p-12">
            <h1 className="mb-6 text-2xl font-bold text-gray-900 sm:mb-8 sm:text-3xl">Impressum</h1>

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
                  <h2 className="mb-3 text-lg font-semibold text-gray-900 sm:mb-4 sm:text-xl">Kontakt</h2>
                  <p className="text-sm text-gray-700 sm:text-base">
                    E-Mail:{' '}
                    <a href="mailto:support@helvenda.ch" className="text-teal-600 hover:underline">
                      support@helvenda.ch
                    </a>
                  </p>
                  <p className="mt-2 text-sm text-gray-700 sm:text-base">
                    Für Fragen oder Anregungen können Sie uns jederzeit per E-Mail erreichen.
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
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
