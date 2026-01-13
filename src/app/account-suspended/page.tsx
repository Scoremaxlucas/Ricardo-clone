'use client'

import { Footer } from '@/components/layout/Footer'
import { Header } from '@/components/layout/Header'
import { useLanguage } from '@/contexts/LanguageContext'
import { AlertTriangle, Calendar, CheckCircle, Loader2, RefreshCw } from 'lucide-react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useState } from 'react'
import { toast } from 'react-hot-toast'

const translations = {
  de: {
    title: 'Konto gesperrt',
    deletionScheduled: 'Kontolöschung geplant',
    scheduledFor: 'Ihr Konto wird gelöscht am:',
    reactivateInfo:
      'Sie haben es sich anders überlegt? Sie können Ihr Konto innerhalb der Wartefrist reaktivieren.',
    reactivateButton: 'Konto reaktivieren',
    processing: 'Wird verarbeitet...',
    whatHappens: 'Was passiert während der Wartefrist?',
    suspendedItems: [
      'Ihr Konto ist gesperrt und nicht zugänglich',
      'Ihre Angebote sind nicht mehr sichtbar',
      'Sie können keine Käufe oder Verkäufe tätigen',
    ],
    afterDeletion: 'Was passiert nach der Löschung?',
    deletedItems: [
      'Alle persönlichen Daten werden gelöscht',
      'Bewertungen werden anonymisiert',
      'Transaktionsdaten bleiben für Buchhaltung erhalten',
    ],
    successTitle: 'Konto reaktiviert!',
    successMessage:
      'Ihr Konto wurde erfolgreich reaktiviert. Sie können Helvenda wieder vollständig nutzen.',
    goToHome: 'Zur Startseite',
    blockedTitle: 'Konto gesperrt',
    blockedMessage:
      'Ihr Konto wurde gesperrt. Wenn Sie glauben, dass dies ein Fehler ist, kontaktieren Sie bitte den Support.',
    contactSupport: 'Support kontaktieren',
  },
  en: {
    title: 'Account Suspended',
    deletionScheduled: 'Account Deletion Scheduled',
    scheduledFor: 'Your account will be deleted on:',
    reactivateInfo:
      "Changed your mind? You can reactivate your account within the waiting period.",
    reactivateButton: 'Reactivate Account',
    processing: 'Processing...',
    whatHappens: 'What happens during the waiting period?',
    suspendedItems: [
      'Your account is suspended and not accessible',
      'Your listings are no longer visible',
      'You cannot make purchases or sales',
    ],
    afterDeletion: 'What happens after deletion?',
    deletedItems: [
      'All personal data will be deleted',
      'Reviews will be anonymized',
      'Transaction data is retained for accounting',
    ],
    successTitle: 'Account Reactivated!',
    successMessage:
      'Your account has been successfully reactivated. You can use Helvenda again.',
    goToHome: 'Go to Home',
    blockedTitle: 'Account Blocked',
    blockedMessage:
      'Your account has been blocked. If you believe this is an error, please contact support.',
    contactSupport: 'Contact Support',
  },
  fr: {
    title: 'Compte suspendu',
    deletionScheduled: 'Suppression du compte programmée',
    scheduledFor: 'Votre compte sera supprimé le:',
    reactivateInfo:
      'Vous avez changé d\'avis? Vous pouvez réactiver votre compte pendant la période d\'attente.',
    reactivateButton: 'Réactiver le compte',
    processing: 'Traitement en cours...',
    whatHappens: 'Que se passe-t-il pendant la période d\'attente?',
    suspendedItems: [
      'Votre compte est suspendu et inaccessible',
      'Vos annonces ne sont plus visibles',
      'Vous ne pouvez pas effectuer d\'achats ou de ventes',
    ],
    afterDeletion: 'Que se passe-t-il après la suppression?',
    deletedItems: [
      'Toutes les données personnelles seront supprimées',
      'Les évaluations seront anonymisées',
      'Les données de transaction sont conservées pour la comptabilité',
    ],
    successTitle: 'Compte réactivé!',
    successMessage:
      'Votre compte a été réactivé avec succès. Vous pouvez à nouveau utiliser Helvenda.',
    goToHome: 'Aller à l\'accueil',
    blockedTitle: 'Compte bloqué',
    blockedMessage:
      'Votre compte a été bloqué. Si vous pensez qu\'il s\'agit d\'une erreur, veuillez contacter le support.',
    contactSupport: 'Contacter le support',
  },
  it: {
    title: 'Account sospeso',
    deletionScheduled: 'Eliminazione account programmata',
    scheduledFor: 'Il tuo account verrà eliminato il:',
    reactivateInfo:
      'Hai cambiato idea? Puoi riattivare il tuo account durante il periodo di attesa.',
    reactivateButton: 'Riattiva account',
    processing: 'Elaborazione in corso...',
    whatHappens: 'Cosa succede durante il periodo di attesa?',
    suspendedItems: [
      'Il tuo account è sospeso e non accessibile',
      'Le tue inserzioni non sono più visibili',
      'Non puoi effettuare acquisti o vendite',
    ],
    afterDeletion: 'Cosa succede dopo l\'eliminazione?',
    deletedItems: [
      'Tutti i dati personali verranno eliminati',
      'Le valutazioni saranno anonimizzate',
      'I dati delle transazioni sono conservati per la contabilità',
    ],
    successTitle: 'Account riattivato!',
    successMessage:
      'Il tuo account è stato riattivato con successo. Puoi utilizzare nuovamente Helvenda.',
    goToHome: 'Vai alla home',
    blockedTitle: 'Account bloccato',
    blockedMessage:
      'Il tuo account è stato bloccato. Se pensi che si tratti di un errore, contatta il supporto.',
    contactSupport: 'Contatta il supporto',
  },
}

function AccountSuspendedContent() {
  const { data: session, status } = useSession()
  const { language } = useLanguage()
  const router = useRouter()
  const searchParams = useSearchParams()
  const t = translations[language] || translations.de

  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [accountInfo, setAccountInfo] = useState<{
    deletionScheduled: boolean
    scheduledDate: Date | null
    blockedReason: string | null
  } | null>(null)

  // Holen Sie die Kontoinformationen
  useEffect(() => {
    const fetchAccountInfo = async () => {
      try {
        const res = await fetch('/api/account/status')
        if (res.ok) {
          const data = await res.json()
          setAccountInfo({
            deletionScheduled: data.blockedReason === 'DELETION_SCHEDULED',
            scheduledDate: data.deletionScheduledAt
              ? new Date(data.deletionScheduledAt)
              : null,
            blockedReason: data.blockedReason,
          })
        }
      } catch (err) {
        console.error('Error fetching account info:', err)
      }
    }

    if (session?.user) {
      fetchAccountInfo()
    }
  }, [session])

  const handleReactivate = async () => {
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/account/cancel-deletion', {
        method: 'POST',
      })

      const data = await res.json()

      if (res.ok) {
        setSuccess(true)
        toast.success('Konto erfolgreich reaktiviert!')
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

  // Erfolgs-Ansicht nach Reaktivierung
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
              {t.goToHome}
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  // Normales gesperrtes Konto (nicht wegen Löschung)
  if (accountInfo && !accountInfo.deletionScheduled) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex flex-1 flex-col items-center justify-center px-4 py-12">
          <div className="max-w-md rounded-lg border border-red-200 bg-white p-8 text-center shadow-md">
            <AlertTriangle className="mx-auto mb-4 h-16 w-16 text-red-600" />
            <h2 className="mb-2 text-xl font-bold text-gray-900">{t.blockedTitle}</h2>
            <p className="mb-6 text-gray-600">{t.blockedMessage}</p>
            <a
              href="mailto:support@helvenda.ch"
              className="inline-block rounded-lg bg-primary-600 px-6 py-2 text-white hover:bg-primary-700"
            >
              {t.contactSupport}
            </a>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  // Konto zur Löschung vorgemerkt - mit Reaktivierungsoption
  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <Header />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-12">
        <div className="rounded-lg border border-gray-200 bg-white p-8 shadow-md">
          <div className="mb-6 flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100">
              <Calendar className="h-6 w-6 text-amber-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{t.deletionScheduled}</h1>
              <p className="text-gray-600">{t.title}</p>
            </div>
          </div>

          {accountInfo?.scheduledDate && (
            <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-6 text-center">
              <p className="text-sm text-amber-700">{t.scheduledFor}</p>
              <p className="mt-2 text-2xl font-bold text-amber-900">
                {accountInfo.scheduledDate.toLocaleDateString('de-CH', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </div>
          )}

          <div className="mb-6 space-y-6">
            <div>
              <h3 className="mb-2 font-semibold text-gray-900">{t.whatHappens}</h3>
              <ul className="space-y-1 text-sm text-gray-600">
                {t.suspendedItems.map((item, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-amber-500">•</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="border-t border-gray-200 pt-4">
              <h3 className="mb-2 font-semibold text-gray-900">{t.afterDeletion}</h3>
              <ul className="space-y-1 text-sm text-gray-600">
                {t.deletedItems.map((item, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-red-500">✗</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="rounded-lg border border-teal-200 bg-teal-50 p-4">
            <div className="flex items-start gap-3">
              <RefreshCw className="mt-0.5 h-5 w-5 flex-shrink-0 text-teal-600" />
              <div>
                <p className="font-medium text-teal-800">{t.reactivateInfo}</p>
              </div>
            </div>
          </div>

          {error && (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <button
            onClick={handleReactivate}
            disabled={loading}
            className="mt-6 w-full rounded-lg bg-teal-600 px-6 py-3 font-medium text-white transition-colors hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin" />
                {t.processing}
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <RefreshCw className="h-5 w-5" />
                {t.reactivateButton}
              </span>
            )}
          </button>
        </div>
      </main>
      <Footer />
    </div>
  )
}

export default function AccountSuspendedPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
        </div>
      }
    >
      <AccountSuspendedContent />
    </Suspense>
  )
}
