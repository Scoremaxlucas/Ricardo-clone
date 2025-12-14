'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { Heart, Package, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'

interface Product {
  id: string
  title: string
  brand: string
  model: string
  price: number
  images: string[]
  condition: string
  isAuction: boolean
  currentBid?: number
}

export default function FavoritesPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [favorites, setFavorites] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?redirect=/favorites')
      return
    }

    if (status === 'authenticated') {
      fetchFavorites()
    }
  }, [status, router])

  const fetchFavorites = async () => {
    setLoading(true)
    try {
      // OPTIMIERT: Verwende fast API-Route für instant loading
      // Lädt alle Favoriten in einem einzigen optimierten Query
      const response = await fetch('/api/articles/favorites-fast')
      if (response.ok) {
        const data = await response.json()
        const watches = data.watches || []

        // Transformiere zu Product-Format
        const products: Product[] = watches.map((w: any) => ({
          id: w.id,
          title: w.title,
          brand: w.brand,
          model: w.model,
          price: w.price,
          images: w.images || [],
          condition: w.condition || '',
          isAuction: w.isAuction || false,
          currentBid: w.price, // Bei Auktionen ist price bereits der aktuelle Preis
        }))

        setFavorites(products)
      }
    } catch (error) {
      console.error('Error fetching favorites:', error)
    } finally {
      setLoading(false)
    }
  }

  const removeFavorite = async (productId: string) => {
    try {
      const res = await fetch(`/api/favorites/${productId}`, { method: 'DELETE' })
      if (res.ok) {
        setFavorites(prev => prev.filter(p => p.id !== productId))
      }
    } catch (error) {
      console.error('Error removing favorite:', error)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <Loader2 className="mx-auto mb-4 h-12 w-12 animate-spin text-primary-600" />
            <p className="text-gray-600">Lade Favoriten...</p>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="mx-auto max-w-[1400px] px-4 py-8 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <div className="mb-4 text-sm text-gray-600">
          <Link href="/" className="text-primary-600 hover:text-primary-700">
            Startseite
          </Link>
          <span className="mx-2">›</span>
          <span>Meine Favoriten</span>
        </div>

        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Heart className="h-8 w-8 fill-current text-red-500" />
            <h1 className="text-3xl font-bold text-gray-900">Meine Favoriten</h1>
          </div>
          <div className="text-sm text-gray-600">
            {favorites.length} {favorites.length === 1 ? 'Artikel' : 'Artikel'}
          </div>
        </div>

        {/* Content */}
        {favorites.length === 0 ? (
          <div className="rounded-lg border border-gray-200 bg-white p-12 text-center">
            <Heart className="mx-auto mb-4 h-16 w-16 text-gray-300" />
            <h2 className="mb-2 text-xl font-semibold text-gray-900">Noch keine Favoriten</h2>
            <p className="mb-6 text-gray-600">
              Fügen Sie Artikel zu Ihren Favoriten hinzu, um sie später schnell wiederzufinden.
            </p>
            <Link
              href="/search"
              className="inline-flex items-center justify-center rounded-[50px] px-6 py-3 font-bold text-white transition-all duration-300 hover:-translate-y-0.5 hover:scale-[1.02] active:translate-y-0 active:scale-[0.98]"
              style={{
                background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
                boxShadow: '0px 4px 20px rgba(249, 115, 22, 0.3)',
              }}
            >
              Artikel durchstöbern
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {favorites.map(product => (
              <div
                key={product.id}
                className="overflow-hidden rounded-lg border border-gray-200 bg-white transition-shadow hover:shadow-lg"
              >
                <Link href={`/products/${product.id}`}>
                  {product.images && product.images.length > 0 ? (
                    <img
                      src={product.images[0]}
                      alt={product.title}
                      className="h-48 w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-48 w-full items-center justify-center bg-gray-100">
                      <Package className="h-12 w-12 text-gray-300" />
                    </div>
                  )}
                </Link>
                <div className="p-4">
                  <Link href={`/products/${product.id}`}>
                    {product.brand && (
                      <div className="mb-1 text-sm text-primary-600">{product.brand}</div>
                    )}
                    <div className="mb-2 line-clamp-2 font-semibold text-gray-900 hover:text-primary-600">
                      {product.title}
                    </div>
                  </Link>
                  <div className="mb-3 flex items-center justify-between">
                    <div className="text-lg font-bold text-gray-900">
                      CHF{' '}
                      {product.isAuction && product.currentBid
                        ? product.currentBid.toFixed(2)
                        : (product.price || 0).toFixed(2)}
                    </div>
                    {product.isAuction && <div className="text-xs text-gray-500">Gebot</div>}
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <Link
                      href={`/products/${product.id}`}
                      className="flex-1 inline-flex items-center justify-center rounded-[50px] px-4 py-2 text-sm font-bold text-white transition-all duration-300 hover:-translate-y-0.5 hover:scale-[1.02] active:translate-y-0 active:scale-[0.98]"
                      style={{
                        background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
                        boxShadow: '0px 4px 20px rgba(249, 115, 22, 0.3)',
                      }}
                    >
                      Ansehen
                    </Link>
                    <Button
                      onClick={() => removeFavorite(product.id)}
                      variant="ghost"
                      size="sm"
                      className="rounded-lg bg-red-500 px-3 py-2 text-white hover:bg-red-600"
                      title="Aus Favoriten entfernen"
                    >
                      <Heart className="h-4 w-4 fill-current" />
                    </Button>
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
