'use client'

import { useLanguage } from '@/contexts/LanguageContext'
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
  const { t } = useLanguage()
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
          {t.wizard.price.title}
        </h2>
        <p className="text-xs text-gray-600 sm:text-sm">{t.wizard.price.subtitle}</p>
      </div>

      {/* Sale type selection */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <label className="block text-sm font-medium text-gray-700">
            {t.wizard.price.saleType} <span className="text-red-500">*</span>
          </label>
          {isSaleTypeLocked && mode === 'edit' && (
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <Lock className="h-3 w-3" />
              <span>{t.wizard.price.locked}</span>
            </div>
          )}
        </div>
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          {/* Fixed price option */}
          <button
            type="button"
            onClick={() =>
              !isSaleTypeLocked &&
              onFormDataChange({ isAuction: false, auctionDuration: '' })
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
                {t.wizard.price.fixedPrice}
              </h3>
              <p className="mt-0.5 hidden text-sm text-gray-500 sm:mt-1 sm:block">
                {t.wizard.price.fixedPriceDesc}
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
                {t.wizard.price.auction}
              </h3>
              <p className="mt-0.5 hidden text-sm text-gray-500 sm:mt-1 sm:block">
                {t.wizard.price.auctionDesc}
              </p>
            </div>
          </button>
        </div>
      </div>

      {/* Price inputs - conditional based on sale type */}
      <div className="space-y-6">
        {!formData.isAuction ? (
          /* FIXED PRICE MODE - Basispreis + Sofortkaufpreis */
          <div className="space-y-6">
            {/* Basispreis (für Preisvorschläge) */}
            <div className="space-y-2">
              <label htmlFor="price-input" className="block text-sm font-medium text-gray-700">
                {t.wizard.price.basePrice} <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  id="price-input"
                  type="number"
                  inputMode="decimal"
                  name="price"
                  required
                  value={formData.price}
                  onChange={onInputChange}
                  disabled={isPriceLocked}
                  min="0"
                  step="0.01"
                  autoComplete="off"
                  className={`w-full rounded-lg border py-3 pl-14 pr-4 text-lg font-medium transition-colors ${
                    isPriceLocked
                      ? 'cursor-not-allowed border-gray-200 bg-gray-50 text-gray-500'
                      : 'border-gray-300 text-gray-900 focus:border-primary-500 focus:ring-2 focus:ring-primary-200'
                  }`}
                  placeholder="0.00"
                />
                {isPriceLocked && (
                  <p className="mt-1 flex items-center gap-1 text-xs text-gray-500">
                    <Lock className="h-3 w-3" />
                    {t.wizard.price.priceLocked}
                  </p>
                )}
                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-medium text-gray-500">
                  CHF
                </span>
              </div>
              <p className="text-xs text-gray-500 sm:text-sm">
                {t.wizard.price.basePriceHint}
              </p>
            </div>

            {/* Sofortkaufpreis */}
            <div className="space-y-2">
              <label htmlFor="buyNowPrice-input" className="flex items-center gap-2 text-sm font-medium text-gray-700">
                {t.wizard.price.buyNowPrice}
                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
                  {t.wizard.price.optional}
                </span>
              </label>
              <div className="relative">
                <input
                  id="buyNowPrice-input"
                  type="number"
                  inputMode="decimal"
                  name="buyNowPrice"
                  value={formData.buyNowPrice}
                  onChange={onInputChange}
                  disabled={isBuyNowPriceLocked}
                  min="0"
                  step="0.01"
                  autoComplete="off"
                  className={`w-full rounded-lg border py-3 pl-14 pr-4 transition-colors ${
                    isBuyNowPriceLocked
                      ? 'cursor-not-allowed border-gray-200 bg-gray-50 text-gray-500'
                      : !buyNowValid
                        ? 'border-red-300 bg-red-50 text-gray-900 focus:border-primary-500 focus:ring-2 focus:ring-primary-200'
                        : 'border-gray-300 text-gray-900 focus:border-primary-500 focus:ring-2 focus:ring-primary-200'
                  }`}
                  placeholder="0.00"
                />
                {isBuyNowPriceLocked && (
                  <p className="mt-1 flex items-center gap-1 text-xs text-gray-500">
                    <Lock className="h-3 w-3" />
                    {t.wizard.price.buyNowLocked}
                  </p>
                )}
                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-medium text-gray-500">
                  CHF
                </span>
              </div>
              {!buyNowValid && (
                <p className="text-xs font-medium text-red-600 sm:text-sm">
                  {t.wizard.price.buyNowMustBeHigher}
                </p>
              )}
              <p className="text-xs text-gray-500 sm:text-sm">
                {t.wizard.price.buyNowHint}
              </p>
            </div>
          </div>
        ) : (
          /* AUCTION MODE - Show start price, optional buy-now, and duration */
          <div className="space-y-6">
            {/* Start price */}
            <div className="space-y-2">
              <label htmlFor="auction-price-input" className="block text-sm font-medium text-gray-700">
                {t.wizard.price.startPrice} <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  id="auction-price-input"
                  type="number"
                  inputMode="decimal"
                  name="price"
                  required
                  value={formData.price}
                  onChange={onInputChange}
                  disabled={isPriceLocked}
                  min="0"
                  step="0.01"
                  autoComplete="off"
                  className={`w-full rounded-lg border py-3 pl-14 pr-4 text-lg font-medium transition-colors ${
                    isPriceLocked
                      ? 'cursor-not-allowed border-gray-200 bg-gray-50 text-gray-500'
                      : 'border-gray-300 text-gray-900 focus:border-primary-500 focus:ring-2 focus:ring-primary-200'
                  }`}
                  placeholder="0.00"
                />
                {isPriceLocked && (
                  <p className="mt-1 flex items-center gap-1 text-xs text-gray-500">
                    <Lock className="h-3 w-3" />
                    {t.wizard.price.startPriceLocked}
                  </p>
                )}
                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-medium text-gray-500">
                  CHF
                </span>
              </div>
              <p className="text-xs text-gray-500 sm:text-sm">
                {t.wizard.price.startPriceHint}
              </p>
            </div>

            {/* Auction duration */}
            <div className="space-y-2">
              <label htmlFor="auctionDuration-select" className="block text-sm font-medium text-gray-700">
                {t.wizard.price.auctionDuration} <span className="text-red-500">*</span>
              </label>
              <select
                id="auctionDuration-select"
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
                <option value="">{t.wizard.price.durationPlaceholder}</option>
                <option value="1">{t.wizard.price.days1}</option>
                <option value="3">{t.wizard.price.days3}</option>
                <option value="5">{t.wizard.price.days5}</option>
                <option value="7">{t.wizard.price.days7}</option>
                <option value="10">{t.wizard.price.days10}</option>
                <option value="14">{t.wizard.price.days14}</option>
                <option value="30">{t.wizard.price.days30}</option>
              </select>
              {isAuctionDurationLocked && (
                <p className="mt-1 flex items-center gap-1 text-xs text-gray-500">
                  <Lock className="h-3 w-3" />
                  {t.wizard.price.durationLocked}
                </p>
              )}
            </div>

            {/* Optional buy-now price for auctions */}
            <div className="space-y-2">
              <label htmlFor="auction-buyNowPrice-input" className="flex items-center gap-2 text-sm font-medium text-gray-700">
                {t.wizard.price.buyNowPrice}
                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
                  {t.wizard.price.optional}
                </span>
              </label>
              <div className="relative">
                <input
                  id="auction-buyNowPrice-input"
                  type="number"
                  inputMode="decimal"
                  name="buyNowPrice"
                  value={formData.buyNowPrice}
                  onChange={onInputChange}
                  disabled={isBuyNowPriceLocked}
                  min="0"
                  step="0.01"
                  autoComplete="off"
                  className={`w-full rounded-lg border py-3 pl-14 pr-4 transition-colors ${
                    isBuyNowPriceLocked
                      ? 'cursor-not-allowed border-gray-200 bg-gray-50 text-gray-500'
                      : !buyNowValid
                        ? 'border-red-300 bg-red-50 text-gray-900 focus:border-primary-500 focus:ring-2 focus:ring-primary-200'
                        : 'border-gray-300 text-gray-900 focus:border-primary-500 focus:ring-2 focus:ring-primary-200'
                  }`}
                  placeholder="0.00"
                />
                {isBuyNowPriceLocked && (
                  <p className="mt-1 flex items-center gap-1 text-xs text-gray-500">
                    <Lock className="h-3 w-3" />
                    {t.wizard.price.buyNowLockedAuction}
                  </p>
                )}
                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-medium text-gray-500">
                  CHF
                </span>
              </div>
              {!buyNowValid && (
                <p className="text-xs font-medium text-red-600 sm:text-sm">
                  {t.wizard.price.buyNowMustBeHigherStart}
                </p>
              )}
              <p className="text-xs text-gray-500 sm:text-sm">
                {t.wizard.price.buyNowAuctionHint}
              </p>
            </div>

            {/* Auto-renew option */}
            <label htmlFor="autoRenew-checkbox" className="flex items-start gap-3 rounded-lg border border-gray-200 bg-white p-3 sm:p-4">
              <input
                id="autoRenew-checkbox"
                type="checkbox"
                name="autoRenew"
                checked={formData.autoRenew}
                onChange={onInputChange}
                className="mt-0.5 h-5 w-5 rounded border-gray-300 text-primary-600"
              />
              <div>
                <span className="text-sm font-medium text-gray-700 sm:text-base">{t.wizard.price.autoRenew}</span>
                <p className="text-xs text-gray-500 sm:text-sm">
                  {t.wizard.price.autoRenewDesc}
                </p>
              </div>
            </label>
          </div>
        )}
      </div>
    </div>
  )
}
