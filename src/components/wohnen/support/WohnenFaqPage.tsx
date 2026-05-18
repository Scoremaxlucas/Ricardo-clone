'use client'

import { WOHNEN_FAQ_CATEGORY_IDS, type WohnenFaqCategoryId } from '@/lib/wohnen-support/help-categories'
import { wohnenBtnPrimary, wohnenCtaBox, wohnenInputFocus, wohnenLink } from '@/lib/wohnen-support/brand-classes'
import { useLanguage } from '@/contexts/LanguageContext'
import { ChevronDown, ChevronUp, HelpCircle, Search } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

export function WohnenFaqPage() {
  const { t } = useLanguage()
  const ws = t.wohnenSupport
  const [searchQuery, setSearchQuery] = useState('')
  const [openQuestions, setOpenQuestions] = useState<Set<string>>(new Set())
  const [selectedCategory, setSelectedCategory] = useState<WohnenFaqCategoryId | null>(null)

  const faqCategories = WOHNEN_FAQ_CATEGORY_IDS.map(id => ({
    id,
    title: ws.faq[id],
    questions: ws.faqQuestions[id],
  }))

  const toggleQuestion = (categoryId: string, questionIndex: number) => {
    const key = `${categoryId}-${questionIndex}`
    const next = new Set(openQuestions)
    if (next.has(key)) next.delete(key)
    else next.add(key)
    setOpenQuestions(next)
  }

  const filtered = faqCategories
    .filter(cat => !selectedCategory || cat.id === selectedCategory)
    .map(cat => ({
      ...cat,
      questions: cat.questions.filter(q => {
        if (!searchQuery) return true
        const query = searchQuery.toLowerCase()
        return q.question.toLowerCase().includes(query) || q.answer.toLowerCase().includes(query)
      }),
    }))
    .filter(cat => cat.questions.length > 0)

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8 sm:py-12">
      <div className="mb-6 sm:mb-8">
        <h1 className="mb-2 text-2xl font-bold tracking-tight text-[#0d2b1f] sm:text-4xl">{ws.faq.title}</h1>
        <p className="text-sm text-[#5a7a6e] sm:text-lg">{ws.faq.subtitle}</p>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
        <input
          type="search"
          placeholder={ws.faq.searchPlaceholder}
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className={`w-full rounded-lg border border-slate-200 py-3 pl-10 pr-4 ${wohnenInputFocus}`}
        />
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setSelectedCategory(null)}
          className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
            selectedCategory === null ? 'bg-[#18a87c] text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          {ws.faq.all}
        </button>
        {WOHNEN_FAQ_CATEGORY_IDS.map(id => (
          <button
            key={id}
            type="button"
            onClick={() => setSelectedCategory(id)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              selectedCategory === id ? 'bg-[#18a87c] text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            {ws.faq[id]}
          </button>
        ))}
      </div>

      <div className="space-y-6">
        {filtered.map(category => (
          <section key={category.id}>
            <h2 className="mb-3 text-lg font-bold text-[#0d2b1f] sm:text-xl">{category.title}</h2>
            <div className="space-y-2">
              {category.questions.map((q, index) => {
                const key = `${category.id}-${index}`
                const isOpen = openQuestions.has(key)
                return (
                  <div key={key} className="overflow-hidden rounded-lg border border-[#d4eee4] bg-white">
                    <button
                      type="button"
                      onClick={() => toggleQuestion(category.id, index)}
                      className="flex w-full items-center justify-between p-4 text-left transition-colors hover:bg-[#f5fdfb]"
                    >
                      <span className="pr-4 font-medium text-slate-900">{q.question}</span>
                      {isOpen ?
                        <ChevronUp className="h-5 w-5 shrink-0 text-[#18a87c]" />
                      : <ChevronDown className="h-5 w-5 shrink-0 text-slate-400" />}
                    </button>
                    {isOpen && (
                      <div className="border-t border-[#d4eee4] bg-[#f5fdfb] px-4 py-3 text-sm leading-relaxed text-[#3d5c50] sm:text-base">
                        {q.answer}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </section>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="py-12 text-center">
          <HelpCircle className="mx-auto mb-4 h-16 w-16 text-slate-300" />
          <h3 className="mb-2 text-xl font-semibold text-[#0d2b1f]">{ws.faq.noResults}</h3>
          <p className="mb-6 text-[#5a7a6e]">{ws.faq.noResultsDesc}</p>
          <Link href="/contact" className={wohnenBtnPrimary}>
            {ws.faq.contactUs}
          </Link>
        </div>
      )}

      <div className={`mt-10 p-6 text-center sm:p-8 ${wohnenCtaBox}`}>
        <h3 className="mb-2 text-lg font-bold text-[#0d2b1f]">{ws.faq.questionNotFound}</h3>
        <p className="mb-4 text-sm text-[#5a7a6e]">{ws.faq.questionNotFoundDesc}</p>
        <div className="flex flex-col justify-center gap-3 sm:flex-row">
          <Link href="/contact" className={wohnenBtnPrimary}>
            {ws.faq.contactUs}
          </Link>
          <Link href="/help" className={`text-sm font-medium ${wohnenLink}`}>
            {ws.faq.helpCenter}
          </Link>
        </div>
      </div>
    </main>
  )
}
