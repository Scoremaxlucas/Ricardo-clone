'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { 
  Shield, 
  Ban, 
  AlertTriangle,
  CheckCircle,
  UserCheck,
  Search,
  Clock,
  UserX
} from 'lucide-react'
import Link from 'next/link'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { toast } from 'react-hot-toast'

interface BlockedUser {
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

export default function AdminSecurityPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [users, setUsers] = useState<BlockedUser[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

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
      loadBlockedUsers()
      return
    }

    // Falls nicht in Session, prüfe in DB
    fetch('/api/user/admin-status')
      .then(res => res.json())
      .then(data => {
        if (data.isAdmin) {
          loadBlockedUsers()
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

  const loadBlockedUsers = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/users/blocked')
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: 'Unbekannter Fehler' }))
        console.error('Blocked users API error:', errorData)
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
      console.error('Error loading blocked users:', error)
      setUsers([])
    } finally {
      setLoading(false)
    }
  }

  const handleUnblock = async (userId: string) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}/unblock`, {
        method: 'POST'
      })
      if (res.ok) {
        toast.success('Benutzer erfolgreich entblockt')
        loadBlockedUsers()
      } else {
        const data = await res.json()
        toast.error(data.message || 'Fehler beim Entblocken')
      }
    } catch (error) {
      console.error('Error unblocking user:', error)
      toast.error('Fehler beim Entblocken')
    }
  }

  const handleWarn = async (userId: string) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}/warn`, {
        method: 'POST'
      })
      if (res.ok) {
        toast.success('Warnung wurde gesendet')
        loadBlockedUsers()
      } else {
        const data = await res.json()
        toast.error(data.message || 'Fehler beim Senden der Warnung')
      }
    } catch (error) {
      console.error('Error warning user:', error)
      toast.error('Fehler beim Senden der Warnung')
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
    
    return matchesSearch
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Sicherheit</h1>
              <p className="mt-2 text-gray-600">Verwaltung geblockter Benutzer und Warnungen</p>
            </div>
            <div className="flex gap-4">
              <Link
                href="/admin/dashboard"
                className="text-gray-600 hover:text-gray-700 font-medium"
              >
                Dashboard
              </Link>
              <Link
                href="/admin/users"
                className="text-primary-600 hover:text-primary-700 font-medium"
              >
                Alle Benutzer
              </Link>
            </div>
          </div>
        </div>

        {/* Statistiken */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Geblockte Benutzer</p>
                <p className="mt-2 text-3xl font-bold text-red-600">{users.length}</p>
              </div>
              <Ban className="h-8 w-8 text-red-500" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Mit Warnungen</p>
                <p className="mt-2 text-3xl font-bold text-orange-600">
                  {users.filter(u => u.warningCount > 0).length}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-orange-500" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Diese Woche blockiert</p>
                <p className="mt-2 text-3xl font-bold text-gray-900">
                  {users.filter(u => {
                    if (!u.blockedAt) return false
                    const blockedDate = new Date(u.blockedAt)
                    const weekAgo = new Date()
                    weekAgo.setDate(weekAgo.getDate() - 7)
                    return blockedDate >= weekAgo
                  }).length}
                </p>
              </div>
              <Clock className="h-8 w-8 text-gray-500" />
            </div>
          </div>
        </div>

        {/* Suche */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
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
                    Blockiert am
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Warnungen
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Letzte Warnung
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
                      {user.blockedAt ? (
                        <div className="text-sm text-gray-900">
                          {new Date(user.blockedAt).toLocaleDateString('de-CH', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">Unbekannt</span>
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
                      {user.lastWarnedAt ? (
                        <div>
                          {new Date(user.lastWarnedAt).toLocaleDateString('de-CH', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric'
                          })}
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(user.createdAt).toLocaleDateString('de-CH')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleUnblock(user.id)}
                          className="text-green-600 hover:text-green-900"
                          title="Benutzer entblocken"
                        >
                          <UserCheck className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleWarn(user.id)}
                          className="text-orange-600 hover:text-orange-900"
                          title="Warnung senden"
                        >
                          <AlertTriangle className="h-5 w-5" />
                        </button>
                        <Link
                          href="/admin/users"
                          className="text-blue-600 hover:text-blue-900"
                          title="Alle Benutzer anzeigen"
                        >
                          <UserX className="h-5 w-5" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {filteredUsers.length === 0 && (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <Shield className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Keine geblockten Benutzer gefunden</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchQuery ? 'Versuchen Sie eine andere Suche.' : 'Es gibt derzeit keine geblockten Benutzer.'}
            </p>
          </div>
        )}
      </div>
      <Footer />
    </div>
  )
}

