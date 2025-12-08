import React from 'react'
import { SubcategoryFieldsProps } from '../shared/types'
import { BuecherFields } from './Buecher'
import { FilmeSerienFields } from './FilmeSerien'
import { MusikFields } from './Musik'

export function BuecherFilmeMusikFields({ subcategory, formData, onChange, disabled }: SubcategoryFieldsProps) {
  // Bücher (alle Varianten)
  if (
    subcategory?.includes('Bücher') ||
    subcategory === 'Bücher' ||
    subcategory === 'Romane & Erzählungen' ||
    subcategory === 'Kinder- & Jugendbücher' ||
    subcategory === 'Sachbücher' ||
    subcategory === 'Kochbücher' ||
    subcategory === 'Comics & Manga' ||
    subcategory === 'Reiseführer' ||
    subcategory === 'Fachbücher' ||
    subcategory === 'Hörbücher' ||
    subcategory === 'Zeitschriften' ||
    subcategory === 'Antiquarische Bücher' ||
    !subcategory // Fallback wenn keine Unterkategorie
  ) {
    return <BuecherFields formData={formData} onChange={onChange} disabled={disabled} />
  }

  // Filme & Serien
  if (subcategory?.includes('Film') || subcategory?.includes('Serie') || subcategory === 'Filme-Serien') {
    return <FilmeSerienFields formData={formData} onChange={onChange} disabled={disabled} />
  }

  // Musik
  if (subcategory?.includes('Musik') || subcategory === 'Musik') {
    return <MusikFields formData={formData} onChange={onChange} disabled={disabled} />
  }

  // Fallback: Bücher als Standard
  return <BuecherFields formData={formData} onChange={onChange} disabled={disabled} />
}

