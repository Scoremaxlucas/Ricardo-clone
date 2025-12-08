import React from 'react'
import { SubcategoryFieldsProps } from '../shared/types'

export function KindBabyFields({ formData, onChange, disabled = false }: SubcategoryFieldsProps) {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">Kind/Baby-Details</h3>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">Alter/Größe</label>
          <input
            type="text"
            name="ageSize"
            value={formData.ageSize || ''}
            onChange={onChange}
            disabled={disabled}
            className={`w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500 ${
              disabled ? 'cursor-not-allowed bg-gray-100' : ''
            }`}
            placeholder="z.B. 0-6 Monate, 86cm, Gr. 92"
          />
        </div>
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
            placeholder="z.B. Chicco, Fisher-Price, Lego"
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
            placeholder="z.B. Baumwolle, Kunststoff, Holz"
          />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">Farbe</label>
          <input
            type="text"
            name="color"
            value={formData.color || ''}
            onChange={onChange}
            disabled={disabled}
            className={`w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500 ${
              disabled ? 'cursor-not-allowed bg-gray-100' : ''
            }`}
            placeholder="z.B. Rosa, Blau, Bunt"
          />
        </div>
      </div>
    </div>
  )
}

