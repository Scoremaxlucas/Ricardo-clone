'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { Mail, MessageCircle, Phone, Send, CheckCircle, AlertCircle } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { useLanguage } from '@/contexts/LanguageContext'

export default function ContactPage() {
  const { t } = useLanguage()
  const [formData, setFormData] = useState({
    category: '',
    subject: '',
    message: '',
    email: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const contactCategories = [
    { value: 'technical', label: t.contact.technical },
    { value: 'account', label: t.contact.accountIssue },
    { value: 'payment', label: t.contact.paymentIssue },
    { value: 'safety', label: t.contact.safetyIssue },
    { value: 'general', label: t.contact.generalQuestion },
    { value: 'feedback', label: t.contact.feedback },
    { value: 'other', label: t.contact.other },
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.category || !formData.subject || !formData.message || !formData.email) {
      toast.error(t.contact.fillAllFields)
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email.trim())) {
      toast.error('Bitte geben Sie eine gültige E-Mail-Adresse ein.')
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await res.json()

      if (res.ok) {
        toast.success(t.contact.successMessage)
        setSubmitted(true)
        setFormData({ category: '', subject: '', message: '', email: '' })
      } else {
        toast.error(data.message || t.contact.errorMessage)
      }
    } catch (error) {
      console.error('Error submitting contact form:', error)
      toast.error(t.contact.errorMessage)
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="flex min-h-screen flex-col bg-gray-50">
        <Header />
        <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8 sm:py-12">
          <div className="rounded-lg bg-white p-4 text-center shadow-md sm:p-8">
            <CheckCircle className="mx-auto mb-3 h-12 w-12 text-green-600 sm:mb-4 sm:h-16 sm:w-16" />
            <h2 className="mb-2 text-xl font-bold text-gray-900 sm:text-2xl">{t.contact.messageSent}</h2>
            <p className="mb-4 text-sm text-gray-600 sm:mb-6 sm:text-base">{t.contact.messageSentDesc}</p>
            <div className="flex flex-col justify-center gap-3 sm:flex-row sm:gap-4">
              <Link
                href="/"
                className="rounded-lg bg-primary-600 px-5 py-2.5 text-sm text-white transition-colors hover:bg-primary-700 sm:px-6 sm:py-3 sm:text-base"
              >
                {t.contact.backToHome}
              </Link>
              <button
                onClick={() => setSubmitted(false)}
                className="rounded-lg border-2 border-primary-600 bg-white px-5 py-2.5 text-sm text-primary-600 transition-colors hover:bg-primary-50 sm:px-6 sm:py-3 sm:text-base"
              >
                {t.contact.sendAnother}
              </button>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <Header />
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8 sm:py-12">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="mb-2 text-2xl font-bold text-gray-900 sm:mb-4 sm:text-4xl">{t.contact.title}</h1>
          <p className="text-sm text-gray-600 sm:text-lg">{t.contact.subtitle}</p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:gap-8 lg:grid-cols-3">
          {/* Contact Form - First on mobile */}
          <div className="order-1 lg:order-2 lg:col-span-2">
            <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-md sm:p-6 md:p-8">
              <h2 className="mb-4 text-lg font-bold text-gray-900 sm:mb-6 sm:text-2xl">{t.contact.sendMessage}</h2>

              <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                <div>
                  <label
                    htmlFor="category"
                    className="mb-1 block text-xs font-medium text-gray-700 sm:mb-2 sm:text-sm"
                  >
                    {t.contact.categoryRequired}
                  </label>
                  <select
                    id="category"
                    value={formData.category}
                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500 sm:px-4 sm:text-base"
                    required
                  >
                    <option value="">{t.contact.pleaseSelect}</option>
                    {contactCategories.map(cat => (
                      <option key={cat.value} value={cat.value}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="email" className="mb-1 block text-xs font-medium text-gray-700 sm:mb-2 sm:text-sm">
                    {t.contact.yourEmailRequired}
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500 sm:px-4 sm:text-base"
                    placeholder={t.contact.emailPlaceholder}
                    required
                  />
                </div>

                <div>
                  <label htmlFor="subject" className="mb-1 block text-xs font-medium text-gray-700 sm:mb-2 sm:text-sm">
                    {t.contact.subjectRequired}
                  </label>
                  <input
                    type="text"
                    id="subject"
                    value={formData.subject}
                    onChange={e => setFormData({ ...formData, subject: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500 sm:px-4 sm:text-base"
                    placeholder={t.contact.subjectPlaceholder}
                    required
                  />
                </div>

                <div>
                  <label htmlFor="message" className="mb-1 block text-xs font-medium text-gray-700 sm:mb-2 sm:text-sm">
                    {t.contact.messageRequired}
                  </label>
                  <textarea
                    id="message"
                    value={formData.message}
                    onChange={e => setFormData({ ...formData, message: e.target.value })}
                    rows={6}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500 sm:px-4 sm:text-base"
                    placeholder={t.contact.messagePlaceholder}
                    required
                  />
                </div>

                <div className="flex items-start gap-2">
                  <input type="checkbox" id="privacy" className="mt-0.5 sm:mt-1" required />
                  <label htmlFor="privacy" className="text-xs text-gray-600 sm:text-sm">
                    {t.contact.privacyAgreement}
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50 sm:px-6 sm:py-3 sm:text-base"
                >
                  {submitting ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-white sm:h-5 sm:w-5"></div>
                      {t.contact.sending}
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 sm:h-5 sm:w-5" />
                      {t.contact.send}
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Contact Info - Second on mobile */}
          <div className="order-2 space-y-4 sm:space-y-6 lg:order-1 lg:col-span-1">
            <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-md sm:p-6">
              <h2 className="mb-3 text-base font-bold text-gray-900 sm:mb-4 sm:text-xl">{t.contact.contactMethods}</h2>

              <div className="space-y-3 sm:space-y-4">
                <div className="flex items-start gap-2 sm:gap-3">
                  <Mail className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary-600 sm:mt-1 sm:h-5 sm:w-5" />
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 sm:text-base">{t.contact.email}</h3>
                    <p className="text-xs text-gray-600 sm:text-sm">{t.contact.emailAddress}</p>
                    <p className="mt-0.5 text-xs text-gray-500 sm:mt-1">{t.contact.emailResponseTime}</p>
                  </div>
                </div>

                <div className="flex items-start gap-2 sm:gap-3">
                  <MessageCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary-600 sm:mt-1 sm:h-5 sm:w-5" />
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 sm:text-base">{t.contact.emmaAI}</h3>
                    <p className="text-xs text-gray-600 sm:text-sm">{t.contact.emmaAIAvailable}</p>
                    <p className="mt-0.5 text-xs text-gray-500 sm:mt-1">{t.contact.emmaAILocation}</p>
                  </div>
                </div>

                <div className="flex items-start gap-2 sm:gap-3">
                  <Phone className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary-600 sm:mt-1 sm:h-5 sm:w-5" />
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 sm:text-base">{t.contact.phone}</h3>
                    <p className="text-xs text-gray-600 sm:text-sm">{t.contact.phoneComingSoon}</p>
                    <p className="mt-0.5 text-xs text-gray-500 sm:mt-1">{t.contact.phoneWorkingOnIt}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 sm:p-6">
              <div className="flex items-start gap-2 sm:gap-3">
                <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-600 sm:mt-1 sm:h-5 sm:w-5" />
                <div>
                  <h3 className="mb-1 text-sm font-semibold text-blue-900 sm:mb-2 sm:text-base">{t.contact.note}</h3>
                  <p className="text-xs text-blue-800 sm:text-sm">{t.contact.noteText}</p>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-md sm:p-6">
              <h3 className="mb-2 text-sm font-semibold text-gray-900 sm:mb-3 sm:text-base">{t.contact.moreHelp}</h3>
              <ul className="space-y-1 sm:space-y-2">
                <li>
                  <Link href="/help" className="text-xs text-primary-600 hover:text-primary-700 sm:text-sm">
                    {t.contact.helpCenter}
                  </Link>
                </li>
                <li>
                  <Link href="/faq" className="text-xs text-primary-600 hover:text-primary-700 sm:text-sm">
                    {t.contact.faq}
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
