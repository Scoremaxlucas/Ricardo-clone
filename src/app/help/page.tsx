'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { Search, BookOpen, ShoppingBag, Gavel, CreditCard, Shield, Truck, MessageCircle, HelpCircle, ChevronRight } from 'lucide-react'

const helpCategories = [
  {
    id: 'account',
    title: 'Konto & Profil',
    icon: HelpCircle,
    color: 'bg-blue-100 text-blue-600',
    articles: [
      { id: 'create-account', title: 'Wie erstelle ich ein Konto?', slug: 'create-account' },
      { id: 'verify-account', title: 'Wie verifiziere ich mein Konto?', slug: 'verify-account' },
      { id: 'edit-profile', title: 'Wie bearbeite ich mein Profil?', slug: 'edit-profile' },
      { id: 'change-password', title: 'Wie ändere ich mein Passwort?', slug: 'change-password' },
    ]
  },
  {
    id: 'buying',
    title: 'Kaufen',
    icon: ShoppingBag,
    color: 'bg-green-100 text-green-600',
    articles: [
      { id: 'how-to-buy', title: 'Wie kaufe ich einen Artikel?', slug: 'how-to-buy' },
      { id: 'auctions', title: 'Wie funktionieren Auktionen?', slug: 'auctions' },
      { id: 'price-offers', title: 'Wie mache ich einen Preisvorschlag?', slug: 'price-offers' },
      { id: 'payment', title: 'Wie bezahle ich?', slug: 'payment' },
      { id: 'tracking', title: 'Wie verfolge ich meine Bestellung?', slug: 'tracking' },
    ]
  },
  {
    id: 'selling',
    title: 'Verkaufen',
    icon: Gavel,
    color: 'bg-purple-100 text-purple-600',
    articles: [
      { id: 'how-to-sell', title: 'Wie verkaufe ich einen Artikel?', slug: 'how-to-sell' },
      { id: 'create-listing', title: 'Wie erstelle ich ein Angebot?', slug: 'create-listing' },
      { id: 'boosters', title: 'Was sind Booster?', slug: 'boosters' },
      { id: 'fees', title: 'Welche Gebühren fallen an?', slug: 'fees' },
      { id: 'shipping', title: 'Wie versende ich einen Artikel?', slug: 'shipping' },
    ]
  },
  {
    id: 'payment',
    title: 'Zahlung & Gebühren',
    icon: CreditCard,
    color: 'bg-yellow-100 text-yellow-600',
    articles: [
      { id: 'payment-methods', title: 'Welche Zahlungsmethoden gibt es?', slug: 'payment-methods' },
      { id: 'seller-fees', title: 'Welche Gebühren zahle ich als Verkäufer?', slug: 'seller-fees' },
      { id: 'invoice', title: 'Wie erhalte ich eine Rechnung?', slug: 'invoice' },
      { id: 'refund', title: 'Wie funktioniert eine Rückerstattung?', slug: 'refund' },
    ]
  },
  {
    id: 'safety',
    title: 'Sicherheit',
    icon: Shield,
    color: 'bg-red-100 text-red-600',
    articles: [
      { id: 'safe-buying', title: 'Wie kaufe ich sicher?', slug: 'safe-buying' },
      { id: 'safe-selling', title: 'Wie verkaufe ich sicher?', slug: 'safe-selling' },
      { id: 'disputes', title: 'Was ist ein Dispute?', slug: 'disputes' },
      { id: 'scams', title: 'Wie erkenne ich Betrug?', slug: 'scams' },
    ]
  },
  {
    id: 'shipping',
    title: 'Versand',
    icon: Truck,
    color: 'bg-indigo-100 text-indigo-600',
    articles: [
      { id: 'shipping-options', title: 'Welche Versandoptionen gibt es?', slug: 'shipping-options' },
      { id: 'shipping-costs', title: 'Was kostet der Versand?', slug: 'shipping-costs' },
      { id: 'tracking', title: 'Wie verfolge ich meine Sendung?', slug: 'tracking' },
      { id: 'insurance', title: 'Ist der Versand versichert?', slug: 'insurance' },
    ]
  },
]

export default function HelpPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  const filteredCategories = helpCategories.filter(category => {
    if (selectedCategory && category.id !== selectedCategory) return false
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return category.title.toLowerCase().includes(query) ||
           category.articles.some(article => article.title.toLowerCase().includes(query))
  })

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      <main className="flex-1 max-w-7xl mx-auto px-4 py-12 w-full">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Hilfe-Center</h1>
          <p className="text-lg text-gray-600">
            Finden Sie Antworten auf Ihre Fragen oder kontaktieren Sie unseren Support
          </p>
        </div>

        {/* Search Bar */}
        <div className="mb-8">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Suchen Sie nach Hilfe..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-lg"
            />
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
          <Link
            href="/faq"
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow border border-gray-200"
          >
            <div className="flex items-center gap-3 mb-2">
              <HelpCircle className="h-6 w-6 text-primary-600" />
              <h3 className="text-lg font-semibold text-gray-900">Häufige Fragen</h3>
            </div>
            <p className="text-gray-600 text-sm">Antworten auf die häufigsten Fragen</p>
          </Link>
          <Link
            href="/contact"
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow border border-gray-200"
          >
            <div className="flex items-center gap-3 mb-2">
              <MessageCircle className="h-6 w-6 text-primary-600" />
              <h3 className="text-lg font-semibold text-gray-900">Kontakt</h3>
            </div>
            <p className="text-gray-600 text-sm">Kontaktieren Sie unseren Support</p>
          </Link>
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <div className="flex items-center gap-3 mb-2">
              <MessageCircle className="h-6 w-6 text-primary-600" />
              <h3 className="text-lg font-semibold text-gray-900">Emma AI-Assistant</h3>
            </div>
            <p className="text-gray-600 text-sm">Stellen Sie Fragen an unseren KI-Assistenten</p>
            <p className="text-xs text-gray-500 mt-2">Verfügbar auf allen Seiten (unten rechts)</p>
          </div>
        </div>

        {/* Categories */}
        <div className="space-y-6">
          {filteredCategories.map((category) => {
            const Icon = category.icon
            return (
              <div key={category.id} className="bg-white rounded-lg shadow-md border border-gray-200">
                <div className="p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className={`p-3 rounded-lg ${category.color}`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">{category.title}</h2>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {category.articles.map((article) => (
                      <Link
                        key={article.id}
                        href={`/help/${article.slug}`}
                        className="flex items-center justify-between p-4 rounded-lg hover:bg-gray-50 transition-colors border border-gray-100"
                      >
                        <span className="text-gray-700 font-medium">{article.title}</span>
                        <ChevronRight className="h-5 w-5 text-gray-400" />
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* No Results */}
        {filteredCategories.length === 0 && (
          <div className="text-center py-12">
            <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Keine Ergebnisse gefunden</h3>
            <p className="text-gray-600 mb-6">Versuchen Sie es mit anderen Suchbegriffen</p>
            <Link
              href="/contact"
              className="inline-block px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              Kontakt aufnehmen
            </Link>
          </div>
        )}

        {/* Contact CTA */}
        <div className="mt-12 bg-primary-50 border border-primary-200 rounded-lg p-8 text-center">
          <h3 className="text-2xl font-bold text-gray-900 mb-2">Haben Sie noch Fragen?</h3>
          <p className="text-gray-600 mb-6">
            Unser Support-Team hilft Ihnen gerne weiter. Kontaktieren Sie uns über das Kontaktformular oder nutzen Sie unseren AI-Assistant Emma.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/contact"
              className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
            >
              Kontaktformular
            </Link>
            <Link
              href="/faq"
              className="px-6 py-3 bg-white text-primary-600 border-2 border-primary-600 rounded-lg hover:bg-primary-50 transition-colors font-medium"
            >
              FAQ ansehen
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}

