'use client'

import { useState, useEffect } from 'react'
import { Package, Truck, Calendar, Loader2, Edit } from 'lucide-react'
import { toast } from 'react-hot-toast'

interface ShippingInfo {
  trackingNumber: string | null
  trackingProvider: string | null
  shippedAt: string | null
  estimatedDeliveryDate: string | null
}

interface ShippingInfoCardProps {
  purchaseId: string
  isSeller?: boolean
  onShippingAdded?: () => void
}

const TRACKING_PROVIDERS: Record<string, { name: string; url: string }> = {
  post: {
    name: 'Schweizer Post',
    url: 'https://www.post.ch/de/privatkunden/pakete-verfolgen'
  },
  dhl: {
    name: 'DHL',
    url: 'https://www.dhl.ch/de/privatkunden/pakete-verfolgen.html'
  },
  ups: {
    name: 'UPS',
    url: 'https://www.ups.com/track'
  },
  fedex: {
    name: 'FedEx',
    url: 'https://www.fedex.com/apps/fedextrack'
  }
}

export function ShippingInfoCard({ purchaseId, isSeller = false, onShippingAdded }: ShippingInfoCardProps) {
  const [shippingInfo, setShippingInfo] = useState<ShippingInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [formData, setFormData] = useState({
    trackingNumber: '',
    trackingProvider: 'post',
    estimatedDeliveryDate: ''
  })

  useEffect(() => {
    loadShippingInfo()
  }, [purchaseId])

  const loadShippingInfo = async () => {
    try {
      const res = await fetch(`/api/purchases/${purchaseId}/shipping`)
      if (res.ok) {
        const data = await res.json()
        setShippingInfo(data.shipping)
        if (data.shipping.trackingNumber) {
          setFormData({
            trackingNumber: data.shipping.trackingNumber || '',
            trackingProvider: data.shipping.trackingProvider || 'post',
            estimatedDeliveryDate: data.shipping.estimatedDeliveryDate 
              ? new Date(data.shipping.estimatedDeliveryDate).toISOString().split('T')[0]
              : ''
          })
        }
      }
    } catch (error) {
      console.error('Error loading shipping info:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.trackingNumber || !formData.trackingProvider) {
      toast.error('Bitte füllen Sie alle Pflichtfelder aus')
      return
    }

    try {
      const res = await fetch(`/api/purchases/${purchaseId}/shipping`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          trackingNumber: formData.trackingNumber,
          trackingProvider: formData.trackingProvider,
          estimatedDeliveryDate: formData.estimatedDeliveryDate || null
        })
      })

      const data = await res.json()

      if (res.ok) {
        toast.success('Versand-Informationen erfolgreich hinzugefügt')
        setEditing(false)
        loadShippingInfo()
        onShippingAdded?.()
      } else {
        toast.error(data.message || 'Fehler beim Hinzufügen der Versand-Informationen')
      }
    } catch (error) {
      console.error('Error adding shipping info:', error)
      toast.error('Fehler beim Hinzufügen der Versand-Informationen')
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 border-2 border-blue-200">
        <div className="flex items-center justify-center py-4">
          <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
          <span className="ml-2 text-gray-600 text-sm">Lade Versand-Informationen...</span>
        </div>
      </div>
    )
  }

  const provider = shippingInfo?.trackingProvider 
    ? TRACKING_PROVIDERS[shippingInfo.trackingProvider] 
    : null

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border-2 border-blue-200">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Package className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">Versand-Informationen</h3>
        </div>
        {isSeller && !shippingInfo?.trackingNumber && (
          <button
            onClick={() => setEditing(true)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Edit className="h-4 w-4 text-gray-600" />
          </button>
        )}
      </div>

      {editing && isSeller ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tracking-Nummer <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.trackingNumber}
              onChange={(e) => setFormData({ ...formData, trackingNumber: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="z.B. 98.123.456.789"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Versanddienstleister <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.trackingProvider}
              onChange={(e) => setFormData({ ...formData, trackingProvider: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              required
            >
              {Object.entries(TRACKING_PROVIDERS).map(([key, value]) => (
                <option key={key} value={key}>
                  {value.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Geschätztes Lieferdatum (optional)
            </label>
            <input
              type="date"
              value={formData.estimatedDeliveryDate}
              onChange={(e) => setFormData({ ...formData, estimatedDeliveryDate: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => {
                setEditing(false)
                loadShippingInfo()
              }}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Speichern
            </button>
          </div>
        </form>
      ) : shippingInfo?.trackingNumber ? (
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium text-gray-700">Tracking-Nummer</label>
            <div className="mt-1 flex items-center gap-2">
              <span className="font-mono text-gray-900">{shippingInfo.trackingNumber}</span>
              {provider && (
                <a
                  href={`${provider.url}?trackingNumber=${shippingInfo.trackingNumber}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-700 text-sm underline"
                >
                  Verfolgen →
                </a>
              )}
            </div>
          </div>

          {provider && (
            <div>
              <label className="text-sm font-medium text-gray-700">Versanddienstleister</label>
              <div className="mt-1 text-gray-900">{provider.name}</div>
            </div>
          )}

          {shippingInfo.shippedAt && (
            <div>
              <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                <Truck className="h-4 w-4" />
                Versandt am
              </label>
              <div className="mt-1 text-gray-900">
                {new Date(shippingInfo.shippedAt).toLocaleDateString('de-CH', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </div>
            </div>
          )}

          {shippingInfo.estimatedDeliveryDate && (
            <div>
              <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                Geschätztes Lieferdatum
              </label>
              <div className="mt-1 text-gray-900">
                {new Date(shippingInfo.estimatedDeliveryDate).toLocaleDateString('de-CH', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-6 text-gray-500">
          {isSeller ? (
            <div>
              <p className="text-sm mb-3">Noch keine Versand-Informationen hinzugefügt</p>
              <button
                onClick={() => setEditing(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
              >
                Versand-Informationen hinzufügen
              </button>
            </div>
          ) : (
            <p className="text-sm">Der Verkäufer hat noch keine Versand-Informationen hinzugefügt</p>
          )}
        </div>
      )}
    </div>
  )
}







