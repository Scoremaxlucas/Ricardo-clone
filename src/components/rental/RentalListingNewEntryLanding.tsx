import Link from 'next/link'

/** Navbar `h-14` (56px) + grober Platzhalter für Wohnen-Footer (Inhalt variiert). */
const NAVBAR_PX = 56
const FOOTER_APPROX_PX = 220

function IconManual() {
  return (
    <svg viewBox="0 0 48 48" fill="none" stroke="#18a87c" strokeWidth="1.5" className="h-12 w-12" aria-hidden>
      <rect x="8" y="6" width="32" height="36" rx="4" />
      <path d="M16 16h16M16 22h16M16 28h10" />
      <path d="M30 32l4-4 4 4-4 4-4-4z" />
    </svg>
  )
}

function IconImportExternal() {
  return (
    <svg viewBox="0 0 40 40" fill="none" stroke="#18a87c" strokeWidth="1.5" width={40} height={40} aria-hidden>
      <path d="M17 13H11a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-6" />
      <path d="M21 9h10m0 0v10m0-10L17 23" />
    </svg>
  )
}

export function RentalListingNewEntryLanding() {
  return (
    <div
      className="w-full bg-[#f8fdfb]"
      style={{
        minHeight: `calc(100vh - ${NAVBAR_PX}px - ${FOOTER_APPROX_PX}px)`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 20px',
      }}
    >
      <div className="flex w-full max-w-[860px] flex-col items-center">
        <header className="mb-8 text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[2px] text-[#18a87c]">WOHNUNG INSERIEREN</p>
          <h1 className="mt-3 text-[28px] font-extrabold leading-[1.15] text-[#0d2b1f] sm:text-[42px]">
            <span className="text-[#18a87c]">Kostenlos</span> inserieren.
            <br />
            In 5 Minuten live.
          </h1>
        </header>

        <div className="grid w-full max-w-[680px] grid-cols-1 gap-5 md:grid-cols-2">
          <Link
            href="/matching/properties/import"
            className="group relative flex min-h-[160px] min-w-0 flex-col rounded-2xl border border-slate-200/70 border-t-[3px] border-t-[#18a87c] bg-white p-8 shadow-[0_2px_16px_rgba(0,0,0,0.06)] transition-all duration-200 ease-in-out hover:border-[#c8ebe0] hover:border-t-[#18a87c] hover:shadow-[0_8px_28px_rgba(0,0,0,0.1)]"
          >
            <span className="absolute left-4 top-4 rounded-full bg-[#18a87c] px-[10px] py-[3px] text-[11px] font-bold text-white">
              ⚡ Empfohlen
            </span>
            <IconImportExternal />
            <h2 className="mt-4 text-[18px] font-bold text-[#0d2b1f]">Von URL importieren</h2>
          </Link>

          <Link
            href="/matching/properties/new/erfassen"
            className="group relative flex min-h-[160px] min-w-0 flex-col rounded-2xl border border-slate-200/70 bg-white p-8 shadow-[0_2px_16px_rgba(0,0,0,0.06)] transition-all duration-200 ease-in-out hover:border-[#c8ebe0] hover:shadow-[0_8px_28px_rgba(0,0,0,0.1)]"
          >
            <IconManual />
            <h2 className="mt-4 text-[18px] font-bold text-[#0d2b1f]">Manuell erfassen</h2>
          </Link>
        </div>
      </div>
    </div>
  )
}
