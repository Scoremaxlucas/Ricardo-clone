import React from 'react'
import { SubcategoryFieldsProps } from '../shared/types'
import { ObjektiveFields } from './Objektive'
import { DrohnenFields } from './Drohnen'
import { KamerasFields } from './Kameras'

export function FotoOptikFields({ subcategory, formData, onChange, disabled }: SubcategoryFieldsProps) {
  // Objektive
  if (subcategory === 'Objektive') {
    return <ObjektiveFields formData={formData} onChange={onChange} disabled={disabled} />
  }

  // Drohnen
  if (subcategory === 'Drohnen mit Kamera' || subcategory === 'Drohnen') {
    return <DrohnenFields formData={formData} onChange={onChange} disabled={disabled} />
  }

  // Fallback: Standard Kamera-Maske
  return <KamerasFields formData={formData} onChange={onChange} disabled={disabled} />
}

