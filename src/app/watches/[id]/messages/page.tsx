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
      <div className="max-w-4xl mx-auto px-4">
        <button
          onClick={() => router.back()}
          className="mb-6 inline-flex items-center text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Zurück
        </button>

        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Nachrichten zu dieser Uhr
        </h1>
        {watch && (
          <p className="text-gray-600 mb-8">
            {watch.title}
          </p>
        )}

        {/* Nachrichten-Liste */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          {messages.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              Noch keine Nachrichten vorhanden.
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`p-4 rounded-lg ${
                    message.isPublic ? 'bg-blue-50 border-l-4 border-blue-500' : 'bg-gray-50'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold text-gray-900">
                        {message.sender.name}
                      </span>
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
                        minute: '2-digit'
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
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Nachricht senden
            </h2>
            <form onSubmit={handleSendMessage}>
              <textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Schreiben Sie eine Nachricht..."
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-gray-900"
                required
              />
              
              {/* Nur Verkäufer kann öffentlich machen */}
              {isSeller && (
                <div className="mt-4 flex items-center">
                  <input
                    type="checkbox"
                    id="isPublic"
                    checked={isPublic}
                    onChange={(e) => setIsPublic(e.target.checked)}
                    className="mr-2 h-4 w-4 text-primary-600"
                  />
                  <label htmlFor="isPublic" className="text-sm text-gray-700 flex items-center cursor-pointer">
                    <Globe className="h-4 w-4 mr-1" />
                    Diese Nachricht öffentlich anzeigen
                  </label>
                </div>
              )}

              <button
                type="submit"
                disabled={sending || !newMessage.trim()}
                className="mt-4 w-full bg-primary-600 text-white py-3 rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
              >
                <Send className="h-4 w-4 mr-2" />
                {sending ? 'Wird gesendet...' : 'Nachricht senden'}
              </button>
            </form>
          </div>
        )}

        {!session && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
            <p className="text-gray-700">
              Bitte <a href="/login" className="text-primary-600 hover:underline">melden Sie sich an</a>, um Nachrichten zu senden.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
