'use client'

import { EditPolicy } from '@/lib/edit-policy'
import { CheckCircle, Clock, Lock, Tag } from 'lucide-react'

interface StepPriceProps {
  formData: {
    price: string
    buyNowPrice: string
    isAuction: boolean
    auctionDuration: string
    autoRenew: boolean
  }
  onInputChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => void
  onFormDataChange: (data: Record<string, any>) => void
  policy?: EditPolicy
  mode?: 'create' | 'edit'
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
  policy,
  mode = 'create',
}: StepPriceProps) {
  // Validate buy-now price against start price for auctions
  const buyNowValid =
    !formData.buyNowPrice || parseFloat(formData.buyNowPrice) > parseFloat(formData.price || '0')

  const isSaleTypeLocked = policy?.uiLocks.saleType || false
  const isPriceLocked = policy?.uiLocks.price || false
  const isBuyNowPriceLocked = policy?.uiLocks.buyNowPrice || false
  const isAuctionStartLocked = policy?.uiLocks.auctionStart || false
  const isAuctionEndLocked = policy?.uiLocks.auctionEnd || false
  const isAuctionDurationLocked = policy?.uiLocks.auctionDuration || false

  return (
    <div className="space-y-3 sm:space-y-4 md:space-y-8">
      <div className="text-center">
        <h2 className="mb-1 text-xl font-bold text-gray-900 md:mb-2 md:text-2xl">
          Preis festlegen
        </h2>
        <p className="hidden text-sm text-gray-600 sm:block">Wählen Sie zwischen Festpreis oder Auktion</p>
      </div>

      {/* Sale type selection */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <label className="block text-sm font-medium text-gray-700">
            Verkaufsart <span className="text-red-500">*</span>
          </label>
          {isSaleTypeLocked && mode === 'edit' && (
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <Lock className="h-3 w-3" />
              <span>Gesperrt</span>
            </div>
          )}
        </div>
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          {/* Fixed price option */}
          <button
            type="button"
            onClick={() =>
              !isSaleTypeLocked &&
              onFormDataChange({ isAuction: false, auctionDuration: '', buyNowPrice: '' })
            }
            disabled={isSaleTypeLocked}
            className={`relative flex flex-col items-center gap-2 rounded-xl border-2 p-3 transition-all sm:gap-3 sm:p-4 md:p-6 ${
              isSaleTypeLocked
                ? 'cursor-not-allowed border-gray-200 bg-gray-50 opacity-60'
                : !formData.isAuction
                  ? 'border-primary-500 bg-primary-50 ring-2 ring-primary-200'
                  : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            {!formData.isAuction && (
              <div className="absolute right-2 top-2 sm:right-3 sm:top-3">
                <CheckCircle className="h-5 w-5 text-primary-600 sm:h-6 sm:w-6" />
              </div>
            )}
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-full sm:h-12 sm:w-12 md:h-14 md:w-14 ${
                !formData.isAuction ? 'bg-primary-100' : 'bg-gray-100'
              }`}
            >
              <Tag
                className={`h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7 ${!formData.isAuction ? 'text-primary-600' : 'text-gray-500'}`}
              />
            </div>
            <div className="text-center">
              <h3
                className={`text-sm font-semibold sm:text-base ${!formData.isAuction ? 'text-primary-700' : 'text-gray-700'}`}
              >
                Festpreis
              </h3>
              <p className="mt-0.5 hidden text-sm text-gray-500 sm:mt-1 sm:block">
                Verkauf zu einem festen Preis
              </p>
            </div>
          </button>

          {/* Auction option */}
          <button
            type="button"
            onClick={() => !isSaleTypeLocked && onFormDataChange({ isAuction: true })}
            disabled={isSaleTypeLocked}
            className={`relative flex flex-col items-center gap-2 rounded-xl border-2 p-3 transition-all sm:gap-3 sm:p-4 md:p-6 ${
              isSaleTypeLocked
                ? 'cursor-not-allowed border-gray-200 bg-gray-50 opacity-60'
                : formData.isAuction
                  ? 'border-primary-500 bg-primary-50 ring-2 ring-primary-200'
                  : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            {formData.isAuction && (
              <div className="absolute right-2 top-2 sm:right-3 sm:top-3">
                <CheckCircle className="h-5 w-5 text-primary-600 sm:h-6 sm:w-6" />
              </div>
            )}
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-full sm:h-12 sm:w-12 md:h-14 md:w-14 ${
                formData.isAuction ? 'bg-primary-100' : 'bg-gray-100'
              }`}
            >
              <Clock
                className={`h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7 ${formData.isAuction ? 'text-primary-600' : 'text-gray-500'}`}
              />
            </div>
            <div className="text-center">
              <h3
                className={`text-sm font-semibold sm:text-base ${formData.isAuction ? 'text-primary-700' : 'text-gray-700'}`}
              >
                Auktion
              </h3>
              <p className="mt-0.5 hidden text-sm text-gray-500 sm:mt-1 sm:block">
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
                disabled={isPriceLocked}
                min="0"
                step="0.01"
                className={`w-full rounded-lg border py-3 pl-14 pr-4 text-lg font-medium transition-colors ${
                  isPriceLocked
                    ? 'cursor-not-allowed border-gray-200 bg-gray-50 text-gray-500'
                    : 'border-gray-300 text-gray-900 focus:border-primary-500 focus:ring-2 focus:ring-primary-200'
                }`}
                placeholder=""
              />
              {isPriceLocked && (
                <p className="mt-1 flex items-center gap-1 text-xs text-gray-500">
                  <Lock className="h-3 w-3" />
                  Preis kann nicht mehr geändert werden
                </p>
              )}
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
                  disabled={isPriceLocked}
                  min="0"
                  step="0.01"
                  className={`w-full rounded-lg border py-3 pl-14 pr-4 text-lg font-medium transition-colors ${
                    isPriceLocked
                      ? 'cursor-not-allowed border-gray-200 bg-gray-50 text-gray-500'
                      : 'border-gray-300 text-gray-900 focus:border-primary-500 focus:ring-2 focus:ring-primary-200'
                  }`}
                  placeholder=""
                />
                {isPriceLocked && (
                  <p className="mt-1 flex items-center gap-1 text-xs text-gray-500">
                    <Lock className="h-3 w-3" />
                    Startpreis kann nach Veröffentlichung nicht mehr geändert werden
                  </p>
                )}
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
                disabled={isAuctionDurationLocked}
                className={`w-full rounded-lg border px-4 py-3 transition-colors ${
                  isAuctionDurationLocked
                    ? 'cursor-not-allowed border-gray-200 bg-gray-50 text-gray-500'
                    : 'border-gray-300 bg-white text-gray-900 focus:border-primary-500 focus:ring-2 focus:ring-primary-200'
                }`}
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
              {isAuctionDurationLocked && (
                <p className="mt-1 flex items-center gap-1 text-xs text-gray-500">
                  <Lock className="h-3 w-3" />
                  Auktionsdauer kann nach Veröffentlichung nicht mehr geändert werden
                </p>
              )}
            </div>

            {/* Optional buy-now price for auctions */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                Sofortkaufpreis (CHF)
                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
                  Optional
                </span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  name="buyNowPrice"
                  value={formData.buyNowPrice}
                  onChange={onInputChange}
                  disabled={isBuyNowPriceLocked}
                  min="0"
                  step="0.01"
                  className={`w-full rounded-lg border py-3 pl-14 pr-4 transition-colors ${
                    isBuyNowPriceLocked
                      ? 'cursor-not-allowed border-gray-200 bg-gray-50 text-gray-500'
                      : !buyNowValid
                        ? 'border-red-300 bg-red-50 text-gray-900 focus:border-primary-500 focus:ring-2 focus:ring-primary-200'
                        : 'border-gray-300 text-gray-900 focus:border-primary-500 focus:ring-2 focus:ring-primary-200'
                  }`}
                  placeholder=""
                />
                {isBuyNowPriceLocked && (
                  <p className="mt-1 flex items-center gap-1 text-xs text-gray-500">
                    <Lock className="h-3 w-3" />
                    Sofortkaufpreis kann nach Veröffentlichung nicht mehr geändert werden
                  </p>
                )}
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
    </div>
  )
}
