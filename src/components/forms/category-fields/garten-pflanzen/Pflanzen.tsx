import React from 'react'
import { SubcategoryFieldsProps } from '../shared/types'

export function PflanzenFields({ formData, onChange, disabled = false }: SubcategoryFieldsProps) {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">Pflanzen-Details</h3>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">Pflanzenart *</label>
          <input
            type="text"
            name="plantType"
            value={formData.plantType || ''}
            onChange={onChange}
            disabled={disabled}
            className={`w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500 ${
              disabled ? 'cursor-not-allowed bg-gray-100' : ''
            }`}
            placeholder="z.B. Tomate, Rose, Lavendel"
            required
          />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">Größe/Alter</label>
          <input
            type="text"
            name="size"
            value={formData.size || ''}
            onChange={onChange}
            disabled={disabled}
            className={`w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500 ${
              disabled ? 'cursor-not-allowed bg-gray-100' : ''
            }`}
            placeholder="z.B. 30cm, 2 Jahre alt"
          />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">Standort</label>
          <select
            name="location"
            value={formData.location || ''}
            onChange={onChange}
            disabled={disabled}
            className={`w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500 ${
              disabled ? 'cursor-not-allowed bg-gray-100' : ''
            }`}
          >
            <option value="">Bitte wählen</option>
            <option value="sonnig">Sonnig</option>
            <option value="halbschatten">Halbschatten</option>
            <option value="schatten">Schatten</option>
            <option value="innen">Innen</option>
          </select>
        </div>
      </div>
    </div>
  )
}

