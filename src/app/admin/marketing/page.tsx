'use client'

import { Footer } from '@/components/layout/Footer'
import { Header } from '@/components/layout/Header'
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Download,
  Mail,
  Search,
  Upload,
  Users,
} from 'lucide-react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'

interface Contact {
  id: string
  email: string
  tags: string[]
  source: string
  status: string
  createdAt: string
}

export default function MarketingContactsPage() {
  const { data: session } = useSession()
  const isAdmin = (session?.user as any)?.isAdmin === true

  const [contacts, setContacts] = useState<Contact[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)

  // Filters
  const [search, setSearch] = useState('')
  const [tagFilter, setTagFilter] = useState('marketing')
  const [showUnsubscribed, setShowUnsubscribed] = useState(false)

  // Import form
  const [importEmails, setImportEmails] = useState('')
  const [importTags, setImportTags] = useState('marketing')
  const [importSource, setImportSource] = useState('manual')
  const [importLoading, setImportLoading] = useState(false)
  const [importResult, setImportResult] = useState<string | null>(null)

  const loadContacts = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: '50',
        showUnsubscribed: String(showUnsubscribed),
      })
      if (search) params.set('search', search)
      if (tagFilter) params.set('tag', tagFilter)

      const res = await fetch(`/api/admin/marketing/contacts?${params}`)
      if (res.ok) {
        const data = await res.json()
        setContacts(data.contacts)
        setTotal(data.total)
        setTotalPages(data.totalPages)
      }
    } catch (err) {
      console.error('Error loading contacts:', err)
    } finally {
      setLoading(false)
    }
  }, [page, search, tagFilter, showUnsubscribed])

  useEffect(() => {
    if (isAdmin) loadContacts()
  }, [isAdmin, loadContacts])

  const handleImport = async () => {
    if (!importEmails.trim()) return
    setImportLoading(true)
    setImportResult(null)
    try {
      const res = await fetch('/api/admin/marketing/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emails: importEmails,
          tags: importTags,
          source: importSource,
        }),
      })
      const data = await res.json()
      if (res.ok) {
        setImportResult(`${data.imported} importiert, ${data.skipped} aktualisiert`)
        setImportEmails('')
        loadContacts()
      } else {
        setImportResult(`Fehler: ${data.error}`)
      }
    } catch {
      setImportResult('Fehler beim Import')
    } finally {
      setImportLoading(false)
    }
  }

  const handleExport = () => {
    const params = new URLSearchParams({ showUnsubscribed: String(showUnsubscribed) })
    if (tagFilter) params.set('tag', tagFilter)
    window.open(`/api/admin/marketing/contacts/export?${params}`, '_blank')
  }

  const handleSearch = () => {
    setPage(1)
    loadContacts()
  }

  if (!isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-600">Sie haben keine Berechtigung für diese Seite.</p>
          <Link href="/" className="mt-4 inline-block text-primary-600 hover:text-primary-700">
            Zurück zur Hauptseite
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/admin/dashboard"
              className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-4 w-4" />
              Zurück zum Dashboard
            </Link>
          </div>
          <Link
            href="/admin/marketing/send"
            className="flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
          >
            <Mail className="h-4 w-4" />
            Marketing E-Mail senden
          </Link>
        </div>

        <h1 className="mb-2 text-2xl font-bold text-gray-900">Marketing Kontakte</h1>
        <p className="mb-8 text-sm text-gray-600">
          Import, Segmente (Tags) und Verwaltung (Absender: noreply@helvenda.ch)
        </p>

        {/* Import Section */}
        <div className="mb-8 rounded-lg bg-white p-6 shadow">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900">
            <Upload className="h-5 w-5" />
            Import (E-Mails)
          </h2>
          <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Tags (Komma-separiert)
              </label>
              <input
                type="text"
                value={importTags}
                onChange={e => setImportTags(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                placeholder="marketing"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Quelle</label>
              <select
                value={importSource}
                onChange={e => setImportSource(e.target.value)}
                aria-label="Quelle"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              >
                <option value="manual">manual</option>
                <option value="registration">registration</option>
                <option value="contact-form">contact-form</option>
                <option value="import">import</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={handleImport}
                disabled={importLoading || !importEmails.trim()}
                className="w-full rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {importLoading ? 'Importiere...' : 'Importieren'}
              </button>
            </div>
          </div>
          <textarea
            value={importEmails}
            onChange={e => setImportEmails(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            rows={4}
            placeholder="E-Mailadressen hier einfügen (eine pro Zeile oder Komma/Leerzeichen getrennt)"
          />
          {importResult && (
            <p className={`mt-2 text-sm ${importResult.startsWith('Fehler') ? 'text-red-600' : 'text-green-600'}`}>
              {importResult}
            </p>
          )}
        </div>

        {/* Contacts List */}
        <div className="rounded-lg bg-white p-6 shadow">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
              <Users className="h-5 w-5" />
              Kontakte
            </h2>
            <button
              onClick={handleExport}
              className="flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700"
            >
              <Download className="h-4 w-4" />
              CSV Export
            </button>
          </div>

          {/* Filters */}
          <div className="mb-4 flex flex-wrap items-end gap-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Suche</label>
              <div className="relative">
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSearch()}
                  className="w-56 rounded-lg border border-gray-300 px-3 py-2 pr-8 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  placeholder="email oder text"
                />
                <Search className="absolute right-2 top-2.5 h-4 w-4 text-gray-400" />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Tag</label>
              <input
                type="text"
                value={tagFilter}
                onChange={e => setTagFilter(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                className="w-40 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                placeholder="marketing"
              />
            </div>
            <label className="flex items-center gap-2 text-sm text-gray-600">
              <input
                type="checkbox"
                checked={showUnsubscribed}
                onChange={e => {
                  setShowUnsubscribed(e.target.checked)
                  setPage(1)
                }}
                className="rounded border-gray-300"
              />
              Abgemeldete anzeigen
            </label>
            <button
              onClick={handleSearch}
              className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
            >
              Laden
            </button>
          </div>

          <p className="mb-3 text-sm text-gray-500">Total: {total}</p>

          {/* Table */}
          {loading ? (
            <div className="flex h-40 items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary-600" />
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b text-xs font-medium uppercase text-gray-500">
                    <tr>
                      <th className="pb-3 pr-4">E-Mail</th>
                      <th className="pb-3 pr-4">Tags</th>
                      <th className="pb-3 pr-4">Quelle</th>
                      <th className="pb-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {contacts.map(contact => (
                      <tr key={contact.id} className="hover:bg-gray-50">
                        <td className="py-3 pr-4 font-mono text-sm">{contact.email}</td>
                        <td className="py-3 pr-4">
                          <div className="flex flex-wrap gap-1">
                            {contact.tags.map((tag: string, i: number) => (
                              <span
                                key={i}
                                className="rounded bg-blue-50 px-2 py-0.5 text-xs text-blue-700"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="py-3 pr-4 text-gray-600">{contact.source}</td>
                        <td className="py-3">
                          <span
                            className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                              contact.status === 'active'
                                ? 'bg-green-50 text-green-700'
                                : 'bg-red-50 text-red-700'
                            }`}
                          >
                            {contact.status === 'active' ? 'aktiv' : 'abgemeldet'}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {contacts.length === 0 && (
                      <tr>
                        <td colSpan={4} className="py-8 text-center text-gray-500">
                          Keine Kontakte gefunden
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-4 flex items-center justify-between">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 disabled:opacity-50"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Zurück
                  </button>
                  <span className="text-sm text-gray-600">
                    Seite {page} / {totalPages}
                  </span>
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 disabled:opacity-50"
                  >
                    Weiter
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
      <Footer />
    </div>
  )
}
