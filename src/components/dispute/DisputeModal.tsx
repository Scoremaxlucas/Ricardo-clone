'use client'

import { AlertTriangle, Clock, FileText, Loader2, Shield, Trash2, Upload, X } from 'lucide-react'
import { useRef, useState } from 'react'
import { toast } from 'react-hot-toast'

interface DisputeModalProps {
  isOpen: boolean
  onClose: () => void
  purchaseId: string
  purchaseDate?: Date | string
  onDisputeOpened?: () => void
  isSeller?: boolean
}

// Dispute-Gründe für Käufer (erweitert)
const BUYER_DISPUTE_REASONS = [
  {
    value: 'item_not_received',
    label: 'Artikel nicht erhalten',
    description: 'Sie haben den Artikel trotz Bezahlung nicht erhalten',
    urgent: true,
  },
  {
    value: 'item_damaged',
    label: 'Artikel beschädigt',
    description: 'Der Artikel kam beschädigt an',
    urgent: true,
  },
  {
    value: 'item_wrong',
    label: 'Falscher Artikel geliefert',
    description: 'Sie haben einen anderen Artikel erhalten als bestellt',
  },
  {
    value: 'item_not_as_described',
    label: 'Nicht wie beschrieben',
    description: 'Der Artikel entspricht nicht der Beschreibung im Inserat',
  },
  {
    value: 'seller_not_responding',
    label: 'Verkäufer antwortet nicht',
    description: 'Der Verkäufer reagiert nicht auf Ihre Nachrichten',
  },
  {
    value: 'other',
    label: 'Sonstiges',
    description: 'Ein anderes Problem, das nicht in die obigen Kategorien passt',
  },
]

// Dispute-Gründe für Verkäufer (erweitert)
const SELLER_DISPUTE_REASONS = [
  {
    value: 'payment_not_received',
    label: 'Zahlung nicht erhalten',
    description: 'Sie haben die Zahlung für den Artikel nicht erhalten',
    urgent: true,
  },
  {
    value: 'payment_not_confirmed',
    label: 'Zahlung nicht bestätigt',
    description: 'Der Käufer behauptet bezahlt zu haben, aber Sie haben keine Zahlung erhalten',
  },
  {
    value: 'buyer_not_responding',
    label: 'Käufer antwortet nicht',
    description: 'Der Käufer reagiert nicht auf Ihre Nachrichten',
  },
  {
    value: 'buyer_not_paying',
    label: 'Käufer zahlt nicht',
    description: 'Der Käufer hat den Artikel gekauft aber zahlt nicht',
  },
  {
    value: 'other',
    label: 'Sonstiges',
    description: 'Ein anderes Problem, das nicht in die obigen Kategorien passt',
  },
]

// Konfiguration
const DISPUTE_OPEN_DEADLINE_DAYS = 30

export function DisputeModal({
  isOpen,
  onClose,
  purchaseId,
  purchaseDate,
  onDisputeOpened,
  isSeller = false,
}: DisputeModalProps) {
  const DISPUTE_REASONS = isSeller ? SELLER_DISPUTE_REASONS : BUYER_DISPUTE_REASONS
  const [reason, setReason] = useState<string>('')
  const [description, setDescription] = useState<string>('')
  const [attachments, setAttachments] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)
  const [loading, setLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  if (!isOpen) return null

  // Berechne verbleibende Tage für Dispute-Eröffnung
  const purchaseDateObj = purchaseDate ? new Date(purchaseDate) : null
  const deadlineDate = purchaseDateObj
    ? new Date(purchaseDateObj.getTime() + DISPUTE_OPEN_DEADLINE_DAYS * 24 * 60 * 60 * 1000)
    : null
  const daysRemaining = deadlineDate
    ? Math.max(0, Math.ceil((deadlineDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : null

  const selectedReason = DISPUTE_REASONS.find(r => r.value === reason)

  // Datei-Upload Handler
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    if (attachments.length + files.length > 5) {
      toast.error('Maximal 5 Dateien erlaubt')
      return
    }

    setUploading(true)
    const newAttachments: string[] = []

    for (const file of Array.from(files)) {
      // Validiere Dateityp
      if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
        toast.error(`${file.name}: Nur Bilder und PDFs erlaubt`)
        continue
      }

      // Validiere Dateigröße (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name}: Maximale Dateigröße ist 5MB`)
        continue
      }

      try {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('type', 'dispute')

        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        })

        if (res.ok) {
          const data = await res.json()
          newAttachments.push(data.url)
        } else {
          toast.error(`Fehler beim Hochladen von ${file.name}`)
        }
      } catch (error) {
        console.error('Upload error:', error)
        toast.error(`Fehler beim Hochladen von ${file.name}`)
      }
    }

    setAttachments(prev => [...prev, ...newAttachments])
    setUploading(false)

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!reason || !description.trim()) {
      toast.error('Bitte wählen Sie einen Grund aus und geben Sie eine Beschreibung ein')
      return
    }

    if (description.trim().length < 20) {
      toast.error('Bitte geben Sie eine ausführlichere Beschreibung ein (mind. 20 Zeichen)')
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`/api/purchases/${purchaseId}/dispute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reason,
          description: description.trim(),
          attachments: attachments.length > 0 ? attachments : undefined,
        }),
      })

      const data = await res.json()

      if (res.ok) {
        toast.success(
          'Dispute erfolgreich eröffnet. Ein Admin wird sich innerhalb von 14 Tagen darum kümmern.',
          {
            duration: 5000,
          }
        )
        setReason('')
        setDescription('')
        setAttachments([])
        onDisputeOpened?.()
        onClose()
      } else {
        if (data.deadlineExpired) {
          toast.error(data.message, { duration: 6000 })
        } else {
          toast.error(data.message || 'Fehler beim Eröffnen des Disputes')
        }
      }
    } catch (error) {
      console.error('Error opening dispute:', error)
      toast.error('Fehler beim Eröffnen des Disputes')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-red-100 p-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Problem melden</h2>
              <p className="text-sm text-gray-500">{isSeller ? 'Als Verkäufer' : 'Als Käufer'}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
            aria-label="Dialog schließen"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 p-6">
          {/* Frist-Hinweis */}
          {daysRemaining !== null && (
            <div
              className={`flex items-start gap-3 rounded-lg border p-4 ${
                daysRemaining <= 7 ? 'border-orange-200 bg-orange-50' : 'border-blue-200 bg-blue-50'
              }`}
            >
              <Clock
                className={`mt-0.5 h-5 w-5 flex-shrink-0 ${
                  daysRemaining <= 7 ? 'text-orange-500' : 'text-blue-500'
                }`}
              />
              <div>
                <p
                  className={`text-sm font-medium ${
                    daysRemaining <= 7 ? 'text-orange-800' : 'text-blue-800'
                  }`}
                >
                  {daysRemaining > 0
                    ? `Noch ${daysRemaining} Tag${daysRemaining !== 1 ? 'e' : ''} Zeit für einen Dispute`
                    : 'Heute letzter Tag für einen Dispute'}
                </p>
                <p
                  className={`text-xs ${daysRemaining <= 7 ? 'text-orange-600' : 'text-blue-600'}`}
                >
                  Disputes können nur innerhalb von {DISPUTE_OPEN_DEADLINE_DAYS} Tagen nach dem Kauf
                  eröffnet werden.
                </p>
              </div>
            </div>
          )}

          {/* Info-Box */}
          <div className="flex items-start gap-3 rounded-lg border border-gray-200 bg-gray-50 p-4">
            <Shield className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary-500" />
            <div>
              <p className="text-sm font-medium text-gray-800">Was passiert bei einem Dispute?</p>
              <ul className="mt-1 list-inside list-disc space-y-0.5 text-xs text-gray-600">
                <li>Der Kaufprozess wird vorübergehend eingefroren</li>
                <li>Ein Admin prüft den Fall innerhalb von 14 Tagen</li>
                <li>Beide Parteien können Stellung nehmen</li>
                <li>Bei berechtigten Fällen erfolgt eine Rückerstattung</li>
              </ul>
            </div>
          </div>

          {/* Grund auswählen */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Was ist das Problem? <span className="text-red-500">*</span>
            </label>
            <div className="space-y-2">
              {DISPUTE_REASONS.map(r => (
                <label
                  key={r.value}
                  className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-all ${
                    reason === r.value
                      ? 'border-primary-500 bg-primary-50 ring-1 ring-primary-500'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="reason"
                    value={r.value}
                    checked={reason === r.value}
                    onChange={e => setReason(e.target.value)}
                    className="mt-1 h-4 w-4 text-primary-600 focus:ring-primary-500"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">{r.label}</span>
                      {r.urgent && (
                        <span className="rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-medium text-red-700">
                          Dringend
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500">{r.description}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Beschreibung */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Beschreiben Sie das Problem <span className="text-red-500">*</span>
            </label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={5}
              className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm placeholder-gray-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500"
              placeholder={
                selectedReason?.value === 'item_not_received'
                  ? 'Wann haben Sie zuletzt vom Verkäufer gehört? Wurde eine Sendungsverfolgung bereitgestellt?'
                  : selectedReason?.value === 'item_damaged'
                    ? 'Beschreiben Sie den Schaden. Wann haben Sie ihn bemerkt? Haben Sie Fotos?'
                    : 'Bitte beschreiben Sie das Problem so detailliert wie möglich...'
              }
              required
              minLength={20}
            />
            <div className="mt-1 flex items-center justify-between">
              <p className="text-xs text-gray-500">
                Je detaillierter, desto schneller kann geholfen werden.
              </p>
              <span
                className={`text-xs ${description.length < 20 ? 'text-red-500' : 'text-gray-400'}`}
              >
                {description.length}/20 min.
              </span>
            </div>
          </div>

          {/* Datei-Upload */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Beweismaterial (optional)
            </label>
            <div className="rounded-lg border-2 border-dashed border-gray-300 p-4 text-center">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,application/pdf"
                multiple
                onChange={handleFileUpload}
                className="hidden"
                id="dispute-files"
                disabled={uploading || attachments.length >= 5}
              />
              <label
                htmlFor="dispute-files"
                className={`flex cursor-pointer flex-col items-center gap-2 ${
                  uploading || attachments.length >= 5 ? 'opacity-50' : ''
                }`}
              >
                {uploading ? (
                  <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                ) : (
                  <Upload className="h-8 w-8 text-gray-400" />
                )}
                <span className="text-sm text-gray-600">
                  {uploading
                    ? 'Wird hochgeladen...'
                    : attachments.length >= 5
                      ? 'Maximum erreicht (5 Dateien)'
                      : 'Klicken zum Hochladen oder Dateien hierher ziehen'}
                </span>
                <span className="text-xs text-gray-400">
                  Bilder oder PDFs, max. 5MB pro Datei, max. 5 Dateien
                </span>
              </label>
            </div>

            {/* Hochgeladene Dateien */}
            {attachments.length > 0 && (
              <div className="mt-3 space-y-2">
                {attachments.map((url, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 p-2"
                  >
                    {url.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                      <img
                        src={url}
                        alt={`Anhang ${index + 1}`}
                        className="h-10 w-10 rounded object-cover"
                      />
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded bg-gray-200">
                        <FileText className="h-5 w-5 text-gray-500" />
                      </div>
                    )}
                    <span className="flex-1 truncate text-sm text-gray-600">
                      Anhang {index + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeAttachment(index)}
                      className="rounded p-1 text-gray-400 hover:bg-gray-200 hover:text-red-500"
                      aria-label={`Anhang ${index + 1} entfernen`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Buttons */}
          <div className="flex gap-3 border-t border-gray-200 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 font-medium text-gray-700 transition-colors hover:bg-gray-50"
              disabled={loading}
            >
              Abbrechen
            </button>
            <button
              type="submit"
              className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50"
              disabled={loading || !reason || description.length < 20}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Wird verarbeitet...
                </>
              ) : (
                'Problem melden'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
