'use client'

import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import {
  FileCheck,
  CheckCircle,
  XCircle,
  AlertCircle,
  User,
  Calendar,
  MapPin,
  Mail,
  Phone,
  ArrowLeft,
} from 'lucide-react'
import Link from 'next/link'

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

export default function AdminVerificationsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const userIdParam = searchParams.get('userId')
  const [users, setUsers] = useState<VerificationUser[]>([])
  const [selectedUser, setSelectedUser] = useState<VerificationUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [reviewing, setReviewing] = useState(false)

  useEffect(() => {
    if (status === 'loading') return

    if (!session?.user?.isAdmin) {
      router.push('/')
      return
    }

    loadPendingVerifications()

    // Wenn userId-Parameter vorhanden, User direkt laden
    if (userIdParam) {
      loadUserForReview(userIdParam)
    }
  }, [session, status, router, userIdParam])

  const loadPendingVerifications = async () => {
    try {
      const res = await fetch('/api/admin/verifications/pending')
      if (res.ok) {
        const data = await res.json()
        setUsers(data)
      }
    } catch (error) {
      console.error('Error loading verifications:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadUserForReview = async (userId: string) => {
    try {
      const res = await fetch(`/api/admin/verifications/user/${userId}`)
      if (res.ok) {
        const data = await res.json()
        setSelectedUser(data)
      }
    } catch (error) {
      console.error('Error loading user:', error)
    }
  }

  const handleApprove = async (userId: string) => {
    if (!confirm('Möchten Sie diese Verifizierung wirklich genehmigen?')) {
      return
    }

    setReviewing(true)
    try {
      const res = await fetch(`/api/admin/verifications/${userId}/approve`, {
        method: 'POST',
      })
      if (res.ok) {
        loadPendingVerifications()
        setSelectedUser(null)
        alert('Verifizierung wurde genehmigt')
      } else {
        const data = await res.json()
        alert(data.message || 'Fehler beim Genehmigen')
      }
    } catch (error) {
      console.error('Error approving verification:', error)
      alert('Fehler beim Genehmigen')
    } finally {
      setReviewing(false)
    }
  }

  const handleReject = async (userId: string) => {
    const reason = prompt('Grund für die Ablehnung:')
    if (!reason) return

    setReviewing(true)
    try {
      const res = await fetch(`/api/admin/verifications/${userId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      })
      if (res.ok) {
        loadPendingVerifications()
        setSelectedUser(null)
        alert('Verifizierung wurde abgelehnt')
      } else {
        const data = await res.json()
        alert(data.message || 'Fehler beim Ablehnen')
      }
    } catch (error) {
      console.error('Error rejecting verification:', error)
      alert('Fehler beim Ablehnen')
    } finally {
      setReviewing(false)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-primary-600"></div>
          <p className="mt-4 text-gray-600">Lädt...</p>
        </div>
      </div>
    )
  }

  if (!session?.user?.isAdmin) {
    return null
  }

  const pendingUsers = users.filter(u => u.verificationStatus === 'pending')

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
              </div>
              <div className="max-h-[600px] divide-y divide-gray-200 overflow-y-auto">
                {pendingUsers.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">
                    <FileCheck className="mx-auto mb-2 h-8 w-8 text-gray-400" />
                    <p>Keine ausstehenden Verifizierungen</p>
                  </div>
                ) : (
                  pendingUsers.map(user => (
                    <button
                      key={user.id}
                      onClick={() => {
                        setSelectedUser(user)
                        router.push(`/admin/verifications?userId=${user.id}`, { scroll: false })
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
                        {selectedUser.idDocumentType === 'ID' ? 'Identitätskarte' : 'Reisepass'}
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
                    <button
                      onClick={() => handleApprove(selectedUser.id)}
                      disabled={reviewing}
                      className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-2 font-medium text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <CheckCircle className="h-5 w-5" />
                      Genehmigen
                    </button>
                    <button
                      onClick={() => handleReject(selectedUser.id)}
                      disabled={reviewing}
                      className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2 font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <XCircle className="h-5 w-5" />
                      Ablehnen
                    </button>
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
