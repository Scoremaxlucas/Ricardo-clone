import { LegalPageChrome } from '@/components/legal/LegalPageChrome'
import { LegalPageWrapper } from '@/components/legal/LegalPageWrapper'
import { WohnenTermsJump } from '@/components/legal/WohnenTermsJump'
import { legalSurfaceFromHeaders } from '@/lib/legal-page-surface'

export default function TermsPage() {
  const surface = legalSurfaceFromHeaders()
  return (
    <LegalPageChrome surface={surface}>
        <div className="mx-auto max-w-4xl px-4 py-8 sm:py-12">
          <LegalPageWrapper titleKey="terms" validSince="17.01.2025" surface={surface}>
            <WohnenTermsJump surface={surface} />

            <div className="prose prose-sm sm:prose-base lg:prose-lg max-w-none">
              <div className="space-y-6 sm:space-y-8 text-gray-700">
                <div>
                  <p className="text-base sm:text-lg mb-4 sm:mb-6">
                    Diese Allgemeinen Geschäftsbedingungen regeln die Rechte und Pflichten in Zusammenhang mit der Nutzung der auf der Webseite „www.helvenda.ch" angebotenen Dienstleistungen.
                  </p>
                </div>

                <section>
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4">1 Einleitung</h2>

                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3 mt-4 sm:mt-6">1.1 Anwendungsbereich und Geltung dieser Allgemeinen Geschäftsbedingungen</h3>

                  <h4 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 mt-3 sm:mt-4">Geltung</h4>
                  <p className="text-sm sm:text-base mb-3 sm:mb-4">
                    Diese Allgemeinen Geschäftsbedingungen (AGB) der Score-Max-GmbH, in der Hauswiese 2, CH-Zollikerberg, Schweiz (nachfolgend „Helvenda") sowie die von diesen AGB als verbindlich erklärten, neben der AGB festgehaltenen Bestimmungen, insbesondere die Datenschutzerklärung und das Gebührenreglement, regeln die mit der Nutzung der über die Webseite www.helvenda.ch (inkl. aller Subdomains) angebotenen Produkte Helvenda im Zusammenhang stehenden Rechte und Pflichten und das vertragliche Verhältnis zwischen Helvenda und Helvenda-Mitgliedern. Dazu zählen insbesondere der klassische Online-Marktplatz für Waren und Dienstleistungen (nachfolgend „Marktplatz") sowie das Angebot „Helvenda Wohnungen" auf der Subdomain wohnen.helvenda.ch und allfälligen weiteren unter dem Markenauftritt Helvenda Wohnungen geführten Zugängen (nachfolgend „Helvenda Wohnungen" oder „Wohnen").
                  </p>

                  <h4 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 mt-3 sm:mt-4">Bestätigung und Änderung dieser AGB</h4>
                  <p className="text-sm sm:text-base mb-3 sm:mb-4">
                    Das Mitglied bestätigt diese AGB jedes Mal neu, wenn es sich auf dem Marktplatz oder im Bereich Helvenda Wohnungen einloggt. Helvenda behält sich das Recht vor, an diesen AGB jederzeit Änderungen vorzunehmen und die jeweils aktuelle Fassung auf Helvenda zu veröffentlichen. Wesentliche Änderungen werden den Mitgliedern zudem innert angemessener Frist vor ihrem Inkrafttreten mitgeteilt.
                  </p>

                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3 mt-4 sm:mt-6">1.2 Marktplatz von Helvenda</h3>
                  <p className="text-sm sm:text-base mb-3 sm:mb-4">
                    Helvenda stellt seinen Marktplatz seinen angemeldeten Mitgliedern auf Zusehen hin als Plattform für das Anbieten und den Erwerb von Waren, Dienstleistungen und Rechten (nachfolgend: „Produkte") zur Verfügung. Der Einfachheit halber bezeichnen die vorliegenden AGB den Anbieter eines Produkts jeweils als „Verkäufer", den Erwerber eines Produkts jeweils als „Käufer" und den Erwerb als „Kauf" bzw. „Kaufen".
                  </p>

                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3 mt-4 sm:mt-6">1.3 Grundsätze für die Nutzung des Marktplatzes von Helvenda</h3>

                  <h4 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 mt-3 sm:mt-4">1.3.1 Eigenverantwortliche Nutzung</h4>
                  <p className="text-sm sm:text-base mb-3 sm:mb-4">
                    Auf dem Marktplatz können die Mitglieder untereinander bzw. die Händler und die Mitglieder autonom und eigenverantwortlich Verträge abschliessen. Aus solchen Verträgen verpflichtet und berechtigt sind einzig der Verkäufer bzw. der Händler und der Käufer. Die Erfüllung des Vertrags liegt in der ausschliesslichen Verantwortung von Händler bzw. Verkäufer und Käufer.
                  </p>

                  <h4 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 mt-3 sm:mt-4">1.3.2 Rechtsstellung von Helvenda</h4>
                  <p className="text-sm sm:text-base mb-3 sm:mb-4">
                    Helvenda ist nicht Vertragspartei von Verträgen, die zwischen den Mitgliedern bzw. Händlern und Mitgliedern auf dem Marktplatz geschlossen werden. Helvenda, seine Vertreter, Mitarbeiter und Hilfspersonen sind in keiner Weise verantwortlich für die mit der Anbahnung und dem Abschluss von Geschäften verbundenen Risiken und haften in keiner Weise für etwaige, dadurch entstehende Schäden.
                  </p>
                  <p className="text-sm sm:text-base mb-3 sm:mb-4">
                    Helvenda ist nicht verpflichtet, das Verhalten seiner Mitglieder oder Händler im Zusammenhang mit der Nutzung des Marktplatzes zu kontrollieren. Insbesondere ist Helvenda zwar berechtigt, aber nicht verpflichtet, die auf dem Marktplatz von seinen Mitgliedern bzw. Händlern veröffentlichten Angebote, Texte und bildlichen Darstellungen auf ihre Rechtmässigkeit oder sonstige Zulässigkeit in irgendeiner Weise zu überprüfen. Dies gilt insbesondere auch für das von den Mitgliedern in Eigenverantwortung genutzte System zur Bewertung von Mitgliedern bzw. Händlern.
                  </p>

                  <h4 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 mt-3 sm:mt-4">1.3.3 Kein Nutzungsanspruch</h4>
                  <p className="text-sm sm:text-base mb-3 sm:mb-4">
                    Es besteht kein Anspruch auf Anmeldung, Mitgliedschaft, Nutzung des Marktplatzes oder Inanspruchnahme von Dienstleistungen von Helvenda. Es steht Helvenda insbesondere frei, jederzeit eine Anmeldung abzulehnen, oder nach Massgabe von Ziff. 2.4 ein Mitglied auszuschliessen, eine Nutzung zu verbieten oder eine Dienstleistung einzustellen.
                  </p>

                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3 mt-4 sm:mt-6">1.4 Definitionen</h3>

                  <h4 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 mt-3 sm:mt-4">1.4.1 Mitglied</h4>
                  <p className="text-sm sm:text-base mb-3 sm:mb-4">
                    Mit der Anmeldung, d.h. mit der Angabe seiner abgefragten persönlichen Angaben und seiner Zustimmung zu den vorliegenden AGB wird der Interessent zu einem „Mitglied" des Marktplatzes. Helvenda kann zusätzliche Angaben und/oder Verifikationen vorsehen oder darauf verzichten. Anmeldung und Mitgliedschaft sind kostenlos.
                  </p>

                  <h4 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 mt-3 sm:mt-4">1.4.2 Angebot</h4>
                  <p className="text-sm sm:text-base mb-3 sm:mb-4">
                    Angebot bedeutet die Veröffentlichung einer eigenverantwortlich ausgestalteten Darstellung zur Veräusserung eines Produkts auf dem Marktplatz.
                  </p>

                  <h4 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 mt-3 sm:mt-4">1.4.3 Angebotsarten auf dem Marktplatz von Helvenda</h4>
                  <p className="text-sm sm:text-base mb-3 sm:mb-4">
                    Angebote können verschieden ausgestaltet werden. Zurzeit stehen folgende Formen zur Verfügung:
                  </p>

                  <div className="ml-2 sm:ml-4 mb-3 sm:mb-4">
                    <p className="text-sm sm:text-base mb-2"><strong>a) Auktionen</strong></p>
                    <p className="text-sm sm:text-base mb-3 sm:mb-4">
                      Bei einer Auktion (Versteigerung) auf Helvenda wird ein Angebot für einen vom Verkäufer festgelegten Zeitraum und zu den vom Verkäufer festgelegten Konditionen auf dem Marktplatz veröffentlicht. Beginnend beim festgelegten Mindestpreis können Interessenten im gegenseitigen Wettstreit Gebote (d.h. den Preis, den sie maximal dafür zu zahlen verbindlich bereit sind) für das angebotene Produkt abgeben. Das Einstellen eines Produktes zwecks Durchführung einer Auktion stellt eine verbindliche Offerte des Verkäufers zum Abschluss eines Vertrages über den Kauf des angebotenen Produkts mit dem Meistbietenden bei Ablauf der Auktionsdauer dar. Wird innerhalb der letzten 3 Minuten der Angebotsdauer ein Gebot abgegeben, so schliesst die Auktion drei Minuten nach Eingabe des letzten Gebots. Der Vertragsschluss erfolgt an den Höchstbieter. Bei einer Mehrfachauktion stellt das Einstellen mehrerer identischer Produkte eine verbindliche Offerte des Verkäufers zum Abschluss separater Kaufverträge bis zum Ausschöpfen der Stückzahl mit den Bietern in absteigender Reihenfolge der Höhe der eingegangenen Gebote dar.
                    </p>

                    <p className="text-sm sm:text-base mb-2"><strong>b) Angebote zu Fixpreis/Auktionen mit Sofort-kaufen-Preis</strong></p>
                    <p className="text-sm sm:text-base mb-3 sm:mb-4">
                      Das Einstellen eines Produkts unter Angabe eines sogenannten Fixpreises durch den Verkäufer stellt eine verbindliche Offerte zur sofortigen Veräusserung des Produkts an denjenigen dar, der sich bereit erklärt, diesen festgelegten Betrag zu bezahlen.
                    </p>
                    <p className="text-sm sm:text-base mb-3 sm:mb-4">
                      Enthält ein Angebot in Auktionsform zusätzlich die Möglichkeit, das Produkt sofort zu einem Fixpreis zu kaufen und damit die Auktion vorzeitig zu beenden, wird dieser Preis der Deutlichkeit halber als „Sofort-kaufen-Preis" bezeichnet.
                    </p>
                  </div>

                  <h3 id="helvenda-wohnungen" className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3 mt-6 sm:mt-8 scroll-mt-24">1.5 Helvenda Wohnungen (Mietwohnungen)</h3>

                  <h4 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 mt-3 sm:mt-4">1.5.1 Zweck und Begriffe</h4>
                  <p className="text-sm sm:text-base mb-3 sm:mb-4">
                    Unter Helvenda Wohnungen versteht Helvenda die digitalen Funktionen rund um Mietwohnungs-Inserate, Suchprofile, Vermittlungshilfen zwischen Inserenten und Mietinteressierten, Bewerbungsabläufe sowie Hilfsmittel wie z.&nbsp;B. den Helvenda-Qualitätsnachweis. Soweit nachfolgend nicht ausdrücklich anders bezeichnet, gelten die Begriffe „Mitglied", „Angebot" und „Inhalt" sinngemäss auch für Inserate, Suchprofile, Bewerbungen und sonstige im Wohnen-Bereich publizierte Informationen. „Vermieter" bezeichnet ein Mitglied, das ein Mietwohnungs-Inserat führt; „Suchende" oder „Mietinteressierte" bezeichnet ein Mitglied, das Such- oder Bewerbungsfunktionen nutzt.
                  </p>

                  <h4 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 mt-3 sm:mt-4">1.5.2 Rechtsstellung von Helvenda</h4>
                  <p className="text-sm sm:text-base mb-3 sm:mb-4">
                    Helvenda stellt unter Helvenda Wohnungen eine technische Plattform und begleitende Dienstleistungen (z.&nbsp;B. Anzeige, Matching, Formularhilfen, Prüf- und Verifikationsfunktionen) bereit. Helvenda wird nicht Partei eines Miet- oder sonstigen Wohnrechtsvertrags zwischen Mitgliedern. Anbahnung, Abschluss und Erfüllung eines Mietverhältnisses liegen in der alleinigen Verantwortung der beteiligten Mitglieder. Entscheidungen über Annahme oder Ablehnung von Bewerbungen, Besichtigungen, Bonitäts- oder Referenzprüfungen sowie die Auswahl eines Kontrahenten treffen die Mitglieder eigenverantwortlich.
                  </p>

                  <h4 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 mt-3 sm:mt-4">1.5.3 Inserate, Suchangaben und Profile</h4>
                  <p className="text-sm sm:text-base mb-3 sm:mb-4">
                    Mitglieder sind verpflichtet, sämtliche Angaben zu Objekten, Mietzinsen, Nebenkosten, Verfügbarkeit, Haustierregeln, Mindestdauer und weiteren wesentlichen Umständen wahrheitsgemäss und nicht irreführend zu machen und bei Änderungen unverzüglich zu aktualisieren. Bild- und Textmaterial darf nur verwendet werden, an dem das Mitglied die erforderlichen Rechte hat. Unzulässig sind insbesondere falsche oder fremde Identitäten, irreführende Symbolfotos, Doppelinserate mit dem Zweck der Täuschung sowie Inserate ohne ernsthafte Vermietungsabsicht.
                  </p>

                  <h4 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 mt-3 sm:mt-4">1.5.4 Bewerbungen, Nachrichten und Diskriminierung</h4>
                  <p className="text-sm sm:text-base mb-3 sm:mb-4">
                    Bewerbungen und sonstige Nachrichten im Wohnen-Bereich sind sachlich und respektvoll zu halten. Es ist untersagt, Mitglieder aufgrund von Geschlecht, Herkunft, Religion, Alter, Familienstand, sexueller Orientierung, Behinderung oder anderen diskriminierungsrelevanten Merkmalen zu benachteiligen, soweit dies nach anwendbarem Recht geschützt ist. Helvenda kann Inhalte sperren oder entfernen und Konten einschränken, wenn ein begründeter Verdacht auf Rechtsverstoss oder schwerwiegenden Verstoss gegen diese AGB besteht.
                  </p>

                  <h4 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 mt-3 sm:mt-4">1.5.5 Betreibungsregisterauszug und Datenprüfungen</h4>
                  <p className="text-sm sm:text-base mb-3 sm:mb-4">
                    Wo Helvenda die Einreichung eines Betreibungsregisterauszugs oder anderer Nachweise vorsieht, hat das Mitglied authentische, vollständige und den Vorgaben entsprechende Unterlagen bereitzustellen. Helvenda darf Unterlagen plausibilisiert prüfen (einschliesslich automatisierter oder manueller Verfahren) und Bewerbungs- oder Zertifikatsfunktionen verweigern oder einstellen, wenn Anhaltspunkte für Fälschung, Manipulation, fehlende Berechtigung oder sonstige Unzuverlässigkeit bestehen. Mit der Nutzung der entsprechenden Funktionen willigt das Mitglied in die zur Plausibilisierung erforderliche Bearbeitung ein; Massgeblich bleibt die Datenschutzerklärung.
                  </p>

                  <h4 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 mt-3 sm:mt-4">1.5.6 Qualitätsnachweis (Zertifikat)</h4>
                  <p className="text-sm sm:text-base mb-3 sm:mb-4">
                    Ein Helvenda-Qualitätsnachweis dokumentiert ausdrücklich nur den zum Zeitpunkt der Ausstellung in den Systemen von Helvenda festgestellten Prüfstand (z.&nbsp;B. Kategorien zu Einkommen und Beschäftigung sowie Ergebnis der eingereichten Betreibungsregister-Plausibilisierung). Er stellt keine Rechtsberatung, keine Bonitätsauskunft im Sinne eines Auskunfteien und keine Garantie für künftige Zahlungsfähigkeit oder Vertragsloyalität dar. Gültigkeit, Verlängerung und Entzug richten sich nach den auf der Plattform kommunizierten Regeln; ein öffentlicher Prüf-Link oder PDF dient ausschliesslich der Nachvollziehbarkeit dieses Stands.
                  </p>

                  <h4 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 mt-3 sm:mt-4">1.5.7 Mietvertrag und Haftung zwischen Mitgliedern</h4>
                  <p className="text-sm sm:text-base mb-3 sm:mb-4">
                    Etwaige Mietverträge, Vorverträge, Untermieten oder andere Vereinbarungen schliessen ausschliesslich die beteiligten Mitglieder untereinander ab. Helvenda übernimmt keine Gewähr für die Richtigkeit von Objektangaben, keine Prüfung der Vertragskonformität mit öffentlichem Recht (z.&nbsp;B. Mietzinsbildung, Kündigungsschutz, Meldepflichten) und keine Haftung für Schäden aus dem zwischen Mitgliedern geschlossenen oder nicht geschlossenen Mietverhältnis.
                  </p>

                  <h4 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 mt-3 sm:mt-4">1.5.8 Vermittlungsentgelt der Vermieter (Erfolgsprovision)</h4>
                  <p className="text-sm sm:text-base mb-3 sm:mb-4">
                    Mit der Aufschaltung eines Mietwohnungs-Inserats über Helvenda Wohnungen oder mit der Annahme einer von Helvenda vermittelten Bewerbung schliesst der Vermieter mit Helvenda einen Mäklervertrag im Sinne von Art.&nbsp;412&nbsp;ff. OR. Helvenda erbringt dabei Nachweis- und Vermittlungsleistungen, insbesondere die Bereitstellung der Plattform, die Vorprüfung der Mietinteressierten (z.&nbsp;B. Plausibilisierung von Betreibungsregisterauszug und Einkommenskategorie) sowie die Übermittlung qualifizierter Bewerbungen.
                  </p>
                  <p className="text-sm sm:text-base mb-3 sm:mb-4">
                    Das Vermittlungsentgelt ist erfolgsabhängig: Es ist nur geschuldet, wenn zwischen dem Vermieter und einer über Helvenda Wohnungen nachgewiesenen oder vermittelten Person ein rechtsgültiger Mietvertrag über das inserierte Objekt zustande kommt und das Mietverhältnis tatsächlich beginnt. Helvenda gilt insbesondere dann als kausal vermittelnd, wenn die mietvertragliche Partei dem Vermieter über die Plattform vorgestellt wurde, sich auf das Inserat über Helvenda Wohnungen beworben hat oder ihre Identität, Kontaktdaten oder Bewerbungsunterlagen über Funktionen von Helvenda dem Vermieter zugänglich gemacht wurden.
                  </p>
                  <p className="text-sm sm:text-base mb-3 sm:mb-4">
                    Die Höhe des Vermittlungsentgelts beträgt <strong>33&nbsp;% des ersten monatlichen Nettomietzinses</strong> des vermittelten Mietverhältnisses, mindestens jedoch <strong>CHF&nbsp;290.00</strong> und höchstens <strong>CHF&nbsp;990.00</strong> (Plafonierung). Berechnungsbasis ist ausschliesslich der vereinbarte Nettomietzins ohne Nebenkosten, Heiz-, Garagen-, Mobiliar-, Parkplatz- oder ähnliche Zusatzentgelte. Die Mehrwertsteuer wird gesondert ausgewiesen und zusätzlich verrechnet.
                  </p>
                  <p className="text-sm sm:text-base mb-3 sm:mb-4">
                    Schliesst der Vermieter mit einer Person, die ihm zuvor über Helvenda Wohnungen nachgewiesen oder vorgestellt wurde, innert <strong>sechs Monaten</strong> nach dem letzten Kontakt über Helvenda direkt oder über Dritte einen Mietvertrag ab, gilt das Vermittlungsentgelt ebenfalls als verdient (Schutzfrist gegen Umgehung). Helvenda kann den Vermieter zur Auskunft verpflichten und einen Nachweis über das zustande gekommene Mietverhältnis verlangen.
                  </p>
                  <p className="text-sm sm:text-base mb-3 sm:mb-4">
                    Das Vermittlungsentgelt wird mit Beginn des Mietverhältnisses fällig. Die Rechnungsstellung erfolgt elektronisch; offene Beträge sind innert 14 Tagen nach Zustellung der Zahlungsaufforderung zu begleichen. Im Übrigen gelten die Regeln zur Rechnungsstellung, Mahnung und Zahlung gemäss diesen AGB sinngemäss.
                  </p>
                  <p className="text-sm sm:text-base mb-3 sm:mb-4">
                    Das Vermittlungsentgelt entfällt oder wird auf Antrag rückerstattet, wenn der Mietvertrag aus Gründen, die der Vermieter nicht zu vertreten hat, vor dem vereinbarten Mietbeginn aufgehoben wird und das Mietverhältnis effektiv nie zustande kommt. Bei Vertragsauflösungen nach Mietbeginn bleibt das Entgelt geschuldet. Das Recht der vermittelten Person auf den Mieter-Einzugsbonus gemäss Ziff.&nbsp;1.5.9 entfällt in diesen Fällen entsprechend.
                  </p>
                  <p className="text-sm sm:text-base mb-3 sm:mb-4">
                    Eine Überwälzung des Vermittlungsentgelts auf die Mieterin oder den Mieter ist unzulässig. Auf Helvenda Wohnungen wird ausschliesslich der Vermieter zum Vermittlungsentgelt verpflichtet; Mietinteressierte schulden Helvenda im Zusammenhang mit der Vermittlung keine Provision oder vergleichbare Vergütung.
                  </p>
                  <p className="text-sm sm:text-base mb-3 sm:mb-4">
                    Aktuelle Beträge, Berechnungsbeispiele und allfällige Anpassungen ergeben sich aus dem jeweils auf Helvenda publizierten Gebührenreglement.
                  </p>

                  <h4 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 mt-3 sm:mt-4">1.5.9 Mieter-Einzugsbonus</h4>
                  <p className="text-sm sm:text-base mb-3 sm:mb-4">
                    Helvenda kann der Person, die über Helvenda Wohnungen erfolgreich an einen Vermieter vermittelt wurde und in das vermittelte Mietobjekt einzieht, einen freiwilligen einmaligen Einzugsbonus ausrichten (nachfolgend „Mieter-Einzugsbonus"). Es handelt sich um eine freiwillige Leistung von Helvenda; ein Rechtsanspruch des Mitglieds auf Auszahlung besteht nur, wenn und soweit die nachfolgenden Voraussetzungen kumulativ erfüllt sind.
                  </p>
                  <p className="text-sm sm:text-base mb-3 sm:mb-4">
                    Der Mieter-Einzugsbonus beträgt <strong>CHF&nbsp;250.00</strong> und wird je vermitteltem Mietverhältnis nur einmal ausbezahlt, unabhängig von der Zahl der mitziehenden Personen oder Mitmieter. Voraussetzung sind kumulativ:
                  </p>
                  <ul className="list-disc list-inside text-sm sm:text-base mb-3 sm:mb-4 ml-2 sm:ml-4 space-y-1 sm:space-y-2">
                    <li>die Bewerbung erfolgte über die Helvenda-Plattform aus einem zum Zeitpunkt der Bewerbung vollständigen und verifizierten Mieterprofil heraus (insbesondere mit gültigem Betreibungsregisterauszug-Status und Einkommenskategorie);</li>
                    <li>zwischen Vermieter und Mitglied wurde aufgrund der Vermittlung durch Helvenda ein rechtsgültiger Mietvertrag abgeschlossen;</li>
                    <li>das Mietverhältnis hat tatsächlich begonnen und besteht zum Zeitpunkt der Auszahlung mindestens 30&nbsp;Tage ungekündigt fort;</li>
                    <li>das Vermittlungsentgelt gemäss Ziff.&nbsp;1.5.8 wurde vom Vermieter vollständig bezahlt;</li>
                    <li>das Mitglied hat Helvenda eine auf seinen Namen lautende Schweizer IBAN sowie die zur Auszahlung erforderlichen Angaben übermittelt.</li>
                  </ul>
                  <p className="text-sm sm:text-base mb-3 sm:mb-4">
                    Die Auszahlung erfolgt frühestens 30&nbsp;Tage nach Mietbeginn auf das vom Mitglied bezeichnete Schweizer Konto. Helvenda kann die Auszahlung verweigern oder bereits ausbezahlte Beträge zurückfordern, wenn das Mietverhältnis innert 30&nbsp;Tagen nach Mietbeginn aufgehoben wird, das Mitglied unrichtige oder unvollständige Angaben gemacht hat, eine Umgehung der vorstehenden Voraussetzungen vorliegt oder das Vermittlungsentgelt vom Vermieter nicht oder nicht vollständig bezahlt wird.
                  </p>
                  <p className="text-sm sm:text-base mb-3 sm:mb-4">
                    Vom Mieter-Einzugsbonus ausgeschlossen sind insbesondere Mietverhältnisse zwischen nahestehenden Personen (z.&nbsp;B. Ehegatten, eingetragenen Partnern, Verwandten in gerader Linie, Geschwistern), Mietverhältnisse, an denen das Mitglied selbst als Vermieter, Verwaltung oder wirtschaftlich Berechtigter beteiligt ist, sowie Konstellationen, in denen Helvenda nicht kausal für das Zustandekommen des Mietverhältnisses war. Der Mieter-Einzugsbonus stellt keine Beteiligung an einem Maklerlohn dar; das Mitglied ist nicht Partei des Mäklervertrags zwischen Helvenda und dem Vermieter.
                  </p>
                  <p className="text-sm sm:text-base mb-3 sm:mb-4">
                    Helvenda kann Höhe und Voraussetzungen des Mieter-Einzugsbonus für künftige Vermittlungen jederzeit anpassen oder den Bonus einstellen. Massgeblich ist der zum Zeitpunkt der Bewerbung über Helvenda Wohnungen kommunizierte Stand. Aktuelle Beträge ergeben sich aus dem jeweils auf Helvenda publizierten Gebührenreglement und/oder den auf der Plattform angezeigten Bedingungen.
                  </p>

                  <h4 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 mt-3 sm:mt-4">1.5.10 Verhältnis zu den übrigen AGB</h4>
                  <p className="text-sm sm:text-base mb-3 sm:mb-4">
                    Soweit spezifische Bestimmungen des Marktplatzes (z.&nbsp;B. Auktionslogik, klassische Käufer-Verkäufer-Mechanik) auf Helvenda Wohnungen schlichtweg nicht passen, finden sie auf diesen Teil des Angebots keine Anwendung. Im Übrigen gelten sämtliche allgemeinen Pflichten der Mitglieder (z.&nbsp;B. zu Immaterialgüterrechten, Persönlichkeitsrechten, Missbrauchsverboten, technischen Eingriffen und Haftungsbeschränkungen) sinngemäss auch im Wohnen-Bereich. Bei Widersprüchen zwischen den allgemeinen Marktplatz-Regeln und den vorstehenden Ziffern 1.5.1–1.5.9 gehen die Regeln zu Helvenda Wohnungen für diesen Funktionsbereich vor.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4">2 Mitgliedschaft</h2>

                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3 mt-4 sm:mt-6">2.1 Zweck</h3>
                  <p className="text-sm sm:text-base mb-3 sm:mb-4">
                    Voraussetzung für das Anbieten und den Kauf von Produkten auf dem Marktplatz, für die Benutzung von damit zusammenhängenden Webseitenfunktionen sowie für die Benutzung passwortgeschützter Bereiche der Webseiten (insbesondere eines persönlichen Kontos) ist die Mitgliedschaft als angemeldeter Benutzer. Um sämtliche Funktionen des Marktplatzes als Mitglied nutzen zu können (insb. verkaufen und unbeschränkt kaufen), sind verschiedene Verifikationsstufen vorgesehen bzw. können verlangt werden (z.B. die Eingabe eines postalisch zugesendeten Aktivierungscodes).
                  </p>

                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3 mt-4 sm:mt-6">2.2 Beschreibung</h3>
                  <p className="text-sm sm:text-base mb-3 sm:mb-4">
                    Anmeldung und Mitgliedschaft sind kostenlos. Die Mitgliedschaft ist persönlich und nicht übertragbar.
                  </p>

                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3 mt-4 sm:mt-6">2.3 Mindestvoraussetzungen für die Mitgliedschaft</h3>

                  <h4 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 mt-3 sm:mt-4">2.3.1 Handlungsfähigkeit</h4>
                  <p className="text-sm sm:text-base mb-3 sm:mb-4">
                    Die Mitgliedschaft steht nur unbeschränkt handlungsfähigen, natürlichen oder juristischen Personen offen. Von der Mitgliedschaft ausgeschlossen sind minderjährige Personen (Personen unter 18 Jahren).
                  </p>

                  <h4 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 mt-3 sm:mt-4">2.3.2 Persönliche Angaben</h4>
                  <p className="text-sm sm:text-base mb-3 sm:mb-4">
                    Die bei der Anmeldung einzugebenden Angaben müssen jederzeit vollständig und korrekt sein und enthalten grundsätzlich zwingend folgendes: vollständiger Vor- und Nachname, Geburtsdatum, Adresse des aktuellen Hauptwohnsitzes, Telefonnummer (keine Mehrwertdienstenummer wie z.B. 0900er-Nummern), gültige E-Mail-Adresse. Bei der Anmeldung eines Unternehmens bzw. eines gewerblichen Mitgliederkontos sind der Name der Kontaktperson und überdies die vollständige Firma anzugeben (inkl. MwSt.-und Handelsregister-Nr sofern vorhanden). Bei Änderungen ist das Mitglied verpflichtet, diese umgehend im persönlichen Benutzerkonto nachzuführen, so dass die Angaben jederzeit vollständig und korrekt sind.
                  </p>
                  <p className="text-sm sm:text-base mb-3 sm:mb-4">
                    Helvenda kann jederzeit für spezifische Funktionen zusätzliche Angaben und/oder Verifikationen vorsehen oder darauf verzichten.
                  </p>
                  <p className="text-sm sm:text-base mb-3 sm:mb-4">
                    Der vom Mitglied zu wählende Benutzername darf weder obszön, herabsetzend noch auf sonstige Weise anstössig sein. Der Benutzername darf zudem weder einen Hinweis auf eine E-Mail- oder Internet-Adresse enthalten noch Rechte Dritter verletzen.
                  </p>

                  <h4 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 mt-3 sm:mt-4">2.3.3 Personen mit Sitz im Ausland</h4>
                  <p className="text-sm sm:text-base mb-3 sm:mb-4">
                    Personen mit Wohnsitz/Sitz im Ausland können den Marktplatz grundsätzlich nur als Käufer nutzen. Um Angebote einstellen zu können, muss vorab die Zustimmung von Helvenda eingeholt werden, wobei grundsätzlich nur gewerbliche Anbieter bzw. juristische Personen zugelassen werden. Die entsprechende Anfrage inkl. Gewerbenachweis ist zu richten an: support@helvenda.ch.
                  </p>

                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3 mt-4 sm:mt-6">2.4 Beginn und Beendigung der Mitgliedschaft</h3>

                  <h4 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 mt-3 sm:mt-4">2.4.1 Beginn</h4>
                  <p className="text-sm sm:text-base mb-3 sm:mb-4">
                    Die Mitgliedschaft beginnt mit der Zusendung einer E-Mail-Bestätigung durch Helvenda nach erfolgter Registrierung und Zustimmung zu diesen AGB.
                  </p>

                  <h4 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 mt-3 sm:mt-4">2.4.2 Beendigung durch das Mitglied</h4>
                  <p className="text-sm sm:text-base mb-3 sm:mb-4">
                    Die Beendigung der Mitgliedschaft ist, sofern alle nachfolgenden Bedingungen erfüllt sind, jederzeit durch eine Kündigung per E-Mail an support@helvenda.ch möglich:
                  </p>
                  <ul className="list-disc list-inside text-sm sm:text-base mb-3 sm:mb-4 ml-2 sm:ml-4 space-y-1 sm:space-y-2">
                    <li>Der Kontostand des Mitglieds ist ausgeglichen, d.h. es besteht kein Saldo zugunsten von Helvenda.</li>
                    <li>Das Mitglied bietet aktuell keine Produkte auf Helvenda an.</li>
                    <li>Das Mitglied ist nicht als Bieter an einer laufenden Auktion beteiligt.</li>
                  </ul>
                  <p className="text-sm sm:text-base mb-3 sm:mb-4">
                    Ist eine der Bedingungen nicht erfüllt, ist die Kündigung ungültig. Der Kundendienst von Helvenda bestätigt mit einem E-Mail die Kündigung und schliesst das entsprechende Konto. Allfällige abgegebene und erhaltene Bewertungen sowie „Fragen & Antworten" eines Mitglieds erscheinen auch nach dessen Kündigung der Mitgliedschaft weiterhin auf Helvenda.
                  </p>

                  <h4 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 mt-3 sm:mt-4">2.4.3 Beendigung durch Helvenda</h4>
                  <p className="text-sm sm:text-base mb-3 sm:mb-4">
                    Helvenda ist berechtigt, ein Mitglied aus sachlichen Gründen, insbesondere bei Missachtung der AGB, jederzeit auszuschliessen (d.h. die Mitgliedschaft zu kündigen), eine Nutzung zu verbieten oder eine Dienstleistung einzustellen, ohne dass dem betreffenden Mitglied hieraus Ansprüche gegenüber Helvenda erwachsen. Helvenda ist berechtigt, ein Mitglied vorübergehend zu sperren oder definitiv auszuschliessen, wenn es wahrscheinlich erscheint, dass ein anderes bereits gesperrtes oder ausgeschlossenes Mitglied (wie z.B. Familienangehörige oder Hausgenossen) über dieses Konto Geschäfte abwickelt, oder wenn ein begründeter Verdacht besteht, dass das Mitglied Rechte Dritter verletzt hat.
                  </p>
                  <p className="text-sm sm:text-base mb-3 sm:mb-4">
                    Erfolgsprovision sowie Gebühren für Boosts zuzüglich allfälliger Mahnspesen und Umtriebsentschädigungen sind auch bei einem Ausschluss weiterhin geschuldet.
                  </p>
                  <p className="text-sm sm:text-base mb-3 sm:mb-4">
                    Allfällige abgegebene und erhaltene Bewertungen sowie „Fragen & Antworten" eines Mitglieds erscheinen auch nach der Beendigung der Mitgliedschaft weiterhin auf dem Marktplatz.
                  </p>
                  <p className="text-sm sm:text-base mb-3 sm:mb-4">
                    Ausgeschlossene Mitglieder haben kein Recht, sich ohne vorgängig eingeholtes Einverständnis von Helvenda wieder als Mitglied anzumelden, sei es unter eigenem, sei es unter fremdem Namen. Widerhandlungen gegen diese Bestimmung werden mit CHF 100.– in Rechnung gestellt.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4">3 Mitgliederpflichten allgemein</h2>

                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3 mt-4 sm:mt-6">3.1 Geheimhaltung der Zugangsdaten</h3>
                  <p className="text-sm sm:text-base mb-3 sm:mb-4">
                    Das Mitglied ist verpflichtet, das ihm von Helvenda im Rahmen seiner Anmeldung mitgeteilte oder selbst erstellte, persönliche Passwort sowie den postalisch erhaltenen Aktivierungscode jederzeit geheim zu halten und niemals Dritten bekannt zu geben oder zugänglich zu machen.
                  </p>

                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3 mt-4 sm:mt-6">3.2 Technische Eingriffe</h3>
                  <p className="text-sm sm:text-base mb-3 sm:mb-4">
                    Die Verwendung von Mechanismen, Software oder sonstiger Scripts, die den ordnungsgemässen Betrieb der Webseite stören könnten, ist untersagt.
                  </p>
                  <p className="text-sm sm:text-base mb-3 sm:mb-4">
                    Mitglieder dürfen keine Massnahmen ergreifen, die eine unzumutbare oder übermässige Belastung der Infrastruktur von Helvenda zur Folge haben könnten.
                  </p>
                  <p className="text-sm sm:text-base mb-3 sm:mb-4">
                    Es ist Mitgliedern untersagt, von Helvenda generierte Inhalte zu blockieren, zu überschreiben oder zu modifizieren oder in sonstiger Weise störend in die Webseiten von Helvenda einzugreifen.
                  </p>

                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3 mt-4 sm:mt-6">3.3 Immaterialgüterrechte (Geistiges Eigentum)</h3>
                  <p className="text-sm sm:text-base mb-3 sm:mb-4">
                    Sämtliche Rechte (z.B. Urheber- und Markenrechte) am Marktplatz und den damit zusammenhängenden Produkten sind Eigentum der Helvenda (nachfolgend "Helvenda-Immaterialgüterrechte").
                  </p>
                  <p className="text-sm sm:text-base mb-3 sm:mb-4">
                    Soweit die vertragsgemässe Nutzung des Marktplatzes oder der Produkte die Einräumung von Nutzungsrechten an den Helvenda-Immaterialgüterrechten voraussetzt, werden diese dem Mitglied persönlich, nicht-exklusiv und unübertragbar für die Dauer und den Umfang der vertraglichen Vereinbarung erteilt. Eine Nutzung der Helvenda-Immaterialgüterrechte für andere Zwecke ist dem Mitglied untersagt.
                  </p>
                  <p className="text-sm sm:text-base mb-3 sm:mb-4">
                    Angebote, Texte und bildliche Darstellungen und sonstige Inhalte, die das Mitglied zur Publikation auf dem Marktplatz an Helvenda übermittelt, stehen dem Mitglied zu, sofern diese urheberrechtlich geschützt sind ("Mitglieder-Inhalte").
                  </p>
                  <p className="text-sm sm:text-base mb-3 sm:mb-4">
                    Das Mitglied bestätigt, dass es berechtigt ist, über die Mitglieder-Inhalte zu verfügen, und dass es dadurch keine Rechte Dritter verletzt. Das Mitglied darf auf dem Marktplatz einzig Bilder und Texte verwenden und publizieren, welche es selbst erstellt hat oder deren Verwendung der Rechteinhaber zugestimmt hat; dies gilt insbesondere auch für Text- und Bildmaterial, welches auf einer anderen Webseite öffentlich zugänglich ist. Helvenda ist nicht verpflichtet, die Berechtigung des Mitglieds an den Mitglieder-Inhalten zu prüfen. Helvenda kann vom Mitglied jedoch einen Berechtigungsnachweis verlangen.
                  </p>
                  <p className="text-sm sm:text-base mb-3 sm:mb-4">
                    Das Mitglied erteilt Helvenda
                  </p>
                  <ul className="list-disc list-inside text-sm sm:text-base mb-3 sm:mb-4 ml-2 sm:ml-4 space-y-1 sm:space-y-2">
                    <li>(i) an den Mitglieder-Inhalten sämtliche Nutzungsrechte, welche Helvenda zur Erbringung ihrer Leistungen benötigt (z.B. das Recht zur Vervielfältigung, Speicherung, Anpassung, Übersetzung, Aufschaltung, Publikation und Übertragung; nachfolgend die 'Nutzungsrechte');</li>
                    <li>(ii) sämtliche Nutzungsrechte an den Mitglieder-Inhalten für die Vermarktung des Marktplatzes z.B. in Form von Online-, Display-, Plakat-, Messe- und TV-Werbung während und ein Jahr nach deren Verwendung auf dem Marktplatz;</li>
                    <li>(iii) das Recht, Mitglieder-Inhalte während und über deren Verwendung auf dem Marktplatz hinaus für Zwecke der Analyse, Weiterentwicklung der Plattform sowie der Produktentwicklung zu nutzen.</li>
                  </ul>

                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3 mt-4 sm:mt-6">3.4 Persönlichkeitsrechte Dritter</h3>
                  <p className="text-sm sm:text-base mb-3 sm:mb-4">
                    Angebote, Texte und bildliche Darstellungen, welche ein Mitglied auf dem Marktplatz in irgendeiner Art und Form (Angebotsbeschreibungen, Bewertungen, Einträge im Rahmen der „Fragen und Antworten-Funktion", etc.) veröffentlicht oder auf sonstige Weise über den Marktplatz kommuniziert, dürfen keinerlei Persönlichkeitsrechte Dritter verletzen; insbesondere dürfen sie nicht beleidigend, obszön, diffamierend, belästigend, ehrverletzend, verunglimpfend, herabsetzend, rufschädigend u.ä. sein.
                  </p>

                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3 mt-4 sm:mt-6">3.5 Keine Werbung</h3>
                  <p className="text-sm sm:text-base mb-3 sm:mb-4">
                    Angebote, Texte und bildliche Darstellungen, welche ein Mitglied auf dem Marktplatz in irgendeiner Art und Form (Angebotsbeschreibungen, Bewertungen, Einträge im Rahmen der „Fragen und Antworten-Funktion", Text für End-E-Mails, Nachricht an Käufer etc.) veröffentlicht oder auf sonstige Weise über den Marktplatz kommuniziert, dürfen keine Form von Werbung für Produkte enthalten, welche dieses Mitglied nicht selbst aktuell oder in unmittelbarer Zukunft über den Marktplatz anbietet.
                  </p>

                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3 mt-4 sm:mt-6">3.6 Links und Web-Adressen</h3>
                  <p className="text-sm sm:text-base mb-3 sm:mb-4">
                    Die auf dem Marktplatz veröffentlichten Angebote und Inhalte (inkl. Bilder) dürfen keinerlei URL-Links oder Web-Adressen enthalten. Davon ausgenommen sind Angebote in Form von Kleinanzeigen sowie die in der <a href="/forbidden-items" className="text-primary-600 hover:underline">allgemeinen Verbotsliste</a> aufgeführten Ausnahmen.
                  </p>

                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3 mt-4 sm:mt-6">3.7 Nutzung von Inhalten</h3>
                  <p className="text-sm sm:text-base mb-3 sm:mb-4">
                    Die in einem Angebot einsehbaren Informationen über einen Verkäufer oder sonstige Informationen, welche Helvenda allenfalls im Zusammenhang mit Angeboten übermittelt, dürfen nur im Zusammenhang mit dem entsprechenden Angebot benutzt werden; insbesondere ist eine Verwendung zu Werbezwecken untersagt. Es ist zudem nicht gestattet, diese Informationen für den Versand von Newslettern zu verwenden oder an Dritte weiterzugeben.
                  </p>

                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3 mt-4 sm:mt-6">3.8 Kein Vertragsschluss ausserhalb des Marktplatzes</h3>
                  <p className="text-sm sm:text-base mb-3 sm:mb-4">
                    Texte und bildliche Darstellungen, welche ein Mitglied auf dem Marktplatz in irgendeiner Art und Form (Angebot, Kleinanzeige, Bewertung, im Rahmen der „Fragen und Antworten-Funktion", etc.) veröffentlicht, dürfen nicht auf Vertragsabschlüsse ausserhalb des Marktplatzes abzielen oder dazu direkt oder indirekt auffordern.
                  </p>

                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3 mt-4 sm:mt-6">3.9 Keine Manipulation von Auktionen durch Gebote</h3>
                  <p className="text-sm sm:text-base mb-3 sm:mb-4">
                    Es ist verboten, durch die Verwendung mehrerer Helvenda-Konten oder im Zusammenwirken mit Konten Dritter (z.B. im gleichen Haushalt wohnenden Personen oder Familienangehörigen) die Preise eigener oder fremder Angebote zu manipulieren.
                  </p>
                  <p className="text-sm sm:text-base mb-3 sm:mb-4">
                    Zudem ist die Abgabe von Geboten mittels automatisierter Datenverarbeitungsprozesse verboten.
                  </p>

                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3 mt-4 sm:mt-6">3.10 Wahrheitsgemässe Benutzung des Bewertungssystems</h3>
                  <p className="text-sm sm:text-base mb-3 sm:mb-4">
                    Der Benutzer ist verpflichtet, in den von ihm abgegebenen Bewertungen wahrheitsgemässe Angaben zu machen. Die Bewertungen müssen sachlich sein und dürfen keine persönlichen Beleidigungen enthalten. Es ist nicht erlaubt, in einer Bewertung Werbung einfliessen zu lassen (z.B. Angabe einer www-Adresse, etc.). Jede unlautere Einflussnahme auf das eigene oder auf fremde Bewertungsprofile oder Bewertungen sowie jeder Missbrauch des Bewertungssystems sind untersagt. Es ist zudem nicht erlaubt, in einer Bewertung persönliche Benutzerangaben zu nennen. Es ist ebenfalls nicht gestattet, irreführende Bewertungen abzugeben oder das Bewertungssystem zum eigenen Vorteil zu manipulieren. Helvenda ist jederzeit und ohne Rückfrage berechtigt, aber nicht verpflichtet, ausnahmsweise ins autonome Bewertungssystem einzugreifen und Bewertungen zu löschen und/oder zu berichtigen.
                  </p>

                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3 mt-4 sm:mt-6">3.11 Verbot der Umgehung der Gebührenstruktur</h3>
                  <p className="text-sm sm:text-base mb-3 sm:mb-4">
                    Es ist verboten, Handlungen vorzunehmen die dazu dienen, die Gebührenstruktur von Helvenda zu umgehen (z.B. Angebote mit unverhältnismässig hohen Versandkosten).
                  </p>
                </section>

                <section>
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4">4 Marktplatzbetrieb bei Helvenda</h2>

                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3 mt-4 sm:mt-6">4.1 Unzulässige Angebote</h3>
                  <p className="text-sm sm:text-base mb-3 sm:mb-4">
                    Helvenda ist befugt, das Anbieten bestimmter Produkte und Produktgruppen auf dem Marktplatz jederzeit nach eigenem Ermessen und ohne Angabe von Gründen zu verbieten. Eine nicht abschliessende, laufend aktualisierte Übersicht findet sich in der <a href="/forbidden-items" className="text-primary-600 hover:underline">allgemeinen Verbotsliste</a>.
                  </p>

                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3 mt-4 sm:mt-6">4.2 Veröffentlichte Inhalte, Angebote und Gebote; Kategorien</h3>
                  <p className="text-sm sm:text-base mb-3 sm:mb-4">
                    Helvenda ist befugt, jederzeit einzelne Angebote, Gebote sowie Text- und Bildmaterial auf der Webseite ohne Rückfrage und ohne Angabe von Gründen zu löschen. Dies gilt insbesondere auch für Angebote, die in einer unzutreffenden Marktplatzkategorie eingestellt wurden, offensichtlich nicht ernst gemeinte Gebote und Text oder Bildmaterial, das die Rechte Dritter verletzen könnte. Aus entsprechenden Löschungen können keinerlei Ansprüche gegen Helvenda abgeleitet werden.
                  </p>
                  <p className="text-sm sm:text-base mb-3 sm:mb-4">
                    Helvenda ist überdies jederzeit ohne Vorankündigung und Begründung befugt, Angebotskategorien umzubenennen, aufzuteilen, zusammenzulegen, aufzuheben oder neu einzuführen und aktuelle Angebote entsprechend in eine andere Kategorie zu verschieben oder zu löschen.
                  </p>

                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3 mt-4 sm:mt-6">4.3 Wiederverwendung von veröffentlichten Inhalten</h3>
                  <p className="text-sm sm:text-base mb-3 sm:mb-4">
                    Der Nutzer gewährt Helvenda das nicht-exklusive Recht, den Inhalt des ursprünglichen Angebots, das auf Helvenda veröffentlicht wurde, zu nutzen und mit anderen Nutzern zu teilen.
                  </p>

                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3 mt-4 sm:mt-6">4.4 Verletzungen der AGB durch ein Mitglied</h3>
                  <p className="text-sm sm:text-base mb-3 sm:mb-4">
                    Helvenda ist befugt, ein Mitglied zu verwarnen, wenn glaubhafte, konkrete Hinweise dafür vorliegen, dass dieses Mitglied die vorliegenden AGB verletzt hat. Helvenda ist insbesondere berechtigt, ein Mitglied zu verwarnen, wenn glaubhafte, konkrete Hinweise dafür vorliegen, dass das Mitglied mutwillig seine Vertragspflichten gegenüber einem anderen Mitglied verletzt hat.
                  </p>
                  <p className="text-sm sm:text-base mb-3 sm:mb-4">
                    Vorbehalten bleibt das Recht, ein Mitglied von der Mitgliedschaft auszuschliessen (siehe: Mitgliedschaft / Beendigung durch Helvenda).
                  </p>

                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3 mt-4 sm:mt-6">4.5 Änderungen der Angebotslaufzeit</h3>
                  <p className="text-sm sm:text-base mb-3 sm:mb-4">
                    Helvenda ist berechtigt, aber nicht verpflichtet, die Laufzeit von Angeboten zu verlängern oder zu verkürzen, soweit dies zur ordnungsgemässen Durchführung des Angebots als notwendig erscheint (vgl. auch Technische Störungen / Wartung).
                  </p>
                </section>

                <section>
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4">5 Verkäuferpflichten</h2>

                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3 mt-4 sm:mt-6">5.1 Verfügungsmacht über das angebotene Produkt</h3>
                  <p className="text-sm sm:text-base mb-3 sm:mb-4">
                    Der Verkäufer darf lediglich Produkte anbieten, hinsichtlich derer er verfügungsberechtigt ist. Das bedeutet namentlich, ohne hierauf beschränkt zu sein, dass das Mitglied den Besitz und Eigentum vollständig und unbelastet auf den Käufer zu übertragen fähig und berechtigt ist; dass er zur Vermietung eines Objektes berechtigt ist und, dass er zur Übertragung eines Rechts befugt ist.
                  </p>

                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3 mt-4 sm:mt-6">5.2 Kein Verkauf verbotener Artikel</h3>
                  <p className="text-sm sm:text-base mb-3 sm:mb-4">
                    Es ist verboten, Produkte anzubieten, deren Angebot, Verkauf, Kauf, Abgabe oder Verwendung gegen gesetzliche Vorschriften oder gegen die guten Sitten verstossen könnten. Helvenda führt eine nicht abschliessende und laufend aktualisierte <a href="/forbidden-items" className="text-primary-600 hover:underline">Verbotsliste</a> (vgl. Marktplatzbetrieb / Unzulässige Angebote) von Produkten, deren Angebot oder Bewerbung ohne vorgängige ausdrückliche Erlaubnis von Helvenda verboten ist. Unabhängig von der Eintragung eines Produkts auf der Liste behält sich Helvenda das jederzeitige Recht vor, Angebote zu löschen und die zuständigen Behörden oder verletzte Dritte zu orientieren.
                  </p>

                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3 mt-4 sm:mt-6">5.3 Wahrheitsgemässe und vollständige Angaben über die Kaufsache</h3>
                  <p className="text-sm sm:text-base mb-3 sm:mb-4">
                    Der Verkäufer ist verpflichtet, wahrheitsgemässe, nicht irreführende und nicht unlautere Angaben über das angebotene Produkt zu machen und über die Einzelheiten der Zahlung und Lieferung vollständig zu informieren. Alle Mängel des Produktes bzw. der Verpackung sind anzugeben. Dies gilt insbesondere auch bei gebrauchten bzw. verpackungsgeschädigten Produkten. Der Verkäufer ist verpflichtet, sein Angebot in einer zutreffenden Produktekategorie auf dem Marktplatz zu veröffentlichen.
                  </p>

                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3 mt-4 sm:mt-6">5.4 Kein Zwischenverkauf</h3>
                  <p className="text-sm sm:text-base mb-3 sm:mb-4">
                    Es ist dem Verkäufer untersagt, das eingestellte Produkt während der Angebotsdauer anderweitig zu veräussern oder Dritten Rechte daran einzuräumen.
                  </p>

                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3 mt-4 sm:mt-6">5.5 Erfolgsprovision und Angebots-Boosts</h3>
                  <p className="text-sm sm:text-base mb-3 sm:mb-4">
                    Das Einstellen von Artikeln auf Helvenda ist kostenlos.
                  </p>
                  <p className="text-sm sm:text-base mb-3 sm:mb-4">
                    Der Verkäufer hat beim erfolgreichen Verkaufsabschluss eine Erfolgsprovision gemäss Gebührenreglement an Helvenda zu bezahlen. Alle vorgenannten Gebühren sind nach 14 Tagen fällig und können, nach Eingang der Zahlung, als Beleg in der Gebührenübersicht heruntergeladen werden. Die Höhe der Gebühren sowie die entsprechende Rechnungsstellung und Zahlungsbedingungen sind nachfolgend sowie aus dem jeweils aktuellen Gebührenreglement ersichtlich. Helvenda behält sich das Recht vor, die Gebührenhöhe für neue Angebote jederzeit anzupassen. Eine Löschung oder Änderung eines Angebots während seiner Laufdauer durch den Verkäufer berechtigt diesen nicht zur Rückerstattung oder Reduktion der angefallenen Gebühren für Boosts. Je nach Art der Angebotsänderung können zusätzliche Gebühren anfallen, insbesondere durch die Auswahl zusätzlicher Boosts.
                  </p>

                  <h4 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 mt-3 sm:mt-4">5.5.1 Reaktivierung von Angeboten</h4>
                  <p className="text-sm sm:text-base mb-3 sm:mb-4">
                    Bei der Erstellung eines Angebotes kann der Verkäufer bestimmen, ob dieses automatisch durch das System reaktiviert werden soll, falls bei Angebotsende kein Gebot vorliegt. Ein im Auktionsformat zum Verkauf angebotener Artikel kann bis zu 3 Mal automatisch reaktiviert werden. Ein im Fixpreisformat zum Verkauf angebotener Artikel kann nicht automatisch reaktiviert werden, ausser bei Mehrfachangeboten (Stückzahl &gt;1), bei denen mindestens ein Stück verkauft wurde. Basis für die Berechnung der Gebühren bei einer Reaktivierung bilden die hinterlegten Daten des zuletzt abgelaufenen Angebotes. Die zum entsprechenden Reaktivierungszeitpunkt geltenden Gebühren für freiwillige Boosts werden bei jeder Aufschaltung sofort fällig und dem Helvenda-Konto des Verkäufers jeweils automatisch belastet. Diese Regelung gilt auch für manuelle Reaktivierungen über das Benutzerkonto.
                  </p>

                  <h4 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 mt-3 sm:mt-4">5.5.2 Zeitpunkt der Zahlungsaufforderung (früher Rechnungsstellung)</h4>
                  <p className="text-sm sm:text-base mb-3 sm:mb-4">
                    Offene Gebühren werden 14 Tage, nachdem diese angefallen sind, zur Zahlung fällig. Die Zahlungsaufforderung wird per E-Mail zugestellt, sofern das Total der offenen Gebühren 14 Tage nach dem Anfallen der ältesten offenen Gebühr mindestens CHF 1.01 beträgt. Offene Beträge unter CHF 1.01 werden von Helvenda periodisch eingefordert.
                  </p>
                  <p className="text-sm sm:text-base mb-3 sm:mb-4">
                    Ein Beleg (mehrwertsteuerkonform) wird nach Bezahlung für die gedeckten Gebühren erstellt und kann jederzeit auf der Gebührenübersicht heruntergeladen werden.
                  </p>

                  <h4 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 mt-3 sm:mt-4">5.5.3 Zahlungsfrist</h4>
                  <p className="text-sm sm:text-base mb-3 sm:mb-4">
                    Der Nutzer erhält eine Zahlungsaufforderung und Zahlungserinnerungen per E-Mail. In der Gebührenübersicht sind sämtliche Gebühren, Zahlungen, Gutschriften und Rückerstattungen aufgeführt. Deren Summe ergibt den jeweiligen Kontosaldo, welcher 14 Tage nach Anfallen der ältesten Gebühr und sobald er CHF 1.00 übersteigt, zur Zahlung fällig wird. Das Mitglied ist auch dann zur Zahlung verpflichtet, wenn es aus technischen Gründen keine Zahlungsaufforderung erhält. Offene Gebühren sind zahlbar nach Erhalt der Zahlungsaufforderung. 30 Tage nach Erhalt der Zahlungsaufforderung wird die erste Zahlungserinnerung (Mahnung) und 44 Tage nach Erhalt der Zahlungsaufforderung die letzte Mahnung per E-Mail verschickt. Helvenda hat das Recht, nach der ersten Zahlungserinnerung Mahnspesen von CHF 10.00 zu belasten. Bei Nichtbezahlung des fälligen Kontosaldos einschliesslich Mahnspesen wird das Benutzerkonto automatisch 58 Tage nach Zahlungsaufforderung blockiert. Im Wiederholungsfall kann Helvenda ein Mitglied vom Handel auf Helvenda ausschliessen. Helvenda behält sich vor, den Gesamtausstand einem Inkassobüro zu übergeben, das nach den Regeln und mit den definierten Gebühren von www.fairpay.ch arbeitet.
                  </p>

                  <h4 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 mt-3 sm:mt-4">5.5.4 Zahlungsweise</h4>
                  <p className="text-sm sm:text-base mb-3 sm:mb-4">
                    Die offenen Gebühren können mit den nachstehenden Möglichkeiten bezahlt werden. Je nach Zahlungsweise können Buchungsspesen von CHF 4.50 belastet werden.
                  </p>
                  <ul className="list-disc list-inside text-sm sm:text-base mb-3 sm:mb-4 ml-2 sm:ml-4 space-y-1 sm:space-y-2">
                    <li>Zahlung mit Kreditkarte (Mastercard, Visa oder American Express)</li>
                    <li>Zahlung mit Apple Pay</li>
                    <li>Zahlung via E-Banking über das Internet (spesenfrei bei Verwendung des von Helvenda angegebenen QR-Codes, sonst CHF 4.50 Buchungsspesen)</li>
                    <li>Zahlung am Bank- oder Postschalter (CHF 4.50 Buchungsspesen)</li>
                    <li>Zahlung in Euro (CHF 4.50 Buchungsspesen)</li>
                  </ul>

                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3 mt-4 sm:mt-6">5.6 Gebührenrückerstattung</h3>

                  <h4 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 mt-3 sm:mt-4">5.6.1 Rückerstattung von Erfolgsprovisionen</h4>
                  <p className="text-sm sm:text-base mb-3 sm:mb-4">
                    Erfolgsprovisionen werden auf Antrag des Verkäufers zurückerstattet, wenn der Käufer den Kaufpreis nicht bezahlt, der Verkäufer jedoch etwaige Obliegenheiten zur Mitwirkung ordnungsgemäss erfüllt hat (Vertragsrücktritt, siehe: Verhältnis Verkäufer - Käufer / Rücktritt). Heben die Parteien den Vertrag im gegenseitigen Einvernehmen auf, um so einen Streitfall zu lösen, kann der Verkäufer ebenfalls die Gutschrift der angefallenen Erfolgsprovision beantragen. Der Verkäufer hat den Antrag mittels Online-Formular in seinem Benutzerzentrum zu stellen. Dieser Antrag muss in jedem Fall spätestens 60 Tage nach Abschluss des Verkaufes (Auktionsende) gestellt werden. Später erfolgende Rückerstattungsanträge werden nicht berücksichtigt und der Verkäufer hat keinen Anspruch auf eine Rückerstattung der Erfolgsprovision. Wenn ein Rückerstattungsantrag betreffend Erfolgsprovision durch Helvenda genehmigt wird, werden die entsprechenden Gebühren dem Helvenda-Konto des Verkäufers auf Helvenda gutgeschrieben. Der Verkäufer hat, ausser bei Beendigung seiner Mitgliedschaft, kein Anrecht auf eine Auszahlung in bar oder auf eine Überweisung dieser Gebühren. Dies gilt auch für Rückerstattungen von Gebühren für Angebote, welche von Helvenda gelöscht wurden.
                  </p>

                  <h4 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 mt-3 sm:mt-4">5.6.2 Rückerstattung von Angebots-Boosts</h4>
                  <p className="text-sm sm:text-base mb-3 sm:mb-4">
                    Boosts werden grundsätzlich nicht rückerstattet.
                  </p>
                  <p className="text-sm sm:text-base mb-3 sm:mb-4">
                    Wird ein Angebot durch Helvenda gelöscht, weil es die Allgemeinen Geschäftsbedingungen verletzt hat, besteht kein Anspruch auf Rückerstattung der Boosts. Wird ein Angebot fälschlicherweise eingestellt und/oder wird ein Angebot durch den Verkäufer selber gelöscht, bleiben die Gebühren für Boosts trotzdem geschuldet und werden nicht zurückerstattet. Dies gilt auch für geplante, (noch) nicht aktivierte Angebote.
                  </p>

                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3 mt-4 sm:mt-6">5.7 Mehrwertsteuer auf Umsätzen, die der Verkäufer auf Helvenda erzielt</h3>
                  <ul className="list-disc list-inside text-sm sm:text-base mb-3 sm:mb-4 ml-2 sm:ml-4 space-y-1 sm:space-y-2">
                    <li>Fällt bei Verkäufen, die der Verkäufer auf Helvenda tätigt, eine Mehrwertsteuerbelastung von Helvenda nach Art. 20a MWSTG an, so wird Helvenda dem Verkäufer diese Mehrwertsteuer belasten.</li>
                    <li>Die Mehrwertsteuer gilt als im Verkaufspreis (inklusive Versandgebühren) inbegriffen, den der Verkäufer erzielt (vor Abzug der Erfolgsprovision) und wird auf dieser Basis zum im Zeitpunkt des Verkaufs anwendbaren Steuersatz berechnet.</li>
                    <li>Der mehrwertsteuerpflichtige Verkäufer kann seine auf Helvenda getätigten Verkäufe nicht nach Art. 43a freiwillig selbst versteuern und nimmt zur Kenntnis, dass Helvenda keine dahingehende Einwilligung erteilt.</li>
                    <li>Verkäufer sind verpflichtet, alle für die Besteuerung nach MWSTG benötigten Angaben (z.B. Angaben über die Mehrwertsteuerpflicht, die Mehrwertsteuernummer) auf Anfrage vollständig und wahrheitsgemäss an Helvenda zu übermitteln und Helvenda bei Änderungen sofort zu benachrichtigen.</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4">6 Verhältnis Verkäufer – Käufer</h2>

                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3 mt-4 sm:mt-6">6.1 Allgemeines</h3>
                  <p className="text-sm sm:text-base mb-3 sm:mb-4">
                    Helvenda übernimmt keine Gewähr dafür, dass Mitglieder sich beim Handel über den Marktplatz nach den Grundsätzen von Treu und Glauben verhalten. Helvenda übernimmt insbesondere keine Gewähr dafür, dass Mitglieder ihren untereinander allenfalls bestehenden Vertragspflichten nachkommen.
                  </p>

                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3 mt-4 sm:mt-6">6.2 Angebotsverlauf bei Auktionen und Angeboten zum Fix- oder Sofort-kaufen-Preis</h3>

                  <h4 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 mt-3 sm:mt-4">6.2.1 Verbindlichkeit des Angebots</h4>
                  <p className="text-sm sm:text-base mb-3 sm:mb-4">
                    Solange kein Gebot vorliegt, ist der Verkäufer berechtigt, sein Angebot zu löschen und damit zurückzuziehen. Sobald ein Gebot vorliegt, ist der Verkäufer an das Angebot gebunden.
                  </p>

                  <h4 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 mt-3 sm:mt-4">6.2.2 Form der Gebote</h4>
                  <p className="text-sm sm:text-base mb-3 sm:mb-4">
                    Das Gebot kann nur in der dafür vorgesehenen Eingabemaske auf der entsprechenden Angebotsseite gültig eingegeben werden. Gebote in anderer Form, insbesondere per E-Mail, sind nicht gültig und unbeachtlich.
                  </p>

                  <h4 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 mt-3 sm:mt-4">6.2.3 Verbindlichkeit des Gebots</h4>
                  <p className="text-sm sm:text-base mb-3 sm:mb-4">
                    Mit der Abgabe eines Gebots erklärt der Bieter den Kauf des angebotenen Produkts zu den vom Verkäufer festgelegten oder mit diesem individuell vereinbarten Konditionen (Zahlungsmodalitäten, Transportweise, Lieferkosten etc.) für den Fall, dass er bei Auktionsende der Meistbietende ist. Der Bieter ist an sein Gebot gebunden, solange er nicht überboten worden ist.
                  </p>
                  <p className="text-sm sm:text-base mb-3 sm:mb-4">
                    Die Abänderung oder die Rücknahme eines Gebots ist nicht zulässig. Bei Mehrfachauktionen erlischt das Gebot erst dann, wenn höhere Gebote die gesamte Stückzahl der Auktion erschöpft haben. Wird der Bieter im Rahmen einer Mehrfachauktion nur in Bezug auf einen Teil der gewünschten Produkte überboten, ist er gleichwohl zur Abnahme der an ihn verkauften Anzahl von Produkte verpflichtet.
                  </p>
                  <p className="text-sm sm:text-base mb-3 sm:mb-4">
                    Wird ein Gebot gelöscht, lebt das zweithöchste Gebot nur mit ausdrücklicher Zustimmung des entsprechenden Bieters wieder auf.
                  </p>
                  <p className="text-sm sm:text-base mb-3 sm:mb-4">
                    Wird der Angebotsbeschrieb nach Abgabe eines Gebots geändert und lässt diese Änderung das angebotene Produkt nicht wertvoller erscheinen, so ist der zu diesem Zeitpunkt Höchstbietende, bzw. bei einer Mehrfachauktion diejenigen Bieter, die im Falle eines Abschlusses der Auktion zu diesem Zeitpunkt einen Zuschlag erhalten würden, berechtigt, sein (bzw. ihr) Gebot zurückzunehmen. Entsprechende Anfragen sind per E-Mail an support@helvenda.ch zu richten.
                  </p>
                  <p className="text-sm sm:text-base mb-3 sm:mb-4">
                    Macht ein Mitglied einen „Preisvorschlag" mittels der dafür vorgesehenen Eingabemaske, gibt es damit ein verbindliches Kaufangebot ab. Eine Abänderung oder ein Rückzug der Preisvorschlags ist nicht zulässig. Nimmt der Verkäufer die Preisvorschlags-Offerte innert Frist an, kommt zwischen dem Käufer und dem Verkäufer bezüglich des angebotenen Produkts ein Kauf zu den vom Verkäufer festgelegten Konditionen (Zahlungsmodalitäten, Lieferkonditionen und -kosten etc.) und zu den vom Käufer vorgeschlagenen Preis zustande.
                  </p>
                  <p className="text-sm sm:text-base mb-3 sm:mb-4">
                    Der potenzielle Käufer ist an seinen Preisvorschlag gebunden. Der Preisvorschlag verliert seine Gültigkeit, wenn der Preisvorschlag vom Verkäufer abgelehnt wurde oder die Gültigkeitsdauer des Preisvorschlags (Frist) abgelaufen ist.
                  </p>

                  <h4 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 mt-3 sm:mt-4">6.2.4 Vertragsschluss</h4>
                  <p className="text-sm sm:text-base mb-3 sm:mb-4">
                    Mit dem Ablauf der Angebotsdauer kommt ohne weiteres ein verbindlicher Vertrag zwischen dem Verkäufer und dem Höchstbietenden zustande.
                  </p>
                  <p className="text-sm sm:text-base mb-3 sm:mb-4">
                    Bietet ein Mitglied einen Betrag in der Höhe des Sofort-kaufen-Preises bzw. Fixpreises, kommt unmittelbar ohne weiteres ein verbindlicher Vertrag zwischen ihm und dem Verkäufer zustande.
                  </p>

                  <h4 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 mt-3 sm:mt-4">6.2.5 Vertragsinhalt</h4>

                  <p className="text-sm sm:text-base mb-2"><strong>a) Bedingungen des Verkäufers</strong></p>
                  <p className="text-sm sm:text-base mb-3 sm:mb-4">
                    Der Inhalt des geschlossenen Vertrags bestimmt sich nach der vom Verkäufer aufgeführten Produktbeschreibung (inklusive Ergänzungen wie bspw. Verkäuferangaben, die dieser im Rahmen der Funktion „Fragen und Antworten" veröffentlicht hat) und den von ihm festgelegten Bedingungen, wie sie im Zeitpunkt des erfolgreichen Gebots auf der Angebotswebpage ersichtlich waren, sowie nach etwaigen Absprachen zwischen den Parteien vor dem Vertragsschluss.
                  </p>
                  <p className="text-sm sm:text-base mb-3 sm:mb-4">
                    Der Verkäufer ist verpflichtet, dem Käufer gegen Entrichtung des Kaufpreises den Besitz und das unbelastete, von Rechten Dritter freie Eigentum an der Sache einzuräumen. Diesbezügliche Haftungsausschlüsse sind nicht zulässig.
                  </p>
                  <p className="text-sm sm:text-base mb-3 sm:mb-4">
                    Unzulässig und somit nicht Vertragsinhalt ist eine Überwälzung von Helvenda-Gebühren durch den Verkäufer auf den Käufer.
                  </p>
                  <p className="text-sm sm:text-base mb-3 sm:mb-4">
                    Der Kaufpreis versteht sich immer inklusive allfälliger Mehrwertsteuer, es sei denn, der Verkäufer liefert die Ware direkt aus dem Ausland. Dabei ist der Verkäufer aber verpflichtet, auf sämtliche zusätzlich anfallenden Kosten wie MwSt., Zoll etc. klar erkennbar hinzuweisen.
                  </p>

                  <p className="mb-2 mt-4"><strong>b) Produktbeschreibung</strong></p>
                  <p className="text-sm sm:text-base mb-3 sm:mb-4">
                    Die Produktbeschreibung ist Vertragsinhalt, d.h. der Verkäufer sichert zu, dass das Produkt die beschriebenen Eigenschaften aufweist.
                  </p>
                  <p className="text-sm sm:text-base mb-3 sm:mb-4">
                    Sollen bestimmte Angaben keine Zusicherung darstellen, hat dies der Verkäufer klar und eindeutig zu vermerken.
                  </p>

                  <p className="mb-2 mt-4"><strong>c) Inhalt mangels abweichender Verkäuferbedingungen bei Warenkäufen</strong></p>
                  <p className="text-sm sm:text-base mb-3 sm:mb-4">
                    Gelten zur Zeit der Gebotsabgabe keine abweichenden Bedingungen bzw. keine klar anderslautende Produktbeschreibung des Verkäufers und haben sich die Parteien nicht anders abgesprochen, gilt bei Warenkäufen folgender Vertragsinhalt:
                  </p>
                  <p className="text-sm sm:text-base mb-3 sm:mb-4">
                    Der Verkäufer haftet für Sachmängel, d.h. für nicht beschriebene Mängel, die den Wert oder den Gebrauch der Sache zum vorgesehenen Gebrauch erheblich beeinträchtigen. Insbesondere haftet der Verkäufer mangels klar anderslautender Beschreibung für die Funktionstüchtigkeit eines verkauften Geräts.
                  </p>
                  <p className="text-sm sm:text-base mb-3 sm:mb-4">
                    Die Gefahr des Untergangs des Produkts geht mit Aufgabe zum Versand bzw. mit der Übergabe an den Käufer an diesen über.
                  </p>
                  <p className="text-sm sm:text-base mb-3 sm:mb-4">
                    Eine allfällige Recyclinggebühr ist im Kaufpreis inbegriffen, d.h. vom Käufer nicht zusätzlich zu entrichten. Auf alle im Zusammenhang mit dem Angebot stehenden Streitigkeiten zwischen den Vertragsparteien ist schweizerisches Recht unter Ausschluss des UN-Kaufrechts anwendbar.
                  </p>

                  <h4 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 mt-3 sm:mt-4">6.2.6 Vertragsabwicklung</h4>

                  <p className="text-sm sm:text-base mb-2"><strong>a) Allgemein</strong></p>
                  <p className="text-sm sm:text-base mb-3 sm:mb-4">
                    Beide Vertragsparteien sind verpflichtet, ihren Verpflichtungen aus dem Kaufvertrag vollständig und termingerecht nachzukommen.
                  </p>
                  <p className="text-sm sm:text-base mb-3 sm:mb-4">
                    Anders als in den Staaten der EU existiert in der Schweiz (noch) kein Widerrufsrecht des Verbrauchers. Die Vertragsabwicklung ist Sache der Parteien; die Erfüllung (Abwicklung) des Geschäfts richtet sich nach den jeweiligen Vertragsbedingungen. Dies gilt insbesondere auch für die Fälligkeit der einzelnen Vertragsleistungen (d.h. für den Zeitpunkt, ab welchem die tatsächliche Leistung verlangt und auch gerichtlich vollstreckt werden kann). Enthielt das Angebot hierzu keine Regeln und haben auch die Parteien nicht untereinander etwas anderes vereinbart, gelten die folgenden Buchstaben b)-e):
                  </p>

                  <p className="mb-2 mt-4"><strong>b) Kommunikation</strong></p>
                  <p className="text-sm sm:text-base mb-3 sm:mb-4">
                    Jede Partei hat der anderen innert 7 Kalendertagen ab Vertragsschluss diejenigen Angaben mitzuteilen, welche die andere Partei braucht, um den Vertrag erfüllen zu können. Dies betrifft insbesondere die Post- bzw. Bankverbindung, falls die Zahlungsmodalität Banküberweisung angeboten wurde und diese Angaben nicht ohnehin vom Verkäufer im sog. „Text für End-E-Mails" hinterlegt wurde.
                  </p>
                  <p className="text-sm sm:text-base mb-3 sm:mb-4">
                    Fehlen einer Partei Angaben über die andere Partei, welche zur Vertragserfüllung notwendig sind, ist sie ebenso innert 7 Tagen ab Vertragsschluss verpflichtet, diesbezüglich mindestens zwei Mal per E-Mail sowie einmal telefonisch nachzufragen. Bleiben diese Anfragen erfolglos, ist die anfragende Partei nach Ablauf der 7 Kalendertage ab Vertragsschluss berechtigt, vom Vertrag zurückzutreten.
                  </p>

                  <p className="mb-2 mt-4"><strong>c) Fälligkeit</strong></p>
                  <p className="text-sm sm:text-base mb-3 sm:mb-4">
                    Die geschuldete Vertragsleistung ist spätestens innerhalb von 14 Tagen ab Erhalt der zur Erfüllung benötigten Angaben (vgl. Kommunikation) vollständig und ordnungsgemäss zu erbringen. Die Gegenpartei hat nach Erhalt der entsprechenden Leistung seinerseits innerhalb von spätestens 14 Tagen die geschuldete Gegenleistung vollständig und ordnungsgemäss zu erbringen. Diese 14-tägige Frist gilt auch bei Abholung gegen Barzahlung.
                  </p>

                  <h4 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 mt-3 sm:mt-4">6.2.7 Rücktritt</h4>
                  <p className="text-sm sm:text-base mb-3 sm:mb-4">
                    Erbringt ein Mitglied seine fällige Leistung trotz Aufforderung nicht, ist sein Vertragspartner berechtigt, vom Vertrag zurückzutreten und seinerseits allfällige bereits erbrachte Leistungen zurückzuverlangen. Dies gilt nicht, wenn der Vertragspartner selbst die Leistungserbringung vereitelt hat (Bsp: Der Vertragspartner ist nicht zum vereinbarten Übergabetreffen erschienen oder hat dem Mitglied trotz Anfrage seine Bankverbindung nicht angegeben).
                  </p>

                  <h4 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 mt-3 sm:mt-4">6.2.8 Produktemangel</h4>
                  <p className="text-sm sm:text-base mb-3 sm:mb-4">
                    Sollte ein Produkt mit einem in der Angebotsbeschreibung nicht erwähnten Mangel behaftet sein, der den Wert oder die Tauglichkeit des Produkts zum vorgesehen Gebrauch erheblich mindert oder aufhebt, so muss der Käufer den Verkäufer innerhalb von 14 Kalendertagen nach Lieferung des Produktes davon in Kenntnis setzen, um eine Nachbesserung auf Kosten des Verkäufers zu verlangen. Dasselbe gilt, wenn dem Produkt eine Eigenschaft fehlt, die in der Angebotsbeschreibung genannt wurde. Der Käufer muss dafür besorgt sein, das Produkt an die entsprechende Servicestelle des Verkäufers zu bringen oder auf eigene Kosten zu senden.
                  </p>
                  <p className="text-sm sm:text-base mb-3 sm:mb-4">
                    Weitergehende Gewährleistungs- oder Garantierechte wie namentlich Wandlung, Minderung oder Ersatzleistung sind ausgeschlossen. Anders lautende Abmachungen zwischen Verkäufer und Käufer bleiben vorbehalten.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4">7 Mobile Endgeräte</h2>
                  <p className="text-sm sm:text-base mb-3 sm:mb-4">
                    Helvenda kann seinen Mitgliedern den Zugriff auf Angebote und Inhalte der Helvenda-Webseiten sowie die Gebotsabgabe oder den Vertragsschluss durch mobile Endgeräte ermöglichen. Helvenda behält sich jedoch vor, hiervon gewisse Inhalte, Services und Funktionalitäten auszunehmen, welche nur auf der Helvenda-Webseiten angezeigt werden.
                  </p>
                  <p className="text-sm sm:text-base mb-3 sm:mb-4">
                    Helvenda stellt seinen Mitgliedern für den mobilen Zugriff auf die Helvenda-Webseiten spezielle Programme zur Verfügung (z.B. iPhone-Apps), deren Nutzung von der Zustimmung zu separaten Nutzungs- oder Lizenzbedingungen abhängig ist.
                  </p>
                  <p className="text-sm sm:text-base mb-3 sm:mb-4">
                    Helvenda hat das Recht, Angebote und Inhalte von Mitgliedern technisch so zu bearbeiten, aufzubereiten und anzupassen, dass diese auch auf mobilen Endgeräten dargestellt werden können.
                  </p>
                  <p className="text-sm sm:text-base mb-3 sm:mb-4">
                    Die Mitglieder sind sich bewusst, dass sich die Darstellung der Angebote auf dem mobilen Endgerät von derjenigen auf der Webseite unterscheiden kann. Nichtsdestotrotz bleiben die Mitglieder an ihre Gebotsabgabe oder einen Vertragsschluss mittels mobilen Endgeräts auf die gleiche Art und Weise gebunden, wie wenn sie die Gebotsabgabe oder den Vertragsschluss via Webseite vorgenommen hätten.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4">8 Datenschutz</h2>
                  <p className="text-sm sm:text-base mb-3 sm:mb-4">
                    Helvenda bearbeitet die von den Mitgliedern erhobenen Personendaten in Übereinstimmung mit der Datenschutzerklärung.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4">9 Übertragung von Rechten und Pflichten an Dritte</h2>
                  <p className="text-sm sm:text-base mb-3 sm:mb-4">
                    Helvenda behält sich das Recht vor, einzelne oder alle Rechte und Pflichten aus diesen AGB an einen Dritten zu übertragen oder durch einen Dritten ausüben zu lassen.
                  </p>
                  <p className="text-sm sm:text-base mb-3 sm:mb-4">
                    Die Mitgliedschaft und sämtliche Rechte und Pflichten des aktuellen oder ehemaligen Mitgliedes gegenüber Helvenda können durch das Mitglied nicht übertragen werden.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4">10 Haftungsausschlüsse Helvenda</h2>

                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3 mt-4 sm:mt-6">10.1 Allgemein</h3>
                  <p className="text-sm sm:text-base mb-3 sm:mb-4">
                    Helvenda haftet nur für direkte Schäden, die durch eine vorsätzliche oder grob fahrlässige eigene Handlung von Helvenda entstehen. Eine Haftung von Helvenda für direkte Schäden bei leichtem Verschulden – gleich aus welchem Rechtsgrund – ist unter Vorbehalt zwingender gesetzlicher Bestimmungen ausdrücklich ausgeschlossen. Eine Haftung von Helvenda für indirekte Schäden oder für Folgeschäden – gleich aus welchem Rechtsgrund – ist vollumfänglich und ausdrücklich ausgeschlossen.
                  </p>

                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3 mt-4 sm:mt-6">10.2 Technische Störungen, Wartung</h3>
                  <p className="text-sm sm:text-base mb-3 sm:mb-4">
                    Helvenda haftet nur für grob fahrlässig oder vorsätzlich verursachte zeitweilige Nichtverfügbarkeit der Webseite, Ausfall einzelner oder sämtlicher Webseite-Funktionen oder Fehlfunktionen der Webseite/Marktplatz. Insbesondere haftet Helvenda bei leichter Fahrlässigkeit nicht für technische Probleme, aufgrund derer Angebote oder Gebote nicht, verspätet oder fehlerhaft angenommen oder verarbeitet werden. Helvenda übernimmt insbesondere keine Gewähr für die Übereinstimmung der Systemuhrzeit mit einer offiziell festgelegten Uhrzeit. Die Webseite von Helvenda kann wegen Wartungsarbeiten oder anderen Gründen zeitweise nicht oder nur beschränkt zur Verfügung stehen, ohne dass dem Nutzer bzw. dem Mitglied hieraus Ansprüche gegenüber Helvenda erwachsen.
                  </p>
                  <p className="text-sm sm:text-base mb-3 sm:mb-4">
                    Auktionen, welche durch Systemunterbrüche wesentlich beeinflusst wurden, werden grundsätzlich automatisch verlängert. Bitte beachten Sie dazu unsere Grundsätze bei Systemausfällen.
                  </p>

                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3 mt-4 sm:mt-6">10.3 Inhalte und Angebote</h3>
                  <p className="text-sm sm:text-base mb-3 sm:mb-4">
                    Helvenda ist nicht zur Prüfung der Angebote, Bewertungen, und der sonstigen von den Mitgliedern auf dem Marktplatz veröffentlichten Informationen verpflichtet und übernimmt insbesondere keinerlei Verantwortung für:
                  </p>
                  <ul className="list-disc list-inside text-sm sm:text-base mb-3 sm:mb-4 ml-2 sm:ml-4 space-y-1 sm:space-y-2">
                    <li>die wahrheitsgemässe und sonst korrekte Ausgestaltung von Angeboten</li>
                    <li>die Qualität, Sicherheit, Legalität oder Verfügbarkeit angebotener Produkte</li>
                    <li>die Fähigkeit, die Befugnis und den Willen des einzelnen Mitglieds hinsichtlich Anbieten, Kauf, Lieferung, Bezahlung oder sonstiger Vertragserfüllung</li>
                    <li>die Korrektheit der Übersetzungen bei Benützung der automatischen Übersetzungsfunktion.</li>
                  </ul>

                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3 mt-4 sm:mt-6">10.4 Mitglieder und Dritte</h3>
                  <p className="text-sm sm:text-base mb-3 sm:mb-4">
                    Helvenda haftet insbesondere nicht für Schäden, die Mitgliedern oder Dritten durch das Verhalten von anderen Mitgliedern oder Dritten im Zusammenhang mit der Nutzung oder dem Missbrauch des Marktplatzes entstehen.
                  </p>

                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3 mt-4 sm:mt-6">10.5 Verlinkte Websites</h3>
                  <p className="text-sm sm:text-base mb-3 sm:mb-4">
                    Helvenda übernimmt keine Gewähr für die Aktualität, Korrektheit, Rechtmässigkeit, Vollständigkeit oder Qualität des Inhalts von Webseiten, die über Links auf den Helvenda-Webseiten erreichbar sind und schliesst jegliche Haftung in diesem Zusammenhang aus.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4">11 Freistellung</h2>
                  <p className="text-sm sm:text-base mb-3 sm:mb-4">
                    Wenn andere Mitglieder, Nutzer oder Dritte Ansprüche gegen Helvenda geltend machen wegen Verletzung ihrer Rechte durch von einem Mitglied veröffentlichte Angebote oder Inhalte oder wegen der sonstigen Nutzung der Helvenda-Webseiten durch Mitglieder oder Nutzer, so stellt dieses Mitglied bzw. dieser Nutzer Helvenda von sämtlichen Ansprüchen frei und übernimmt auch die Kosten der Rechtsverteidigung von Helvenda (inkl. Gerichts und Anwaltskosten).
                  </p>
                </section>

                <section>
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4">12 Salvatorische Klausel</h2>
                  <p className="text-sm sm:text-base mb-3 sm:mb-4">
                    Sollten einzelne Bestimmungen dieser AGB ganz oder teilweise nichtig und/oder unwirksam sein, bleibt die Gültigkeit und/oder Wirksamkeit der übrigen Bestimmungen oder Teile solcher Bestimmungen unberührt. Die ungültigen und/oder unwirksamen Bestimmungen werden durch solche ersetzt, die dem Sinn und Zweck der ungültigen und/oder unwirksamen Bestimmungen in rechtswirksamer Weise wirtschaftlich am nächsten kommt. Das gleiche gilt bei eventuellen Lücken der Regelung.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4">13 Anwendbares Recht und Gerichtsstand</h2>
                  <p className="text-sm sm:text-base mb-3 sm:mb-4">
                    Alle im Zusammenhang mit den vorliegenden AGB stehenden Streitigkeiten zwischen Helvenda und einem (aktuellen oder ehemaligen) Mitglied unterstehen schweizerischem Recht.
                  </p>
                  <p className="text-sm sm:text-base mb-3 sm:mb-4">
                    Gerichtsstand ist, vorbehaltlich anderslautender gesetzlicher Bestimmungen, Zollikerberg, Schweiz.
                  </p>
                </section>

                <div className="border-t border-gray-200 pt-4 sm:pt-6 mt-6 sm:mt-8 space-y-1">
                  <p className="text-xs sm:text-sm text-gray-600">
                    <strong>AGB gültig seit 17.01.2025</strong>
                  </p>
                  <p className="text-xs sm:text-sm text-gray-600">
                    <strong>Ergänzung «Helvenda Wohnungen» (Abschnitt 1.5): Stand 25.05.2026</strong>
                  </p>
                </div>
              </div>
            </div>
          </LegalPageWrapper>
        </div>
    </LegalPageChrome>
  )
}
