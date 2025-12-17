'use client'

import { Clock, Tag, CheckCircle, Info } from 'lucide-react'

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

// Format number with Swiss thousands separator
function formatSwissNumber(value: string): string {
  const num = parseFloat(value)
  if (isNaN(num)) return ''
  return num.toLocaleString('de-CH', { minimumFractionDigits: 0, maximumFractionDigits: 2 })
}

export function StepPrice({
  formData,
  onInputChange,
  onFormDataChange,
}: StepPriceProps) {
  // Validate buy-now price against start price for auctions
  const buyNowValid = !formData.buyNowPrice || 
    (parseFloat(formData.buyNowPrice) > parseFloat(formData.price || '0'))

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
            onClick={() => onFormDataChange({ isAuction: false, auctionDuration: '', buyNowPrice: '' })}
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
                Festpreis
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Verkauf zu einem festen Preis (Sofortkauf)
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
                Bieter konkurrieren um Ihren Artikel
              </p>
            </div>
          </button>
        </div>
      </div>

      {/* Price inputs - conditional based on sale type */}
      <div className="space-y-6">
        {!formData.isAuction ? (
          /* FIXED PRICE MODE - Only show price field */
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Preis (CHF) <span className="text-red-500">*</span>
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
                className="w-full rounded-lg border border-gray-300 py-3 pl-14 pr-4 text-lg font-medium text-gray-900 transition-colors focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
                placeholder="5'000"
              />
              <span className="absolute left-4 top-1/2 -translate-y-1/2 font-medium text-gray-500">
                CHF
              </span>
            </div>
            <p className="text-sm text-gray-500">
              Der Käufer kann den Artikel sofort zu diesem Preis kaufen.
            </p>
          </div>
        ) : (
          /* AUCTION MODE - Show start price, optional buy-now, and duration */
          <div className="space-y-6">
            {/* Start price */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Startpreis (CHF) <span className="text-red-500">*</span>
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
                  className="w-full rounded-lg border border-gray-300 py-3 pl-14 pr-4 text-lg font-medium text-gray-900 transition-colors focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
                  placeholder="1'000"
                />
                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-medium text-gray-500">
                  CHF
                </span>
              </div>
              <p className="text-sm text-gray-500">
                Die Auktion startet bei diesem Preis. Bieter können darüber bieten.
              </p>
            </div>

            {/* Auction duration */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Auktionsdauer <span className="text-red-500">*</span>
              </label>
              <select
                name="auctionDuration"
                value={formData.auctionDuration}
                onChange={onInputChange}
                required={formData.isAuction}
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

            {/* Optional buy-now price for auctions */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                Sofortkaufpreis (CHF)
                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">Optional</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  name="buyNowPrice"
                  value={formData.buyNowPrice}
                  onChange={onInputChange}
                  min="0"
                  step="0.01"
                  className={`w-full rounded-lg border py-3 pl-14 pr-4 text-gray-900 transition-colors focus:border-primary-500 focus:ring-2 focus:ring-primary-200 ${
                    !buyNowValid ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder="8'000"
                />
                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-medium text-gray-500">
                  CHF
                </span>
              </div>
              {!buyNowValid && (
                <p className="text-sm font-medium text-red-600">
                  Der Sofortkaufpreis muss höher als der Startpreis sein.
                </p>
              )}
              <p className="text-sm text-gray-500">
                Käufer können die Auktion sofort zum Sofortkaufpreis beenden.
              </p>
            </div>

            {/* Auto-renew option */}
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
        )}
      </div>

      {/* Price hint */}
      <div className="flex items-start gap-3 rounded-lg bg-blue-50 p-4">
        <Info className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-600" />
        <div className="text-sm text-blue-800">
          <strong>Tipp:</strong> Recherchieren Sie vergleichbare Artikel auf Helvenda, um einen fairen Preis festzulegen.
          Ein realistischer Preis erhöht Ihre Verkaufschancen deutlich.
        </div>
      </div>
    </div>
  )
}
