'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { Star, Check, X, Minus } from 'lucide-react'

export default function ReviewPage() {
  const { data: session } = useSession()
  const [rating, setRating] = useState<'positive' | 'neutral' | 'negative' | ''>('')
  const [comment, setComment] = useState('')
  const [reviewedUserId, setReviewedUserId] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!rating || !reviewedUserId) return

    setSubmitting(true)
    try {
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rating,
          comment,
          reviewedUserId,
        }),
      })

      if (response.ok) {
        alert('Bewertung erfolgreich abgegeben!')
        setRating('')
        setComment('')
        setReviewedUserId('')
      }
    } catch (error) {
      console.error('Error submitting review:', error)
      alert('Fehler beim Absenden der Bewertung')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Bewertung abgeben
        </h1>

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-8 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Bewertungstyp *
            </label>
            <div className="grid grid-cols-3 gap-4">
              <button
                type="button"
                onClick={() => setRating('positive')}
                className={`p-4 border-2 rounded-lg transition-colors ${
                  rating === 'positive'
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 hover:border-green-300'
                }`}
              >
                <Check className="h-8 w-8 mx-auto mb-2 text-green-600" />
                <div className="font-medium text-gray-900">Positiv</div>
              </button>

              <button
                type="button"
                onClick={() => setRating('neutral')}
                className={`p-4 border-2 rounded-lg transition-colors ${
                  rating === 'neutral'
                    ? 'border-gray-500 bg-gray-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <Minus className="h-8 w-8 mx-auto mb-2 text-gray-600" />
                <div className="font-medium text-gray-900">Neutral</div>
              </button>

              <button
                type="button"
                onClick={() => setRating('negative')}
                className={`p-4 border-2 rounded-lg transition-colors ${
                  rating === 'negative'
                    ? 'border-red-500 bg-red-50'
                    : 'border-gray-200 hover:border-red-300'
                }`}
              >
                <X className="h-8 w-8 mx-auto mb-2 text-red-600" />
                <div className="font-medium text-gray-900">Negativ</div>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Benutzer-ID
            </label>
            <input
              type="text"
              value={reviewedUserId}
              onChange={(e) => setReviewedUserId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-gray-900"
              placeholder="Benutzer-ID eingeben"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Kommentar (Optional)
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-gray-900"
              placeholder="Schreiben Sie einen Kommentar zur Bewertung..."
            />
          </div>

          <button
            type="submit"
            disabled={!rating || !reviewedUserId || submitting}
            className="w-full bg-primary-600 text-white py-3 rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {submitting ? 'Wird gesendet...' : 'Bewertung absenden'}
          </button>
        </form>
      </div>
    </div>
  )
}
