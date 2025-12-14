'use client'

import { useLanguage } from '@/contexts/LanguageContext'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { SearchAutocomplete } from './SearchAutocomplete'

export function Hero() {
  const { t } = useLanguage()
  const { data: session } = useSession()
  const router = useRouter()

  // Handle Search with Analytics Tracking
  const handleSearch = async (query: string) => {
    if (!query.trim()) return

    // Track search query (async, non-blocking)
    try {
      // Get result count first (simplified - could be improved)
      const searchResponse = await fetch(
        `/api/watches/search?q=${encodeURIComponent(query)}&limit=1`
      )
      const searchData = await searchResponse.json()
      const resultCount = searchData?.watches?.length || 0

      // Track search query
      await fetch('/api/search/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: query.trim(),
          userId: (session?.user as { id?: string })?.id || null,
          resultCount,
        }),
      })
    } catch (error) {
      // Silent fail - analytics should not block search
      console.error('Error tracking search:', error)
    }

    // Navigate to search results
    router.push(`/search?q=${encodeURIComponent(query)}`)
  }

  return (
    <section
      className="relative overflow-hidden text-white"
      style={{
        background: 'linear-gradient(135deg, #0f766e 0%, #14b8a6 50%, #10b981 100%)',
        padding: '80px 0',
      }}
    >
      {/* Subtiles Pattern Overlay */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage:
            'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.3) 1px, transparent 0)',
          backgroundSize: '40px 40px',
        }}
      />

      <div className="relative z-10 mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-8">
        {/* Intelligente Suchleiste - Feature 1 */}
        <div className="animate-fade-in-up mb-12">
          <div className="mx-auto max-w-3xl">
            <h1 className="mb-4 text-center text-3xl font-bold text-white md:text-4xl lg:text-5xl">
              {t.home.hero.title || 'Finden Sie genau das, was Sie suchen'}
            </h1>
            <p className="mb-6 text-center text-lg text-white/90 md:text-xl">
              {t.home.hero.subtitle || 'Schweizer Online-Marktplatz für alle Ihre Bedürfnisse'}
            </p>
            <SearchAutocomplete
              onSearch={handleSearch}
              placeholder={
                t.header.searchPlaceholder || 'Suchen Sie nach Produkten, Marken, Kategorien...'
              }
              className="mx-auto"
            />
          </div>
        </div>

        {/* Verkaufen Sie jetzt Box */}
        <div className="flex justify-center">
          <div className="animate-fade-in-up max-w-md">
            <div className="rounded-2xl border border-white/20 bg-white/10 p-6 shadow-xl backdrop-blur-md">
              <h2 className="mb-3 text-2xl font-bold text-white md:text-3xl">
                {t.home.hero.sellNow}
              </h2>
              <p className="mb-6 text-base leading-relaxed text-white/90">
                {t.home.hero.reachBuyers}
              </p>
              <Link
                href="/sell"
                className="hover:shadow-3xl inline-block rounded-[50px] bg-[#f97316] px-8 py-4 text-lg font-bold text-white shadow-2xl transition-all duration-300 hover:-translate-y-1 hover:scale-105 hover:bg-[#ea580c]"
                style={{
                  boxShadow: '0px 8px 30px rgba(249, 115, 22, 0.4)',
                }}
              >
                {t.home.hero.offerItemNow}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
