'use client'

import { Footer } from '@/components/layout/Footer'
import { Header } from '@/components/layout/Header'
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle,
  Eye,
  Loader2,
  Mail,
  RefreshCw,
  Send,
  TestTube,
} from 'lucide-react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { useEffect, useState } from 'react'

interface Campaign {
  id: string
  subject: string
  tag: string | null
  status: string
  totalCount: number
  sentCount: number
  failedCount: number
  sentAt: string | null
  createdAt: string
}

export default function MarketingSendPage() {
  const { data: session } = useSession()
  const isAdmin = (session?.user as any)?.isAdmin === true

  // Form state
  const [subject, setSubject] = useState('')
  const [tag, setTag] = useState('marketing')
  const [limit, setLimit] = useState(5000)
  const [content, setContent] = useState('')
  const [resendCampaignId, setResendCampaignId] = useState('')

  // Campaigns history
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [campaignsLoading, setCampaignsLoading] = useState(false)

  // Action state
  const [sending, setSending] = useState(false)
  const [dryRunning, setDryRunning] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [previewHtml, setPreviewHtml] = useState<string | null>(null)
  const [confirmSend, setConfirmSend] = useState(false)

  const loadCampaigns = async () => {
    setCampaignsLoading(true)
    try {
      const res = await fetch('/api/admin/marketing/campaigns')
      if (res.ok) {
        const data = await res.json()
        setCampaigns(data.campaigns)
      }
    } catch (err) {
      console.error('Error loading campaigns:', err)
    } finally {
      setCampaignsLoading(false)
    }
  }

  useEffect(() => {
    if (isAdmin) loadCampaigns()
  }, [isAdmin])

  const handleDryRun = async () => {
    if (!subject || !content) {
      setError('Betreff und Inhalt sind erforderlich')
      return
    }
    setDryRunning(true)
    setError(null)
    setResult(null)
    try {
      const res = await fetch('/api/admin/marketing/campaigns/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, content, tag, limit, dryRun: true }),
      })
      const data = await res.json()
      if (res.ok) {
        setResult(data)
        setPreviewHtml(data.previewHtml)
      } else {
        setError(data.error)
      }
    } catch {
      setError('Fehler beim Dry-Run')
    } finally {
      setDryRunning(false)
    }
  }

  const handleSend = async () => {
    if (!subject || !content) {
      setError('Betreff und Inhalt sind erforderlich')
      return
    }
    if (!confirmSend) {
      setConfirmSend(true)
      return
    }
    setSending(true)
    setError(null)
    setResult(null)
    setConfirmSend(false)
    try {
      const res = await fetch('/api/admin/marketing/campaigns/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, content, tag, limit }),
      })
      const data = await res.json()
      if (res.ok) {
        setResult(data)
        loadCampaigns()
      } else {
        setError(data.error)
      }
    } catch {
      setError('Fehler beim Senden')
    } finally {
      setSending(false)
    }
  }

  const handleResendFailed = async () => {
    if (!resendCampaignId || !subject || !content) {
      setError('Kampagnen-ID, Betreff und Inhalt sind erforderlich')
      return
    }
    setSending(true)
    setError(null)
    setResult(null)
    try {
      const res = await fetch('/api/admin/marketing/campaigns/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject,
          content,
          tag,
          limit,
          campaignId: resendCampaignId,
        }),
      })
      const data = await res.json()
      if (res.ok) {
        setResult(data)
        loadCampaigns()
      } else {
        setError(data.error)
      }
    } catch {
      setError('Fehler beim erneuten Senden')
    } finally {
      setSending(false)
    }
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
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6 flex items-center gap-4">
          <Link
            href="/admin/marketing"
            className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Zurück zu Kontakte
          </Link>
        </div>

        <h1 className="mb-2 text-2xl font-bold text-gray-900">Marketing E-Mail senden</h1>
        <p className="mb-8 text-sm text-gray-600">
          Absender: noreply@helvenda.ch
        </p>

        {/* Compose Form */}
        <div className="mb-8 rounded-lg bg-white p-6 shadow">
          <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Betreff</label>
              <input
                type="text"
                value={subject}
                onChange={e => setSubject(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                placeholder="Neu auf helvenda.ch..."
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Tag (Segment)
              </label>
              <input
                type="text"
                value={tag}
                onChange={e => setTag(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                placeholder="marketing (leer = alle)"
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Limit (max. Empfänger)
            </label>
            <input
              type="number"
              value={limit}
              onChange={e => setLimit(parseInt(e.target.value) || 5000)}
              aria-label="Limit (max. Empfänger)"
              className="w-40 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            />
          </div>

          {/* Past Campaigns */}
          <div className="mb-4">
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Letzte Kampagnen (aus DB)
            </label>
            <button
              onClick={loadCampaigns}
              disabled={campaignsLoading}
              className="mb-2 text-sm text-primary-600 hover:text-primary-700"
            >
              {campaignsLoading ? 'Lade...' : 'Kampagnen laden'}
            </button>
            {campaigns.length > 0 && (
              <div className="max-h-40 overflow-y-auto rounded border border-gray-200 text-xs">
                <table className="w-full">
                  <thead className="bg-gray-50 text-gray-500">
                    <tr>
                      <th className="px-2 py-1 text-left">ID</th>
                      <th className="px-2 py-1 text-left">Betreff</th>
                      <th className="px-2 py-1">Status</th>
                      <th className="px-2 py-1">Gesendet</th>
                      <th className="px-2 py-1">Fehler</th>
                      <th className="px-2 py-1">Datum</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {campaigns.map(c => (
                      <tr
                        key={c.id}
                        className="cursor-pointer hover:bg-gray-50"
                        onClick={() => setResendCampaignId(c.id)}
                      >
                        <td className="px-2 py-1 font-mono">{c.id.slice(0, 8)}...</td>
                        <td className="max-w-[200px] truncate px-2 py-1">{c.subject}</td>
                        <td className="px-2 py-1 text-center">
                          <span
                            className={`rounded px-1.5 py-0.5 ${
                              c.status === 'sent'
                                ? 'bg-green-50 text-green-700'
                                : c.status === 'sending'
                                  ? 'bg-yellow-50 text-yellow-700'
                                  : c.status === 'failed'
                                    ? 'bg-red-50 text-red-700'
                                    : 'bg-gray-50 text-gray-700'
                            }`}
                          >
                            {c.status}
                          </span>
                        </td>
                        <td className="px-2 py-1 text-center">{c.sentCount}/{c.totalCount}</td>
                        <td className="px-2 py-1 text-center text-red-600">
                          {c.failedCount > 0 ? c.failedCount : '-'}
                        </td>
                        <td className="px-2 py-1 text-gray-500">
                          {c.sentAt
                            ? new Date(c.sentAt).toLocaleDateString('de-CH')
                            : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Resend Campaign ID */}
          <div className="mb-4">
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Kampagnen-ID (für Resend fehlgeschlagener)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={resendCampaignId}
                onChange={e => setResendCampaignId(e.target.value)}
                className="w-80 rounded-lg border border-gray-300 px-3 py-2 font-mono text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                placeholder="clx_..."
              />
              <span className="text-xs text-gray-500">
                Refresh ist ok. Kampagnen-ID bleibt gespeichert.
              </span>
            </div>
          </div>

          {/* Content Editor */}
          <div className="mb-4">
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Inhalt (Text + Links + Bilder)
            </label>
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 font-mono text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              rows={10}
              placeholder="Text hier..."
            />
            <div className="mt-1 space-y-0.5 text-xs text-gray-500">
              <p>Link: [Tarife ansehen](https://helvenda.ch/pricing)</p>
              <p>Bild: Bild [Beschreibung](https://example.com/bild.jpg)</p>
              <p>Klickbares Bild: Bild [Flyer](https://example.com/bild.jpg)(https://helvenda.ch/)</p>
            </div>
          </div>

          {/* Preview */}
          <div className="mb-6">
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Vorschau (Header/Logo)
            </label>
            {previewHtml ? (
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                <iframe
                  srcDoc={previewHtml}
                  className="h-[500px] w-full rounded border border-gray-200 bg-white"
                  sandbox="allow-same-origin"
                  title="E-Mail Vorschau"
                />
              </div>
            ) : (
              <p className="text-sm text-gray-500">
                Noch keine Vorschau geladen.
              </p>
            )}
            <button
              onClick={handleDryRun}
              disabled={dryRunning || !subject || !content}
              className="mt-2 flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700 disabled:opacity-50"
            >
              <Eye className="h-4 w-4" />
              {dryRunning ? 'Lade...' : 'Vorschau laden'}
            </button>
          </div>

          {/* Error / Result */}
          {error && (
            <div className="mb-4 flex items-center gap-2 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {result && !result.dryRun && (
            <div className="mb-4 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 flex-shrink-0" />
                <strong>
                  {result.resend ? 'Erneut gesendet' : 'Kampagne gesendet'}
                </strong>
              </div>
              <p className="mt-1">
                {result.sentCount} gesendet, {result.failedCount} fehlgeschlagen
                {result.campaignId && (
                  <span className="ml-2 font-mono text-xs">
                    (ID: {result.campaignId})
                  </span>
                )}
              </p>
            </div>
          )}

          {result?.dryRun && (
            <div className="mb-4 rounded-lg bg-blue-50 px-4 py-3 text-sm text-blue-700">
              <strong>Dry-Run Ergebnis:</strong> {result.recipientCount} Empfänger
              würden die E-Mail erhalten (Segment: {result.tag})
              {result.sampleRecipients?.length > 0 && (
                <div className="mt-1 text-xs">
                  Beispiele: {result.sampleRecipients.join(', ')}
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleDryRun}
              disabled={dryRunning || !subject || !content}
              className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              <TestTube className="h-4 w-4" />
              {dryRunning ? 'Läuft...' : 'Dry-Run'}
            </button>

            {confirmSend ? (
              <button
                onClick={handleSend}
                disabled={sending}
                className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                <Send className="h-4 w-4" />
                Versand bestätigen
              </button>
            ) : (
              <button
                onClick={handleSend}
                disabled={sending || !subject || !content}
                className="flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
              >
                {sending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                {sending ? 'Sende...' : 'Senden'}
              </button>
            )}

            <button
              onClick={handleResendFailed}
              disabled={sending || !resendCampaignId || !subject || !content}
              className="flex items-center gap-2 rounded-lg border border-orange-300 bg-orange-50 px-4 py-2 text-sm font-medium text-orange-700 hover:bg-orange-100 disabled:opacity-50"
            >
              <RefreshCw className="h-4 w-4" />
              Fehlgeschlagene erneut senden
            </button>
          </div>

          <p className="mt-4 text-xs text-gray-500">
            Jede E-Mail enthält automatisch einen Abmeldelink. Absender ist noreply@helvenda.ch
          </p>
        </div>
      </div>
      <Footer />
    </div>
  )
}
