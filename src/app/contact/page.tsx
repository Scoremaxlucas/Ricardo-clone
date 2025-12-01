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

    setSubmitting(true)
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
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
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Header />
        <main className="flex-1 max-w-2xl mx-auto px-4 py-12 w-full">
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{t.contact.messageSent}</h2>
            <p className="text-gray-600 mb-6">
              {t.contact.messageSentDesc}
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                href="/"
                className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                {t.contact.backToHome}
              </Link>
              <button
                onClick={() => setSubmitted(false)}
                className="px-6 py-3 bg-white text-primary-600 border-2 border-primary-600 rounded-lg hover:bg-primary-50 transition-colors"
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
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      <main className="flex-1 max-w-4xl mx-auto px-4 py-12 w-full">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">{t.contact.title}</h1>
          <p className="text-lg text-gray-600">
            {t.contact.subtitle}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Contact Info */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
              <h2 className="text-xl font-bold text-gray-900 mb-4">{t.contact.contactMethods}</h2>
              
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Mail className="h-5 w-5 text-primary-600 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-gray-900">{t.contact.email}</h3>
                    <p className="text-gray-600 text-sm">{t.contact.emailAddress}</p>
                    <p className="text-gray-500 text-xs mt-1">{t.contact.emailResponseTime}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <MessageCircle className="h-5 w-5 text-primary-600 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-gray-900">{t.contact.emmaAI}</h3>
                    <p className="text-gray-600 text-sm">{t.contact.emmaAIAvailable}</p>
                    <p className="text-gray-500 text-xs mt-1">{t.contact.emmaAILocation}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Phone className="h-5 w-5 text-primary-600 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-gray-900">{t.contact.phone}</h3>
                    <p className="text-gray-600 text-sm">{t.contact.phoneComingSoon}</p>
                    <p className="text-gray-500 text-xs mt-1">{t.contact.phoneWorkingOnIt}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-blue-600 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-blue-900 mb-2">{t.contact.note}</h3>
                  <p className="text-blue-800 text-sm">
                    {t.contact.noteText}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-3">{t.contact.moreHelp}</h3>
              <ul className="space-y-2">
                <li>
                  <Link href="/help" className="text-primary-600 hover:text-primary-700 text-sm">
                    {t.contact.helpCenter}
                  </Link>
                </li>
                <li>
                  <Link href="/faq" className="text-primary-600 hover:text-primary-700 text-sm">
                    {t.contact.faq}
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md p-8 border border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">{t.contact.sendMessage}</h2>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                    {t.contact.categoryRequired}
                  </label>
                  <select
                    id="category"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    required
                  >
                    <option value="">{t.contact.pleaseSelect}</option>
                    {contactCategories.map(cat => (
                      <option key={cat.value} value={cat.value}>{cat.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    {t.contact.yourEmailRequired}
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder={t.contact.emailPlaceholder}
                    required
                  />
                </div>

                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
                    {t.contact.subjectRequired}
                  </label>
                  <input
                    type="text"
                    id="subject"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder={t.contact.subjectPlaceholder}
                    required
                  />
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                    {t.contact.messageRequired}
                  </label>
                  <textarea
                    id="message"
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    rows={8}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder={t.contact.messagePlaceholder}
                    required
                  />
                </div>

                <div className="flex items-start gap-2">
                  <input
                    type="checkbox"
                    id="privacy"
                    className="mt-1"
                    required
                  />
                  <label htmlFor="privacy" className="text-sm text-gray-600">
                    {t.contact.privacyAgreement}
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      {t.contact.sending}
                    </>
                  ) : (
                    <>
                      <Send className="h-5 w-5" />
                      {t.contact.send}
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}

