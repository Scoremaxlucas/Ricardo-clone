import React from 'react'
import { SubcategoryFieldsProps } from '../shared/types'

export function GamesKonsolenFields({ formData, onChange, disabled = false }: SubcategoryFieldsProps) {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">Gaming-Details</h3>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">Plattform *</label>
          <select
            name="platform"
            value={formData.platform || ''}
            onChange={onChange}
            disabled={disabled}
            className={`w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500 ${
              disabled ? 'cursor-not-allowed bg-gray-100' : ''
            }`}
            required
          >
            <option value="">Bitte wählen</option>
            <option value="playstation">PlayStation</option>
            <option value="xbox">Xbox</option>
            <option value="nintendo-switch">Nintendo Switch</option>
            <option value="pc">PC</option>
            <option value="andere">Andere</option>
          </select>
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">Modell/Version</label>
          <input
            type="text"
            name="model"
            value={formData.model || ''}
            onChange={onChange}
            disabled={disabled}
            className={`w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500 ${
              disabled ? 'cursor-not-allowed bg-gray-100' : ''
            }`}
            placeholder="z.B. PS5, Xbox Series X, Switch OLED"
          />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">Speicher</label>
          <input
            type="text"
            name="storage"
            value={formData.storage || ''}
            onChange={onChange}
            disabled={disabled}
            className={`w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500 ${
              disabled ? 'cursor-not-allowed bg-gray-100' : ''
            }`}
            placeholder="z.B. 825GB SSD, 1TB"
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
            placeholder="z.B. Weiß, Schwarz"
          />
        </div>
      </div>
    </div>
  )
}

