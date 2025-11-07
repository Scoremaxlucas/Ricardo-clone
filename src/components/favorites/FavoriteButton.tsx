'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Heart } from 'lucide-react'

interface FavoriteButtonProps {
  watchId: string
}

export function FavoriteButton({ watchId }: FavoriteButtonProps) {
  const { data: session } = useSession()
  const [isFavorite, setIsFavorite] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkFavorite = async () => {
      if (!session?.user) {
        setLoading(false)
        return
      }

      try {
        const res = await fetch('/api/favorites')
        if (res.ok) {
          const data = await res.json()
          const favoriteIds = (data.favorites || []).map((f: any) => f.watchId)
          setIsFavorite(favoriteIds.includes(watchId))
        }
      } catch (error) {
        console.error('Error checking favorite:', error)
      } finally {
        setLoading(false)
      }
    }
    checkFavorite()
  }, [watchId, session?.user])

  const toggleFavorite = async () => {
    if (!session?.user || loading) return

    setLoading(true)
    try {
      if (isFavorite) {
        // Entfernen
        const res = await fetch(`/api/favorites/${watchId}`, { method: 'DELETE' })
        if (res.ok) {
          setIsFavorite(false)
        }
      } else {
        // Hinzufügen
        const res = await fetch('/api/favorites', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ watchId })
        })
        if (res.ok) {
          setIsFavorite(true)
        }
      }
    } catch (error) {
      console.error('Error toggling favorite:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!session?.user) {
    return null // Nicht anzeigen wenn nicht eingeloggt
  }

  return (
    <button
      onClick={toggleFavorite}
      disabled={loading}
      className={`flex items-center justify-center w-12 h-12 rounded-full shadow-lg transition-all ${
        isFavorite
          ? 'bg-red-500 text-white hover:bg-red-600'
          : 'bg-white text-gray-700 hover:bg-gray-100'
      } disabled:opacity-50 disabled:cursor-not-allowed`}
      title={isFavorite ? 'Aus Favoriten entfernen' : 'Zu Favoriten hinzufügen'}
    >
      <Heart className={`h-6 w-6 ${isFavorite ? 'fill-current' : ''}`} />
    </button>
  )
}

