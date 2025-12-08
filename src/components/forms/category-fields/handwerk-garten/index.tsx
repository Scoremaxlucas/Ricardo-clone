import React from 'react'
import { SubcategoryFieldsProps } from '../shared/types'
import { WerkzeugeFields } from './Werkzeuge'
import { GartenFields } from './Garten'

export function HandwerkGartenFields({ subcategory, formData, onChange, disabled }: SubcategoryFieldsProps) {
  // ELEKTROWERKZEUGE / HANDWERKZEUGE
  if (subcategory === 'Elektrowerkzeuge' || subcategory === 'Handwerkzeuge') {
    return <WerkzeugeFields formData={formData} onChange={onChange} disabled={disabled} />
  }

  // GARTEN (Rasenmäher, Gartenwerkzeuge)
  if (subcategory === 'Rasenmäher' || subcategory?.includes('Garten')) {
    return <GartenFields formData={formData} onChange={onChange} disabled={disabled} />
  }

  // Fallback: Standard Maske
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">Werkzeug/Garten-Details</h3>
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
            placeholder="z.B. Bosch, Makita"
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

