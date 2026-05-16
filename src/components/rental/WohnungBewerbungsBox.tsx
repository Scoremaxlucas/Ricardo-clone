'use client'

import { wohnenToast } from '@/lib/wohnen-toast'
import type { QualificationIssue } from '@/lib/rental/qualifyTenant'
import { Check, CheckCircle2, FileText, Lock, ShieldCheck } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useMemo, useState } from 'react'

type Props = {
  listingId: string
  listingTitle: string
  rentPerMonth: number
  requiresCreditCheck: boolean
  userId: string | null
  profileComplete: boolean
  creditCheckOk: boolean
  /** Profil + ggf. Betreibungsregisterauszug erfüllt */
  tenantApplyReady: boolean
  /** Bereits eine laufende / genehmigte Bewerbung auf dieses Inserat */
  alreadyApplied: boolean
  isOwner: boolean
  /** Kompakte Darstellung für fixierte Mobile-Leiste */
  compact?: boolean
}

export function WohnungBewerbungsBox({
  listingId,
  listingTitle,
  rentPerMonth,
  requiresCreditCheck,
  userId,
  profileComplete,
  creditCheckOk,
  tenantApplyReady,
  alreadyApplied,
  isOwner,
  compact = false,
}: Props) {
  const router = useRouter()
  const [loginOpen, setLoginOpen] = useState(false)
  const [applyOpen, setApplyOpen] = useState(false)
  const [applyConfirm, setApplyConfirm] = useState(false)
  const [applySubmitting, setApplySubmitting] = useState(false)
  const [applyError, setApplyError] = useState<string | null>(null)
  const [applyDone, setApplyDone] = useState(false)
  const [qualifying, setQualifying] = useState(false)
  const [qualified, setQualified] = useState<boolean | null>(null)
  const [issues, setIssues] = useState<QualificationIssue[]>([])

  const listingPath = `/wohnungen/${listingId}`
  const bewerbenPath = `${listingPath}/bewerben`
  const loginCallback = listingPath

  useEffect(() => {
    if (!userId || isOwner || alreadyApplied) return
    let cancelled = false
    setQualifying(true)
    ;(async () => {
      try {
        const res = await fetch(`/api/rental-applications/qualify?listingId=${encodeURIComponent(listingId)}`, {
          credentials: 'same-origin',
        })
        const data = (await res.json().catch(() => ({}))) as {
          qualified?: boolean
          issues?: QualificationIssue[]
          requiresLogin?: boolean
        }
        if (cancelled) return
        if (data.requiresLogin) {
          setQualified(null)
          setIssues([])
          return
        }
        setQualified(data.qualified === true)
        setIssues(Array.isArray(data.issues) ? data.issues : [])
      } catch {
        if (!cancelled) {
          setQualified(false)
          setIssues([
            {
              code: 'QUALIFY_UNAVAILABLE',
              message:
                'Die Prüfung der Bewerbungsvoraussetzungen ist momentan nicht erreichbar. Bitte Seite neu laden oder später erneut versuchen.',
              action: 'Erneut laden',
              actionUrl: listingPath,
              blocking: true,
            },
          ])
        }
      } finally {
        if (!cancelled) setQualifying(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [userId, isOwner, alreadyApplied, listingId, tenantApplyReady, listingPath])

  const blockingCount = useMemo(() => issues.filter(i => i.blocking).length, [issues])
  const isQualifiedNow = Boolean(userId && qualified === true)
  const notQualified = Boolean(userId && !alreadyApplied && !isQualifiedNow)

  const compactHint = useMemo(() => {
    if (!compact || !userId || alreadyApplied || !notQualified) return null
    if (issues.find(i => i.code === 'NO_LANDLORD_NOTIFY_EMAIL')) {
      return 'Keine gültige Vermieter-E-Mail am Inserat — Bewerbung nicht möglich.'
    }
    if (issues.find(i => i.code === 'QUALIFY_UNAVAILABLE')) {
      return 'Prüfung nicht erreichbar — bitte später erneut.'
    }
    const first = issues.find(i => i.blocking)?.message ?? issues[0]?.message
    if (!first) return null
    return first.length > 96 ? `${first.slice(0, 94)}…` : first
  }, [compact, userId, alreadyApplied, notQualified, issues])

  const openApplyModal = useCallback(() => {
    setApplyConfirm(false)
    setApplyError(null)
    setApplyDone(false)
    setApplyOpen(true)
  }, [])

  const submitApplication = useCallback(async () => {
    if (!applyConfirm) {
      setApplyError('Bitte bestätige die Checkbox.')
      return
    }
    setApplyError(null)
    setApplySubmitting(true)
    try {
      const res = await fetch('/api/rental-applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rentalListingId: listingId }),
      })
      const data = (await res.json().catch(() => ({}))) as { code?: string; message?: string }
      if (!res.ok) {
        if (data.code === 'ALREADY_APPLIED') {
          wohnenToast.alreadyApplied()
          router.replace('/meine-bewerbungen?already=true')
          return
        }
        if (data.code === 'LANDLORD_EMAIL_FAILED') {
          setApplyError(
            typeof data.message === 'string' ?
              data.message
            : 'Die Benachrichtigung an den Vermieter konnte nicht versendet werden. Bitte versuche es in wenigen Minuten erneut.'
          )
          return
        }
        if (data.code === 'NO_LANDLORD_NOTIFY_EMAIL') {
          setApplyError(
            typeof data.message === 'string' ?
              data.message
            : 'Für dieses Inserat ist keine gültige Vermieter-E-Mail hinterlegt — eine Bewerbung ist momentan nicht möglich.'
          )
          return
        }
        setApplyError(typeof data.message === 'string' ? data.message : 'Senden fehlgeschlagen')
        return
      }
      wohnenToast.applicationSuccess()
      setApplyDone(true)
      router.refresh()
    } catch {
      wohnenToast.genericError()
    } finally {
      setApplySubmitting(false)
    }
  }, [applyConfirm, listingId, router])

  const onPrimaryClick = () => {
    if (isOwner) return
    if (!userId) {
      setLoginOpen(true)
      return
    }
    if (notQualified) {
      router.push(bewerbenPath)
      return
    }
    if (alreadyApplied) return
    openApplyModal()
  }

  if (isOwner) {
    return (
      <div className={`rounded-2xl border border-slate-200 bg-white shadow-lg ${compact ? 'border-0 p-0 shadow-none ring-0' : 'p-6'}`}>
        <p className={`text-center text-sm font-medium text-slate-600 ${compact ? 'py-2' : ''}`}>
          Das ist dein eigenes Inserat.
        </p>
      </div>
    )
  }

  const label = (() => {
    if (!userId) return 'Anmelden zum Bewerben'
    if (alreadyApplied) return 'Bereits beworben'
    if (notQualified) return 'Anforderungen prüfen'
    return 'Jetzt bewerben'
  })()

  const disabled = Boolean(userId && alreadyApplied)
  const isTealPrimary = (!userId || isQualifiedNow) && !alreadyApplied

  const primaryBtnClass = (() => {
    const base = 'min-h-[48px] shrink-0 rounded-xl px-4 py-2.5 text-center text-sm font-bold transition sm:min-h-[44px]'
    if (disabled) {
      return `${base} cursor-not-allowed bg-slate-300 text-slate-600`
    }
    if (notQualified) {
      return `${base} bg-orange-500 text-white shadow-md hover:bg-orange-600`
    }
    if (isTealPrimary) {
      return `${base} bg-[#18a87c] text-white shadow-md hover:opacity-95`
    }
    return `${base} border-2 border-teal-700 bg-white text-teal-800 shadow-sm hover:bg-teal-50`
  })()

  const sheetClass =
    'wohnen-bottom-sheet-panel max-h-[min(90vh,calc(100dvh-env(safe-area-inset-top,0px)-env(safe-area-inset-bottom,0px)-0.5rem))] w-full max-w-md overflow-y-auto rounded-t-[20px] bg-white pt-2 pl-[max(1.25rem,env(safe-area-inset-left,0px))] pr-[max(1.25rem,env(safe-area-inset-right,0px))] pb-[max(1.5rem,env(safe-area-inset-bottom,0px))] shadow-xl sm:max-h-[min(90vh,calc(100dvh-2rem))] sm:rounded-2xl sm:pt-6 sm:pl-[max(1.5rem,env(safe-area-inset-left,0px))] sm:pr-[max(1.5rem,env(safe-area-inset-right,0px))] sm:pb-[max(1.5rem,env(safe-area-inset-bottom,0px))]'
  const overlayClass =
    'fixed inset-0 z-[100] flex items-end justify-center bg-black/50 pt-[max(0px,env(safe-area-inset-top,0px))] pl-[max(0px,env(safe-area-inset-left,0px))] pr-[max(0px,env(safe-area-inset-right,0px))] sm:items-center sm:p-4 sm:pl-[max(1rem,env(safe-area-inset-left,0px))] sm:pr-[max(1rem,env(safe-area-inset-right,0px))] sm:pt-[max(1rem,env(safe-area-inset-top,0px))] sm:pb-[max(1rem,env(safe-area-inset-bottom,0px))]'

  return (
    <>
      <div
        className={`rounded-2xl border border-slate-200 bg-white shadow-lg ring-1 ring-slate-100 ${
          compact ? 'border-0 p-0 shadow-none ring-0' : 'p-6'
        }`}
      >
        {!compact ? <div className="h-1 w-full rounded-full bg-[#18a87c]" aria-hidden /> : null}

        {compact ?
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-3">
              <p className="min-w-0 text-left text-base font-bold leading-tight text-slate-900">
                CHF {rentPerMonth.toLocaleString('de-CH')}.—
                <span className="block text-xs font-semibold text-slate-600">/ Monat</span>
              </p>
              <button type="button" onClick={onPrimaryClick} disabled={disabled} className={`${primaryBtnClass} max-w-[58%]`}>
                {qualifying ? 'Prüfe…' : label}
              </button>
            </div>
            {compactHint ?
              <p className="mt-1.5 line-clamp-2 text-left text-[11px] font-medium leading-snug text-orange-800">
                {compactHint}
              </p>
            : null}
          </div>
        : (
          <>
            <p className="mt-4 text-center text-2xl font-bold text-slate-900">
              CHF {rentPerMonth.toLocaleString('de-CH')}.—{' '}
              <span className="text-base font-semibold text-slate-600">/ Monat</span>
            </p>

            {userId && !alreadyApplied && notQualified ?
              <div className="mt-4 flex gap-2 rounded-xl bg-teal-50 px-3 py-3 text-xs leading-relaxed text-teal-900">
                <FileText className="mt-0.5 h-3.5 w-3.5 shrink-0 text-teal-800" aria-hidden />
                <span>
                  {issues.find(i => i.code === 'QUALIFY_UNAVAILABLE') ?
                    (issues.find(i => i.code === 'QUALIFY_UNAVAILABLE')?.message ??
                    'Die Prüfung der Bewerbungsvoraussetzungen ist momentan nicht erreichbar.')
                  : issues.find(i => i.code === 'NO_LANDLORD_NOTIFY_EMAIL') ?
                    'Dieses Inserat hat momentan keine gültige Vermieter-E-Mail für Bewerbungen — eine Bewerbung ist deshalb nicht möglich. Bitte später erneut prüfen oder den Support informieren.'
                  : issues.find(i => i.code.startsWith('CREDIT')) || (!creditCheckOk && requiresCreditCheck) ?
                    'Betreibungsregister: Bitte im Profil hochladen lassen — einmal gültig für alle Bewerbungen auf Helvenda.'
                  : issues.find(i => i.code === 'INCOME_TOO_LOW') ?
                    'Einkommen: Für diese Miete braucht es eine höhere Einkommenskategorie oder eine günstigere Wohnung (3×-Regel).'
                  : issues.find(i => i.code === 'CONTACT_PHONE_MISSING') ?
                    'Bitte Telefonnummer im Mieterprofil hinterlegen — Vermieter erreichen dich so zuverlässig.'
                  : (issues[0]?.message ??
                    'Profil oder Unterlagen vervollständigen — dann kannst du dich mit einem Klick bewerben.')}
                </span>
              </div>
            : null}

            <button type="button" onClick={onPrimaryClick} disabled={disabled} className={`${primaryBtnClass} mt-5 w-full`}>
              {qualifying ? 'Prüfe Anforderungen…' : label}
            </button>
          </>
        )}
        {!compact && userId && !alreadyApplied && notQualified && blockingCount > 0 ?
          <p className="mt-2 text-center text-xs font-medium text-orange-700">
            {blockingCount} {blockingCount === 1 ? 'Punkt ausstehend' : 'Punkte ausstehend'}
          </p>
        : null}
        {!compact && userId && !alreadyApplied && isQualifiedNow ?
          <p className="mt-2 flex items-center justify-center gap-1 text-center text-xs font-medium text-emerald-700">
            <Check className="h-3.5 w-3.5 shrink-0" aria-hidden />
            <span>Du erfüllst alle Anforderungen</span>
          </p>
        : null}

        {!compact ?
          <p className="mt-4 flex items-center justify-center gap-1 text-center text-[11px] text-slate-500">
            <Lock className="h-3 w-3 shrink-0 opacity-70" aria-hidden />
            <span>Deine Daten werden verschlüsselt übertragen</span>
          </p>
        : null}
      </div>

      {loginOpen ?
        <div className={overlayClass} role="dialog" aria-modal="true" aria-labelledby="wohnung-login-title">
          <div className={sheetClass}>
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-[#e0e0e0] sm:hidden" aria-hidden />
            <h2 id="wohnung-login-title" className="text-lg font-bold text-slate-900">
              Melde dich an oder registriere dich um dich zu bewerben
            </h2>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link
                href={`/login?callbackUrl=${encodeURIComponent(loginCallback)}`}
                className="inline-flex min-h-[44px] flex-1 items-center justify-center rounded-xl bg-[#18a87c] px-4 py-3 text-sm font-semibold text-white"
                onClick={() => setLoginOpen(false)}
              >
                Anmelden
              </Link>
              <Link
                href={`/register?callbackUrl=${encodeURIComponent(loginCallback)}`}
                className="inline-flex min-h-[44px] flex-1 items-center justify-center rounded-xl border-2 border-teal-700 px-4 py-3 text-sm font-semibold text-teal-800"
                onClick={() => setLoginOpen(false)}
              >
                Registrieren
              </Link>
            </div>
            <button
              type="button"
              className="mt-4 w-full min-h-[44px] text-sm text-slate-500 hover:text-slate-800"
              onClick={() => setLoginOpen(false)}
            >
              Abbrechen
            </button>
          </div>
        </div>
      : null}

      {applyOpen ?
        <div className={overlayClass} role="dialog" aria-modal="true" aria-labelledby="wohnung-apply-title">
          <div className={sheetClass}>
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-[#e0e0e0] sm:hidden" aria-hidden />
            {applyDone ?
              <>
                <div className="flex flex-col items-center text-center">
                  <CheckCircle2 className="h-14 w-14 text-emerald-600" aria-hidden />
                  <h2 id="wohnung-apply-title" className="mt-4 text-lg font-bold text-slate-900">
                    Bewerbung abgeschickt
                  </h2>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">
                    Der Vermieter wurde mit deinem verifizierten Profil benachrichtigt und kann sich bei dir melden.
                  </p>
                </div>
                <div className="mt-6 flex flex-col gap-2">
                  <Link
                    href="/meine-bewerbungen"
                    className="inline-flex min-h-[48px] items-center justify-center rounded-xl bg-[#18a87c] px-4 py-3 text-sm font-bold text-white"
                    onClick={() => setApplyOpen(false)}
                  >
                    Meine Bewerbungen
                  </Link>
                  <button
                    type="button"
                    className="min-h-[44px] text-sm font-medium text-slate-600 hover:text-slate-900"
                    onClick={() => setApplyOpen(false)}
                  >
                    Schliessen
                  </button>
                </div>
              </>
            : <>
                <h2 id="wohnung-apply-title" className="text-lg font-bold text-slate-900">
                  Bewerbung senden
                </h2>
                <p className="mt-2 text-sm font-semibold text-slate-800">{listingTitle}</p>
                <p className="mt-1 text-sm text-slate-600">
                  CHF {rentPerMonth.toLocaleString('de-CH')}.— / Monat
                </p>
                <p className="mt-4 text-sm leading-relaxed text-slate-600">
                  Dein verifiziertes Mieterprofil wird dem Vermieter übermittelt — inkl. Betreibungsregister und
                  Einkommenskategorie, wo vorgesehen.
                </p>
                <div className="mt-4 flex gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-3 text-sm text-emerald-900">
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" aria-hidden />
                  <span>
                    {requiresCreditCheck ?
                      'Geprüfter Betreibungsregisterauszug aus deinem Profil wird mitgeteilt.'
                    : 'Deine Profilangaben werden dem Vermieter mitgeteilt.'}
                  </span>
                </div>
                <label className="mt-5 flex cursor-pointer items-start gap-2 text-sm text-slate-800">
                  <input
                    type="checkbox"
                    checked={applyConfirm}
                    onChange={e => {
                      setApplyConfirm(e.target.checked)
                      setApplyError(null)
                    }}
                    className="mt-1"
                  />
                  <span>Ich bestätige, dass alle Angaben in meinem Profil korrekt und aktuell sind.</span>
                </label>
                {applyError ?
                  <p className="mt-3 text-sm text-red-600">{applyError}</p>
                : !applyConfirm ?
                  <p className="mt-2 text-xs text-slate-500">Bitte Bestätigung ankreuzen, um zu senden.</p>
                : null}
                <button
                  type="button"
                  disabled={applySubmitting || !applyConfirm}
                  onClick={() => void submitApplication()}
                  className="mt-5 w-full min-h-[48px] rounded-xl bg-[#18a87c] py-3.5 text-sm font-bold text-white shadow-md hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {applySubmitting ? 'Wird gesendet…' : 'Bewerbung absenden'}
                </button>
                <Link
                  href={bewerbenPath}
                  className="mt-4 block text-center text-sm font-semibold text-teal-800 underline-offset-2 hover:underline"
                  onClick={() => setApplyOpen(false)}
                >
                  Vorschau: Was der Vermieter sieht
                </Link>
                <button
                  type="button"
                  className="mt-3 w-full min-h-[44px] text-sm text-slate-500 hover:text-slate-800"
                  onClick={() => setApplyOpen(false)}
                >
                  Abbrechen
                </button>
              </>
            }
          </div>
        </div>
      : null}
    </>
  )
}
