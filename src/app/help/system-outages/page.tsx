'use client'

import { Footer } from '@/components/layout/Footer'
import { Header } from '@/components/layout/Header'
import { useLanguage } from '@/contexts/LanguageContext'
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle,
  Clock,
  ExternalLink,
  HelpCircle,
  Info,
  Mail,
  MapPin,
  Scale,
  Timer,
} from 'lucide-react'
import Link from 'next/link'

export default function SystemOutagesPage() {
  const { t } = useLanguage()

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <Header />

      <main className="flex-1">
        <div className="mx-auto max-w-4xl px-4 py-8 sm:py-12">
          {/* Back Button */}
          <Link
            href="/help"
            className="mb-6 inline-flex items-center text-sm text-primary-600 hover:text-primary-700"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Zurück zum Hilfe-Center
          </Link>

          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">
              Grundsätze bei Systemausfällen
            </h1>
            <p className="mt-4 text-lg leading-relaxed text-gray-600">
              Wir arbeiten mit der grösstmöglichen Sorgfalt und sind bemüht, die Funktionalität von
              Helvenda zu gewährleisten. Dennoch können Systemausfälle leider nie vollständig
              ausgeschlossen werden. Im Falle einer Störung gelten die unten beschriebenen
              Ausfallgrundsätze.
            </p>
          </div>

          {/* Content Sections */}
          <div className="space-y-8">
            {/* Section 1: Definition */}
            <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100">
                  <HelpCircle className="h-5 w-5 text-amber-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Wann liegt ein Systemausfall vor?</h2>
              </div>
              <div className="space-y-4 text-gray-700">
                <p>
                  Ein Systemausfall liegt vor, wenn aufgrund einer unvorhergesehenen Störung des
                  Systems das Suchen, Bieten und Kaufen auf Helvenda nicht mehr möglich oder massiv
                  eingeschränkt ist.
                </p>
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                  <div className="flex gap-3">
                    <Info className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600" />
                    <p className="text-sm text-amber-800">
                      Gebührengutschriften oder Angebotsverlängerungen werden jeweils nur für einen
                      Systemausfall gewährt. Dabei liegt es im Ermessen von Helvenda, ob zwei
                      Systemausfälle, die kurz nacheinander vorkommen, als ein Ausfall gewertet
                      werden.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Section 2: Offer Times */}
            <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                  <Clock className="h-5 w-5 text-blue-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">
                  Was passiert während des Systemausfalls mit den Angebotszeiten?
                </h2>
              </div>

              <p className="mb-6 text-gray-700">Endende Angebote werden wie folgt verlängert:</p>

              <div className="space-y-4">
                {/* Short Outage */}
                <div className="rounded-lg border-2 border-green-200 bg-green-50 p-5">
                  <div className="mb-3 flex items-center gap-2">
                    <Timer className="h-5 w-5 text-green-600" />
                    <h3 className="font-semibold text-green-800">
                      Ausfall von 15 Minuten oder weniger
                    </h3>
                    <span className="rounded-full bg-green-200 px-2 py-0.5 text-xs font-medium text-green-800">
                      Verlängerung um 1 Stunde
                    </span>
                  </div>
                  <p className="text-sm text-green-700">
                    Angebote (Auktionen und Sofortkauf-Angebote), welche in der Zeit des Ausfalls
                    geendet hätten, werden um eine Stunde verlängert. Dies gilt ebenfalls für
                    Angebote, welche bis zu einer Stunde nach dem Ausfall geendet hätten. Alle
                    anderen Angebote laufen zur vom Verkäufer gesetzten Normalzeit aus.
                  </p>
                </div>

                {/* Long Outage */}
                <div className="rounded-lg border-2 border-orange-200 bg-orange-50 p-5">
                  <div className="mb-3 flex items-center gap-2">
                    <Timer className="h-5 w-5 text-orange-600" />
                    <h3 className="font-semibold text-orange-800">Ausfall von über 15 Minuten</h3>
                    <span className="rounded-full bg-orange-200 px-2 py-0.5 text-xs font-medium text-orange-800">
                      Verlängerung um 24 Stunden
                    </span>
                  </div>
                  <p className="text-sm text-orange-700">
                    Angebote (Auktionen und Sofortkauf-Angebote), welche in der Zeit des Ausfalls
                    geendet hätten, werden um 24 Stunden verlängert. Dies gilt ebenfalls für
                    Angebote, welche bis zu einer Stunde nach dem Ausfall geendet hätten. Alle
                    anderen Angebote laufen zur vom Verkäufer gesetzten Normalzeit aus.
                  </p>
                </div>
              </div>

              <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4">
                <div className="flex gap-3">
                  <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-600" />
                  <p className="text-sm font-medium text-red-800">
                    <strong>Wichtig:</strong> Angebote, die vor einem Systemausfall geendet haben
                    oder während des Ausfalls (dies gilt auch für Reaktivierungen) starten, werden
                    nicht verlängert.
                  </p>
                </div>
              </div>
            </section>

            {/* Section 3: Auction Rules */}
            <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-100">
                  <Scale className="h-5 w-5 text-violet-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">
                  Besondere Regelungen für Auktionen
                </h2>
              </div>

              <p className="mb-4 text-gray-700">
                Bei Auktionen gelten zusätzlich folgende Regelungen:
              </p>

              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary-600" />
                  <span className="text-gray-700">
                    Die automatische Verlängerung um 3 Minuten bei Geboten in den letzten 3 Minuten
                    vor Auktionsende bleibt auch während eines Systemausfalls gültig, sofern das
                    System wieder funktionsfähig ist.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary-600" />
                  <span className="text-gray-700">
                    Wenn eine Auktion durch einen Systemausfall verlängert wurde, wird das neue
                    Enddatum automatisch im System gespeichert und ist für alle Nutzer sichtbar.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary-600" />
                  <span className="text-gray-700">
                    Gebote, die während eines Systemausfalls abgegeben werden sollten, können nach
                    Ende des Ausfalls nicht nachträglich berücksichtigt werden.
                  </span>
                </li>
              </ul>
            </section>

            {/* Section 4: Status Info */}
            <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-100">
                  <Info className="h-5 w-5 text-cyan-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">
                  Wo finde ich weitere Informationen zum Systemausfall?
                </h2>
              </div>

              <p className="mb-4 text-gray-700">
                Während eines Systemausfalls finden Sie Informationen auf unserer Status-Seite. Dort
                informieren wir Sie über die aktuellen Probleme und die entsprechenden Massnahmen.
              </p>

              <Link
                href="/status"
                className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-700"
              >
                <ExternalLink className="h-4 w-4" />
                Zur Status-Seite
              </Link>
            </section>

            {/* Section 5: Shortened Offers */}
            <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-rose-100">
                  <AlertTriangle className="h-5 w-5 text-rose-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">
                  Was passiert, wenn mein Angebot wegen des Systemausfalls verkürzt oder nicht
                  verlängert wurde?
                </h2>
              </div>

              <div className="space-y-4 text-gray-700">
                <p>
                  Bei Auktionen, welche nach der Störung nicht automatisch verlängert wurden und
                  durch den Systemausfall wesentlich betroffen waren, ist möglicherweise kein
                  gültiger Kaufvertrag zustande gekommen.
                </p>

                <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                  <p className="text-sm">
                    <strong className="text-gray-900">Wesentlich betroffen</strong> ist eine Auktion
                    insbesondere dann, wenn es den zum Mitbieten gewillten Interessenten
                    offensichtlich nicht mehr möglich war, an der Auktion teilzunehmen.
                  </p>
                </div>

                <p>
                  Der Verkäufer ist in diesem Fall nicht verpflichtet, die Ware zu einem offenkundig
                  zu tiefen Preis zu verkaufen. Der Verkäufer kann seine Ware erneut einstellen,
                  nachdem er dem vermeintlichen Käufer schriftlich mitgeteilt hat, dass er den
                  Vertrag wegen einer wesentlichen Verkürzung nicht halten werde.
                </p>
              </div>
            </section>

            {/* Contact Section */}
            <section className="rounded-xl border-2 border-primary-200 bg-gradient-to-br from-primary-50 to-white p-6">
              <h2 className="mb-4 text-xl font-bold text-gray-900">Kontakt</h2>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex items-start gap-3">
                  <MapPin className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary-600" />
                  <div>
                    <p className="font-medium text-gray-900">Score-Max GmbH</p>
                    <p className="text-sm text-gray-600">In der Hauswiese 2</p>
                    <p className="text-sm text-gray-600">8125 Zollikerberg</p>
                    <p className="text-sm text-gray-600">Schweiz</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Mail className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary-600" />
                  <div>
                    <p className="font-medium text-gray-900">Support</p>
                    <Link
                      href="/contact"
                      className="text-sm text-primary-600 hover:text-primary-700 hover:underline"
                    >
                      Kontaktieren Sie uns
                    </Link>
                    <p className="mt-2 text-xs text-gray-500">
                      Stand: {new Date().toLocaleDateString('de-CH')}
                    </p>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
