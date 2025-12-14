'use client'

import { useState, useEffect } from 'react'
import { HelvendaCow } from './HelvendaCow'
import { ArrowRight } from 'lucide-react'
import Link from 'next/link'

export function HeroCow() {
  const [currentAnimation, setCurrentAnimation] = useState<'idle' | 'wave' | 'happy'>('idle')

  useEffect(() => {
    // Veepi-Style: Sehr subtile, natürliche Animationen
    const interval = setInterval(() => {
      // Nur sehr selten eine subtile Animation
      if (Math.random() > 0.9) {
        setCurrentAnimation('happy')
        setTimeout(() => setCurrentAnimation('idle'), 600)
      }
    }, 20000)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="animate-fade-in-up flex flex-col items-center justify-center gap-4">
      {/* Kuh - Ohne Glow und Sparkles */}
      <div className="relative">
        <HelvendaCow variant={currentAnimation} size="lg" interactive={false} />
      </div>

      {/* Text mit Kuh */}
      <div className="text-center">
        <h3 className="mb-2 text-2xl font-extrabold text-white md:text-3xl">
          Willkommen bei Helvenda
        </h3>
        <p className="mb-4 text-lg text-white/90">
          Dein Schweizer Marktplatz für Kaufen und Verkaufen
        </p>
        <Link
          href="/sell"
          className="inline-flex items-center gap-2 rounded-[50px] bg-orange-500 px-6 py-3 text-base font-bold text-white shadow-xl transition-all duration-300 hover:-translate-y-1 hover:scale-105 hover:bg-orange-600 hover:shadow-2xl"
        >
          Jetzt verkaufen
          <ArrowRight className="h-5 w-5" />
        </Link>
      </div>
    </div>
  )
}
