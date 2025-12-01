'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import {
  Search,
  BookOpen,
  ShoppingBag,
  Gavel,
  CreditCard,
  Shield,
  Truck,
  MessageCircle,
  HelpCircle,
  ChevronRight,
} from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'

export default function HelpPage() {
  const { t } = useLanguage()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  // Load help categories from translations
  const helpCategories = [
    {
      id: 'account',
      titleKey: 'account',
      icon: HelpCircle,
      color: 'bg-blue-100 text-blue-600',
      articles: [
        { id: 'create-account', slug: 'create-account' },
        { id: 'verify-account', slug: 'verify-account' },
        { id: 'edit-profile', slug: 'edit-profile' },
        { id: 'change-password', slug: 'change-password' },
      ],
    },
    {
      id: 'buying',
      titleKey: 'buying',
      icon: ShoppingBag,
      color: 'bg-green-100 text-green-600',
      articles: [
        { id: 'how-to-buy', slug: 'how-to-buy' },
        { id: 'auctions', slug: 'auctions' },
        { id: 'price-offers', slug: 'price-offers' },
        { id: 'payment', slug: 'payment' },
        { id: 'tracking', slug: 'tracking' },
      ],
    },
    {
      id: 'selling',
      titleKey: 'selling',
      icon: Gavel,
      color: 'bg-purple-100 text-purple-600',
      articles: [
        { id: 'how-to-sell', slug: 'how-to-sell' },
        { id: 'create-listing', slug: 'create-listing' },
        { id: 'boosters', slug: 'boosters' },
        { id: 'fees', slug: 'fees' },
        { id: 'shipping', slug: 'shipping' },
      ],
    },
    {
      id: 'payment',
      titleKey: 'payment',
      icon: CreditCard,
      color: 'bg-yellow-100 text-yellow-600',
      articles: [
        { id: 'payment-methods', slug: 'payment-methods' },
        { id: 'seller-fees', slug: 'seller-fees' },
        { id: 'invoice', slug: 'invoice' },
        { id: 'refund', slug: 'refund' },
      ],
    },
    {
      id: 'safety',
      titleKey: 'safety',
      icon: Shield,
      color: 'bg-red-100 text-red-600',
      articles: [
        { id: 'safe-buying', slug: 'safe-buying' },
        { id: 'safe-selling', slug: 'safe-selling' },
        { id: 'disputes', slug: 'disputes' },
        { id: 'scams', slug: 'scams' },
        { id: 'buyer-protection', slug: 'buyer-protection' },
        { id: 'moneyguard-terms', slug: 'moneyguard-terms' },
      ],
    },
    {
      id: 'shipping',
      titleKey: 'shipping',
      icon: Truck,
      color: 'bg-indigo-100 text-indigo-600',
      articles: [
        { id: 'shipping-options', slug: 'shipping-options' },
        { id: 'shipping-costs', slug: 'shipping-costs' },
        { id: 'tracking', slug: 'tracking' },
        { id: 'insurance', slug: 'insurance' },
      ],
    },
    {
      id: 'general',
      titleKey: 'general',
      icon: BookOpen,
      color: 'bg-gray-100 text-gray-600',
      articles: [
        { id: 'system-outages', slug: 'system-outages' },
        { id: 'prohibited-items', slug: 'prohibited-items' },
      ],
    },
  ]

  const filteredCategories = helpCategories.filter(category => {
    if (selectedCategory && category.id !== selectedCategory) return false
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    const categoryTitle = t.help[category.titleKey as keyof typeof t.help] || ''
    return (
      categoryTitle.toLowerCase().includes(query) ||
      category.articles.some(article => {
        const articleData = t.helpArticles[article.slug as keyof typeof t.helpArticles]
        return articleData?.title.toLowerCase().includes(query) || false
      })
    )
  })

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <Header />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="mb-4 text-4xl font-bold text-gray-900">{t.help.title}</h1>
          <p className="text-lg text-gray-600">{t.help.subtitle}</p>
        </div>

        {/* Search Bar */}
        <div className="mb-8">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 transform text-gray-400" />
            <input
              type="text"
              placeholder={t.help.searchPlaceholder}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-gray-300 py-4 pl-12 pr-4 text-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-12 grid grid-cols-1 gap-4 md:grid-cols-3">
          <Link
            href="/faq"
            className="rounded-lg border border-gray-200 bg-white p-6 shadow-md transition-shadow hover:shadow-lg"
          >
            <div className="mb-2 flex items-center gap-3">
              <HelpCircle className="h-6 w-6 text-primary-600" />
              <h3 className="text-lg font-semibold text-gray-900">{t.help.faq}</h3>
            </div>
            <p className="text-sm text-gray-600">{t.help.faqDesc}</p>
          </Link>
          <Link
            href="/contact"
            className="rounded-lg border border-gray-200 bg-white p-6 shadow-md transition-shadow hover:shadow-lg"
          >
            <div className="mb-2 flex items-center gap-3">
              <MessageCircle className="h-6 w-6 text-primary-600" />
              <h3 className="text-lg font-semibold text-gray-900">{t.help.contact}</h3>
            </div>
            <p className="text-sm text-gray-600">{t.help.contactDesc}</p>
          </Link>
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-md">
            <div className="mb-2 flex items-center gap-3">
              <MessageCircle className="h-6 w-6 text-primary-600" />
              <h3 className="text-lg font-semibold text-gray-900">{t.help.emmaAI}</h3>
            </div>
            <p className="text-sm text-gray-600">{t.help.emmaAIDesc}</p>
            <p className="mt-2 text-xs text-gray-500">{t.help.emmaAvailable}</p>
          </div>
        </div>

        {/* Categories */}
        <div className="space-y-6">
          {filteredCategories.map(category => {
            const Icon = category.icon
            return (
              <div
                key={category.id}
                className="rounded-lg border border-gray-200 bg-white shadow-md"
              >
                <div className="p-6">
                  <div className="mb-4 flex items-center gap-4">
                    <div className={`rounded-lg p-3 ${category.color}`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      {t.help[category.titleKey as keyof typeof t.help]}
                    </h2>
                  </div>
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    {category.articles.map(article => {
                      const articleData =
                        t.helpArticles[article.slug as keyof typeof t.helpArticles]
                      return (
                        <Link
                          key={article.id}
                          href={`/help/${article.slug}`}
                          className="flex items-center justify-between rounded-lg border border-gray-100 p-4 transition-colors hover:bg-gray-50"
                        >
                          <span className="font-medium text-gray-700">
                            {articleData?.title || article.slug}
                          </span>
                          <ChevronRight className="h-5 w-5 text-gray-400" />
                        </Link>
                      )
                    })}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* No Results */}
        {filteredCategories.length === 0 && (
          <div className="py-12 text-center">
            <BookOpen className="mx-auto mb-4 h-16 w-16 text-gray-400" />
            <h3 className="mb-2 text-xl font-semibold text-gray-900">{t.help.noResults}</h3>
            <p className="mb-6 text-gray-600">{t.help.noResultsDesc}</p>
            <Link
              href="/contact"
              className="inline-block rounded-lg bg-primary-600 px-6 py-3 text-white transition-colors hover:bg-primary-700"
            >
              {t.help.contactUs}
            </Link>
          </div>
        )}

        {/* Contact CTA */}
        <div className="mt-12 rounded-lg border border-primary-200 bg-primary-50 p-8 text-center">
          <h3 className="mb-2 text-2xl font-bold text-gray-900">{t.help.stillQuestions}</h3>
          <p className="mb-6 text-gray-600">{t.help.stillQuestionsDesc}</p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/contact"
              className="rounded-lg bg-primary-600 px-6 py-3 font-medium text-white transition-colors hover:bg-primary-700"
            >
              {t.help.contactForm}
            </Link>
            <Link
              href="/faq"
              className="rounded-lg border-2 border-primary-600 bg-white px-6 py-3 font-medium text-primary-600 transition-colors hover:bg-primary-50"
            >
              {t.help.viewFAQ}
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
