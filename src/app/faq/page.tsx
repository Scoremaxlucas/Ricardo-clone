'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { Search, ChevronDown, ChevronUp, HelpCircle } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'

// FAQ categories will be loaded from translations

export default function FAQPage() {
  const { t } = useLanguage()
  const [searchQuery, setSearchQuery] = useState('')
  const [openQuestions, setOpenQuestions] = useState<Set<string>>(new Set())
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  // Load FAQ categories from translations
  const faqCategories = [
    {
      id: 'general',
      title: t.faq.general,
      questions: t.faqQuestions.general,
    },
    {
      id: 'buying',
      title: t.faq.buying,
      questions: t.faqQuestions.buying,
    },
    {
      id: 'selling',
      title: t.faq.selling,
      questions: t.faqQuestions.selling,
    },
    {
      id: 'payment',
      title: t.faq.payment,
      questions: t.faqQuestions.payment,
    },
    {
      id: 'safety',
      title: t.faq.safety,
      questions: t.faqQuestions.safety,
    },
    {
      id: 'shipping',
      title: t.faq.shipping,
      questions: t.faqQuestions.shipping,
    },
  ]

  const toggleQuestion = (categoryId: string, questionIndex: number) => {
    const key = `${categoryId}-${questionIndex}`
    const newOpen = new Set(openQuestions)
    if (newOpen.has(key)) {
      newOpen.delete(key)
    } else {
      newOpen.add(key)
    }
    setOpenQuestions(newOpen)
  }

  const filteredCategories = faqCategories.filter(category => {
    if (selectedCategory && category.id !== selectedCategory) return false
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return category.title.toLowerCase().includes(query) ||
           category.questions.some(q => 
             q.question.toLowerCase().includes(query) || 
             q.answer.toLowerCase().includes(query)
           )
  })

  const filteredQuestions = filteredCategories.map(category => ({
    ...category,
    questions: category.questions.filter(q => {
      if (!searchQuery) return true
      const query = searchQuery.toLowerCase()
      return q.question.toLowerCase().includes(query) || q.answer.toLowerCase().includes(query)
    })
  })).filter(category => category.questions.length > 0)

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      <main className="flex-1 max-w-4xl mx-auto px-4 py-12 w-full">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">{t.faq.title}</h1>
          <p className="text-lg text-gray-600">
            {t.faq.subtitle}
          </p>
        </div>

        {/* Search Bar */}
        <div className="mb-8">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder={t.faq.searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-lg"
            />
          </div>
        </div>

        {/* Category Filter */}
        <div className="mb-6 flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedCategory === null
                ? 'bg-primary-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            {t.faq.all}
          </button>
          {faqCategories.map(category => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedCategory === category.id
                  ? 'bg-primary-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              {category.title}
            </button>
          ))}
        </div>

        {/* FAQ Items */}
        <div className="space-y-6">
          {filteredQuestions.map((category) => (
            <div key={category.id} className="bg-white rounded-lg shadow-md border border-gray-200">
              <div className="p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">{category.title}</h2>
                <div className="space-y-4">
                  {category.questions.map((faq, index) => {
                    const key = `${category.id}-${index}`
                    const isOpen = openQuestions.has(key)
                    return (
                      <div key={index} className="border-b border-gray-200 last:border-b-0 pb-4 last:pb-0">
                        <button
                          onClick={() => toggleQuestion(category.id, index)}
                          className="w-full flex items-center justify-between text-left py-2 hover:text-primary-600 transition-colors"
                        >
                          <span className="font-semibold text-gray-900 pr-4">{faq.question}</span>
                          {isOpen ? (
                            <ChevronUp className="h-5 w-5 text-gray-400 flex-shrink-0" />
                          ) : (
                            <ChevronDown className="h-5 w-5 text-gray-400 flex-shrink-0" />
                          )}
                        </button>
                        {isOpen && (
                          <div className="mt-3 text-gray-600 leading-relaxed pl-0">
                            {faq.answer}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* No Results */}
        {filteredQuestions.length === 0 && (
          <div className="text-center py-12">
            <HelpCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">{t.faq.noResults}</h3>
            <p className="text-gray-600 mb-6">{t.faq.noResultsDesc}</p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                href="/help"
                className="inline-block px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                {t.faq.helpCenter}
              </Link>
              <Link
                href="/contact"
                className="inline-block px-6 py-3 bg-white text-primary-600 border-2 border-primary-600 rounded-lg hover:bg-primary-50 transition-colors"
              >
                {t.faq.contactUs}
              </Link>
            </div>
          </div>
        )}

        {/* Contact CTA */}
        <div className="mt-12 bg-primary-50 border border-primary-200 rounded-lg p-8 text-center">
          <h3 className="text-2xl font-bold text-gray-900 mb-2">{t.faq.questionNotFound}</h3>
          <p className="text-gray-600 mb-6">
            {t.faq.questionNotFoundDesc}
          </p>
          <Link
            href="/contact"
            className="inline-block px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
          >
            {t.faq.contactUs}
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  )
}

