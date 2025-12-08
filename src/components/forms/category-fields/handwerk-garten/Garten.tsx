import React from 'react'
import { SubcategoryFieldsProps } from '../shared/types'

export function GartenFields({ formData, onChange, disabled = false }: SubcategoryFieldsProps) {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">Garten-Details</h3>
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
            placeholder="z.B. Stihl, Husqvarna, Gardena"
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
            placeholder="z.B. FS 240, Automower 315X"
          />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">Typ</label>
          <input
            type="text"
            name="gardenType"
            value={formData.gardenType || ''}
            onChange={onChange}
            disabled={disabled}
            className={`w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500 ${
              disabled ? 'cursor-not-allowed bg-gray-100' : ''
            }`}
            placeholder="z.B. Rasenmäher, Heckenschere, Gartenschlauch"
          />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">Antrieb</label>
          <select
            name="powerType"
            value={formData.powerType || ''}
            onChange={onChange}
            disabled={disabled}
            className={`w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500 ${
              disabled ? 'cursor-not-allowed bg-gray-100' : ''
            }`}
          >
            <option value="">Bitte wählen</option>
            <option value="benzin">Benzin</option>
            <option value="elektro">Elektro</option>
            <option value="akku">Akku</option>
            <option value="manuell">Manuell</option>
          </select>
        </div>
      </div>
    </div>
  )
}

