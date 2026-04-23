import Link from 'next/link'

function IconManual() {
  return (
    <svg viewBox="0 0 48 48" fill="none" stroke="#18a87c" strokeWidth="1.5" className="h-12 w-12" aria-hidden>
      <rect x="8" y="6" width="32" height="36" rx="4" />
      <path d="M16 16h16M16 22h16M16 28h10" />
      <path d="M30 32l4-4 4 4-4 4-4-4z" />
    </svg>
  )
}

function IconImport() {
  return (
    <svg viewBox="0 0 48 48" fill="none" stroke="#18a87c" strokeWidth="1.5" className="h-12 w-12" aria-hidden>
      <circle cx="24" cy="24" r="18" />
      <path d="M24 14v10l6 6" />
      <path d="M14 30h20" />
      <path d="M18 34l-4 4M30 34l4 4" />
    </svg>
  )
}

export function RentalListingNewEntryLanding() {
  return (
    <div className="min-h-[60vh] bg-[#f8fdfb] px-4 py-10 md:px-5 md:py-[60px]">
      <div className="mx-auto max-w-[860px]">
        <header className="text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[2px] text-[#18a87c]">WOHNUNG INSERIEREN</p>
          <h1 className="mt-3 text-[28px] font-extrabold leading-[1.15] text-[#0d2b1f] sm:text-[42px]">
            <span className="text-[#18a87c]">Kostenlos</span> inserieren.
            <br />
            In 5 Minuten live.
          </h1>
          <p className="mx-auto mt-4 max-w-[520px] text-center text-base leading-[1.6] text-[#5a7a6e]">
            Erstelle dein Inserat manuell oder importiere es automatisch von einer anderen Plattform — mit einem Klick.
          </p>
          <ul className="mt-6 flex flex-wrap items-center justify-center gap-2 sm:gap-3">
            <li className="rounded-full bg-[#e8f7f2] px-[14px] py-[5px] text-xs font-medium text-[#18a87c]">✓ Kostenlos</li>
            <li className="rounded-full bg-[#e8f7f2] px-[14px] py-[5px] text-xs font-medium text-[#18a87c]">✓ Nur verifizierte Bewerber</li>
            <li className="rounded-full bg-[#e8f7f2] px-[14px] py-[5px] text-xs font-medium text-[#18a87c]">✓ Kein Abo</li>
          </ul>
        </header>

        <div className="mt-10 grid grid-cols-1 gap-y-8 md:grid-cols-[1fr_auto_1fr] md:gap-x-8 md:gap-y-0">
          <Link
            href="/matching/properties/import"
            className="group relative block min-w-0 rounded-2xl border border-slate-200/70 border-t-[3px] border-t-[#18a87c] bg-white p-9 shadow-[0_2px_16px_rgba(0,0,0,0.06)] transition-all duration-200 ease-in-out hover:border-[#c8ebe0] hover:border-t-[#18a87c] hover:shadow-[0_8px_28px_rgba(0,0,0,0.1)] md:col-start-1 md:row-start-1"
          >
            <span className="absolute left-4 top-4 rounded-full bg-[#18a87c] px-[10px] py-[3px] text-[11px] font-bold text-white">
              ⚡ Empfohlen
            </span>
            <IconImport />
            <h2 className="mt-4 text-xl font-bold text-[#0d2b1f]">Von URL importieren</h2>
            <p className="mt-2 text-sm leading-[1.6] text-[#5a7a6e]">
              Hast du die Wohnung bereits irgendwo inseriert? Füge den Link ein — wir füllen alles automatisch aus.
            </p>
            <p className="mt-4 inline-block rounded-full bg-[#e8f7f2] px-3 py-1 text-xs font-medium text-[#18a87c]">⚡ Weniger als 1 Minute</p>
            <p className="mt-8 text-sm font-semibold text-[#18a87c]">URL importieren →</p>
          </Link>

          <div className="flex items-center gap-3 md:hidden" role="separator" aria-orientation="horizontal">
            <div className="h-px flex-1 bg-[#e8f7f2]" />
            <span className="bg-white px-2 text-xs text-slate-500">oder</span>
            <div className="h-px flex-1 bg-[#e8f7f2]" />
          </div>

          <div
            className="relative hidden min-h-[220px] w-10 shrink-0 md:flex md:col-start-2 md:row-start-1"
            role="separator"
            aria-orientation="vertical"
          >
            <div className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-[#e8f7f2]" />
            <span className="relative z-10 m-auto bg-[#f8fdfb] px-2 text-xs text-slate-500">oder</span>
          </div>

          <Link
            href="/matching/properties/new/erfassen"
            className="group relative block min-w-0 rounded-2xl border border-slate-200/70 bg-white p-9 shadow-[0_2px_16px_rgba(0,0,0,0.06)] transition-all duration-200 ease-in-out hover:border-[#c8ebe0] hover:shadow-[0_8px_28px_rgba(0,0,0,0.1)] md:col-start-3 md:row-start-1"
          >
            <IconManual />
            <h2 className="mt-4 text-xl font-bold text-[#0d2b1f]">Manuell erfassen</h2>
            <p className="mt-2 text-sm leading-[1.6] text-[#5a7a6e]">
              Fülle das Formular Schritt für Schritt aus. Dauert ca. 5 Minuten — mit Fotos und allen Details.
            </p>
            <p className="mt-4 inline-block rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">⏱ ca. 5 Minuten</p>
            <p className="mt-8 text-sm font-semibold text-[#18a87c]">Manuell starten →</p>
          </Link>
        </div>

        <section className="mt-12 text-center text-xs leading-relaxed text-[#8aa89e] sm:mt-[48px]">
          <p>🇨🇭 Schweizer Plattform · 🔐 Verschlüsselt · ✓ DSGVO-konform</p>
        </section>
      </div>
    </div>
  )
}
