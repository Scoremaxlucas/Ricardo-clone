'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react'

// Cookie-Kategorien
export interface CookiePreferences {
  necessary: boolean // Immer true, kann nicht deaktiviert werden
  preferences: boolean // Sprache, Ansicht etc.
  analytics: boolean // Anonymisierte Analyse
}

// Consent-Status
export type ConsentStatus = 'pending' | 'accepted' | 'customized'

interface CookieConsentContextType {
  preferences: CookiePreferences
  consentStatus: ConsentStatus
  showBanner: boolean
  acceptAll: () => void
  acceptNecessaryOnly: () => void
  savePreferences: (prefs: Partial<CookiePreferences>) => void
  openSettings: () => void
  closeSettings: () => void
  showSettings: boolean
  hasConsented: boolean
}

const COOKIE_CONSENT_KEY = 'helvenda-cookie-consent'
const COOKIE_PREFERENCES_KEY = 'helvenda-cookie-preferences'
const CONSENT_DURATION_DAYS = 365 // 12 Monate

const defaultPreferences: CookiePreferences = {
  necessary: true,
  preferences: false,
  analytics: false,
}

const CookieConsentContext = createContext<CookieConsentContextType | undefined>(undefined)

function setCookie(name: string, value: string, days: number) {
  if (typeof document === 'undefined') return
  const expires = new Date()
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000)
  document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Lax`
}

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null
  const nameEQ = name + '='
  const ca = document.cookie.split(';')
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i]
    while (c.charAt(0) === ' ') c = c.substring(1, c.length)
    if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length)
  }
  return null
}

export function CookieConsentProvider({ children }: { children: ReactNode }) {
  const [preferences, setPreferences] = useState<CookiePreferences>(defaultPreferences)
  const [consentStatus, setConsentStatus] = useState<ConsentStatus>('pending')
  const [showBanner, setShowBanner] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [hasConsented, setHasConsented] = useState(false)

  // Lade gespeicherte Einstellungen beim Mount
  useEffect(() => {
    if (typeof window === 'undefined') return

    const savedConsent = getCookie(COOKIE_CONSENT_KEY)
    const savedPreferences = localStorage.getItem(COOKIE_PREFERENCES_KEY)

    if (savedConsent && savedPreferences) {
      try {
        const parsed = JSON.parse(savedPreferences)
        setPreferences({ ...defaultPreferences, ...parsed, necessary: true })
        setConsentStatus(savedConsent as ConsentStatus)
        setHasConsented(true)
        setShowBanner(false)
      } catch {
        // Bei Fehler: Banner zeigen
        setShowBanner(true)
      }
    } else {
      // Kein Consent vorhanden: Banner zeigen
      setShowBanner(true)
    }
  }, [])

  const saveConsent = useCallback((prefs: CookiePreferences, status: ConsentStatus) => {
    // Immer necessary auf true setzen
    const finalPrefs = { ...prefs, necessary: true }

    // In Cookie und LocalStorage speichern
    setCookie(COOKIE_CONSENT_KEY, status, CONSENT_DURATION_DAYS)
    localStorage.setItem(COOKIE_PREFERENCES_KEY, JSON.stringify(finalPrefs))

    setPreferences(finalPrefs)
    setConsentStatus(status)
    setHasConsented(true)
    setShowBanner(false)
    setShowSettings(false)
  }, [])

  const acceptAll = useCallback(() => {
    saveConsent(
      {
        necessary: true,
        preferences: true,
        analytics: true,
      },
      'accepted'
    )
  }, [saveConsent])

  const acceptNecessaryOnly = useCallback(() => {
    saveConsent(
      {
        necessary: true,
        preferences: false,
        analytics: false,
      },
      'customized'
    )
  }, [saveConsent])

  const savePreferences = useCallback(
    (prefs: Partial<CookiePreferences>) => {
      const newPrefs = { ...preferences, ...prefs, necessary: true }
      saveConsent(newPrefs, 'customized')
    },
    [preferences, saveConsent]
  )

  const openSettings = useCallback(() => {
    setShowSettings(true)
  }, [])

  const closeSettings = useCallback(() => {
    setShowSettings(false)
  }, [])

  return (
    <CookieConsentContext.Provider
      value={{
        preferences,
        consentStatus,
        showBanner,
        acceptAll,
        acceptNecessaryOnly,
        savePreferences,
        openSettings,
        closeSettings,
        showSettings,
        hasConsented,
      }}
    >
      {children}
    </CookieConsentContext.Provider>
  )
}

export function useCookieConsent() {
  const context = useContext(CookieConsentContext)
  if (context === undefined) {
    throw new Error('useCookieConsent must be used within a CookieConsentProvider')
  }
  return context
}
