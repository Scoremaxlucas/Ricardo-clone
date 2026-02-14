'use client'

import { ProductCard } from '@/components/ui/ProductCard'
import { useLanguage } from '@/contexts/LanguageContext'
import { Clock, Flame } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'

interface EndingSoonProduct {
  id: string
  title: string
  brand: string
  model: string
  price: number
  buyNowPrice?: number | null
  isAuction: boolean
  auctionEnd?: string | null
  images: string[]
  condition: string
  createdAt: string
  boosters?: string[]
  articleNumber?: number | null
  href?: string
  paymentProtectionEnabled?: boolean
  sellerId?: string
  bidCount?: number
}

export function EndingSoonAuctions({ excludeIds = [] }: { excludeIds?: string[] }) {
  const { t } = useLanguage()
  const { data: session } = useSession()
  const [products, setProducts] = useState<EndingSoonProduct[]>([])
  const [favorites, setFavorites] = useState<Set<string>>(new Set())
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    let mounted = true
    const controller = new AbortController()

    fetch('/api/articles/ending-soon?limit=10', { signal: controller.signal })
      .then(res => res.json())
      .then(data => {
        if (mounted && data.watches) {
          const filtered = data.watches.filter((w: EndingSoonProduct) => !excludeIds.includes(w.id))
          setProducts(filtered)
        }
      })
      .catch(() => {})
      .finally(() => { if (mounted) setLoaded(true) })

    return () => { mounted = false; controller.abort() }
  }, [excludeIds])

  // Load favorites
  useEffect(() => {
    if (!session?.user) return
    let mounted = true
    fetch('/api/favorites')
      .then(res => res.json())
      .then(data => {
        if (mounted) setFavorites(new Set(data.favorites?.map((f: any) => f.watchId) || []))
      })
      .catch(() => {})
    return () => { mounted = false }
  }, [session?.user])

  if (!loaded || products.length === 0) return null

  return (
    <section className="bg-gradient-to-b from-amber-50/50 to-[#FAFAFA] py-8 md:py-10 lg:py-6">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-6 text-center lg:mb-4">
          <div className="mb-2 flex items-center justify-center gap-2">
            <div className="flex items-center gap-1 rounded-full bg-red-100 px-3 py-1">
              <Flame className="h-5 w-5 text-red-500" />
              <Clock className="h-4 w-4 text-red-500" />
            </div>
            <h2 className="text-2xl font-extrabold text-gray-900 md:text-3xl lg:text-2xl">
              Bald endend
            </h2>
          </div>
          <p className="text-base leading-relaxed text-gray-600 lg:text-sm">
            Auktionen, die in weniger als 24 Stunden enden
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {products.map((product, index) => (
            <div
              key={product.id}
              className="flex h-full min-w-0 animate-in fade-in slide-in-from-bottom-2 duration-200"
              style={{ animationDelay: `${Math.min(index, 9) * 30}ms` }}
            >
              <ProductCard
                product={{
                  id: product.id,
                  title: product.title,
                  brand: product.brand,
                  model: product.model,
                  price: product.price,
                  buyNowPrice: product.buyNowPrice ?? undefined,
                  isAuction: product.isAuction,
                  auctionEnd: product.auctionEnd ?? undefined,
                  images: product.images,
                  condition: product.condition,
                  boosters: product.boosters,
                  href: product.href,
                  createdAt: product.createdAt,
                  paymentProtectionEnabled: product.paymentProtectionEnabled ?? false,
                }}
                showCondition={true}
                className="w-full"
                onFavoriteToggle={(id, isFavorite) => {
                  setFavorites(prev => {
                    const s = new Set(prev)
                    isFavorite ? s.add(id) : s.delete(id)
                    return s
                  })
                }}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
