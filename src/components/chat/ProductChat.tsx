'use client'

import { useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { MessageCircle, Send, Globe, Lock } from 'lucide-react'
import { UserName } from '@/components/ui/UserName'

interface Message {
  id: string
  content: string
  isPublic: boolean
  createdAt: string
  sender: {
    id: string
    name: string | null
    email: string | null
  }
  receiver: {
    id: string
    name: string | null
  }
}

interface ProductChatProps {
  watchId: string
  sellerId: string
}

export function ProductChat({ watchId, sellerId }: ProductChatProps) {
  const { data: session } = useSession()
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [isPublic, setIsPublic] = useState(false)
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const isSeller = session?.user?.id === sellerId

  const loadMessages = async () => {
    try {
      const res = await fetch(`/api/messages?watchId=${watchId}&t=${Date.now()}`)
      if (res.ok) {
        const data = await res.json()
        console.log('Loaded messages:', data.messages?.length || 0)
        console.log('Messages:', data.messages)
        setMessages(data.messages || [])
      } else {
        console.error('Error loading messages, status:', res.status)
      }
    } catch (error) {
      console.error('Error loading messages:', error)
    }
  }

  useEffect(() => {
    loadMessages()
    // Polling alle 5 Sekunden für neue Nachrichten
    const interval = setInterval(loadMessages, 5000)
    return () => clearInterval(interval)
  }, [watchId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !session?.user) return

    setLoading(true)
    try {
      // Käufer sendet immer privat, nur Verkäufer kann öffentlich senden
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          watchId,
          content: newMessage.trim(),
          isPublic: isSeller ? isPublic : false // Käufer kann nicht öffentlich senden
        })
      })

      if (res.ok) {
        setNewMessage('')
        setIsPublic(false)
        await loadMessages()
      } else {
        const error = await res.json()
        alert('Fehler: ' + (error.message || 'Unbekannter Fehler'))
      }
    } catch (error) {
      console.error('Error sending message:', error)
      alert('Fehler beim Senden der Nachricht')
    } finally {
      setLoading(false)
    }
  }

  const togglePublic = async (messageId: string, currentIsPublic: boolean) => {
    if (!isSeller) return

    try {
      const res = await fetch(`/api/messages/${messageId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPublic: !currentIsPublic })
      })

      if (res.ok) {
        await loadMessages()
      } else {
        const error = await res.json()
        alert('Fehler: ' + (error.message || 'Unbekannter Fehler'))
      }
    } catch (error) {
      console.error('Error toggling public:', error)
    }
  }

  if (!session?.user) {
    const currentUrl = typeof window !== 'undefined' 
      ? window.location.pathname + window.location.search 
      : '/'
    return (
      <div className="bg-white rounded-lg shadow p-6 mt-8">
        <p className="text-gray-600 text-center">
          Bitte <a href={`/login?callbackUrl=${encodeURIComponent(currentUrl)}`} className="text-primary-600 hover:underline">anmelden</a>, um Fragen zu stellen.
        </p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow p-6 mt-8">
      <div className="flex items-center mb-4">
        <MessageCircle className="h-5 w-5 mr-2 text-primary-600" />
        <h2 className="text-xl font-semibold text-gray-900">Fragen & Antworten</h2>
      </div>

      {/* Nachrichten-Liste */}
      <div className="max-h-96 overflow-y-auto mb-4 space-y-3 border-b pb-4">
        {messages.length === 0 ? (
          <p className="text-gray-500 text-center py-4">Noch keine Nachrichten</p>
        ) : (
          messages.map((msg) => {
            const isOwnMessage = msg.sender.id === session.user?.id
            const isReceiver = msg.receiver.id === session.user?.id

            return (
              <div
                key={msg.id}
                className={`p-3 rounded-lg ${
                  isOwnMessage
                    ? 'bg-primary-50 ml-8'
                    : isReceiver
                    ? 'bg-blue-50 mr-8'
                    : 'bg-gray-50'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {isOwnMessage ? (
                        <span className="font-semibold text-gray-900">Du</span>
                      ) : (
                        <UserName 
                          userId={msg.sender.id} 
                          userName={msg.sender.name || msg.sender.email || 'Unbekannt'} 
                          badgeSize="sm"
                          className="font-semibold text-gray-900"
                        />
                      )}
                      {msg.isPublic ? (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded flex items-center gap-1">
                          <Globe className="h-3 w-3" />
                          Öffentlich
                        </span>
                      ) : (
                        <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded flex items-center gap-1">
                          <Lock className="h-3 w-3" />
                          Privat
                        </span>
                      )}
                      <span className="text-xs text-gray-500">
                        {new Date(msg.createdAt).toLocaleString('de-CH')}
                      </span>
                    </div>
                    <p className="text-gray-800">{msg.content}</p>
                  </div>
                  {isSeller && !isOwnMessage && (
                    <button
                      onClick={() => togglePublic(msg.id, msg.isPublic)}
                      className="ml-2 text-xs text-primary-600 hover:text-primary-700 underline"
                      title={msg.isPublic ? 'Als privat markieren' : 'Als öffentlich markieren'}
                    >
                      {msg.isPublic ? 'Privat' : 'Öffentlich'}
                    </button>
                  )}
                </div>
              </div>
            )
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Eingabe-Formular */}
      <form onSubmit={handleSend} className="space-y-3">
        <div className="flex items-start gap-2">
          <textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Stellen Sie eine Frage..."
            rows={3}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-gray-900 resize-none"
            required
          />
        </div>
        <div className="flex items-center justify-between">
          {isSeller && (
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span>Nachricht öffentlich sichtbar machen</span>
            </label>
          )}
          {!isSeller && <div></div>}
          <button
            type="submit"
            disabled={loading || !newMessage.trim()}
            className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Send className="h-4 w-4" />
            {loading ? 'Wird gesendet...' : 'Senden'}
          </button>
        </div>
      </form>
    </div>
  )
}

