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
    return (
      category.title.toLowerCase().includes(query) ||
      category.questions.some(
        q => q.question.toLowerCase().includes(query) || q.answer.toLowerCase().includes(query)
      )
    )
  })

  const filteredQuestions = filteredCategories
    .map(category => ({
      ...category,
      questions: category.questions.filter(q => {
        if (!searchQuery) return true
        const query = searchQuery.toLowerCase()
        return q.question.toLowerCase().includes(query) || q.answer.toLowerCase().includes(query)
      }),
    }))
    .filter(category => category.questions.length > 0)

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <Header />
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="mb-4 text-4xl font-bold text-gray-900">{t.faq.title}</h1>
          <p className="text-lg text-gray-600">{t.faq.subtitle}</p>
        </div>

        {/* Search Bar */}
        <div className="mb-8">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 transform text-gray-400" />
            <input
              type="text"
              placeholder={t.faq.searchPlaceholder}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-gray-300 py-4 pl-12 pr-4 text-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>

        {/* Category Filter */}
        <div className="mb-6 flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              selectedCategory === null
                ? 'bg-primary-600 text-white'
                : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            {t.faq.all}
          </button>
          {faqCategories.map(category => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                selectedCategory === category.id
                  ? 'bg-primary-600 text-white'
                  : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              {category.title}
            </button>
          ))}
        </div>

        {/* FAQ Items */}
        <div className="space-y-6">
          {filteredQuestions.map(category => (
            <div key={category.id} className="rounded-lg border border-gray-200 bg-white shadow-md">
              <div className="p-6">
                <h2 className="mb-4 text-2xl font-bold text-gray-900">{category.title}</h2>
                <div className="space-y-4">
                  {category.questions.map((faq, index) => {
                    const key = `${category.id}-${index}`
                    const isOpen = openQuestions.has(key)
                    return (
                      <div
                        key={index}
                        className="border-b border-gray-200 pb-4 last:border-b-0 last:pb-0"
                      >
                        <button
                          onClick={() => toggleQuestion(category.id, index)}
                          className="flex w-full items-center justify-between py-2 text-left transition-colors hover:text-primary-600"
                        >
                          <span className="pr-4 font-semibold text-gray-900">{faq.question}</span>
                          {isOpen ? (
                            <ChevronUp className="h-5 w-5 flex-shrink-0 text-gray-400" />
                          ) : (
                            <ChevronDown className="h-5 w-5 flex-shrink-0 text-gray-400" />
                          )}
                        </button>
                        {isOpen && (
                          <div className="mt-3 pl-0 leading-relaxed text-gray-600">
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
          <div className="py-12 text-center">
            <HelpCircle className="mx-auto mb-4 h-16 w-16 text-gray-400" />
            <h3 className="mb-2 text-xl font-semibold text-gray-900">{t.faq.noResults}</h3>
            <p className="mb-6 text-gray-600">{t.faq.noResultsDesc}</p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                href="/help"
                className="inline-block rounded-lg bg-primary-600 px-6 py-3 text-white transition-colors hover:bg-primary-700"
              >
                {t.faq.helpCenter}
              </Link>
              <Link
                href="/contact"
                className="inline-block rounded-lg border-2 border-primary-600 bg-white px-6 py-3 text-primary-600 transition-colors hover:bg-primary-50"
              >
                {t.faq.contactUs}
              </Link>
            </div>
          </div>
        )}

        {/* Contact CTA */}
        <div className="mt-12 rounded-lg border border-primary-200 bg-primary-50 p-8 text-center">
          <h3 className="mb-2 text-2xl font-bold text-gray-900">{t.faq.questionNotFound}</h3>
          <p className="mb-6 text-gray-600">{t.faq.questionNotFoundDesc}</p>
          <Link
            href="/contact"
            className="inline-block rounded-lg bg-primary-600 px-6 py-3 font-medium text-white transition-colors hover:bg-primary-700"
          >
            {t.faq.contactUs}
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  )
}
