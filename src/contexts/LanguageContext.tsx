'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { translations, Language, Translation } from '@/translations'
import { subcategories_de } from '@/translations/subcategories-de'
import { subcategories_en } from '@/translations/subcategories-en'
import { subcategories_fr } from '@/translations/subcategories-fr'
import { subcategories_it } from '@/translations/subcategories-it'
import { useSession } from 'next-auth/react'

const subcategoryTranslations = {
  de: subcategories_de,
  en: subcategories_en,
  fr: subcategories_fr,
  it: subcategories_it,
}

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: Translation
  translateSubcategory: (subcategory: string) => string
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>('de')
  const { data: session, status } = useSession()

  // Load language from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedLanguage = localStorage.getItem('language') as Language | null
      if (savedLanguage && translations[savedLanguage]) {
        setLanguageState(savedLanguage)
      }
    }
  }, [])

  // Sync language from server when authenticated (used for locale-aware emails).
  useEffect(() => {
    const syncFromServer = async () => {
      if (status !== 'authenticated' || !(session?.user as { id?: string })?.id) return
      try {
        const res = await fetch('/api/user/language')
        if (!res.ok) return
        const data = await res.json()
        const serverLanguage = data?.language as Language | undefined
        if (serverLanguage && translations[serverLanguage] && serverLanguage !== language) {
          setLanguageState(serverLanguage)
          localStorage.setItem('language', serverLanguage)
        }
      } catch {
        // Non-fatal: local language still works.
      }
    }
    syncFromServer()
  }, [status, (session?.user as { id?: string })?.id])

  // Save language to localStorage when it changes
  const setLanguage = (lang: Language) => {
    setLanguageState(lang)
    if (typeof window !== 'undefined') {
      localStorage.setItem('language', lang)
    }
    if (status === 'authenticated' && (session?.user as { id?: string })?.id) {
      fetch('/api/user/language', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ language: lang }),
      }).catch(() => {})
    }
  }

  const t = translations[language]

  const translateSubcategory = (subcategory: string): string => {
    return subcategoryTranslations[language][subcategory] || subcategory
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, translateSubcategory }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}
