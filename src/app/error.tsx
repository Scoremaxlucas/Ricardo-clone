'use client'

import React from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  React.useEffect(() => {
    console.error('Error:', error)
  }, [error])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50">
      <div className="text-center">
        <h2 className="mb-2 text-2xl font-bold text-gray-900">Ein Fehler ist aufgetreten</h2>
        <p className="mb-6 text-gray-600">
          {error?.message || 'Ein unerwarteter Fehler ist aufgetreten'}
        </p>
        <button
          onClick={() => reset()}
          className="rounded-md bg-primary-600 px-6 py-3 text-white transition-colors hover:bg-primary-700"
        >
          Erneut versuchen
        </button>
      </div>
    </div>
  )
}
