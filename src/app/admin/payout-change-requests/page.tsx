'use client'

import { Footer } from '@/components/layout/Footer'
import { Header } from '@/components/layout/Header'
import { CheckCircle, Clock, Loader2, XCircle } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'

interface PayoutChangeRequest {
  id: string
  userId: string
  currentAccountHolderName: string
  currentIbanLast4: string
  currentIbanMasked: string
  requestedAccountHolderName: string
  requestedIbanLast4: string
  requestedIbanMasked: string
  reason: string | null
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED'
  createdAt: string
  decidedAt: string | null
  decidedBy: string | null
}

const statusLabels: Record<string, string> = {
  PENDING: 'Ausstehend',
  APPROVED: 'Genehmigt',
  REJECTED: 'Abgelehnt',
  CANCELLED: 'Abgebrochen',
}

const statusColors: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  APPROVED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-800',
  CANCELLED: 'bg-gray-100 text-gray-800',
}

export default function AdminPayoutChangeRequestsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [requests, setRequests] = useState<PayoutChangeRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState<string>('PENDING')
  const [selectedRequest, setSelectedRequest] = useState<PayoutChangeRequest | null>(null)
  const [rejectionReason, setRejectionReason] = useState('')
  const [processing, setProcessing] = useState<string | null>(null)

  useEffect(() => {
    if (status === 'loading') return

    if (!session?.user) {
      router.push('/login')
      return
    }

    const isAdminInSession = (session?.user as { isAdmin?: boolean })?.isAdmin === true
    if (!isAdminInSession) {
      router.push('/')
      return
    }

    loadRequests()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, status, router, filterStatus])

  const loadRequests = async () => {
    try {
      setLoading(true)
      const url = `/api/admin/payout/change-requests?status=${filterStatus}`
      const res = await fetch(url)

      if (res.ok) {
        const data = await res.json()
        setRequests(data.requests || [])
      } else {
        toast.error('Fehler beim Laden der Anfragen')
      }
    } catch (error) {
      console.error('Error loading change requests:', error)
      toast.error('Fehler beim Laden der Anfragen')
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (requestId: string) => {
    if (!confirm('Möchten Sie diese Änderungsanfrage wirklich genehmigen?')) {
      return
    }

    try {
      setProcessing(requestId)
      const res = await fetch(`/api/admin/payout/change-requests/${requestId}/approve`, {
        method: 'POST',
      })

      if (res.ok) {
        toast.success('Anfrage erfolgreich genehmigt')
        setSelectedRequest(null)
        await loadRequests()
      } else {
        const data = await res.json()
        toast.error(data.message || 'Fehler beim Genehmigen')
      }
    } catch (error) {
      console.error('Error approving request:', error)
      toast.error('Fehler beim Genehmigen')
    } finally {
      setProcessing(null)
    }
  }

  const handleReject = async (requestId: string) => {
    if (!rejectionReason.trim()) {
      toast.error('Bitte geben Sie einen Ablehnungsgrund an')
      return
    }

    if (!confirm('Möchten Sie diese Änderungsanfrage wirklich ablehnen?')) {
      return
    }

    try {
      setProcessing(requestId)
      const res = await fetch(`/api/admin/payout/change-requests/${requestId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rejectionReason: rejectionReason.trim() }),
      })

      if (res.ok) {
        toast.success('Anfrage erfolgreich abgelehnt')
        setSelectedRequest(null)
        setRejectionReason('')
        await loadRequests()
      } else {
        const data = await res.json()
        toast.error(data.message || 'Fehler beim Ablehnen')
      }
    } catch (error) {
      console.error('Error rejecting request:', error)
      toast.error('Fehler beim Ablehnen')
    } finally {
      setProcessing(null)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary-600" />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 bg-gray-50 py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Bankverbindungs-Änderungen</h1>
            <p className="mt-1 text-sm text-gray-600">
              Verwalten Sie Anfragen zur Änderung von Bankverbindungen
            </p>
          </div>

          {/* Filter */}
          <div className="mb-6 flex gap-2">
            {(['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'] as const).map(statusOption => (
              <button
                key={statusOption}
                onClick={() => setFilterStatus(statusOption)}
                className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                  filterStatus === statusOption
                    ? 'bg-primary-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                {statusLabels[statusOption]} (
                {requests.filter(r => r.status === statusOption).length})
              </button>
            ))}
          </div>

          {/* Requests List */}
          <div className="space-y-4">
            {requests.length === 0 ? (
              <div className="rounded-lg border border-gray-200 bg-white p-8 text-center">
                <Clock className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-4 text-gray-600">Keine Anfragen gefunden</p>
              </div>
            ) : (
              requests.map(request => (
                <div
                  key={request.id}
                  className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="mb-2 flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900">
                          User ID: {request.userId}
                        </span>
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[request.status]}`}
                        >
                          {statusLabels[request.status]}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div>
                          <p className="text-xs font-medium text-gray-500">Aktuell</p>
                          <p className="mt-1 text-sm text-gray-900">
                            {request.currentAccountHolderName}
                          </p>
                          <p className="text-sm text-gray-600">{request.currentIbanMasked}</p>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-gray-500">Angefragt</p>
                          <p className="mt-1 text-sm text-gray-900">
                            {request.requestedAccountHolderName}
                          </p>
                          <p className="text-sm text-gray-600">{request.requestedIbanMasked}</p>
                        </div>
                      </div>

                      {request.reason && (
                        <div className="mt-4">
                          <p className="text-xs font-medium text-gray-500">Grund</p>
                          <p className="mt-1 text-sm text-gray-700">{request.reason}</p>
                        </div>
                      )}

                      <p className="mt-4 text-xs text-gray-500">
                        Erstellt: {new Date(request.createdAt).toLocaleString('de-CH')}
                      </p>
                    </div>

                    {request.status === 'PENDING' && (
                      <div className="ml-4 flex flex-col gap-2">
                        <button
                          onClick={() => handleApprove(request.id)}
                          disabled={processing === request.id}
                          className="flex items-center gap-2 rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {processing === request.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <CheckCircle className="h-4 w-4" />
                          )}
                          Genehmigen
                        </button>
                        <button
                          onClick={() => setSelectedRequest(request)}
                          disabled={processing === request.id}
                          className="flex items-center gap-2 rounded-md border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-700 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <XCircle className="h-4 w-4" />
                          Ablehnen
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>

      {/* Rejection Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h3 className="mb-4 text-lg font-semibold text-gray-900">Anfrage ablehnen</h3>
            <div className="mb-4">
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Ablehnungsgrund <span className="text-red-500">*</span>
              </label>
              <textarea
                value={rejectionReason}
                onChange={e => setRejectionReason(e.target.value)}
                rows={4}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Bitte geben Sie einen Grund für die Ablehnung an..."
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => handleReject(selectedRequest.id)}
                disabled={!rejectionReason.trim() || processing === selectedRequest.id}
                className="flex-1 rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {processing === selectedRequest.id ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Wird abgelehnt...
                  </span>
                ) : (
                  'Ablehnen'
                )}
              </button>
              <button
                onClick={() => {
                  setSelectedRequest(null)
                  setRejectionReason('')
                }}
                className="flex-1 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
              >
                Abbrechen
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  )
}
