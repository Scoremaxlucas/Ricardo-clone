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
    <div className="flex flex-col items-center justify-center gap-4 animate-fade-in-up">
      {/* Kuh - Ohne Glow und Sparkles */}
      <div className="relative">
        <HelvendaCow 
          variant={currentAnimation}
          size="lg"
          interactive={false}
        />
      </div>

      {/* Text mit Kuh */}
      <div className="text-center">
        <h3 className="text-2xl md:text-3xl font-extrabold text-white mb-2">
          Willkommen bei Helvenda
        </h3>
        <p className="text-white/90 text-lg mb-4">
          Dein Schweizer Marktplatz für Kaufen und Verkaufen
        </p>
        <Link
          href="/sell"
          className="inline-flex items-center gap-2 bg-white text-primary-600 hover:bg-gray-50 font-bold px-6 py-3 rounded-[50px] transition-all duration-300 text-base shadow-xl hover:shadow-2xl hover:scale-105 hover:-translate-y-1"
        >
          Jetzt verkaufen
          <ArrowRight className="w-5 h-5" />
        </Link>
      </div>
    </div>
  )
}

