'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { MySellingClient } from './MySellingClient'
import Link from 'next/link'
import { Package, Plus } from 'lucide-react'

interface Item {
  id: string
  articleNumber: number | null
  title: string
  brand: string
  model: string
  price: number
  images: string[]
  createdAt: string
  isSold: boolean
  isAuction: boolean
  auctionEnd: string | null
  highestBid: {
    amount: number
    createdAt: string
  } | null
  bidCount: number
  finalPrice: number
  isActive?: boolean
}

export default function MySellingPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'loading') return

    if (!session?.user?.id) {
      router.push('/login?callbackUrl=/my-watches/selling')
      return
    }

    // OPTIMIERT: Lade Daten SOFORT im Client mit ultra-schneller API
    // OPTIMIERT: Verwende AbortController für Timeout-Schutz
    const loadData = async () => {
      try {
        setLoading(true)
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 2000) // 2s Timeout
        
        // Verwende die schnelle API-Route die nur Basis-Daten lädt
        const res = await fetch(`/api/articles/mine-fast`, {
          signal: controller.signal,
          cache: 'no-store', // Kein Caching für sofortige Updates
        })
        
        clearTimeout(timeoutId)
        
        if (res.ok) {
          const data = await res.json()
          if (data.watches && Array.isArray(data.watches)) {
            setItems(data.watches)
          }
        }
      } catch (error: any) {
        if (error.name !== 'AbortError') {
          console.error('Error loading articles:', error)
        }
        // Bei Timeout: Zeige leere Liste, wird später nachgeladen
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [session, status, router])

  if (status === 'loading' || loading) {
    return (
      <div className="flex min-h-screen flex-col bg-gray-50">
        <Header />
        <div className="flex-1 py-8">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-primary-600"></div>
                <p className="mt-4 text-gray-600">Artikel werden geladen...</p>
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  if (!session?.user?.id) {
    return null
  }

  const stats = {
    total: items.length,
    active: items.filter(item => item.isActive).length,
    inactive: items.filter(item => !item.isActive).length,
  }

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <Header />
      <div className="flex-1 py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <div className="mb-4 text-sm text-gray-600">
            <Link href="/my-watches" className="text-primary-600 hover:text-primary-700">
              Mein Verkaufen
            </Link>
            <span className="mx-2">›</span>
            <span>Mein Verkaufen</span>
          </div>

          {/* Header */}
          <div className="mb-8 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-primary-100 p-2">
                <Package className="h-6 w-6 text-primary-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Mein Verkaufen</h1>
                <p className="mt-1 text-gray-600">Verwalten Sie Ihre Verkaufsanzeigen</p>
              </div>
            </div>
            <Link
              href="/sell"
              className="inline-flex items-center rounded-md bg-primary-600 px-4 py-2 text-white transition-colors hover:bg-primary-700"
            >
              <Plus className="mr-2 h-4 w-4" />
              Artikel anbieten
            </Link>
          </div>

          {/* Client Component */}
          <MySellingClient initialItems={items} initialStats={stats} />
        </div>
      </div>
      <Footer />
    </div>
  )
}

