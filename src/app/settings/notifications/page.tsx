'use client'

import { Footer } from '@/components/layout/Footer'
import { Header } from '@/components/layout/Header'
import { useLanguage } from '@/contexts/LanguageContext'
import { usePushNotifications } from '@/hooks/usePushNotifications'
import {
  ArrowLeft,
  Bell,
  BellRing,
  Gavel,
  Heart,
  Loader2,
  Mail,
  MessageCircle,
  Package,
  Search,
  ShoppingCart,
  Smartphone,
  Sparkles,
} from 'lucide-react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { toast } from 'react-hot-toast'

interface NotificationPreferences {
  // Verkäufer
  emailOnNewMessage: boolean
  emailOnNewBid: boolean
  emailOnNewOffer: boolean
  emailOnSaleCompleted: boolean
  // Käufer
  emailOnOutbid: boolean
  emailOnAuctionEnding: boolean
  emailOnPurchase: boolean
  emailOnShipping: boolean
  // Suchabo
  emailOnSearchMatch: boolean
  // Favoriten
  emailOnFavoritePriceChange: boolean
  // Marketing
  emailMarketing: boolean
  emailDigestFrequency: 'instant' | 'daily' | 'weekly' | 'none'
}

const DEFAULT_PREFERENCES: NotificationPreferences = {
  emailOnNewMessage: true,
  emailOnNewBid: true,
  emailOnNewOffer: true,
  emailOnSaleCompleted: true,
  emailOnOutbid: true,
  emailOnAuctionEnding: true,
  emailOnPurchase: true,
  emailOnShipping: true,
  emailOnSearchMatch: true,
  emailOnFavoritePriceChange: false,
  emailMarketing: false,
  emailDigestFrequency: 'instant',
}

const translations = {
  de: {
    title: 'Benachrichtigungen',
    subtitle: 'Wählen Sie, worüber Sie informiert werden möchten',
    backToProfile: 'Zurück zum Profil',
    loginRequired: 'Bitte melden Sie sich an.',
    saving: 'Wird gespeichert...',
    saved: 'Einstellungen gespeichert',
    error: 'Fehler beim Speichern',
    sections: {
      seller: {
        title: 'Als Verkäufer',
        subtitle: 'Benachrichtigungen für Ihre Inserate',
      },
      buyer: {
        title: 'Als Käufer',
        subtitle: 'Benachrichtigungen für Ihre Aktivitäten',
      },
      other: {
        title: 'Weitere',
        subtitle: 'Suchabo & Favoriten',
      },
      digest: {
        title: 'E-Mail-Häufigkeit',
        subtitle: 'Wie oft möchten Sie benachrichtigt werden?',
      },
    },
    options: {
      emailOnNewMessage: 'Neue Nachricht zu Inserat',
      emailOnNewBid: 'Neues Gebot auf Auktion',
      emailOnNewOffer: 'Neues Preisangebot erhalten',
      emailOnSaleCompleted: 'Verkauf abgeschlossen',
      emailOnOutbid: 'Bei Auktion überboten',
      emailOnAuctionEnding: 'Auktion endet bald (30 Min.)',
      emailOnPurchase: 'Kauf bestätigt',
      emailOnShipping: 'Artikel wurde versendet',
      emailOnSearchMatch: 'Neuer Treffer für Suchabo',
      emailOnFavoritePriceChange: 'Preisänderung bei Favorit',
      emailMarketing: 'Newsletter & Angebote',
    },
    frequency: {
      instant: 'Sofort',
      daily: 'Täglich (Zusammenfassung)',
      weekly: 'Wöchentlich (Zusammenfassung)',
      none: 'Keine E-Mails',
    },
  },
  en: {
    title: 'Notifications',
    subtitle: 'Choose what you want to be notified about',
    backToProfile: 'Back to Profile',
    loginRequired: 'Please log in.',
    saving: 'Saving...',
    saved: 'Settings saved',
    error: 'Error saving',
    sections: {
      seller: {
        title: 'As Seller',
        subtitle: 'Notifications for your listings',
      },
      buyer: {
        title: 'As Buyer',
        subtitle: 'Notifications for your activities',
      },
      other: {
        title: 'Other',
        subtitle: 'Search alerts & favorites',
      },
      digest: {
        title: 'Email Frequency',
        subtitle: 'How often do you want to be notified?',
      },
    },
    options: {
      emailOnNewMessage: 'New message on listing',
      emailOnNewBid: 'New bid on auction',
      emailOnNewOffer: 'New price offer received',
      emailOnSaleCompleted: 'Sale completed',
      emailOnOutbid: 'Outbid on auction',
      emailOnAuctionEnding: 'Auction ending soon (30 min)',
      emailOnPurchase: 'Purchase confirmed',
      emailOnShipping: 'Item shipped',
      emailOnSearchMatch: 'New match for search alert',
      emailOnFavoritePriceChange: 'Price change on favorite',
      emailMarketing: 'Newsletter & offers',
    },
    frequency: {
      instant: 'Instantly',
      daily: 'Daily (Summary)',
      weekly: 'Weekly (Summary)',
      none: 'No emails',
    },
  },
  fr: {
    title: 'Notifications',
    subtitle: 'Choisissez ce dont vous souhaitez être informé',
    backToProfile: 'Retour au profil',
    loginRequired: 'Veuillez vous connecter.',
    saving: 'Enregistrement...',
    saved: 'Paramètres enregistrés',
    error: "Erreur lors de l'enregistrement",
    sections: {
      seller: {
        title: 'En tant que vendeur',
        subtitle: 'Notifications pour vos annonces',
      },
      buyer: {
        title: 'En tant qu\'acheteur',
        subtitle: 'Notifications pour vos activités',
      },
      other: {
        title: 'Autres',
        subtitle: 'Alertes de recherche & favoris',
      },
      digest: {
        title: 'Fréquence des e-mails',
        subtitle: 'À quelle fréquence souhaitez-vous être notifié?',
      },
    },
    options: {
      emailOnNewMessage: 'Nouveau message sur annonce',
      emailOnNewBid: 'Nouvelle enchère',
      emailOnNewOffer: 'Nouvelle offre de prix reçue',
      emailOnSaleCompleted: 'Vente terminée',
      emailOnOutbid: 'Surenchéri',
      emailOnAuctionEnding: 'Enchère se terminant bientôt (30 min)',
      emailOnPurchase: 'Achat confirmé',
      emailOnShipping: 'Article expédié',
      emailOnSearchMatch: 'Nouvelle correspondance d\'alerte',
      emailOnFavoritePriceChange: 'Changement de prix sur favori',
      emailMarketing: 'Newsletter & offres',
    },
    frequency: {
      instant: 'Instantanément',
      daily: 'Quotidien (Résumé)',
      weekly: 'Hebdomadaire (Résumé)',
      none: 'Pas d\'e-mails',
    },
  },
  it: {
    title: 'Notifiche',
    subtitle: 'Scegli di cosa vuoi essere notificato',
    backToProfile: 'Torna al profilo',
    loginRequired: 'Effettua il login.',
    saving: 'Salvataggio...',
    saved: 'Impostazioni salvate',
    error: 'Errore nel salvataggio',
    sections: {
      seller: {
        title: 'Come venditore',
        subtitle: 'Notifiche per i tuoi annunci',
      },
      buyer: {
        title: 'Come acquirente',
        subtitle: 'Notifiche per le tue attività',
      },
      other: {
        title: 'Altro',
        subtitle: 'Avvisi di ricerca & preferiti',
      },
      digest: {
        title: 'Frequenza email',
        subtitle: 'Con quale frequenza vuoi essere notificato?',
      },
    },
    options: {
      emailOnNewMessage: 'Nuovo messaggio su annuncio',
      emailOnNewBid: 'Nuova offerta all\'asta',
      emailOnNewOffer: 'Nuova offerta di prezzo ricevuta',
      emailOnSaleCompleted: 'Vendita completata',
      emailOnOutbid: 'Superato all\'asta',
      emailOnAuctionEnding: 'Asta in scadenza (30 min)',
      emailOnPurchase: 'Acquisto confermato',
      emailOnShipping: 'Articolo spedito',
      emailOnSearchMatch: 'Nuova corrispondenza avviso',
      emailOnFavoritePriceChange: 'Cambio prezzo su preferito',
      emailMarketing: 'Newsletter & offerte',
    },
    frequency: {
      instant: 'Immediatamente',
      daily: 'Giornaliero (Riepilogo)',
      weekly: 'Settimanale (Riepilogo)',
      none: 'Nessuna email',
    },
  },
}

// Toggle Switch Component
function PushNotificationSection() {
  const { isSupported, isSubscribed, permission, loading, subscribe, unsubscribe } = usePushNotifications()

  if (!isSupported) return null

  const handleToggle = async () => {
    if (isSubscribed) {
      const ok = await unsubscribe()
      if (ok) toast.success('Push-Benachrichtigungen deaktiviert')
    } else {
      const ok = await subscribe()
      if (ok) {
        toast.success('Push-Benachrichtigungen aktiviert!')
      } else if (permission === 'denied') {
        toast.error('Push-Benachrichtigungen sind in Ihrem Browser blockiert. Bitte erlauben Sie diese in den Browser-Einstellungen.')
      }
    }
  }

  return (
    <div className="rounded-lg border-2 border-primary-200 bg-gradient-to-r from-primary-50 to-white p-4 shadow-sm sm:p-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary-100">
            <Smartphone className="h-5 w-5 text-primary-600" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-gray-900 sm:text-base">Push-Benachrichtigungen</h2>
            <p className="text-xs text-gray-500 sm:text-sm">
              {isSubscribed
                ? 'Sie erhalten Benachrichtigungen auf diesem Gerät.'
                : 'Erhalten Sie Echtzeit-Benachrichtigungen direkt auf Ihrem Gerät.'}
            </p>
            {permission === 'denied' && (
              <p className="mt-1 text-xs text-red-500">
                Benachrichtigungen sind im Browser blockiert.
              </p>
            )}
          </div>
        </div>
        <button
          onClick={handleToggle}
          disabled={loading || permission === 'denied'}
          className={`flex-shrink-0 rounded-lg px-4 py-2 text-sm font-semibold transition-colors disabled:opacity-50 ${
            isSubscribed
              ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              : 'bg-primary-600 text-white hover:bg-primary-700'
          }`}
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : isSubscribed ? (
            'Deaktivieren'
          ) : (
            'Aktivieren'
          )}
        </button>
      </div>
    </div>
  )
}

function Toggle({
  enabled,
  onChange,
  disabled,
}: {
  enabled: boolean
  onChange: (enabled: boolean) => void
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      onClick={() => !disabled && onChange(!enabled)}
      disabled={disabled}
      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
        enabled ? 'bg-primary-600' : 'bg-gray-200'
      }`}
      role="switch"
      aria-checked={enabled}
    >
      <span
        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
          enabled ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  )
}

// Notification Row Component
function NotificationRow({
  icon: Icon,
  label,
  enabled,
  onChange,
  disabled,
}: {
  icon: React.ElementType
  label: string
  enabled: boolean
  onChange: (enabled: boolean) => void
  disabled?: boolean
}) {
  return (
    <div className="flex items-center justify-between py-2.5 sm:py-3">
      <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1 pr-2">
        <Icon className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 flex-shrink-0" />
        <span className="text-xs sm:text-sm text-gray-700 break-words">{label}</span>
      </div>
      <Toggle enabled={enabled} onChange={onChange} disabled={disabled} />
    </div>
  )
}

export default function NotificationSettingsPage() {
  const { data: session, status } = useSession()
  const { language } = useLanguage()
  const t = translations[language] || translations.de

  const [preferences, setPreferences] = useState<NotificationPreferences>(DEFAULT_PREFERENCES)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Load preferences on mount
  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const response = await fetch('/api/notifications/preferences')
        if (response.ok) {
          const data = await response.json()
          setPreferences({ ...DEFAULT_PREFERENCES, ...data.preferences })
        }
      } catch (error) {
        console.error('Error loading preferences:', error)
      } finally {
        setLoading(false)
      }
    }

    if (session?.user) {
      loadPreferences()
    } else {
      setLoading(false)
    }
  }, [session?.user])

  // Save preferences with debounce
  const savePreferences = async (newPreferences: NotificationPreferences) => {
    setSaving(true)
    try {
      const response = await fetch('/api/notifications/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPreferences),
      })

      if (response.ok) {
        toast.success(t.saved, { duration: 2000 })
      } else {
        const data = await response.json()
        throw new Error(data.message)
      }
    } catch (error: any) {
      // Extract a more user-friendly error message
      let errorMessage = error.message || t.error
      if (errorMessage.includes('emailOnNewMessage') || errorMessage.includes('does not exist')) {
        errorMessage = 'Datenbankfehler: Bitte kontaktieren Sie den Support. Die Einstellungen konnten nicht gespeichert werden.'
      }
      toast.error(errorMessage, { duration: 5000 })
      // Revert on error
      const response = await fetch('/api/notifications/preferences')
      if (response.ok) {
        const data = await response.json()
        setPreferences({ ...DEFAULT_PREFERENCES, ...data.preferences })
      }
    } finally {
      setSaving(false)
    }
  }

  // Update a single preference
  const updatePreference = (key: keyof NotificationPreferences, value: boolean | string) => {
    const newPreferences = { ...preferences, [key]: value }
    setPreferences(newPreferences)
    savePreferences(newPreferences)
  }

  if (status === 'loading' || loading) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex flex-1 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
        </main>
        <Footer />
      </div>
    )
  }

  if (!session) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex flex-1 flex-col items-center justify-center px-4 py-12">
          <div className="rounded-lg border border-gray-200 bg-white p-8 text-center shadow-md">
            <p className="text-gray-600">{t.loginRequired}</p>
            <Link
              href="/login"
              className="mt-4 inline-block rounded-lg bg-primary-600 px-6 py-2 text-white hover:bg-primary-700"
            >
              Login
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
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-6 sm:py-12">
        <Link
          href="/profile"
          className="mb-4 sm:mb-6 inline-flex items-center gap-2 text-sm text-gray-600 hover:text-primary-600"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="hidden sm:inline">{t.backToProfile}</span>
          <span className="sm:hidden">Zurück</span>
        </Link>

        <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{t.title}</h1>
            <p className="text-sm sm:text-base text-gray-600">{t.subtitle}</p>
          </div>
          {saving && (
            <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              {t.saving}
            </div>
          )}
        </div>

        <div className="space-y-4 sm:space-y-6">
          {/* Push-Benachrichtigungen */}
          <PushNotificationSection />

          {/* Verkäufer-Benachrichtigungen */}
          <div className="rounded-lg border border-gray-200 bg-white p-4 sm:p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary-100">
                <Package className="h-4 w-4 sm:h-5 sm:w-5 text-primary-600" />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-semibold text-gray-900">{t.sections.seller.title}</h2>
                <p className="text-xs sm:text-sm text-gray-500">{t.sections.seller.subtitle}</p>
              </div>
            </div>
            <div className="divide-y divide-gray-100">
              <NotificationRow
                icon={MessageCircle}
                label={t.options.emailOnNewMessage}
                enabled={preferences.emailOnNewMessage}
                onChange={(v) => updatePreference('emailOnNewMessage', v)}
                disabled={saving}
              />
              <NotificationRow
                icon={Gavel}
                label={t.options.emailOnNewBid}
                enabled={preferences.emailOnNewBid}
                onChange={(v) => updatePreference('emailOnNewBid', v)}
                disabled={saving}
              />
              <NotificationRow
                icon={Mail}
                label={t.options.emailOnNewOffer}
                enabled={preferences.emailOnNewOffer}
                onChange={(v) => updatePreference('emailOnNewOffer', v)}
                disabled={saving}
              />
              <NotificationRow
                icon={ShoppingCart}
                label={t.options.emailOnSaleCompleted}
                enabled={preferences.emailOnSaleCompleted}
                onChange={(v) => updatePreference('emailOnSaleCompleted', v)}
                disabled={saving}
              />
            </div>
          </div>

          {/* Käufer-Benachrichtigungen */}
          <div className="rounded-lg border border-gray-200 bg-white p-4 sm:p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0 items-center justify-center rounded-full bg-blue-100">
                <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-semibold text-gray-900">{t.sections.buyer.title}</h2>
                <p className="text-xs sm:text-sm text-gray-500">{t.sections.buyer.subtitle}</p>
              </div>
            </div>
            <div className="divide-y divide-gray-100">
              <NotificationRow
                icon={Gavel}
                label={t.options.emailOnOutbid}
                enabled={preferences.emailOnOutbid}
                onChange={(v) => updatePreference('emailOnOutbid', v)}
                disabled={saving}
              />
              <NotificationRow
                icon={Bell}
                label={t.options.emailOnAuctionEnding}
                enabled={preferences.emailOnAuctionEnding}
                onChange={(v) => updatePreference('emailOnAuctionEnding', v)}
                disabled={saving}
              />
              <NotificationRow
                icon={ShoppingCart}
                label={t.options.emailOnPurchase}
                enabled={preferences.emailOnPurchase}
                onChange={(v) => updatePreference('emailOnPurchase', v)}
                disabled={saving}
              />
              <NotificationRow
                icon={Package}
                label={t.options.emailOnShipping}
                enabled={preferences.emailOnShipping}
                onChange={(v) => updatePreference('emailOnShipping', v)}
                disabled={saving}
              />
            </div>
          </div>

          {/* Suchabo, Favoriten & Marketing */}
          <div className="rounded-lg border border-gray-200 bg-white p-4 sm:p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0 items-center justify-center rounded-full bg-amber-100">
                <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-amber-600" />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-semibold text-gray-900">{t.sections.other.title}</h2>
                <p className="text-xs sm:text-sm text-gray-500">{t.sections.other.subtitle}</p>
              </div>
            </div>
            <div className="divide-y divide-gray-100">
              <NotificationRow
                icon={Search}
                label={t.options.emailOnSearchMatch}
                enabled={preferences.emailOnSearchMatch}
                onChange={(v) => updatePreference('emailOnSearchMatch', v)}
                disabled={saving}
              />
              <NotificationRow
                icon={Heart}
                label={t.options.emailOnFavoritePriceChange}
                enabled={preferences.emailOnFavoritePriceChange}
                onChange={(v) => updatePreference('emailOnFavoritePriceChange', v)}
                disabled={saving}
              />
            </div>
          </div>

          {/* E-Mail-Häufigkeit */}
          <div className="rounded-lg border border-gray-200 bg-white p-4 sm:p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0 items-center justify-center rounded-full bg-gray-100">
                <Bell className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600" />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-semibold text-gray-900">{t.sections.digest.title}</h2>
                <p className="text-xs sm:text-sm text-gray-500">{t.sections.digest.subtitle}</p>
              </div>
            </div>
            <div className="mt-4 space-y-2">
              {(['instant', 'daily', 'weekly', 'none'] as const).map((freq) => (
                <label
                  key={freq}
                  className={`flex cursor-pointer items-center gap-2 sm:gap-3 rounded-lg border p-2.5 sm:p-3 transition-colors ${
                    preferences.emailDigestFrequency === freq
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="emailDigestFrequency"
                    value={freq}
                    checked={preferences.emailDigestFrequency === freq}
                    onChange={() => updatePreference('emailDigestFrequency', freq)}
                    disabled={saving}
                    className="h-4 w-4 flex-shrink-0 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-xs sm:text-sm text-gray-700">{t.frequency[freq]}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
