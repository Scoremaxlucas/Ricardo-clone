'use client'

import { ImagePlus, Loader2, Lock, Paperclip, Send, Shield, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { toast } from 'react-hot-toast'

interface Comment {
  id: string
  type: string
  content: string
  userRole: 'buyer' | 'seller' | 'admin'
  attachments: string[]
  isInternal: boolean
  createdAt: string
  user: {
    id: string
    name: string
    image?: string
    isAdmin: boolean
  }
}

interface AdminDisputeChatProps {
  purchaseId: string
  disputeStatus: string
}

export function AdminDisputeChat({ purchaseId, disputeStatus }: AdminDisputeChatProps) {
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [message, setMessage] = useState('')
  const [isInternal, setIsInternal] = useState(false)
  const [attachments, setAttachments] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const isDisputeClosed = disputeStatus === 'resolved' || disputeStatus === 'closed' || disputeStatus === 'rejected'

  useEffect(() => {
    loadComments()
    // Poll for new comments every 15 seconds
    const interval = setInterval(loadComments, 15000)
    return () => clearInterval(interval)
  }, [purchaseId])

  useEffect(() => {
    scrollToBottom()
  }, [comments])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const loadComments = async () => {
    try {
      const res = await fetch(`/api/purchases/${purchaseId}/dispute/comments`)
      if (res.ok) {
        const data = await res.json()
        setComments(data.comments || [])
      }
    } catch (error) {
      console.error('Error loading comments:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSend = async () => {
    if (!message.trim() && attachments.length === 0) return

    setSending(true)
    try {
      const res = await fetch(`/api/purchases/${purchaseId}/dispute/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: message.trim(),
          attachments: attachments.length > 0 ? attachments : undefined,
          isInternal,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        setComments(prev => [...prev, data.comment])
        setMessage('')
        setAttachments([])
        toast.success(isInternal ? 'Interne Notiz gespeichert' : 'Nachricht gesendet')
      } else {
        const errorData = await res.json()
        toast.error(errorData.message || 'Fehler beim Senden')
      }
    } catch (error) {
      console.error('Error sending message:', error)
      toast.error('Fehler beim Senden der Nachricht')
    } finally {
      setSending(false)
    }
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setUploading(true)
    try {
      for (const file of Array.from(files)) {
        if (file.size > 5 * 1024 * 1024) {
          toast.error(`${file.name} ist zu gross (max. 5MB)`)
          continue
        }

        const formData = new FormData()
        formData.append('file', file)
        formData.append('folder', 'disputes')

        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        })

        if (res.ok) {
          const data = await res.json()
          setAttachments(prev => [...prev, data.url])
        } else {
          toast.error(`Fehler beim Hochladen von ${file.name}`)
        }
      }
    } catch (error) {
      console.error('Error uploading file:', error)
      toast.error('Fehler beim Hochladen')
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index))
  }

  const getRoleBadge = (role: string, isAdmin: boolean) => {
    if (isAdmin) {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700">
          <Shield className="h-3 w-3" />
          Admin
        </span>
      )
    }
    switch (role) {
      case 'buyer':
        return (
          <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
            Käufer
          </span>
        )
      case 'seller':
        return (
          <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
            Verkäufer
          </span>
        )
      default:
        return null
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    )
  }

  return (
    <div className="flex max-h-[500px] flex-col">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto rounded-lg border border-gray-200 bg-gray-50 p-4">
        {comments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-gray-500">
            <p>Noch keine Kommunikation</p>
          </div>
        ) : (
          <div className="space-y-3">
            {comments.map(comment => (
              <div
                key={comment.id}
                className={`rounded-lg p-3 ${
                  comment.isInternal
                    ? 'border-2 border-dashed border-yellow-300 bg-yellow-50'
                    : comment.user.isAdmin
                      ? 'border border-purple-200 bg-purple-50'
                      : comment.userRole === 'buyer'
                        ? 'border border-blue-200 bg-blue-50'
                        : 'border border-green-200 bg-green-50'
                }`}
              >
                {/* Header */}
                <div className="mb-2 flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-900">{comment.user.name}</span>
                  {getRoleBadge(comment.userRole, comment.user.isAdmin)}
                  {comment.isInternal && (
                    <span className="rounded-full bg-yellow-200 px-2 py-0.5 text-xs font-medium text-yellow-800">
                      🔒 Intern
                    </span>
                  )}
                  <span className="ml-auto text-xs text-gray-500">
                    {new Date(comment.createdAt).toLocaleString('de-CH', {
                      day: '2-digit',
                      month: '2-digit',
                      year: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>

                {/* Content */}
                <p className="whitespace-pre-wrap text-sm text-gray-800">{comment.content}</p>

                {/* Attachments */}
                {comment.attachments && comment.attachments.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {comment.attachments.map((url, idx) => (
                      <a
                        key={idx}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 rounded bg-white px-2 py-1 text-xs text-gray-700 hover:bg-gray-100"
                      >
                        <Paperclip className="h-3 w-3" />
                        Anhang {idx + 1}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Attachments Preview */}
      {attachments.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {attachments.map((url, idx) => (
            <div
              key={idx}
              className="flex items-center gap-2 rounded-lg bg-gray-100 px-3 py-2"
            >
              <Paperclip className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-700">Anhang {idx + 1}</span>
              <button
                onClick={() => removeAttachment(idx)}
                className="ml-1 rounded-full p-0.5 text-gray-400 hover:bg-gray-200 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Input Area */}
      {!isDisputeClosed ? (
        <div className="mt-4 space-y-3">
          {/* Internal Note Toggle */}
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={isInternal}
              onChange={e => setIsInternal(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-yellow-600 focus:ring-yellow-500"
            />
            <span className="text-sm text-gray-700">
              🔒 Interne Notiz (nur für Admins sichtbar)
            </span>
          </label>

          <div className="flex items-end gap-2">
            <div className="flex-1">
              <textarea
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder={isInternal ? 'Interne Notiz schreiben...' : 'Nachricht schreiben...'}
                rows={2}
                className={`w-full resize-none rounded-lg border px-4 py-3 text-sm focus:outline-none focus:ring-1 ${
                  isInternal
                    ? 'border-yellow-300 bg-yellow-50 focus:border-yellow-500 focus:ring-yellow-500'
                    : 'border-gray-300 focus:border-primary-500 focus:ring-primary-500'
                }`}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleSend()
                  }
                }}
              />
            </div>
            <div className="flex gap-2">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,.pdf,.doc,.docx"
                onChange={handleFileSelect}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="rounded-lg border border-gray-300 bg-white p-3 text-gray-600 transition-colors hover:bg-gray-50 disabled:opacity-50"
                title="Datei anhängen"
              >
                {uploading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <ImagePlus className="h-5 w-5" />
                )}
              </button>
              <button
                onClick={handleSend}
                disabled={sending || (!message.trim() && attachments.length === 0)}
                className={`rounded-lg p-3 text-white transition-colors disabled:opacity-50 ${
                  isInternal
                    ? 'bg-yellow-600 hover:bg-yellow-700'
                    : 'bg-primary-600 hover:bg-primary-700'
                }`}
              >
                {sending ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Send className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-4 rounded-lg bg-gray-100 p-4 text-center text-gray-600">
          <Lock className="mx-auto mb-2 h-5 w-5" />
          <p className="text-sm">Dispute geschlossen - keine weiteren Nachrichten möglich</p>
        </div>
      )}
    </div>
  )
}
