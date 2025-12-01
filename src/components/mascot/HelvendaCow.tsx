'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'

interface HelvendaCowProps {
  variant?: 'idle' | 'wave' | 'jump' | 'happy' | 'thinking'
  size?: 'sm' | 'md' | 'lg'
  interactive?: boolean
  className?: string
  onClick?: () => void
}

export function HelvendaCow({
  variant = 'idle',
  size = 'md',
  interactive = true,
  className = '',
  onClick,
}: HelvendaCowProps) {
  const [currentVariant, setCurrentVariant] = useState(variant)
  const [isHovered, setIsHovered] = useState(false)

  useEffect(() => {
    setCurrentVariant(variant)
  }, [variant])

  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-24 h-24',
    lg: 'w-32 h-32',
  }

  const handleClick = () => {
    if (onClick) {
      onClick()
    }

    if (currentVariant === 'idle') {
      setCurrentVariant('happy')
      setTimeout(() => setCurrentVariant('idle'), 800)
    }
  }

  const handleMouseEnter = () => {
    if (interactive) {
      setIsHovered(true)
    }
  }

  // Animation-Klassen basierend auf Variant
  const animationClasses = {
    idle: '',
    wave: 'animate-pulse',
    jump: 'animate-bounce',
    happy: 'scale-105 transition-transform duration-300',
    thinking: 'animate-pulse',
  }

  return (
    <div
      className={`relative ${sizeClasses[size]} ${interactive ? 'cursor-pointer' : ''} ${className}`}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Kuh als Bilddatei */}
      <div
        className={`relative h-full w-full transition-all duration-300 ${
          animationClasses[currentVariant] || ''
        } ${isHovered ? 'scale-110' : ''}`}
        style={{
          transform:
            currentVariant === 'wave'
              ? 'rotate(-5deg)'
              : currentVariant === 'happy'
                ? 'rotate(3deg)'
                : 'rotate(0deg)',
          filter: 'drop-shadow(0px 4px 12px rgba(0,0,0,0.15))',
        }}
      >
        <Image
          src="/images/helvenda-cow.png"
          alt="Helvenda Kuh Maskottchen"
          fill
          className="object-contain"
          priority={size === 'lg'}
          onError={e => {
            // Fallback falls Bild nicht gefunden wird
            console.warn(
              'Kuh-Bild nicht gefunden. Bitte platziere helvenda-cow.png in /public/images/'
            )
            e.currentTarget.style.display = 'none'
          }}
        />
      </div>

      {/* Fallback falls Bild nicht geladen werden kann */}
      <div
        className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-full bg-gray-100 opacity-0"
        style={{ display: 'none' }}
      >
        <span className="text-xs text-gray-400">Kuh</span>
      </div>
    </div>
  )
}
