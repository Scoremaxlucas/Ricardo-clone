import React from 'react'
import { SubcategoryFieldsProps } from '../shared/types'

export function IPhonesFields({ formData, onChange, disabled = false }: SubcategoryFieldsProps) {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">iPhone-Details</h3>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">Modell *</label>
          <select
            name="model"
            value={formData.model || ''}
            onChange={onChange}
            disabled={disabled}
            className={`w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500 ${
              disabled ? 'cursor-not-allowed bg-gray-100' : ''
            }`}
            required
          >
            <option value="">Bitte wählen</option>
            <option value="iPhone 15 Pro Max">iPhone 15 Pro Max</option>
            <option value="iPhone 15 Pro">iPhone 15 Pro</option>
            <option value="iPhone 15 Plus">iPhone 15 Plus</option>
            <option value="iPhone 15">iPhone 15</option>
            <option value="iPhone 14 Pro Max">iPhone 14 Pro Max</option>
            <option value="iPhone 14 Pro">iPhone 14 Pro</option>
            <option value="iPhone 14">iPhone 14</option>
            <option value="iPhone 13">iPhone 13</option>
            <option value="iPhone SE">iPhone SE</option>
          </select>
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">Speicher *</label>
          <select
            name="storage"
            value={formData.storage || ''}
            onChange={onChange}
            disabled={disabled}
            className={`w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500 ${
              disabled ? 'cursor-not-allowed bg-gray-100' : ''
            }`}
            required
          >
            <option value="">Bitte wählen</option>
            <option value="128GB">128GB</option>
            <option value="256GB">256GB</option>
            <option value="512GB">512GB</option>
            <option value="1TB">1TB</option>
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
            placeholder="z.B. Natur Titan, Schwarz Titan, Blau"
          />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">Batteriezustand (%)</label>
          <input
            type="number"
            name="batteryHealth"
            value={formData.batteryHealth || ''}
            onChange={onChange}
            disabled={disabled}
            className={`w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500 ${
              disabled ? 'cursor-not-allowed bg-gray-100' : ''
            }`}
            placeholder="z.B. 95, 85, 100"
            min="0"
            max="100"
          />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">SIM-Lock</label>
          <select
            name="simLock"
            value={formData.simLock || ''}
            onChange={onChange}
            disabled={disabled}
            className={`w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500 ${
              disabled ? 'cursor-not-allowed bg-gray-100' : ''
            }`}
          >
            <option value="">Bitte wählen</option>
            <option value="ohne">Ohne SIM-Lock</option>
            <option value="mit">Mit SIM-Lock</option>
          </select>
        </div>
      </div>
    </div>
  )
}

