import React from 'react'
import { SubcategoryFieldsProps } from '../shared/types'

export function MusikInstrumenteFields({ subcategory, formData, onChange, disabled = false }: SubcategoryFieldsProps) {
  const isDJ = subcategory === 'DJ-Equipment' || subcategory === 'Studio-Equipment'

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">
        {isDJ ? 'DJ/Studio-Equipment-Details' : 'Musikinstrument-Details'}
      </h3>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">Marke *</label>
          <input
            type="text"
            name="brand"
            value={formData.brand || ''}
            onChange={onChange}
            disabled={disabled}
            className={`w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500 ${
              disabled ? 'cursor-not-allowed bg-gray-100' : ''
            }`}
            placeholder={isDJ ? 'z.B. Pioneer, Technics, Native Instruments' : 'z.B. Fender, Yamaha, Roland'}
            required
          />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">Modell *</label>
          <input
            type="text"
            name="model"
            value={formData.model || ''}
            onChange={onChange}
            disabled={disabled}
            className={`w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500 ${
              disabled ? 'cursor-not-allowed bg-gray-100' : ''
            }`}
            placeholder={isDJ ? 'z.B. CDJ-3000, SL-1200' : 'z.B. Stratocaster, P-125'}
            required
          />
        </div>
        {!isDJ && (
          <>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Typ</label>
              <input
                type="text"
                name="instrumentType"
                value={formData.instrumentType || ''}
                onChange={onChange}
                disabled={disabled}
                className={`w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500 ${
                  disabled ? 'cursor-not-allowed bg-gray-100' : ''
                }`}
                placeholder="z.B. Akustikgitarre, E-Gitarre, Klavier"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Material</label>
              <input
                type="text"
                name="material"
                value={formData.material || ''}
                onChange={onChange}
                disabled={disabled}
                className={`w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500 ${
                  disabled ? 'cursor-not-allowed bg-gray-100' : ''
                }`}
                placeholder="z.B. Fichte, Ahorn, Mahagoni"
              />
            </div>
          </>
        )}
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">Jahr</label>
          <input
            type="number"
            name="year"
            value={formData.year || ''}
            onChange={onChange}
            disabled={disabled}
            className={`w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500 ${
              disabled ? 'cursor-not-allowed bg-gray-100' : ''
            }`}
            placeholder="z.B. 2020"
          />
        </div>
      </div>
    </div>
  )
}

