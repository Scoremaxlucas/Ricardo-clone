'use client'

import { formatCHF } from '@/lib/product-utils'
import { calculateShippingCost, ShippingSelection } from '@/lib/shipping-calculator'
import { Loader2, MapPin, Package } from 'lucide-react'
import { useEffect, useState } from 'react'

export interface ShippingOption {
  code: string
  label: string
  price: number
  service: 'economy' | 'priority'
  weightTier: 2 | 10 | 30
}

export interface ShippingSelectorProps {
  watch: {
    id: string
    price: number
    buyNowPrice?: number | null
    deliveryMode: 'shipping_only' | 'pickup_only' | 'shipping_and_pickup' | null
    freeShippingThresholdChf: number | null
    shippingProfile: string | null // JSON string
    pickupLocationZip: string | null
    pickupLocationCity: string | null
  }
  onSelectionChange: (selection: {
    deliveryMode: 'shipping' | 'pickup'
    shippingCode?: string
    addons?: string[]
  }) => void
  initialSelection?: {
    deliveryMode: 'shipping' | 'pickup'
    shippingCode?: string
    addons?: string[]
  }
}

export function ShippingSelector({
  watch,
  onSelectionChange,
  initialSelection,
}: ShippingSelectorProps) {
  const [selectedDeliveryMode, setSelectedDeliveryMode] = useState<'shipping' | 'pickup'>(
    initialSelection?.deliveryMode || 'shipping'
  )
  const [selectedShippingCode, setSelectedShippingCode] = useState<string | undefined>(
    initialSelection?.shippingCode
  )
  const [selectedAddons, setSelectedAddons] = useState<string[]>(initialSelection?.addons || [])
  const [calculatedPrices, setCalculatedPrices] = useState<Record<string, number>>({})
  const [isCalculating, setIsCalculating] = useState(false)

  // Parse shipping profile
  const shippingProfile = watch.shippingProfile
    ? (JSON.parse(watch.shippingProfile) as {
        base_service?: 'economy' | 'priority'
        weight_tier?: 2 | 10 | 30
        addons_allowed?: { sperrgut?: boolean; pickhome?: boolean }
      })
    : null

  const allowedAddons = shippingProfile?.addons_allowed || {
    sperrgut: false,
    pickhome: false,
  }

  const itemPrice = watch.buyNowPrice || watch.price

  // Berechne Preise für alle verfügbaren Versandoptionen
  useEffect(() => {
    if (selectedDeliveryMode === 'shipping' && shippingProfile) {
      setIsCalculating(true)
      const prices: Record<string, number> = {}

      // Economy Optionen
      if (shippingProfile.base_service === 'economy' || !shippingProfile.base_service) {
        for (const weightTier of [2, 10, 30] as const) {
          if (!shippingProfile.weight_tier || shippingProfile.weight_tier >= weightTier) {
            const code = `post_economy_${weightTier}kg`
            const selection: ShippingSelection = {
              service: 'economy',
              weightTier,
              addons: {},
            }

            calculateShippingCost(
              selection,
              itemPrice,
              watch.freeShippingThresholdChf,
              allowedAddons
            )
              .then(result => {
                prices[code] = result.total
                setCalculatedPrices(prev => ({ ...prev, ...prices }))
              })
              .catch(() => {})
          }
        }
      }

      // Priority Optionen
      if (shippingProfile.base_service === 'priority' || !shippingProfile.base_service) {
        for (const weightTier of [2, 10, 30] as const) {
          if (!shippingProfile.weight_tier || shippingProfile.weight_tier >= weightTier) {
            const code = `post_priority_${weightTier}kg`
            const selection: ShippingSelection = {
              service: 'priority',
              weightTier,
              addons: {},
            }

            calculateShippingCost(
              selection,
              itemPrice,
              watch.freeShippingThresholdChf,
              allowedAddons
            )
              .then(result => {
                prices[code] = result.total
                setCalculatedPrices(prev => ({ ...prev, ...prices }))
              })
              .catch(() => {})
          }
        }
      }

      setIsCalculating(false)
    }
  }, [
    selectedDeliveryMode,
    shippingProfile,
    itemPrice,
    watch.freeShippingThresholdChf,
    allowedAddons,
  ])

  // Notify parent of selection changes
  useEffect(() => {
    onSelectionChange({
      deliveryMode: selectedDeliveryMode,
      shippingCode: selectedDeliveryMode === 'shipping' ? selectedShippingCode : undefined,
      addons: selectedAddons,
    })
  }, [selectedDeliveryMode, selectedShippingCode, selectedAddons, onSelectionChange])

  // Verfügbare Versandoptionen basierend auf shippingProfile
  const availableShippingOptions: ShippingOption[] = []
  if (shippingProfile) {
    const service = shippingProfile.base_service || 'economy'
    const weightTier = shippingProfile.weight_tier || 30

    for (const tier of [2, 10, 30] as const) {
      if (tier <= weightTier) {
        availableShippingOptions.push({
          code: `post_${service}_${tier}kg`,
          label:
            service === 'economy'
              ? `Versand als Paket Economy (B-Post) bis ${tier} kg`
              : `Versand als Paket Priority (A-Post) bis ${tier} kg`,
          price: calculatedPrices[`post_${service}_${tier}kg`] || 0,
          service,
          weightTier: tier,
        })
      }
    }

    // Wenn beide Services erlaubt sind
    if (!shippingProfile.base_service) {
      for (const tier of [2, 10, 30] as const) {
        if (tier <= weightTier) {
          availableShippingOptions.push({
            code: `post_priority_${tier}kg`,
            label: `Versand als Paket Priority (A-Post) bis ${tier} kg`,
            price: calculatedPrices[`post_priority_${tier}kg`] || 0,
            service: 'priority',
            weightTier: tier,
          })
        }
      }
    }
  }

  const canPickup =
    watch.deliveryMode === 'pickup_only' || watch.deliveryMode === 'shipping_and_pickup'
  const canShip =
    watch.deliveryMode === 'shipping_only' || watch.deliveryMode === 'shipping_and_pickup'

  if (!canPickup && !canShip) {
    return null
  }

  return (
    <div className="space-y-4 rounded-lg border border-gray-200 bg-white p-4">
      <h3 className="font-medium text-gray-900">Liefermethode wählen</h3>

      {/* Pickup Option */}
      {canPickup && (
        <label className="flex cursor-pointer items-start gap-3 rounded-lg border-2 border-gray-200 p-3 transition-all hover:border-gray-300">
          <input
            type="radio"
            name="deliveryMode"
            value="pickup"
            checked={selectedDeliveryMode === 'pickup'}
            onChange={() => setSelectedDeliveryMode('pickup')}
            className="mt-1 h-4 w-4 text-primary-600 focus:ring-primary-500"
          />
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-gray-400" />
              <span className="font-medium text-gray-900">Abholung (Kostenlos)</span>
            </div>
            {watch.pickupLocationZip && watch.pickupLocationCity && (
              <p className="mt-1 text-sm text-gray-600">
                {watch.pickupLocationZip} {watch.pickupLocationCity}
              </p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              Die genaue Adresse erhalten Sie nach dem Kauf.
            </p>
          </div>
        </label>
      )}

      {/* Shipping Options */}
      {canShip && (
        <div className="space-y-2">
          {availableShippingOptions.length === 0 && isCalculating && (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
            </div>
          )}

          {availableShippingOptions.map(option => (
            <label
              key={option.code}
              className={`flex cursor-pointer items-start gap-3 rounded-lg border-2 p-3 transition-all ${
                selectedDeliveryMode === 'shipping' && selectedShippingCode === option.code
                  ? 'border-primary-600 bg-primary-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <input
                type="radio"
                name="deliveryMode"
                value={option.code}
                checked={
                  selectedDeliveryMode === 'shipping' && selectedShippingCode === option.code
                }
                onChange={() => {
                  setSelectedDeliveryMode('shipping')
                  setSelectedShippingCode(option.code)
                }}
                className="mt-1 h-4 w-4 text-primary-600 focus:ring-primary-500"
              />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Package className="h-5 w-5 text-gray-400" />
                    <span className="text-sm font-medium text-gray-900">{option.label}</span>
                  </div>
                  <span className="text-sm font-semibold text-gray-900">
                    {option.price === 0 ? (
                      <span className="text-green-600">Kostenlos</span>
                    ) : (
                      formatCHF(option.price)
                    )}
                  </span>
                </div>
                {option.price === 0 && watch.freeShippingThresholdChf && (
                  <p className="mt-1 text-xs text-gray-500">
                    Kostenlos ab {formatCHF(watch.freeShippingThresholdChf)}
                  </p>
                )}
              </div>
            </label>
          ))}
        </div>
      )}

      {/* Add-ons (nur wenn Versand gewählt) */}
      {selectedDeliveryMode === 'shipping' && selectedShippingCode && (
        <div className="mt-4 space-y-2 border-t border-gray-200 pt-4">
          <h4 className="text-sm font-medium text-gray-700">Zusatzoptionen</h4>

          {allowedAddons.sperrgut && (
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={selectedAddons.includes('sperrgut')}
                onChange={e => {
                  if (e.target.checked) {
                    setSelectedAddons([...selectedAddons, 'sperrgut'])
                  } else {
                    setSelectedAddons(selectedAddons.filter(a => a !== 'sperrgut'))
                  }
                }}
                className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm text-gray-700">Sperrgut-Zuschlag (+ {formatCHF(13.0)})</span>
            </label>
          )}

          {allowedAddons.pickhome && (
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={selectedAddons.includes('pickhome')}
                onChange={e => {
                  if (e.target.checked) {
                    setSelectedAddons([...selectedAddons, 'pickhome'])
                  } else {
                    setSelectedAddons(selectedAddons.filter(a => a !== 'pickhome'))
                  }
                }}
                className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm text-gray-700">Pick@home-Zuschlag (+ {formatCHF(3.4)})</span>
            </label>
          )}
        </div>
      )}

      {/* Summary */}
      {selectedDeliveryMode === 'shipping' && selectedShippingCode && (
        <div className="mt-4 rounded-md bg-gray-50 p-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Artikelpreis:</span>
            <span className="font-medium text-gray-900">{formatCHF(itemPrice)}</span>
          </div>
          <div className="mt-1 flex items-center justify-between text-sm">
            <span className="text-gray-600">Versand:</span>
            <span className="font-medium text-gray-900">
              {calculatedPrices[selectedShippingCode] === 0 ? (
                <span className="text-green-600">Kostenlos</span>
              ) : (
                formatCHF(calculatedPrices[selectedShippingCode] || 0)
              )}
            </span>
          </div>
          {selectedAddons.length > 0 && (
            <div className="mt-1 flex items-center justify-between text-xs text-gray-500">
              <span>Zuschläge:</span>
              <span>
                +{' '}
                {formatCHF(
                  (selectedAddons.includes('sperrgut') ? 13.0 : 0) +
                    (selectedAddons.includes('pickhome') ? 3.4 : 0)
                )}
              </span>
            </div>
          )}
          <div className="mt-2 flex items-center justify-between border-t border-gray-200 pt-2 text-base font-semibold">
            <span className="text-gray-900">Gesamt:</span>
            <span className="text-primary-600">
              {formatCHF(
                itemPrice +
                  (calculatedPrices[selectedShippingCode] || 0) +
                  (selectedAddons.includes('sperrgut') ? 13.0 : 0) +
                  (selectedAddons.includes('pickhome') ? 3.4 : 0)
              )}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
