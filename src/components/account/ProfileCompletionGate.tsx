'use client'

import { groupMissingFields, type MissingField, type PolicyContext } from '@/lib/profilePolicy'
import { AlertCircle, ArrowRight, X } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

interface ProfileCompletionGateProps {
  context: PolicyContext
  missingFields: MissingField[]
  isOpen: boolean
  onClose: () => void
  onGoToAccount?: () => void
  title?: string
  description?: string
  blocking?: boolean // If true, user must complete profile (no "Später" button)
}

export function ProfileCompletionGate({
  context,
  missingFields,
  isOpen,
  onClose,
  onGoToAccount,
  title,
  description,
  blocking = false,
}: ProfileCompletionGateProps) {
  const router = useRouter()

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  if (!isOpen || missingFields.length === 0) {
    return null
  }

  const groupedFields = groupMissingFields(missingFields)
  const accountRoute = '/my-watches/account'

  const handleGoToAccount = () => {
    if (onGoToAccount) {
      onGoToAccount()
    } else {
      router.push(accountRoute)
    }
    onClose()
  }

  // Context-specific titles and descriptions
  const getContextInfo = () => {
    switch (context) {
      case 'SELL_PUBLISH':
        return {
          title: title || 'Profil vervollständigen',
          description:
            description ||
            'Um Ihr Angebot zu veröffentlichen, benötigen wir noch einige Angaben von Ihnen.',
        }
      case 'SELL_ENABLE_SHIPPING':
        return {
          title: title || 'Adresse erforderlich',
          description: description || 'Für den Versand benötigen wir Ihre vollständige Adresse.',
        }
      case 'PAYMENT_PROTECTION':
        return {
          title: title || 'Adresse für Zahlungsschutz erforderlich',
          description:
            description ||
            'Um den Zahlungsschutz zu aktivieren, benötigen wir Ihre vollständige Adresse.',
        }
      case 'INVOICE_ACTION':
        return {
          title: title || 'Profil für Rechnungen erforderlich',
          description:
            description ||
            'Um Rechnungen anzuzeigen oder zu bezahlen, benötigen wir Ihre vollständigen Kontaktdaten.',
        }
      case 'CHAT_ONLY':
        return {
          title: title || 'Anzeigename erforderlich',
          description: description || 'Um Nachrichten zu senden, benötigen wir einen Anzeigenamen.',
        }
      default:
        return {
          title: title || 'Profil vervollständigen',
          description: description || 'Bitte vervollständigen Sie Ihr Profil.',
        }
    }
  }

  const contextInfo = getContextInfo()

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4"
      onClick={blocking ? undefined : onClose}
    >
      <div
        className="relative w-full max-w-md rounded-xl bg-white shadow-xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Close button (only if not blocking) */}
        {!blocking && (
          <button
            onClick={onClose}
            className="absolute right-4 top-4 rounded-lg p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
            aria-label="Schließen"
          >
            <X className="h-5 w-5" />
          </button>
        )}

        {/* Header */}
        <div className="border-b border-gray-200 p-4 sm:p-6">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-amber-100">
              <AlertCircle className="h-5 w-5 text-amber-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-base sm:text-lg font-semibold text-gray-900 break-words">{contextInfo.title}</h2>
              <p className="mt-1 text-sm text-gray-600 break-words">{contextInfo.description}</p>
            </div>
          </div>
        </div>

        {/* Missing fields list */}
        <div className="p-4 sm:p-6">
          <div className="mb-4">
            <p className="mb-3 text-sm font-medium text-gray-700">Fehlende Angaben:</p>
            <ul className="space-y-2">
              {groupedFields.map((fieldGroup, index) => (
                <li key={index} className="flex items-start gap-2 text-sm text-gray-600">
                  <X className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-500" />
                  <span>{fieldGroup}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Helper text */}
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
            <p className="text-xs text-gray-600">
              Ihre Adresse wird nicht öffentlich angezeigt und nur bei Versand, Zahlungsschutz oder
              Rechnungen verwendet.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="border-t border-gray-200 p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            {!blocking && (
              <button
                onClick={onClose}
                className="order-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 sm:order-1"
              >
                Später
              </button>
            )}
            <Link
              href={accountRoute}
              onClick={handleGoToAccount}
              className="order-1 flex items-center justify-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-700 sm:order-2"
            >
              Jetzt ergänzen
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
