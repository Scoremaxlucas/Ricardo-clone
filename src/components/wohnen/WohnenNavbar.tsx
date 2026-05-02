'use client'

import { Logo } from '@/components/ui/Logo'
import { LogOut, Menu, User, X } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'
import { useCallback, useEffect, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import { isBetreibungsregisterPath, isTenantProfilWizardPath } from '@/lib/wohnen-profil-flow-paths'
import { WOHNEN_SITE_ORIGIN } from '@/lib/site-urls'
import { formatDate } from '@/lib/utils/formatDate'

const WOHNEN_LOGIN_HREF = '/login?callbackUrl=%2Fmeine-matches'

type NavStatus = {
  profileComplete: boolean
  creditCheckStatus: string
  creditCheckExpiresAt: string | null
  creditApprovedAndValid: boolean
  creditPendingReview: boolean
  hasActiveCertificate: boolean
  certificateCode: string | null
  certificateExpiresAt: string | null
  hasListings: boolean
  openApplicationsCount: number
  newInquiriesCount: number
  isAdmin: boolean
}

const mobileDrawerLink =
  'flex min-h-[52px] items-center border-b border-[#e8f7f2] px-3 text-sm font-medium text-slate-800 hover:bg-[#f5fdfb]'
const mobileDrawerLinkTeal =
  'flex min-h-[52px] items-center border-b border-[#e8f7f2] bg-[#e8f7f2] px-3 text-sm font-semibold text-[#107a5a] hover:bg-[#dff5eb]'

function navLinkClass(active?: boolean) {
  return active ?
      'rounded-full bg-[#18a87c] px-3 py-1.5 text-sm font-semibold text-white shadow-sm hover:opacity-95'
    : 'rounded-md px-2 py-1.5 text-sm font-medium text-slate-800 hover:bg-slate-100 hover:text-slate-900'
}

function HlvMiniPanel({
  open,
  anchorRef,
  onClose,
  certificateCode,
  certificateExpiresAt,
}: {
  open: boolean
  anchorRef: React.RefObject<HTMLButtonElement | null>
  onClose: () => void
  certificateCode: string
  certificateExpiresAt: string | null
}) {
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent) => {
      const t = e.target as Node
      if (panelRef.current?.contains(t)) return
      if (anchorRef.current?.contains(t)) return
      onClose()
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [open, onClose, anchorRef])

  if (!open) return null

  const verifyUrl = `${WOHNEN_SITE_ORIGIN.replace(/\/$/, '')}/verify/${certificateCode}`

  return (
    <div
      ref={panelRef}
      className="absolute right-0 top-full z-[60] mt-2 w-[min(100vw-2rem,20rem)] rounded-xl border border-slate-200 bg-white p-4 shadow-xl"
      role="dialog"
      aria-label="Zertifikat"
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Dein Helvenda Zertifikat</p>
      <p className="mt-1 font-mono text-sm font-bold text-slate-900">{certificateCode}</p>
      <p className="mt-1 text-xs text-slate-600">
        Gültig bis{' '}
        {certificateExpiresAt ? formatDate(certificateExpiresAt) : 'n. v.'}
      </p>
      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <Link
          href={`/api/certificate/${encodeURIComponent(certificateCode)}/pdf?t=${Date.now()}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-1 items-center justify-center rounded-lg bg-[#18a87c] px-3 py-2 text-center text-xs font-bold text-white hover:opacity-95"
          onClick={onClose}
        >
          PDF herunterladen
        </Link>
        <button
          type="button"
          className="flex flex-1 items-center justify-center rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-50"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(verifyUrl)
              toast.success('Link kopiert')
              onClose()
            } catch {
              toast.error('Kopieren fehlgeschlagen')
            }
          }}
        >
          Link kopieren
        </button>
      </div>
    </div>
  )
}

export function WohnenNavbar() {
  const pathname = usePathname()
  const { data: session, status } = useSession()
  const user = session?.user as
    | { id?: string; name?: string | null; email?: string | null; image?: string | null }
    | undefined
  const signedIn = status === 'authenticated' && Boolean(user?.id)

  const [navReady, setNavReady] = useState(false)
  const [nav, setNav] = useState<NavStatus | null>(null)
  const lastGoodNavRef = useRef<NavStatus | null>(null)

  const [menuOpen, setMenuOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [hlvOpen, setHlvOpen] = useState(false)
  const hlvBtnRef = useRef<HTMLButtonElement>(null)

  const closeAll = useCallback(() => {
    setMenuOpen(false)
    setMobileOpen(false)
    setHlvOpen(false)
  }, [])

  useEffect(() => {
    if (status === 'loading') {
      setNavReady(false)
      return
    }
    if (status === 'unauthenticated') {
      lastGoodNavRef.current = null
      setNav(null)
      setNavReady(true)
      return
    }
    if (!user?.id) {
      setNav(null)
      setNavReady(true)
      return
    }

    let cancelled = false
    setNavReady(false)

    ;(async () => {
      const t0 = Date.now()
      try {
        const res = await fetch('/api/user/nav-status', { credentials: 'same-origin' })
        const json = (await res.json().catch(() => null)) as NavStatus | { message?: string } | null
        const elapsed = Date.now() - t0
        if (elapsed < 200) {
          await new Promise<void>(r => setTimeout(r, 200 - elapsed))
        }
        if (cancelled) return
        if (res.ok && json && 'profileComplete' in json) {
          lastGoodNavRef.current = json
          setNav(json)
        } else if (lastGoodNavRef.current) {
          setNav(lastGoodNavRef.current)
          toast.error('Navigation konnte nicht aktualisiert werden — letzter Stand.')
        } else {
          setNav(null)
        }
      } catch {
        if (!cancelled) {
          if (lastGoodNavRef.current) {
            setNav(lastGoodNavRef.current)
            toast.error('Navigation konnte nicht aktualisiert werden — letzter Stand.')
          } else {
            setNav(null)
          }
        }
      } finally {
        if (!cancelled) setNavReady(true)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [status, user?.id])

  useEffect(() => {
    if (mobileOpen) {
      const prev = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = prev
      }
    }
    return
  }, [mobileOpen])

  const n = nav
  const isLandlord = Boolean(n?.hasListings)
  const tenantVerified = Boolean(n?.profileComplete && n?.creditApprovedAndValid)
  const showIncompleteProfile = Boolean(signedIn && n && !n.profileComplete)
  const showAuszugPill = Boolean(
    n?.profileComplete && !n.creditApprovedAndValid && !n.creditPendingReview
  )
  const showBewerbungenBadge = Boolean(n && n.openApplicationsCount > 0)
  const showHlvBadge = Boolean(n?.hasActiveCertificate && n?.certificateCode)

  type DropdownKind = 'A' | 'B' | 'C' | 'D' | 'P' | 'N'
  const dropdownKind: DropdownKind = (() => {
    if (!n) return 'N'
    if (!n.profileComplete) return 'A'
    if (n.creditPendingReview) return 'P'
    if (!n.creditApprovedAndValid) return 'B'
    if (n.hasActiveCertificate) return 'D'
    return 'C'
  })()

  const showZertifikatInMenu = Boolean(n?.hasActiveCertificate)

  const renderDesktopNav = () => {
    if (!signedIn || !navReady) return null
    if (!n) {
      return (
        <nav className="hidden min-w-0 flex-1 flex-wrap items-center justify-end gap-2 md:flex md:gap-3">
          <Link href="/wohnungen" className={navLinkClass(pathname.startsWith('/wohnungen'))}>
            Wohnungen suchen
          </Link>
          <Link href="/profil" className={navLinkClass(pathname.startsWith('/profil'))}>
            Profil
          </Link>
        </nav>
      )
    }

    if (isLandlord) {
      return (
        <nav className="hidden min-w-0 flex-1 flex-wrap items-center justify-end gap-2 md:flex md:gap-3">
          <Link href="/wohnungen" className={navLinkClass(pathname.startsWith('/wohnungen'))}>
            Wohnungen suchen
          </Link>
          {n.profileComplete ?
            <Link href="/meine-matches" className={navLinkClass(pathname === '/meine-matches')}>
              Meine Matches
            </Link>
          : null}
          <Link href="/matching/properties" className={navLinkClass(pathname.startsWith('/matching/properties'))}>
            Meine Inserate
          </Link>
          <Link
            href="/matching/properties"
            className="inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm font-medium text-slate-800 hover:bg-slate-100"
          >
            Neue Anfragen
            {n.newInquiriesCount > 0 ?
              <span className="rounded-full bg-[#18a87c] px-2 py-0.5 text-[11px] font-bold text-white">
                {n.newInquiriesCount}
              </span>
            : null}
          </Link>
          <Link
            href="/meine-bewerbungen"
            className="inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm font-medium text-slate-800 hover:bg-slate-100"
          >
            Bewerbungen
            {showBewerbungenBadge ?
              <span className="rounded-full bg-[#18a87c] px-2 py-0.5 text-[11px] font-bold text-white">
                {n.openApplicationsCount}
              </span>
            : null}
          </Link>
        </nav>
      )
    }

    if (showIncompleteProfile) {
      const onProfilWizard = isTenantProfilWizardPath(pathname)
      return (
        <nav className="hidden min-w-0 flex-1 flex-wrap items-center justify-end gap-2 md:flex md:gap-3">
          <Link href="/wohnungen" className={navLinkClass(pathname.startsWith('/wohnungen'))}>
            Wohnungen suchen
          </Link>
          {onProfilWizard ?
            <span className="rounded-full border border-teal-200 bg-teal-50 px-3 py-1.5 text-xs font-semibold text-teal-900">
              Profil-Assistent
            </span>
          : <Link
              href="/profil/erstellen"
              className="rounded-full bg-orange-500 px-4 py-2 text-sm font-bold text-white shadow-sm hover:bg-orange-600"
            >
              Profil vervollständigen
            </Link>}
        </nav>
      )
    }

    if (showAuszugPill) {
      const onBetreibungsPage = isBetreibungsregisterPath(pathname)
      return (
        <nav className="hidden min-w-0 flex-1 flex-wrap items-center justify-end gap-2 md:flex md:gap-3">
          <Link href="/wohnungen" className={navLinkClass(pathname.startsWith('/wohnungen'))}>
            Wohnungen suchen
          </Link>
          <Link href="/meine-matches" className={navLinkClass(pathname === '/meine-matches')}>
            Meine Matches
          </Link>
          {onBetreibungsPage ?
            <Link
              href="/profil"
              className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm hover:bg-slate-50"
            >
              Zum Profil
            </Link>
          : <Link
              href="/profil/betreibungsregister"
              className="rounded-full bg-orange-500 px-4 py-2 text-sm font-bold text-white shadow-sm hover:bg-orange-600"
            >
              Auszug hochladen
            </Link>}
        </nav>
      )
    }

    if (tenantVerified) {
      return (
        <nav className="hidden min-w-0 flex-1 flex-wrap items-center justify-end gap-2 md:flex md:gap-3">
          <Link href="/wohnungen" className={navLinkClass(pathname.startsWith('/wohnungen'))}>
            Wohnungen suchen
          </Link>
          <Link href="/meine-matches" className={navLinkClass(pathname === '/meine-matches')}>
            Meine Matches
          </Link>
          <Link
            href="/meine-bewerbungen"
            className="inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm font-medium text-slate-800 hover:bg-slate-100"
          >
            Bewerbungen
            {showBewerbungenBadge ?
              <span className="rounded-full bg-[#18a87c] px-2 py-0.5 text-[11px] font-bold text-white">
                {n.openApplicationsCount}
              </span>
            : null}
          </Link>
          {showHlvBadge ?
            <div className="relative">
              <button
                ref={hlvBtnRef}
                type="button"
                onClick={() => setHlvOpen(o => !o)}
                className="rounded-md border border-[#18a87c] bg-[#e8f7f2] px-2.5 py-1 text-xs font-bold tracking-wide text-[#107a5a] hover:bg-[#dff5eb]"
                aria-expanded={hlvOpen ? 'true' : 'false'}
              >
                HLV
              </button>
              <HlvMiniPanel
                open={hlvOpen}
                anchorRef={hlvBtnRef}
                onClose={() => setHlvOpen(false)}
                certificateCode={n.certificateCode!}
                certificateExpiresAt={n.certificateExpiresAt}
              />
            </div>
          : null}
        </nav>
      )
    }

    if (n.profileComplete && n.creditPendingReview) {
      return (
        <nav className="hidden min-w-0 flex-1 flex-wrap items-center justify-end gap-2 md:flex md:gap-3">
          <Link href="/wohnungen" className={navLinkClass(pathname.startsWith('/wohnungen'))}>
            Wohnungen suchen
          </Link>
          <Link href="/meine-matches" className={navLinkClass(pathname === '/meine-matches')}>
            Meine Matches
          </Link>
          <Link
            href="/meine-bewerbungen"
            className="inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm font-medium text-slate-800 hover:bg-slate-100"
          >
            Bewerbungen
            {showBewerbungenBadge ?
              <span className="rounded-full bg-[#18a87c] px-2 py-0.5 text-[11px] font-bold text-white">
                {n.openApplicationsCount}
              </span>
            : null}
          </Link>
        </nav>
      )
    }

    return (
      <nav className="hidden min-w-0 flex-1 flex-wrap items-center justify-end gap-2 md:flex md:gap-3">
        <Link href="/wohnungen" className={navLinkClass(pathname.startsWith('/wohnungen'))}>
          Wohnungen suchen
        </Link>
      </nav>
    )
  }

  const renderAvatarDropdown = () => {
    if (!signedIn) return null
    return (
      <div className="relative flex items-center gap-2">
        <button
          type="button"
          onClick={() => {
            setHlvOpen(false)
            setMenuOpen(m => !m)
          }}
          className="flex items-center gap-2 rounded-full border border-slate-200 p-0.5 pl-0.5 hover:bg-slate-50"
          aria-haspopup="menu"
        >
          {user?.image ?
            // eslint-disable-next-line @next/next/no-img-element
            <img src={user.image} alt="" className="h-8 w-8 rounded-full object-cover" />
          : <span className="flex h-8 w-8 items-center justify-center rounded-full bg-teal-100 text-teal-800">
              <User className="h-4 w-4" />
            </span>
          }
        </button>
        {menuOpen ?
          <>
            <button type="button" className="fixed inset-0 z-40 cursor-default" aria-label="Menü schliessen" onClick={() => setMenuOpen(false)} />
            <div className="absolute right-0 top-full z-50 mt-2 w-72 rounded-xl border border-slate-200 bg-white py-2 shadow-xl">
              <div className="border-b border-slate-100 px-3 py-2">
                <p className="truncate text-sm font-semibold text-slate-900">
                  {user?.name || 'Benutzer/in'}
                  {dropdownKind === 'D' ?
                    <span className="ml-2 text-xs font-semibold text-emerald-600">Verifiziert</span>
                  : null}
                </p>
                <p className="truncate text-xs text-slate-500">{user?.email || ''}</p>
              </div>

              {dropdownKind === 'A' ?
                <div className="mx-2 my-2 rounded-lg border-l-[3px] border-amber-500 bg-[#fffbeb] px-3 py-2.5">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-amber-500">Nächster Schritt</p>
                  <p className="mt-1 text-[13px] font-semibold text-[#1a1a1a]">Profil vervollständigen</p>
                  <p className="mt-0.5 text-[11px] text-[#5a5a5a]">Ohne Profil keine Bewerbungen</p>
                  <Link
                    href="/profil/erstellen"
                    className="mt-1.5 inline-block text-xs font-semibold text-amber-600 hover:underline"
                    onClick={() => setMenuOpen(false)}
                  >
                    Jetzt erstellen
                  </Link>
                </div>
              : null}

              {dropdownKind === 'B' ?
                <div className="mx-2 my-2 rounded-lg border-l-[3px] border-amber-500 bg-[#fffbeb] px-3 py-2.5">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-amber-500">Nächster Schritt</p>
                  <p className="mt-1 text-[13px] font-semibold text-[#1a1a1a]">Betreibungsregister hochladen</p>
                  <p className="mt-0.5 text-[11px] text-[#5a5a5a]">Viele Vermieter setzen ihn voraus</p>
                  <Link
                    href="/profil/betreibungsregister"
                    className="mt-1.5 inline-block text-xs font-semibold text-amber-600 hover:underline"
                    onClick={() => setMenuOpen(false)}
                  >
                    Jetzt hochladen
                  </Link>
                </div>
              : null}

              {dropdownKind === 'P' ?
                <div className="mx-2 my-2 rounded-lg border-l-[3px] border-amber-500 bg-[#fffbeb] px-3 py-2.5">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-amber-500">Status</p>
                  <p className="mt-1 text-[13px] font-semibold text-[#1a1a1a]">Betreibungsregister wird geprüft</p>
                  <p className="mt-0.5 text-[11px] text-[#5a5a5a]">Du wirst per E-Mail informiert.</p>
                  <Link
                    href="/profil/betreibungsregister"
                    className="mt-1.5 inline-block text-xs font-semibold text-amber-600 hover:underline"
                    onClick={() => setMenuOpen(false)}
                  >
                    Zur Übersicht
                  </Link>
                </div>
              : null}

              {dropdownKind === 'C' ?
                <div className="mx-2 my-2 rounded-lg border-l-[3px] border-[#18a87c] bg-[#e8f7f2] px-3 py-2.5">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-[#18a87c]">Neu fuer dich</p>
                  <p className="mt-1 text-[13px] font-semibold text-[#1a1a1a]">Zertifikat ausstellen lassen</p>
                  <p className="mt-0.5 text-[11px] text-[#5a5a5a]">Hebe dich von anderen ab</p>
                  <Link
                    href="/zertifikat"
                    className="mt-1.5 inline-block text-xs font-semibold text-[#107a5a] hover:underline"
                    onClick={() => setMenuOpen(false)}
                  >
                    Jetzt ausstellen
                  </Link>
                </div>
              : null}

              <div className="my-1 border-t border-slate-100" />
              <p className="px-3 py-1.5 text-[11px] leading-snug text-slate-500">
                Hilfe-Center und Kontakt: unten in der Fußzeile.
              </p>
              <Link
                href="/profil"
                className="flex items-center gap-2 px-3 py-2 text-sm text-slate-800 hover:bg-slate-50"
                onClick={() => setMenuOpen(false)}
              >
                Mein Profil
              </Link>
              {showZertifikatInMenu ?
                <Link
                  href="/zertifikat"
                  className="flex items-center gap-2 px-3 py-2 text-sm text-slate-800 hover:bg-slate-50"
                  onClick={() => setMenuOpen(false)}
                >
                  Mein Zertifikat
                </Link>
              : null}
              {n?.isAdmin ?
                <>
                  <div className="my-1 border-t border-slate-100" />
                  <p className="px-3 pb-1 pt-2 text-xs font-bold uppercase tracking-wide text-slate-500">Admin</p>
                  <Link
                    href="/admin/wohnen"
                    className="flex items-center gap-2 px-3 py-2 text-sm font-semibold text-[#107a5a] hover:bg-[#e8f7f2]"
                    onClick={() => setMenuOpen(false)}
                  >
                    Admin-Dashboard
                  </Link>
                </>
              : null}
              <div className="my-1 border-t border-slate-100" />
              <button
                type="button"
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-medium text-red-600 hover:bg-red-50"
                onClick={() => void signOut({ callbackUrl: '/' })}
              >
                <LogOut className="h-4 w-4" />
                Abmelden
              </button>
            </div>
          </>
        : null}
      </div>
    )
  }

  const mobileNavLinks = () => {
    if (!signedIn) {
      return (
        <>
          <Link href="/wohnungen" className={mobileDrawerLink} onClick={closeAll}>
            Wohnungen suchen
          </Link>
          <p className="border-b border-[#e8f7f2] px-3 py-2 text-xs text-slate-500">Hilfe & Kontakt: Fußzeile der Seite.</p>
          <Link href={WOHNEN_LOGIN_HREF} className={`${mobileDrawerLink} text-slate-600`} onClick={closeAll}>
            Anmelden
          </Link>
          <Link
            href="/register"
            className="flex min-h-[52px] items-center justify-center border-b border-[#e8f7f2] bg-[#18a87c] px-3 text-center text-sm font-semibold text-white hover:opacity-95"
            onClick={closeAll}
          >
            Kostenlos registrieren
          </Link>
        </>
      )
    }
    if (!navReady) {
      return <div className="space-y-2 px-2 py-4 text-sm text-slate-500">Laden…</div>
    }
    if (!n) {
      return (
        <>
          <Link href="/wohnungen" className={mobileDrawerLink} onClick={closeAll}>
            Wohnungen suchen
          </Link>
          <Link href="/profil" className={mobileDrawerLink} onClick={closeAll}>
            Profil
          </Link>
          <p className="border-b border-[#e8f7f2] px-3 py-2 text-xs text-slate-500">Hilfe & Kontakt: Fußzeile der Seite.</p>
          <div className="my-2 border-t border-slate-200" />
          <div className="border-b border-[#e8f7f2] px-3 py-3">
            <p className="text-xs font-semibold text-slate-500">Konto</p>
            <p className="truncate text-sm font-semibold text-slate-900">{user?.name || 'Benutzer/in'}</p>
            <p className="truncate text-xs text-slate-500">{user?.email || ''}</p>
          </div>
          <button
            type="button"
            className="mt-1 flex min-h-[52px] w-full items-center border-b border-[#e8f7f2] px-3 text-left text-sm font-medium text-red-600 hover:bg-red-50"
            onClick={() => void signOut({ callbackUrl: '/' })}
          >
            Abmelden
          </button>
        </>
      )
    }

    if (isLandlord) {
      return (
        <>
          <Link href="/wohnungen" className={mobileDrawerLink} onClick={closeAll}>
            Wohnungen suchen
          </Link>
          {n.profileComplete ?
            <Link href="/meine-matches" className={mobileDrawerLinkTeal} onClick={closeAll}>
              Meine Matches
            </Link>
          : null}
          <Link href="/matching/properties" className={mobileDrawerLinkTeal} onClick={closeAll}>
            Meine Inserate
          </Link>
          <Link href="/matching/properties" className={mobileDrawerLink} onClick={closeAll}>
            Neue Anfragen{n.newInquiriesCount > 0 ? ` (${n.newInquiriesCount})` : ''}
          </Link>
          <Link href="/meine-bewerbungen" className={mobileDrawerLink} onClick={closeAll}>
            Bewerbungen{n.openApplicationsCount > 0 ? ` (${n.openApplicationsCount})` : ''}
          </Link>
          <div className="my-2 border-t border-slate-200" />
          <div className="border-b border-[#e8f7f2] px-3 py-3">
            <p className="text-xs font-semibold text-slate-500">Konto</p>
            <p className="truncate text-sm font-semibold text-slate-900">{user?.name || 'Benutzer/in'}</p>
            <p className="truncate text-xs text-slate-500">{user?.email || ''}</p>
          </div>
          <p className="px-3 py-2 text-xs text-slate-500">Hilfe & Kontakt: Fußzeile der Seite.</p>
          <Link href="/profil" className={mobileDrawerLink} onClick={closeAll}>
            Mein Profil
          </Link>
          {n.isAdmin ?
            <Link href="/admin/wohnen" className={mobileDrawerLink} onClick={closeAll}>
              Admin-Dashboard
            </Link>
          : null}
          <button
            type="button"
            className="mt-1 flex min-h-[52px] w-full items-center border-b border-[#e8f7f2] px-3 text-left text-sm font-medium text-red-600 hover:bg-red-50"
            onClick={() => void signOut({ callbackUrl: '/' })}
          >
            Abmelden
          </button>
        </>
      )
    }

    return (
      <>
        <Link href="/wohnungen" className={mobileDrawerLink} onClick={closeAll}>
          Wohnungen suchen
        </Link>
        <p className="border-b border-[#e8f7f2] px-3 py-2 text-xs text-slate-500">Hilfe & Kontakt: Fußzeile der Seite.</p>
        {!n.profileComplete ?
          isTenantProfilWizardPath(pathname) ?
            <div className={`${mobileDrawerLink} bg-teal-50 text-sm font-semibold text-teal-900`}>
              Profil-Assistent — Schritt für Schritt
            </div>
          : <Link
              href="/profil/erstellen"
              className={`${mobileDrawerLink} bg-orange-50 font-semibold text-orange-950`}
              onClick={closeAll}
            >
              Profil vervollständigen
            </Link>
        : null}
        {n.profileComplete && !n.creditApprovedAndValid && !n.creditPendingReview ?
          <>
            <Link href="/meine-matches" className={mobileDrawerLinkTeal} onClick={closeAll}>
              Meine Matches
            </Link>
            {isBetreibungsregisterPath(pathname) ?
              <Link href="/profil" className={mobileDrawerLink} onClick={closeAll}>
                Zum Profil
              </Link>
            : <Link
                href="/profil/betreibungsregister"
                className={`${mobileDrawerLink} bg-orange-50 font-semibold text-orange-950`}
                onClick={closeAll}
              >
                Auszug hochladen
              </Link>}
          </>
        : null}
        {n.profileComplete && n.creditPendingReview ?
          <Link href="/meine-matches" className={mobileDrawerLinkTeal} onClick={closeAll}>
            Meine Matches
          </Link>
        : null}
        {n.profileComplete && (n.creditApprovedAndValid || n.creditPendingReview) ?
          <Link href="/meine-bewerbungen" className={mobileDrawerLink} onClick={closeAll}>
            Bewerbungen{n.openApplicationsCount > 0 ? ` (${n.openApplicationsCount})` : ''}
          </Link>
        : null}
        {n.hasActiveCertificate && n.certificateCode ?
          <Link
            href="/zertifikat"
            className={`${mobileDrawerLink} font-semibold text-[#107a5a]`}
            onClick={closeAll}
          >
            HLV / Zertifikat
          </Link>
        : null}

        <div className="my-2 border-t border-slate-200" />
        <div className="border-b border-[#e8f7f2] px-3 py-3">
          <p className="text-xs font-semibold text-slate-500">Konto</p>
          <p className="truncate text-sm font-semibold text-slate-900">{user?.name || 'Benutzer/in'}</p>
          <p className="truncate text-xs text-slate-500">{user?.email || ''}</p>
        </div>
        <Link href="/profil" className={mobileDrawerLink} onClick={closeAll}>
          Mein Profil
        </Link>
        {showZertifikatInMenu ?
          <Link href="/zertifikat" className={mobileDrawerLink} onClick={closeAll}>
            Mein Zertifikat
          </Link>
        : null}
        {n.isAdmin ?
          <Link href="/admin/wohnen" className={mobileDrawerLink} onClick={closeAll}>
            Admin-Dashboard
          </Link>
        : null}
        <button
          type="button"
          className="mt-1 flex min-h-[52px] w-full items-center border-b border-[#e8f7f2] px-3 text-left text-sm font-medium text-red-600 hover:bg-red-50"
          onClick={() => void signOut({ callbackUrl: '/' })}
        >
          Abmelden
        </button>
      </>
    )
  }

  const showSkeleton = status === 'loading' || (signedIn && !navReady)

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/90 bg-white/95 pt-[env(safe-area-inset-top,0px)] backdrop-blur supports-[backdrop-filter]:bg-white/90">
      <div className="mx-auto flex h-14 min-h-[3.5rem] max-w-6xl items-center justify-between gap-2 pl-[max(1rem,env(safe-area-inset-left,0px))] pr-[max(1rem,env(safe-area-inset-right,0px))] sm:gap-3 sm:px-6 lg:px-8">
        <Link href="/" className="flex min-w-0 shrink-0 items-center gap-2" onClick={closeAll}>
          <Logo size="sm" />
          <span className="truncate text-sm font-bold tracking-tight text-[#0f766e] sm:text-base">Wohnungen</span>
        </Link>

        {showSkeleton ?
          <div className="hidden flex-1 items-center justify-end gap-3 md:flex">
            <div className="h-4 w-28 animate-pulse rounded bg-slate-200" />
            <div className="h-8 w-24 animate-pulse rounded-lg bg-slate-200" />
          </div>
        : (
          <div className="hidden min-w-0 flex-1 items-center justify-end gap-3 md:flex">
            {!signedIn ?
              <nav className="flex flex-wrap items-center justify-end gap-2 sm:gap-3">
                <Link href="/wohnungen" className={navLinkClass(pathname.startsWith('/wohnungen'))}>
                  Wohnungen suchen
                </Link>
                <Link
                  href={WOHNEN_LOGIN_HREF}
                  className="rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
                >
                  Anmelden
                </Link>
                <Link
                  href="/register"
                  className="rounded-xl bg-[#18a87c] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-95"
                >
                  Kostenlos registrieren
                </Link>
              </nav>
            : (
              <>
                {renderDesktopNav()}
                {renderAvatarDropdown()}
              </>
            )}
          </div>
        )}

        <div className="flex items-center gap-2 md:hidden">
          <button
            type="button"
            className="inline-flex h-11 min-h-[44px] min-w-[44px] items-center justify-center rounded-md border border-teal-200 bg-white text-[#18a87c] shadow-sm"
            aria-label={mobileOpen ? 'Menü schliessen' : 'Menü öffnen'}
            onClick={() => setMobileOpen(o => !o)}
          >
            {mobileOpen ? <X className="h-6 w-6" strokeWidth={2} /> : <Menu className="h-6 w-6" strokeWidth={2} />}
          </button>
        </div>
      </div>

      <div className={`fixed inset-0 z-[60] md:hidden ${mobileOpen ? 'pointer-events-auto' : 'pointer-events-none'}`}>
        <button
          type="button"
          className={`absolute inset-0 bg-black/40 transition-opacity duration-[250ms] ease-out ${
            mobileOpen ? 'opacity-100' : 'opacity-0'
          }`}
          aria-label="Menü schliessen"
          onClick={() => setMobileOpen(false)}
        />
        <div
          className={`absolute inset-y-0 right-0 flex w-[85vw] max-w-[360px] flex-col border-l border-slate-200 bg-white shadow-[-12px_0_24px_rgba(0,0,0,0.12)] transition-transform duration-[250ms] ease-out ${
            mobileOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          <div className="flex items-center justify-end border-b border-slate-100 px-4 py-3">
            <button
              type="button"
              className="inline-flex h-11 min-h-[44px] min-w-[44px] items-center justify-center rounded-md text-slate-600 hover:bg-slate-100"
              aria-label="Schliessen"
              onClick={() => setMobileOpen(false)}
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-0 py-0 text-sm font-medium">{mobileNavLinks()}</div>
        </div>
      </div>
    </header>
  )
}
