import React from 'react'
import { SubcategoryFieldsProps } from '../shared/types'

export function SammelnSeltenesFields({ formData, onChange, disabled = false }: SubcategoryFieldsProps) {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">Sammlerobjekt-Details</h3>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">Objekttyp</label>
          <input
            type="text"
            name="objectType"
            value={formData.objectType || ''}
            onChange={onChange}
            disabled={disabled}
            className={`w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500 ${
              disabled ? 'cursor-not-allowed bg-gray-100' : ''
            }`}
            placeholder="z.B. Briefmarke, Münze, Figur"
          />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">Jahr/Zeitraum</label>
          <input
            type="text"
            name="year"
            value={formData.year || ''}
            onChange={onChange}
            disabled={disabled}
            className={`w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500 ${
              disabled ? 'cursor-not-allowed bg-gray-100' : ''
            }`}
            placeholder="z.B. 1950, 19. Jahrhundert"
          />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">Herkunft/Land</label>
          <input
            type="text"
            name="origin"
            value={formData.origin || ''}
            onChange={onChange}
            disabled={disabled}
            className={`w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500 ${
              disabled ? 'cursor-not-allowed bg-gray-100' : ''
            }`}
            placeholder="z.B. Schweiz, Deutschland"
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
            <option value="mint">Mint</option>
            <option value="sehr-gut">Sehr gut</option>
            <option value="gut">Gut</option>
            <option value="gebraucht">Gebraucht</option>
          </select>
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">Zertifikat/Bescheinigung</label>
          <select
            name="certificate"
            value={formData.certificate || ''}
            onChange={onChange}
            disabled={disabled}
            className={`w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500 ${
              disabled ? 'cursor-not-allowed bg-gray-100' : ''
            }`}
          >
            <option value="">Bitte wählen</option>
            <option value="ja">Ja</option>
            <option value="nein">Nein</option>
          </select>
        </div>
      </div>
    </div>
  )
}

