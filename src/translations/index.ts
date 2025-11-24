import { de } from './de'
import { en } from './en'
import { fr } from './fr'
import { it } from './it'

export const translations = {
  de,
  en,
  fr,
  it,
}

export type Language = keyof typeof translations
export type { Translation } from './de'

















