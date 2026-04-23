'use client'

import Link from 'next/link'
import { useLayoutEffect, useState, type CSSProperties } from 'react'

function IconManualMuted() {
  return (
    <svg viewBox="0 0 48 48" fill="none" stroke="#8aa89e" strokeWidth="1.5" className="h-12 w-12" aria-hidden>
      <rect x="8" y="6" width="32" height="36" rx="4" />
      <path d="M16 16h16M16 22h16M16 28h10" />
      <path d="M30 32l4-4 4 4-4 4-4-4z" />
    </svg>
  )
}

function IconUrlImport() {
  return (
    <svg viewBox="0 0 40 40" fill="none" stroke="#18a87c" strokeWidth="1.5" width={40} height={40} className="mt-2 shrink-0" aria-hidden>
      <rect x="4" y="10" width="32" height="24" rx="3" />
      <path d="M4 17h32" />
      <path d="M10 13.5h.01" />
      <path d="M14 13.5h.01" />
      <path d="M18 13.5h.01" />
      <path d="M13 24h8M25 24l3 3-3 3" />
    </svg>
  )
}

const shellBaseStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '40px 20px',
}

export function RentalListingNewEntryLanding() {
  const [shellStyle, setShellStyle] = useState<CSSProperties>(() => ({
    ...shellBaseStyle,
    minHeight: 'calc(100dvh - 56px)',
  }))

  useLayoutEffect(() => {
    const header = document.querySelector('header')
    const footer = document.querySelector('footer')
    const navH = Math.round(header?.getBoundingClientRect().height ?? 56)

    const footerEl = footer as HTMLElement | null
    const prevFooterDisplay = footerEl?.style.display ?? ''

    if (footerEl) {
      footerEl.style.display = 'none'
    }

    setShellStyle({
      ...shellBaseStyle,
      minHeight: `calc(100dvh - ${navH}px)`,
    })

    return () => {
      if (footerEl) {
        footerEl.style.display = prevFooterDisplay
      }
    }
  }, [])

  return (
    <div className="w-full bg-[#f8fdfb]" style={shellStyle}>
      <div className="flex w-full max-w-[860px] flex-col items-center">
        <header className="mb-8 text-center">
          <h1 className="text-[28px] font-extrabold leading-[1.15] text-[#0d2b1f] sm:text-[42px]">
            <span className="text-[#18a87c]">Kostenlos</span> inserieren.
            <br />
            In 5 Minuten live.
          </h1>
        </header>

        <div className="grid w-full max-w-[680px] grid-cols-1 items-stretch gap-5 md:grid-cols-2 md:grid-rows-1">
          <Link
            href="/matching/properties/import"
            className="group relative flex h-full min-h-[160px] min-w-0 cursor-pointer flex-col overflow-visible rounded-2xl border-2 border-[#18a87c] bg-white p-8 shadow-[0_4px_24px_rgba(24,168,124,0.12)] transition-all duration-200 ease-in-out hover:-translate-y-[3px] hover:shadow-[0_8px_32px_rgba(24,168,124,0.18)]"
          >
            <span className="pointer-events-none absolute left-4 top-[-12px] z-10 rounded-full bg-[#18a87c] px-[10px] py-[3px] text-[11px] font-bold text-white">
              ⚡ Empfohlen
            </span>
            <IconUrlImport />
            <h2 className="mt-4 text-[18px] font-extrabold text-[#0d2b1f]">Von URL importieren</h2>
          </Link>

          <Link
            href="/matching/properties/new/erfassen"
            className="group relative flex h-full min-h-[160px] min-w-0 cursor-pointer flex-col rounded-2xl border border-solid border-[#e0e0e0] bg-[#f8fdfb] p-8 shadow-none transition-all duration-200 ease-in-out hover:-translate-y-0.5 hover:border-[#b2e8d8] hover:bg-white hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)]"
          >
            <IconManualMuted />
            <h2 className="mt-4 text-[18px] font-semibold text-[#0d2b1f]">Manuell erfassen</h2>
          </Link>
        </div>
      </div>
    </div>
  )
}
