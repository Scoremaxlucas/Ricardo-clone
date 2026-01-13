'use client'

import { Footer } from '@/components/layout/Footer'
import { Header } from '@/components/layout/Header'
import { useLanguage } from '@/contexts/LanguageContext'
import { CheckCircle, Loader2, XCircle } from 'lucide-react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useState } from 'react'

const translations = {
  de: {
    loading: 'Ihr Konto wird gelöscht...',
    successTitle: 'Konto erfolgreich gelöscht',
    successMessage:
      'Ihr Helvenda-Konto und alle persönlichen Daten wurden erfolgreich gelöscht. Eine Bestätigungs-E-Mail wurde an Ihre E-Mail-Adresse gesendet.',
    errorTitle: 'Fehler bei der Kontolöschung',
    noToken: 'Kein Bestätigungstoken gefunden. Bitte verwenden Sie den Link aus Ihrer E-Mail.',
    backToHome: 'Zur Startseite',
    tryAgain: 'Erneut versuchen',
    contact: 'Bei Fragen kontaktieren Sie uns unter support@helvenda.ch',
  },
  en: {
    loading: 'Your account is being deleted...',
    successTitle: 'Account Successfully Deleted',
    successMessage:
      'Your Helvenda account and all personal data have been successfully deleted. A confirmation email has been sent to your email address.',
    errorTitle: 'Error Deleting Account',
    noToken: 'No confirmation token found. Please use the link from your email.',
    backToHome: 'Back to Home',
    tryAgain: 'Try Again',
    contact: 'For questions, contact us at support@helvenda.ch',
  },
  fr: {
    loading: 'Votre compte est en cours de suppression...',
    successTitle: 'Compte supprimé avec succès',
    successMessage:
      'Votre compte Helvenda et toutes vos données personnelles ont été supprimés avec succès. Un e-mail de confirmation a été envoyé à votre adresse e-mail.',
    errorTitle: 'Erreur lors de la suppression',
    noToken: "Aucun jeton de confirmation trouvé. Veuillez utiliser le lien de votre e-mail.",
    backToHome: "Retour à l'accueil",
    tryAgain: 'Réessayer',
    contact: 'Pour toute question, contactez-nous à support@helvenda.ch',
  },
  it: {
    loading: 'Il tuo account viene eliminato...',
    successTitle: 'Account eliminato con successo',
    successMessage:
      "Il tuo account Helvenda e tutti i dati personali sono stati eliminati con successo. Un'e-mail di conferma è stata inviata al tuo indirizzo e-mail.",
    errorTitle: "Errore durante l'eliminazione",
    noToken: "Nessun token di conferma trovato. Usa il link dalla tua e-mail.",
    backToHome: 'Torna alla home',
    tryAgain: 'Riprova',
    contact: 'Per domande, contattaci a support@helvenda.ch',
  },
}

function ConfirmDeletionContent() {
  const searchParams = useSearchParams()
  const { language } = useLanguage()
  const t = translations[language] || translations.de

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [errorMessage, setErrorMessage] = useState('')

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
        } else {
          setStatus('error')
          setErrorMessage(data.message || 'Ein Fehler ist aufgetreten')
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
      <div className="mx-auto max-w-md rounded-lg border border-green-200 bg-white p-8 text-center shadow-md">
        <CheckCircle className="mx-auto mb-4 h-16 w-16 text-green-600" />
        <h1 className="mb-2 text-2xl font-bold text-gray-900">{t.successTitle}</h1>
        <p className="mb-6 text-gray-600">{t.successMessage}</p>
        <Link
          href="/"
          className="inline-block rounded-lg bg-primary-600 px-6 py-3 text-white transition-colors hover:bg-primary-700"
        >
          {t.backToHome}
        </Link>
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
