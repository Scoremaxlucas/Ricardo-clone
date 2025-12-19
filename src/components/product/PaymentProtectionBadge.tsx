'use client'

import { Shield, Info } from 'lucide-react'
import { useState } from 'react'
import { PaymentProtectionInfoModal } from './PaymentProtectionInfoModal'

interface PaymentProtectionBadgeProps {
  enabled: boolean
  compact?: boolean
  showInfoLink?: boolean
}

export function PaymentProtectionBadge({
  enabled,
  compact = false,
  showInfoLink = true,
}: PaymentProtectionBadgeProps) {
  const [showModal, setShowModal] = useState(false)

  if (!enabled) {
    return null // Don't show badge if payment protection is disabled
  }

  return (
    <>
      <div
        className={`flex items-center gap-2 ${
          compact ? 'text-sm' : 'text-base'
        } ${compact ? 'py-1.5' : 'py-2'} ${compact ? 'px-2' : 'px-3'} rounded-lg ${
          enabled
            ? 'bg-teal-50 border border-teal-200 text-teal-700'
            : 'bg-gray-50 border border-gray-200 text-gray-600'
        }`}
      >
        <Shield
          className={`${compact ? 'h-4 w-4' : 'h-5 w-5'} flex-shrink-0 ${
            enabled ? 'text-teal-600' : 'text-gray-400'
          }`}
        />
        <span className={`font-medium ${compact ? 'text-xs' : 'text-sm'}`}>
          Helvenda Zahlungsschutz {enabled ? 'aktiv' : 'nicht aktiviert'}
        </span>
        {showInfoLink && (
          <button
            onClick={() => setShowModal(true)}
            className={`ml-auto text-primary-600 hover:text-primary-700 underline ${
              compact ? 'text-xs' : 'text-sm'
            } font-medium transition-colors`}
          >
            Mehr erfahren
          </button>
        )}
      </div>
      {showModal && <PaymentProtectionInfoModal isOpen={showModal} onClose={() => setShowModal(false)} />}
    </>
  )
}
