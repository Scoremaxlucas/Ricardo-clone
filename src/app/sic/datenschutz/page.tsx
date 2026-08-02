import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Datenschutz',
  robots: { index: true, follow: true },
}

export default function SicDatenschutzPage() {
  return (
    <div className="mx-auto max-w-2xl px-5 py-16">
      <h1 className="text-2xl font-bold text-[#0f2b5e]">Datenschutz</h1>
      <p className="mt-2 text-sm text-slate-500">
        Wie Swiss Immo Cert deine Daten verarbeitet (Zusammenfassung, Schweizer revDSG).
      </p>

      <div className="mt-8 space-y-6 text-sm leading-relaxed text-slate-700">
        <section>
          <h2 className="font-semibold text-[#0f2b5e]">Zweck der Verarbeitung</h2>
          <p className="mt-1.5">
            Deine hochgeladenen Nachweise werden ausschliesslich zur Prüfung und Erstellung deines
            Mieter-Zertifikats verarbeitet. Vermieter sehen nur das fertige Zertifikat, das du selbst teilst.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-[#0f2b5e]">Speicherung &amp; Lebenszyklus der Daten</h2>
          <p className="mt-1.5">
            Deine Zertifikatsdaten bleiben während der Gültigkeitsdauer von 3 Monaten gespeichert. Eine
            Verlängerung ist innerhalb dieser Zeit ohne erneuten Upload möglich.
          </p>
          <p className="mt-1.5">
            Nach Ablauf werden die eingereichten Nachweise gemäss Schweizer Datenschutzgesetz (revDSG) gelöscht,
            sobald sie für den Zweck nicht mehr erforderlich sind. Die QR-Prüfseite zeigt danach nur noch den
            Status „abgelaufen" ohne inhaltliche Angaben.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-[#0f2b5e]">Sicherheit</h2>
          <p className="mt-1.5">Daten werden verschlüsselt gespeichert und nur zweckgebunden verarbeitet.</p>
        </section>

        <section>
          <h2 className="font-semibold text-[#0f2b5e]">Verantwortliche Stelle</h2>
          <p className="mt-1.5">Score-Max GmbH. Kontaktangaben siehe Impressum.</p>
        </section>
      </div>
    </div>
  )
}
