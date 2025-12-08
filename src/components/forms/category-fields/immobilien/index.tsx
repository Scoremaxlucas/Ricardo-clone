import React from 'react'
import { SubcategoryFieldsProps } from '../shared/types'
import { ImmobilienFields } from './Immobilien'
import { GrundstueckeFields } from './Grundstuecke'

export function ImmobilienCategoryFields({ subcategory, formData, onChange, disabled }: SubcategoryFieldsProps) {
  // Grundstücke
  if (subcategory === 'Grundstücke') {
    return <GrundstueckeFields formData={formData} onChange={onChange} disabled={disabled} />
  }

  // Fallback: Standard Immobilien-Maske
  return <ImmobilienFields formData={formData} onChange={onChange} disabled={disabled} />
}

