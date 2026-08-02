import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'AGB',
  robots: { index: true, follow: true },
}

export default function SicAgbPage() {
  return (
    <div className="mx-auto max-w-2xl px-5 py-16">
      <h1 className="text-2xl font-bold text-[#0f2b5e]">Allgemeine Geschäftsbedingungen</h1>
      <p className="mt-2 text-sm text-slate-500">Swiss Immo Cert — Zusammenfassung der wichtigsten Punkte.</p>

      <div className="mt-8 space-y-6 text-sm leading-relaxed text-slate-700">
        <section>
          <h2 className="font-semibold text-[#0f2b5e]">Leistung</h2>
          <p className="mt-1.5">
            Swiss Immo Cert prüft die von dir eingereichten Belege auf Vollständigkeit und Plausibilität und
            erstellt ein standardisiertes Mieter-Zertifikat mit QR-Verifikation. Es erfolgt keine telefonische
            Rückfrage bei Dritten. Das Zertifikat ersetzt keine behördliche Auskunft.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-[#0f2b5e]">Preise &amp; Zahlung</h2>
          <p className="mt-1.5">
            Basis-Einschreibegebühr CHF 20.–; je verifiziertem Modul CHF 30.–. Komplett-Paket (Basis + alle 4
            Module) CHF 120.–. Zahlung erfolgt vorab über Stripe.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-[#0f2b5e]">Gültigkeit &amp; Daten-Lebenszyklus</h2>
          <p className="mt-1.5">
            Ein Zertifikat ist 3 Monate gültig. Innerhalb dieser Zeit ist eine Verlängerung ohne erneuten Upload
            möglich. Nach Ablauf werden die Nachweise gemäss Schweizer Datenschutzgesetz (revDSG) gelöscht, sobald
            sie für den Zweck nicht mehr erforderlich sind; die QR-Prüfseite zeigt danach nur noch „abgelaufen".
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-[#0f2b5e]">Anbieter</h2>
          <p className="mt-1.5">Score-Max GmbH. Details siehe Impressum.</p>
        </section>
      </div>
    </div>
  )
}
