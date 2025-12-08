import React from 'react'
import { SubcategoryFieldsProps } from '../shared/types'

export function SmartHomeFields({ formData, onChange, disabled = false }: SubcategoryFieldsProps) {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">Smart Home-Details</h3>
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
            placeholder="z.B. Philips Hue, Amazon, Google"
            required
          />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">Produkttyp</label>
          <select
            name="smartHomeType"
            value={formData.smartHomeType || ''}
            onChange={onChange}
            disabled={disabled}
            className={`w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500 ${
              disabled ? 'cursor-not-allowed bg-gray-100' : ''
            }`}
          >
            <option value="">Bitte wählen</option>
            <option value="smart-light">Smart Light</option>
            <option value="smart-thermostat">Smart Thermostat</option>
            <option value="smart-lock">Smart Lock</option>
            <option value="smart-security">Smart Security</option>
            <option value="smart-speaker">Smart Speaker</option>
            <option value="smart-hub">Smart Hub</option>
          </select>
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">Kompatibilität</label>
          <input
            type="text"
            name="compatibility"
            value={formData.compatibility || ''}
            onChange={onChange}
            disabled={disabled}
            className={`w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500 ${
              disabled ? 'cursor-not-allowed bg-gray-100' : ''
            }`}
            placeholder="z.B. Alexa, Google Home, HomeKit"
          />
        </div>
      </div>
    </div>
  )
}

