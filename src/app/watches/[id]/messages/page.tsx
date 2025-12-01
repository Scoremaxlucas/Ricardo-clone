'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Send, Globe, Lock, ArrowLeft } from 'lucide-react'

interface Message {
  id: string
  content: string
  createdAt: string
  isPublic: boolean
  sender: {
    id: string
    name: string
    image: string | null
  }
  receiver: {
    id: string
    name: string
    image: string | null
  }
}

interface Watch {
  id: string
  title: string
  sellerId: string
  seller: {
    id: string
    name: string
  }
}

export default function WatchMessagesPage({ params }: { params: { id: string } }) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [watch, setWatch] = useState<Watch | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [newMessage, setNewMessage] = useState('')
  const [isPublic, setIsPublic] = useState(false)
  const [sending, setSending] = useState(false)

  useEffect(() => {
    fetchWatch()
    fetchMessages()
  }, [params.id])

  const fetchWatch = async () => {
    try {
      const res = await fetch(`/api/watches/${params.id}`)
      if (res.ok) {
        const data = await res.json()
        setWatch(data)
      }
    } catch (error) {
      console.error('Error fetching watch:', error)
    }
  }

  const fetchMessages = async () => {
    try {
      const res = await fetch(`/api/watches/${params.id}/messages`)
      if (res.ok) {
        const data = await res.json()
        setMessages(data)
      }
    } catch (error) {
      console.error('Error fetching messages:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!session || !newMessage.trim() || !watch) return

    setSending(true)
    try {
      const isSeller = session.user?.id === watch.sellerId
      const receiverId = isSeller ? 'interessent-id' : watch.sellerId // TODO: Für Interessenten die richtige ID holen

      const res = await fetch(`/api/watches/${params.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: newMessage,
          receiverId: receiverId,
          isPublic: isSeller ? isPublic : false, // Nur Verkäufer kann öffentlich machen
        }),
      })

      if (res.ok) {
        setNewMessage('')
        setIsPublic(false)
        fetchMessages()
      }
    } catch (error) {
      console.error('Error sending message:', error)
    } finally {
      setSending(false)
    }
  }

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center">Lädt...</div>
  }

  const isSeller = watch && session?.user?.id === watch.sellerId

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="mx-auto max-w-4xl px-4">
        <button
          onClick={() => router.back()}
          className="mb-6 inline-flex items-center text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Zurück
        </button>

        <h1 className="mb-2 text-3xl font-bold text-gray-900">Nachrichten zu dieser Uhr</h1>
        {watch && <p className="mb-8 text-gray-600">{watch.title}</p>}

        {/* Nachrichten-Liste */}
        <div className="mb-6 rounded-lg bg-white p-6 shadow-md">
          {messages.length === 0 ? (
            <div className="py-12 text-center text-gray-500">Noch keine Nachrichten vorhanden.</div>
          ) : (
            <div className="space-y-4">
              {messages.map(message => (
                <div
                  key={message.id}
                  className={`rounded-lg p-4 ${
                    message.isPublic ? 'border-l-4 border-blue-500 bg-blue-50' : 'bg-gray-50'
                  }`}
                >
                  <div className="mb-2 flex items-start justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold text-gray-900">{message.sender.name}</span>
                      <span className="text-gray-500">→</span>
                      <span className="text-gray-700">{message.receiver.name}</span>
                      {message.isPublic && (
                        <Globe className="h-4 w-4 text-blue-600" title="Öffentlich" />
                      )}
                      {!message.isPublic && (
                        <Lock className="h-4 w-4 text-gray-400" title="Privat" />
                      )}
                    </div>
                    <span className="text-sm text-gray-500">
                      {new Date(message.createdAt).toLocaleDateString('de-CH', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <p className="text-gray-800">{message.content}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Nachricht senden (nur für eingeloggte Nutzer) */}
        {session && (
          <div className="rounded-lg bg-white p-6 shadow-md">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Nachricht senden</h2>
            <form onSubmit={handleSendMessage}>
              <textarea
                value={newMessage}
                onChange={e => setNewMessage(e.target.value)}
                placeholder="Schreiben Sie eine Nachricht..."
                rows={4}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-primary-500"
                required
              />

              {/* Nur Verkäufer kann öffentlich machen */}
              {isSeller && (
                <div className="mt-4 flex items-center">
                  <input
                    type="checkbox"
                    id="isPublic"
                    checked={isPublic}
                    onChange={e => setIsPublic(e.target.checked)}
                    className="mr-2 h-4 w-4 text-primary-600"
                  />
                  <label
                    htmlFor="isPublic"
                    className="flex cursor-pointer items-center text-sm text-gray-700"
                  >
                    <Globe className="mr-1 h-4 w-4" />
                    Diese Nachricht öffentlich anzeigen
                  </label>
                </div>
              )}

              <button
                type="submit"
                disabled={sending || !newMessage.trim()}
                className="mt-4 flex w-full items-center justify-center rounded-md bg-primary-600 py-3 text-white transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Send className="mr-2 h-4 w-4" />
                {sending ? 'Wird gesendet...' : 'Nachricht senden'}
              </button>
            </form>
          </div>
        )}

        {!session && (
          <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-center">
            <p className="text-gray-700">
              Bitte{' '}
              <a href="/login" className="text-primary-600 hover:underline">
                melden Sie sich an
              </a>
              , um Nachrichten zu senden.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
