'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { MessageCircle, Send, Lock, Globe, AlertCircle, CheckCircle } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'
import Link from 'next/link'

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

  const isSeller = session?.user?.id === sellerId

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
    
    if (!session?.user?.id) {
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
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      {/* Header */}
      <div className="flex items-center gap-2 mb-6">
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
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <form onSubmit={handleSubmitQuestion}>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Eine Frage stellen
            </label>
            <textarea
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="Stellen Sie dem Verkäufer eine Frage zu diesem Artikel..."
              rows={3}
              maxLength={800}
              disabled={!session?.user?.id}
            />
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs text-gray-500">
                {questionText.length}/800 Zeichen
              </span>
              {!session?.user?.id && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <AlertCircle className="h-4 w-4" />
                  <span>
                    <Link href="/login" className="text-primary-600 hover:text-primary-700 font-medium">
                      Anmelden
                    </Link>, um Fragen zu stellen
                  </span>
                </div>
              )}
            </div>
            
            {error && (
              <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
                <span className="text-sm text-red-800">{error}</span>
              </div>
            )}
            
            {success && (
              <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                <span className="text-sm text-green-800">{success}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={!session?.user?.id || !questionText.trim() || isSubmitting}
              className="mt-3 w-full sm:w-auto px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 font-medium"
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
          <div className="text-center py-8 text-gray-500">
            <MessageCircle className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p>Noch keine Fragen gestellt.</p>
            {!isSeller && (
              <p className="text-sm mt-1">Seien Sie der Erste und stellen Sie eine Frage!</p>
            )}
          </div>
        ) : (
          questions.map((q) => {
            const isOwnQuestion = q.user.id === session?.user?.id
            const canAnswer = isSeller && !q.answer
            
            return (
              <div key={q.id} className="border border-gray-200 rounded-lg p-4">
                {/* Frage */}
                <div className="flex items-start gap-3 mb-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
                    <span className="text-sm font-semibold text-primary-700">
                      {(q.user.nickname || q.user.name || 'U').charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-gray-900">
                        {q.user.nickname || q.user.name || 'Benutzer'}
                      </span>
                      <span className="text-xs text-gray-500">
                        {formatDate(q.createdAt)}
                      </span>
                      {isOwnQuestion && (
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                          Ihre Frage
                        </span>
                      )}
                    </div>
                    <p className="text-gray-700">{q.question}</p>
                  </div>
                </div>

                {/* Antwort (falls vorhanden) */}
                {q.answer && (
                  <div className="ml-11 pl-4 border-l-2 border-primary-200 bg-primary-50 rounded-r-lg p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-semibold text-primary-700">Verkäufer-Antwort</span>
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
                  <div className="ml-11 mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ihre Antwort
                    </label>
                    <textarea
                      value={answerText[q.id] || ''}
                      onChange={(e) => setAnswerText(prev => ({ ...prev, [q.id]: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      placeholder="Beantworten Sie die Frage..."
                      rows={3}
                      maxLength={800}
                    />
                    
                    {/* Sichtbarkeit wählen */}
                    <div className="mt-3 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name={`visibility-${q.id}`}
                            checked={answerVisibility[q.id] !== false}
                            onChange={() => setAnswerVisibility(prev => ({ ...prev, [q.id]: true }))}
                            className="w-4 h-4 text-primary-600"
                          />
                          <Globe className="h-4 w-4 text-gray-600" />
                          <span className="text-sm text-gray-700">Öffentlich (für alle sichtbar)</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name={`visibility-${q.id}`}
                            checked={answerVisibility[q.id] === false}
                            onChange={() => setAnswerVisibility(prev => ({ ...prev, [q.id]: false }))}
                            className="w-4 h-4 text-primary-600"
                          />
                          <Lock className="h-4 w-4 text-gray-600" />
                          <span className="text-sm text-gray-700">Privat (nur für Fragesteller)</span>
                        </label>
                      </div>
                      
                      <button
                        onClick={() => handleSubmitAnswer(q.id)}
                        disabled={!answerText[q.id]?.trim()}
                        className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2 text-sm font-medium"
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

