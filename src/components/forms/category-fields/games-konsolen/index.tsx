import React from 'react'
import { SubcategoryFieldsProps } from '../shared/types'
import { VideogameFields } from './VideogameFields'
import { KonsolenFields } from './KonsolenFields'

// Unterkategorien für Videospiele (Software)
const GAME_SUBCATEGORIES = [
  'Spiele für PS5',
  'Spiele für Xbox',
  'Spiele für Switch',
  'PC-Spiele',
]

export function GamesKonsolenFields({
  subcategory,
  formData,
  onChange,
  disabled = false,
}: SubcategoryFieldsProps) {
  const isGame =
    subcategory &&
    (GAME_SUBCATEGORIES.includes(subcategory) ||
      subcategory.includes('Spiele') ||
      subcategory === 'Spiele' ||
      subcategory?.toLowerCase().includes('videospiel'))

  if (isGame) {
    return (
      <VideogameFields formData={formData} onChange={onChange} disabled={disabled} />
    )
  }

  // Konsolen, Zubehör, etc.
  return (
    <KonsolenFields formData={formData} onChange={onChange} disabled={disabled} />
  )
}
