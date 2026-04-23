'use client'

import Link from 'next/link'
import { useLayoutEffect, useState, type CSSProperties } from 'react'

function IconManualMuted() {
  return (
    <svg viewBox="0 0 48 48" fill="none" stroke="#8aa89e" strokeWidth="1.5" className="h-14 w-14 sm:h-16 sm:w-16" aria-hidden>
      <rect x="8" y="6" width="32" height="36" rx="4" />
      <path d="M16 16h16M16 22h16M16 28h10" />
      <path d="M30 32l4-4 4 4-4 4-4-4z" />
    </svg>
  )
}

function IconUrlImport() {
  return (
    <svg viewBox="0 0 40 40" fill="none" stroke="#18a87c" strokeWidth="1.5" className="mt-2 h-14 w-14 shrink-0 sm:h-16 sm:w-16" aria-hidden>
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
      <div className="flex w-full max-w-[920px] flex-col items-center px-1 sm:px-2">
        <header className="mb-8 text-center">
          <h1 className="text-[30px] font-extrabold leading-[1.15] text-[#0d2b1f] sm:text-[44px]">
            <span className="text-[#18a87c]">Kostenlos</span> inserieren.
            <br />
            In 5 Minuten live.
          </h1>
        </header>

        <div className="grid w-full max-w-[780px] grid-cols-1 items-stretch gap-6 sm:max-w-[820px] md:grid-cols-2 md:grid-rows-1 md:gap-8">
          <Link
            href="/matching/properties/import"
            className="group relative flex h-full min-h-[200px] min-w-0 cursor-pointer flex-col overflow-visible rounded-2xl border-2 border-[#18a87c] bg-white p-9 shadow-[0_4px_24px_rgba(24,168,124,0.12)] transition-all duration-200 ease-in-out hover:-translate-y-[3px] hover:shadow-[0_8px_32px_rgba(24,168,124,0.18)] sm:min-h-[220px] sm:p-10"
          >
            <span className="pointer-events-none absolute left-4 top-[-12px] z-10 rounded-full bg-[#18a87c] px-[10px] py-[3px] text-[11px] font-bold text-white sm:text-xs">
              ⚡ Empfohlen
            </span>
            <IconUrlImport />
            <h2 className="mt-5 text-[20px] font-extrabold leading-snug text-[#0d2b1f] sm:text-[22px]">Von URL importieren</h2>
          </Link>

          <Link
            href="/matching/properties/new/erfassen"
            className="group relative flex h-full min-h-[200px] min-w-0 cursor-pointer flex-col rounded-2xl border border-solid border-[#e0e0e0] bg-[#f8fdfb] p-9 shadow-none transition-all duration-200 ease-in-out hover:-translate-y-0.5 hover:border-[#b2e8d8] hover:bg-white hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)] sm:min-h-[220px] sm:p-10"
          >
            <IconManualMuted />
            <h2 className="mt-5 text-[20px] font-semibold leading-snug text-[#0d2b1f] sm:text-[22px]">Manuell erfassen</h2>
          </Link>
        </div>
      </div>
    </div>
  )
}
