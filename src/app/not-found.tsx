'use client'

import Link from 'next/link'
import { SearchX, Home, Search, ArrowLeft, TrendingUp } from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <Header />
      <main className="flex flex-1 items-center justify-center px-4 py-16">
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
            <span className="text-6xl font-bold text-primary-600">404</span>
          </div>

          {/* Heading */}
          <h1 className="mb-4 text-3xl font-bold text-gray-900 md:text-4xl">
            Seite nicht gefunden
          </h1>

          {/* Description */}
          <p className="mb-8 text-lg text-gray-600">
            Die angeforderte Seite existiert nicht oder wurde verschoben.
            <br />
            Möglicherweise wurde der Link falsch eingegeben oder die Seite wurde gelöscht.
          </p>

          {/* Helpful Links */}
          <div className="mb-8 rounded-lg bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500">
              Beliebte Seiten
            </h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Link
                href="/search"
                className="flex items-center gap-2 rounded-lg border border-gray-200 p-3 text-left transition-colors hover:border-primary-300 hover:bg-primary-50"
              >
                <Search className="h-5 w-5 text-primary-600" />
                <div>
                  <div className="font-medium text-gray-900">Artikel suchen</div>
                  <div className="text-sm text-gray-500">Durchsuchen Sie unsere Angebote</div>
                </div>
              </Link>
              <Link
                href="/watches"
                className="flex items-center gap-2 rounded-lg border border-gray-200 p-3 text-left transition-colors hover:border-primary-300 hover:bg-primary-50"
              >
                <TrendingUp className="h-5 w-5 text-primary-600" />
                <div>
                  <div className="font-medium text-gray-900">Alle Artikel</div>
                  <div className="text-sm text-gray-500">Alle verfügbaren Angebote</div>
                </div>
              </Link>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 rounded-[50px] px-6 py-3 font-bold text-white transition-all duration-300 hover:-translate-y-0.5 hover:scale-[1.02] active:translate-y-0 active:scale-[0.98]"
              style={{
                background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
                boxShadow: '0px 4px 20px rgba(249, 115, 22, 0.3)',
              }}
            >
              <Home className="h-4 w-4" />
              Zur Startseite
            </Link>
            <Link
              href="/search"
              className="inline-flex items-center justify-center gap-2 rounded-[50px] border-2 border-primary-500 bg-white px-6 py-3 font-bold text-primary-600 transition-all duration-300 hover:-translate-y-0.5 hover:bg-primary-500 hover:text-white active:scale-[0.98]"
            >
              <Search className="h-4 w-4" />
              Artikel suchen
            </Link>
            <button
              onClick={() => window.history.back()}
              className="inline-flex items-center justify-center gap-2 rounded-[50px] border-2 border-gray-300 bg-white px-6 py-3 font-medium text-gray-700 transition-all duration-300 hover:border-gray-400 hover:bg-gray-50 active:scale-[0.98]"
            >
              <ArrowLeft className="h-4 w-4" />
              Zurück
            </button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
