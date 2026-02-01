import React from 'react'
import { SubcategoryFieldsProps } from '../shared/types'

/**
 * Videospiel-spezifische Felder für Spiele (PS4, PS5, Xbox, Switch, PC)
 * NICHT für Konsolen selbst – dafür KonsolenFields verwenden.
 */
export function VideogameFields({ formData, onChange, disabled = false }: SubcategoryFieldsProps) {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">Videospiel-Details</h3>
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
            <option value="playstation-5">PlayStation 5</option>
            <option value="playstation-4">PlayStation 4</option>
            <option value="xbox-series">Xbox Series X/S</option>
            <option value="xbox-one">Xbox One</option>
            <option value="nintendo-switch">Nintendo Switch</option>
            <option value="pc">PC</option>
            <option value="andere">Andere</option>
          </select>
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">Spieletitel *</label>
          <input
            type="text"
            name="model"
            value={formData.model || ''}
            onChange={onChange}
            disabled={disabled}
            className={`w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500 ${
              disabled ? 'cursor-not-allowed bg-gray-100' : ''
            }`}
            placeholder="z.B. Assassin's Creed Odyssey, FIFA 24"
            required
          />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">Publisher / Entwickler</label>
          <input
            type="text"
            name="publisher"
            value={formData.publisher || ''}
            onChange={onChange}
            disabled={disabled}
            className={`w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500 ${
              disabled ? 'cursor-not-allowed bg-gray-100' : ''
            }`}
            placeholder="z.B. Ubisoft, EA, Nintendo"
          />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">Erscheinungsjahr</label>
          <input
            type="number"
            name="year"
            value={formData.year || ''}
            onChange={onChange}
            disabled={disabled}
            className={`w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500 ${
              disabled ? 'cursor-not-allowed bg-gray-100' : ''
            }`}
            placeholder="z.B. 2023"
            min={1980}
            max={2030}
          />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">Sprache</label>
          <select
            name="language"
            value={formData.language || ''}
            onChange={onChange}
            disabled={disabled}
            className={`w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500 ${
              disabled ? 'cursor-not-allowed bg-gray-100' : ''
            }`}
          >
            <option value="">Bitte wählen</option>
            <option value="deutsch">Deutsch</option>
            <option value="englisch">Englisch</option>
            <option value="mehrsprachig">Mehrsprachig</option>
            <option value="andere">Andere</option>
          </select>
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">Art</label>
          <select
            name="gameFormat"
            value={formData.gameFormat || ''}
            onChange={onChange}
            disabled={disabled}
            className={`w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500 ${
              disabled ? 'cursor-not-allowed bg-gray-100' : ''
            }`}
          >
            <option value="">Bitte wählen</option>
            <option value="physisch">Physisch (Disc/Kartusche)</option>
            <option value="digital">Digital (Code)</option>
          </select>
        </div>
      </div>
    </div>
  )
}
