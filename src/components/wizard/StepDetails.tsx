'use client'

import { CategoryFields } from '@/components/forms/category-fields'
import { Sparkles } from 'lucide-react'
import { useRef } from 'react'

interface StepDetailsProps {
  formData: {
    title: string
    description: string
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
  onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void
  onFormDataChange: (data: Record<string, any>) => void
  onGenerateTitle: () => Promise<void>
  onGenerateDescription: () => Promise<void>
  setExclusiveSupply: (option: 'fullset' | 'onlyBox' | 'onlyPapers' | 'onlyAllLinks') => void
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
}: StepDetailsProps) {
  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="mb-2 text-2xl font-bold text-gray-900">Artikel-Details</h2>
        <p className="text-gray-600">
          Beschreiben Sie Ihren Artikel so genau wie möglich
        </p>
      </div>

      {/* Title */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="block text-sm font-medium text-gray-700">
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
              {isGeneratingTitle ? 'Generiere...' : 'KI-Titel generieren'}
            </button>
          )}
        </div>
        <input
          type="text"
          name="title"
          required
          value={formData.title}
          onChange={onInputChange}
          className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 transition-colors focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
          placeholder="z.B. Beschreibender Titel Ihres Artikels"
        />
      </div>

      {/* Description */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="block text-sm font-medium text-gray-700">
            Beschreibung <span className="text-red-500">*</span>
          </label>
          {formData.images.length > 0 && (
            <button
              type="button"
              onClick={onGenerateDescription}
              disabled={isGeneratingTitle || isGeneratingDescription}
              className="flex items-center gap-1 rounded-md bg-primary-50 px-3 py-1.5 text-xs font-medium text-primary-700 transition-colors hover:bg-primary-100 disabled:opacity-50"
            >
              <Sparkles className="h-3 w-3" />
              {isGeneratingDescription ? 'Generiere...' : 'KI-Beschreibung generieren'}
            </button>
          )}
        </div>
        <textarea
          name="description"
          required
          value={formData.description}
          onChange={onInputChange}
          rows={5}
          className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 transition-colors focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
          placeholder="Beschreiben Sie Ihren Artikel ausführlich: Zustand, Besonderheiten, Lieferumfang..."
        />
      </div>

      {/* Condition */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Zustand <span className="text-red-500">*</span>
        </label>
        <select
          name="condition"
          required
          value={formData.condition}
          onChange={onInputChange}
          className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 transition-colors focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
        >
          <option value="">Bitte wählen</option>
          <option value="new">Neu</option>
          <option value="like-new">Wie neu</option>
          <option value="very-good">Sehr gut</option>
          <option value="good">Gut</option>
          <option value="acceptable">Akzeptabel</option>
          <option value="defective">Defekt</option>
        </select>
      </div>

      {/* Category-specific fields */}
      {selectedCategory && (
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-6">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">
            {selectedCategory === 'uhren-schmuck' ? 'Uhren-Details' : 
             selectedCategory === 'auto-motorrad' ? 'Fahrzeug-Details' :
             selectedCategory === 'sport-freizeit' ? 'Sport-Details' :
             'Kategorie-Details'}
          </h3>
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
            <h3 className="text-lg font-semibold text-gray-900">
              Lieferumfang (inkl. Uhr selbst)
            </h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {[
                { key: 'fullset', label: 'Fullset (Box, Papiere, alle Links)' },
                { key: 'onlyBox', label: 'Nur Box' },
                { key: 'onlyPapers', label: 'Nur Papiere' },
                { key: 'onlyAllLinks', label: 'Alle Links/Glieder' },
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
            <h3 className="text-lg font-semibold text-gray-900">Garantie</h3>
            <div className="space-y-4">
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  name="hasWarranty"
                  checked={formData.hasWarranty}
                  onChange={onInputChange}
                  className="h-5 w-5 rounded border-gray-300 text-primary-600"
                />
                <span className="font-medium text-gray-700">Herstellergarantie vorhanden</span>
              </label>

              {formData.hasWarranty && (
                <div className="ml-8 grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1 block text-sm text-gray-600">Jahre</label>
                    <input
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
                    <label className="mb-1 block text-sm text-gray-600">Monate</label>
                    <input
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

              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  name="hasSellerWarranty"
                  checked={formData.hasSellerWarranty}
                  onChange={onInputChange}
                  className="h-5 w-5 rounded border-gray-300 text-primary-600"
                />
                <span className="font-medium text-gray-700">Verkäufergarantie</span>
              </label>

              {formData.hasSellerWarranty && (
                <div className="ml-8 space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="mb-1 block text-sm text-gray-600">Jahre</label>
                      <input
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
                      <label className="mb-1 block text-sm text-gray-600">Monate</label>
                      <input
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
                    <label className="mb-1 block text-sm text-gray-600">Garantiehinweis</label>
                    <textarea
                      name="sellerWarrantyNote"
                      value={formData.sellerWarrantyNote}
                      onChange={onInputChange}
                      rows={2}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2"
                      placeholder="Optionale Details zur Verkäufergarantie..."
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

