import React from 'react'
import { SubcategoryFieldsProps } from '../shared/types'
import { SchuheFields } from './Schuhe'
import { TaschenFields } from './Taschen'
import { SonnenbrillenFields } from './Sonnenbrillen'
import { AccessoiresFields } from './Accessoires'
import { KleidungFields } from './Kleidung'

export function KleidungAccessoiresFields({ subcategory, formData, onChange, disabled }: SubcategoryFieldsProps) {
  // SCHUHE (Alle Schuh-Kategorien)
  if (
    subcategory?.includes('schuhe') ||
    subcategory?.includes('Sneakers') ||
    subcategory?.includes('Stiefel') ||
    subcategory === 'Boots' ||
    subcategory === 'Sandalen' ||
    subcategory === 'Pumps'
  ) {
    return <SchuheFields formData={formData} onChange={onChange} disabled={disabled} />
  }

  // TASCHEN (Handtaschen, Rucksäcke, Koffer)
  if (
    subcategory?.includes('Taschen') ||
    subcategory?.includes('Rucksäcke') ||
    subcategory?.includes('Koffer') ||
    subcategory === 'Clutches' ||
    subcategory === 'Trolleys'
  ) {
    return <TaschenFields formData={formData} onChange={onChange} disabled={disabled} />
  }

  // SONNENBRILLEN
  if (subcategory === 'Sonnenbrillen' || subcategory === 'Markensonnenbrillen') {
    return <SonnenbrillenFields formData={formData} onChange={onChange} disabled={disabled} />
  }

  // ACCESSOIRES (Gürtel, Schals, Mützen, Handschuhe, Krawatten, etc.)
  if (
    subcategory?.includes('Gürtel') ||
    subcategory?.includes('Schals') ||
    subcategory?.includes('Tücher') ||
    subcategory?.includes('Mützen') ||
    subcategory?.includes('Caps') ||
    subcategory?.includes('Handschuhe') ||
    subcategory?.includes('Krawatten') ||
    subcategory?.includes('Fliegen') ||
    subcategory?.includes('Schmuck') ||
    subcategory?.includes('Schulbedarf') ||
    subcategory?.includes('Accessoires') ||
    subcategory === 'Gürtel' ||
    subcategory === 'Ledergürtel' ||
    subcategory === 'Schals & Tücher' ||
    subcategory === 'Seidenschals' ||
    subcategory === 'Mützen & Caps' ||
    subcategory === 'Wintermützen' ||
    subcategory === 'Baseballcaps' ||
    subcategory === 'Handschuhe' ||
    subcategory === 'Lederhandschuhe' ||
    subcategory === 'Krawatten' ||
    subcategory === 'Fliegen' ||
    subcategory === 'Schmuck' ||
    subcategory === 'Goldschmuck' ||
    subcategory === 'Silberschmuck' ||
    subcategory === 'Ringe' ||
    subcategory === 'Ketten' ||
    subcategory === 'Ohrringe' ||
    subcategory === 'Schulbedarf'
  ) {
    return <AccessoiresFields subcategory={subcategory} formData={formData} onChange={onChange} disabled={disabled} />
  }

  // Fallback: Standard Kleidungs-Maske
  return <KleidungFields formData={formData} onChange={onChange} disabled={disabled} />
}

