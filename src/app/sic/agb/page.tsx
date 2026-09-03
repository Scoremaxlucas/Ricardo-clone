import {
  formatSicChf,
  SIC_BUNDLE_ALL_MODULES_CHF,
  SIC_MIN_CHARGE_CHF,
  SIC_MODULE_FEE_CHF,
  SIC_MODULES,
  SIC_RENEWAL_FEE_CHF,
  SIC_VALIDITY_MONTHS,
  sicBundleSavingsChf,
} from '@/lib/sic/modules'
import { SIC_REVIEW_SLA, SIC_SUPPORT_EMAIL, sicPaths } from '@/lib/sic/config'
import { SIC_DOCS_RETENTION_DAYS, SIC_UNFINISHED_DOCS_RETENTION_MONTHS } from '@/lib/sic/validity'
import type { Metadata } from 'next'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'AGB',
  robots: { index: true, follow: true },
}

export default function SicAgbPage() {
  const bundleSavings = sicBundleSavingsChf()

  return (
    <div className="mx-auto max-w-2xl break-words px-5 py-10 sm:py-16">
      <h1 className="font-sic-serif text-2xl font-bold tracking-tight text-sic-navy sm:text-3xl">
        Allgemeine Geschäftsbedingungen
      </h1>
      <p className="mt-2 text-sm text-slate-500">
        Swiss Immo Cert — Stand {new Date().getFullYear()}. Anbieterin: siehe{' '}
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
            erstellt daraus ein standardisiertes Mieter-Zertifikat mit QR-Prüfseite. Auf dem Zertifikat erscheinen
            ausschliesslich die Angaben, die wir aus deinen Unterlagen bestätigen konnten — als Kategorie oder
            Bestätigung, nicht als Kopie des Dokuments.
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
            Beim erstmaligen Anlegen kaufst du das Komplett-Paket: Basis und alle {SIC_MODULES.length}{' '}
            Angaben für {formatSicChf(SIC_BUNDLE_ALL_MODULES_CHF)}
            {bundleSavings > 0 ? ` — ${formatSicChf(bundleSavings)} günstiger als die Summe der Einzelpreise` : ''}.
            Einzelne Angaben kannst du später nachkaufen, falls sie noch nicht enthalten sind (je{' '}
            {formatSicChf(SIC_MODULE_FEE_CHF)}). Die Zahlung erfolgt vorab über Stripe.
          </p>
          <p className="mt-1.5">
            Liegt die Summe unter dem von Stripe verrechenbaren Mindestbetrag von{' '}
            {formatSicChf(SIC_MIN_CHARGE_CHF)}, weisen wir die Differenz vor der Zahlung als eigene Position aus.
            Der angezeigte Betrag entspricht immer dem belasteten Betrag. Alle Preise verstehen sich in
            Schweizer Franken, inklusive allfälliger Mehrwertsteuer.
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
        </section>

        <section>
          <h2 className="font-semibold text-sic-navy">4. Gültigkeit &amp; Verlängerung</h2>
          <p className="mt-1.5">
            Die Gültigkeit von {SIC_VALIDITY_MONTHS} Monaten richtet sich nach dem Betreibungsauszug: sie
            beginnt mit dessen Ausstellungsdatum, nicht mit der Zahlung und nicht mit späteren Freigaben
            anderer Angaben. Fehlt der Auszug noch, läuft eine vorläufige Frist von{' '}
            {SIC_VALIDITY_MONTHS} Monaten ab der ersten Freigabe; sobald der Auszug geprüft ist, gilt dessen
            Datum. Eine bereits laufende Gültigkeit wird durch andere Angaben nie verlängert.
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
            Betreibungen), geben wir die Angabe nicht frei. Du erhältst eine Begründung per E-Mail und kannst
            neue Unterlagen nachreichen — ohne zusätzliche Kosten. Eine nicht freigegebene Angabe erscheint nicht
            auf dem Zertifikat; ein negativer Inhalt wird dort nicht ausgewiesen.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-sic-navy">6. Stand der Prüfung und Zertifikat</h2>
          <p className="mt-1.5">
            Sobald mindestens eine Angabe freigegeben ist und dein Name erfasst wurde, kannst du ein PDF
            herunterladen. Es ist ein Mieter-Zertifikat, sobald Betreibungsauszug und Ausweis geprüft sind;
            vorher weist es den Stand der Prüfung aus — ohne Siegel, mit offenem Umfang («x von{' '}
            {SIC_MODULES.length} Angaben geprüft»). Nicht aufgeführte Angaben gelten als nicht geprüft und nicht
            als negativ.
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
            Können wir eine bezahlte Angabe aus Gründen, die bei uns liegen, nicht prüfen, erstatten wir den
            entsprechenden Betrag. Keine Rückerstattung erfolgt, wenn du die nötigen Unterlagen nicht
            einreichst, wenn eine Angabe wegen ihres Inhalts nicht freigegeben werden kann oder wenn ein
            Vermieter dich trotz Zertifikat nicht berücksichtigt. Anfragen an {SIC_SUPPORT_EMAIL}.
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
            jederzeit einen neuen Code erzeugen; der alte Link ist damit sofort ungültig.
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
