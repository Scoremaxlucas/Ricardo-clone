import React from 'react'
import { SubcategoryFieldsProps } from '../shared/types'

export function FelgenReifenFields({ formData, onChange, disabled = false }: SubcategoryFieldsProps) {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">Felgen & Reifen-Details</h3>
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
            placeholder="z.B. BBS, OZ, Michelin"
          />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">Typ</label>
          <select
            name="type"
            value={formData.type || ''}
            onChange={onChange}
            disabled={disabled}
            className={`w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500 ${
              disabled ? 'cursor-not-allowed bg-gray-100' : ''
            }`}
          >
            <option value="">Bitte wählen</option>
            <option value="felgen">Felgen</option>
            <option value="reifen">Reifen</option>
            <option value="komplettraeder">Kompletträder</option>
          </select>
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">Grösse</label>
          <input
            type="text"
            name="size"
            value={formData.size || ''}
            onChange={onChange}
            disabled={disabled}
            className={`w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500 ${
              disabled ? 'cursor-not-allowed bg-gray-100' : ''
            }`}
            placeholder="z.B. 17x7.5, 225/45R17"
          />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">Lochkreis</label>
          <input
            type="text"
            name="boltPattern"
            value={formData.boltPattern || ''}
            onChange={onChange}
            disabled={disabled}
            className={`w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500 ${
              disabled ? 'cursor-not-allowed bg-gray-100' : ''
            }`}
            placeholder="z.B. 5x112"
          />
        </div>
      </div>
    </div>
  )
}

