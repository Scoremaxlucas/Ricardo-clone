'use client'

import React from 'react'
import { Footer } from '@/components/layout/Footer'
import { Header } from '@/components/layout/Header'
import { Button } from '@/components/ui/Button'
import { useLanguage } from '@/contexts/LanguageContext'
import { AlertTriangle, ArrowLeft, HelpCircle, Home, Mail, RefreshCw } from 'lucide-react'
import Link from 'next/link'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const { t } = useLanguage()
  const e = t.errorPages.error

  React.useEffect(() => {
    console.error('Error:', error)
  }, [error])

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <Header />
      <main id="main-content" className="flex flex-1 items-center justify-center px-4 py-16" tabIndex={-1}>
        <div className="w-full max-w-2xl text-center">
          {/* Animated Illustration */}
          <div className="mb-8 flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 animate-pulse rounded-full bg-orange-100 opacity-50" />
              <div className="relative rounded-full bg-gradient-to-br from-orange-50 to-orange-100 p-8">
                <AlertTriangle className="h-32 w-32 text-orange-400" />
              </div>
            </div>
          </div>

          {/* Heading */}
          <h1 className="mb-4 text-3xl font-bold text-gray-900 md:text-4xl">
            {e.title}
          </h1>

          {/* Error Message */}
          <div className="mb-6 rounded-lg border border-orange-200 bg-orange-50 p-4 text-left">
            <p className="text-sm font-medium text-orange-900">
              {error?.message || e.description}
            </p>
            {error?.digest && (
              <p className="mt-2 text-xs text-orange-700">
                {e.errorId}: {error.digest}
              </p>
            )}
          </div>

          {/* Help Text */}
          <p className="mb-8 text-lg text-gray-600">
            {e.sorry}
          </p>

          {/* Help Section */}
          <div className="mb-8 rounded-lg bg-white p-6 shadow-sm">
            <h2 className="mb-4 flex items-center justify-center gap-2 text-sm font-semibold uppercase tracking-wide text-gray-500">
              <HelpCircle className="h-4 w-4" />
              {e.needHelp}
            </h2>
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Link
                href="/search"
                className="flex items-center justify-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-700 transition-colors hover:border-primary-300 hover:bg-primary-50"
              >
                {t.errorPages.notFound.searchButton}
              </Link>
              <a
                href="mailto:support@helvenda.ch"
                className="flex items-center justify-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-700 transition-colors hover:border-primary-300 hover:bg-primary-50"
              >
                <Mail className="h-4 w-4" />
                {e.contactSupport}
              </a>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button
              onClick={() => reset()}
              className="gap-2 rounded-full px-6 py-3 font-bold"
            >
              <RefreshCw className="h-4 w-4" />
              {e.retryButton}
            </Button>
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-primary-500 bg-white px-6 py-3 font-bold text-primary-600 transition-all hover:bg-primary-50"
            >
              <Home className="h-4 w-4" />
              {e.homeButton}
            </Link>
            <button
              onClick={() => window.history.back()}
              className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-gray-300 bg-white px-6 py-3 font-medium text-gray-700 transition-all hover:border-gray-400 hover:bg-gray-50"
            >
              <ArrowLeft className="h-4 w-4" />
              {e.backButton}
            </button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
