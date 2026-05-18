'use client'

import { WOHNEN_HELP_CATEGORIES } from '@/lib/wohnen-support/help-categories'
import { wohnenBtnOutline, wohnenBtnPrimary, wohnenCtaBox, wohnenInputFocus } from '@/lib/wohnen-support/brand-classes'
import { useLanguage } from '@/contexts/LanguageContext'
import { BookOpen, ChevronRight, HelpCircle, MessageCircle, Search } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

export function WohnenHelpPage() {
  const { t } = useLanguage()
  const ws = t.wohnenSupport
  const [searchQuery, setSearchQuery] = useState('')

  const filteredCategories = WOHNEN_HELP_CATEGORIES.filter(category => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    const title = ws.help[category.titleKey].toLowerCase()
    return (
      title.includes(query) ||
      category.articles.some(article => {
        const data = t.helpArticles[article.slug as keyof typeof t.helpArticles]
        return data?.title.toLowerCase().includes(query) ?? false
      })
    )
  })

  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:py-12 md:py-16">
      <div className="mb-6 sm:mb-8">
        <h1 className="mb-2 text-xl font-bold tracking-tight text-[#0d2b1f] sm:text-3xl md:text-4xl">{ws.help.title}</h1>
        <p className="text-sm text-[#5a7a6e] sm:text-lg">{ws.help.subtitle}</p>
      </div>

      <div className="mb-6 sm:mb-8">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            placeholder={ws.help.searchPlaceholder}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className={`w-full rounded-lg border border-slate-200 py-3 pl-10 pr-4 text-base sm:py-4 ${wohnenInputFocus}`}
          />
        </div>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2">
        <Link
          href="/faq"
          className="rounded-xl border border-[#d4eee4] bg-white p-4 shadow-sm transition-shadow hover:shadow-md sm:p-6"
        >
          <div className="mb-2 flex items-center gap-2">
            <HelpCircle className="h-6 w-6 text-[#18a87c]" />
            <h3 className="text-lg font-semibold text-[#0d2b1f]">{ws.help.faq}</h3>
          </div>
          <p className="text-sm text-[#5a7a6e]">{ws.help.faqDesc}</p>
        </Link>
        <Link
          href="/contact"
          className="rounded-xl border border-[#d4eee4] bg-white p-4 shadow-sm transition-shadow hover:shadow-md sm:p-6"
        >
          <div className="mb-2 flex items-center gap-2">
            <MessageCircle className="h-6 w-6 text-[#18a87c]" />
            <h3 className="text-lg font-semibold text-[#0d2b1f]">{ws.help.contact}</h3>
          </div>
          <p className="text-sm text-[#5a7a6e]">{ws.help.contactDesc}</p>
        </Link>
      </div>

      <div className="space-y-4 sm:space-y-6">
        {filteredCategories.map(category => {
          const Icon = category.icon
          return (
            <section key={category.id} className="rounded-xl border border-[#d4eee4] bg-white shadow-sm">
              <div className="p-4 sm:p-6">
                <div className="mb-4 flex items-center gap-3">
                  <div className={`rounded-lg p-2.5 ${category.color}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <h2 className="text-xl font-bold text-[#0d2b1f] sm:text-2xl">{ws.help[category.titleKey]}</h2>
                </div>
                <ul className="grid grid-cols-1 gap-2 md:grid-cols-2">
                  {category.articles.map(article => {
                    const data = t.helpArticles[article.slug as keyof typeof t.helpArticles]
                    return (
                      <li key={article.slug}>
                        <Link
                          href={`/help/${article.slug}`}
                          className="flex items-center justify-between rounded-lg border border-slate-100 p-3 transition-colors hover:bg-[#f5fdfb] sm:p-4"
                        >
                          <span className="text-sm font-medium text-slate-800 sm:text-base">{data?.title ?? article.slug}</span>
                          <ChevronRight className="h-5 w-5 shrink-0 text-slate-400" />
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              </div>
            </section>
          )
        })}
      </div>

      {filteredCategories.length === 0 && (
        <div className="py-12 text-center">
          <BookOpen className="mx-auto mb-4 h-16 w-16 text-slate-300" />
          <h3 className="mb-2 text-xl font-semibold text-[#0d2b1f]">{ws.help.noResults}</h3>
          <p className="mb-6 text-[#5a7a6e]">{ws.help.noResultsDesc}</p>
          <Link href="/contact" className={wohnenBtnPrimary}>
            {ws.help.contactUs}
          </Link>
        </div>
      )}

      <div className={`mt-12 p-6 text-center sm:p-8 ${wohnenCtaBox}`}>
        <h3 className="mb-2 text-xl font-bold text-[#0d2b1f] sm:text-2xl">{ws.help.stillQuestions}</h3>
        <p className="mb-6 text-sm text-[#5a7a6e] sm:text-base">{ws.help.stillQuestionsDesc}</p>
        <div className="flex flex-col justify-center gap-3 sm:flex-row sm:gap-4">
          <Link href="/contact" className={wohnenBtnPrimary}>
            {ws.help.contactForm}
          </Link>
          <Link href="/faq" className={wohnenBtnOutline}>
            {ws.help.viewFAQ}
          </Link>
        </div>
      </div>
    </main>
  )
}
