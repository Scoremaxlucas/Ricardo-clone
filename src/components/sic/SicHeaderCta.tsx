'use client'

import { sicPaths } from '@/lib/sic/config'
import { ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

function isLandingPath(pathname: string): boolean {
  return pathname === '/' || pathname === '/sic' || pathname === '/sic/'
}

const ctaClass =
  'inline-flex items-center gap-1.5 rounded-lg bg-sic-action px-3.5 py-2 text-sm font-semibold text-white transition-colors hover:bg-sic-action-deep'

/**
 * Auf der Landing: Checkout auslösen, sobald der Builder sichtbar ist.
 * Sonst zur Hero-Eingabe (`#anlegen`) oder zum Builder scrollen.
 * Auf allen anderen SIC-Seiten: Link zur Landing.
 */
export function SicHeaderCta() {
  const pathname = usePathname()
  const onLanding = isLandingPath(pathname)
  const [builderInView, setBuilderInView] = useState(false)

  useEffect(() => {
    if (!onLanding) {
      setBuilderInView(false)
      return
    }
    const el = document.getElementById('module')
    if (!el) return
    const io = new IntersectionObserver(
      ([entry]) => setBuilderInView(entry.isIntersecting),
      { threshold: 0.25 }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [onLanding])

  if (onLanding && builderInView) {
    return (
      <button
        type="button"
        className={ctaClass}
        onClick={() => document.getElementById('sic-checkout-submit')?.click()}
      >
        Zertifikat anlegen
      </button>
    )
  }

  if (onLanding) {
    return (
      <a
        href="#anlegen"
        className={ctaClass}
        onClick={e => {
          const el = document.getElementById('anlegen') ?? document.getElementById('module')
          if (!el) return
          e.preventDefault()
          el.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }}
      >
        Zertifikat anlegen
      </a>
    )
  }

  return (
    <Link href={`${sicPaths.landing}#anlegen`} className={ctaClass}>
      Zertifikat anlegen <ArrowRight className="h-3.5 w-3.5" />
    </Link>
  )
}
