'use client'

import { UserName } from '@/components/ui/UserName'
import { useLanguage } from '@/contexts/LanguageContext'
import { AlertCircle, CheckCircle, Globe, Lock, MessageCircle, Send } from 'lucide-react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { useEffect, useState } from 'react'

interface Question {
  id: string
  question: string
  answer: string | null
  isPublic: boolean
  createdAt: string
  answeredAt: string | null
  user: {
    id: string
    name: string | null
    nickname: string | null
    email: string | null
  }
}

interface ProductQuestionsProps {
  watchId: string
  sellerId: string
}

export function ProductQuestions({ watchId, sellerId }: ProductQuestionsProps) {
  const { data: session } = useSession()
  const { t } = useLanguage()
  const [questions, setQuestions] = useState<Question[]>([])
  const [questionText, setQuestionText] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [answerText, setAnswerText] = useState<{ [key: string]: string }>({})
  const [answerVisibility, setAnswerVisibility] = useState<{ [key: string]: boolean }>({})

  const isSeller = (session?.user as { id?: string })?.id === sellerId

  // Fragen laden
  const loadQuestions = async () => {
    try {
      const res = await fetch(`/api/questions?watchId=${watchId}`)
      if (res.ok) {
        const data = await res.json()
        setQuestions(data.questions)
      }
    } catch (error) {
      console.error('Fehler beim Laden der Fragen:', error)
    }
  }

  useEffect(() => {
    loadQuestions()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchId])

  // Frage stellen
  const handleSubmitQuestion = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!(session?.user as { id?: string })?.id) {
      setError('Bitte melden Sie sich an, um Fragen zu stellen.')
      return
    }

    if (!questionText.trim()) {
      setError('Bitte geben Sie eine Frage ein.')
      return
    }

    if (questionText.length > 800) {
      setError('Die Frage darf maximal 800 Zeichen lang sein.')
      return
    }

    setIsSubmitting(true)
    setError('')
    setSuccess('')

    try {
      const res = await fetch('/api/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          watchId: watchId,
          question: questionText,
        }),
      })

      if (res.ok) {
        setSuccess('Frage erfolgreich gesendet!')
        setQuestionText('')
        loadQuestions()
      } else {
        const data = await res.json()
        setError(data.error || 'Fehler beim Senden der Frage')
      }
    } catch (error) {
      console.error('Fehler:', error)
      setError('Ein Fehler ist aufgetreten')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Antwort senden (nur Verkäufer)
  const handleSubmitAnswer = async (questionId: string) => {
    const answer = answerText[questionId]
    const isPublic = answerVisibility[questionId] !== false // Default: öffentlich

    if (!answer?.trim()) {
      return
    }

    try {
      const res = await fetch(`/api/questions/${questionId}/answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          answer: answer,
          isPublic: isPublic,
        }),
      })

      if (res.ok) {
        setAnswerText(prev => ({ ...prev, [questionId]: '' }))
        setAnswerVisibility(prev => ({ ...prev, [questionId]: true }))
        loadQuestions()
      } else {
        const data = await res.json()
        alert(data.error || 'Fehler beim Senden der Antwort')
      }
    } catch (error) {
      console.error('Fehler:', error)
      alert('Ein Fehler ist aufgetreten')
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('de-CH', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date)
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6">
      {/* Header */}
      <div className="mb-6 flex items-center gap-2">
        <MessageCircle className="h-5 w-5 text-primary-600" />
        <h3 className="text-lg font-bold text-gray-900">Fragen und Antworten</h3>
        {questions.length > 0 && (
          <span className="ml-auto text-sm text-gray-600">
            {questions.length} {questions.length === 1 ? 'Frage' : 'Fragen'}
          </span>
        )}
      </div>

      {/* Frage-Formular */}
      {!isSeller && (
        <div className="mb-6 rounded-lg bg-gray-50 p-4">
          <form onSubmit={handleSubmitQuestion}>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Eine Frage stellen
            </label>
            <textarea
              value={questionText}
              onChange={e => setQuestionText(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-primary-500 focus:ring-2 focus:ring-primary-500"
              placeholder="Stellen Sie dem Verkäufer eine Frage zu diesem Artikel..."
              rows={3}
              maxLength={800}
              disabled={!(session?.user as { id?: string })?.id}
            />
            <div className="mt-2 flex items-center justify-between">
              <span className="text-xs text-gray-500">{questionText.length}/800 Zeichen</span>
              {!(session?.user as { id?: string })?.id && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <AlertCircle className="h-4 w-4" />
                  <span>
                    <Link
                      href="/login"
                      className="font-medium text-primary-600 hover:text-primary-700"
                    >
                      Anmelden
                    </Link>
                    , um Fragen zu stellen
                  </span>
                </div>
              )}
            </div>

            {error && (
              <div className="mt-3 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3">
                <AlertCircle className="h-4 w-4 flex-shrink-0 text-red-600" />
                <span className="text-sm text-red-800">{error}</span>
              </div>
            )}

            {success && (
              <div className="mt-3 flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 p-3">
                <CheckCircle className="h-4 w-4 flex-shrink-0 text-green-600" />
                <span className="text-sm text-green-800">{success}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={
                !(session?.user as { id?: string })?.id || !questionText.trim() || isSubmitting
              }
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-primary-600 px-6 py-2 font-medium text-white transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:bg-gray-300 sm:w-auto"
            >
              <Send className="h-4 w-4" />
              {isSubmitting ? 'Wird gesendet...' : 'Frage senden'}
            </button>
          </form>
        </div>
      )}

      {/* Fragen-Liste */}
      <div className="space-y-4">
        {questions.length === 0 ? (
          <div className="py-8 text-center text-gray-500">
            <MessageCircle className="mx-auto mb-3 h-12 w-12 text-gray-300" />
            <p>Noch keine Fragen gestellt.</p>
            {!isSeller && (
              <p className="mt-1 text-sm">Seien Sie der Erste und stellen Sie eine Frage!</p>
            )}
          </div>
        ) : (
          questions.map(q => {
            const isOwnQuestion = q.user.id === (session?.user as { id?: string })?.id
            const canAnswer = isSeller && !q.answer

            return (
              <div key={q.id} className="rounded-lg border border-gray-200 p-4">
                {/* Frage */}
                <div className="mb-3 flex items-start gap-3">
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary-100">
                    <span className="text-sm font-semibold text-primary-700">
                      {(q.user.nickname || q.user.name || 'U').charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1">
                    <div className="mb-1 flex items-center gap-2">
                      <UserName
                        userId={q.user.id}
                        userName={q.user.nickname || q.user.name || 'Benutzer'}
                        showBadges={true}
                        badgeSize="sm"
                        className="font-medium text-gray-900"
                      />
                      <span className="text-xs text-gray-500">{formatDate(q.createdAt)}</span>
                      {isOwnQuestion && (
                        <span className="rounded bg-blue-100 px-2 py-0.5 text-xs text-blue-700">
                          Ihre Frage
                        </span>
                      )}
                    </div>
                    <p className="text-gray-700">{q.question}</p>
                  </div>
                </div>

                {/* Antwort (falls vorhanden) */}
                {q.answer && (
                  <div className="ml-11 rounded-r-lg border-l-2 border-primary-200 bg-primary-50 p-3 pl-4">
                    <div className="mb-2 flex items-center gap-2">
                      <span className="text-sm font-semibold text-primary-700">
                        Verkäufer-Antwort
                      </span>
                      {!q.isPublic && (
                        <div className="flex items-center gap-1 text-xs text-gray-600">
                          <Lock className="h-3 w-3" />
                          <span>Nur für Sie sichtbar</span>
                        </div>
                      )}
                      {q.isPublic && (
                        <div className="flex items-center gap-1 text-xs text-gray-600">
                          <Globe className="h-3 w-3" />
                          <span>Öffentlich</span>
                        </div>
                      )}
                      {q.answeredAt && (
                        <span className="ml-auto text-xs text-gray-500">
                          {formatDate(q.answeredAt)}
                        </span>
                      )}
                    </div>
                    <p className="text-gray-700">{q.answer}</p>
                  </div>
                )}

                {/* Antwort-Formular (nur für Verkäufer bei unbeantworteten Fragen) */}
                {canAnswer && (
                  <div className="ml-11 mt-3 rounded-lg border border-yellow-200 bg-yellow-50 p-3">
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Ihre Antwort
                    </label>
                    <textarea
                      value={answerText[q.id] || ''}
                      onChange={e => setAnswerText(prev => ({ ...prev, [q.id]: e.target.value }))}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-primary-500"
                      placeholder="Beantworten Sie die Frage..."
                      rows={3}
                      maxLength={800}
                    />

                    {/* Sichtbarkeit wählen */}
                    <div className="mt-3 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <label className="flex cursor-pointer items-center gap-2">
                          <input
                            type="radio"
                            name={`visibility-${q.id}`}
                            checked={answerVisibility[q.id] !== false}
                            onChange={() =>
                              setAnswerVisibility(prev => ({ ...prev, [q.id]: true }))
                            }
                            className="h-4 w-4 text-primary-600"
                          />
                          <Globe className="h-4 w-4 text-gray-600" />
                          <span className="text-sm text-gray-700">
                            Öffentlich (für alle sichtbar)
                          </span>
                        </label>
                        <label className="flex cursor-pointer items-center gap-2">
                          <input
                            type="radio"
                            name={`visibility-${q.id}`}
                            checked={answerVisibility[q.id] === false}
                            onChange={() =>
                              setAnswerVisibility(prev => ({ ...prev, [q.id]: false }))
                            }
                            className="h-4 w-4 text-primary-600"
                          />
                          <Lock className="h-4 w-4 text-gray-600" />
                          <span className="text-sm text-gray-700">
                            Privat (nur für Fragesteller)
                          </span>
                        </label>
                      </div>

                      <button
                        onClick={() => handleSubmitAnswer(q.id)}
                        disabled={!answerText[q.id]?.trim()}
                        className="flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:bg-gray-300"
                      >
                        <Send className="h-4 w-4" />
                        Antwort senden
                      </button>
                    </div>

                    <p className="mt-2 text-xs text-gray-600">
                      {answerVisibility[q.id] === false
                        ? '🔒 Diese Antwort wird nur für den Fragesteller sichtbar sein.'
                        : '🌍 Diese Antwort wird für alle Besucher sichtbar sein.'}
                    </p>
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
