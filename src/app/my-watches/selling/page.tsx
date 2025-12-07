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
    // ULTRA-OPTIMIERT: Lade Daten SOFORT ohne auf Session zu warten
    // Verwende userId aus Session wenn verfügbar, sonst lade trotzdem (API prüft selbst)
    
    const loadData = async () => {
      try {
        setLoading(true)
        
        // OPTIMIERT: Wenn Session bereits verfügbar, übergebe userId für noch schnellere API
        const userId = session?.user?.id
        const url = userId 
          ? `/api/articles/mine-instant?userId=${userId}`
          : `/api/articles/mine-instant`

        // STRATEGIE: Versuche INSTANT API mit 300ms Timeout für INSTANT loading
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 300) // 300ms für INSTANT

        try {
          const res = await fetch(url, {
            signal: controller.signal,
            cache: 'no-store',
            headers: {
              'Accept': 'application/json',
            },
          })

          clearTimeout(timeoutId)

          if (res.ok) {
            const data = await res.json()
            if (data.watches && Array.isArray(data.watches)) {
              setItems(data.watches)
              setLoading(false)
              return
            }
          }
        } catch (fetchError: any) {
          clearTimeout(timeoutId)
          if (fetchError.name === 'AbortError') {
            // Timeout - zeige leere Liste, lade im Hintergrund nach
            setLoading(false)
            fetch(`/api/articles/mine-fast`)
              .then(res => res.json())
              .then(data => {
                if (data.watches && Array.isArray(data.watches)) {
                  setItems(data.watches)
                }
              })
              .catch(() => {})
            return
          }
          throw fetchError
        }
      } catch (error: any) {
        console.error('Error loading articles:', error)
        setItems([])
      } finally {
        setLoading(false)
      }
    }

    // OPTIMIERT: Starte sofort, auch wenn Session noch lädt
    loadData()
    
    // OPTIMIERT: Prüfe Session separat und redirect nur wenn nötig
    if (status !== 'loading' && !session?.user?.id) {
      router.push('/login?callbackUrl=/my-watches/selling')
    }
  }, [session, status, router])

  // OPTIMIERT: Zeige Artikel sofort an, auch wenn noch geladen wird
  // Nur zeigen Loading-State wenn wirklich keine Artikel vorhanden sind
  const showLoading = loading && items.length === 0 && status !== 'loading'

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

          {/* OPTIMIERT: Zeige Loading nur wenn wirklich keine Artikel vorhanden */}
          {showLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-primary-600"></div>
                <p className="mt-4 text-gray-600">Artikel werden geladen...</p>
              </div>
            </div>
          ) : (
            <MySellingClient initialItems={items} initialStats={stats} />
          )}
        </div>
      </div>
      <Footer />
    </div>
  )
}

