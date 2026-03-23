'use client'

import { Footer } from '@/components/layout/Footer'
import { Header } from '@/components/layout/Header'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'

/** Eigener Chunk — Galerie, Gebote, Chat, … erst nach Daten-Fetch laden */
const ProductPageClient = dynamic(
  () =>
    import('@/components/product/ProductPageClient').then(m => ({ default: m.ProductPageClient })),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-[400px] items-center justify-center" aria-busy="true">
        <div
          className="h-10 w-10 animate-spin rounded-full border-2 border-primary-600 border-t-transparent"
          role="status"
          aria-label="Laden"
        />
      </div>
    ),
  }
)

export default function ProductPage() {
  const params = useParams()
  const id = params?.id as string

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [data, setData] = useState<{
    watch: any
    images: string[]
    conditionMap: Record<string, string>
    seller: any
    saleInfo?: {
      soldAt: string | null
      soldPrice: number | null
      isCurrentUserBuyer: boolean
      buyerName: string | null
    } | null
  } | null>(null)

  useEffect(() => {
    if (!id) return

    const fetchProduct = async () => {
      try {
        const res = await fetch(`/api/products/${id}`)
        if (res.ok) {
          const json = await res.json()
          setData(json)
          setError(false)
        } else {
          setError(true)
        }
      } catch (err) {
        console.error('Error fetching product:', err)
        setError(true)
      } finally {
        setLoading(false)
      }
    }

    fetchProduct()
  }, [id])

  if (error || (!loading && (!data || !data?.watch))) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="pb-8">
          <div className="mx-auto max-w-[1400px] px-4 py-8">
            <div className="rounded-lg border border-gray-200 bg-white p-8 text-center md:p-12">
              <h2 className="mb-2 text-lg font-semibold text-gray-900 md:text-xl">
                Dieser Artikel konnte nicht geladen werden
              </h2>
              <p className="mb-6 text-sm text-gray-600 md:text-base">
                Bitte versuchen Sie es später erneut oder suchen Sie einen anderen Artikel.
              </p>
              <Link
                href="/search"
                className="inline-block rounded-lg bg-primary-600 px-6 py-3 text-sm font-medium text-white hover:bg-primary-700 md:text-base"
              >
                Zur Suche
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="pb-8">
          <div className="mx-auto max-w-[1400px] px-4 py-8">
            <div className="flex min-h-[400px] items-center justify-center">
              <div className="text-gray-600">Lade Produkt...</div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="pb-8">
        <div className="mx-auto max-w-[1400px] px-4 py-8">
          <ProductPageClient
            watch={data?.watch || null}
            images={data?.images || []}
            conditionMap={data?.conditionMap || {}}
            lieferumfang=""
            seller={data?.seller || null}
            saleInfo={data?.saleInfo || null}
          />
        </div>
      </main>
      <Footer />
    </div>
  )
}
