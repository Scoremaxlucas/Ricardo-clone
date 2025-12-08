import React from 'react'
import { SubcategoryFieldsProps } from '../shared/types'
import { SmartwatchesFields } from './Smartwatches'
import { IPhonesFields } from './iPhones'
import { SmartphonesFields } from './Smartphones'

export function HandyTelefonFields({ subcategory, formData, onChange, disabled }: SubcategoryFieldsProps) {
  // Smartwatches
  if (subcategory === 'Smartwatches') {
    return <SmartwatchesFields formData={formData} onChange={onChange} disabled={disabled} />
  }

  // iPhones
  if (subcategory === 'iPhones') {
    return <IPhonesFields formData={formData} onChange={onChange} disabled={disabled} />
  }

  // Fallback: Standard Smartphone-Maske
  return <SmartphonesFields formData={formData} onChange={onChange} disabled={disabled} />
}

