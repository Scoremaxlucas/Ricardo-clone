import React from 'react'
import { SubcategoryFieldsProps } from '../shared/types'

export function WellnessGesundheitFields({ formData, onChange, disabled = false }: SubcategoryFieldsProps) {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">Wellness/Gesundheit-Details</h3>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">Dienstleistungstyp</label>
          <input
            type="text"
            name="serviceType"
            value={formData.serviceType || ''}
            onChange={onChange}
            disabled={disabled}
            className={`w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500 ${
              disabled ? 'cursor-not-allowed bg-gray-100' : ''
            }`}
            placeholder="z.B. Massage, Sauna, Fitness"
          />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">Standort</label>
          <input
            type="text"
            name="location"
            value={formData.location || ''}
            onChange={onChange}
            disabled={disabled}
            className={`w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500 ${
              disabled ? 'cursor-not-allowed bg-gray-100' : ''
            }`}
            placeholder="z.B. Zürich, Bern"
          />
        </div>
      </div>
    </div>
  )
}

