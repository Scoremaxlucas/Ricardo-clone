import React from 'react'
import { SubcategoryFieldsProps } from '../shared/types'

export function WeinGenussFields({ formData, onChange, disabled = false }: SubcategoryFieldsProps) {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">Wein/Genuss-Details</h3>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">Jahrgang</label>
          <input
            type="number"
            name="year"
            value={formData.year || ''}
            onChange={onChange}
            disabled={disabled}
            className={`w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500 ${
              disabled ? 'cursor-not-allowed bg-gray-100' : ''
            }`}
            placeholder="z.B. 2018"
          />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">Region</label>
          <input
            type="text"
            name="region"
            value={formData.region || ''}
            onChange={onChange}
            disabled={disabled}
            className={`w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500 ${
              disabled ? 'cursor-not-allowed bg-gray-100' : ''
            }`}
            placeholder="z.B. Bordeaux, Toskana, Wallis"
          />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">Weingut/Erzeuger</label>
          <input
            type="text"
            name="producer"
            value={formData.producer || formData.brand || ''}
            onChange={onChange}
            disabled={disabled}
            className={`w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500 ${
              disabled ? 'cursor-not-allowed bg-gray-100' : ''
            }`}
            placeholder="z.B. Château Margaux"
          />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">Volumen</label>
          <input
            type="text"
            name="volume"
            value={formData.volume || ''}
            onChange={onChange}
            disabled={disabled}
            className={`w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500 ${
              disabled ? 'cursor-not-allowed bg-gray-100' : ''
            }`}
            placeholder="z.B. 0.75L, 1.5L"
          />
        </div>
      </div>
    </div>
  )
}

