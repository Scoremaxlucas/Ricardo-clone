'use client'

import { WOHNEN_CONTACT_CATEGORIES } from '@/lib/wohnen-support/help-categories'
import { wohnenBtnOutline, wohnenBtnPrimary, wohnenCtaBox, wohnenInputFocus, wohnenLink } from '@/lib/wohnen-support/brand-classes'
import { useLanguage } from '@/contexts/LanguageContext'
import { AlertCircle, CheckCircle, Mail, Phone, Send } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { toast } from 'react-hot-toast'

export function WohnenContactPage() {
  const { t } = useLanguage()
  const c = t.wohnenSupport.contact
  const [formData, setFormData] = useState({ category: '', subject: '', message: '', email: '' })
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const categories = WOHNEN_CONTACT_CATEGORIES.map(cat => ({
    value: cat.value,
    label: c[cat.labelKey],
  }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.category || !formData.subject || !formData.message || !formData.email) {
      toast.error(c.fillAllFields)
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
        toast.success(c.successMessage)
        setSubmitted(true)
        setFormData({ category: '', subject: '', message: '', email: '' })
      } else {
        toast.error(data.message || c.errorMessage)
      }
    } catch {
      toast.error(c.errorMessage)
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8 sm:py-12">
        <div className="rounded-xl border border-[#d4eee4] bg-white p-8 text-center shadow-sm">
          <CheckCircle className="mx-auto mb-4 h-14 w-14 text-[#18a87c]" />
          <h2 className="mb-2 text-2xl font-bold text-[#0d2b1f]">{c.messageSent}</h2>
          <p className="mb-6 text-[#5a7a6e]">{c.messageSentDesc}</p>
          <div className="flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/" className={wohnenBtnPrimary}>
              {c.backToHome}
            </Link>
            <button type="button" onClick={() => setSubmitted(false)} className={wohnenBtnOutline}>
              {c.sendAnother}
            </button>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8 sm:py-12">
      <div className="mb-8">
        <h1 className="mb-2 text-2xl font-bold tracking-tight text-[#0d2b1f] sm:text-4xl">{c.title}</h1>
        <p className="text-sm text-[#5a7a6e] sm:text-lg">{c.subtitle}</p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="order-1 lg:order-2 lg:col-span-2">
          <div className="rounded-xl border border-[#d4eee4] bg-white p-6 shadow-sm sm:p-8">
            <h2 className="mb-6 text-xl font-bold text-[#0d2b1f]">{c.sendMessage}</h2>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="category" className="mb-1 block text-sm font-medium text-slate-700">
                  {c.categoryRequired}
                </label>
                <select
                  id="category"
                  value={formData.category}
                  onChange={e => setFormData({ ...formData, category: e.target.value })}
                  className={`w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm ${wohnenInputFocus}`}
                  required
                >
                  <option value="">{c.pleaseSelect}</option>
                  {categories.map(cat => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="email" className="mb-1 block text-sm font-medium text-slate-700">
                  {c.yourEmailRequired}
                </label>
                <input
                  type="email"
                  id="email"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  className={`w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm ${wohnenInputFocus}`}
                  placeholder={c.emailPlaceholder}
                  required
                />
              </div>
              <div>
                <label htmlFor="subject" className="mb-1 block text-sm font-medium text-slate-700">
                  {c.subjectRequired}
                </label>
                <input
                  type="text"
                  id="subject"
                  value={formData.subject}
                  onChange={e => setFormData({ ...formData, subject: e.target.value })}
                  className={`w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm ${wohnenInputFocus}`}
                  placeholder={c.subjectPlaceholder}
                  required
                />
              </div>
              <div>
                <label htmlFor="message" className="mb-1 block text-sm font-medium text-slate-700">
                  {c.messageRequired}
                </label>
                <textarea
                  id="message"
                  value={formData.message}
                  onChange={e => setFormData({ ...formData, message: e.target.value })}
                  rows={6}
                  className={`w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm ${wohnenInputFocus}`}
                  placeholder={c.messagePlaceholder}
                  required
                />
              </div>
              <div className="flex items-start gap-2">
                <input type="checkbox" id="privacy" className="mt-1" required />
                <label htmlFor="privacy" className="text-xs text-slate-600 sm:text-sm">
                  {c.privacyAgreement}{' '}
                  <Link href="/privacy" className={wohnenLink}>
                    Datenschutz
                  </Link>
                </label>
              </div>
              <button type="submit" disabled={submitting} className={`flex w-full items-center justify-center gap-2 disabled:opacity-50 ${wohnenBtnPrimary}`}>
                {submitting ?
                  <span>{c.sending}</span>
                : <>
                    <Send className="h-5 w-5" />
                    {c.send}
                  </>
                }
              </button>
            </form>
          </div>
        </div>

        <div className="order-2 space-y-4 lg:order-1">
          <div className="rounded-xl border border-[#d4eee4] bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-bold text-[#0d2b1f]">{c.contactMethods}</h2>
            <div className="space-y-4">
              <div className="flex gap-3">
                <Mail className="mt-0.5 h-5 w-5 shrink-0 text-[#18a87c]" />
                <div>
                  <p className="font-semibold text-slate-900">{c.email}</p>
                  <a href={`mailto:${c.emailAddress}`} className={`text-sm ${wohnenLink}`}>
                    {c.emailAddress}
                  </a>
                  <p className="mt-1 text-xs text-[#5a7a6e]">{c.emailResponseTime}</p>
                </div>
              </div>
              <div className="flex gap-3">
                <Phone className="mt-0.5 h-5 w-5 shrink-0 text-[#18a87c]" />
                <div>
                  <p className="font-semibold text-slate-900">{c.phone}</p>
                  <a href={`tel:${c.phoneNumber.replace(/\s/g, '')}`} className={`text-sm ${wohnenLink}`}>
                    {c.phoneNumber}
                  </a>
                  <p className="mt-1 text-xs text-[#5a7a6e]">{c.phoneHours}</p>
                </div>
              </div>
            </div>
          </div>

          <div className={`p-4 sm:p-5 ${wohnenCtaBox}`}>
            <div className="flex gap-2">
              <AlertCircle className="h-5 w-5 shrink-0 text-[#18a87c]" />
              <div>
                <p className="text-sm font-semibold text-[#0d2b1f]">{c.note}</p>
                <p className="mt-1 text-xs text-[#5a7a6e] sm:text-sm">{c.noteText}</p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-[#d4eee4] bg-white p-5 shadow-sm">
            <h3 className="mb-2 text-sm font-semibold text-[#0d2b1f]">{c.moreHelp}</h3>
            <ul className="space-y-1 text-sm">
              <li>
                <Link href="/help" className={wohnenLink}>
                  {c.helpCenter}
                </Link>
              </li>
              <li>
                <Link href="/faq" className={wohnenLink}>
                  {c.faq}
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </main>
  )
}
