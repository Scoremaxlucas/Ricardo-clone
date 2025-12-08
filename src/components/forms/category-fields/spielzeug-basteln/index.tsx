import React from 'react'
import { SubcategoryFieldsProps } from '../shared/types'

export function SpielzeugBastelnFields({ formData, onChange, disabled = false }: SubcategoryFieldsProps) {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">Spielzeug-Details</h3>
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
            placeholder="z.B. LEGO, Playmobil"
          />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">Altersempfehlung</label>
          <input
            type="text"
            name="ageRange"
            value={formData.ageRange || ''}
            onChange={onChange}
            disabled={disabled}
            className={`w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500 ${
              disabled ? 'cursor-not-allowed bg-gray-100' : ''
            }`}
            placeholder="z.B. 6-12 Jahre, 3+"
          />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">Vollständig?</label>
          <select
            name="complete"
            value={formData.complete || ''}
            onChange={onChange}
            disabled={disabled}
            className={`w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500 ${
              disabled ? 'cursor-not-allowed bg-gray-100' : ''
            }`}
          >
            <option value="">Bitte wählen</option>
            <option value="ja">Ja, komplett</option>
            <option value="nein">Nein, unvollständig</option>
          </select>
        </div>
      </div>
    </div>
  )
}

