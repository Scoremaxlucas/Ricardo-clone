'use client'

import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, CreditCard, Loader2, AlertCircle } from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { InvoicePaymentMethods } from '@/components/payment/InvoicePaymentMethods'

interface Invoice {
  id: string
  invoiceNumber: string
  total: number
  status: string
  dueDate: string
}

export default function InvoicePaymentPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const invoiceId = params?.invoiceId as string
  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (status === 'loading') return

    if (!session) {
      router.push('/login')
      return
    }

    loadInvoice()
  }, [session, status, router, invoiceId])

  const loadInvoice = async () => {
    try {
      const res = await fetch(`/api/invoices/my-invoices`)
      if (res.ok) {
        const data = await res.json()
        const foundInvoice = data.invoices?.find((inv: Invoice) => inv.id === invoiceId)
        if (foundInvoice) {
          setInvoice(foundInvoice)
        } else {
          setError('Rechnung nicht gefunden')
        }
      } else {
        setError('Fehler beim Laden der Rechnung')
      }
    } catch (err) {
      setError('Fehler beim Laden der Rechnung')
    } finally {
      setLoading(false)
    }
  }

  const handlePaymentSuccess = () => {
    // Reload invoice to get updated status
    loadInvoice()
  }

  if (status === 'loading' || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto mb-4 h-12 w-12 animate-spin text-primary-600" />
          <p className="text-gray-600">Lädt...</p>
        </div>
      </div>
    )
  }

  if (error || !invoice) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="mx-auto max-w-7xl px-4 py-12">
          <div className="rounded-lg bg-white p-6 shadow-md">
            <div className="flex items-start gap-2">
              <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-600" />
              <div>
                <h3 className="mb-2 text-lg font-semibold text-gray-900">Fehler</h3>
                <p className="text-gray-600">{error || 'Rechnung nicht gefunden'}</p>
                <Link
                  href="/my-watches/selling/fees"
                  className="mt-4 inline-flex items-center text-primary-600 hover:text-primary-700"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Zurück zu Rechnungen
                </Link>
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  if (invoice.status === 'paid') {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="mx-auto max-w-7xl px-4 py-12">
          <Link
            href="/my-watches/selling/fees"
            className="mb-6 inline-flex items-center text-primary-600 hover:text-primary-700"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Zurück zu Rechnungen
          </Link>

          <div className="rounded-lg bg-white p-6 shadow-md">
            <div className="py-8 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 p-4">
                <CreditCard className="h-8 w-8 text-green-600" />
              </div>
              <h2 className="mb-2 text-2xl font-bold text-gray-900">Rechnung bereits bezahlt</h2>
              <p className="mb-6 text-gray-600">
                Die Rechnung {invoice.invoiceNumber} wurde bereits bezahlt.
              </p>
              <Link
                href="/my-watches/selling/fees"
                className="inline-flex items-center rounded-lg bg-primary-600 px-4 py-2 text-white hover:bg-primary-700"
              >
                Zurück zu Rechnungen
              </Link>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="mx-auto max-w-4xl px-4 py-12">
        <Link
          href="/my-watches/selling/fees"
          className="mb-6 inline-flex items-center text-primary-600 hover:text-primary-700"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Zurück zu Rechnungen
        </Link>

        <div className="mb-6 rounded-lg bg-white p-6 shadow-md">
          <h1 className="mb-2 text-2xl font-bold text-gray-900">Rechnung bezahlen</h1>
          <p className="text-gray-600">
            Rechnung: <strong>{invoice.invoiceNumber}</strong>
          </p>
          <p className="text-gray-600">
            Betrag: <strong className="text-lg">CHF {invoice.total.toFixed(2)}</strong>
          </p>
        </div>

        <InvoicePaymentMethods
          invoiceId={invoice.id}
          invoiceNumber={invoice.invoiceNumber}
          amount={invoice.total}
          onPaymentSuccess={handlePaymentSuccess}
        />

        <div className="mt-6 rounded-lg border border-blue-200 bg-blue-50 p-4">
          <p className="text-sm text-blue-800">
            <strong>Hinweis:</strong> Ihre Zahlung wird sicher über Stripe verarbeitet. Nach
            erfolgreicher Zahlung wird die Rechnung automatisch als bezahlt markiert und Ihr Konto
            wird entsperrt (falls gesperrt).
          </p>
        </div>
      </div>
      <Footer />
    </div>
  )
}
