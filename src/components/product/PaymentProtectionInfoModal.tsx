'use client'

import { CheckCircle2, Shield, X } from 'lucide-react'
import Link from 'next/link'

interface PaymentProtectionInfoModalProps {
  isOpen: boolean
  onClose: () => void
}

export function PaymentProtectionInfoModal({ isOpen, onClose }: PaymentProtectionInfoModalProps) {
  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative mx-4 w-full max-w-md rounded-xl bg-white p-6 shadow-xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
          aria-label="Schließen"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header */}
        <div className="mb-6 flex items-center gap-3">
          <div className="rounded-lg bg-teal-100 p-2">
            <Shield className="h-6 w-6 text-teal-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Helvenda Zahlungsschutz</h2>
            <p className="text-sm text-gray-600">Sicherer Kauf mit Schutz</p>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-teal-600" />
            <div>
              <p className="font-semibold text-gray-900">Sichere Zahlung</p>
              <p className="text-sm text-gray-600">
                Der Verkäufer erhält das Geld erst nach Ihrer Bestätigung, dass der Artikel wie
                beschrieben angekommen ist.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-teal-600" />
            <div>
              <p className="font-semibold text-gray-900">Hilfe bei Problemen</p>
              <p className="text-sm text-gray-600">
                Bei Problemen mit Lieferung oder Artikel erhalten Sie Unterstützung durch unseren
                Support.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-teal-600" />
            <div>
              <p className="font-semibold text-gray-900">Unterstützung durch Support</p>
              <p className="text-sm text-gray-600">
                Unser Team steht Ihnen bei Fragen oder Problemen zur Verfügung und vermittelt bei
                Streitigkeiten.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 border-t border-gray-200 pt-4">
          <Link
            href="/hilfe/zahlungsschutz"
            className="text-sm font-medium text-primary-600 transition-colors hover:text-primary-700"
            onClick={onClose}
          >
            Mehr Informationen zum Zahlungsschutz →
          </Link>
        </div>
      </div>
    </div>
  )
}
