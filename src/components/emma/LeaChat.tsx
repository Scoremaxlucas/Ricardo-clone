'use client'

import { useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { MessageCircle, X, Send, Bot, User, Loader2 } from 'lucide-react'
import { toast } from 'react-hot-toast'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  createdAt: string
}

interface EmmaChatProps {
  productId?: string
  className?: string
}

export function EmmaChat({ productId, className = '' }: EmmaChatProps) {
  const { data: session } = useSession()
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [conversationId, setConversationId] = useState<string | null>(null)
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
      setMessages([{
        id: 'welcome',
        role: 'assistant',
        content: 'Hallo! 👋 Ich bin Emma, dein Helvenda-Assistent. Wie kann ich dir helfen?',
        createdAt: new Date().toISOString()
      }])
    }
  }, [isOpen, messages.length])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || loading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      createdAt: new Date().toISOString()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setLoading(true)

    try {
      const response = await fetch('/api/ai/emma/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(productId && { 'x-product-id': productId })
        },
        body: JSON.stringify({
          message: userMessage.content,
          conversationId: conversationId,
          productId: productId
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Fehler beim Senden der Nachricht')
      }

      const data = await response.json()

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.message || data.error || 'Entschuldigung, ich konnte deine Frage nicht beantworten.',
        createdAt: new Date().toISOString()
      }

      setMessages(prev => [...prev, assistantMessage])
      
      if (data.conversationId && !conversationId) {
        setConversationId(data.conversationId)
      }

    } catch (error: any) {
      console.error('Emma Chat Fehler:', error)
      toast.error(error.message || 'Fehler beim Senden der Nachricht')
      
      // Entferne die letzte User-Message bei Fehler
      setMessages(prev => prev.slice(0, -1))
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 z-50 bg-primary-600 hover:bg-primary-700 text-white rounded-full p-4 shadow-lg transition-all duration-200 hover:scale-110 ${className}`}
        aria-label="Emma Chat öffnen"
      >
        <MessageCircle className="w-6 h-6" />
      </button>
    )
  }

  return (
    <div className={`fixed bottom-6 right-6 z-50 w-96 bg-white rounded-lg shadow-2xl flex flex-col h-[600px] ${className}`}>
      {/* Header */}
      <div className="bg-primary-600 text-white p-4 rounded-t-lg flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bot className="w-5 h-5" />
            <div>
              <h3 className="font-semibold">Emma</h3>
              <p className="text-xs text-primary-100">Helvenda Assistentin</p>
            </div>
          </div>
        <button
          onClick={() => setIsOpen(false)}
          className="hover:bg-primary-700 rounded-full p-1 transition-colors"
          aria-label="Chat schließen"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex gap-2 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {message.role === 'assistant' && (
              <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                <Bot className="w-4 h-4 text-primary-600" />
              </div>
            )}
            <div
              className={`max-w-[80%] rounded-lg px-4 py-2 ${
                message.role === 'user'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-900'
              }`}
            >
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
            </div>
            {message.role === 'user' && (
              <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                <User className="w-4 h-4 text-gray-600" />
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div className="flex gap-2 justify-start">
            <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
              <Bot className="w-4 h-4 text-primary-600" />
            </div>
            <div className="bg-gray-100 rounded-lg px-4 py-2">
              <Loader2 className="w-4 h-4 animate-spin text-gray-600" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="border-t p-4">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Schreibe eine Nachricht..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="bg-primary-600 hover:bg-primary-700 text-white rounded-lg px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
        <div className="mt-2 flex items-center justify-between">
          <p className="text-xs text-gray-500">
            Emma kann Fehler machen. Prüfe wichtige Informationen.
          </p>
          <button
            onClick={() => {
              const message = 'Ich benötige menschliche Unterstützung.'
              setInput(message)
              inputRef.current?.focus()
            }}
            className="text-xs text-primary-600 hover:text-primary-700 hover:underline"
          >
            Zu Support →
          </button>
        </div>
      </form>
    </div>
  )
}

