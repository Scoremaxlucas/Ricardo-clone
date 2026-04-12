'use client'

import { CreditCheckBadge } from '@/components/rental/CreditCheckBadge'
import { Footer } from '@/components/layout/Footer'
import { Header } from '@/components/layout/Header'
import type { CreditCheckResult } from '@/lib/rental/types'
import { isCreditCheckResult } from '@/lib/rental/types'
import { Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'

type ApplicationStatus =
  | 'pending_credit_check'
  | 'pending_manual_review'
  | 'approved'
  | 'rejected'

type ApplicationPayload = {
  id: string
  createdAt: string
  status: ApplicationStatus
  message: string
  creditCheckResult: unknown
  listing: { id: string; title: string }
  applicant: {
    id: string
    name: string | null
    firstName: string | null
    nickname: string | null
    email: string | null
    image: string | null
    verified: boolean
  } | null
}

export function RentalApplicationDetailClient() {
  const params = useParams()
  const id = params?.id as string
  const router = useRouter()
  const { status } = useSession()
  const [loading, setLoading] = useState(true)
  const [app, setApp] = useState<ApplicationPayload | null>(null)

  useEffect(() => {
    if (!id || status === 'loading') return
    if (status === 'unauthenticated') {
      router.replace(`/login?callbackUrl=${encodeURIComponent(`/wohnungen/anfragen/${id}`)}`)
      return
    }
    let cancelled = false
    ;(async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/rental-applications/${id}`)
        const data = await res.json()
        if (!res.ok) {
          if (!cancelled) setApp(null)
          return
        }
        if (!cancelled) setApp(data.application)
      } catch {
        if (!cancelled) setApp(null)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [id, status, router])

  const creditParsed: CreditCheckResult | null =
    app?.creditCheckResult && isCreditCheckResult(app.creditCheckResult) ? app.creditCheckResult : null

  if (loading || status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <Loader2 className="h-10 w-10 animate-spin text-primary-600" />
      </div>
    )
  }

  if (!app) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="mx-auto max-w-lg px-4 py-16 text-center">
          <p className="text-gray-600">Anfrage nicht gefunden oder kein Zugriff.</p>
          <Link href="/wohnungen" className="mt-4 inline-block text-primary-600 hover:underline">
            Zu Mietwohnungen
          </Link>
        </main>
        <Footer />
      </div>
    )
  }

  const applicantName =
    app.applicant?.nickname?.trim() ||
    app.applicant?.name?.trim() ||
    app.applicant?.firstName?.trim() ||
    'Interessent'

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="mx-auto max-w-2xl px-4 py-8">
        <Link
          href={`/wohnungen/${app.listing.id}`}
          className="text-sm text-primary-600 hover:underline"
        >
          ← {app.listing.title}
        </Link>
        <h1 className="mt-4 text-2xl font-bold text-gray-900">Mietanfrage</h1>
        <p className="mt-1 text-sm text-gray-600">
          Eingang: {new Date(app.createdAt).toLocaleString('de-CH')}
        </p>

        <div className="mt-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="font-semibold text-gray-900">Interessent</h2>
          <p className="mt-2 text-sm text-gray-700">{applicantName}</p>
          {app.applicant?.verified ? (
            <p className="text-xs text-teal-700">Verifiziertes Helvenda-Profil</p>
          ) : null}
        </div>

        <div className="mt-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="font-semibold text-gray-900">Betreibungsregister</h2>
          <div className="mt-3">
            <CreditCheckBadge status={app.status} creditCheckResult={creditParsed} />
          </div>
        </div>

        <div className="mt-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="font-semibold text-gray-900">Nachricht</h2>
          <p className="mt-2 whitespace-pre-wrap text-sm text-gray-700">{app.message}</p>
        </div>
      </main>
      <Footer />
    </div>
  )
}
