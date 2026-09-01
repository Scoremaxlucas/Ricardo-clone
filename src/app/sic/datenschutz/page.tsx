import { SIC_MODULES, SIC_VALIDITY_MONTHS } from '@/lib/sic/modules'
import { SIC_OPERATOR, SIC_SUPPORT_EMAIL, sicOperatorAddressBlock } from '@/lib/sic/config'
import { SIC_DOCS_RETENTION_DAYS, SIC_UNFINISHED_DOCS_RETENTION_MONTHS } from '@/lib/sic/validity'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Datenschutz',
  robots: { index: true, follow: true },
}

export default function SicDatenschutzPage() {
  return (
    <div className="mx-auto max-w-2xl px-5 py-16">
      <h1 className="font-sic-serif text-2xl font-bold tracking-tight text-sic-navy sm:text-3xl">Datenschutz</h1>
      <p className="mt-2 text-sm text-slate-500">
        Wie Swiss Immo Cert deine Daten verarbeitet — nach Schweizer Datenschutzgesetz (revDSG).
      </p>

      <div className="mt-8 space-y-7 text-sm leading-relaxed text-slate-700">
        <section>
          <h2 className="font-semibold text-sic-navy">Verantwortliche Stelle</h2>
          <p className="mt-1.5">
            {SIC_OPERATOR.legalName}, {sicOperatorAddressBlock().replace(/\n/g, ', ')}. Kontakt für
            Datenschutzfragen:{' '}
            <a href={`mailto:${SIC_SUPPORT_EMAIL}`} className="text-sic-action underline-offset-2 hover:underline">
              {SIC_SUPPORT_EMAIL}
            </a>
            .
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-sic-navy">Welche Daten wir verarbeiten</h2>
          <ul className="mt-1.5 list-disc space-y-1 pl-5">
            <li>E-Mail-Adresse (Konto, Anmelde-Link, Benachrichtigungen) und dein Name für das Zertifikat.</li>
            <li>
              Die von dir hochgeladenen Unterlagen: Betreibungsauszug, Ausweis, Lohnnachweis,
              Arbeitgeberbestätigung, Vermieter-Referenz.
            </li>
            <li>
              Die daraus geprüften Angaben in standardisierter Form — etwa ein Einkommensband statt des exakten
              Lohns.
            </li>
            <li>
              Zahlungsdaten bei Stripe. Kreditkartendaten erreichen unsere Server nicht; wir speichern nur
              Betrag, Status und die Stripe-Referenz.
            </li>
            <li>
              Technische Protokolle: Aufrufe der QR-Prüfseite werden gezählt. Dabei speichern wir keine
              IP-Adresse, sondern nur einen kurzlebigen, nicht zurückrechenbaren Prüfwert, um Mehrfachzählungen
              am selben Tag zu vermeiden.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="font-semibold text-sic-navy">Zweck</h2>
          <p className="mt-1.5">
            Wir verarbeiten diese Daten ausschliesslich, um deine Unterlagen zu prüfen, dein Zertifikat zu
            erstellen, dich über den Stand zu informieren und die Zahlung abzuwickeln. Wir verkaufen keine Daten
            und betreiben keine Werbung mit ihnen.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-sic-navy">Wer die Daten sieht</h2>
          <p className="mt-1.5">
            Deine Unterlagen sehen nur die für die Prüfung zuständigen Personen bei Swiss Immo Cert. Vermieter sehen
            nie das Original-Dokument, sondern nur das Zertifikat mit den geprüften Angaben — und nur, wenn du
            es teilst. Wer deinen Prüf-Link oder QR-Code hat, sieht den Status und die geprüften Angaben; du
            kannst unter «Mein Zertifikat» jederzeit einen neuen Code erzeugen und den alten Link damit entwerten.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-sic-navy">Automatische Vorauswertung durch KI</h2>
          <p className="mt-1.5">
            Zur Vorbereitung der Prüfung lassen wir hochgeladene Unterlagen durch einen KI-Dienst (Anthropic,
            Verarbeitung in Rechenzentren in den USA) auslesen, um Felder wie Ausstellungsdatum oder
            Einkommensband vorzuschlagen. Diese Vorschläge sind nicht bindend: Die Freigabe erfolgt immer durch
            einen Menschen. Es findet keine automatisierte Einzelentscheidung im Sinne des revDSG statt. Wenn du
            das nicht möchtest, schreib uns vor dem Hochladen — wir prüfen dann ohne diesen Schritt.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-sic-navy">Sicherheit</h2>
          <p className="mt-1.5">
            Hochgeladene Dateien werden vor der Ablage verschlüsselt (AES-256-GCM) und liegen in einem privaten,
            nicht öffentlich adressierbaren Speicher. Ist die Verschlüsselung nicht verfügbar, wird das
            Hochladen abgewiesen statt unverschlüsselt gespeichert. Der Zugriff auf das Zertifikat erfolgt über einen
            zeitlich begrenzten Anmelde-Link an deine E-Mail-Adresse.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-sic-navy">Aufbewahrung und Löschung</h2>
          <p className="mt-1.5">
            Die Gültigkeit von {SIC_VALIDITY_MONTHS} Monaten beginnt mit der ersten Freigabe. Nach Ablauf des
            Zertifikats löschen wir die hochgeladenen Dateien spätestens nach {SIC_DOCS_RETENTION_DAYS} Tagen.
          </p>
          <p className="mt-1.5">
            Bleibt ein Zertifikat unfertig, löschen wir die hochgeladenen Dateien{' '}
            {SIC_UNFINISHED_DOCS_RETENTION_MONTHS} Monate nach dem Kauf. Wir warnen dich vorher per E-Mail. Dein
            Anspruch auf die bezahlte Prüfung bleibt bestehen — du kannst die Unterlagen danach neu einreichen.
          </p>
          <p className="mt-1.5">
            Wichtig zu unterscheiden: Gelöscht werden die <strong>Dateien</strong>. Die daraus geprüften{' '}
            <strong>Angaben</strong> (zum Beispiel «Bruttojahreslohn CHF 80’000 – 100’000, geprüft am …»)
            bleiben so lange gespeichert, wie dein Zertifikat existiert, weil sie dessen Inhalt sind.
            Zahlungsbelege bewahren wir gemäss Buchführungspflicht zehn Jahre auf.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-sic-navy">Deine Rechte</h2>
          <p className="mt-1.5">
            Du kannst Auskunft über deine Daten verlangen, sie berichtigen oder löschen lassen und die Löschung
            deines Zertifikats verlangen. Eine Anfrage an {SIC_SUPPORT_EMAIL} genügt. Wird das Zertifikat
            gelöscht, zeigt die Prüfseite anschliessend keine Angaben mehr — auch nicht gegenüber Vermietern,
            denen du den Link gegeben hast. Alle {SIC_MODULES.length} Angaben sind freiwillig; du wählst selbst,
            welche du prüfen lässt.
          </p>
        </section>
      </div>
    </div>
  )
}
