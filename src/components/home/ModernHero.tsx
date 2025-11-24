'use client'

import { useState } from 'react'
import { Search, Shield, Truck, Lock } from 'lucide-react'
import { ModernInput } from '@/components/ui/ModernInput'

export function ModernHero() {
  const [searchQuery, setSearchQuery] = useState('')

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      window.location.href = `/search?q=${encodeURIComponent(searchQuery.trim())}`
    }
  }

  const trustBullets = [
    {
      icon: Shield,
      title: 'Sicher kaufen',
      description: 'Geschützte Transaktionen',
    },
    {
      icon: Truck,
      title: 'Schnelle Lieferung',
      description: 'Direkt zu dir nach Hause',
    },
    {
      icon: Lock,
      title: 'Daten geschützt',
      description: 'Deine Privatsphäre ist sicher',
    },
  ]

  return (
    <section className="py-20 bg-white">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-semibold text-[#3A3A3A] mb-6">
            Finde was du suchst
          </h1>
          <p className="text-xl text-[#C6C6C6] mb-12 max-w-2xl mx-auto">
            Der moderne Schweizer Marktplatz für alles, was du brauchst
          </p>

          {/* Central Search */}
          <form onSubmit={handleSearch} className="max-w-2xl mx-auto mb-16">
            <ModernInput
              type="text"
              placeholder="Wonach suchst du?"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              showSearchIcon={true}
              className="w-full text-lg"
            />
          </form>

          {/* Trust Bullets */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {trustBullets.map((bullet, index) => (
              <div key={index} className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-[#F4F4F4] rounded-full flex items-center justify-center mb-4">
                  <bullet.icon className="h-8 w-8 text-[#137A5F]" />
                </div>
                <h3 className="text-lg font-semibold text-[#3A3A3A] mb-2">
                  {bullet.title}
                </h3>
                <p className="text-sm text-[#C6C6C6]">
                  {bullet.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}














