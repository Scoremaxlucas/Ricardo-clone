'use client'

import { useState, useEffect } from 'react'
import { HelvendaCow } from './HelvendaCow'
import { X, MessageCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface FloatingCowProps {
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'
  showChat?: boolean
}

export function FloatingCow({ 
  position = 'bottom-right',
  showChat = true
}: FloatingCowProps) {
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
    'top-left': 'top-6 left-6'
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
          className="bg-white rounded-2xl shadow-2xl p-4 mb-2 animate-fade-in-up"
          style={{
            boxShadow: '0px 8px 30px rgba(20, 184, 166, 0.3)',
            minWidth: '200px',
            maxWidth: '250px'
          }}
        >
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="font-bold text-gray-900 text-sm">Helvenda Kuh</span>
            </div>
            <button
              onClick={() => setIsExpanded(false)}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className="text-sm text-gray-700 mb-3">
            Willkommen bei Helvenda! Kann ich dir helfen?
          </p>
          <button
            onClick={handleChatClick}
            className="w-full bg-primary-500 hover:bg-primary-600 text-white font-bold py-2 px-4 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 text-sm"
            style={{
              background: 'linear-gradient(135deg, #14b8a6 0%, #10b981 100%)',
              boxShadow: '0px 4px 20px rgba(20, 184, 166, 0.3)'
            }}
          >
            <MessageCircle className="w-4 h-4" />
            Hilfe anzeigen
          </button>
        </div>
      )}

      {/* Kuh-Maskottchen */}
      <div
        className="relative cursor-pointer group"
        onClick={handleCowClick}
      >
        <HelvendaCow 
          variant={currentAnimation}
          size="md"
          interactive={true}
        />
        
        {/* Badge für neue Nachrichten (optional) */}
        {showChat && !isExpanded && (
          <div className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">
            !
          </div>
        )}
      </div>
    </div>
  )
}

