import React from 'react'
import { SubcategoryFieldsProps } from '../shared/types'

export function ImmobilienFields({ formData, onChange, disabled = false }: SubcategoryFieldsProps) {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">Immobilien-Details</h3>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">Zimmer *</label>
          <input
            type="number"
            name="rooms"
            value={formData.rooms || ''}
            onChange={onChange}
            disabled={disabled}
            className={`w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500 ${
              disabled ? 'cursor-not-allowed bg-gray-100' : ''
            }`}
            placeholder="z.B. 3.5"
            required
          />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">Wohnfläche (m²) *</label>
          <input
            type="number"
            name="livingArea"
            value={formData.livingArea || ''}
            onChange={onChange}
            disabled={disabled}
            className={`w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500 ${
              disabled ? 'cursor-not-allowed bg-gray-100' : ''
            }`}
            placeholder="z.B. 120"
            required
          />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">Grundstücksfläche (m²)</label>
          <input
            type="number"
            name="landArea"
            value={formData.landArea || ''}
            onChange={onChange}
            disabled={disabled}
            className={`w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500 ${
              disabled ? 'cursor-not-allowed bg-gray-100' : ''
            }`}
            placeholder="z.B. 500"
          />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">Baujahr</label>
          <input
            type="number"
            name="year"
            value={formData.year || ''}
            onChange={onChange}
            disabled={disabled}
            className={`w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500 ${
              disabled ? 'cursor-not-allowed bg-gray-100' : ''
            }`}
            placeholder="z.B. 1995"
          />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">Adresse</label>
          <input
            type="text"
            name="address"
            value={formData.address || ''}
            onChange={onChange}
            disabled={disabled}
            className={`w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500 ${
              disabled ? 'cursor-not-allowed bg-gray-100' : ''
            }`}
            placeholder="z.B. Musterstrasse 123, 8000 Zürich"
          />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">Objekttyp</label>
          <select
            name="propertyType"
            value={formData.propertyType || ''}
            onChange={onChange}
            disabled={disabled}
            className={`w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500 ${
              disabled ? 'cursor-not-allowed bg-gray-100' : ''
            }`}
          >
            <option value="">Bitte wählen</option>
            <option value="einfamilienhaus">Einfamilienhaus</option>
            <option value="mehrfamilienhaus">Mehrfamilienhaus</option>
            <option value="eigentumswohnung">Eigentumswohnung</option>
            <option value="mietwohnung">Mietwohnung</option>
            <option value="villa">Villa</option>
            <option value="ferienhaus">Ferienhaus</option>
            <option value="gewerbe">Gewerbe</option>
          </select>
        </div>
      </div>
    </div>
  )
}

