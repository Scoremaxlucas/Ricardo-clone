import {
  formatSicChf,
  SIC_BUNDLE_ALL_MODULES_CHF,
  SIC_MODULES,
  SIC_RENEWAL_FEE_CHF,
  SIC_VALIDITY_MONTHS,
} from '@/lib/sic/modules'
import { SIC_REVIEW_SLA, SIC_SUPPORT_EMAIL, sicPaths } from '@/lib/sic/config'
import { SIC_DOCS_RETENTION_DAYS, SIC_UNFINISHED_DOCS_RETENTION_MONTHS } from '@/lib/sic/validity'
import type { Metadata } from 'next'
import Link from 'next/link'

/** Datum der letzten inhaltlichen Änderung — bewusst fix, nicht das aktuelle Jahr. */
const SIC_AGB_STAND = '4. November 2026'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'AGB',
  description:
    'Allgemeine Geschäftsbedingungen von Swiss Immo Cert: Leistung, Preis, Gültigkeit, Verlängerung, Rückerstattung und Datenaufbewahrung des Mieter-Zertifikats.',
  robots: { index: true, follow: true },
}

export default function SicAgbPage() {

  return (
    <div className="mx-auto max-w-2xl break-words px-5 py-10 sm:py-16">
      <h1 className="font-sic-serif text-2xl font-bold tracking-tight text-sic-navy sm:text-3xl">
        Allgemeine Geschäftsbedingungen
      </h1>
      <p className="mt-2 text-sm text-slate-500">
        Swiss Immo Cert — Stand {SIC_AGB_STAND}. Anbieterin: siehe{' '}
        <Link href={sicPaths.impressum} className="text-sic-action underline-offset-2 hover:underline">
          Impressum
        </Link>
        .
      </p>

      <div className="mt-8 space-y-7 text-sm leading-relaxed text-slate-700">
        <section>
          <h2 className="font-semibold text-sic-navy">1. Leistung</h2>
          <p className="mt-1.5">
            Swiss Immo Cert prüft die von dir eingereichten Unterlagen auf Vollständigkeit und Plausibilität und
            erstellt daraus ein standardisiertes Mieter-Zertifikat mit QR-Prüfseite. Als «GEPRÜFT» markiert sind
            auf dem Zertifikat ausschliesslich die Angaben, die wir aus deinen Unterlagen bestätigen konnten — als
            Kategorie oder Bestätigung, nicht als Kopie des Dokuments. Nicht geprüfte Angaben stehen neutral als
            «Nicht Teil dieses Zertifikats» (Ziffer 6).
          </p>
          <p className="mt-1.5">
            Wir führen keine telefonischen Rückfragen bei Arbeitgebern oder Vermietern durch und holen keine
            Auskünfte bei Ämtern ein. Das Zertifikat ist keine behördliche Auskunft, keine Bonitätsbewertung und
            keine Empfehlung. Ob ein Vermieter dich als Mieterin oder Mieter akzeptiert, entscheidet er allein.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-sic-navy">2. Preise &amp; Zahlung</h2>
          <p className="mt-1.5">
            Das Zertifikat kostet einmalig {formatSicChf(SIC_BUNDLE_ALL_MODULES_CHF)} und umfasst alle{' '}
            {SIC_MODULES.length} Angaben. Die Zahlung erfolgt vorab über Stripe (Karte oder Link) oder Payrexx (TWINT). Der angezeigte
            Betrag entspricht immer dem belasteten Betrag. Alle Preise verstehen sich in Schweizer Franken,
            inklusive allfälliger Mehrwertsteuer.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-sic-navy">3. Ablauf und Fristen</h2>
          <p className="mt-1.5">
            Nach der Zahlung lädst du deine Unterlagen hoch. Zwei Angaben kannst du selbst beschaffen
            (Betreibungsauszug, Ausweis); für die beiden anderen brauchst du eine Unterschrift von Arbeitgeber
            oder bisherigem Vermieter. Bis alle Unterlagen vorliegen, dauert es erfahrungsgemäss einige Tage bis
            wenige Wochen — dieser Teil liegt bei dir. Unsere Prüfung selbst erfolgt {SIC_REVIEW_SLA} der
            Unterlagen.
          </p>
          <p className="mt-1.5">
            Bezahlte Angaben verfallen nicht. Du kannst die zugehörigen Unterlagen auch Wochen später nachreichen,
            ohne erneut zu bezahlen.
          </p>
          <p className="mt-1.5">
            Lohn und Arbeitsstelle prüfen wir derzeit für Angestellte. Bist du selbständig erwerbend, in Ausbildung
            oder pensioniert, vermerkst du das; die Angabe steht dann als solche auf dem Dokument und wird nicht
            geprüft. Die übrigen Angaben und das Mieter-Zertifikat sind davon nicht betroffen.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-sic-navy">4. Gültigkeit &amp; Verlängerung</h2>
          <p className="mt-1.5">
            Die Gültigkeit von {SIC_VALIDITY_MONTHS} Monaten richtet sich nach dem Betreibungsauszug: sie
            beginnt mit dessen Ausstellungsdatum, nicht mit der Zahlung und nicht mit späteren Freigaben
            anderer Angaben. Fehlt der Auszug noch, läuft eine vorläufige Frist von{' '}
            {SIC_VALIDITY_MONTHS} Monaten ab der ersten Freigabe; sobald der Auszug geprüft ist, gilt dessen
            Datum. Eine bereits laufende Gültigkeit wird durch andere Angaben nie verlängert. Läuft ein geprüfter
            Ausweis früher ab, endet die Gültigkeit mit dem Ausweis; einen neuen Ausweis kannst du kostenlos
            nachreichen.
          </p>
          <p className="mt-1.5">
            Nach Ablauf kannst du für {formatSicChf(SIC_RENEWAL_FEE_CHF)} verlängern. Dafür ist ein frischer
            Betreibungsauszug nötig; weitere Angaben müssen nur dann erneut eingereicht werden, wenn sie
            gealtert sind (Arbeitsverhältnis älter als zwölf Monate, abgelaufener Ausweis). Die Referenz des
            bisherigen Vermieters bleibt bestehen.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-sic-navy">5. Wenn eine Angabe nicht bestätigt werden kann</h2>
          <p className="mt-1.5">
            Sind die Unterlagen unleserlich, unvollständig, veraltet oder inhaltlich negativ (zum Beispiel offene
            Betreibungen, Verlustscheine oder ein abgelaufener Ausweis), geben wir die Angabe nicht frei. Du erhältst eine Begründung per E-Mail und kannst
            neue Unterlagen nachreichen — ohne zusätzliche Kosten. Eine nicht freigegebene Angabe steht auf dem
            Zertifikat neutral als «Nicht Teil dieses Zertifikats»; ein negativer Inhalt wird dort nie ausgewiesen.
            Ausnahme auf deinen Wunsch: Höchstens zwei offene Betreibungen, zusammen unter CHF 1’000 und ohne
            Verlustscheine, kannst du offen ausweisen lassen — als Anzahl und Betragsstufe, nicht mit dem genauen
            Betrag. Die Zustimmung kannst du jederzeit zurückziehen; der Betreibungsauszug gilt dann wieder als
            nicht geprüft.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-sic-navy">6. Zertifikat und Siegel</h2>
          <p className="mt-1.5">
            Sobald mindestens eine Angabe freigegeben ist und dein Name erfasst wurde, kannst du dein
            Mieter-Zertifikat als PDF herunterladen. Es ist gültig und weist die geprüften Angaben aus, mit dem
            Umfang («x von {SIC_MODULES.length} Angaben geprüft»). Angaben, die nicht geprüft sind, stehen
            neutral als «Nicht Teil dieses Zertifikats» da — das ist kein negativer Befund. Sind
            Betreibungsauszug und Ausweis geprüft, trägt das Zertifikat zusätzlich das Siegel.
          </p>
          <p className="mt-1.5">
            Ein Zertifikat für zwei Personen nennt beide Erwachsenen. Jede Person braucht einen eigenen
            Betreibungsauszug und Ausweis; das Einkommen zählt zusammen. Eine Vermieter-Referenz reicht in der
            Regel. Die Gültigkeit hängt am älteren der beiden Auszüge.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-sic-navy">7. Rückerstattung</h2>
          <p className="mt-1.5">
            Können wir eine bezahlte Angabe aus Gründen, die bei uns liegen, nicht prüfen, erstatten wir ihren
            Anteil am bezahlten Betrag: ein Viertel des Zertifikatspreises je Angabe, bei der Verlängerung gibt
            es keine anteilige Rückerstattung. Keine Rückerstattung erfolgt, wenn du die nötigen Unterlagen nicht
            einreichst, wenn eine Angabe wegen ihres Inhalts nicht freigegeben werden kann oder wenn ein
            Vermieter dich trotz Zertifikat nicht berücksichtigt. Erstattungen gehen auf das ursprüngliche
            Zahlungsmittel zurück. Eine versehentliche Doppelzahlung erstatten wir vollständig. Anfragen an{' '}
            {SIC_SUPPORT_EMAIL}.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-sic-navy">8. Deine Mitwirkung</h2>
          <p className="mt-1.5">
            Du reichst nur eigene, echte und unveränderte Unterlagen ein. Bei gefälschten oder fremden
            Unterlagen widerrufen wir das Zertifikat ohne Rückerstattung; die QR-Prüfseite weist es danach als
            widerrufen aus. Für die Richtigkeit der Angaben in deinen Unterlagen bist du verantwortlich.
          </p>
          <p className="mt-1.5">
            Die E-Mail-Adresse ist dein Zugang. Ein Tippfehler lässt sich einmal unter «Mein Zertifikat»
            korrigieren; die neue Adresse musst du in dem Postfach bestätigen. Danach ist eine weitere Änderung
            nicht vorgesehen.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-sic-navy">9. Weitergabe und QR-Code</h2>
          <p className="mt-1.5">
            Du entscheidest, wem du das Zertifikat gibst.             Wer den Prüf-Link oder QR-Code kennt, sieht den Status
            und die geprüften Angaben. Ist ein Link ungewollt in Umlauf, kannst du unter «Mein Zertifikat»
            jederzeit einen neuen Code erzeugen; der alte Link ist damit sofort ungültig. Die Prüfseite weist
            ihn als ersetzt aus — ohne die Angaben und ohne den neuen Code.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-sic-navy">10. Datenaufbewahrung</h2>
          <p className="mt-1.5">
            Hochgeladene Dateien löschen wir spätestens {SIC_DOCS_RETENTION_DAYS} Tage nach Ablauf des
            Zertifikats. Bleibt ein Zertifikat unfertig, löschen wir die Dateien{' '}
            {SIC_UNFINISHED_DOCS_RETENTION_MONTHS} Monate nach dem Kauf, nach vorheriger Warnung per E-Mail. Die
            geprüften Angaben selbst (etwa ein Einkommensband) bleiben so lange bestehen, wie das Zertifikat
            existiert. Details in der Datenschutzerklärung.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-sic-navy">11. Haftung</h2>
          <p className="mt-1.5">
            Wir haften für Vorsatz und grobe Fahrlässigkeit. Für entgangene Wohnungen, Folgeschäden oder
            Entscheide von Vermietern haften wir nicht. Es gilt Schweizer Recht; Gerichtsstand ist der Sitz der
            Anbieterin (siehe Impressum).
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-sic-navy">12. Anbieterin</h2>
          <p className="mt-1.5">
            Kontakt und Adresse im{' '}
            <Link href={sicPaths.impressum} className="text-sic-action underline-offset-2 hover:underline">
              Impressum
            </Link>
            .
          </p>
        </section>
      </div>
    </div>
  )
}
