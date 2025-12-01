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
    <section className="bg-white py-20">
      <div className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8">
        <div className="mb-16 text-center">
          <h1 className="mb-6 text-5xl font-semibold text-[#3A3A3A] md:text-6xl">
            Finde was du suchst
          </h1>
          <p className="mx-auto mb-12 max-w-2xl text-xl text-[#C6C6C6]">
            Der moderne Schweizer Marktplatz für alles, was du brauchst
          </p>

          {/* Central Search */}
          <form onSubmit={handleSearch} className="mx-auto mb-16 max-w-2xl">
            <ModernInput
              type="text"
              placeholder="Wonach suchst du?"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              showSearchIcon={true}
              className="w-full text-lg"
            />
          </form>

          {/* Trust Bullets */}
          <div className="mx-auto grid max-w-4xl grid-cols-1 gap-8 md:grid-cols-3">
            {trustBullets.map((bullet, index) => (
              <div key={index} className="flex flex-col items-center text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#F4F4F4]">
                  <bullet.icon className="h-8 w-8 text-[#137A5F]" />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-[#3A3A3A]">{bullet.title}</h3>
                <p className="text-sm text-[#C6C6C6]">{bullet.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
