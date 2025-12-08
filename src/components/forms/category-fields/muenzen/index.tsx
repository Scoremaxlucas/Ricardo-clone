import React from 'react'
import { SubcategoryFieldsProps } from '../shared/types'

export function MuenzenFields({ formData, onChange, disabled = false }: SubcategoryFieldsProps) {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">Münzen-Details</h3>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">Land *</label>
          <input
            type="text"
            name="country"
            value={formData.country || ''}
            onChange={onChange}
            disabled={disabled}
            className={`w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500 ${
              disabled ? 'cursor-not-allowed bg-gray-100' : ''
            }`}
            placeholder="z.B. Schweiz, Deutschland"
            required
          />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">Jahr *</label>
          <input
            type="text"
            name="year"
            value={formData.year || ''}
            onChange={onChange}
            disabled={disabled}
            className={`w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500 ${
              disabled ? 'cursor-not-allowed bg-gray-100' : ''
            }`}
            placeholder="z.B. 1950"
            required
          />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">Nennwert</label>
          <input
            type="text"
            name="denomination"
            value={formData.denomination || ''}
            onChange={onChange}
            disabled={disabled}
            className={`w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500 ${
              disabled ? 'cursor-not-allowed bg-gray-100' : ''
            }`}
            placeholder="z.B. 5 Franken, 1 Mark"
          />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">Zustand</label>
          <select
            name="condition"
            value={formData.condition || ''}
            onChange={onChange}
            disabled={disabled}
            className={`w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500 ${
              disabled ? 'cursor-not-allowed bg-gray-100' : ''
            }`}
          >
            <option value="">Bitte wählen</option>
            <option value="prägefrisch">Prägefrisch</option>
            <option value="sehr-schoen">Sehr schön</option>
            <option value="schoen">Schön</option>
            <option value="sehr-gut">Sehr gut</option>
          </select>
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
            placeholder="z.B. Silber, Gold, Kupfer-Nickel"
          />
        </div>
      </div>
    </div>
  )
}

