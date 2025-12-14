// Server Component - kein 'use client' nötig für statische Seiten

import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'

export default function ImprintPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50">
        <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="rounded-lg border border-gray-200 bg-white p-8 shadow-sm md:p-12">
            <h1 className="mb-8 text-3xl font-bold text-gray-900">Impressum</h1>

            <div className="prose prose-lg max-w-none">
              <div className="space-y-6 text-gray-700">
                <div>
                  <h2 className="mb-4 text-xl font-semibold text-gray-900">
                    Angaben gemäß Art. 8 Abs. 1 des Schweizerischen Datenschutzgesetzes (DSG)
                  </h2>

                  <div className="space-y-4">
                    <div>
                      <p className="mb-2 font-semibold text-gray-900">Betreiber der Website:</p>
                      <p className="text-gray-700">
                        Die Seite helvenda.ch gehört und wird betrieben durch die
                        <br />
                        <strong>Score-Max-GmbH</strong>
                        <br />
                        in der Hauswiese 2<br />
                        CH-Zollikerberg
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-6 border-t border-gray-200 pt-6">
                  <h2 className="mb-4 text-xl font-semibold text-gray-900">Kontakt</h2>
                  <p className="text-gray-700">
                    Für Fragen oder Anregungen können Sie uns über die Kontaktmöglichkeiten auf
                    unserer Website erreichen.
                  </p>
                </div>

                <div className="mt-6 border-t border-gray-200 pt-6">
                  <h2 className="mb-4 text-xl font-semibold text-gray-900">Haftungsausschluss</h2>
                  <p className="mb-4 text-gray-700">
                    Der Inhalt dieser Website wurde mit größter Sorgfalt erstellt. Für die
                    Richtigkeit, Vollständigkeit und Aktualität der Inhalte können wir jedoch keine
                    Gewähr übernehmen.
                  </p>
                  <p className="text-gray-700">
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
