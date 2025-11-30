'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { Mail, Clock, CheckCircle, XCircle, AlertCircle, Search, MessageSquare, FileText } from 'lucide-react'
import { toast } from 'react-hot-toast'

interface ContactRequest {
  id: string
  category: string
  email: string
  subject: string
  message: string
  status: string
  resolvedAt: string | null
  resolvedBy: string | null
  notes: string | null
  createdAt: string
  updatedAt: string
}

const categoryLabels: Record<string, string> = {
  technical: 'Technisches Problem',
  account: 'Account-Frage',
  payment: 'Zahlungsproblem',
  safety: 'Sicherheitsproblem',
  general: 'Allgemeine Frage',
  feedback: 'Feedback & Vorschläge',
  other: 'Sonstiges',
}

const statusLabels: Record<string, string> = {
  pending: 'Ausstehend',
  in_progress: 'In Bearbeitung',
  resolved: 'Gelöst',
  closed: 'Geschlossen',
}

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  in_progress: 'bg-blue-100 text-blue-800',
  resolved: 'bg-green-100 text-green-800',
  closed: 'bg-gray-100 text-gray-800',
}

export default function AdminContactRequestsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [contactRequests, setContactRequests] = useState<ContactRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedRequest, setSelectedRequest] = useState<ContactRequest | null>(null)
  const [notes, setNotes] = useState('')
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    if (status === 'loading') return

    if (!session?.user) {
      router.push('/login')
      return
    }

    const isAdminInSession = session?.user?.isAdmin === true || session?.user?.isAdmin === 1
    if (!isAdminInSession) {
      router.push('/')
      return
    }

    loadContactRequests()
  }, [session, status, router, filterStatus])

  const loadContactRequests = async () => {
    try {
      setLoading(true)
      const url = `/api/admin/contact-requests?status=${filterStatus}`
      console.log('[contact-requests-page] Loading from:', url)
      const res = await fetch(url)
      console.log('[contact-requests-page] Response status:', res.status)
      
      if (res.ok) {
        const data = await res.json()
        console.log('[contact-requests-page] Data received:', data)
        console.log('[contact-requests-page] Contact requests count:', data.contactRequests?.length || 0)
        setContactRequests(data.contactRequests || [])
      } else {
        const errorData = await res.json().catch(() => ({ message: 'Unbekannter Fehler' }))
        console.error('[contact-requests-page] Error response:', errorData)
        toast.error(`Fehler beim Laden: ${errorData.message || 'Unbekannter Fehler'}`)
      }
    } catch (error: any) {
      console.error('[contact-requests-page] Error loading contact requests:', error)
      console.error('[contact-requests-page] Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      })
      toast.error(`Fehler beim Laden der Kontaktanfragen: ${error.message || 'Unbekannter Fehler'}`)
    } finally {
      setLoading(false)
    }
  }

  const updateStatus = async (requestId: string, newStatus: string) => {
    try {
      setUpdating(true)
      const res = await fetch(`/api/admin/contact-requests/${requestId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, notes }),
      })

      if (res.ok) {
        toast.success('Status erfolgreich aktualisiert')
        loadContactRequests()
        setSelectedRequest(null)
        setNotes('')
      } else {
        toast.error('Fehler beim Aktualisieren des Status')
      }
    } catch (error) {
      console.error('Error updating status:', error)
      toast.error('Fehler beim Aktualisieren des Status')
    } finally {
      setUpdating(false)
    }
  }

  const updateNotes = async (requestId: string) => {
    try {
      setUpdating(true)
      const res = await fetch(`/api/admin/contact-requests/${requestId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes }),
      })

      if (res.ok) {
        toast.success('Notizen erfolgreich gespeichert')
        loadContactRequests()
        if (selectedRequest) {
          setSelectedRequest({ ...selectedRequest, notes })
        }
      } else {
        toast.error('Fehler beim Speichern der Notizen')
      }
    } catch (error) {
      console.error('Error updating notes:', error)
      toast.error('Fehler beim Speichern der Notizen')
    } finally {
      setUpdating(false)
    }
  }

  const filteredRequests = contactRequests.filter((req) => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      return (
        req.subject.toLowerCase().includes(query) ||
        req.message.toLowerCase().includes(query) ||
        req.email.toLowerCase().includes(query)
      )
    }
    return true
  })

  const stats = {
    total: contactRequests.length,
    pending: contactRequests.filter((r) => r.status === 'pending').length,
    in_progress: contactRequests.filter((r) => r.status === 'in_progress').length,
    resolved: contactRequests.filter((r) => r.status === 'resolved').length,
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Lädt...</p>
        </div>
      </div>
    )
  }

  const isAdminInSession = session?.user?.isAdmin === true || session?.user?.isAdmin === 1
  if (!isAdminInSession) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Kontaktanfragen</h1>
              <p className="mt-2 text-gray-600">Verwalten Sie alle Support-Anfragen</p>
            </div>
            <Link
              href="/admin/dashboard"
              className="text-primary-600 hover:text-primary-700 font-medium"
            >
              ← Zurück zum Dashboard
            </Link>
          </div>
        </div>

        {/* Statistiken */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Gesamt</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <Mail className="h-8 w-8 text-gray-400" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Ausstehend</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-400" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">In Bearbeitung</p>
                <p className="text-2xl font-bold text-blue-600">{stats.in_progress}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-blue-400" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Gelöst</p>
                <p className="text-2xl font-bold text-green-600">{stats.resolved}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-400" />
            </div>
          </div>
        </div>

        {/* Filter und Suche */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Suchen nach Betreff, Nachricht oder E-Mail..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>
            <div className="flex gap-2">
              {['all', 'pending', 'in_progress', 'resolved', 'closed'].map((statusOption) => (
                <button
                  key={statusOption}
                  onClick={() => setFilterStatus(statusOption)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filterStatus === statusOption
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {statusOption === 'all' ? 'Alle' : statusLabels[statusOption]}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Liste der Kontaktanfragen */}
        <div className="bg-white rounded-lg shadow">
          {filteredRequests.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              {searchQuery ? 'Keine Ergebnisse gefunden' : 'Keine Kontaktanfragen vorhanden'}
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredRequests.map((request) => (
                <div
                  key={request.id}
                  className="p-6 hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => {
                    setSelectedRequest(request)
                    setNotes(request.notes || '')
                  }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${statusColors[request.status]}`}>
                          {statusLabels[request.status]}
                        </span>
                        <span className="text-sm text-gray-500">
                          {categoryLabels[request.category] || request.category}
                        </span>
                        <span className="text-sm text-gray-400">
                          {new Date(request.createdAt).toLocaleDateString('de-CH', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">{request.subject}</h3>
                      <p className="text-sm text-gray-600 mb-2">{request.email}</p>
                      <p className="text-gray-700 line-clamp-2">{request.message}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Detail-Modal */}
        {selectedRequest && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Kontaktanfrage Details</h2>
                <button
                  onClick={() => {
                    setSelectedRequest(null)
                    setNotes('')
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="h-6 w-6" />
                </button>
              </div>
              <div className="p-6 space-y-6">
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <span className={`px-3 py-1 rounded text-sm font-medium ${statusColors[selectedRequest.status]}`}>
                      {statusLabels[selectedRequest.status]}
                    </span>
                    <span className="text-sm text-gray-500">
                      {categoryLabels[selectedRequest.category] || selectedRequest.category}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-gray-500">E-Mail</p>
                      <p className="font-medium">{selectedRequest.email}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Erstellt am</p>
                      <p className="font-medium">
                        {new Date(selectedRequest.createdAt).toLocaleString('de-CH')}
                      </p>
                    </div>
                  </div>
                  <div className="mb-4">
                    <p className="text-sm text-gray-500 mb-1">Betreff</p>
                    <p className="font-medium">{selectedRequest.subject}</p>
                  </div>
                  <div className="mb-4">
                    <p className="text-sm text-gray-500 mb-1">Nachricht</p>
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <p className="whitespace-pre-wrap">{selectedRequest.message}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notizen
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Interne Notizen zu dieser Anfrage..."
                  />
                  <button
                    onClick={() => updateNotes(selectedRequest.id)}
                    disabled={updating}
                    className="mt-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
                  >
                    Notizen speichern
                  </button>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status ändern
                  </label>
                  <div className="flex gap-2">
                    {['pending', 'in_progress', 'resolved', 'closed'].map((statusOption) => (
                      <button
                        key={statusOption}
                        onClick={() => updateStatus(selectedRequest.id, statusOption)}
                        disabled={updating || selectedRequest.status === statusOption}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${
                          selectedRequest.status === statusOption
                            ? 'bg-primary-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {statusLabels[statusOption]}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      <Footer />
    </div>
  )
}

