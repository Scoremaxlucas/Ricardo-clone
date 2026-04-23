'use client'

import { Logo } from '@/components/ui/Logo'
import { LogOut, Menu, User, X } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'
import { useCallback, useEffect, useState } from 'react'

type TenantProfileBrief = {
  isComplete: boolean
  creditCheckStatus: string
  creditCheckExpiresAt: string | null
} | null

function creditValid(p: TenantProfileBrief): boolean {
  if (!p?.isComplete) return false
  if (p.creditCheckStatus !== 'APPROVED') return false
  if (!p.creditCheckExpiresAt) return false
  return new Date(p.creditCheckExpiresAt).getTime() > Date.now()
}

const mobileDrawerLink =
  'flex min-h-[52px] items-center border-b border-[#e8f7f2] px-3 text-sm font-medium text-slate-800 hover:bg-[#f5fdfb]'
const mobileDrawerLinkTeal =
  'flex min-h-[52px] items-center border-b border-[#e8f7f2] bg-[#e8f7f2] px-3 text-sm font-semibold text-[#107a5a] hover:bg-[#dff5eb]'

/** Nach Login: Matches zuerst (unvollständiges Profil wird von /meine-matches weitergeleitet). */
const WOHNEN_LOGIN_HREF = '/login?callbackUrl=%2Fmeine-matches'

export function WohnenNavbar() {
  const pathname = usePathname()
  const { data: session, status } = useSession()
  const user = session?.user as { id?: string; name?: string | null; email?: string | null; image?: string | null } | undefined
  const signedIn = status === 'authenticated' && Boolean(user?.id)

  const [navReady, setNavReady] = useState(false)
  const [profile, setProfile] = useState<TenantProfileBrief | undefined>(undefined)
  const [hasListings, setHasListings] = useState(false)
  const [isAdminUser, setIsAdminUser] = useState(false)

  const [menuOpen, setMenuOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  const closeAll = useCallback(() => {
    setMenuOpen(false)
    setMobileOpen(false)
  }, [])

  useEffect(() => {
    if (status === 'loading') {
      setNavReady(false)
      return
    }
    if (status === 'unauthenticated') {
      setNavReady(true)
      setProfile(null)
      setHasListings(false)
      setIsAdminUser(false)
      return
    }
    if (!user?.id) {
      setNavReady(true)
      return
    }

    let cancelled = false
    setNavReady(false)
    ;(async () => {
      let resolvedAdmin = false
      try {
        const adminRes = await fetch('/api/user/admin-status', { credentials: 'same-origin' })
        const adminJson = (await adminRes.json().catch(() => ({}))) as { isAdmin?: boolean }
        resolvedAdmin = adminJson.isAdmin === true
        if (!cancelled) setIsAdminUser(resolvedAdmin)

        const [tpRes, ownRes] = await Promise.all([
          fetch('/api/tenant-profile', { credentials: 'same-origin' }),
          fetch('/api/rental-listings?own=true', { credentials: 'same-origin' }),
        ])
        if (cancelled) return

        if (tpRes.status === 401) {
          setProfile(null)
        } else if (tpRes.ok) {
          const tpJson = (await tpRes.json().catch(() => ({}))) as { profile?: TenantProfileBrief | null }
          setProfile(tpJson.profile ?? null)
        }
        // Bei 5xx/Netzwerk: Profil-State nicht auf null setzen — sonst fälschlich «Profil erstellen».

        const ownJson = (await ownRes.json().catch(() => ({}))) as { hasListings?: boolean }
        setHasListings(Boolean(ownJson.hasListings))
      } catch {
        if (!cancelled) {
          setHasListings(false)
          // Admin-Status nicht auf false zurücksetzen, falls nur Zusatz-Fetches fehlschlagen.
          setIsAdminUser(prev => prev || resolvedAdmin)
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

  const okGreen = creditValid(profile ?? null)
  const creditPending =
    profile?.creditCheckStatus === 'PENDING' || profile?.creditCheckStatus === 'PENDING_MANUAL_REVIEW'
  const showCreditRenew =
    Boolean(signedIn && navReady && profile?.isComplete) && !okGreen && !creditPending

  const showLandlordNav = Boolean(signedIn && navReady && hasListings)
  const showMatchesNav = Boolean(signedIn && navReady && profile?.isComplete)
  const showTenantCompleteNav = Boolean(
    signedIn && navReady && !hasListings && profile?.isComplete && (okGreen || creditPending)
  )

  /** Kein tenant_profiles-Datensatz — wirklich neu anlegen. */
  const needsNewProfile = Boolean(signedIn && navReady && !hasListings && profile === null)
  /** Datensatz da, aber Flag noch nicht „vollständig“ (soll nach PATCH/Backfill nicht mehr vorkommen). */
  const needsProfileCompletion = Boolean(
    signedIn && navReady && !hasListings && profile != null && !profile.isComplete
  )
  const showIncompleteTenantNav = needsNewProfile || needsProfileCompletion

  const renderDesktopCenterLinks = () => {
    if (!signedIn || !navReady) return null
    if (profile?.isComplete) {
      return (
        <>
          <Link
            href="/meine-matches"
            className="rounded-md bg-teal-700 px-3 py-1.5 text-sm font-semibold text-white hover:bg-teal-800"
          >
            Meine Matches
          </Link>
          <Link
            href="/wohnungen"
            className="rounded-md px-2 py-1.5 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
          >
            Alle Wohnungen
          </Link>
        </>
      )
    }
    return null
  }

  const renderAuthButtons = () => {
    if (!signedIn) {
      return null
    }
    return (
      <div className="relative hidden items-center gap-2 md:flex">
        {showTenantCompleteNav && okGreen ?
          <span
            className="h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-sm ring-2 ring-emerald-200"
            title="Profil und Betreibungsregisterauszug gültig"
          />
        : null}
        <button
          type="button"
          onClick={() => setMenuOpen(m => !m)}
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
            <div className="absolute right-0 top-full z-50 mt-2 w-64 rounded-xl border border-slate-200 bg-white py-2 shadow-xl">
              <div className="border-b border-slate-100 px-3 py-2">
                <p className="truncate text-sm font-semibold text-slate-900">{user?.name || 'Benutzer/in'}</p>
                <p className="truncate text-xs text-slate-500">{user?.email || ''}</p>
              </div>
              <Link
                href="/wohnungen"
                className="flex items-center gap-2 px-3 py-2 text-sm text-slate-800 hover:bg-slate-50"
                onClick={() => setMenuOpen(false)}
              >
                Wohnungen suchen
              </Link>
              {needsNewProfile ? (
                <Link
                  href="/profil/erstellen"
                  className="flex items-center gap-2 px-3 py-2 text-sm font-semibold text-amber-950 hover:bg-amber-50"
                  onClick={() => setMenuOpen(false)}
                >
                  Profil erstellen
                </Link>
              ) : null}
              {needsProfileCompletion ? (
                <Link
                  href="/profil/bearbeiten"
                  className="flex items-center gap-2 px-3 py-2 text-sm font-semibold text-amber-950 hover:bg-amber-50"
                  onClick={() => setMenuOpen(false)}
                >
                  Profil vervollständigen
                </Link>
              ) : null}
              {showMatchesNav ? (
                <Link
                  href="/meine-matches"
                  className="flex items-center gap-2 px-3 py-2 text-sm text-slate-800 hover:bg-slate-50"
                  onClick={() => setMenuOpen(false)}
                >
                  Meine Matches
                </Link>
              ) : null}
              <Link
                href="/profil"
                className="flex items-center gap-2 px-3 py-2 text-sm text-slate-800 hover:bg-slate-50"
                onClick={() => setMenuOpen(false)}
              >
                Mein Profil
              </Link>
              <Link
                href="/meine-bewerbungen"
                className="flex items-center gap-2 px-3 py-2 text-sm text-slate-800 hover:bg-slate-50"
                onClick={() => setMenuOpen(false)}
              >
                Meine Bewerbungen
              </Link>
              {hasListings ?
                <Link
                  href="/matching/properties"
                  className="flex items-center gap-2 px-3 py-2 text-sm text-slate-800 hover:bg-slate-50"
                  onClick={() => setMenuOpen(false)}
                >
                  Meine Inserate
                </Link>
              : null}
              {isAdminUser ?
                <>
                  <div className="my-1 border-t border-slate-100" />
                  <p className="px-3 pb-1 pt-2 text-xs font-bold uppercase tracking-wide text-slate-500">⚙️ Admin</p>
                  <Link
                    href="/admin/wohnen"
                    className="flex items-center gap-2 px-3 py-2 text-sm font-semibold text-[#107a5a] hover:bg-[#e8f7f2]"
                    onClick={() => setMenuOpen(false)}
                  >
                    Admin-Dashboard
                  </Link>
                  <p className="px-3 pb-2 pt-0 text-[11px] leading-snug text-slate-500">
                    Inserate, Bewerbungen, Reviews und www-Links erreichst du dort.
                  </p>
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
    return (
      <>
        {showMatchesNav ? (
          <Link href="/meine-matches" className={mobileDrawerLinkTeal} onClick={closeAll}>
            Meine Matches
          </Link>
        ) : null}

        {showLandlordNav ?
          <>
            <Link href="/wohnungen" className={mobileDrawerLink} onClick={closeAll}>
              Wohnungen suchen
            </Link>
            <Link href="/matching/properties" className={mobileDrawerLink} onClick={closeAll}>
              Meine Inserate
            </Link>
            <Link href="/matching/properties/new" className={mobileDrawerLink} onClick={closeAll}>
              Neues Inserat
            </Link>
          </>
        : null}
        {needsNewProfile ?
          <>
            <Link href="/wohnungen" className={mobileDrawerLink} onClick={closeAll}>
              Wohnungen suchen
            </Link>
            <Link
              href="/profil/erstellen"
              className={`${mobileDrawerLink} bg-amber-50 font-semibold text-amber-950 hover:bg-amber-100`}
              onClick={closeAll}
            >
              ⚠️ Profil erstellen
            </Link>
          </>
        : null}
        {needsProfileCompletion ?
          <>
            <Link href="/wohnungen" className={mobileDrawerLink} onClick={closeAll}>
              Wohnungen suchen
            </Link>
            <Link
              href="/profil/bearbeiten"
              className={`${mobileDrawerLink} bg-amber-50 font-semibold text-amber-950 hover:bg-amber-100`}
              onClick={closeAll}
            >
              ⚠️ Profil vervollständigen
            </Link>
          </>
        : null}
        {showCreditRenew && !showLandlordNav ?
          <>
            <Link href="/wohnungen" className={mobileDrawerLink} onClick={closeAll}>
              Wohnungen suchen
            </Link>
            <Link
              href="/profil/betreibungsregister"
              className={`${mobileDrawerLink} bg-orange-50 font-semibold text-orange-950 hover:bg-orange-100`}
              onClick={closeAll}
            >
              ⚠️ Auszug erneuern
            </Link>
          </>
        : null}
        {showTenantCompleteNav ?
          <>
            <Link href="/wohnungen" className={mobileDrawerLink} onClick={closeAll}>
              Wohnungen suchen
            </Link>
            <Link href="/meine-bewerbungen" className={mobileDrawerLink} onClick={closeAll}>
              Meine Bewerbungen
            </Link>
            <Link href="/matching/properties/new" className={mobileDrawerLink} onClick={closeAll}>
              Wohnung inserieren
            </Link>
          </>
        : null}
        {!showLandlordNav && !showIncompleteTenantNav && !showCreditRenew && !showTenantCompleteNav ?
          <Link href="/wohnungen" className={mobileDrawerLink} onClick={closeAll}>
            Wohnungen suchen
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
        <Link href="/meine-bewerbungen" className={mobileDrawerLink} onClick={closeAll}>
          Meine Bewerbungen
        </Link>
        {hasListings ?
          <Link href="/matching/properties" className={mobileDrawerLink} onClick={closeAll}>
            Meine Inserate
          </Link>
        : null}
        {isAdminUser ?
          <>
            <p className="border-b border-[#e8f7f2] px-3 pb-2 pt-3 text-xs font-bold uppercase tracking-wide text-slate-500">⚙️ Admin</p>
            <Link href="/admin/wohnen" className={`${mobileDrawerLink} font-semibold text-[#107a5a] hover:bg-[#e8f7f2]`} onClick={closeAll}>
              Admin-Dashboard
            </Link>
            <p className="border-b border-[#e8f7f2] px-3 py-2 text-[11px] leading-snug text-slate-500">
              Inserate, Bewerbungen, Reviews und www-Links erreichst du dort.
            </p>
          </>
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
    <header className="sticky top-0 z-50 border-b border-slate-200/90 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/90">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
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
          <nav className="hidden flex-1 items-center justify-end gap-3 md:flex md:gap-4">
            {!signedIn ?
              <>
                <Link href="/wohnungen" className="rounded-md px-2 py-1.5 text-sm font-medium text-slate-800 hover:bg-slate-100 hover:text-slate-900">
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
                  Registrieren
                </Link>
              </>
            : profile?.isComplete ? (
              <>
                {renderDesktopCenterLinks()}
                {renderAuthButtons()}
              </>
            ) : profile === undefined ? (
              <>
                <Link href="/wohnungen" className="rounded-md px-2 py-1.5 text-sm font-medium text-slate-800 hover:bg-slate-100 hover:text-slate-900">
                  Wohnungen suchen
                </Link>
                {renderAuthButtons()}
              </>
            ) : profile === null ? (
              <>
                <Link href="/wohnungen" className="rounded-md px-2 py-1.5 text-sm font-medium text-slate-800 hover:bg-slate-100 hover:text-slate-900">
                  Wohnungen suchen
                </Link>
                <Link
                  href="/profil/erstellen"
                  className="rounded-md bg-amber-100 px-3 py-2 text-sm font-semibold text-amber-950 hover:bg-amber-200"
                >
                  Profil erstellen
                </Link>
                {renderAuthButtons()}
              </>
            ) : (
              <>
                <Link href="/wohnungen" className="rounded-md px-2 py-1.5 text-sm font-medium text-slate-800 hover:bg-slate-100 hover:text-slate-900">
                  Wohnungen suchen
                </Link>
                <Link
                  href="/profil/bearbeiten"
                  className="rounded-md bg-amber-100 px-3 py-2 text-sm font-semibold text-amber-950 hover:bg-amber-200"
                >
                  Profil vervollständigen
                </Link>
                {renderAuthButtons()}
              </>
            )}
          </nav>
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

      {/* Mobile slide-in */}
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
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <span className="text-sm font-bold text-slate-900">Menü</span>
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
