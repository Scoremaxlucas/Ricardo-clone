'use client'

/**
 * HeroSearch - Client Component nur für die Suchfunktion
 * 
 * Separiert von HeroServer für optimales Code-Splitting:
 * - Nur JavaScript für interaktive Suche
 * - Hero-Text bleibt server-gerendert
 */

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { SearchAutocomplete } from './SearchAutocomplete'

interface HeroSearchProps {
  placeholder?: string
}

export function HeroSearch({ placeholder }: HeroSearchProps) {
  const { data: session } = useSession()
  const router = useRouter()

  // Handle Search with Analytics Tracking
  // PERFORMANCE OPTIMIERT: Navigation SOFORT, Analytics im Hintergrund
  const handleSearch = (query: string) => {
    if (!query.trim()) return

    // Navigate SOFORT zu Search Results
    router.push(`/search?q=${encodeURIComponent(query)}`)

    // Track search query ASYNC im Hintergrund (non-blocking)
    const trackSearch = async () => {
      try {
        const searchResponse = await fetch(
          `/api/watches/search?q=${encodeURIComponent(query)}&limit=1`
        )
        const searchData = await searchResponse.json()
        const resultCount = searchData?.watches?.length || 0

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
        // Silent fail
      }
    }

    trackSearch()
  }

  return (
    <SearchAutocomplete
      onSearch={handleSearch}
      placeholder={placeholder}
      className="mx-auto"
    />
  )
}
