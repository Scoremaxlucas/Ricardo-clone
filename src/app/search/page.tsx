'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'

interface WatchItem {
  id: string
  title: string
  brand: string
  model: string
  price: number
  images: string[]
  createdAt: string
}

export default function SearchPage({ searchParams }: { searchParams: { q?: string } }) {
  const [loading, setLoading] = useState(true)
  const [watches, setWatches] = useState<WatchItem[]>([])
  const query = (searchParams?.q || '').trim()

  useEffect(() => {
    const run = async () => {
      setLoading(true)
      try {
        const url = query ? `/api/watches/search?q=${encodeURIComponent(query)}` : '/api/watches/search'
        const res = await fetch(url)
        const data = await res.json()
        setWatches(Array.isArray(data.watches) ? data.watches : [])
      } finally {
        setLoading(false)
      }
    }
    run()
  }, [query])

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="text-sm text-gray-600 mb-3">
          <Link href="/" className="text-primary-600 hover:text-primary-700">← Zurück zur Startseite</Link>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Suchergebnisse {query ? `für "${query}"` : ''}
        </h1>

        {loading ? (
          <div>Lade Ergebnisse…</div>
        ) : watches.length === 0 ? (
          <div className="bg-white border rounded-md p-6 text-gray-600">
            Keine Ergebnisse gefunden.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {watches.map(w => (
              <div key={w.id} className="bg-white rounded-lg shadow overflow-hidden">
                {w.images && w.images.length > 0 ? (
                  <img src={w.images[0]} alt={w.title} className="w-full h-48 object-cover" />
                ) : (
                  <div className="w-full h-48 bg-gray-200 flex items-center justify-center text-gray-500">Kein Bild</div>
                )}
                <div className="p-4">
                  <div className="text-sm text-primary-600">{w.brand}</div>
                  <div className="font-semibold text-gray-900 line-clamp-2">{w.title}</div>
                  <div className="text-gray-700 mt-1">CHF {new Intl.NumberFormat('de-CH').format(w.price)}</div>
                  <div className="mt-4">
                    <Link href={`/products/${w.id}`} className="px-3 py-2 bg-primary-600 text-white rounded inline-block">Angebot ansehen</Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <Footer />
    </div>
  )
}


