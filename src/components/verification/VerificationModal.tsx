'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { X, Shield, AlertCircle } from 'lucide-react'
import Link from 'next/link'

interface VerificationModalProps {
  isOpen: boolean
  onClose: () => void
  onVerify: () => void
  action: 'buy' | 'offer' | 'bid'
}

export function VerificationModal({ isOpen, onClose, onVerify, action }: VerificationModalProps) {
  const { data: session } = useSession()
  const router = useRouter()
  const [isVerified, setIsVerified] = useState<boolean | null>(null)
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    if (isOpen && session?.user?.id) {
      checkVerification()
    } else {
      setIsChecking(false)
    }
  }, [isOpen, session])

  const checkVerification = async () => {
    try {
      const res = await fetch('/api/verification/get')
      if (res.ok) {
        const data = await res.json()
        const isApproved = data.verified === true && data.verificationStatus === 'approved'
        setIsVerified(isApproved)
      }
    } catch (error) {
      console.error('Error checking verification:', error)
    } finally {
      setIsChecking(false)
    }
  }

  const handleVerifyClick = () => {
    onClose()
    router.push('/verification')
  }

  if (!isOpen) return null

  const actionTexts = {
    buy: {
      title: 'Verifizierung erforderlich',
      message: 'Um Artikel zu kaufen, müssen Sie sich zuerst verifizieren.',
      button: 'Jetzt verifizieren',
    },
    offer: {
      title: 'Verifizierung erforderlich',
      message: 'Um Preisvorschläge zu machen, müssen Sie sich zuerst verifizieren.',
      button: 'Jetzt verifizieren',
    },
    bid: {
      title: 'Verifizierung erforderlich',
      message: 'Um bei Auktionen zu bieten, müssen Sie sich zuerst verifizieren.',
      button: 'Jetzt verifizieren',
    },
  }

  const texts = actionTexts[action]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="mx-4 w-full max-w-md rounded-lg bg-white shadow-xl">
        <div className="p-6">
          {/* Header */}
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-yellow-100 p-2">
                <Shield className="h-6 w-6 text-yellow-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">{texts.title}</h2>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 transition-colors hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <div className="mb-6">
            <div className="mb-4 flex items-start gap-3">
              <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-yellow-600" />
              <p className="text-gray-700">{texts.message}</p>
            </div>
            <p className="text-sm text-gray-600">
              Die Verifizierung dauert nur wenige Minuten und ist notwendig, um sicherzustellen,
              dass alle Transaktionen sicher abgewickelt werden.
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 rounded-md border border-gray-300 px-4 py-2 font-medium text-gray-700 transition-colors hover:bg-gray-50"
            >
              Abbrechen
            </button>
            <button
              onClick={handleVerifyClick}
              className="flex flex-1 items-center justify-center gap-2 rounded-md bg-yellow-600 px-4 py-2 font-medium text-white transition-colors hover:bg-yellow-700"
            >
              <Shield className="h-4 w-4" />
              {texts.button}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
