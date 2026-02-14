'use client'

import { Footer } from '@/components/layout/Footer'
import { Header } from '@/components/layout/Header'
import { useLanguage } from '@/contexts/LanguageContext'
import { ArrowLeft, Home, Search, SearchX, TrendingUp } from 'lucide-react'
import Link from 'next/link'

export default function NotFound() {
  const { t } = useLanguage()
  const e = t.errorPages.notFound

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <Header />
      <main id="main-content" className="flex flex-1 items-center justify-center px-4 py-16" tabIndex={-1}>
        <div className="w-full max-w-2xl text-center">
          {/* Animated Illustration */}
          <div className="mb-8 flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 animate-pulse rounded-full bg-primary-100 opacity-50" />
              <div className="relative rounded-full bg-gradient-to-br from-primary-50 to-primary-100 p-8">
                <SearchX className="h-32 w-32 text-primary-400" />
              </div>
            </div>
          </div>

          {/* Error Code */}
          <div className="mb-4">
            <span className="text-6xl font-bold text-primary-600">{e.code}</span>
          </div>

          {/* Heading */}
          <h1 className="mb-4 text-3xl font-bold text-gray-900 md:text-4xl">
            {e.title}
          </h1>

          {/* Description */}
          <p className="mb-8 text-lg text-gray-600">
            {e.description}
          </p>

          {/* Helpful Links */}
          <div className="mb-8 rounded-lg bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500">
              {e.popularPages}
            </h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Link
                href="/search"
                className="flex items-center gap-2 rounded-lg border border-gray-200 p-3 text-left transition-colors hover:border-primary-300 hover:bg-primary-50"
              >
                <Search className="h-5 w-5 text-primary-600" />
                <div>
                  <div className="font-medium text-gray-900">{e.searchButton}</div>
                </div>
              </Link>
              <Link
                href="/watches"
                className="flex items-center gap-2 rounded-lg border border-gray-200 p-3 text-left transition-colors hover:border-primary-300 hover:bg-primary-50"
              >
                <TrendingUp className="h-5 w-5 text-primary-600" />
                <div>
                  <div className="font-medium text-gray-900">{t.header.auctions}</div>
                </div>
              </Link>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-primary-600 px-6 py-3 font-bold text-white transition-all hover:bg-primary-700"
            >
              <Home className="h-4 w-4" />
              {e.homeButton}
            </Link>
            <Link
              href="/search"
              className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-primary-500 bg-white px-6 py-3 font-bold text-primary-600 transition-all hover:bg-primary-50"
            >
              <Search className="h-4 w-4" />
              {e.searchButton}
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
