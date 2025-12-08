import React from 'react'
import { SubcategoryFieldsProps } from '../shared/types'
import { MoebelFields } from './Moebel'
import { HaushaltsgeraeteFields } from './Haushaltsgeraete'
import { LampenFields } from './Lampen'
import { KuechengeraeteFields } from './Kuechengeraete'
import { BesteckGeschirrFields } from './BesteckGeschirr'

export function HaushaltWohnenFields({ subcategory, formData, onChange, disabled }: SubcategoryFieldsProps) {
  // MÖBEL (Sofas, Tische, Schränke, Betten)
  if (
    subcategory?.includes('Möbel') ||
    subcategory?.includes('Sofas') ||
    subcategory?.includes('Tische') ||
    subcategory?.includes('Schränke') ||
    subcategory?.includes('Betten') ||
    subcategory === 'Couches' ||
    subcategory === 'Sessel' ||
    subcategory === 'Stühle' ||
    subcategory === 'Regale' ||
    subcategory === 'Kommoden'
  ) {
    return <MoebelFields formData={formData} onChange={onChange} disabled={disabled} />
  }

  // HAUSHALTSGERÄTE (Waschmaschinen, Kühlschränke, Staubsauger, etc.)
  if (
    subcategory?.includes('Haushaltsgeräte') ||
    subcategory?.includes('Wasch') ||
    subcategory?.includes('Kühl') ||
    subcategory?.includes('Staubsauger') ||
    subcategory === 'Trockner' ||
    subcategory === 'Geschirrspüler'
  ) {
    return <HaushaltsgeraeteFields formData={formData} onChange={onChange} disabled={disabled} />
  }

  // LAMPEN & LEUCHTEN
  if (subcategory?.includes('Lampen') || subcategory?.includes('lampen')) {
    return <LampenFields formData={formData} onChange={onChange} disabled={disabled} />
  }

  // KÜCHENGERÄTE (Kaffeemaschinen, Mixer, Toaster, etc.)
  if (
    subcategory?.includes('Küchengeräte') ||
    subcategory === 'Kaffeemaschinen' ||
    subcategory === 'Mixer' ||
    subcategory === 'Toaster' ||
    subcategory === 'Backöfen'
  ) {
    return <KuechengeraeteFields formData={formData} onChange={onChange} disabled={disabled} />
  }

  // GESCHIRR & BESTECK (Besteck-Sets, Teller, Tassen, Gläser)
  if (
    subcategory === 'Besteck-Sets' ||
    subcategory === 'Geschirr & Besteck' ||
    subcategory === 'Teller' ||
    subcategory === 'Tassen' ||
    subcategory === 'Gläser'
  ) {
    return <BesteckGeschirrFields formData={formData} onChange={onChange} disabled={disabled} />
  }

  // Fallback: Standard Haushalt-Maske
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">Haushalt-Details</h3>
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
            placeholder="Marke"
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
            placeholder="Modell"
          />
        </div>
      </div>
    </div>
  )
}

