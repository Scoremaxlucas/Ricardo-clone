import React from 'react'
import { SubcategoryFieldsProps } from '../shared/types'
import { AutosFields } from './Autos'
import { AutozubehoerFields } from './Autozubehoer'
import { FelgenReifenFields } from './FelgenReifen'
import { MotorraederFields } from './Motorraeder'
import { NutzfahrzeugeFields } from './Nutzfahrzeuge'

export function AutoMotorradFields({ subcategory, formData, onChange, disabled }: SubcategoryFieldsProps) {
  // Autos
  if (subcategory === 'Autos' || subcategory === 'Pkw') {
    return <AutosFields formData={formData} onChange={onChange} disabled={disabled} />
  }

  // Autozubehör
  if (subcategory === 'Autozubehör' || subcategory === 'Fahrzeugzubehör') {
    return <AutozubehoerFields formData={formData} onChange={onChange} disabled={disabled} />
  }

  // Felgen & Reifen
  if (subcategory === 'Felgen & Reifen') {
    return <FelgenReifenFields formData={formData} onChange={onChange} disabled={disabled} />
  }

  // Motorräder
  if (subcategory === 'Motorräder' || subcategory === 'Motorräder & Roller') {
    return <MotorraederFields formData={formData} onChange={onChange} disabled={disabled} />
  }

  // Nutzfahrzeuge
  if (subcategory === 'Nutzfahrzeuge') {
    return <NutzfahrzeugeFields formData={formData} onChange={onChange} disabled={disabled} />
  }

  // Fallback: Generische Maske für Auto & Motorrad ohne spezifische Unterkategorie
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">Fahrzeug-Details</h3>
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
            placeholder="Marke (optional)"
          />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">Modell</label>
          <input
            type="text"
            name="model"
            value={formData.model || ''}
            onChange={onChange}
            disabled={disabled}
            className={`w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500 ${
              disabled ? 'cursor-not-allowed bg-gray-100' : ''
            }`}
            placeholder="Modell (optional)"
          />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">Baujahr</label>
          <input
            type="number"
            name="year"
            value={formData.year || ''}
            onChange={onChange}
            disabled={disabled}
            className={`w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500 ${
              disabled ? 'cursor-not-allowed bg-gray-100' : ''
            }`}
            placeholder="z.B. 2023"
          />
        </div>
      </div>
    </div>
  )
}

