'use client'

import { ImagePlus, Loader2, Lock, MessageCircle, Paperclip, Send, Shield, X } from 'lucide-react'
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

interface DisputeChatProps {
  purchaseId: string
  disputeStatus: string
  userRole: 'buyer' | 'seller'
}

export function DisputeChat({ purchaseId, disputeStatus, userRole }: DisputeChatProps) {
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [message, setMessage] = useState('')
  const [attachments, setAttachments] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const isDisputeClosed = disputeStatus === 'resolved' || disputeStatus === 'closed' || disputeStatus === 'rejected'

  useEffect(() => {
    loadComments()
    // Poll for new comments every 30 seconds
    const interval = setInterval(loadComments, 30000)
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
    if (isDisputeClosed) {
      toast.error('Der Dispute ist bereits geschlossen')
      return
    }

    setSending(true)
    try {
      const res = await fetch(`/api/purchases/${purchaseId}/dispute/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: message.trim(),
          attachments: attachments.length > 0 ? attachments : undefined,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        setComments(prev => [...prev, data.comment])
        setMessage('')
        setAttachments([])
        toast.success('Nachricht gesendet')
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
        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
          toast.error(`${file.name} ist zu gross (max. 5MB)`)
          continue
        }

        // Upload to blob storage
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
      // Reset file input
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
          Helvenda Support
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

  const isOwnMessage = (comment: Comment) => {
    return comment.userRole === userRole
  }

  if (loading) {
    return (
      <div className="rounded-lg bg-white p-6 shadow">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-[600px] flex-col rounded-lg bg-white shadow">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
        <div className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5 text-gray-600" />
          <h2 className="text-lg font-semibold text-gray-900">Kommunikation</h2>
        </div>
        {isDisputeClosed && (
          <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-600">
            <Lock className="h-4 w-4" />
            Geschlossen
          </span>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        {comments.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-gray-500">
            <MessageCircle className="mb-2 h-12 w-12 text-gray-300" />
            <p>Noch keine Nachrichten</p>
            <p className="text-sm">Beginnen Sie die Kommunikation mit der anderen Partei</p>
          </div>
        ) : (
          <div className="space-y-4">
            {comments.map(comment => (
              <div
                key={comment.id}
                className={`flex ${isOwnMessage(comment) ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[75%] rounded-lg p-4 ${
                    comment.user.isAdmin
                      ? 'border-2 border-purple-200 bg-purple-50'
                      : isOwnMessage(comment)
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  {/* Header */}
                  <div className="mb-2 flex items-center gap-2">
                    <span
                      className={`text-sm font-medium ${
                        isOwnMessage(comment) && !comment.user.isAdmin ? 'text-primary-100' : ''
                      }`}
                    >
                      {comment.user.name}
                    </span>
                    {getRoleBadge(comment.userRole, comment.user.isAdmin)}
                  </div>

                  {/* Content */}
                  <p
                    className={`whitespace-pre-wrap ${
                      isOwnMessage(comment) && !comment.user.isAdmin ? 'text-white' : 'text-gray-800'
                    }`}
                  >
                    {comment.content}
                  </p>

                  {/* Attachments */}
                  {comment.attachments && comment.attachments.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {comment.attachments.map((url, idx) => (
                        <a
                          key={idx}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`inline-flex items-center gap-1 rounded px-2 py-1 text-xs ${
                            isOwnMessage(comment) && !comment.user.isAdmin
                              ? 'bg-primary-500 text-white hover:bg-primary-400'
                              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                          }`}
                        >
                          <Paperclip className="h-3 w-3" />
                          Anhang {idx + 1}
                        </a>
                      ))}
                    </div>
                  )}

                  {/* Timestamp */}
                  <div
                    className={`mt-2 text-xs ${
                      isOwnMessage(comment) && !comment.user.isAdmin
                        ? 'text-primary-200'
                        : 'text-gray-500'
                    }`}
                  >
                    {new Date(comment.createdAt).toLocaleString('de-CH', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Attachments Preview */}
      {attachments.length > 0 && (
        <div className="border-t border-gray-200 px-4 py-2">
          <div className="flex flex-wrap gap-2">
            {attachments.map((url, idx) => (
              <div
                key={idx}
                className="group relative flex items-center gap-2 rounded-lg bg-gray-100 px-3 py-2"
              >
                <Paperclip className="h-4 w-4 text-gray-500" />
                <span className="max-w-[150px] truncate text-sm text-gray-700">
                  Anhang {idx + 1}
                </span>
                <button
                  onClick={() => removeAttachment(idx)}
                  className="ml-1 rounded-full p-0.5 text-gray-400 hover:bg-gray-200 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Input Area */}
      {!isDisputeClosed ? (
        <div className="border-t border-gray-200 p-4">
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <textarea
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder="Schreiben Sie eine Nachricht..."
                rows={2}
                className="w-full resize-none rounded-lg border border-gray-300 px-4 py-3 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
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
                className="rounded-lg bg-primary-600 p-3 text-white transition-colors hover:bg-primary-700 disabled:opacity-50"
              >
                {sending ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Send className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>
          <p className="mt-2 text-xs text-gray-500">
            Drücken Sie Enter zum Senden, Shift+Enter für einen Zeilenumbruch
          </p>
        </div>
      ) : (
        <div className="border-t border-gray-200 p-4">
          <div className="rounded-lg bg-gray-100 p-4 text-center text-gray-600">
            <Lock className="mx-auto mb-2 h-5 w-5" />
            <p className="text-sm">
              Dieser Dispute wurde geschlossen. Keine weiteren Nachrichten möglich.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
