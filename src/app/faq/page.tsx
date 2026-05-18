'use client'

import { WohnenFaqPage } from '@/components/wohnen/support/WohnenFaqPage'
import { useWohnenUiBrand } from '@/contexts/WohnenUiBrandContext'
import { useState } from 'react'
import Link from 'next/link'
import { Search, ChevronDown, ChevronUp, HelpCircle } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'

// FAQ categories will be loaded from translations

export default function FAQPage() {
  const wohnen = useWohnenUiBrand()
  const { t } = useLanguage()
  const [searchQuery, setSearchQuery] = useState('')
  const [openQuestions, setOpenQuestions] = useState<Set<string>>(new Set())
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  if (wohnen) return <WohnenFaqPage />

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
    <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8 sm:py-12">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="mb-2 text-2xl font-bold text-gray-900 sm:mb-4 sm:text-4xl">{t.faq.title}</h1>
          <p className="text-sm text-gray-600 sm:text-lg">{t.faq.subtitle}</p>
        </div>

        {/* Search Bar */}
        <div className="mb-6 sm:mb-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-gray-400 sm:left-4 sm:h-5 sm:w-5" />
            <input
              type="text"
              placeholder={t.faq.searchPlaceholder}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-gray-300 py-3 pl-10 pr-4 text-base focus:border-primary-500 focus:ring-2 focus:ring-primary-500 sm:py-4 sm:pl-12 sm:text-lg"
            />
          </div>
        </div>

        {/* Category Filter - Horizontal scroll on mobile */}
        <div className="-mx-4 mb-6 overflow-x-auto px-4 sm:mx-0 sm:overflow-visible sm:px-0">
          <div className="flex gap-2 pb-2 sm:flex-wrap sm:pb-0">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`flex-shrink-0 whitespace-nowrap rounded-lg px-3 py-2 text-xs font-medium transition-colors sm:px-4 sm:text-sm ${
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
                className={`flex-shrink-0 whitespace-nowrap rounded-lg px-3 py-2 text-xs font-medium transition-colors sm:px-4 sm:text-sm ${
                  selectedCategory === category.id
                    ? 'bg-primary-600 text-white'
                    : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                {category.title}
              </button>
            ))}
          </div>
        </div>

        {/* FAQ Items */}
        <div className="space-y-4 sm:space-y-6">
          {filteredQuestions.map(category => (
            <div key={category.id} className="rounded-lg border border-gray-200 bg-white shadow-md">
              <div className="p-4 sm:p-6">
                <h2 className="mb-3 text-lg font-bold text-gray-900 sm:mb-4 sm:text-2xl">{category.title}</h2>
                <div className="space-y-3 sm:space-y-4">
                  {category.questions.map((faq, index) => {
                    const key = `${category.id}-${index}`
                    const isOpen = openQuestions.has(key)
                    return (
                      <div
                        key={index}
                        className="border-b border-gray-200 pb-3 last:border-b-0 last:pb-0 sm:pb-4"
                      >
                        <button
                          onClick={() => toggleQuestion(category.id, index)}
                          className="flex w-full items-start justify-between gap-2 py-1 text-left transition-colors hover:text-primary-600 sm:items-center sm:py-2"
                        >
                          <span className="text-sm font-semibold text-gray-900 sm:text-base">{faq.question}</span>
                          {isOpen ? (
                            <ChevronUp className="mt-0.5 h-4 w-4 flex-shrink-0 text-gray-400 sm:mt-0 sm:h-5 sm:w-5" />
                          ) : (
                            <ChevronDown className="mt-0.5 h-4 w-4 flex-shrink-0 text-gray-400 sm:mt-0 sm:h-5 sm:w-5" />
                          )}
                        </button>
                        {isOpen && (
                          <div className="mt-2 text-sm leading-relaxed text-gray-600 sm:mt-3 sm:text-base">
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
          <div className="py-8 text-center sm:py-12">
            <HelpCircle className="mx-auto mb-3 h-12 w-12 text-gray-400 sm:mb-4 sm:h-16 sm:w-16" />
            <h3 className="mb-2 text-lg font-semibold text-gray-900 sm:text-xl">{t.faq.noResults}</h3>
            <p className="mb-4 text-sm text-gray-600 sm:mb-6 sm:text-base">{t.faq.noResultsDesc}</p>
            <div className="flex flex-col justify-center gap-3 sm:flex-row sm:gap-4">
              <Link
                href="/help"
                className="inline-block rounded-lg bg-primary-600 px-5 py-2.5 text-sm text-white transition-colors hover:bg-primary-700 sm:px-6 sm:py-3 sm:text-base"
              >
                {t.faq.helpCenter}
              </Link>
              <Link
                href="/contact"
                className="inline-block rounded-lg border-2 border-primary-600 bg-white px-5 py-2.5 text-sm text-primary-600 transition-colors hover:bg-primary-50 sm:px-6 sm:py-3 sm:text-base"
              >
                {t.faq.contactUs}
              </Link>
            </div>
          </div>
        )}

        {/* Contact CTA */}
        <div className="mt-8 rounded-lg border border-primary-200 bg-primary-50 p-4 text-center sm:mt-12 sm:p-8">
          <h3 className="mb-2 text-lg font-bold text-gray-900 sm:text-2xl">{t.faq.questionNotFound}</h3>
          <p className="mb-4 text-sm text-gray-600 sm:mb-6 sm:text-base">{t.faq.questionNotFoundDesc}</p>
          <Link
            href="/contact"
            className="inline-block rounded-lg bg-primary-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-700 sm:px-6 sm:py-3 sm:text-base"
          >
            {t.faq.contactUs}
          </Link>
        </div>
    </main>
  )
}
