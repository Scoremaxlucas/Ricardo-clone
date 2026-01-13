'use client'

import { useCookieConsent, CookiePreferences } from '@/contexts/CookieConsentContext'
import { useLanguage } from '@/contexts/LanguageContext'
import { Cookie, Settings, Shield, BarChart3, X, Check } from 'lucide-react'
import Link from 'next/link'
import { useState, useEffect } from 'react'

// Übersetzungen für Cookie-Banner
const cookieTranslations = {
  de: {
    title: 'Cookie-Einstellungen',
    description:
      'Wir verwenden Cookies, um Ihnen die bestmögliche Erfahrung auf unserer Website zu bieten. Sie können wählen, welche Cookies Sie akzeptieren möchten.',
    acceptAll: 'Alle akzeptieren',
    acceptNecessary: 'Nur notwendige',
    customize: 'Anpassen',
    saveSettings: 'Einstellungen speichern',
    moreInfo: 'Mehr erfahren',
    categories: {
      necessary: {
        title: 'Notwendige Cookies',
        description:
          'Diese Cookies sind für das Funktionieren der Website unerlässlich und können nicht deaktiviert werden.',
      },
      preferences: {
        title: 'Präferenz-Cookies',
        description:
          'Diese Cookies speichern Ihre Einstellungen wie Sprache und Ansichtspräferenzen.',
      },
      analytics: {
        title: 'Analyse-Cookies',
        description:
          'Diese Cookies helfen uns zu verstehen, wie Besucher unsere Website nutzen (anonymisiert).',
      },
    },
  },
  en: {
    title: 'Cookie Settings',
    description:
      'We use cookies to provide you with the best experience on our website. You can choose which cookies you want to accept.',
    acceptAll: 'Accept all',
    acceptNecessary: 'Necessary only',
    customize: 'Customize',
    saveSettings: 'Save settings',
    moreInfo: 'Learn more',
    categories: {
      necessary: {
        title: 'Necessary Cookies',
        description:
          'These cookies are essential for the website to function and cannot be disabled.',
      },
      preferences: {
        title: 'Preference Cookies',
        description: 'These cookies store your settings like language and view preferences.',
      },
      analytics: {
        title: 'Analytics Cookies',
        description:
          'These cookies help us understand how visitors use our website (anonymized).',
      },
    },
  },
  fr: {
    title: 'Paramètres des cookies',
    description:
      'Nous utilisons des cookies pour vous offrir la meilleure expérience sur notre site. Vous pouvez choisir les cookies que vous souhaitez accepter.',
    acceptAll: 'Tout accepter',
    acceptNecessary: 'Nécessaires uniquement',
    customize: 'Personnaliser',
    saveSettings: 'Enregistrer',
    moreInfo: 'En savoir plus',
    categories: {
      necessary: {
        title: 'Cookies nécessaires',
        description:
          'Ces cookies sont essentiels au fonctionnement du site et ne peuvent pas être désactivés.',
      },
      preferences: {
        title: 'Cookies de préférence',
        description:
          'Ces cookies enregistrent vos paramètres comme la langue et les préférences.',
      },
      analytics: {
        title: "Cookies d'analyse",
        description:
          'Ces cookies nous aident à comprendre comment les visiteurs utilisent notre site (anonymisé).',
      },
    },
  },
  it: {
    title: 'Impostazioni cookie',
    description:
      "Utilizziamo i cookie per offrirti la migliore esperienza sul nostro sito. Puoi scegliere quali cookie accettare.",
    acceptAll: 'Accetta tutti',
    acceptNecessary: 'Solo necessari',
    customize: 'Personalizza',
    saveSettings: 'Salva impostazioni',
    moreInfo: 'Scopri di più',
    categories: {
      necessary: {
        title: 'Cookie necessari',
        description:
          'Questi cookie sono essenziali per il funzionamento del sito e non possono essere disattivati.',
      },
      preferences: {
        title: 'Cookie di preferenza',
        description:
          'Questi cookie salvano le tue impostazioni come lingua e preferenze di visualizzazione.',
      },
      analytics: {
        title: 'Cookie di analisi',
        description:
          "Questi cookie ci aiutano a capire come i visitatori usano il nostro sito (anonimizzato).",
      },
    },
  },
}

type CookieCategory = 'necessary' | 'preferences' | 'analytics'

interface CategoryToggleProps {
  category: CookieCategory
  title: string
  description: string
  icon: React.ReactNode
  enabled: boolean
  disabled?: boolean
  onChange: (enabled: boolean) => void
}

function CategoryToggle({
  category,
  title,
  description,
  icon,
  enabled,
  disabled,
  onChange,
}: CategoryToggleProps) {
  return (
    <div className="flex items-start gap-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary-100 text-primary-600">
        {icon}
      </div>
      <div className="flex-1">
        <div className="flex items-center justify-between">
          <h4 className="font-semibold text-gray-900">{title}</h4>
          <button
            type="button"
            role="switch"
            aria-checked={enabled}
            disabled={disabled}
            onClick={() => !disabled && onChange(!enabled)}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
              enabled ? 'bg-primary-600' : 'bg-gray-300'
            } ${disabled ? 'cursor-not-allowed opacity-60' : ''}`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                enabled ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
        <p className="mt-1 text-sm text-gray-600">{description}</p>
        {disabled && (
          <p className="mt-1 text-xs text-gray-500 italic">Immer aktiv (erforderlich)</p>
        )}
      </div>
    </div>
  )
}

export function CookieConsent() {
  const { language } = useLanguage()
  const {
    showBanner,
    showSettings,
    preferences,
    acceptAll,
    acceptNecessaryOnly,
    savePreferences,
    openSettings,
    closeSettings,
  } = useCookieConsent()

  const t = cookieTranslations[language] || cookieTranslations.de

  // Lokaler State für Einstellungen-Modal
  const [localPrefs, setLocalPrefs] = useState<CookiePreferences>(preferences)

  // Sync lokale Einstellungen mit Context
  useEffect(() => {
    setLocalPrefs(preferences)
  }, [preferences])

  const handleSaveSettings = () => {
    savePreferences(localPrefs)
  }

  // Nicht anzeigen wenn weder Banner noch Settings aktiv
  if (!showBanner && !showSettings) {
    return null
  }

  return (
    <>
      {/* Cookie Banner */}
      {showBanner && !showSettings && (
        <div
          className="fixed inset-x-0 bottom-0 z-[100000] animate-slide-up"
          role="dialog"
          aria-modal="true"
          aria-labelledby="cookie-banner-title"
        >
          <div className="mx-auto max-w-7xl px-4 pb-4 sm:px-6 lg:px-8">
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-2xl">
              <div className="p-6">
                <div className="flex items-start gap-4">
                  <div className="hidden sm:flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-primary-100">
                    <Cookie className="h-6 w-6 text-primary-600" />
                  </div>
                  <div className="flex-1">
                    <h2
                      id="cookie-banner-title"
                      className="text-lg font-semibold text-gray-900"
                    >
                      {t.title}
                    </h2>
                    <p className="mt-2 text-sm text-gray-600">{t.description}</p>
                    <p className="mt-2">
                      <Link
                        href="/privacy#cookies"
                        className="text-sm text-primary-600 hover:text-primary-700 hover:underline"
                      >
                        {t.moreInfo} →
                      </Link>
                    </p>
                  </div>
                </div>

                <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
                  <button
                    onClick={openSettings}
                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                  >
                    <Settings className="h-4 w-4" />
                    {t.customize}
                  </button>
                  <button
                    onClick={acceptNecessaryOnly}
                    className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                  >
                    {t.acceptNecessary}
                  </button>
                  <button
                    onClick={acceptAll}
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                  >
                    <Check className="h-4 w-4" />
                    {t.acceptAll}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Einstellungen Modal */}
      {showSettings && (
        <div
          className="fixed inset-0 z-[100001] flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="cookie-settings-title"
        >
          <div className="w-full max-w-lg overflow-hidden rounded-xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
              <h2 id="cookie-settings-title" className="text-lg font-semibold text-gray-900">
                {t.title}
              </h2>
              <button
                onClick={closeSettings}
                className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                aria-label="Schliessen"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="max-h-[60vh] overflow-y-auto p-6">
              <p className="mb-6 text-sm text-gray-600">{t.description}</p>

              <div className="space-y-4">
                <CategoryToggle
                  category="necessary"
                  title={t.categories.necessary.title}
                  description={t.categories.necessary.description}
                  icon={<Shield className="h-5 w-5" />}
                  enabled={true}
                  disabled={true}
                  onChange={() => {}}
                />

                <CategoryToggle
                  category="preferences"
                  title={t.categories.preferences.title}
                  description={t.categories.preferences.description}
                  icon={<Settings className="h-5 w-5" />}
                  enabled={localPrefs.preferences}
                  onChange={(enabled) =>
                    setLocalPrefs((prev) => ({ ...prev, preferences: enabled }))
                  }
                />

                <CategoryToggle
                  category="analytics"
                  title={t.categories.analytics.title}
                  description={t.categories.analytics.description}
                  icon={<BarChart3 className="h-5 w-5" />}
                  enabled={localPrefs.analytics}
                  onChange={(enabled) =>
                    setLocalPrefs((prev) => ({ ...prev, analytics: enabled }))
                  }
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-gray-200 px-6 py-4">
              <button
                onClick={acceptNecessaryOnly}
                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
              >
                {t.acceptNecessary}
              </button>
              <button
                onClick={handleSaveSettings}
                className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-700"
              >
                {t.saveSettings}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Animation styles */}
      <style jsx global>{`
        @keyframes slide-up {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </>
  )
}

// Export für Footer-Link zum Öffnen der Einstellungen
export function CookieSettingsButton() {
  const { openSettings } = useCookieConsent()
  const { language } = useLanguage()

  const labels = {
    de: 'Cookie-Einstellungen',
    en: 'Cookie Settings',
    fr: 'Paramètres des cookies',
    it: 'Impostazioni cookie',
  }

  return (
    <button
      onClick={openSettings}
      className="text-teal-200/80 transition-colors hover:text-white hover:underline"
    >
      {labels[language] || labels.de}
    </button>
  )
}
