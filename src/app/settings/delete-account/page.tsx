'use client'

import { Footer } from '@/components/layout/Footer'
import { Header } from '@/components/layout/Header'
import { useLanguage } from '@/contexts/LanguageContext'
import { AlertTriangle, ArrowLeft, CheckCircle, Loader2, Trash2 } from 'lucide-react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'react-hot-toast'

const translations = {
  de: {
    title: 'Konto löschen',
    subtitle: 'Löschung Ihres Helvenda-Kontos mit 14-Tage-Wartefrist',
    warning: 'Hinweis: Nach der Bestätigung haben Sie 14 Tage Zeit, Ihre Meinung zu ändern.',
    whatHappens: 'Wie funktioniert die Kontolöschung?',
    process: 'Der Löschprozess:',
    processItems: [
      '1. Sie erhalten eine Bestätigungs-E-Mail',
      '2. Nach Bestätigung wird Ihr Konto gesperrt',
      '3. 14-Tage-Wartefrist für Reaktivierung',
      '4. Nach 14 Tagen: Endgültige Löschung',
    ],
    deleted: 'Folgende Daten werden nach der Wartefrist gelöscht:',
    deletedItems: [
      'Ihr Benutzerprofil und alle persönlichen Daten',
      'Ihre Favoriten und Suchaufträge',
      'Ihre Nachrichten',
      'Ihre Bewertungen (werden anonymisiert)',
    ],
    kept: 'Folgende Daten werden aufbewahrt (gesetzliche Pflicht):',
    keptItems: [
      'Transaktionsdaten (anonymisiert, 10 Jahre)',
      'Rechnungen (für Buchhaltung)',
    ],
    requirements: 'Voraussetzungen',
    requirementsItems: [
      'Keine aktiven Angebote',
      'Keine offenen Rechnungen',
      'Keine laufenden Käufe',
      'Keine aktiven Gebote',
    ],
    confirmText: 'Ich verstehe, dass mein Konto gesperrt und nach 14 Tagen endgültig gelöscht wird, wenn ich nicht reaktiviere.',
    requestDeletion: 'Kontolöschung beantragen',
    processing: 'Wird verarbeitet...',
    back: 'Zurück zu Einstellungen',
    loginRequired: 'Bitte melden Sie sich an, um Ihr Konto zu löschen.',
    successTitle: 'Bestätigungs-E-Mail gesendet',
    successMessage: 'Wir haben Ihnen eine E-Mail mit einem Bestätigungslink gesendet. Nach der Bestätigung haben Sie 14 Tage Zeit, Ihre Meinung zu ändern.',
  },
  en: {
    title: 'Delete Account',
    subtitle: 'Deletion of your Helvenda account with 14-day waiting period',
    warning: 'Note: After confirmation, you have 14 days to change your mind.',
    whatHappens: 'How does account deletion work?',
    process: 'The deletion process:',
    processItems: [
      '1. You receive a confirmation email',
      '2. After confirmation, your account is suspended',
      '3. 14-day waiting period for reactivation',
      '4. After 14 days: Permanent deletion',
    ],
    deleted: 'The following data will be deleted after the waiting period:',
    deletedItems: [
      'Your user profile and all personal data',
      'Your favorites and search subscriptions',
      'Your messages',
      'Your reviews (will be anonymized)',
    ],
    kept: 'The following data will be retained (legal requirement):',
    keptItems: [
      'Transaction data (anonymized, 10 years)',
      'Invoices (for accounting)',
    ],
    requirements: 'Requirements',
    requirementsItems: [
      'No active listings',
      'No unpaid invoices',
      'No ongoing purchases',
      'No active bids',
    ],
    confirmText: 'I understand that my account will be suspended and permanently deleted after 14 days if I do not reactivate.',
    requestDeletion: 'Request Account Deletion',
    processing: 'Processing...',
    back: 'Back to Settings',
    loginRequired: 'Please log in to delete your account.',
    successTitle: 'Confirmation Email Sent',
    successMessage: 'We have sent you an email with a confirmation link. After confirmation, you have 14 days to change your mind.',
  },
  fr: {
    title: 'Supprimer le compte',
    subtitle: "Suppression de votre compte Helvenda avec période d'attente de 14 jours",
    warning: "Note: Après confirmation, vous avez 14 jours pour changer d'avis.",
    whatHappens: 'Comment fonctionne la suppression du compte?',
    process: 'Le processus de suppression:',
    processItems: [
      '1. Vous recevez un e-mail de confirmation',
      '2. Après confirmation, votre compte est suspendu',
      '3. Période d\'attente de 14 jours pour réactivation',
      '4. Après 14 jours: Suppression définitive',
    ],
    deleted: "Les données suivantes seront supprimées après la période d'attente:",
    deletedItems: [
      'Votre profil et toutes vos données personnelles',
      'Vos favoris et alertes de recherche',
      'Vos messages',
      'Vos évaluations (seront anonymisées)',
    ],
    kept: 'Les données suivantes seront conservées (obligation légale):',
    keptItems: [
      'Données de transaction (anonymisées, 10 ans)',
      'Factures (pour la comptabilité)',
    ],
    requirements: 'Conditions préalables',
    requirementsItems: [
      'Aucune offre active',
      'Aucune facture impayée',
      'Aucun achat en cours',
      'Aucune enchère active',
    ],
    confirmText: "Je comprends que mon compte sera suspendu et définitivement supprimé après 14 jours si je ne le réactive pas.",
    requestDeletion: 'Demander la suppression',
    processing: 'Traitement en cours...',
    back: 'Retour aux paramètres',
    loginRequired: 'Veuillez vous connecter pour supprimer votre compte.',
    successTitle: 'E-mail de confirmation envoyé',
    successMessage: "Nous vous avons envoyé un e-mail avec un lien de confirmation. Après confirmation, vous avez 14 jours pour changer d'avis.",
  },
  it: {
    title: 'Elimina account',
    subtitle: "Eliminazione del tuo account Helvenda con periodo di attesa di 14 giorni",
    warning: 'Nota: Dopo la conferma, hai 14 giorni per cambiare idea.',
    whatHappens: "Come funziona l'eliminazione dell'account?",
    process: 'Il processo di eliminazione:',
    processItems: [
      '1. Ricevi un\'e-mail di conferma',
      '2. Dopo la conferma, il tuo account viene sospeso',
      '3. Periodo di attesa di 14 giorni per la riattivazione',
      '4. Dopo 14 giorni: Eliminazione definitiva',
    ],
    deleted: 'I seguenti dati verranno eliminati dopo il periodo di attesa:',
    deletedItems: [
      'Il tuo profilo e tutti i dati personali',
      'I tuoi preferiti e avvisi di ricerca',
      'I tuoi messaggi',
      'Le tue valutazioni (saranno anonimizzate)',
    ],
    kept: 'I seguenti dati verranno conservati (obbligo legale):',
    keptItems: [
      'Dati delle transazioni (anonimizzati, 10 anni)',
      'Fatture (per la contabilità)',
    ],
    requirements: 'Requisiti',
    requirementsItems: [
      'Nessuna offerta attiva',
      'Nessuna fattura non pagata',
      'Nessun acquisto in corso',
      "Nessun'offerta attiva",
    ],
    confirmText: "Capisco che il mio account verrà sospeso e eliminato definitivamente dopo 14 giorni se non lo riattivo.",
    requestDeletion: "Richiedi l'eliminazione",
    processing: 'Elaborazione in corso...',
    back: 'Torna alle impostazioni',
    loginRequired: 'Accedi per eliminare il tuo account.',
    successTitle: 'E-mail di conferma inviata',
    successMessage: "Ti abbiamo inviato un'e-mail con un link di conferma. Dopo la conferma, hai 14 giorni per cambiare idea.",
  },
}

export default function DeleteAccountPage() {
  const { data: session, status } = useSession()
  const { language } = useLanguage()
  const router = useRouter()
  const t = translations[language] || translations.de

  const [confirmed, setConfirmed] = useState(false)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleRequestDeletion = async () => {
    if (!confirmed) {
      toast.error('Bitte bestätigen Sie, dass Sie die Konsequenzen verstehen.')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/account/request-deletion', {
        method: 'POST',
      })

      const data = await res.json()

      if (res.ok) {
        setSuccess(true)
      } else {
        setError(data.message || 'Ein Fehler ist aufgetreten')
        toast.error(data.message || 'Ein Fehler ist aufgetreten')
      }
    } catch (err) {
      setError('Ein Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.')
      toast.error('Ein Fehler ist aufgetreten')
    } finally {
      setLoading(false)
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

  if (success) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex flex-1 flex-col items-center justify-center px-4 py-12">
          <div className="max-w-md rounded-lg border border-green-200 bg-white p-8 text-center shadow-md">
            <CheckCircle className="mx-auto mb-4 h-16 w-16 text-green-600" />
            <h2 className="mb-2 text-xl font-bold text-gray-900">{t.successTitle}</h2>
            <p className="text-gray-600">{t.successMessage}</p>
            <Link
              href="/"
              className="mt-6 inline-block rounded-lg bg-primary-600 px-6 py-2 text-white hover:bg-primary-700"
            >
              Zur Startseite
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
          {t.back}
        </Link>

        <div className="rounded-lg border border-gray-200 bg-white p-8 shadow-md">
          <div className="mb-6 flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
              <Trash2 className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{t.title}</h1>
              <p className="text-gray-600">{t.subtitle}</p>
            </div>
          </div>

          <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600" />
              <p className="font-medium text-amber-800">{t.warning}</p>
            </div>
          </div>

          <div className="mb-6 space-y-6">
            <div>
              <h2 className="mb-3 font-semibold text-gray-900">{t.whatHappens}</h2>

              {/* Prozess-Schritte */}
              <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 p-4">
                <h3 className="mb-2 text-sm font-medium text-blue-700">{t.process}</h3>
                <ul className="space-y-1 text-sm text-blue-800">
                  {t.processItems?.map((item: string, i: number) => (
                    <li key={i} className="flex items-start gap-2">
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mb-4">
                <h3 className="mb-2 text-sm font-medium text-red-700">{t.deleted}</h3>
                <ul className="space-y-1 text-sm text-gray-600">
                  {t.deletedItems.map((item, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-red-500">✗</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="mb-2 text-sm font-medium text-green-700">{t.kept}</h3>
                <ul className="space-y-1 text-sm text-gray-600">
                  {t.keptItems.map((item, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-green-500">✓</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-4">
              <h3 className="mb-2 text-sm font-medium text-gray-900">{t.requirements}</h3>
              <ul className="space-y-1 text-sm text-gray-600">
                {t.requirementsItems.map((item, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-gray-400">•</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {error && (
            <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <div className="mb-6">
            <label className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={confirmed}
                onChange={(e) => setConfirmed(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
              />
              <span className="text-sm text-gray-700">{t.confirmText}</span>
            </label>
          </div>

          <button
            onClick={handleRequestDeletion}
            disabled={!confirmed || loading}
            className="w-full rounded-lg bg-red-600 px-6 py-3 font-medium text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin" />
                {t.processing}
              </span>
            ) : (
              t.requestDeletion
            )}
          </button>
        </div>
      </main>
      <Footer />
    </div>
  )
}
