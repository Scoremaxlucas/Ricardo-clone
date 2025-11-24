'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { translations, Language, Translation } from '@/translations'
import { subcategories_de } from '@/translations/subcategories-de'
import { subcategories_en } from '@/translations/subcategories-en'
import { subcategories_fr } from '@/translations/subcategories-fr'
import { subcategories_it } from '@/translations/subcategories-it'

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

  // Load language from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedLanguage = localStorage.getItem('language') as Language | null
      if (savedLanguage && translations[savedLanguage]) {
        setLanguageState(savedLanguage)
      }
    }
  }, [])

  // Save language to localStorage when it changes
  const setLanguage = (lang: Language) => {
    setLanguageState(lang)
    if (typeof window !== 'undefined') {
      localStorage.setItem('language', lang)
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

