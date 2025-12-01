'use client'

import { useState, useEffect } from 'react'
import { HelvendaCow } from './HelvendaCow'
import { X, MessageCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface FloatingCowProps {
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'
  showChat?: boolean
}

export function FloatingCow({ position = 'bottom-right', showChat = true }: FloatingCowProps) {
  const [isVisible, setIsVisible] = useState(true)
  const [isExpanded, setIsExpanded] = useState(false)
  const [currentAnimation, setCurrentAnimation] = useState<'idle' | 'wave' | 'happy'>('idle')
  const router = useRouter()

  useEffect(() => {
    // Veepi-Style: Subtile, natürliche Animationen - selten und unaufdringlich
    const interval = setInterval(() => {
      // Nur sehr selten eine subtile Animation (wie Veepi)
      if (Math.random() > 0.85) {
        setCurrentAnimation('happy')
        setTimeout(() => setCurrentAnimation('idle'), 600)
      }
    }, 15000)

    return () => clearInterval(interval)
  }, [])

  const positionClasses = {
    'bottom-right': 'bottom-6 right-6',
    'bottom-left': 'bottom-6 left-6',
    'top-right': 'top-6 right-6',
    'top-left': 'top-6 left-6',
  }

  const handleCowClick = () => {
    setIsExpanded(!isExpanded)
    // Subtile Reaktion beim Klick
    setCurrentAnimation('happy')
    setTimeout(() => setCurrentAnimation('idle'), 800)
  }

  const handleChatClick = () => {
    router.push('/help')
  }

  if (!isVisible) return null

  return (
    <div className={`fixed ${positionClasses[position]} z-50 flex flex-col items-end gap-3`}>
      {/* Chat-Bubble (wenn erweitert) */}
      {isExpanded && showChat && (
        <div
          className="animate-fade-in-up mb-2 rounded-2xl bg-white p-4 shadow-2xl"
          style={{
            boxShadow: '0px 8px 30px rgba(20, 184, 166, 0.3)',
            minWidth: '200px',
            maxWidth: '250px',
          }}
        >
          <div className="mb-2 flex items-start justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-gray-900">Helvenda Kuh</span>
            </div>
            <button
              onClick={() => setIsExpanded(false)}
              className="text-gray-400 transition-colors hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <p className="mb-3 text-sm text-gray-700">
            Willkommen bei Helvenda! Kann ich dir helfen?
          </p>
          <button
            onClick={handleChatClick}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary-500 px-4 py-2 text-sm font-bold text-white transition-all duration-300 hover:bg-primary-600"
            style={{
              background: 'linear-gradient(135deg, #14b8a6 0%, #10b981 100%)',
              boxShadow: '0px 4px 20px rgba(20, 184, 166, 0.3)',
            }}
          >
            <MessageCircle className="h-4 w-4" />
            Hilfe anzeigen
          </button>
        </div>
      )}

      {/* Kuh-Maskottchen */}
      <div className="group relative cursor-pointer" onClick={handleCowClick}>
        <HelvendaCow variant={currentAnimation} size="md" interactive={true} />

        {/* Badge für neue Nachrichten (optional) */}
        {showChat && !isExpanded && (
          <div className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
            !
          </div>
        )}
      </div>
    </div>
  )
}
