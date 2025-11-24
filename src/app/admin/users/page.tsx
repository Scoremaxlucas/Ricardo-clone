'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { 
  Users, 
  Search, 
  Shield, 
  Ban, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  UserCheck,
  UserX
} from 'lucide-react'
import Link from 'next/link'

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
}

export default function AdminUsersPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filter, setFilter] = useState<'all' | 'active' | 'blocked' | 'pending'>('all')

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
    const isAdminInSession = session?.user?.isAdmin === true || session?.user?.isAdmin === 1

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
      .catch((error) => {
        console.error('Error checking admin status:', error)
        setLoading(false)
        router.push('/')
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, status])

  const loadUsers = async () => {
    setLoading(true)
    try {
      console.log('Loading users...')
      const res = await fetch('/api/admin/users')
      console.log('Users API response status:', res.status)
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: 'Unknown error' }))
        console.error('Users API error:', errorData)
        alert('Fehler beim Laden der Benutzer: ' + (errorData.message || 'Unbekannter Fehler'))
        setLoading(false)
        return
      }
      
      const data = await res.json()
      console.log('Users data received:', data)
      console.log('Number of users:', data.length)
      setUsers(Array.isArray(data) ? data : [])
    } catch (error: any) {
      console.error('Error loading users:', error)
      alert('Fehler beim Laden der Benutzer: ' + (error?.message || String(error)))
    } finally {
      setLoading(false)
    }
  }

  const handleBlock = async (userId: string, block: boolean) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}/${block ? 'block' : 'unblock'}`, {
        method: 'POST'
      })
      if (res.ok) {
        loadUsers()
      } else {
        const data = await res.json()
        alert(data.message || 'Fehler beim Blockieren/Entblocken')
      }
    } catch (error) {
      console.error('Error blocking user:', error)
      alert('Fehler beim Blockieren/Entblocken')
    }
  }

  const handleWarn = async (userId: string) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}/warn`, {
        method: 'POST'
      })
      if (res.ok) {
        loadUsers()
        alert('Warnung wurde gesendet')
      } else {
        const data = await res.json()
        alert(data.message || 'Fehler beim Senden der Warnung')
      }
    } catch (error) {
      console.error('Error warning user:', error)
      alert('Fehler beim Senden der Warnung')
    }
  }

  const handleToggleAdmin = async (userId: string, makeAdmin: boolean) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}/admin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isAdmin: makeAdmin })
      })
      if (res.ok) {
        loadUsers()
      } else {
        const data = await res.json()
        alert(data.message || 'Fehler beim Ändern der Admin-Rechte')
      }
    } catch (error) {
      console.error('Error toggling admin:', error)
      alert('Fehler beim Ändern der Admin-Rechte')
    }
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

  // Prüfe Admin-Status nur aus Session
  const isAdminInSession = session?.user?.isAdmin === true || session?.user?.isAdmin === 1
  
  if (!session || !isAdminInSession) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Sie haben keine Berechtigung für diese Seite.</p>
          <Link href="/" className="mt-4 text-primary-600 hover:text-primary-700">
            Zurück zur Hauptseite
          </Link>
        </div>
      </div>
    )
  }

  // Filter und Suche
  const filteredUsers = users.filter(user => {
    const matchesSearch = !searchQuery || 
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.nickname?.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesFilter = 
      filter === 'all' ||
      (filter === 'active' && !user.isBlocked) ||
      (filter === 'blocked' && user.isBlocked) ||
      (filter === 'pending' && user.verificationStatus === 'pending')

    return matchesSearch && matchesFilter
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Benutzerverwaltung</h1>
              <p className="mt-2 text-gray-600">Verwalten Sie alle Benutzer der Plattform</p>
            </div>
            <div className="flex gap-4">
              <Link
                href="/"
                className="text-primary-600 hover:text-primary-700 font-medium"
              >
                ← Zurück zur Hauptseite
              </Link>
              <Link
                href="/admin/dashboard"
                className="text-gray-600 hover:text-gray-700 font-medium"
              >
                Dashboard
              </Link>
            </div>
          </div>
        </div>

        {/* Filter und Suche */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Nach E-Mail, Name oder Nickname suchen..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === 'all'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Alle
              </button>
              <button
                onClick={() => setFilter('active')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === 'active'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Aktiv
              </button>
              <button
                onClick={() => setFilter('blocked')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === 'blocked'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Blockiert
              </button>
              <button
                onClick={() => setFilter('pending')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === 'pending'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Ausstehend
              </button>
            </div>
          </div>
        </div>

        {/* User Liste */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Benutzer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Verifizierung
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Warnungen
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Registriert
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Aktionen
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {user.name || `${user.firstName} ${user.lastName}` || user.nickname || 'Unbekannt'}
                          {user.isAdmin && (
                            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
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
                    <td className="px-6 py-4 whitespace-nowrap">
                      {user.isBlocked ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          <Ban className="h-3 w-3 mr-1" />
                          Blockiert
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Aktiv
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {user.verificationStatus === 'pending' && (
                        <Link
                          href={`/admin/verifications?userId=${user.id}`}
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800 hover:bg-orange-200"
                        >
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Zu prüfen
                        </Link>
                      )}
                      {user.verificationStatus === 'approved' && user.verified && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Verifiziert
                        </span>
                      )}
                      {user.verificationStatus === 'rejected' && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          <XCircle className="h-3 w-3 mr-1" />
                          Abgelehnt
                        </span>
                      )}
                      {!user.verificationStatus && (
                        <span className="text-sm text-gray-500">Nicht gestartet</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.warningCount > 0 ? (
                        <span className="inline-flex items-center text-orange-600">
                          <AlertTriangle className="h-4 w-4 mr-1" />
                          {user.warningCount}
                        </span>
                      ) : (
                        <span className="text-gray-400">0</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(user.createdAt).toLocaleDateString('de-CH')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
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
          <div className="text-center py-12">
            <Users className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Keine Benutzer gefunden</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchQuery ? 'Versuchen Sie eine andere Suche.' : 'Es gibt noch keine Benutzer.'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
