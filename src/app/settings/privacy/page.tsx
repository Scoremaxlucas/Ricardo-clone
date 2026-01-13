'use client'

import { Footer } from '@/components/layout/Footer'
import { Header } from '@/components/layout/Header'
import { useLanguage } from '@/contexts/LanguageContext'
import { ArrowLeft, Download, Loader2, Shield, Trash2 } from 'lucide-react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { useState } from 'react'
import { toast } from 'react-hot-toast'

const translations = {
  de: {
    title: 'Datenschutz & Daten',
    subtitle: 'Verwalten Sie Ihre persönlichen Daten',
    backToProfile: 'Zurück zum Profil',
    loginRequired: 'Bitte melden Sie sich an.',
    dataExport: {
      title: 'Meine Daten herunterladen',
      description:
        'Laden Sie alle Ihre persönlichen Daten herunter, die Helvenda über Sie gespeichert hat. Dies beinhaltet Ihr Profil, Käufe, Verkäufe, Nachrichten und mehr.',
      button: 'Daten exportieren (JSON)',
      downloading: 'Wird vorbereitet...',
      rights: 'Gemäss Schweizer Datenschutzgesetz (DSG) und DSGVO haben Sie das Recht auf Datenportabilität.',
    },
    deleteAccount: {
      title: 'Konto löschen',
      description:
        'Löschen Sie Ihr Konto und alle damit verbundenen persönlichen Daten dauerhaft. Diese Aktion kann nicht rückgängig gemacht werden.',
      button: 'Kontolöschung starten',
      warning: 'Achtung: Diese Aktion ist unwiderruflich!',
    },
    cookieSettings: {
      title: 'Cookie-Einstellungen',
      description: 'Verwalten Sie Ihre Cookie-Präferenzen für diese Website.',
      button: 'Einstellungen ändern',
    },
  },
  en: {
    title: 'Privacy & Data',
    subtitle: 'Manage your personal data',
    backToProfile: 'Back to Profile',
    loginRequired: 'Please log in.',
    dataExport: {
      title: 'Download My Data',
      description:
        'Download all your personal data that Helvenda has stored about you. This includes your profile, purchases, sales, messages and more.',
      button: 'Export Data (JSON)',
      downloading: 'Preparing...',
      rights: 'Under the Swiss Data Protection Act (DSG) and GDPR, you have the right to data portability.',
    },
    deleteAccount: {
      title: 'Delete Account',
      description:
        'Permanently delete your account and all associated personal data. This action cannot be undone.',
      button: 'Start Account Deletion',
      warning: 'Warning: This action is irreversible!',
    },
    cookieSettings: {
      title: 'Cookie Settings',
      description: 'Manage your cookie preferences for this website.',
      button: 'Change Settings',
    },
  },
  fr: {
    title: 'Confidentialité & Données',
    subtitle: 'Gérez vos données personnelles',
    backToProfile: 'Retour au profil',
    loginRequired: 'Veuillez vous connecter.',
    dataExport: {
      title: 'Télécharger mes données',
      description:
        'Téléchargez toutes vos données personnelles que Helvenda a stockées vous concernant. Cela comprend votre profil, achats, ventes, messages et plus.',
      button: 'Exporter les données (JSON)',
      downloading: 'Préparation...',
      rights: 'En vertu de la loi suisse sur la protection des données et du RGPD, vous avez droit à la portabilité des données.',
    },
    deleteAccount: {
      title: 'Supprimer le compte',
      description:
        'Supprimez définitivement votre compte et toutes les données personnelles associées. Cette action est irréversible.',
      button: 'Commencer la suppression',
      warning: 'Attention: Cette action est irréversible!',
    },
    cookieSettings: {
      title: 'Paramètres des cookies',
      description: 'Gérez vos préférences de cookies pour ce site.',
      button: 'Modifier les paramètres',
    },
  },
  it: {
    title: 'Privacy & Dati',
    subtitle: 'Gestisci i tuoi dati personali',
    backToProfile: 'Torna al profilo',
    loginRequired: 'Effettua il login.',
    dataExport: {
      title: 'Scarica i miei dati',
      description:
        'Scarica tutti i tuoi dati personali che Helvenda ha memorizzato su di te. Include profilo, acquisti, vendite, messaggi e altro.',
      button: 'Esporta dati (JSON)',
      downloading: 'Preparazione...',
      rights: 'Secondo la legge svizzera sulla protezione dei dati e il GDPR, hai diritto alla portabilità dei dati.',
    },
    deleteAccount: {
      title: 'Elimina account',
      description:
        'Elimina definitivamente il tuo account e tutti i dati personali associati. Questa azione non può essere annullata.',
      button: "Avvia l'eliminazione",
      warning: "Attenzione: Questa azione è irreversibile!",
    },
    cookieSettings: {
      title: 'Impostazioni cookie',
      description: 'Gestisci le tue preferenze sui cookie per questo sito.',
      button: 'Modifica impostazioni',
    },
  },
}

export default function PrivacySettingsPage() {
  const { data: session, status } = useSession()
  const { language } = useLanguage()
  const t = translations[language] || translations.de

  const [exporting, setExporting] = useState(false)

  const handleExportData = async () => {
    setExporting(true)
    try {
      const response = await fetch('/api/account/export-data')

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.message || 'Export fehlgeschlagen')
      }

      // Trigger Download
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      const date = new Date().toISOString().split('T')[0]
      a.download = `helvenda-datenexport-${date}.json`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast.success('Daten erfolgreich exportiert!')
    } catch (error: any) {
      toast.error(error.message || 'Export fehlgeschlagen')
    } finally {
      setExporting(false)
    }
  }

  if (status === 'loading') {
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
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-12">
        <Link
          href="/profile"
          className="mb-6 inline-flex items-center gap-2 text-sm text-gray-600 hover:text-primary-600"
        >
          <ArrowLeft className="h-4 w-4" />
          {t.backToProfile}
        </Link>

        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">{t.title}</h1>
          <p className="text-gray-600">{t.subtitle}</p>
        </div>

        <div className="space-y-6">
          {/* Daten Export */}
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-blue-100">
                <Download className="h-5 w-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <h2 className="font-semibold text-gray-900">{t.dataExport.title}</h2>
                <p className="mt-1 text-sm text-gray-600">{t.dataExport.description}</p>
                <p className="mt-2 text-xs text-gray-500">{t.dataExport.rights}</p>
                <button
                  onClick={handleExportData}
                  disabled={exporting}
                  className="mt-4 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
                >
                  {exporting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {t.dataExport.downloading}
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4" />
                      {t.dataExport.button}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Cookie-Einstellungen */}
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-green-100">
                <Shield className="h-5 w-5 text-green-600" />
              </div>
              <div className="flex-1">
                <h2 className="font-semibold text-gray-900">{t.cookieSettings.title}</h2>
                <p className="mt-1 text-sm text-gray-600">{t.cookieSettings.description}</p>
                <button
                  onClick={() => {
                    // Öffne Cookie-Einstellungen-Modal
                    const event = new CustomEvent('openCookieSettings')
                    window.dispatchEvent(event)
                    toast.success('Cookie-Einstellungen öffnen - klicken Sie auf den Link im Footer')
                  }}
                  className="mt-4 inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
                >
                  <Shield className="h-4 w-4" />
                  {t.cookieSettings.button}
                </button>
              </div>
            </div>
          </div>

          {/* Konto löschen */}
          <div className="rounded-lg border border-red-200 bg-white p-6 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-red-100">
                <Trash2 className="h-5 w-5 text-red-600" />
              </div>
              <div className="flex-1">
                <h2 className="font-semibold text-gray-900">{t.deleteAccount.title}</h2>
                <p className="mt-1 text-sm text-gray-600">{t.deleteAccount.description}</p>
                <p className="mt-2 text-xs font-medium text-red-600">{t.deleteAccount.warning}</p>
                <Link
                  href="/settings/delete-account"
                  className="mt-4 inline-flex items-center gap-2 rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-700 transition-colors hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                  {t.deleteAccount.button}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
