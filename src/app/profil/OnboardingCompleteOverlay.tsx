'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export function OnboardingCompleteOverlay() {
  const router = useRouter()
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const t = window.setTimeout(() => {
      setVisible(false)
      router.replace('/profil')
    }, 4000)
    return () => window.clearTimeout(t)
  }, [router])

  if (!visible) return null

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-white px-6">
      <div
        className="flex flex-col items-center text-center"
        style={{
          animation: 'obCompleteIn 0.4s ease both',
        }}
      >
        <style
          dangerouslySetInnerHTML={{
            __html: `@keyframes obCompleteIn { from { opacity: 0; transform: scale(0.5); } to { opacity: 1; transform: scale(1); } }`,
          }}
        />
        <svg width="64" height="64" viewBox="0 0 64 64" fill="none" className="text-[#18a87c]" aria-hidden>
          <circle cx="32" cy="32" r="30" stroke="currentColor" strokeWidth="3" />
          <path d="M18 32l10 10 18-22" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <h2 className="mt-8 text-2xl font-extrabold text-[#0d2b1f]">Dein Profil ist bereit.</h2>
        <p className="mt-3 max-w-md text-[15px] leading-relaxed text-[#8aa89e]">
          Du kannst dich jetzt auf Wohnungen bewerben.
        </p>
        <div className="mt-10 flex w-full max-w-md flex-col gap-3 min-[480px]:flex-row min-[480px]:justify-center">
          <Link
            href="/wohnungen"
            onClick={() => setVisible(false)}
            className="flex h-12 min-h-[48px] flex-1 items-center justify-center rounded-xl border-2 border-[#18a87c] bg-white text-center text-[15px] font-bold text-[#18a87c]"
          >
            Wohnungen ansehen
          </Link>
          <Link
            href="/profil/betreibungsregister"
            onClick={() => setVisible(false)}
            className="flex h-12 min-h-[48px] flex-1 items-center justify-center rounded-xl bg-[#18a87c] text-center text-[15px] font-bold text-white"
          >
            Betreibungsregister hochladen
          </Link>
        </div>
      </div>
    </div>
  )
}
