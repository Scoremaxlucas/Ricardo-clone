import React from 'react'
import { SubcategoryFieldsProps } from '../shared/types'

export function ReiseUrlaubFields({ formData, onChange, disabled = false }: SubcategoryFieldsProps) {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">Reise/Urlaub-Details</h3>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">Reiseziel</label>
          <input
            type="text"
            name="destination"
            value={formData.destination || ''}
            onChange={onChange}
            disabled={disabled}
            className={`w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500 ${
              disabled ? 'cursor-not-allowed bg-gray-100' : ''
            }`}
            placeholder="z.B. Mallorca, New York"
          />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">Reisedatum</label>
          <input
            type="date"
            name="travelDate"
            value={formData.travelDate || ''}
            onChange={onChange}
            disabled={disabled}
            className={`w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500 ${
              disabled ? 'cursor-not-allowed bg-gray-100' : ''
            }`}
          />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">Dauer</label>
          <input
            type="text"
            name="duration"
            value={formData.duration || ''}
            onChange={onChange}
            disabled={disabled}
            className={`w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500 ${
              disabled ? 'cursor-not-allowed bg-gray-100' : ''
            }`}
            placeholder="z.B. 7 Tage, 2 Wochen"
          />
        </div>
      </div>
    </div>
  )
}

