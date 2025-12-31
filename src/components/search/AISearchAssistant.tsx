'use client'

import { Bot, Loader2, Package, Send, Sparkles, User, X } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  filters?: any
  results?: {
    watches: any[]
    total: number
  }
  needsClarification?: boolean
  clarificationQuestion?: string
  createdAt: string
}

interface AISearchAssistantProps {
  className?: string
}

export function AISearchAssistant({ className = '' }: AISearchAssistantProps) {
  const { data: session } = useSession()
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Scroll zu letzter Nachricht
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Fokus auf Input wenn Chat geöffnet wird
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [isOpen])

  // Begrüßungsnachricht
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([
        {
          id: 'welcome',
          role: 'assistant',
          content:
            'Hallo! 👋 Ich bin dein KI-Suchassistent. Beschreibe mir, wonach du suchst, und ich finde die passenden Artikel für dich.\n\n💡 Beispiele:\n• "Zeig mir Rolex Uhren unter 5000 CHF"\n• "Ich suche ein Motorrad in Zürich"\n• "Was hast du für Laptops?"\n• "iPhone 15 Pro Max neu"\n• "Auktionen für Uhren"',
          createdAt: new Date().toISOString(),
        },
      ])
    }
  }, [isOpen, messages.length])

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault()

    if (!input.trim() || loading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      createdAt: new Date().toISOString(),
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setLoading(true)

    try {
      // Erstelle Conversation History für Kontext
      const conversationHistory = messages
        .filter(m => m.role !== 'assistant' || m.id !== 'welcome')
        .map(m => ({
          role: m.role,
          content: m.content,
        }))

      const response = await fetch('/api/ai/search-assistant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage.content,
          conversationHistory,
        }),
      })

      if (!response.ok) {
        throw new Error('Fehler bei der API-Anfrage')
      }

      const data = await response.json()

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.message,
        filters: data.filters,
        results: data.results,
        needsClarification: data.needsClarification,
        clarificationQuestion: data.clarificationQuestion,
        createdAt: new Date().toISOString(),
      }

      setMessages(prev => [...prev, assistantMessage])

      // Wenn Filter gefunden wurden, aktualisiere URL
      if (data.filters && Object.keys(data.filters).length > 0) {
        const searchParams = new URLSearchParams()

        if (data.filters.query) searchParams.append('q', data.filters.query)
        if (data.filters.category) searchParams.append('category', data.filters.category)
        if (data.filters.brand) searchParams.append('brand', data.filters.brand)
        if (data.filters.minPrice) searchParams.append('minPrice', data.filters.minPrice.toString())
        if (data.filters.maxPrice) searchParams.append('maxPrice', data.filters.maxPrice.toString())
        if (data.filters.condition) searchParams.append('condition', data.filters.condition)
        if (data.filters.isAuction !== null && data.filters.isAuction !== undefined) {
          searchParams.append('isAuction', data.filters.isAuction.toString())
        }
        if (data.filters.postalCode) searchParams.append('postalCode', data.filters.postalCode)

        // Aktualisiere URL ohne Reload
        router.push(`/search?${searchParams.toString()}`, { scroll: false })
      }
    } catch (error) {
      console.error('Fehler beim Senden:', error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Entschuldigung, es ist ein Fehler aufgetreten. Bitte versuche es erneut.',
        createdAt: new Date().toISOString(),
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setLoading(false)
    }
  }

  const handleApplyFilters = (filters: any) => {
    if (!filters || Object.keys(filters).length === 0) return

    const searchParams = new URLSearchParams()

    if (filters.query) searchParams.append('q', filters.query)
    if (filters.category) searchParams.append('category', filters.category)
    if (filters.brand) searchParams.append('brand', filters.brand)
    if (filters.minPrice) searchParams.append('minPrice', filters.minPrice.toString())
    if (filters.maxPrice) searchParams.append('maxPrice', filters.maxPrice.toString())
    if (filters.condition) searchParams.append('condition', filters.condition)
    if (filters.isAuction !== null && filters.isAuction !== undefined) {
      searchParams.append('isAuction', filters.isAuction.toString())
    }
    if (filters.postalCode) searchParams.append('postalCode', filters.postalCode)

    router.push(`/search?${searchParams.toString()}`)
    setIsOpen(false)
  }

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className={`fixed bottom-4 right-4 z-50 flex h-12 w-12 animate-pulse items-center justify-center rounded-full bg-gradient-to-br from-primary-600 to-primary-700 text-white shadow-lg transition-all hover:scale-110 hover:shadow-xl md:bottom-6 md:right-6 md:h-14 md:w-14 ${className}`}
          aria-label="KI-Suchassistent öffnen"
          title="KI-Suchassistent öffnen"
          style={{ maxWidth: 'calc(100vw - 2rem)' }}
        >
          <Sparkles className="h-5 w-5 md:h-6 md:w-6" />
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div
          className="fixed bottom-4 right-4 z-50 flex w-[calc(100vw-2rem)] max-w-md flex-col rounded-xl border border-gray-200 bg-white shadow-2xl md:bottom-6 md:right-6 md:w-[400px] lg:w-[500px]"
          style={{ maxHeight: '70vh', height: '600px' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-200 bg-gradient-to-r from-primary-600 to-primary-700 px-4 py-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-white">KI-Suchassistent</h3>
                <p className="text-xs text-white/80">Ich helfe dir beim Suchen</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="rounded-full p-1 text-white hover:bg-white/20"
              aria-label="Schließen"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4">
            {messages.map(message => (
              <div
                key={message.id}
                className={`mb-4 flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`flex max-w-[80%] gap-2 ${
                    message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                  }`}
                >
                  <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                      message.role === 'user'
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {message.role === 'user' ? (
                      <User className="h-4 w-4" />
                    ) : (
                      <Bot className="h-4 w-4" />
                    )}
                  </div>
                  <div
                    className={`rounded-2xl px-4 py-2 ${
                      message.role === 'user'
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    <p className="whitespace-pre-wrap text-sm">{message.content}</p>

                    {/* Zeige Ergebnisse wenn vorhanden */}
                    {message.results &&
                      message.results.watches &&
                      message.results.watches.length > 0 && (
                        <div className="mt-3 space-y-2">
                          <div className="flex items-center justify-between">
                            <p className="text-xs font-semibold text-primary-700">
                              ✨ {message.results.total} Artikel gefunden
                            </p>
                            {message.filters && Object.keys(message.filters).length > 0 && (
                              <button
                                onClick={() => handleApplyFilters(message.filters)}
                                className="text-xs text-primary-600 hover:text-primary-700 hover:underline"
                              >
                                Filter anwenden →
                              </button>
                            )}
                          </div>
                          <div className="max-h-[300px] space-y-2 overflow-y-auto">
                            {message.results.watches.slice(0, 5).map((watch: any) => (
                              <div
                                key={watch.id}
                                onClick={() => {
                                  router.push(`/watches/${watch.id}`)
                                  setIsOpen(false)
                                }}
                                className="group cursor-pointer rounded-lg border border-gray-200 bg-white p-2 transition-all hover:scale-[1.02] hover:border-primary-400 hover:shadow-md"
                              >
                                <div className="flex gap-2">
                                  {watch.images && watch.images[0] ? (
                                    <img
                                      src={watch.images[0]}
                                      alt={watch.title}
                                      className="h-16 w-16 rounded object-cover"
                                    />
                                  ) : (
                                    <div className="flex h-16 w-16 items-center justify-center rounded bg-gray-100">
                                      <Package className="h-6 w-6 text-gray-400" />
                                    </div>
                                  )}
                                  <div className="flex-1">
                                    <p className="line-clamp-2 text-xs font-semibold text-gray-900 group-hover:text-primary-700">
                                      {watch.title}
                                    </p>
                                    <div className="mt-1 flex items-center gap-2">
                                      <p className="text-xs font-bold text-primary-600">
                                        CHF {watch.price?.toLocaleString()}
                                      </p>
                                      {watch.isAuction && (
                                        <span className="rounded bg-orange-100 px-1.5 py-0.5 text-[10px] font-semibold text-orange-700">
                                          Auktion
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                          {message.results.total > 5 && (
                            <button
                              onClick={() => handleApplyFilters(message.filters)}
                              className="mt-2 w-full rounded-lg bg-primary-600 px-3 py-2 text-xs font-semibold text-white transition-all hover:bg-primary-700"
                            >
                              Alle {message.results.total} Artikel anzeigen →
                            </button>
                          )}
                        </div>
                      )}

                    {/* Zeige wenn keine Ergebnisse gefunden */}
                    {message.results &&
                      message.results.total === 0 &&
                      message.filters &&
                      Object.keys(message.filters).length > 0 && (
                        <div className="mt-3 rounded-lg bg-yellow-50 p-2">
                          <p className="text-xs text-yellow-800">
                            ⚠️ Keine Artikel gefunden. Versuche andere Suchbegriffe oder entferne
                            Filter.
                          </p>
                        </div>
                      )}

                    {/* Zeige Klärungsfrage wenn nötig */}
                    {message.needsClarification && message.clarificationQuestion && (
                      <div className="mt-2 rounded-lg bg-primary-50 p-2">
                        <p className="text-xs font-semibold text-primary-900">
                          💡 {message.clarificationQuestion}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {loading && (
              <div className="mb-4 flex justify-start">
                <div className="flex gap-2">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100">
                    <Bot className="h-4 w-4 text-gray-600" />
                  </div>
                  <div className="rounded-2xl bg-gray-100 px-4 py-2">
                    <Loader2 className="h-4 w-4 animate-spin text-gray-600" />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleSend} className="border-t border-gray-200 p-4">
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Beschreibe, wonach du suchst..."
                className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="rounded-lg bg-primary-600 px-4 py-2 text-white transition-all hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  )
}
