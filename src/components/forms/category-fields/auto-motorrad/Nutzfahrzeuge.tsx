import React from 'react'
import { SubcategoryFieldsProps } from '../shared/types'

export function NutzfahrzeugeFields({ formData, onChange, disabled = false }: SubcategoryFieldsProps) {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">Nutzfahrzeug-Details</h3>
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
            placeholder="z.B. Mercedes, MAN, Iveco"
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
            placeholder="z.B. Sprinter, TGE, Daily"
            required
          />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">Baujahr *</label>
          <input
            type="number"
            name="year"
            value={formData.year || ''}
            onChange={onChange}
            disabled={disabled}
            className={`w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500 ${
              disabled ? 'cursor-not-allowed bg-gray-100' : ''
            }`}
            placeholder="z.B. 2020"
            required
          />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">Kilometerstand</label>
          <input
            type="number"
            name="mileage"
            value={formData.mileage || ''}
            onChange={onChange}
            disabled={disabled}
            className={`w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500 ${
              disabled ? 'cursor-not-allowed bg-gray-100' : ''
            }`}
            placeholder="z.B. 100000"
          />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">Nutzlast (kg)</label>
          <input
            type="number"
            name="payload"
            value={formData.payload || ''}
            onChange={onChange}
            disabled={disabled}
            className={`w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500 ${
              disabled ? 'cursor-not-allowed bg-gray-100' : ''
            }`}
            placeholder="z.B. 3500"
          />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">Fahrzeugtyp</label>
          <select
            name="vehicleType"
            value={formData.vehicleType || ''}
            onChange={onChange}
            disabled={disabled}
            className={`w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500 ${
              disabled ? 'cursor-not-allowed bg-gray-100' : ''
            }`}
          >
            <option value="">Bitte wählen</option>
            <option value="transporter">Transporter</option>
            <option value="lieferwagen">Lieferwagen</option>
            <option value="lkw">LKW</option>
            <option value="bus">Bus</option>
            <option value="andere">Andere</option>
          </select>
        </div>
      </div>
    </div>
  )
}

