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
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Header />
        <main className="flex-1 max-w-4xl mx-auto px-4 py-12 w-full">
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <AlertCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{t.helpArticle.articleNotFound}</h2>
            <p className="text-gray-600 mb-6">{t.helpArticle.articleNotFoundDesc}</p>
            <Link
              href="/help"
              className="inline-block px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
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
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      <main className="flex-1 max-w-4xl mx-auto px-4 py-12 w-full">
        {/* Back Button */}
        <Link
          href="/help"
          className="inline-flex items-center text-primary-600 hover:text-primary-700 mb-6"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          {t.helpArticle.backToHelpCenter}
        </Link>

        {/* Article */}
        <article className="bg-white rounded-lg shadow-md border border-gray-200 p-8">
          {/* Header */}
          <div className="mb-6 pb-6 border-b border-gray-200">
            <div className="text-sm text-gray-500 mb-2">{t.help[article.category.toLowerCase() as keyof typeof t.help] || article.category}</div>
            <h1 className="text-3xl font-bold text-gray-900">{article.title}</h1>
          </div>

          {/* Content */}
          <div className="prose max-w-none">
            <div className="space-y-4">
              {article.content.map((paragraph, index) => (
                <p key={index} className="text-gray-700 leading-relaxed">
                  {paragraph}
                </p>
              ))}
            </div>

            {/* Tips */}
            {article.tips && article.tips.length > 0 && (
              <div className="mt-8 bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
                <div className="flex items-start gap-3">
                  <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-blue-900 mb-2">{t.helpArticle.tips}</h3>
                    <ul className="list-disc list-inside space-y-1 text-blue-800">
                      {article.tips.map((tip, index) => (
                        <li key={index}>{tip}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Warnings */}
            {article.warnings && article.warnings.length > 0 && (
              <div className="mt-6 bg-red-50 border-l-4 border-red-500 p-4 rounded">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-red-900 mb-2">{t.helpArticle.important}</h3>
                    <ul className="list-disc list-inside space-y-1 text-red-800">
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
          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-600 mb-4">
              {t.helpArticle.wasHelpful}
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                href="/contact"
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm"
              >
                {t.helpArticle.contactUs}
              </Link>
              <Link
                href="/faq"
                className="px-4 py-2 bg-white text-primary-600 border-2 border-primary-600 rounded-lg hover:bg-primary-50 transition-colors text-sm"
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

