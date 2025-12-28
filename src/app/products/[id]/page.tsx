'use client'

import { Footer } from '@/components/layout/Footer'
import { Header } from '@/components/layout/Header'
import { ProductPageClient } from '@/components/product/ProductPageClient'
import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function ProductPage() {
  const params = useParams()
  const id = params?.id as string

  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<{
    watch: any
    images: string[]
    conditionMap: Record<string, string>
    seller: any
  } | null>(null)

  useEffect(() => {
    if (!id) return

    const fetchProduct = async () => {
      try {
        const res = await fetch(`/api/products/${id}`)
        if (res.ok) {
          const json = await res.json()
          setData(json)
        }
      } catch (error) {
        console.error('Error fetching product:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchProduct()
  }, [id])

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col bg-gray-50">
        <Header />
        <main className="flex-1 pb-8">
          <div className="flex min-h-[400px] items-center justify-center">
            <div className="text-gray-600">Lade Produkt...</div>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <Header />
      <main className="flex-1 pb-8">
        <ProductPageClient
          watch={data?.watch || null}
          images={data?.images || []}
          conditionMap={data?.conditionMap || {}}
          lieferumfang=""
          seller={data?.seller || null}
        />
      </main>
      <Footer />
    </div>
  )
}
