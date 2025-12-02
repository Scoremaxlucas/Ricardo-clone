'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { ArrowLeft, BookOpen, CheckCircle, AlertCircle, Info } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'

export default function HelpArticlePage() {
  const params = useParams()
  const { t } = useLanguage()
  const slug = params?.slug as string
  const article = t.helpArticles[slug as keyof typeof t.helpArticles]

  if (!article) {
    return (
      <div className="flex min-h-screen flex-col bg-gray-50">
        <Header />
        <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-12">
          <div className="rounded-lg bg-white p-8 text-center shadow-md">
            <AlertCircle className="mx-auto mb-4 h-16 w-16 text-gray-400" />
            <h2 className="mb-2 text-2xl font-bold text-gray-900">
              {t.helpArticle.articleNotFound}
            </h2>
            <p className="mb-6 text-gray-600">{t.helpArticle.articleNotFoundDesc}</p>
            <Link
              href="/help"
              className="inline-block rounded-lg bg-primary-600 px-6 py-3 text-white transition-colors hover:bg-primary-700"
            >
              {t.helpArticle.backToHelpCenter}
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <Header />
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-12">
        {/* Back Button */}
        <Link
          href="/help"
          className="mb-6 inline-flex items-center text-primary-600 hover:text-primary-700"
        >
          <ArrowLeft className="mr-2 h-5 w-5" />
          {t.helpArticle.backToHelpCenter}
        </Link>

        {/* Article */}
        <article className="rounded-lg border border-gray-200 bg-white p-8 shadow-md">
          {/* Header */}
          <div className="mb-6 border-b border-gray-200 pb-6">
            <div className="mb-2 text-sm text-gray-500">
              {t.help[article.category.toLowerCase() as keyof typeof t.help] || article.category}
            </div>
            <h1 className="text-3xl font-bold text-gray-900">{article.title}</h1>
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
              <div className="mt-8 rounded border-l-4 border-blue-500 bg-blue-50 p-4">
                <div className="flex items-start gap-3">
                  <Info className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-600" />
                  <div>
                    <h3 className="mb-2 font-semibold text-blue-900">{t.helpArticle.tips}</h3>
                    <ul className="list-inside list-disc space-y-1 text-blue-800">
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
              <Link
                href="/contact"
                className="rounded-lg bg-primary-600 px-4 py-2 text-sm text-white transition-colors hover:bg-primary-700"
              >
                {t.helpArticle.contactUs}
              </Link>
              <Link
                href="/faq"
                className="rounded-lg border-2 border-primary-600 bg-white px-4 py-2 text-sm text-primary-600 transition-colors hover:bg-primary-50"
              >
                {t.helpArticle.moreQuestions}
              </Link>
            </div>
          </div>
        </article>
      </main>
      <Footer />
    </div>
  )
}
