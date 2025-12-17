'use client'

import { Clock, Tag, CheckCircle } from 'lucide-react'

interface StepPriceProps {
  formData: {
    price: string
    buyNowPrice: string
    isAuction: boolean
    auctionDuration: string
    autoRenew: boolean
  }
  onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void
  onFormDataChange: (data: Record<string, any>) => void
}

export function StepPrice({
  formData,
  onInputChange,
  onFormDataChange,
}: StepPriceProps) {
  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="mb-2 text-2xl font-bold text-gray-900">Preis festlegen</h2>
        <p className="text-gray-600">
          Wählen Sie zwischen Festpreis oder Auktion
        </p>
      </div>

      {/* Sale type selection */}
      <div className="space-y-4">
        <label className="block text-sm font-medium text-gray-700">
          Verkaufsart <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Fixed price option */}
          <button
            type="button"
            onClick={() => onFormDataChange({ isAuction: false })}
            className={`relative flex flex-col items-center gap-3 rounded-xl border-2 p-6 transition-all ${
              !formData.isAuction
                ? 'border-primary-500 bg-primary-50 ring-2 ring-primary-200'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            {!formData.isAuction && (
              <div className="absolute right-3 top-3">
                <CheckCircle className="h-6 w-6 text-primary-600" />
              </div>
            )}
            <div className={`flex h-14 w-14 items-center justify-center rounded-full ${
              !formData.isAuction ? 'bg-primary-100' : 'bg-gray-100'
            }`}>
              <Tag className={`h-7 w-7 ${!formData.isAuction ? 'text-primary-600' : 'text-gray-500'}`} />
            </div>
            <div className="text-center">
              <h3 className={`font-semibold ${!formData.isAuction ? 'text-primary-700' : 'text-gray-700'}`}>
                Sofortkauf
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Artikel wird zu einem festen Preis verkauft.
              </p>
            </div>
          </button>

          {/* Auction option */}
          <button
            type="button"
            onClick={() => onFormDataChange({ isAuction: true })}
            className={`relative flex flex-col items-center gap-3 rounded-xl border-2 p-6 transition-all ${
              formData.isAuction
                ? 'border-primary-500 bg-primary-50 ring-2 ring-primary-200'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            {formData.isAuction && (
              <div className="absolute right-3 top-3">
                <CheckCircle className="h-6 w-6 text-primary-600" />
              </div>
            )}
            <div className={`flex h-14 w-14 items-center justify-center rounded-full ${
              formData.isAuction ? 'bg-primary-100' : 'bg-gray-100'
            }`}>
              <Clock className={`h-7 w-7 ${formData.isAuction ? 'text-primary-600' : 'text-gray-500'}`} />
            </div>
            <div className="text-center">
              <h3 className={`font-semibold ${formData.isAuction ? 'text-primary-700' : 'text-gray-700'}`}>
                Auktion
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Artikel wird versteigert. Höchstbietender erhält den Artikel.
              </p>
            </div>
          </button>
        </div>
      </div>

      {/* Price inputs */}
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {/* Main price */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              {formData.isAuction ? 'Startpreis' : 'Preis'} (CHF) <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="number"
                name="price"
                required
                value={formData.price}
                onChange={onInputChange}
                min="0"
                step="0.01"
                className="w-full rounded-lg border border-gray-300 py-3 pl-12 pr-4 text-gray-900 transition-colors focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
                placeholder="z.B. 5000"
              />
              <span className="absolute left-4 top-1/2 -translate-y-1/2 font-medium text-gray-500">
                CHF
              </span>
            </div>
          </div>

          {/* Buy now price (for auctions) */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Sofortkaufpreis (CHF) <span className="text-gray-400">(Optional)</span>
            </label>
            <div className="relative">
              <input
                type="number"
                name="buyNowPrice"
                value={formData.buyNowPrice}
                onChange={onInputChange}
                min="0"
                step="0.01"
                className="w-full rounded-lg border border-gray-300 py-3 pl-12 pr-4 text-gray-900 transition-colors focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
                placeholder="z.B. 8000"
              />
              <span className="absolute left-4 top-1/2 -translate-y-1/2 font-medium text-gray-500">
                CHF
              </span>
            </div>
            <p className="text-xs text-gray-500">
              Optional: Falls leer, wird nur der normale Preis angezeigt.
            </p>
          </div>
        </div>

        {/* Auction-specific options */}
        {formData.isAuction && (
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-6">
            <h3 className="mb-4 text-lg font-semibold text-gray-900">Auktions-Einstellungen</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Auktionsdauer <span className="text-red-500">*</span>
                </label>
                <select
                  name="auctionDuration"
                  value={formData.auctionDuration}
                  onChange={onInputChange}
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 transition-colors focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
                >
                  <option value="">Bitte wählen</option>
                  <option value="1">1 Tag</option>
                  <option value="3">3 Tage</option>
                  <option value="5">5 Tage</option>
                  <option value="7">7 Tage</option>
                  <option value="10">10 Tage</option>
                  <option value="14">14 Tage</option>
                  <option value="30">30 Tage</option>
                </select>
              </div>

              <label className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-4">
                <input
                  type="checkbox"
                  name="autoRenew"
                  checked={formData.autoRenew}
                  onChange={onInputChange}
                  className="h-5 w-5 rounded border-gray-300 text-primary-600"
                />
                <div>
                  <span className="font-medium text-gray-700">Automatisch erneuern</span>
                  <p className="text-sm text-gray-500">
                    Auktion wird automatisch erneuert, wenn keine Gebote eingehen.
                  </p>
                </div>
              </label>
            </div>
          </div>
        )}
      </div>

      {/* Price hint */}
      <div className="rounded-lg bg-blue-50 p-4 text-sm text-blue-800">
        <strong>Tipp:</strong> Recherchieren Sie vergleichbare Artikel, um einen fairen Preis festzulegen.
        Ein realistischer Preis erhöht Ihre Verkaufschancen.
      </div>
    </div>
  )
}

