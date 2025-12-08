import React from 'react'
import { SubcategoryFieldsProps } from '../shared/types'

export function LebensmittelFields({ formData, onChange, disabled = false }: SubcategoryFieldsProps) {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">Lebensmittel-Details</h3>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">Produkttyp</label>
          <input
            type="text"
            name="productType"
            value={formData.productType || ''}
            onChange={onChange}
            disabled={disabled}
            className={`w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500 ${
              disabled ? 'cursor-not-allowed bg-gray-100' : ''
            }`}
            placeholder="z.B. Bio-Gemüse, Käse, Honig"
          />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">Menge/Gewicht</label>
          <input
            type="text"
            name="quantity"
            value={formData.quantity || ''}
            onChange={onChange}
            disabled={disabled}
            className={`w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500 ${
              disabled ? 'cursor-not-allowed bg-gray-100' : ''
            }`}
            placeholder="z.B. 500g, 1kg, 1 Liter"
          />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">Herkunft</label>
          <input
            type="text"
            name="origin"
            value={formData.origin || ''}
            onChange={onChange}
            disabled={disabled}
            className={`w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500 ${
              disabled ? 'cursor-not-allowed bg-gray-100' : ''
            }`}
            placeholder="z.B. Schweiz, Regional"
          />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">Ablaufdatum</label>
          <input
            type="date"
            name="expiryDate"
            value={formData.expiryDate || ''}
            onChange={onChange}
            disabled={disabled}
            className={`w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500 ${
              disabled ? 'cursor-not-allowed bg-gray-100' : ''
            }`}
          />
        </div>
      </div>
    </div>
  )
}

