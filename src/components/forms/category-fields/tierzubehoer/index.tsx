import React from 'react'
import { SubcategoryFieldsProps } from '../shared/types'

export function TierzubehoerFields({ formData, onChange, disabled = false }: SubcategoryFieldsProps) {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">Tierzubehör-Details</h3>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">Tierart</label>
          <select
            name="animalType"
            value={formData.animalType || ''}
            onChange={onChange}
            disabled={disabled}
            className={`w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500 ${
              disabled ? 'cursor-not-allowed bg-gray-100' : ''
            }`}
          >
            <option value="">Bitte wählen</option>
            <option value="hund">Hund</option>
            <option value="katze">Katze</option>
            <option value="vogel">Vogel</option>
            <option value="nager">Nager</option>
            <option value="andere">Andere</option>
          </select>
        </div>
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
            placeholder="z.B. Leine, Futterautomat, Spielzeug"
          />
        </div>
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
            placeholder="z.B. Trixie, Ferplast"
          />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">Größe</label>
          <input
            type="text"
            name="size"
            value={formData.size || ''}
            onChange={onChange}
            disabled={disabled}
            className={`w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500 ${
              disabled ? 'cursor-not-allowed bg-gray-100' : ''
            }`}
            placeholder="z.B. S, M, L, für Hunde bis 20kg"
          />
        </div>
      </div>
    </div>
  )
}

