'use client'

import { Footer } from '@/components/layout/Footer'
import { Header } from '@/components/layout/Header'
import { useLanguage } from '@/contexts/LanguageContext'
import { Calendar, CheckCircle, Loader2, RefreshCw, XCircle } from 'lucide-react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useState } from 'react'

const translations = {
  de: {
    loading: 'Ihre Anfrage wird verarbeitet...',
    successTitle: 'Kontolöschung bestätigt',
    successMessage:
      'Ihr Konto wurde gesperrt und wird nach Ablauf der Wartefrist endgültig gelöscht.',
    scheduledFor: 'Endgültige Löschung am:',
    reactivateHint:
      'Sie haben es sich anders überlegt? Innerhalb der Wartefrist können Sie Ihr Konto reaktivieren.',
    errorTitle: 'Fehler bei der Bestätigung',
    noToken: 'Kein Bestätigungstoken gefunden. Bitte verwenden Sie den Link aus Ihrer E-Mail.',
    alreadyScheduled: 'Ihr Konto ist bereits zur Löschung vorgemerkt.',
    backToHome: 'Zur Startseite',
    tryAgain: 'Erneut versuchen',
    contact: 'Bei Fragen kontaktieren Sie uns unter support@helvenda.ch',
    viewStatus: 'Kontostatus anzeigen',
  },
  en: {
    loading: 'Processing your request...',
    successTitle: 'Account Deletion Confirmed',
    successMessage:
      'Your account has been suspended and will be permanently deleted after the waiting period.',
    scheduledFor: 'Final deletion on:',
    reactivateHint:
      "Changed your mind? You can reactivate your account within the waiting period.",
    errorTitle: 'Error Confirming Deletion',
    noToken: 'No confirmation token found. Please use the link from your email.',
    alreadyScheduled: 'Your account is already scheduled for deletion.',
    backToHome: 'Back to Home',
    tryAgain: 'Try Again',
    contact: 'For questions, contact us at support@helvenda.ch',
    viewStatus: 'View Account Status',
  },
  fr: {
    loading: 'Traitement de votre demande...',
    successTitle: 'Suppression du compte confirmée',
    successMessage:
      "Votre compte a été suspendu et sera définitivement supprimé après la période d'attente.",
    scheduledFor: 'Suppression définitive le:',
    reactivateHint:
      "Vous avez changé d'avis? Vous pouvez réactiver votre compte pendant la période d'attente.",
    errorTitle: 'Erreur lors de la confirmation',
    noToken: "Aucun jeton de confirmation trouvé. Veuillez utiliser le lien de votre e-mail.",
    alreadyScheduled: 'Votre compte est déjà programmé pour suppression.',
    backToHome: "Retour à l'accueil",
    tryAgain: 'Réessayer',
    contact: 'Pour toute question, contactez-nous à support@helvenda.ch',
    viewStatus: 'Voir le statut du compte',
  },
  it: {
    loading: 'Elaborazione della richiesta...',
    successTitle: "Eliminazione dell'account confermata",
    successMessage:
      "Il tuo account è stato sospeso e verrà eliminato definitivamente dopo il periodo di attesa.",
    scheduledFor: 'Eliminazione definitiva il:',
    reactivateHint:
      'Hai cambiato idea? Puoi riattivare il tuo account durante il periodo di attesa.',
    errorTitle: 'Errore durante la conferma',
    noToken: "Nessun token di conferma trovato. Usa il link dalla tua e-mail.",
    alreadyScheduled: "Il tuo account è già programmato per l'eliminazione.",
    backToHome: 'Torna alla home',
    tryAgain: 'Riprova',
    contact: 'Per domande, contattaci a support@helvenda.ch',
    viewStatus: "Visualizza lo stato dell'account",
  },
}

function ConfirmDeletionContent() {
  const searchParams = useSearchParams()
  const { language } = useLanguage()
  const t = translations[language] || translations.de

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [errorMessage, setErrorMessage] = useState('')
  const [scheduledDate, setScheduledDate] = useState<Date | null>(null)

  useEffect(() => {
    const token = searchParams.get('token')

    if (!token) {
      setStatus('error')
      setErrorMessage(t.noToken)
      return
    }

    const confirmDeletion = async () => {
      try {
        const response = await fetch(`/api/account/confirm-deletion?token=${token}`, {
          method: 'GET',
        })

        const data = await response.json()

        if (response.ok) {
          setStatus('success')
          if (data.scheduledDate) {
            setScheduledDate(new Date(data.scheduledDate))
          }
        } else {
          // Check if already scheduled (not an error)
          if (data.alreadyScheduled) {
            setStatus('success')
            if (data.scheduledDate) {
              setScheduledDate(new Date(data.scheduledDate))
            }
          } else {
            setStatus('error')
            setErrorMessage(data.message || 'Ein Fehler ist aufgetreten')
          }
        }
      } catch (error) {
        setStatus('error')
        setErrorMessage('Ein Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.')
      }
    }

    confirmDeletion()
  }, [searchParams, t.noToken])

  if (status === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="mb-4 h-12 w-12 animate-spin text-primary-600" />
        <p className="text-lg text-gray-600">{t.loading}</p>
      </div>
    )
  }

  if (status === 'success') {
    return (
      <div className="mx-auto max-w-lg rounded-lg border border-amber-200 bg-white p-8 text-center shadow-md">
        <div className="mb-4 flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-100">
            <Calendar className="h-8 w-8 text-amber-600" />
          </div>
        </div>
        <h1 className="mb-2 text-2xl font-bold text-gray-900">{t.successTitle}</h1>
        <p className="mb-4 text-gray-600">{t.successMessage}</p>

        {scheduledDate && (
          <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-4">
            <p className="text-sm text-amber-700">{t.scheduledFor}</p>
            <p className="mt-1 text-xl font-bold text-amber-900">
              {scheduledDate.toLocaleDateString('de-CH', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>
        )}

        <div className="mb-6 rounded-lg border border-teal-200 bg-teal-50 p-4">
          <div className="flex items-center justify-center gap-2 text-teal-700">
            <RefreshCw className="h-5 w-5" />
            <p className="text-sm">{t.reactivateHint}</p>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/account-suspended"
            className="rounded-lg border border-teal-600 bg-white px-6 py-2 text-teal-600 transition-colors hover:bg-teal-50"
          >
            {t.viewStatus}
          </Link>
          <Link
            href="/"
            className="rounded-lg bg-primary-600 px-6 py-2 text-white transition-colors hover:bg-primary-700"
          >
            {t.backToHome}
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-md rounded-lg border border-red-200 bg-white p-8 text-center shadow-md">
      <XCircle className="mx-auto mb-4 h-16 w-16 text-red-600" />
      <h1 className="mb-2 text-2xl font-bold text-gray-900">{t.errorTitle}</h1>
      <p className="mb-4 text-gray-600">{errorMessage}</p>
      <p className="mb-6 text-sm text-gray-500">{t.contact}</p>
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
        <Link
          href="/settings/delete-account"
          className="rounded-lg border border-gray-300 bg-white px-6 py-2 text-gray-700 transition-colors hover:bg-gray-50"
        >
          {t.tryAgain}
        </Link>
        <Link
          href="/"
          className="rounded-lg bg-primary-600 px-6 py-2 text-white transition-colors hover:bg-primary-700"
        >
          {t.backToHome}
        </Link>
      </div>
    </div>
  )
}

export default function ConfirmDeletionPage() {
  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <Header />
      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <Suspense
          fallback={
            <div className="flex flex-col items-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
            </div>
          }
        >
          <ConfirmDeletionContent />
        </Suspense>
      </main>
      <Footer />
    </div>
  )
}
