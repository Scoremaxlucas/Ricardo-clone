'use client'

import { AlertTriangle, Calendar, X } from 'lucide-react'

interface WarningDetailModalProps {
  isOpen: boolean
  onClose: () => void
  warning: {
    title: string
    message: string
    createdAt: string
    reason?: string
  } | null
}

const reasonLabels: Record<string, string> = {
  inappropriate_content: 'Unangemessener Inhalt',
  spam: 'Spam',
  fraud: 'Betrug',
  harassment: 'Belästigung',
  terms_violation: 'Verstoß gegen Nutzungsbedingungen',
  fake_account: 'Fake-Account',
  other: 'Sonstiges',
}

export function WarningDetailModal({ isOpen, onClose, warning }: WarningDetailModalProps) {
  if (!isOpen || !warning) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="relative w-full max-w-2xl rounded-lg bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-orange-100 p-2">
              <AlertTriangle className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Verwarnung</h2>
              <p className="text-sm text-gray-500">Details zu Ihrer Verwarnung</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-6">
          <div className="mb-6 rounded-lg border border-orange-200 bg-orange-50 p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-orange-600" />
              <div className="flex-1">
                <div className="mb-2 font-semibold text-orange-900">{warning.title}</div>
                {(() => {
                  // Extrahiere Grund aus der Nachricht falls vorhanden
                  const reasonMatch = warning.message.match(/Grund:\s*(.+?)(?:\n\n|$)/)
                  const extractedReason = reasonMatch ? reasonMatch[1].trim() : null
                  const messageWithoutReason = reasonMatch
                    ? warning.message.replace(/Grund:\s*.+?(\n\n|$)/, '').trim()
                    : warning.message

                  return (
                    <>
                      {extractedReason && (
                        <div className="mb-3">
                          <span className="text-sm font-medium text-orange-800">Grund: </span>
                          <span className="text-sm text-orange-700">{extractedReason}</span>
                        </div>
                      )}
                      {messageWithoutReason && (
                        <div className="whitespace-pre-wrap text-sm text-orange-800">
                          {messageWithoutReason}
                        </div>
                      )}
                    </>
                  )
                })()}
              </div>
            </div>
          </div>

          <div className="mb-4 rounded-lg bg-gray-50 p-4">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Calendar className="h-4 w-4" />
              <span>
                Erhalten am:{' '}
                {new Date(warning.createdAt).toLocaleString('de-CH', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
          </div>

          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
            <div className="text-sm text-blue-800">
              <strong>Was bedeutet das?</strong>
              <p className="mt-2">
                Sie haben eine Verwarnung von einem Administrator erhalten. Bitte beachten Sie
                unsere Nutzungsbedingungen, um weitere Verwarnungen zu vermeiden. Bei Fragen können
                Sie sich jederzeit an unseren Support wenden.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 px-6 py-4">
          <button
            onClick={onClose}
            className="w-full rounded-lg bg-primary-600 px-4 py-2 font-medium text-white hover:bg-primary-700"
          >
            Verstanden
          </button>
        </div>
      </div>
    </div>
  )
}
