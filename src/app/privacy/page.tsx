// Server Component - kein 'use client' nötig für statische Seiten

import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'

export default function PrivacyPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50">
        <div className="mx-auto max-w-4xl px-4 py-8 sm:py-12">
          <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm sm:p-6 md:p-8 lg:p-12">
            <h1 className="mb-2 text-2xl font-bold text-gray-900 sm:text-3xl">Datenschutzerklärung</h1>
            <p className="mb-6 text-sm text-gray-600 sm:mb-8 sm:text-base">Gültig seit 28. Dezember 2025</p>

            <div className="prose prose-sm max-w-none sm:prose-base lg:prose-lg">
              <div className="space-y-6 text-gray-700 sm:space-y-8">
                <section>
                  <h2 className="mb-3 text-xl font-bold text-gray-900 sm:mb-4 sm:text-2xl">1. Verantwortliche Stelle</h2>
                  <p className="mb-3 text-sm sm:mb-4 sm:text-base">
                    Verantwortlich für die Datenverarbeitung auf dieser Website ist:
                  </p>
                  <p className="mb-3 text-sm sm:mb-4 sm:text-base">
                    <strong>Score-Max-GmbH</strong>
                    <br />
                    in der Hauswiese 2<br />
                    CH-Zollikerberg, Schweiz
                    <br />
                    E-Mail: support@helvenda.ch
                  </p>
                </section>

                <section>
                  <h2 className="mb-3 text-xl font-bold text-gray-900 sm:mb-4 sm:text-2xl">
                    2. Welche Daten wir erheben
                  </h2>

                  <h3 className="mb-2 mt-4 text-lg font-semibold text-gray-900 sm:mb-3 sm:mt-6 sm:text-xl">
                    2.1 Bei der Registrierung
                  </h3>
                  <p className="mb-3 text-sm sm:mb-4 sm:text-base">
                    Bei der Erstellung eines Kontos erheben wir folgende Daten:
                  </p>
                  <ul className="mb-3 ml-2 list-inside list-disc space-y-1 text-sm sm:mb-4 sm:ml-4 sm:space-y-2 sm:text-base">
                    <li>E-Mail-Adresse</li>
                    <li>Name (Vor- und Nachname)</li>
                    <li>Benutzername</li>
                    <li>Passwort (verschlüsselt gespeichert)</li>
                    <li>Optional: Profilbild, Telefonnummer, Adresse</li>
                  </ul>

                  <h3 className="mb-2 mt-4 text-lg font-semibold text-gray-900 sm:mb-3 sm:mt-6 sm:text-xl">
                    2.2 Bei Verifizierung
                  </h3>
                  <p className="mb-3 text-sm sm:mb-4 sm:text-base">
                    Um als Verkäufer aktiv zu werden, erheben wir zusätzlich:
                  </p>
                  <ul className="mb-3 ml-2 list-inside list-disc space-y-1 text-sm sm:mb-4 sm:ml-4 sm:space-y-2 sm:text-base">
                    <li>Geburtsdatum</li>
                    <li>Vollständige Adresse</li>
                    <li>Telefonnummer</li>
                    <li>Bankverbindung (IBAN) für Auszahlungen</li>
                    <li>Optional: Ausweisdokument zur Identitätsprüfung</li>
                  </ul>

                  <h3 className="mb-2 mt-4 text-lg font-semibold text-gray-900 sm:mb-3 sm:mt-6 sm:text-xl">
                    2.3 Bei Nutzung des Zahlungsschutzes
                  </h3>
                  <p className="mb-3 text-sm sm:mb-4 sm:text-base">
                    Bei Nutzung unseres Zahlungsschutzes über Stripe Connect werden zusätzliche Daten
                    an unseren Zahlungsdienstleister Stripe übermittelt:
                  </p>
                  <ul className="mb-3 ml-2 list-inside list-disc space-y-1 text-sm sm:mb-4 sm:ml-4 sm:space-y-2 sm:text-base">
                    <li>Name und Adresse</li>
                    <li>Bankverbindung</li>
                    <li>Geburtsdatum</li>
                    <li>Zur Verifizierung ggf. Ausweisdokumente</li>
                  </ul>
                  <p className="mb-3 text-sm sm:mb-4 sm:text-base">
                    Diese Daten werden von Stripe gemäss deren Datenschutzrichtlinien verarbeitet:{' '}
                    <a
                      href="https://stripe.com/privacy"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary-600 hover:underline"
                    >
                      stripe.com/privacy
                    </a>
                  </p>

                  <h3 className="mb-2 mt-4 text-lg font-semibold text-gray-900 sm:mb-3 sm:mt-6 sm:text-xl">
                    2.4 Automatisch erfasste Daten
                  </h3>
                  <p className="mb-3 text-sm sm:mb-4 sm:text-base">Bei jedem Besuch unserer Website erfassen wir automatisch:</p>
                  <ul className="mb-3 ml-2 list-inside list-disc space-y-1 text-sm sm:mb-4 sm:ml-4 sm:space-y-2 sm:text-base">
                    <li>IP-Adresse</li>
                    <li>Datum und Uhrzeit des Zugriffs</li>
                    <li>Browsertyp und Version</li>
                    <li>Betriebssystem</li>
                    <li>Referrer-URL (zuvor besuchte Seite)</li>
                  </ul>
                </section>

                <section>
                  <h2 className="mb-3 text-xl font-bold text-gray-900 sm:mb-4 sm:text-2xl">
                    3. Zweck der Datenverarbeitung
                  </h2>
                  <p className="mb-3 text-sm sm:mb-4 sm:text-base">Wir verwenden Ihre Daten für folgende Zwecke:</p>
                  <ul className="mb-3 ml-2 list-inside list-disc space-y-1 text-sm sm:mb-4 sm:ml-4 sm:space-y-2 sm:text-base">
                    <li>Bereitstellung und Verwaltung Ihres Benutzerkontos</li>
                    <li>Abwicklung von Käufen und Verkäufen</li>
                    <li>Kommunikation zwischen Käufern und Verkäufern</li>
                    <li>Verarbeitung von Zahlungen und Auszahlungen</li>
                    <li>Betrugsprävention und Sicherheit</li>
                    <li>Kundensupport und Streitbeilegung</li>
                    <li>Verbesserung unserer Dienstleistungen</li>
                    <li>Einhaltung gesetzlicher Vorschriften</li>
                  </ul>
                </section>

                <section>
                  <h2 className="mb-3 text-xl font-bold text-gray-900 sm:mb-4 sm:text-2xl">
                    4. Weitergabe an Dritte
                  </h2>

                  <h3 className="mb-2 mt-4 text-lg font-semibold text-gray-900 sm:mb-3 sm:mt-6 sm:text-xl">
                    4.1 Zahlungsdienstleister
                  </h3>
                  <p className="mb-3 text-sm sm:mb-4 sm:text-base">
                    Für die Abwicklung von Zahlungen arbeiten wir mit{' '}
                    <strong>Stripe, Inc.</strong> zusammen. Stripe verarbeitet Zahlungsdaten gemäss
                    eigener Datenschutzrichtlinien und ist nach PCI DSS zertifiziert.
                  </p>

                  <h3 className="mb-2 mt-4 text-lg font-semibold text-gray-900 sm:mb-3 sm:mt-6 sm:text-xl">
                    4.2 Transaktionspartner
                  </h3>
                  <p className="mb-3 text-sm sm:mb-4 sm:text-base">
                    Bei einem Kauf oder Verkauf werden bestimmte Daten an den jeweiligen
                    Transaktionspartner weitergegeben, um die Abwicklung zu ermöglichen (z.B. Name
                    und Adresse für den Versand).
                  </p>

                  <h3 className="mb-2 mt-4 text-lg font-semibold text-gray-900 sm:mb-3 sm:mt-6 sm:text-xl">
                    4.3 Hosting und Infrastruktur
                  </h3>
                  <p className="mb-3 text-sm sm:mb-4 sm:text-base">
                    Unsere Website wird bei <strong>Vercel Inc.</strong> gehostet. Bilder werden
                    über Vercel Blob Storage gespeichert.
                  </p>
                </section>

                <section>
                  <h2 className="mb-3 text-xl font-bold text-gray-900 sm:mb-4 sm:text-2xl">5. Cookies</h2>
                  <p className="mb-3 text-sm sm:mb-4 sm:text-base">
                    Wir verwenden Cookies und ähnliche Technologien für folgende Zwecke:
                  </p>
                  <ul className="mb-3 ml-2 list-inside list-disc space-y-1 text-sm sm:mb-4 sm:ml-4 sm:space-y-2 sm:text-base">
                    <li>
                      <strong>Notwendige Cookies:</strong> Für die Funktion der Website
                      (Login-Session, Warenkorb)
                    </li>
                    <li>
                      <strong>Präferenz-Cookies:</strong> Speicherung Ihrer Einstellungen (Sprache,
                      Ansicht)
                    </li>
                    <li>
                      <strong>Analyse-Cookies:</strong> Verbesserung unserer Dienste (anonymisiert)
                    </li>
                  </ul>
                  <p className="mb-3 text-sm sm:mb-4 sm:text-base">
                    Sie können Cookies in Ihren Browsereinstellungen verwalten oder deaktivieren.
                  </p>
                </section>

                <section>
                  <h2 className="mb-3 text-xl font-bold text-gray-900 sm:mb-4 sm:text-2xl">6. Ihre Rechte</h2>
                  <p className="mb-3 text-sm sm:mb-4 sm:text-base">
                    Gemäss dem Schweizerischen Datenschutzgesetz (DSG) und der DSGVO haben Sie
                    folgende Rechte:
                  </p>
                  <ul className="mb-3 ml-2 list-inside list-disc space-y-1 text-sm sm:mb-4 sm:ml-4 sm:space-y-2 sm:text-base">
                    <li>
                      <strong>Auskunftsrecht:</strong> Sie können Auskunft über Ihre gespeicherten
                      Daten verlangen
                    </li>
                    <li>
                      <strong>Berichtigungsrecht:</strong> Sie können die Korrektur unrichtiger
                      Daten verlangen
                    </li>
                    <li>
                      <strong>Löschungsrecht:</strong> Sie können die Löschung Ihrer Daten verlangen
                    </li>
                    <li>
                      <strong>Datenübertragbarkeit:</strong> Sie können Ihre Daten in einem
                      gängigen Format erhalten
                    </li>
                    <li>
                      <strong>Widerspruchsrecht:</strong> Sie können der Verarbeitung Ihrer Daten
                      widersprechen
                    </li>
                  </ul>
                  <p className="mb-3 text-sm sm:mb-4 sm:text-base">
                    Um Ihre Rechte auszuüben, kontaktieren Sie uns unter:{' '}
                    <a
                      href="mailto:support@helvenda.ch"
                      className="text-primary-600 hover:underline"
                    >
                      support@helvenda.ch
                    </a>
                  </p>
                </section>

                <section>
                  <h2 className="mb-3 text-xl font-bold text-gray-900 sm:mb-4 sm:text-2xl">7. Datensicherheit</h2>
                  <p className="mb-3 text-sm sm:mb-4 sm:text-base">
                    Wir setzen technische und organisatorische Sicherheitsmassnahmen ein:
                  </p>
                  <ul className="mb-3 ml-2 list-inside list-disc space-y-1 text-sm sm:mb-4 sm:ml-4 sm:space-y-2 sm:text-base">
                    <li>SSL/TLS-Verschlüsselung für alle Datenübertragungen</li>
                    <li>Verschlüsselte Speicherung von Passwörtern</li>
                    <li>Regelmässige Sicherheitsupdates</li>
                    <li>Zugriffsbeschränkungen für Mitarbeiter</li>
                    <li>Regelmässige Backups</li>
                  </ul>
                </section>

                <section>
                  <h2 className="mb-3 text-xl font-bold text-gray-900 sm:mb-4 sm:text-2xl">8. Speicherdauer</h2>
                  <p className="mb-3 text-sm sm:mb-4 sm:text-base">
                    Wir speichern Ihre Daten nur so lange, wie es für die genannten Zwecke
                    erforderlich ist:
                  </p>
                  <ul className="mb-3 ml-2 list-inside list-disc space-y-1 text-sm sm:mb-4 sm:ml-4 sm:space-y-2 sm:text-base">
                    <li>
                      <strong>Kontodaten:</strong> Bis zur Löschung Ihres Kontos
                    </li>
                    <li>
                      <strong>Transaktionsdaten:</strong> 10 Jahre (gesetzliche Aufbewahrungsfrist)
                    </li>
                    <li>
                      <strong>Log-Dateien:</strong> 90 Tage
                    </li>
                    <li>
                      <strong>Support-Anfragen:</strong> 3 Jahre nach Abschluss
                    </li>
                  </ul>
                </section>

                <section>
                  <h2 className="mb-3 text-xl font-bold text-gray-900 sm:mb-4 sm:text-2xl">9. Kontakt</h2>
                  <p className="mb-3 text-sm sm:mb-4 sm:text-base">
                    Bei Fragen zum Datenschutz wenden Sie sich an:
                  </p>
                  <p className="mb-3 text-sm sm:mb-4 sm:text-base">
                    <strong>Score-Max-GmbH</strong>
                    <br />
                    Datenschutzbeauftragter
                    <br />
                    in der Hauswiese 2<br />
                    CH-Zollikerberg
                    <br />
                    E-Mail:{' '}
                    <a
                      href="mailto:support@helvenda.ch"
                      className="text-primary-600 hover:underline"
                    >
                      support@helvenda.ch
                    </a>
                  </p>
                </section>

                <section>
                  <h2 className="mb-3 text-xl font-bold text-gray-900 sm:mb-4 sm:text-2xl">
                    10. Änderungen dieser Datenschutzerklärung
                  </h2>
                  <p className="mb-3 text-sm sm:mb-4 sm:text-base">
                    Wir behalten uns vor, diese Datenschutzerklärung anzupassen, um sie an geänderte
                    Rechtslage oder bei Änderungen des Dienstes anzupassen. Die aktuelle Version
                    finden Sie immer auf dieser Seite.
                  </p>
                </section>

                <div className="mt-6 border-t border-gray-200 pt-4 sm:mt-8 sm:pt-6">
                  <p className="text-xs text-gray-600 sm:text-sm">
                    <strong>Datenschutzerklärung gültig seit 28. Dezember 2025</strong>
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
