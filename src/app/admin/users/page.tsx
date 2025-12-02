'use client'

import { UserActivityModal } from '@/components/admin/UserActivityModal'
import { UserNotesModal } from '@/components/admin/UserNotesModal'
import { UserReportsModal } from '@/components/admin/UserReportsModal'
import { WarnUserModal } from '@/components/admin/WarnUserModal'
import { Footer } from '@/components/layout/Footer'
import { Header } from '@/components/layout/Header'
import {
  AlertTriangle,
  Ban,
  CheckCircle,
  FileText,
  Flag,
  History,
  Search,
  Shield,
  UserCheck,
  Users,
  XCircle,
} from 'lucide-react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { toast } from 'react-hot-toast'

interface User {
  id: string
  email: string
  name: string | null
  firstName: string | null
  lastName: string | null
  nickname: string | null
  isAdmin: boolean
  isBlocked: boolean
  blockedAt: string | null
  verified: boolean
  verificationStatus: string | null
  warningCount: number
  lastWarnedAt: string | null
  createdAt: string
  pendingReports?: number
}

export default function AdminUsersPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filter, setFilter] = useState<'all' | 'reported' | 'blocked' | 'verified'>('all')
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [selectedUserName, setSelectedUserName] = useState<string | null>(null)
  const [showReportsModal, setShowReportsModal] = useState(false)
  const [showNotesModal, setShowNotesModal] = useState(false)
  const [showActivityModal, setShowActivityModal] = useState(false)
  const [showWarnModal, setShowWarnModal] = useState(false)
  const [warnUserId, setWarnUserId] = useState<string | null>(null)
  const [warnUserName, setWarnUserName] = useState<string | null>(null)

  useEffect(() => {
    if (status === 'loading') return

    if (!session?.user) {
      if (status === 'unauthenticated') {
        setLoading(false)
        router.push('/login')
      }
      return
    }

    // Prüfe Admin-Status nur aus Session
    const isAdminInSession = session?.user?.isAdmin === true || session?.user?.isAdmin === true

    if (isAdminInSession) {
      console.log('Admin confirmed, loading users...')
      loadUsers()
      return
    }

    // Falls nicht in Session, prüfe in DB
    fetch('/api/user/admin-status')
      .then(res => res.json())
      .then(data => {
        if (data.isAdmin) {
          console.log('Admin confirmed via API, loading users...')
          loadUsers()
        } else {
          setLoading(false)
          router.push('/')
        }
      })
      .catch(error => {
        console.error('Error checking admin status:', error)
        setLoading(false)
        router.push('/')
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, status, filter])

  const loadUsers = async () => {
    setLoading(true)
    try {
      const filterParam = filter !== 'all' ? `?filter=${filter}` : ''
      const res = await fetch(`/api/admin/users${filterParam}`)

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: 'Unbekannter Fehler' }))
        console.error('Users API error:', errorData)
        toast.error('Fehler beim Laden der Benutzer')
        setUsers([])
        setLoading(false)
        return
      }

      const data = await res.json()

      if (!Array.isArray(data)) {
        console.error('API returned non-array data:', data)
        setUsers([])
        setLoading(false)
        return
      }

      setUsers(data)
    } catch (error: any) {
      console.error('Error loading users:', error)
      toast.error('Fehler beim Laden der Benutzer')
      setUsers([])
    } finally {
      setLoading(false)
    }
  }

  const handleBlock = async (userId: string, block: boolean) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}/${block ? 'block' : 'unblock'}`, {
        method: 'POST',
      })
      if (res.ok) {
        toast.success(block ? 'Benutzer blockiert' : 'Benutzer entblockt')
        loadUsers()
      } else {
        const data = await res.json()
        toast.error(data.message || 'Fehler beim Blockieren/Entblocken')
      }
    } catch (error) {
      console.error('Error blocking user:', error)
      toast.error('Fehler beim Blockieren/Entblocken')
    }
  }

  const handleWarn = (userId: string) => {
    const user = users.find(u => u.id === userId)
    setWarnUserId(userId)
    setWarnUserName(
      user?.name ||
        `${user?.firstName} ${user?.lastName}` ||
        user?.nickname ||
        user?.email ||
        'Benutzer'
    )
    setShowWarnModal(true)
  }

  const handleWarned = () => {
    loadUsers()
  }

  const handleToggleAdmin = async (userId: string, makeAdmin: boolean) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}/admin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isAdmin: makeAdmin }),
      })
      if (res.ok) {
        toast.success(makeAdmin ? 'Admin-Rechte vergeben' : 'Admin-Rechte entfernt')
        loadUsers()
      } else {
        const data = await res.json()
        toast.error(data.message || 'Fehler beim Ändern der Admin-Rechte')
      }
    } catch (error) {
      console.error('Error toggling admin:', error)
      toast.error('Fehler beim Ändern der Admin-Rechte')
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

  // Prüfe Admin-Status nur aus Session
  const isAdminInSession = session?.user?.isAdmin === true || session?.user?.isAdmin === true

  if (!session || !isAdminInSession) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-600">Sie haben keine Berechtigung für diese Seite.</p>
          <Link href="/" className="mt-4 text-primary-600 hover:text-primary-700">
            Zurück zur Hauptseite
          </Link>
        </div>
      </div>
    )
  }

  // Suche (Filterung erfolgt bereits im Backend)
  const filteredUsers = users.filter(user => {
    const matchesSearch =
      !searchQuery ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.nickname?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.lastName?.toLowerCase().includes(searchQuery.toLowerCase())

    return matchesSearch
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Benutzerverwaltung</h1>
              <p className="mt-2 text-gray-600">Verwalten Sie alle Benutzer der Plattform</p>
            </div>
            <div className="flex gap-4">
              <Link href="/" className="font-medium text-primary-600 hover:text-primary-700">
                ← Zurück zur Hauptseite
              </Link>
              <Link
                href="/admin/dashboard"
                className="font-medium text-gray-600 hover:text-gray-700"
              >
                Dashboard
              </Link>
            </div>
          </div>
        </div>

        {/* Filter und Suche */}
        <div className="mb-6 rounded-lg bg-white p-6 shadow">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 transform text-gray-400" />
              <input
                type="text"
                placeholder="Nach E-Mail, Name oder Nickname suchen..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`rounded-lg px-4 py-2 font-medium transition-colors ${
                  filter === 'all'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Alle
              </button>
              <button
                onClick={() => setFilter('reported')}
                className={`relative rounded-lg px-4 py-2 font-medium transition-colors ${
                  filter === 'reported'
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Gemeldet
                {users.filter(u => (u.pendingReports || 0) > 0).length > 0 && (
                  <span className="ml-2 rounded-full bg-red-500 px-2 py-0.5 text-xs text-white">
                    {users.filter(u => (u.pendingReports || 0) > 0).length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setFilter('blocked')}
                className={`rounded-lg px-4 py-2 font-medium transition-colors ${
                  filter === 'blocked'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Blockiert
              </button>
              <button
                onClick={() => setFilter('verified')}
                className={`rounded-lg px-4 py-2 font-medium transition-colors ${
                  filter === 'verified'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Verifiziert
              </button>
            </div>
          </div>
        </div>

        {/* User Liste */}
        <div className="overflow-hidden rounded-lg bg-white shadow">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Benutzer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Verifizierung
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Warnungen
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Meldungen
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Registriert
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                    Aktionen
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {filteredUsers.map(user => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="whitespace-nowrap px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {user.name ||
                            `${user.firstName} ${user.lastName}` ||
                            user.nickname ||
                            'Unbekannt'}
                          {user.isAdmin && (
                            <span className="ml-2 inline-flex items-center rounded bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-800">
                              Admin
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                        {user.nickname && (
                          <div className="text-sm text-gray-400">@{user.nickname}</div>
                        )}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      {user.isBlocked ? (
                        <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">
                          <Ban className="mr-1 h-3 w-3" />
                          Blockiert
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                          <CheckCircle className="mr-1 h-3 w-3" />
                          Aktiv
                        </span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      {user.verificationStatus === 'pending' && (
                        <Link
                          href={`/admin/verifications?userId=${user.id}`}
                          className="inline-flex items-center rounded-full bg-orange-100 px-2.5 py-0.5 text-xs font-medium text-orange-800 hover:bg-orange-200"
                        >
                          <AlertTriangle className="mr-1 h-3 w-3" />
                          Zu prüfen
                        </Link>
                      )}
                      {user.verificationStatus === 'approved' && user.verified && (
                        <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                          <CheckCircle className="mr-1 h-3 w-3" />
                          Verifiziert
                        </span>
                      )}
                      {user.verificationStatus === 'rejected' && (
                        <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">
                          <XCircle className="mr-1 h-3 w-3" />
                          Abgelehnt
                        </span>
                      )}
                      {!user.verificationStatus && (
                        <span className="text-sm text-gray-500">Nicht gestartet</span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                      {user.warningCount > 0 ? (
                        <span className="inline-flex items-center text-orange-600">
                          <AlertTriangle className="mr-1 h-4 w-4" />
                          {user.warningCount}
                        </span>
                      ) : (
                        <span className="text-gray-400">0</span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                      {(user.pendingReports || 0) > 0 ? (
                        <button
                          onClick={() => {
                            setSelectedUserId(user.id)
                            setSelectedUserName(
                              user.name ||
                                `${user.firstName} ${user.lastName}` ||
                                user.nickname ||
                                user.email
                            )
                            setShowReportsModal(true)
                          }}
                          className="inline-flex cursor-pointer items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800 hover:bg-red-200"
                          title="Meldungen anzeigen"
                        >
                          <Flag className="mr-1 h-3 w-3" />
                          {user.pendingReports}
                        </button>
                      ) : (
                        <span className="text-gray-400">0</span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                      {new Date(user.createdAt).toLocaleDateString('de-CH')}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            setSelectedUserId(user.id)
                            setSelectedUserName(
                              user.name ||
                                `${user.firstName} ${user.lastName}` ||
                                user.nickname ||
                                user.email
                            )
                            setShowReportsModal(true)
                          }}
                          className="text-red-600 hover:text-red-900"
                          title="Meldungen anzeigen"
                        >
                          <Flag className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedUserId(user.id)
                            setSelectedUserName(
                              user.name ||
                                `${user.firstName} ${user.lastName}` ||
                                user.nickname ||
                                user.email
                            )
                            setShowNotesModal(true)
                          }}
                          className="text-blue-600 hover:text-blue-900"
                          title="Notizen"
                        >
                          <FileText className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedUserId(user.id)
                            setSelectedUserName(
                              user.name ||
                                `${user.firstName} ${user.lastName}` ||
                                user.nickname ||
                                user.email
                            )
                            setShowActivityModal(true)
                          }}
                          className="text-purple-600 hover:text-purple-900"
                          title="Aktivitäts-Historie"
                        >
                          <History className="h-5 w-5" />
                        </button>
                        {!user.isAdmin && (
                          <button
                            onClick={() => handleToggleAdmin(user.id, true)}
                            className="text-purple-600 hover:text-purple-900"
                            title="Als Admin setzen"
                          >
                            <Shield className="h-5 w-5" />
                          </button>
                        )}
                        {user.isAdmin && user.id !== session.user.id && (
                          <button
                            onClick={() => handleToggleAdmin(user.id, false)}
                            className="text-gray-400 hover:text-gray-600"
                            title="Admin-Rechte entfernen"
                          >
                            <Shield className="h-5 w-5" />
                          </button>
                        )}
                        {!user.isBlocked ? (
                          <button
                            onClick={() => handleBlock(user.id, true)}
                            className="text-red-600 hover:text-red-900"
                            title="Benutzer blockieren"
                          >
                            <Ban className="h-5 w-5" />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleBlock(user.id, false)}
                            className="text-green-600 hover:text-green-900"
                            title="Benutzer entblocken"
                          >
                            <UserCheck className="h-5 w-5" />
                          </button>
                        )}
                        <button
                          onClick={() => handleWarn(user.id)}
                          className="text-orange-600 hover:text-orange-900"
                          title="Warnung senden"
                        >
                          <AlertTriangle className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {filteredUsers.length === 0 && (
          <div className="py-12 text-center">
            <Users className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Keine Benutzer gefunden</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchQuery ? 'Versuchen Sie eine andere Suche.' : 'Es gibt noch keine Benutzer.'}
            </p>
          </div>
        )}
      </div>
      <Footer />

      {/* Modals */}
      {selectedUserId && (
        <>
          <UserReportsModal
            isOpen={showReportsModal}
            onClose={() => {
              setShowReportsModal(false)
              setSelectedUserId(null)
              setSelectedUserName(null)
            }}
            userId={selectedUserId}
            userName={selectedUserName}
            onReportRemoved={() => {
              // Lade User-Liste neu, um aktualisierte Report-Anzahl zu erhalten
              loadUsers()
            }}
          />
          <UserNotesModal
            isOpen={showNotesModal}
            onClose={() => {
              setShowNotesModal(false)
              setSelectedUserId(null)
              setSelectedUserName(null)
            }}
            userId={selectedUserId}
            userName={selectedUserName}
          />
          <UserActivityModal
            isOpen={showActivityModal}
            onClose={() => {
              setShowActivityModal(false)
              setSelectedUserId(null)
              setSelectedUserName(null)
            }}
            userId={selectedUserId}
            userName={selectedUserName}
          />
        </>
      )}

      {/* Warn User Modal */}
      {warnUserId && (
        <WarnUserModal
          isOpen={showWarnModal}
          onClose={() => {
            setShowWarnModal(false)
            setWarnUserId(null)
            setWarnUserName(null)
          }}
          userId={warnUserId}
          userName={warnUserName}
          onWarned={handleWarned}
        />
      )}
    </div>
  )
}
