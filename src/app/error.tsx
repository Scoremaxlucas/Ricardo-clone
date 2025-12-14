'use client'

import React from 'react'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import Link from 'next/link'

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
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4">
      <div className="text-center">
        <AlertTriangle className="mx-auto mb-6 h-24 w-24 text-orange-400" />
        <h1 className="mb-4 text-3xl font-bold text-gray-900">
          Ein Fehler ist aufgetreten
        </h1>
        <p className="mb-8 max-w-md text-gray-600">
          {error?.message || 'Ein unerwarteter Fehler ist aufgetreten. Bitte versuchen Sie es erneut.'}
        </p>
        <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Button onClick={() => reset()} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Erneut versuchen
          </Button>
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 rounded-[50px] border-2 border-primary-500 bg-white px-6 py-3 font-bold text-primary-600 transition-all duration-300 hover:-translate-y-0.5 hover:bg-primary-500 hover:text-white active:scale-[0.98]"
          >
            <Home className="h-4 w-4" />
            Zur Startseite
          </Link>
        </div>
      </div>
    </div>
  )
}
