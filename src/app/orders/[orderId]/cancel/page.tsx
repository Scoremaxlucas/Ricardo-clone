'use client'

import { useParams, useRouter } from 'next/navigation'
import { XCircle, ArrowLeft, RefreshCw } from 'lucide-react'
import Link from 'next/link'
import { useLanguage } from '@/contexts/LanguageContext'

export default function CheckoutCancelPage() {
  const params = useParams()
  const router = useRouter()
  const orderId = params.orderId as string
  const { language } = useLanguage()
  const copy = language === 'fr'
    ? {
        title: 'Paiement annulé',
        subtitle: 'Le paiement n’a pas été finalisé. Votre commande est toujours active.',
        whatNow: 'Que se passe-t-il maintenant ?',
        p1: 'Votre commande n’a pas été supprimée. Vous pouvez revenir au paiement à tout moment et réessayer.',
        p2: 'Si vous avez rencontré un problème de paiement, vous pouvez choisir un autre moyen de paiement ou contacter notre support.',
        retry: 'Réessayer',
        home: "Retour à l'accueil",
        help: 'Besoin d’aide ?',
        contact: 'Nous contacter',
      }
    : language === 'it'
      ? {
          title: 'Pagamento annullato',
          subtitle: "Il pagamento non è stato completato. Il tuo ordine è ancora attivo.",
          whatNow: 'Cosa succede ora?',
          p1: "Il tuo ordine non è stato eliminato. Puoi tornare al checkout in qualsiasi momento e riprovare il pagamento.",
          p2: 'Se hai avuto problemi durante il pagamento, puoi scegliere un altro metodo o contattare il supporto.',
          retry: 'Riprova',
          home: 'Torna alla home',
          help: 'Hai bisogno di aiuto?',
          contact: 'Contattaci',
        }
      : language === 'en'
        ? {
            title: 'Payment canceled',
            subtitle: 'The payment was not completed. Your order is still active.',
            whatNow: 'What happens now?',
            p1: 'Your order was not deleted. You can return to checkout anytime and try payment again.',
            p2: 'If you had payment issues, you can choose another payment method or contact support.',
            retry: 'Try again',
            home: 'Back to homepage',
            help: 'Need help?',
            contact: 'Contact us',
          }
        : {
            title: 'Zahlung abgebrochen',
            subtitle: 'Die Zahlung wurde nicht abgeschlossen. Ihre Bestellung ist noch aktiv.',
            whatNow: 'Was passiert jetzt?',
            p1: 'Ihre Bestellung wurde nicht gelöscht. Sie können jederzeit zur Kasse zurückkehren und die Zahlung erneut versuchen.',
            p2: 'Falls Sie Probleme bei der Zahlung hatten, können Sie eine andere Zahlungsmethode wählen oder unseren Support kontaktieren.',
            retry: 'Erneut versuchen',
            home: 'Zurück zur Startseite',
            help: 'Benötigen Sie Hilfe?',
            contact: 'Kontaktieren Sie uns',
          }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="mx-auto max-w-2xl px-4">
        {/* Cancel Header */}
        <div className="text-center mb-8">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
            <XCircle className="h-10 w-10 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{copy.title}</h1>
          <p className="mt-2 text-gray-600">
            {copy.subtitle}
          </p>
        </div>

        {/* Info Card */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <h2 className="font-semibold text-lg mb-4">{copy.whatNow}</h2>
          <div className="space-y-4 text-gray-600">
            <p>
              {copy.p1}
            </p>
            <p>
              {copy.p2}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={() => router.back()}
            className="flex-1 flex items-center justify-center px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            {copy.retry}
          </button>
          <Link
            href="/"
            className="flex-1 flex items-center justify-center px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            {copy.home}
          </Link>
        </div>

        {/* Help Link */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            {copy.help}{' '}
            <Link href="/contact" className="text-primary-600 hover:underline">
              {copy.contact}
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
