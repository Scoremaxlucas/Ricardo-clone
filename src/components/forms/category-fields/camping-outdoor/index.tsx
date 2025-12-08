import React from 'react'
import { SubcategoryFieldsProps } from '../shared/types'
import { ZelteFields } from './Zelte'

export function CampingOutdoorFields({ subcategory, formData, onChange, disabled }: SubcategoryFieldsProps) {
  // Zelte
  if (subcategory === 'Zelte' || subcategory === 'Camping-Ausrüstung') {
    return <ZelteFields formData={formData} onChange={onChange} disabled={disabled} />
  }

  // Fallback: Standard Maske
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">Camping/Outdoor-Details</h3>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">Marke</label>
          <input
            type="text"
            name="brand"
            value={formData.brand || ''}
            onChange={onChange}
            disabled={disabled}
            className={`w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500 ${
              disabled ? 'cursor-not-allowed bg-gray-100' : ''
            }`}
            placeholder="z.B. Coleman, Quechua"
          />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">Modell</label>
          <input
            type="text"
            name="model"
            value={formData.model || ''}
            onChange={onChange}
            disabled={disabled}
            className={`w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500 ${
              disabled ? 'cursor-not-allowed bg-gray-100' : ''
            }`}
            placeholder="Modell"
          />
        </div>
      </div>
    </div>
  )
}

