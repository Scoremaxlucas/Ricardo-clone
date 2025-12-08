import React from 'react'
import { SubcategoryFieldsProps } from '../shared/types'

export function AutozubehoerFields({ formData, onChange, disabled = false }: SubcategoryFieldsProps) {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">Autozubehör-Details</h3>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">Marke/Hersteller</label>
          <input
            type="text"
            name="brand"
            value={formData.brand || ''}
            onChange={onChange}
            disabled={disabled}
            className={`w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500 ${
              disabled ? 'cursor-not-allowed bg-gray-100' : ''
            }`}
            placeholder="z.B. Thule, Bosch, Hella"
          />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">Produkttyp</label>
          <select
            name="productType"
            value={formData.productType || ''}
            onChange={onChange}
            disabled={disabled}
            className={`w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500 ${
              disabled ? 'cursor-not-allowed bg-gray-100' : ''
            }`}
          >
            <option value="">Bitte wählen</option>
            <option value="dachbox">Dachbox</option>
            <option value="fahrradtraeger">Fahrradträger</option>
            <option value="felgen">Felgen & Reifen</option>
            <option value="navigationsgeraet">Navigationsgerät</option>
            <option value="winterreifen">Winterreifen</option>
            <option value="sommerreifen">Sommerreifen</option>
            <option value="andere">Andere</option>
          </select>
        </div>
        <div className="md:col-span-2">
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
            placeholder="z.B. für VW Golf, universell"
          />
        </div>
      </div>
    </div>
  )
}

