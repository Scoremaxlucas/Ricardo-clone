'use client'

import { wohnenBtnOutline, wohnenBtnPrimary, wohnenLink } from '@/lib/wohnen-support/brand-classes'
import { useWohnenUiBrand } from '@/contexts/WohnenUiBrandContext'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { ArrowLeft, AlertCircle, Info } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'

export default function HelpArticlePage() {
  const params = useParams()
  const wohnen = useWohnenUiBrand()
  const { t } = useLanguage()
  const slug = params?.slug as string
  const article = t.helpArticles[slug as keyof typeof t.helpArticles]
  const btnPrimary = wohnen ? wohnenBtnPrimary : 'rounded-lg bg-primary-600 px-4 py-2 text-sm text-white transition-colors hover:bg-primary-700'
  const btnOutline =
    wohnen ?
      `${wohnenBtnOutline} px-4 py-2 text-sm`
    : 'rounded-lg border-2 border-primary-600 bg-white px-4 py-2 text-sm text-primary-600 transition-colors hover:bg-primary-50'
  const backLink = wohnen ? wohnenLink : 'text-primary-600 hover:text-primary-700'
  const articleCard = wohnen ? 'rounded-xl border border-[#d4eee4] bg-white p-8 shadow-sm' : 'rounded-lg border border-gray-200 bg-white p-8 shadow-md'
  const tipsBox = wohnen ? 'mt-8 rounded border-l-4 border-[#18a87c] bg-[#f5fdfb] p-4' : 'mt-8 rounded border-l-4 border-blue-500 bg-blue-50 p-4'

  if (!article) {
    return (
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-12">
        <div className="rounded-lg bg-white p-8 text-center shadow-md">
          <AlertCircle className="mx-auto mb-4 h-16 w-16 text-gray-400" />
          <h2 className="mb-2 text-2xl font-bold text-gray-900">
            {t.helpArticle.articleNotFound}
          </h2>
          <p className="mb-6 text-gray-600">{t.helpArticle.articleNotFoundDesc}</p>
          <Link href="/help" className={`inline-block px-6 py-3 ${btnPrimary}`}>
            {t.helpArticle.backToHelpCenter}
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-12">
        {/* Back Button */}
        <Link href="/help" className={`mb-6 inline-flex items-center ${backLink}`}>
          <ArrowLeft className="mr-2 h-5 w-5" />
          {t.helpArticle.backToHelpCenter}
        </Link>

        {/* Article */}
        <article className={articleCard}>
          {/* Header */}
          <div className={`mb-6 border-b pb-6 ${wohnen ? 'border-[#d4eee4]' : 'border-gray-200'}`}>
            <div className={`mb-2 text-sm ${wohnen ? 'text-[#5a7a6e]' : 'text-gray-500'}`}>
              {wohnen ?
                article.category
              : t.help[article.category.toLowerCase() as keyof typeof t.help] || article.category}
            </div>
            <h1 className={`text-3xl font-bold ${wohnen ? 'text-[#0d2b1f]' : 'text-gray-900'}`}>{article.title}</h1>
          </div>

          {/* Content */}
          <div className="prose max-w-none">
            <div className="space-y-4">
              {article.content.map((paragraph, index) => (
                <p key={index} className="leading-relaxed text-gray-700">
                  {paragraph}
                </p>
              ))}
            </div>

            {/* Tips */}
            {'tips' in article && article.tips && article.tips.length > 0 && (
              <div className={tipsBox}>
                <div className="flex items-start gap-3">
                  <Info className={`mt-0.5 h-5 w-5 flex-shrink-0 ${wohnen ? 'text-[#18a87c]' : 'text-blue-600'}`} />
                  <div>
                    <h3 className={`mb-2 font-semibold ${wohnen ? 'text-[#0d2b1f]' : 'text-blue-900'}`}>{t.helpArticle.tips}</h3>
                    <ul className={`list-inside list-disc space-y-1 ${wohnen ? 'text-[#3d5c50]' : 'text-blue-800'}`}>
                      {article.tips.map((tip, index) => (
                        <li key={index}>{tip}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Warnings */}
            {'warnings' in article && article.warnings && article.warnings.length > 0 && (
              <div className="mt-6 rounded border-l-4 border-red-500 bg-red-50 p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-600" />
                  <div>
                    <h3 className="mb-2 font-semibold text-red-900">{t.helpArticle.important}</h3>
                    <ul className="list-inside list-disc space-y-1 text-red-800">
                      {article.warnings.map((warning, index) => (
                        <li key={index}>{warning}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="mt-8 border-t border-gray-200 pt-6">
            <p className="mb-4 text-sm text-gray-600">{t.helpArticle.wasHelpful}</p>
            <div className="flex flex-wrap gap-4">
              <Link href="/contact" className={btnPrimary}>
                {t.helpArticle.contactUs}
              </Link>
              <Link href="/faq" className={btnOutline}>
                {t.helpArticle.moreQuestions}
              </Link>
            </div>
          </div>
        </article>
    </main>
  )
}
