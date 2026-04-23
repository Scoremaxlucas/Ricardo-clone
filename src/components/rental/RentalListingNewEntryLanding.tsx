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
    <div className="flex min-h-screen flex-col bg-[#f8fdfb] px-4 pb-14 pt-14 md:px-5 md:pb-20 md:pt-20">
      <div className="mx-auto flex w-full max-w-[860px] flex-1 flex-col justify-center">
        <header className="text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[2px] text-[#18a87c]">WOHNUNG INSERIEREN</p>
          <h1 className="mt-3 text-[28px] font-extrabold leading-[1.15] text-[#0d2b1f] sm:text-[42px]">
            <span className="text-[#18a87c]">Kostenlos</span> inserieren.
            <br />
            In 5 Minuten live.
          </h1>
        </header>

        <div className="mx-auto mt-8 grid w-full max-w-[520px] grid-cols-1 gap-4 sm:mt-10 md:mt-12 md:grid-cols-2 md:gap-5">
          <Link
            href="/matching/properties/import"
            className="group relative block min-w-0 rounded-2xl border border-slate-200/70 border-t-[3px] border-t-[#18a87c] bg-white p-7 shadow-[0_2px_16px_rgba(0,0,0,0.06)] transition-all duration-200 ease-in-out hover:border-[#c8ebe0] hover:border-t-[#18a87c] hover:shadow-[0_8px_28px_rgba(0,0,0,0.1)]"
          >
            <span className="absolute left-4 top-4 rounded-full bg-[#18a87c] px-[10px] py-[3px] text-[11px] font-bold text-white">
              ⚡ Empfohlen
            </span>
            <IconImport />
            <h2 className="mt-3 text-xl font-bold text-[#0d2b1f]">Von URL importieren</h2>
            <p className="mt-1 text-[13px] text-slate-500">1 Minute</p>
          </Link>

          <Link
            href="/matching/properties/new/erfassen"
            className="group relative block min-w-0 rounded-2xl border border-slate-200/70 bg-white p-7 shadow-[0_2px_16px_rgba(0,0,0,0.06)] transition-all duration-200 ease-in-out hover:border-[#c8ebe0] hover:shadow-[0_8px_28px_rgba(0,0,0,0.1)]"
          >
            <IconManual />
            <h2 className="mt-3 text-xl font-bold text-[#0d2b1f]">Manuell erfassen</h2>
            <p className="mt-1 text-[13px] text-slate-500">ca. 5 Minuten</p>
          </Link>
        </div>
      </div>
    </div>
  )
}
