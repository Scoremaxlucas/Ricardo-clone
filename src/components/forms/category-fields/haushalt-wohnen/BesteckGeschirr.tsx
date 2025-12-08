import React from 'react'
import { SubcategoryFieldsProps } from '../shared/types'

export function BesteckGeschirrFields({ formData, onChange, disabled = false }: SubcategoryFieldsProps) {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">Besteck/Geschirr-Details</h3>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
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
            placeholder="z.B. Edelstahl, Silber, Porzellan, Keramik"
          />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">Anzahl der Teile</label>
          <input
            type="text"
            name="pieceCount"
            value={formData.pieceCount || ''}
            onChange={onChange}
            disabled={disabled}
            className={`w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500 ${
              disabled ? 'cursor-not-allowed bg-gray-100' : ''
            }`}
            placeholder="z.B. 24-teilig, 12-teilig"
          />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">Design/Stil</label>
          <input
            type="text"
            name="design"
            value={formData.design || ''}
            onChange={onChange}
            disabled={disabled}
            className={`w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500 ${
              disabled ? 'cursor-not-allowed bg-gray-100' : ''
            }`}
            placeholder="z.B. Modern, Klassisch, Vintage"
          />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">Marke (optional)</label>
          <input
            type="text"
            name="brand"
            value={formData.brand || ''}
            onChange={onChange}
            disabled={disabled}
            className={`w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500 ${
              disabled ? 'cursor-not-allowed bg-gray-100' : ''
            }`}
            placeholder="z.B. WMF, Zwilling, IKEA"
          />
        </div>
      </div>
    </div>
  )
}

