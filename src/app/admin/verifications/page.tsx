'use client'

import {
  AlertCircle,
  ArrowLeft,
  CheckCircle,
  FileCheck,
  XCircle,
} from 'lucide-react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useCallback, useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'

interface VerificationUser {
  id: string
  email: string
  name: string | null
  firstName: string | null
  lastName: string | null
  nickname: string | null
  title: string | null
  street: string | null
  streetNumber: string | null
  postalCode: string | null
  city: string | null
  country: string | null
  dateOfBirth: string | null
  phone: string | null
  verified: boolean
  verificationStatus: string | null
  verifiedAt: string | null
  verificationReviewedAt: string | null
  idDocument: string | null
  idDocumentPage1: string | null
  idDocumentPage2: string | null
  idDocumentType: string | null
  createdAt: string
}

function AdminVerificationsPageContent() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const userIdParam = searchParams.get('userId')
  const [users, setUsers] = useState<VerificationUser[]>([])
  const [selectedUser, setSelectedUser] = useState<VerificationUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [reviewing, setReviewing] = useState(false)
  const [hasAdminAccess, setHasAdminAccess] = useState<boolean | null>(null)
  const [search, setSearch] = useState('')
  const [rejectReason, setRejectReason] = useState('')

  const fetchPendingVerifications = useCallback(async (): Promise<VerificationUser[]> => {
    const res = await fetch('/api/admin/verifications/pending')
    const data = await res.json().catch(() => null)
    if (!res.ok || !Array.isArray(data)) {
      throw new Error((data as { message?: string } | null)?.message || 'Verifizierungen konnten nicht geladen werden')
    }
    return data as VerificationUser[]
  }, [])

  const fetchUserForReview = useCallback(async (userId: string): Promise<VerificationUser | null> => {
    const res = await fetch(`/api/admin/verifications/user/${userId}`)
    const data = await res.json().catch(() => null)
    if (!res.ok) {
      throw new Error((data as { message?: string } | null)?.message || 'Benutzer konnte nicht geladen werden')
    }
    return (data as VerificationUser | null) ?? null
  }, [])

  useEffect(() => {
    if (status === 'loading') return
    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=' + encodeURIComponent('/admin/verifications'))
      return
    }

    let cancelled = false

    const run = async () => {
      setLoading(true)
      try {
        let allowed = (session?.user as { isAdmin?: boolean } | undefined)?.isAdmin === true
        if (!allowed) {
          const res = await fetch('/api/user/admin-status')
          const data = await res.json().catch(() => null)
          allowed = res.ok && (data as { isAdmin?: boolean } | null)?.isAdmin === true
        }

        if (cancelled) return
        setHasAdminAccess(allowed)
        if (!allowed) {
          router.push('/')
          return
        }

        const [pendingUsers, selected] = await Promise.all([
          fetchPendingVerifications(),
          userIdParam ? fetchUserForReview(userIdParam) : Promise.resolve(null),
        ])

        if (cancelled) return
        setUsers(pendingUsers)
        setSelectedUser(selected)
      } catch (error) {
        console.error('Error loading verifications:', error)
        if (!cancelled) {
          toast.error(error instanceof Error ? error.message : 'Verifizierungen konnten nicht geladen werden')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void run()
    return () => {
      cancelled = true
    }
  }, [fetchPendingVerifications, fetchUserForReview, router, session, status, userIdParam])

  const handleApprove = async (userId: string) => {
    setReviewing(true)
    try {
      const res = await fetch(`/api/admin/verifications/${userId}/approve`, {
        method: 'POST',
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok) {
        const pendingUsers = await fetchPendingVerifications()
        setUsers(pendingUsers)
        setSelectedUser(null)
        setRejectReason('')
        router.push('/admin/verifications', { scroll: false })
        toast.success((data as { message?: string }).message || 'Verifizierung wurde genehmigt')
      } else {
        toast.error((data as { message?: string }).message || 'Fehler beim Genehmigen')
      }
    } catch (error) {
      console.error('Error approving verification:', error)
      toast.error('Fehler beim Genehmigen')
    } finally {
      setReviewing(false)
    }
  }

  const handleReject = async (userId: string) => {
    const reason = rejectReason.trim()
    if (reason.length < 6) {
      toast.error('Bitte einen kurzen Ablehnungsgrund angeben.')
      return
    }

    setReviewing(true)
    try {
      const res = await fetch(`/api/admin/verifications/${userId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok) {
        const pendingUsers = await fetchPendingVerifications()
        setUsers(pendingUsers)
        setSelectedUser(null)
        setRejectReason('')
        router.push('/admin/verifications', { scroll: false })
        toast.success((data as { message?: string }).message || 'Verifizierung wurde abgelehnt')
      } else {
        toast.error((data as { message?: string }).message || 'Fehler beim Ablehnen')
      }
    } catch (error) {
      console.error('Error rejecting verification:', error)
      toast.error('Fehler beim Ablehnen')
    } finally {
      setReviewing(false)
    }
  }

  const pendingUsers = users.filter(u => u.verificationStatus === 'pending')
  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return pendingUsers
    return pendingUsers.filter(user => {
      const haystack = [
        user.email,
        user.name,
        user.firstName,
        user.lastName,
        user.nickname,
        user.postalCode,
        user.city,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      return haystack.includes(q)
    })
  }, [pendingUsers, search])

  if (status === 'loading' || loading || hasAdminAccess === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-primary-600"></div>
          <p className="mt-4 text-gray-600">Lädt...</p>
        </div>
      </div>
    )
  }

  if (hasAdminAccess === false) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Verifizierungen prüfen</h1>
              <p className="mt-2 text-gray-600">
                {pendingUsers.length} ausstehende Verifizierung
                {pendingUsers.length !== 1 ? 'en' : ''}
              </p>
            </div>
            <Link
              href="/admin/dashboard"
              className="font-medium text-primary-600 hover:text-primary-700"
            >
              ← Zurück zum Dashboard
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Liste der ausstehenden Verifizierungen */}
          <div className="lg:col-span-1">
            <div className="rounded-lg bg-white shadow">
              <div className="border-b border-gray-200 p-4">
                <h2 className="text-lg font-semibold text-gray-900">Ausstehend</h2>
                <input
                  aria-label="Verifizierungen durchsuchen"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Suche nach Name, E-Mail, Ort…"
                  className="mt-3 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                />
              </div>
              <div className="max-h-[600px] divide-y divide-gray-200 overflow-y-auto">
                {filteredUsers.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">
                    <FileCheck className="mx-auto mb-2 h-8 w-8 text-gray-400" />
                    <p>{search.trim() ? 'Keine Treffer für diese Suche' : 'Keine ausstehenden Verifizierungen'}</p>
                  </div>
                ) : (
                  filteredUsers.map(user => (
                    <button
                      key={user.id}
                      onClick={async () => {
                        setSelectedUser(user)
                        router.push(`/admin/verifications?userId=${user.id}`, { scroll: false })
                        try {
                          const fullUser = await fetchUserForReview(user.id)
                          if (fullUser) setSelectedUser(fullUser)
                        } catch (error) {
                          console.error('Error loading user:', error)
                          toast.error(error instanceof Error ? error.message : 'Benutzer konnte nicht geladen werden')
                        }
                      }}
                      className={`w-full p-4 text-left transition-colors hover:bg-gray-50 ${
                        selectedUser?.id === user.id
                          ? 'border-l-4 border-primary-600 bg-primary-50'
                          : ''
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium text-gray-900">
                            {user.name ||
                              `${user.firstName} ${user.lastName}` ||
                              user.nickname ||
                              'Unbekannt'}
                          </p>
                          <p className="text-sm text-gray-500">{user.email}</p>
                          <p className="mt-1 text-xs text-gray-400">
                            {new Date(user.createdAt).toLocaleDateString('de-CH')}
                          </p>
                        </div>
                        <AlertCircle className="h-5 w-5 flex-shrink-0 text-orange-500" />
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Detail-Ansicht */}
          <div className="lg:col-span-2">
            {selectedUser ? (
              <div className="rounded-lg bg-white shadow">
                <div className="border-b border-gray-200 p-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-gray-900">Verifizierung prüfen</h2>
                    <button
                      onClick={() => {
                        setSelectedUser(null)
                        router.push('/admin/verifications', { scroll: false })
                      }}
                      aria-label="Zurück zur Verifizierungsliste"
                      title="Zurück"
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <ArrowLeft className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                <div className="space-y-6 p-6">
                  {/* Persönliche Daten */}
                  <div>
                    <h3 className="mb-4 text-lg font-medium text-gray-900">Persönliche Daten</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Name</label>
                        <p className="mt-1 text-sm text-gray-900">
                          {selectedUser.title} {selectedUser.firstName} {selectedUser.lastName}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">E-Mail</label>
                        <p className="mt-1 text-sm text-gray-900">{selectedUser.email}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Nickname</label>
                        <p className="mt-1 text-sm text-gray-900">{selectedUser.nickname || '-'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Geburtsdatum
                        </label>
                        <p className="mt-1 text-sm text-gray-900">
                          {selectedUser.dateOfBirth
                            ? new Date(selectedUser.dateOfBirth).toLocaleDateString('de-CH')
                            : '-'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Adresse */}
                  <div>
                    <h3 className="mb-4 text-lg font-medium text-gray-900">Adresse</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Strasse</label>
                        <p className="mt-1 text-sm text-gray-900">
                          {selectedUser.street} {selectedUser.streetNumber}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">PLZ / Ort</label>
                        <p className="mt-1 text-sm text-gray-900">
                          {selectedUser.postalCode} {selectedUser.city}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Land</label>
                        <p className="mt-1 text-sm text-gray-900">{selectedUser.country}</p>
                      </div>
                    </div>
                  </div>

                  {/* Ausweiskopie */}
                  <div>
                    <h3 className="mb-4 text-lg font-medium text-gray-900">Ausweiskopie</h3>
                    <div className="mb-4">
                      <label className="mb-2 block text-sm font-medium text-gray-700">
                        Ausweistyp:{' '}
                        {selectedUser.idDocumentType === 'ID'
                          ? 'Identitätskarte'
                          : selectedUser.idDocumentType === 'Passport'
                            ? 'Reisepass'
                            : 'Nicht eingereicht'}
                      </label>

                      {selectedUser.idDocumentType === 'ID' ? (
                        <div className="grid grid-cols-2 gap-4">
                          {selectedUser.idDocumentPage1 && (
                            <div>
                              <label className="mb-2 block text-sm font-medium text-gray-700">
                                Seite 1
                              </label>
                              <img
                                src={selectedUser.idDocumentPage1}
                                alt="ID Seite 1"
                                className="w-full rounded-lg border border-gray-300"
                              />
                            </div>
                          )}
                          {selectedUser.idDocumentPage2 && (
                            <div>
                              <label className="mb-2 block text-sm font-medium text-gray-700">
                                Seite 2
                              </label>
                              <img
                                src={selectedUser.idDocumentPage2}
                                alt="ID Seite 2"
                                className="w-full rounded-lg border border-gray-300"
                              />
                            </div>
                          )}
                        </div>
                      ) : (
                        selectedUser.idDocument && (
                          <div>
                            <img
                              src={selectedUser.idDocument}
                              alt="Reisepass"
                              className="w-full rounded-lg border border-gray-300"
                            />
                          </div>
                        )
                      )}
                    </div>
                  </div>

                  {/* Aktionen */}
                  <div className="flex gap-4 border-t border-gray-200 pt-4">
                    <div className="flex-1 space-y-3">
                      <textarea
                        aria-label="Ablehnungsgrund"
                        value={rejectReason}
                        onChange={e => setRejectReason(e.target.value)}
                        rows={3}
                        placeholder="Ablehnungsgrund für den Benutzer"
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                      />
                      <div className="flex gap-4">
                        <button
                          onClick={() => void handleApprove(selectedUser.id)}
                          disabled={reviewing}
                          className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-2 font-medium text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <CheckCircle className="h-5 w-5" />
                          Genehmigen
                        </button>
                        <button
                          onClick={() => void handleReject(selectedUser.id)}
                          disabled={reviewing}
                          className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2 font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <XCircle className="h-5 w-5" />
                          Ablehnen
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-lg bg-white p-12 text-center shadow">
                <FileCheck className="mx-auto mb-4 h-12 w-12 text-gray-400" />
                <h3 className="mb-2 text-lg font-medium text-gray-900">
                  Wählen Sie eine Verifizierung aus
                </h3>
                <p className="text-gray-500">
                  Klicken Sie auf einen Benutzer in der Liste, um die Verifizierung zu prüfen
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function AdminVerificationsPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-primary-600"></div>
          <p className="text-gray-600">Laden...</p>
        </div>
      </div>
    }>
      <AdminVerificationsPageContent />
    </Suspense>
  )
}
