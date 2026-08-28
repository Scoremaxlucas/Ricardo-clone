'use client'

import { sicPaths } from '@/lib/sic/config'
import { ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

function isLandingPath(pathname: string): boolean {
  return pathname === '/' || pathname === '/sic' || pathname === '/sic/'
}

function isWorkspacePath(pathname: string): boolean {
  return (
    pathname === sicPaths.certificateWorkspace ||
    pathname.startsWith(`${sicPaths.certificateWorkspace}/`)
  )
}

const primaryClass =
  'inline-flex items-center gap-1.5 rounded-lg bg-sic-action px-3.5 py-2 text-sm font-semibold text-white transition-colors hover:bg-sic-action-deep'

const secondaryClass =
  'rounded-lg border border-sic-navy/15 px-3.5 py-2 text-sm font-semibold text-sic-navy transition-colors hover:bg-sic-navy/5'

/**
 * Primäre Kopfzeilen-Aktion:
 * Gast → Zertifikat anlegen.
 * Mit Zertifikat und offenen Angaben → Angabe ergänzen.
 * Vollständig / auf dem Workspace ohne offene Angabe → Mein Zertifikat (oder nichts).
 */
export function SicHeaderCta({
  hasCertificate,
  canAddModules,
}: {
  hasCertificate: boolean
  canAddModules: boolean
}) {
  const pathname = usePathname()
  const onLanding = isLandingPath(pathname)
  const onWorkspace = isWorkspacePath(pathname)
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

  const canCheckout = !hasCertificate || canAddModules
  const checkoutLabel = hasCertificate ? 'Angabe ergänzen' : 'Zertifikat anlegen'
  const showWorkspaceLink = !onWorkspace && canCheckout

  return (
    <>
      {canCheckout ? (
        <CheckoutCta
          label={checkoutLabel}
          onLanding={onLanding}
          builderInView={builderInView}
        />
      ) : onWorkspace ? null : (
        <Link href={sicPaths.certificateWorkspace} className={primaryClass}>
          Mein Zertifikat
        </Link>
      )}
      {showWorkspaceLink ?
        <Link href={sicPaths.certificateWorkspace} className={secondaryClass}>
          Mein Zertifikat
        </Link>
      : null}
    </>
  )
}

function CheckoutCta({
  label,
  onLanding,
  builderInView,
}: {
  label: string
  onLanding: boolean
  builderInView: boolean
}) {
  if (onLanding && builderInView) {
    return (
      <button
        type="button"
        className={primaryClass}
        onClick={() => document.getElementById('sic-checkout-submit')?.click()}
      >
        {label}
      </button>
    )
  }

  if (onLanding) {
    return (
      <a
        href="#anlegen"
        className={primaryClass}
        onClick={e => {
          const el = document.getElementById('anlegen') ?? document.getElementById('module')
          if (!el) return
          e.preventDefault()
          el.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }}
      >
        {label}
      </a>
    )
  }

  return (
    <Link href={`${sicPaths.landing}#anlegen`} className={primaryClass}>
      {label} <ArrowRight className="h-3.5 w-3.5" />
    </Link>
  )
}
