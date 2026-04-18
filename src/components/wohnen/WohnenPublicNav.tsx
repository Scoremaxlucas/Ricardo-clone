'use client'

import { Logo } from '@/components/ui/Logo'
import { Home, LogOut, Menu, User, X } from 'lucide-react'
import Link from 'next/link'
import { signOut, useSession } from 'next-auth/react'
import { useCallback, useEffect, useState } from 'react'

function Divider() {
  return <span className="hidden h-5 w-px bg-slate-200 sm:inline-block" aria-hidden />
}

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

export function WohnenPublicNav() {
  const { data: session, status } = useSession()
  const user = session?.user as { id?: string; name?: string | null; email?: string | null; image?: string | null } | undefined
  const signedIn = status === 'authenticated' && Boolean(user?.id)
  const [open, setOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [navProfile, setNavProfile] = useState<TenantProfileBrief | undefined>(undefined)

  const closeAll = useCallback(() => {
    setOpen(false)
    setMenuOpen(false)
  }, [])

  useEffect(() => {
    if (!signedIn || !user?.id) {
      setNavProfile(null)
      return
    }
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch('/api/tenant-profile')
        if (cancelled) return
        if (res.status === 401) {
          setNavProfile(null)
          return
        }
        const data = (await res.json()) as { profile?: TenantProfileBrief }
        if (cancelled) return
        setNavProfile(data.profile ?? null)
      } catch {
        if (!cancelled) setNavProfile(null)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [signedIn, user?.id])

  const okGreen = creditValid(navProfile ?? null)
  const showProfileWarning = !navProfile || !navProfile.isComplete
  const showCreditRenew =
    Boolean(navProfile?.isComplete) &&
    !okGreen &&
    navProfile?.creditCheckStatus !== 'PENDING' &&
    navProfile?.creditCheckStatus !== 'PENDING_MANUAL_REVIEW'

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/90 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/90">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex min-w-0 shrink-0 items-center gap-2" onClick={closeAll}>
          <Logo size="sm" />
          <span className="truncate text-sm font-bold tracking-tight text-teal-900 sm:text-base">
            Helvenda Wohnungen
          </span>
        </Link>

        <nav className="hidden items-center gap-1 text-sm font-medium text-slate-700 md:flex md:gap-2">
          <Link href="/wohnungen" className="rounded-md px-2 py-1.5 hover:bg-slate-100 hover:text-slate-900">
            Wohnungen suchen
          </Link>
          {!signedIn ? (
            <>
              <Link
                href="/matching/properties/new"
                className="rounded-md px-2 py-1.5 hover:bg-slate-100 hover:text-slate-900"
              >
                Wohnung inserieren
              </Link>
              <Divider />
              <Link href="/login" className="rounded-md px-2 py-1.5 hover:bg-slate-100 hover:text-slate-900">
                Anmelden
              </Link>
              <Link
                href="/register"
                className="rounded-md bg-teal-700 px-3 py-1.5 text-white shadow-sm hover:bg-teal-800"
              >
                Registrieren
              </Link>
            </>
          ) : (
            <>
              <Link href="/matching/properties" className="rounded-md px-2 py-1.5 hover:bg-slate-100 hover:text-slate-900">
                Meine Inserate
              </Link>
              <Link href="/meine-bewerbungen" className="rounded-md px-2 py-1.5 hover:bg-slate-100 hover:text-slate-900">
                Meine Bewerbungen
              </Link>
              <Divider />
              <div className="flex items-center gap-2">
                {showProfileWarning ? (
                  <Link
                    href="/profil/erstellen"
                    className="hidden max-w-[200px] truncate rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-900 ring-1 ring-amber-200 lg:inline-block"
                  >
                    ⚠️ Profil vervollständigen
                  </Link>
                ) : null}
                {showCreditRenew ? (
                  <Link
                    href="/profil/betreibungsregister"
                    className="hidden max-w-[200px] truncate rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-900 ring-1 ring-amber-200 lg:inline-block"
                  >
                    ⚠️ Auszug erneuern
                  </Link>
                ) : null}
                {okGreen ? (
                  <span
                    className="hidden h-2.5 w-2.5 shrink-0 rounded-full bg-emerald-500 shadow-sm ring-2 ring-emerald-200 lg:inline-block"
                    title="Profil und Betreibungsregister gültig"
                  />
                ) : null}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setMenuOpen(m => !m)}
                    className="flex items-center gap-2 rounded-full border border-slate-200 p-0.5 pl-0.5 hover:bg-slate-50"
                    aria-expanded={menuOpen ? 'true' : 'false'}
                    aria-haspopup="menu"
                  >
                    {user?.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={user.image} alt="" className="h-8 w-8 rounded-full object-cover" />
                    ) : (
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-teal-100 text-teal-800">
                        <User className="h-4 w-4" />
                      </span>
                    )}
                  </button>
                  {menuOpen ? (
                    <>
                      <button
                        type="button"
                        className="fixed inset-0 z-40 cursor-default"
                        aria-label="Menü schliessen"
                        onClick={() => setMenuOpen(false)}
                      />
                      <div className="absolute right-0 top-full z-50 mt-2 w-56 rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
                        <Link
                          href="/profil"
                          className="flex items-center gap-2 px-3 py-2 text-sm text-slate-800 hover:bg-slate-50"
                          onClick={() => setMenuOpen(false)}
                        >
                          <User className="h-4 w-4" />
                          Mein Profil
                        </Link>
                        <Link
                          href="/meine-bewerbungen"
                          className="flex items-center gap-2 px-3 py-2 text-sm text-slate-800 hover:bg-slate-50"
                          onClick={() => setMenuOpen(false)}
                        >
                          Meine Bewerbungen
                        </Link>
                        <div className="my-1 border-t border-slate-100" />
                        <button
                          type="button"
                          className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-800 hover:bg-slate-50"
                          onClick={() => void signOut({ callbackUrl: '/' })}
                        >
                          <LogOut className="h-4 w-4" />
                          Abmelden
                        </button>
                      </div>
                    </>
                  ) : null}
                </div>
              </div>
            </>
          )}
        </nav>

        <button
          type="button"
          className="inline-flex items-center justify-center rounded-md border border-slate-200 p-2 text-slate-800 md:hidden"
          aria-label={open ? 'Menü schliessen' : 'Menü öffnen'}
          onClick={() => setOpen(o => !o)}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open ? (
        <div className="border-t border-slate-100 bg-white px-4 py-4 md:hidden">
          <div className="mx-auto flex max-w-6xl flex-col gap-1 text-sm font-medium">
            <Link href="/wohnungen" className="flex items-center gap-2 rounded-md px-2 py-2 hover:bg-slate-50" onClick={closeAll}>
              <Home className="h-4 w-4" />
              Wohnungen suchen
            </Link>
            {!signedIn ? (
              <>
                <Link
                  href="/matching/properties/new"
                  className="rounded-md px-2 py-2 hover:bg-slate-50"
                  onClick={closeAll}
                >
                  Wohnung inserieren
                </Link>
                <Link href="/login" className="rounded-md px-2 py-2 hover:bg-slate-50" onClick={closeAll}>
                  Anmelden
                </Link>
                <Link
                  href="/register"
                  className="rounded-md bg-teal-700 px-3 py-2 text-center text-white"
                  onClick={closeAll}
                >
                  Registrieren
                </Link>
              </>
            ) : (
              <>
                {showProfileWarning ? (
                  <Link href="/profil/erstellen" className="rounded-md px-2 py-2 text-amber-900 hover:bg-amber-50" onClick={closeAll}>
                    ⚠️ Profil vervollständigen
                  </Link>
                ) : null}
                {showCreditRenew ? (
                  <Link
                    href="/profil/betreibungsregister"
                    className="rounded-md px-2 py-2 text-amber-900 hover:bg-amber-50"
                    onClick={closeAll}
                  >
                    ⚠️ Auszug erneuern
                  </Link>
                ) : null}
                <Link href="/matching/properties" className="rounded-md px-2 py-2 hover:bg-slate-50" onClick={closeAll}>
                  Meine Inserate
                </Link>
                <Link href="/meine-bewerbungen" className="rounded-md px-2 py-2 hover:bg-slate-50" onClick={closeAll}>
                  Meine Bewerbungen
                </Link>
                <Link href="/profil" className="rounded-md px-2 py-2 hover:bg-slate-50" onClick={closeAll}>
                  Mein Profil
                </Link>
                <button
                  type="button"
                  className="rounded-md px-2 py-2 text-left hover:bg-slate-50"
                  onClick={() => void signOut({ callbackUrl: '/' })}
                >
                  Abmelden
                </button>
              </>
            )}
          </div>
        </div>
      ) : null}
    </header>
  )
}
