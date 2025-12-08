'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Mail } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'
import { Logo } from '@/components/ui/Logo'

function CheckEmailPageContent() {
  const searchParams = useSearchParams()
  const email = searchParams.get('email') || ''
  const { t } = useLanguage()

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-primary-50 via-white to-primary-50 px-4 sm:px-6 lg:px-8">
      {/* Abstract background patterns */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute right-0 top-0 h-96 w-96 rounded-full bg-gradient-to-br from-primary-200/30 to-transparent opacity-40 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 h-96 w-96 rounded-full bg-gradient-to-tr from-primary-200/30 to-transparent opacity-40 blur-3xl"></div>
      </div>

      <div className="relative z-10 w-full max-w-md">
        <div className="text-center">
          {/* Logo */}
          <div className="mx-auto mb-8">
            <Logo />
          </div>

          {/* Email Icon */}
          <div className="mx-auto mb-8 flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-primary-200/20 blur-xl"></div>
              <div className="relative rounded-full border-2 border-primary-200 bg-primary-50 p-6 shadow-lg">
                <Mail className="h-12 w-12 text-primary-600" strokeWidth={1.5} />
              </div>
            </div>
          </div>

          {/* Heading */}
          <h1 className="mb-4 text-3xl font-bold text-gray-900">{t.checkEmail.title}</h1>

          {/* Description */}
          <p className="mb-8 text-lg text-gray-700">
            {t.checkEmail.description}{' '}
            <span className="font-semibold text-primary-700">{email || t.checkEmail.description}</span>
            {t.checkEmail.sent}
          </p>

          {/* Instructions */}
          <div className="mb-8 rounded-lg border border-primary-200 bg-white p-6 text-left shadow-sm">
            <p className="mb-3 text-sm font-semibold text-gray-900">
              {t.checkEmail.nextSteps}
            </p>
            <ol className="list-inside list-decimal space-y-2 text-sm text-gray-700">
              <li>{t.checkEmail.step1}</li>
              <li>{t.checkEmail.step2}</li>
              <li>{t.checkEmail.step3}</li>
            </ol>
          </div>

          {/* CTA Button */}
          <Link
            href="/login"
            className="inline-flex w-full items-center justify-center rounded-lg bg-primary-600 px-6 py-3 font-medium text-white transition-colors duration-200 hover:bg-primary-700 shadow-md hover:shadow-lg"
          >
            {t.checkEmail.goToLogin} →
          </Link>

          {/* Support */}
          <p className="mt-8 text-sm text-gray-600">
            {t.checkEmail.supportText}{' '}
            <a href="mailto:support@helvenda.ch" className="font-medium text-primary-600 hover:text-primary-700 hover:underline">
              {t.checkEmail.contactSupport}
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  )
}

export default function CheckEmailPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-primary-600"></div>
          <p className="text-gray-600">Laden...</p>
        </div>
      </div>
    }>
      <CheckEmailPageContent />
    </Suspense>
  )
}
