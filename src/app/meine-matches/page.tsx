import { MatchPreferencesInlineEditor } from '@/components/rental/MatchPreferencesInlineEditor'
import {
  MeineMatchesProgressDashboard,
  type ProgressStep,
  type UserCompletionState,
} from '@/components/rental/MeineMatchesProgressDashboard'
import { RentalListingCard } from '@/components/rental/RentalListingCard'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { matchListings, type MatchEmptyReason } from '@/lib/rental/matchListings'
import { rentalListingRowToCardData } from '@/lib/rental/rental-listings-public'
import { formatCHF } from '@/lib/utils/formatCurrency'
import { creditApprovedValid } from '@/lib/wohnenTenantJourney'
import type { TenantProfile } from '@prisma/client'
import type { Metadata } from 'next'
import { getServerSession } from 'next-auth/next'
import Link from 'next/link'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Meine Matches | Helvenda Wohnungen',
  description: 'Deine persönlich passenden Mietwohnungen.',
}

function dayGreeting(now: Date): string {
  const h = now.getHours()
  if (h >= 5 && h < 11) return 'Morgen'
  if (h >= 11 && h < 18) return 'Tag'
  return 'Abend'
}

function IconPin() {
  return (
    <svg aria-hidden viewBox="0 0 20 20" className="h-3.5 w-3.5">
      <path fill="currentColor" d="M10 1.7a5.3 5.3 0 0 0-5.3 5.3c0 3.8 4.1 8.9 5 10a.4.4 0 0 0 .6 0c.9-1.1 5-6.2 5-10A5.3 5.3 0 0 0 10 1.7Zm0 7.5A2.2 2.2 0 1 1 10 4.8a2.2 2.2 0 0 1 0 4.4Z" />
    </svg>
  )
}

function IconBed() {
  return (
    <svg aria-hidden viewBox="0 0 20 20" className="h-3.5 w-3.5">
      <path fill="currentColor" d="M3 5.5a1 1 0 0 1 2 0v2h10V6a1.5 1.5 0 1 1 3 0v6.5a1 1 0 1 1-2 0V11H4v1.5a1 1 0 1 1-2 0v-7Z" />
    </svg>
  )
}

function IconChf() {
  return (
    <svg aria-hidden viewBox="0 0 20 20" className="h-3.5 w-3.5">
      <path fill="currentColor" d="M13.9 3.3a6.4 6.4 0 1 0 0 13.4 6.2 6.2 0 0 0 3.8-1.2l-1-1.5a4.3 4.3 0 0 1-2.7.9A4.5 4.5 0 0 1 9.5 10a4.5 4.5 0 0 1 4.4-4.9c1 0 2 .3 2.7.9l1-1.5a6.2 6.2 0 0 0-3.7-1.2ZM2 8.8h6.5v1.8H2V8.8Z" />
    </svg>
  )
}

function IconShieldCheck({ colorClass }: { colorClass: string }) {
  return (
    <svg aria-hidden viewBox="0 0 20 20" className={`h-3.5 w-3.5 ${colorClass}`}>
      <path fill="currentColor" d="M10 1.8 3.4 4.2v5.3c0 4 2.6 7 6.3 8.8a.8.8 0 0 0 .6 0c3.7-1.8 6.3-4.8 6.3-8.8V4.2L10 1.8Zm3 6.3-3.4 3.4a.8.8 0 0 1-1.1 0L7 10.1l1.1-1.1 1 1 2.8-2.8L13 8.1Z" />
    </svg>
  )
}

function deriveCompletionState(profile: TenantProfile | null): UserCompletionState {
  if (!profile) return 'NO_PROFILE'
  if (!profile.isComplete) return 'INCOMPLETE_PROFILE'
  if (profile.creditCheckStatus === 'PENDING' || profile.creditCheckStatus === 'PENDING_MANUAL_REVIEW') {
    return 'PENDING_CREDIT_CHECK'
  }
  if (!creditApprovedValid(profile)) return 'NO_CREDIT_CHECK'
  return 'READY'
}

function buildProgressSteps(
  profile: TenantProfile | null,
  firstApplication: boolean,
  hasActiveCertificate: boolean
): ProgressStep[] {
  const profileHref = !profile ? '/profil/erstellen' : '/profil/bearbeiten'
  const profileCta = !profile ? 'Profil jetzt erstellen' : 'Profil vervollständigen'
  const creditDone = creditApprovedValid(profile)
  const creditPending = Boolean(
    profile?.creditCheckStatus === 'PENDING' || profile?.creditCheckStatus === 'PENDING_MANUAL_REVIEW'
  )

  const accountStep: ProgressStep = {
    id: 'account',
    label: 'Konto erstellt',
    done: true,
    ctaLabel: '',
    ctaHref: '/',
  }
  const profileStep: ProgressStep = {
    id: 'profile',
    label: 'Profil vervollständigen',
    done: profile?.isComplete === true,
    ctaLabel: profileCta,
    ctaHref: profileHref,
  }
  const creditStep: ProgressStep = {
    id: 'credit_check',
    label: 'Betreibungsregister hochladen',
    done: creditDone,
    pending: creditPending,
    pendingLabel: 'Wird geprüft …',
    ctaLabel: creditPending ? 'Zum Betreibungsregister' : 'Jetzt hochladen',
    ctaHref: '/profil/betreibungsregister',
  }
  const applyStep: ProgressStep = {
    id: 'apply',
    label: 'Erste Bewerbung absenden',
    done: firstApplication,
    ctaLabel: 'Wohnungen ansehen',
    ctaHref: '/wohnungen',
  }

  if (!creditDone) {
    return [accountStep, profileStep, creditStep, applyStep]
  }

  const certificateStep: ProgressStep = {
    id: 'certificate',
    label: 'Helvenda-Qualitätsnachweis',
    done: hasActiveCertificate,
    ctaLabel: hasActiveCertificate ? 'Zertifikat ansehen' : 'Jetzt ausstellen',
    ctaHref: '/zertifikat',
  }

  return [accountStep, profileStep, creditStep, certificateStep, applyStep]
}

function emptyStateCopy(reason: MatchEmptyReason | null): { title: string; body: string } {
  switch (reason) {
    case 'INCOME_BLOCKED':
      return {
        title: 'Einkommensregel',
        body: 'Für die aktuell sichtbaren Inserate reicht dein angegebenes Einkommen vermutlich nicht (3-fach-Regel). Passe Budget oder Einkommenskategorie im Profil an — oder sieh dir alle Wohnungen ohne Match-Filter an.',
      }
    case 'CREDIT_CHECK_REQUIRED':
      return {
        title: 'Betreibungsregister nötig',
        body: 'Viele Inserate verlangen einen nachgewiesenen Betreibungsregisterauszug. Sobald deiner freigegeben ist, erscheinen hier mehr Treffer.',
      }
    case 'CANTON_RESTRICTED':
      return {
        title: 'Kanton-Filter',
        body: 'Im Moment gibt es in deinem gewählten Kanton keine passenden Inserate. Erweitere die Suche oder passe den Kanton in den Präferenzen an.',
      }
    default:
      return {
        title: 'Noch keine Matches',
        body: 'Wir haben noch keine Wohnungen, die genau zu deinen Präferenzen passen. Sobald etwas Passendes inseriert wird, erscheint es hier.',
      }
  }
}

function EmptyStateCard({ reason }: { reason: MatchEmptyReason }) {
  const { title, body } = emptyStateCopy(reason)
  return (
    <div className="mx-auto mt-8 max-w-[500px] rounded-2xl border border-slate-200 bg-white px-5 py-8 text-center shadow-sm sm:p-8">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-teal-50 text-teal-700">
        <svg aria-hidden viewBox="0 0 24 24" className="h-7 w-7">
          <path fill="currentColor" d="m21.7 20.3-5-5a7 7 0 1 0-1.4 1.4l5 5a1 1 0 0 0 1.4-1.4ZM5 10a5 5 0 1 1 10 0A5 5 0 0 1 5 10Z" />
        </svg>
      </div>
      <h2 className="mt-4 text-xl font-bold text-slate-900">{title}</h2>
      <p className="mt-3 text-sm leading-relaxed text-slate-600">{body}</p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        {reason === 'CREDIT_CHECK_REQUIRED' ?
          <Link
            href="/profil/betreibungsregister"
            className="rounded-lg border border-orange-300 bg-orange-50 px-4 py-2 text-sm font-semibold text-orange-900 hover:bg-orange-100"
          >
            Auszug hochladen
          </Link>
        : (
          <Link href="/profil/bearbeiten" className="rounded-lg border border-teal-300 px-4 py-2 text-sm font-semibold text-teal-700 hover:bg-teal-50">
            Präferenzen anpassen
          </Link>
        )}
        <Link href="/wohnungen" className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
          Alle Wohnungen ansehen
        </Link>
      </div>
      <p className="mt-5 text-center text-xs text-slate-500">
        <Link href="/help" className="font-medium text-teal-700 underline-offset-2 hover:underline">
          Hilfe-Center
        </Link>
        {' · '}
        <Link href="/contact" className="font-medium text-teal-700 underline-offset-2 hover:underline">
          Kontakt
        </Link>
      </p>
    </div>
  )
}

function ProfileIncompleteHint() {
  return (
    <div className="mx-auto mt-6 max-w-xl rounded-xl border border-slate-200 bg-white px-5 py-6 text-center text-sm leading-relaxed text-slate-600 shadow-sm">
      Vervollständige dein Profil, damit wir dir Wohnungen zeigen können, die zu deinen Angaben passen.
    </div>
  )
}

function ZertifikatTeaserBanner() {
  return (
    <div className="mx-auto mb-6 flex max-w-4xl flex-col gap-3 rounded-xl border border-[#18a87c]/40 bg-[#e8f7f2] px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
      <p className="text-sm font-semibold text-[#0d2b1f]">
        Du kannst jetzt dein Helvenda-Zertifikat ausstellen — hebe dich von anderen Bewerbern ab.
      </p>
      <Link
        href="/zertifikat"
        className="shrink-0 rounded-lg bg-[#18a87c] px-4 py-2 text-center text-sm font-bold text-white hover:opacity-95"
      >
        Jetzt ausstellen
      </Link>
    </div>
  )
}

export default async function MeineMatchesPage() {
  const session = await getServerSession(authOptions)
  const userId = session?.user?.id
  if (!userId) redirect('/login?callbackUrl=/meine-matches')

  const sessionEmail = (session?.user as { email?: string | null } | undefined)?.email?.trim() || null

  const now = new Date()

  const [profile, account, listings, activeCert, applicationCount] = await Promise.all([
    prisma.tenantProfile.findUnique({ where: { userId } }),
    prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, firstName: true, lastName: true },
    }),
    prisma.rentalListing.findMany({
      where: { status: 'active' },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.helvendaCertificate.findFirst({
      where: { userId, status: 'ACTIVE', expiresAt: { gt: now } },
      select: { id: true },
    }),
    prisma.rentalApplication.count({ where: { applicantUserId: userId } }),
  ])

  const accountEmail = account?.email?.trim() || sessionEmail
  const firstName =
    profile?.firstName?.trim() || account?.firstName?.trim() || account?.lastName?.trim() || 'dich'

  const completionState = deriveCompletionState(profile)
  const firstApplication = applicationCount > 0
  const steps = buildProgressSteps(profile, firstApplication, Boolean(activeCert))
  /** Bis zur ersten Bewerbung: Fortschritt inkl. Qualitätsnachweis anzeigen, auch wenn Betreibungsregister schon frei ist. */
  const showDashboard = completionState !== 'READY' || (completionState === 'READY' && !firstApplication)

  const relaxCredit =
    completionState === 'NO_CREDIT_CHECK' || completionState === 'PENDING_CREDIT_CHECK'

  let matches: ReturnType<typeof matchListings>['matches'] = []
  let emptyReason: ReturnType<typeof matchListings>['emptyReason'] = null
  if (profile?.isComplete) {
    const r = matchListings(profile, listings, { displayDespiteMissingCredit: relaxCredit })
    matches = r.matches
    emptyReason = r.emptyReason
  }

  const showPreferencesBlock = Boolean(profile?.isComplete)
  const showCreditOverlay =
    completionState === 'NO_CREDIT_CHECK' || completionState === 'PENDING_CREDIT_CHECK'
  const showProfileHint =
    completionState === 'NO_PROFILE' || completionState === 'INCOMPLETE_PROFILE'
  const showCertBanner = Boolean(creditApprovedValid(profile) && !activeCert && !showDashboard)

  const greeting = dayGreeting(now)

  return (
    <main className="min-h-screen bg-[#f8fdfb]">
      <div className="mx-auto max-w-6xl pb-10 pl-[max(1rem,env(safe-area-inset-left,0px))] pr-[max(1rem,env(safe-area-inset-right,0px))] pt-[max(3.25rem,calc(2rem+env(safe-area-inset-top,0px)))] sm:pl-[max(1.5rem,env(safe-area-inset-left,0px))] sm:pr-[max(1.5rem,env(safe-area-inset-right,0px))] sm:pt-14">
        {showDashboard ?
          <MeineMatchesProgressDashboard firstName={firstName} steps={steps} accountEmail={accountEmail} />
        : null}

        {showCertBanner ? <ZertifikatTeaserBanner /> : null}

        {!showDashboard ?
          <section className="pb-8">
            <h1 className="text-[1.5rem] font-extrabold leading-tight text-[#0d2b1f] sm:text-[1.875rem] md:text-[2rem]">
              Guten {greeting}, {firstName}.
            </h1>
            {accountEmail ?
              <p className="mt-1.5 text-sm text-slate-500">
                <span className="font-medium text-slate-600">{accountEmail}</span>
              </p>
            : null}
            {!showProfileHint && matches.length > 0 ?
              <p className="mt-3 text-base leading-relaxed text-slate-700 sm:text-[17px]">
                Wir haben <span className="font-extrabold text-teal-700">{matches.length}</span> Wohnungen gefunden, die
                zu dir passen.
              </p>
            : null}
            {!showProfileHint && matches.length === 0 && profile?.isComplete ?
              <p className="mt-3 text-base leading-relaxed text-slate-500 sm:text-[17px]">
                Noch keine Wohnungen, die genau zu dir passen — wir suchen täglich weiter.
              </p>
            : null}
          </section>
        : showDashboard && !showProfileHint ?
          <section className="pb-6">
            {!showProfileHint && matches.length > 0 ?
              <p className="mt-2 text-base leading-relaxed text-slate-700 sm:text-[17px]">
                Wir haben <span className="font-extrabold text-teal-700">{matches.length}</span> Wohnungen gefunden, die
                zu dir passen.
              </p>
            : null}
            {!showProfileHint && matches.length === 0 && profile?.isComplete ?
              <p className="mt-2 text-base leading-relaxed text-slate-500 sm:text-[17px]">
                Noch keine Wohnungen, die genau zu dir passen — wir suchen täglich weiter.
              </p>
            : null}
          </section>
        : null}

        {showProfileHint ?
          <ProfileIncompleteHint />
        : showPreferencesBlock ?
          <section className="mb-8 rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm sm:px-5 sm:py-5">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-slate-500">Deine Suche</p>
            <div className="flex flex-nowrap gap-2 overflow-x-auto pb-1 pl-0.5 pr-0.5 [-webkit-overflow-scrolling:touch] [scrollbar-width:none] scroll-pl-1 scroll-pr-1 sm:scroll-pl-0 [&::-webkit-scrollbar]:hidden">
              {profile!.preferredCanton ?
                <span className="inline-flex shrink-0 items-center gap-1.5 rounded-[20px] bg-[#e8f7f2] px-3 py-[5px] text-xs font-semibold text-[#107a5a]">
                  <IconPin /> Kanton {profile!.preferredCanton}
                </span>
              : null}
              {profile!.preferredMinRooms != null ?
                <span className="inline-flex shrink-0 items-center gap-1.5 rounded-[20px] bg-[#e8f7f2] px-3 py-[5px] text-xs font-semibold text-[#107a5a]">
                  <IconBed /> ab {profile!.preferredMinRooms} Zi.
                </span>
              : null}
              {profile!.preferredBudgetMax != null ?
                <span className="inline-flex shrink-0 items-center gap-1.5 rounded-[20px] bg-[#e8f7f2] px-3 py-[5px] text-xs font-semibold text-[#107a5a]">
                  <IconChf /> bis {formatCHF(profile!.preferredBudgetMax)}/Mo
                </span>
              : null}
              {creditApprovedValid(profile) ?
                <span className="inline-flex shrink-0 items-center gap-1.5 rounded-[20px] bg-[#e8f7f2] px-3 py-[5px] text-xs font-semibold text-[#107a5a]">
                  <IconShieldCheck colorClass="text-emerald-600" /> Verifiziert
                </span>
              : (
                <Link
                  href="/profil/betreibungsregister"
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-[20px] bg-orange-100 px-3 py-[5px] text-xs font-semibold text-orange-800 ring-1 ring-orange-200 hover:bg-orange-200"
                >
                  <IconShieldCheck colorClass="text-orange-600" /> Betreibungsregisterauszug hochladen
                </Link>
              )}
            </div>

            <MatchPreferencesInlineEditor
              className="mt-3 sm:mt-4"
              initial={{
                preferredCanton: profile!.preferredCanton,
                preferredMinRooms: profile!.preferredMinRooms,
                preferredBudgetMax: profile!.preferredBudgetMax,
                preferredMoveInEarliest: profile!.preferredMoveInEarliest?.toISOString() ?? null,
              }}
            />
          </section>
        : null}

        {!showProfileHint ?
          <section className="mt-6">
            {emptyReason || matches.length === 0 ?
              <EmptyStateCard reason={emptyReason ?? 'NO_MATCHES'} />
            : (
              <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {matches.map(m => {
                  const card = rentalListingRowToCardData({
                    ...m.listing,
                    __matchScore: m.score,
                    __matchHighlights: m.highlights,
                  })
                  return (
                    <RentalListingCard
                      key={m.listing.id}
                      listing={card}
                      matchScore={m.score}
                      creditCheckOverlay={showCreditOverlay}
                    />
                  )
                })}
              </div>
            )}
          </section>
        : null}
      </div>
    </main>
  )
}
