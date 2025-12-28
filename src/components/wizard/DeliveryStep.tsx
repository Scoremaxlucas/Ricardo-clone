'use client'

import { formatCHF } from '@/lib/product-utils'
import { calculateShippingCost, ShippingSelection } from '@/lib/shipping-calculator'
import { AlertCircle, Info, MapPin, Package, Truck } from 'lucide-react'
import { useEffect, useState } from 'react'

export interface DeliveryFormData {
  deliveryMode: 'shipping_only' | 'pickup_only' | 'shipping_and_pickup'
  freeShippingThresholdChf: number | null
  pickupLocationZip: string
  pickupLocationCity: string
  pickupLocationAddress: string
  shippingService: 'economy' | 'priority' | ''
  shippingWeightTier: 2 | 10 | 30 | null
  addonsAllowed: {
    sperrgut: boolean
    pickhome: boolean
  }
}

interface DeliveryStepProps {
  formData: DeliveryFormData
  itemPrice: number
  onFormDataChange: (data: Partial<DeliveryFormData>) => void
  hasInteracted?: boolean
  showValidation?: boolean
}

export function DeliveryStep({
  formData,
  itemPrice,
  onFormDataChange,
  hasInteracted = false,
  showValidation = false,
}: DeliveryStepProps) {
  const [calculatedPrice, setCalculatedPrice] = useState<number | null>(null)
  const [isCalculating, setIsCalculating] = useState(false)

  // Berechne Versandpreis live
  useEffect(() => {
    if (
      formData.deliveryMode !== 'pickup_only' &&
      formData.shippingService &&
      formData.shippingWeightTier
    ) {
      setIsCalculating(true)
      const selection: ShippingSelection = {
        service: formData.shippingService as 'economy' | 'priority',
        weightTier: formData.shippingWeightTier,
        addons: {},
      }

      calculateShippingCost(
        selection,
        itemPrice,
        formData.freeShippingThresholdChf,
        formData.addonsAllowed
      )
        .then(result => {
          setCalculatedPrice(result.total)
          setIsCalculating(false)
        })
        .catch(() => {
          setIsCalculating(false)
        })
    } else {
      setCalculatedPrice(null)
    }
  }, [
    formData.deliveryMode,
    formData.shippingService,
    formData.shippingWeightTier,
    formData.freeShippingThresholdChf,
    formData.addonsAllowed,
    itemPrice,
  ])

  const hasError =
    showValidation &&
    (formData.deliveryMode === 'pickup_only'
      ? !formData.pickupLocationZip || !formData.pickupLocationCity
      : !formData.shippingService || !formData.shippingWeightTier)

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="mb-1 text-xl font-bold text-gray-900 md:mb-2 md:text-2xl">Lieferung</h2>
        <p className="text-sm text-gray-600 md:text-base">
          Legen Sie fest, wie der Artikel geliefert werden soll
        </p>
      </div>

      {/* Delivery Mode Selection */}
      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700">
          Lieferart <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {[
            {
              id: 'shipping_only',
              label: 'Nur Versand',
              description: 'Artikel wird nur per Post versendet',
              icon: Package,
            },
            {
              id: 'pickup_only',
              label: 'Nur Abholung',
              description: 'Artikel kann nur abgeholt werden',
              icon: MapPin,
            },
            {
              id: 'shipping_and_pickup',
              label: 'Versand & Abholung',
              description: 'Käufer kann wählen',
              icon: Truck,
            },
          ].map(option => (
            <button
              key={option.id}
              type="button"
              onClick={() =>
                onFormDataChange({
                  deliveryMode: option.id as DeliveryFormData['deliveryMode'],
                })
              }
              className={`flex flex-col items-start gap-2 rounded-lg border-2 p-4 text-left transition-all ${
                formData.deliveryMode === option.id
                  ? 'border-primary-600 bg-primary-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <option.icon
                className={`h-5 w-5 ${
                  formData.deliveryMode === option.id ? 'text-primary-600' : 'text-gray-400'
                }`}
              />
              <div>
                <div className="font-medium text-gray-900">{option.label}</div>
                <div className="text-xs text-gray-500">{option.description}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Shipping Configuration */}
      {formData.deliveryMode !== 'pickup_only' && (
        <div className="space-y-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
          <h3 className="font-medium text-gray-900">Versandkonfiguration</h3>

          {/* Service Selection */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Versandart <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.shippingService}
              onChange={e =>
                onFormDataChange({
                  shippingService: e.target.value as 'economy' | 'priority' | '',
                })
              }
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            >
              <option value="">Bitte wählen</option>
              <option value="economy">Economy (B-Post)</option>
              <option value="priority">Priority (A-Post)</option>
            </select>
          </div>

          {/* Weight Tier Selection */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Gewichtsklasse <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.shippingWeightTier || ''}
              onChange={e =>
                onFormDataChange({
                  shippingWeightTier: e.target.value
                    ? (parseInt(e.target.value) as 2 | 10 | 30)
                    : null,
                })
              }
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            >
              <option value="">Bitte wählen</option>
              <option value="2">bis 2 kg</option>
              <option value="10">bis 10 kg</option>
              <option value="30">bis 30 kg</option>
            </select>
          </div>

          {/* Live Price Display */}
          {calculatedPrice !== null && (
            <div className="rounded-md border border-gray-200 bg-white p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Versandpreis:</span>
                <span className="text-lg font-semibold text-gray-900">
                  {isCalculating ? (
                    '...'
                  ) : calculatedPrice === 0 ? (
                    <span className="text-green-600">Kostenlos</span>
                  ) : (
                    formatCHF(calculatedPrice)
                  )}
                </span>
              </div>
              {calculatedPrice === 0 && formData.freeShippingThresholdChf && (
                <div className="mt-1 text-xs text-gray-500">
                  (Kostenlos ab {formatCHF(formData.freeShippingThresholdChf)})
                </div>
              )}
            </div>
          )}

          {/* Add-ons */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Zusatzoptionen</label>
            <div className="space-y-2">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.addonsAllowed.sperrgut}
                  onChange={e =>
                    onFormDataChange({
                      addonsAllowed: {
                        ...formData.addonsAllowed,
                        sperrgut: e.target.checked,
                      },
                    })
                  }
                  className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700">Sperrgut anbieten (+ CHF 13.00)</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.addonsAllowed.pickhome}
                  onChange={e =>
                    onFormDataChange({
                      addonsAllowed: {
                        ...formData.addonsAllowed,
                        pickhome: e.target.checked,
                      },
                    })
                  }
                  className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700">Pick@home anbieten (+ CHF 3.40)</span>
              </label>
            </div>
          </div>

          {/* Free Shipping Threshold */}
          <div>
            <label className="mb-2 flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.freeShippingThresholdChf !== null}
                onChange={e =>
                  onFormDataChange({
                    freeShippingThresholdChf: e.target.checked ? itemPrice : null,
                  })
                }
                className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm font-medium text-gray-700">
                Kostenloser Versand ab bestimmten Betrag
              </span>
            </label>
            {formData.freeShippingThresholdChf !== null && (
              <div className="mt-2">
                <input
                  type="number"
                  step="0.05"
                  min="0"
                  value={formData.freeShippingThresholdChf || ''}
                  onChange={e =>
                    onFormDataChange({
                      freeShippingThresholdChf: e.target.value ? parseFloat(e.target.value) : null,
                    })
                  }
                  placeholder="z.B. 100.00"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Versand wird kostenlos, wenn Artikelpreis ≥ diesem Betrag
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Pickup Location */}
      {formData.deliveryMode !== 'shipping_only' && (
        <div className="space-y-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
          <h3 className="font-medium text-gray-900">Abholort</h3>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                PLZ <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.pickupLocationZip}
                onChange={e => onFormDataChange({ pickupLocationZip: e.target.value })}
                placeholder="8000"
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Ort <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.pickupLocationCity}
                onChange={e => onFormDataChange({ pickupLocationCity: e.target.value })}
                placeholder="Zürich"
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Adresse (privat)</label>
            <input
              type="text"
              value={formData.pickupLocationAddress}
              onChange={e => onFormDataChange({ pickupLocationAddress: e.target.value })}
              placeholder="Musterstrasse 123"
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            />
            <p className="mt-1 flex items-start gap-1 text-xs text-gray-500">
              <Info className="mt-0.5 h-3 w-3 flex-shrink-0" />
              Diese Adresse wird erst nach dem Kauf dem Käufer angezeigt.
            </p>
          </div>
        </div>
      )}

      {/* Validation Error */}
      {hasError && (
        <div className="flex items-center gap-2 rounded-md bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4" />
          <span>
            {formData.deliveryMode === 'pickup_only'
              ? 'Bitte geben Sie PLZ und Ort für die Abholung an.'
              : 'Bitte wählen Sie Versandart und Gewichtsklasse.'}
          </span>
        </div>
      )}
    </div>
  )
}
