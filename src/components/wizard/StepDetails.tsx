'use client'

import { CategoryFields } from '@/components/forms/category-fields'
import { useLanguage } from '@/contexts/LanguageContext'
import { EditPolicy } from '@/lib/edit-policy'
import { Lock, Sparkles } from 'lucide-react'

interface StepDetailsProps {
  formData: {
    title: string
    description: string
    descriptionAddendum?: string // For append-only mode
    condition: string
    brand: string
    model: string
    referenceNumber: string
    year: string
    material: string
    movement: string
    caseDiameter: string
    lastRevision: string
    accuracy: string
    fullset: boolean
    onlyBox: boolean
    onlyPapers: boolean
    onlyAllLinks: boolean
    hasWarranty: boolean
    warrantyMonths: string
    warrantyYears: string
    hasSellerWarranty: boolean
    sellerWarrantyMonths: string
    sellerWarrantyYears: string
    sellerWarrantyNote: string
    images: string[]
  }
  selectedCategory: string
  selectedSubcategory: string
  isGeneratingTitle: boolean
  isGeneratingDescription: boolean
  onInputChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => void
  onFormDataChange: (data: Record<string, any>) => void
  onGenerateTitle: () => Promise<void>
  onGenerateDescription: () => Promise<void>
  setExclusiveSupply: (option: 'fullset' | 'onlyBox' | 'onlyPapers' | 'onlyAllLinks') => void
  policy?: EditPolicy
  mode?: 'create' | 'edit'
}

export function StepDetails({
  formData,
  selectedCategory,
  selectedSubcategory,
  isGeneratingTitle,
  isGeneratingDescription,
  onInputChange,
  onFormDataChange,
  onGenerateTitle,
  onGenerateDescription,
  setExclusiveSupply,
  policy,
  mode = 'create',
}: StepDetailsProps) {
  const { t } = useLanguage()
  const isTitleLocked = policy?.uiLocks.title || false
  const isDescriptionLocked = policy?.uiLocks.description || false
  const isDescriptionAppendOnly = policy?.uiLocks.descriptionAppendOnly || false
  return (
    <div className="space-y-3 sm:space-y-4 md:space-y-8">
      <div className="text-center">
        <h2 className="mb-1 text-xl font-bold text-gray-900 md:mb-2 md:text-2xl">
          {t.wizard.details.title}
        </h2>
        <p className="hidden text-sm text-gray-600 sm:block md:text-base">
          {t.wizard.details.subtitle}
        </p>
      </div>

      {/* Title */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label htmlFor="title-input" className="block text-sm font-medium text-gray-700">
            Titel <span className="text-red-500">*</span>
          </label>
          {formData.images.length > 0 && (
            <button
              type="button"
              onClick={onGenerateTitle}
              disabled={isGeneratingTitle || isGeneratingDescription}
              className="flex items-center gap-1 rounded-md bg-primary-50 px-3 py-1.5 text-xs font-medium text-primary-700 transition-colors hover:bg-primary-100 disabled:opacity-50"
            >
              <Sparkles className="h-3 w-3" />
              {isGeneratingTitle ? t.wizard.details.generating : t.wizard.details.generateTitle}
            </button>
          )}
        </div>
        <input
          id="title-input"
          type="text"
          name="title"
          required
          value={formData.title}
          onChange={onInputChange}
          disabled={isTitleLocked}
          className={`w-full rounded-lg border px-4 py-3 transition-colors ${
            isTitleLocked
              ? 'cursor-not-allowed border-gray-200 bg-gray-50 text-gray-500'
              : 'border-gray-300 text-gray-900 focus:border-primary-500 focus:ring-2 focus:ring-primary-200'
          }`}
          placeholder={t.wizard.details.titlePlaceholder}
        />
        {isTitleLocked && (
          <p className="mt-1 flex items-center gap-1 text-xs text-gray-500">
            <Lock className="h-3 w-3" />
            {t.wizard.details.titleLocked}
          </p>
        )}
      </div>

      {/* Description */}
      <div className="space-y-2">
        {isDescriptionAppendOnly ? (
          <>
            {/* Show existing description as read-only */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Aktuelle Beschreibung
              </label>
              <div className="whitespace-pre-wrap rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-gray-700">
                {formData.description || '(Keine Beschreibung)'}
              </div>
            </div>
            {/* Addendum input */}
            <div className="space-y-2">
              <label htmlFor="descriptionAddendum-textarea" className="block text-sm font-medium text-gray-700">
                Ergänzung hinzufügen <span className="text-red-500">*</span>
              </label>
              <textarea
                id="descriptionAddendum-textarea"
                name="descriptionAddendum"
                required
                value={formData.descriptionAddendum || ''}
                onChange={onInputChange}
                rows={4}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 transition-colors focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
                placeholder={t.wizard.details.addendumPlaceholder}
              />
              <p className="text-xs text-gray-500">
                {t.wizard.details.addendumHint}
              </p>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <label htmlFor="description-textarea" className="block text-sm font-medium text-gray-700">
                {t.wizard.details.descriptionLabel} <span className="text-red-500">*</span>
              </label>
              {(formData.images.length > 0 || formData.title?.trim()) && !isDescriptionLocked && (
                <button
                  type="button"
                  onClick={onGenerateDescription}
                  disabled={isGeneratingTitle || isGeneratingDescription}
                  className="flex items-center gap-1 rounded-md bg-primary-50 px-3 py-1.5 text-xs font-medium text-primary-700 transition-colors hover:bg-primary-100 disabled:opacity-50"
                >
                  <Sparkles className="h-3 w-3" />
                  {isGeneratingDescription ? t.wizard.details.generating : t.wizard.details.generateDescription}
                </button>
              )}
            </div>
            <textarea
              id="description-textarea"
              name="description"
              required
              value={formData.description}
              onChange={onInputChange}
              disabled={isDescriptionLocked}
              rows={5}
              className={`w-full rounded-lg border px-4 py-3 transition-colors ${
                isDescriptionLocked
                  ? 'cursor-not-allowed border-gray-200 bg-gray-50 text-gray-500'
                  : 'border-gray-300 text-gray-900 focus:border-primary-500 focus:ring-2 focus:ring-primary-200'
              }`}
              placeholder={t.wizard.details.descriptionPlaceholder}
            />
            {isDescriptionLocked && (
              <p className="mt-1 flex items-center gap-1 text-xs text-gray-500">
                <Lock className="h-3 w-3" />
                {t.wizard.details.descriptionLocked}
              </p>
            )}
          </>
        )}
      </div>

      {/* Condition */}
      <div className="space-y-2">
        <label htmlFor="condition-select" className="block text-sm font-medium text-gray-700">
          Zustand <span className="text-red-500">*</span>
        </label>
        <select
          id="condition-select"
          name="condition"
          required
          value={formData.condition}
          onChange={onInputChange}
          className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 transition-colors focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
        >
          <option value="">{t.wizard.details.conditionPlaceholder}</option>
          <option value="new">{t.wizard.details.conditionNew}</option>
          <option value="like-new">{t.wizard.details.conditionLikeNew}</option>
          <option value="very-good">{t.wizard.details.conditionVeryGood}</option>
          <option value="good">{t.wizard.details.conditionGood}</option>
          <option value="acceptable">{t.wizard.details.conditionAcceptable}</option>
          <option value="defective">{t.wizard.details.conditionDefective}</option>
        </select>
      </div>

      {/* Category-specific fields */}
      {selectedCategory && (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 sm:rounded-xl sm:p-4 md:p-6">
          <CategoryFields
            category={selectedCategory}
            subcategory={selectedSubcategory}
            formData={formData}
            onChange={onInputChange}
          />
        </div>
      )}

      {/* Watch-specific sections */}
      {selectedCategory === 'uhren-schmuck' && (
        <>
          {/* Supply scope */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">{t.wizard.details.supplyScope}</h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {[
                { key: 'fullset', label: t.wizard.details.supplyFullset },
                { key: 'onlyBox', label: t.wizard.details.supplyOnlyBox },
                { key: 'onlyPapers', label: t.wizard.details.supplyOnlyPapers },
                { key: 'onlyAllLinks', label: t.wizard.details.supplyOnlyAllLinks },
              ].map(({ key, label }) => (
                <label
                  key={key}
                  className={`flex cursor-pointer items-center gap-3 rounded-lg border-2 p-4 transition-all ${
                    formData[key as keyof typeof formData]
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="supply"
                    checked={formData[key as keyof typeof formData] as boolean}
                    onChange={() => setExclusiveSupply(key as any)}
                    className="h-4 w-4 text-primary-600"
                  />
                  <span className="font-medium text-gray-700">{label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Warranty */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">{t.wizard.details.warranty}</h3>
            <div className="space-y-4">
              <label htmlFor="hasWarranty-checkbox" className="flex items-center gap-3">
                <input
                  id="hasWarranty-checkbox"
                  type="checkbox"
                  name="hasWarranty"
                  checked={formData.hasWarranty}
                  onChange={onInputChange}
                  className="h-5 w-5 rounded border-gray-300 text-primary-600"
                />
                <span className="font-medium text-gray-700">{t.wizard.details.manufacturerWarranty}</span>
              </label>

              {formData.hasWarranty && (
                <div className="ml-8 grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="warrantyYears-input" className="mb-1 block text-sm text-gray-600">{t.wizard.details.years}</label>
                    <input
                      id="warrantyYears-input"
                      type="number"
                      name="warrantyYears"
                      value={formData.warrantyYears}
                      onChange={onInputChange}
                      min="0"
                      className="w-full rounded-lg border border-gray-300 px-3 py-2"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label htmlFor="warrantyMonths-input" className="mb-1 block text-sm text-gray-600">{t.wizard.details.months}</label>
                    <input
                      id="warrantyMonths-input"
                      type="number"
                      name="warrantyMonths"
                      value={formData.warrantyMonths}
                      onChange={onInputChange}
                      min="0"
                      max="11"
                      className="w-full rounded-lg border border-gray-300 px-3 py-2"
                      placeholder="0"
                    />
                  </div>
                </div>
              )}

              <label htmlFor="hasSellerWarranty-checkbox" className="flex items-center gap-3">
                <input
                  id="hasSellerWarranty-checkbox"
                  type="checkbox"
                  name="hasSellerWarranty"
                  checked={formData.hasSellerWarranty}
                  onChange={onInputChange}
                  className="h-5 w-5 rounded border-gray-300 text-primary-600"
                />
                <span className="font-medium text-gray-700">{t.wizard.details.sellerWarranty}</span>
              </label>

              {formData.hasSellerWarranty && (
                <div className="ml-8 space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="sellerWarrantyYears-input" className="mb-1 block text-sm text-gray-600">{t.wizard.details.years}</label>
                      <input
                        id="sellerWarrantyYears-input"
                        type="number"
                        name="sellerWarrantyYears"
                        value={formData.sellerWarrantyYears}
                        onChange={onInputChange}
                        min="0"
                        className="w-full rounded-lg border border-gray-300 px-3 py-2"
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label htmlFor="sellerWarrantyMonths-input" className="mb-1 block text-sm text-gray-600">{t.wizard.details.months}</label>
                      <input
                        id="sellerWarrantyMonths-input"
                        type="number"
                        name="sellerWarrantyMonths"
                        value={formData.sellerWarrantyMonths}
                        onChange={onInputChange}
                        min="0"
                        max="11"
                        className="w-full rounded-lg border border-gray-300 px-3 py-2"
                        placeholder="0"
                      />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="sellerWarrantyNote-textarea" className="mb-1 block text-sm text-gray-600">{t.wizard.details.warrantyNote}</label>
                    <textarea
                      id="sellerWarrantyNote-textarea"
                      name="sellerWarrantyNote"
                      value={formData.sellerWarrantyNote}
                      onChange={onInputChange}
                      rows={2}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2"
                      placeholder={t.wizard.details.warrantyNotePlaceholder}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
