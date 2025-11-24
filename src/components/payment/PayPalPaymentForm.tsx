'use client'

import { useEffect, useState } from 'react'
import { PayPalScriptProvider, PayPalButtons, usePayPalScriptReducer } from '@paypal/react-paypal-js'
import { Loader2, AlertCircle } from 'lucide-react'
import { toast } from 'react-hot-toast'

interface PayPalPaymentFormProps {
  invoiceId: string
  invoiceNumber: string
  amount: number
  onSuccess?: () => void
}

const paypalClientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID

function PayPalButton({ invoiceId, invoiceNumber, amount, onSuccess }: PayPalPaymentFormProps) {
  const [{ isPending }] = usePayPalScriptReducer()
  const [isProcessing, setIsProcessing] = useState(false)

  const createOrder = async () => {
    try {
      setIsProcessing(true)
      const response = await fetch(`/api/invoices/${invoiceId}/create-paypal-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount,
          invoiceNumber,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Fehler beim Erstellen der PayPal-Bestellung')
      }

      const { orderId } = await response.json()
      return orderId
    } catch (error: any) {
      console.error('PayPal createOrder error:', error)
      toast.error(error.message || 'Fehler beim Erstellen der PayPal-Bestellung')
      setIsProcessing(false)
      throw error
    }
  }

  const onApprove = async (data: { orderID: string }) => {
    try {
      setIsProcessing(true)
      const response = await fetch(`/api/invoices/${invoiceId}/capture-paypal-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId: data.orderID,
          invoiceNumber,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Fehler bei der PayPal-Zahlung')
      }

      const result = await response.json()
      
      if (result.success) {
        toast.success('Zahlung erfolgreich!')
        onSuccess?.()
      } else {
        throw new Error(result.message || 'Zahlung fehlgeschlagen')
      }
    } catch (error: any) {
      console.error('PayPal onApprove error:', error)
      toast.error(error.message || 'Fehler bei der PayPal-Zahlung')
    } finally {
      setIsProcessing(false)
    }
  }

  const onError = (err: any) => {
    console.error('PayPal error:', err)
    toast.error('Ein Fehler ist bei der PayPal-Zahlung aufgetreten')
    setIsProcessing(false)
  }

  const onCancel = () => {
    toast.error('PayPal-Zahlung abgebrochen')
    setIsProcessing(false)
  }

  if (isPending || isProcessing) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-blue-600 mr-2" />
        <span className="text-gray-600">
          {isPending ? 'PayPal wird geladen...' : 'Zahlung wird verarbeitet...'}
        </span>
      </div>
    )
  }

  return (
    <PayPalButtons
      createOrder={createOrder}
      onApprove={onApprove}
      onError={onError}
      onCancel={onCancel}
      style={{
        layout: 'vertical',
        color: 'blue',
        shape: 'rect',
        label: 'paypal',
      }}
    />
  )
}

export function PayPalPaymentForm({ invoiceId, invoiceNumber, amount, onSuccess }: PayPalPaymentFormProps) {
  if (!paypalClientId) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start gap-2">
          <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-yellow-800">
            <strong>Hinweis:</strong> PayPal ist nicht konfiguriert. Bitte verwenden Sie eine andere Zahlungsmethode.
          </div>
        </div>
      </div>
    )
  }

  return (
    <PayPalScriptProvider
      options={{
        clientId: paypalClientId,
        currency: 'CHF',
        intent: 'capture',
      }}
    >
      <PayPalButton
        invoiceId={invoiceId}
        invoiceNumber={invoiceNumber}
        amount={amount}
        onSuccess={onSuccess}
      />
    </PayPalScriptProvider>
  )
}





