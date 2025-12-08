import React from 'react'
import { SubcategoryFieldsProps } from '../shared/types'

export function SonnenbrillenFields({ formData, onChange, disabled = false }: SubcategoryFieldsProps) {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">Sonnenbrillen-Details</h3>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">Marke *</label>
          <input
            type="text"
            name="brand"
            value={formData.brand || ''}
            onChange={onChange}
            disabled={disabled}
            className={`w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500 ${
              disabled ? 'cursor-not-allowed bg-gray-100' : ''
            }`}
            placeholder="z.B. Ray-Ban, Oakley, Gucci"
            required
          />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">Modell *</label>
          <input
            type="text"
            name="model"
            value={formData.model || ''}
            onChange={onChange}
            disabled={disabled}
            className={`w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500 ${
              disabled ? 'cursor-not-allowed bg-gray-100' : ''
            }`}
            placeholder="z.B. Wayfarer, Aviator, GG0061S"
            required
          />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">Rahmenform</label>
          <select
            name="frameShape"
            value={formData.frameShape || ''}
            onChange={onChange}
            disabled={disabled}
            className={`w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500 ${
              disabled ? 'cursor-not-allowed bg-gray-100' : ''
            }`}
          >
            <option value="">Bitte wählen</option>
            <option value="rechteckig">Rechteckig</option>
            <option value="rund">Rund</option>
            <option value="aviator">Aviator</option>
            <option value="wayfarer">Wayfarer</option>
            <option value="cat-eye">Cat-Eye</option>
          </select>
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
            placeholder="z.B. Schwarz, Braun, Gold"
          />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">UV-Schutz</label>
          <select
            name="uvProtection"
            value={formData.uvProtection || ''}
            onChange={onChange}
            disabled={disabled}
            className={`w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500 ${
              disabled ? 'cursor-not-allowed bg-gray-100' : ''
            }`}
          >
            <option value="">Bitte wählen</option>
            <option value="UV400">UV400</option>
            <option value="100%">100% UV-Schutz</option>
          </select>
        </div>
      </div>
    </div>
  )
}

