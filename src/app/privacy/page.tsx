import { LegalPageChrome } from '@/components/legal/LegalPageChrome'
import { LegalPageWrapper } from '@/components/legal/LegalPageWrapper'
import { legalSurfaceFromHeaders } from '@/lib/legal-page-surface'

export default function PrivacyPage() {
  const surface = legalSurfaceFromHeaders()
  return (
    <LegalPageChrome surface={surface}>
        <div className="mx-auto max-w-4xl px-4 py-8 sm:py-12">
          <LegalPageWrapper titleKey="privacy" validSince="09.05.2026" surface={surface}>

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
                    <li>Ausweisdokument zur Identitätsprüfung (ID-Karte oder Reisepass)</li>
                  </ul>

                  <div className="mb-3 rounded-lg border border-green-200 bg-green-50 p-3 sm:mb-4 sm:p-4">
                    <h4 className="mb-2 text-sm font-semibold text-green-800 sm:text-base">
                      Wichtiger Hinweis zu Ausweisdokumenten
                    </h4>
                    <p className="text-xs text-green-700 sm:text-sm">
                      Ihre Ausweiskopie wird ausschliesslich zur einmaligen Identitätsprüfung verwendet
                      und <strong>unmittelbar nach Abschluss der Prüfung automatisch und unwiderruflich gelöscht</strong>.
                      Wir speichern nur das Ergebnis der Prüfung (verifiziert: ja/nein) und den Dokumenttyp,
                      nicht jedoch das Dokument selbst. Bei einer erneuten Verifizierung ist ein neuer Upload erforderlich.
                      Nicht abgeschlossene Verifizierungsanträge werden nach 30 Tagen automatisch bereinigt.
                    </p>
                  </div>

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
                  <h2 className="mb-3 text-xl font-bold text-gray-900 sm:mb-4 sm:text-2xl">
                    6. Rechtsgrundlagen der Datenverarbeitung (DSGVO)
                  </h2>
                  <p className="mb-3 text-sm sm:mb-4 sm:text-base">
                    Für Nutzer aus der Europäischen Union verarbeiten wir Ihre Daten auf folgenden 
                    Rechtsgrundlagen gemäss Art. 6 Abs. 1 DSGVO:
                  </p>
                  <ul className="mb-3 ml-2 list-inside list-disc space-y-2 text-sm sm:mb-4 sm:ml-4 sm:text-base">
                    <li>
                      <strong>Vertragserfüllung (Art. 6 Abs. 1 lit. b DSGVO):</strong> Verarbeitung 
                      zur Erfüllung eines Vertrags, z.B. Abwicklung von Käufen, Zahlungen und 
                      Kommunikation zwischen Nutzern.
                    </li>
                    <li>
                      <strong>Einwilligung (Art. 6 Abs. 1 lit. a DSGVO):</strong> Wenn Sie 
                      freiwillig eingewilligt haben, z.B. für Marketing-E-Mails oder 
                      Analyse-Cookies.
                    </li>
                    <li>
                      <strong>Berechtigte Interessen (Art. 6 Abs. 1 lit. f DSGVO):</strong> Zur 
                      Betrugsprävention, Verbesserung unserer Dienste und Gewährleistung der 
                      IT-Sicherheit.
                    </li>
                    <li>
                      <strong>Rechtliche Verpflichtung (Art. 6 Abs. 1 lit. c DSGVO):</strong> Zur 
                      Erfüllung gesetzlicher Aufbewahrungspflichten und steuerrechtlicher 
                      Anforderungen.
                    </li>
                  </ul>
                </section>

                <section>
                  <h2 className="mb-3 text-xl font-bold text-gray-900 sm:mb-4 sm:text-2xl">
                    7. Datenübermittlung in Drittländer
                  </h2>
                  <p className="mb-3 text-sm sm:mb-4 sm:text-base">
                    Einige unserer Dienstleister haben ihren Sitz ausserhalb der Schweiz bzw. des 
                    Europäischen Wirtschaftsraums (EWR):
                  </p>
                  <ul className="mb-3 ml-2 list-inside list-disc space-y-2 text-sm sm:mb-4 sm:ml-4 sm:text-base">
                    <li>
                      <strong>Stripe, Inc. (USA):</strong> Zahlungsabwicklung. Stripe ist unter dem 
                      EU-US Data Privacy Framework zertifiziert und bietet angemessene Garantien 
                      gemäss Art. 46 DSGVO.
                    </li>
                    <li>
                      <strong>Vercel Inc. (USA):</strong> Hosting und Infrastruktur. Vercel 
                      verwendet Standardvertragsklauseln der EU-Kommission.
                    </li>
                  </ul>
                  <p className="text-sm sm:text-base">
                    Wir stellen sicher, dass bei Datenübermittlungen in Drittländer ein angemessenes 
                    Datenschutzniveau gewährleistet ist, entweder durch Angemessenheitsbeschlüsse, 
                    Standardvertragsklauseln oder gleichwertige Garantien.
                  </p>
                </section>

                <section>
                  <h2 className="mb-3 text-xl font-bold text-gray-900 sm:mb-4 sm:text-2xl">8. Ihre Rechte</h2>
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
                      <strong>Einschränkung der Verarbeitung:</strong> Sie können die Einschränkung 
                      der Verarbeitung Ihrer Daten verlangen
                    </li>
                    <li>
                      <strong>Datenübertragbarkeit:</strong> Sie können Ihre Daten in einem
                      gängigen Format erhalten
                    </li>
                    <li>
                      <strong>Widerspruchsrecht:</strong> Sie können der Verarbeitung Ihrer Daten
                      widersprechen
                    </li>
                    <li>
                      <strong>Widerruf der Einwilligung:</strong> Sie können erteilte Einwilligungen 
                      jederzeit mit Wirkung für die Zukunft widerrufen
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
                  <h2 className="mb-3 text-xl font-bold text-gray-900 sm:mb-4 sm:text-2xl">
                    9. Beschwerderecht bei einer Aufsichtsbehörde
                  </h2>
                  <p className="mb-3 text-sm sm:mb-4 sm:text-base">
                    Wenn Sie der Ansicht sind, dass die Verarbeitung Ihrer personenbezogenen Daten 
                    gegen das Datenschutzrecht verstösst, haben Sie das Recht, sich bei einer 
                    Aufsichtsbehörde zu beschweren:
                  </p>
                  <ul className="mb-3 ml-2 list-inside list-disc space-y-2 text-sm sm:mb-4 sm:ml-4 sm:text-base">
                    <li>
                      <strong>Schweiz:</strong> Eidgenössischer Datenschutz- und 
                      Öffentlichkeitsbeauftragter (EDÖB), Feldeggweg 1, 3003 Bern, 
                      <a href="https://www.edoeb.admin.ch" target="_blank" rel="noopener noreferrer" 
                         className="ml-1 text-primary-600 hover:underline">www.edoeb.admin.ch</a>
                    </li>
                    <li>
                      <strong>EU:</strong> Sie können sich an die Datenschutzbehörde Ihres 
                      Wohnsitzlandes oder an die für uns zuständige Aufsichtsbehörde wenden.
                    </li>
                  </ul>
                </section>

                <section>
                  <h2 className="mb-3 text-xl font-bold text-gray-900 sm:mb-4 sm:text-2xl">10. Datensicherheit</h2>
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
                  <h2 className="mb-3 text-xl font-bold text-gray-900 sm:mb-4 sm:text-2xl">11. Speicherdauer</h2>
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
                  <h2 className="mb-3 text-xl font-bold text-gray-900 sm:mb-4 sm:text-2xl">
                    12. Automatisierte Entscheidungsfindung
                  </h2>
                  <p className="mb-3 text-sm sm:mb-4 sm:text-base">
                    Wir nutzen keine vollautomatisierten Entscheidungsprozesse im Sinne von Art. 22 
                    DSGVO, die rechtliche Wirkung entfalten oder Sie erheblich beeinträchtigen. 
                    Wenn wir automatisierte Verfahren zur Betrugsprävention einsetzen, werden 
                    endgültige Entscheidungen stets von Menschen überprüft.
                  </p>
                </section>

                <section>
                  <h2 className="mb-3 text-xl font-bold text-gray-900 sm:mb-4 sm:text-2xl">13. Kontakt</h2>
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
                    14. Änderungen dieser Datenschutzerklärung
                  </h2>
                  <p className="mb-3 text-sm sm:mb-4 sm:text-base">
                    Wir behalten uns vor, diese Datenschutzerklärung anzupassen, um sie an geänderte
                    Rechtslage oder bei Änderungen des Dienstes anzupassen. Die aktuelle Version
                    finden Sie immer auf dieser Seite.
                  </p>
                </section>

                <div className="mt-6 border-t border-gray-200 pt-4 sm:mt-8 sm:pt-6">
                  <p className="text-xs text-gray-600 sm:text-sm">
                    <strong>Datenschutzerklärung gültig seit 18. Januar 2026</strong>
                    <br />
                    <span className="text-gray-500">Letzte Aktualisierung: 09.05.2026 (DSGVO-Erweiterungen)</span>
                  </p>
                </div>
              </div>
            </div>
          </LegalPageWrapper>
        </div>
    </LegalPageChrome>
  )
}
