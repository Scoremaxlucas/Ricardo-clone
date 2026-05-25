import { Building2, FileCheck, Home, Shield, User } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export type WohnenHelpCategoryId =
  | 'gettingStarted'
  | 'tenant'
  | 'certificate'
  | 'landlord'
  | 'trust'

export type WohnenHelpCategory = {
  id: WohnenHelpCategoryId
  titleKey: WohnenHelpCategoryId
  icon: LucideIcon
  color: string
  articles: { slug: string }[]
}

export const WOHNEN_HELP_CATEGORIES: WohnenHelpCategory[] = [
  {
    id: 'gettingStarted',
    titleKey: 'gettingStarted',
    icon: Home,
    color: 'bg-teal-100 text-teal-800',
    articles: [
      { slug: 'wohnen-was-ist-helvenda-wohnungen' },
      { slug: 'wohnen-kosten-und-gebuehren' },
    ],
  },
  {
    id: 'tenant',
    titleKey: 'tenant',
    icon: User,
    color: 'bg-emerald-100 text-emerald-800',
    articles: [
      { slug: 'wohnen-profil-und-suchprofil' },
      { slug: 'wohnen-betreibungsregister-hochladen' },
      { slug: 'wohnen-bewerbung-abgeben' },
      { slug: 'wohnungen-einzugsbonus' },
    ],
  },
  {
    id: 'certificate',
    titleKey: 'certificate',
    icon: FileCheck,
    color: 'bg-cyan-100 text-cyan-800',
    articles: [{ slug: 'wohnen-qualitaetsnachweis-nutzen' }],
  },
  {
    id: 'landlord',
    titleKey: 'landlord',
    icon: Building2,
    color: 'bg-slate-100 text-slate-800',
    articles: [
      { slug: 'wohnen-inserat-veroeffentlichen' },
      { slug: 'wohnen-vermieter-leads' },
      { slug: 'wohnungen-qualitaetsnachweis-pruefen' },
    ],
  },
  {
    id: 'trust',
    titleKey: 'trust',
    icon: Shield,
    color: 'bg-red-100 text-red-800',
    articles: [{ slug: 'wohnen-datenschutz-und-sicherheit' }],
  },
]

export const WOHNEN_FAQ_CATEGORY_IDS = ['general', 'tenant', 'landlord', 'certificate'] as const
export type WohnenFaqCategoryId = (typeof WOHNEN_FAQ_CATEGORY_IDS)[number]

export const WOHNEN_CONTACT_CATEGORIES = [
  { value: 'wohnen_tenant', labelKey: 'tenant' },
  { value: 'wohnen_landlord', labelKey: 'landlord' },
  { value: 'wohnen_certificate', labelKey: 'certificate' },
  { value: 'wohnen_listing', labelKey: 'listing' },
  { value: 'wohnen_technical', labelKey: 'technical' },
  { value: 'wohnen_feedback', labelKey: 'feedback' },
  { value: 'wohnen_other', labelKey: 'other' },
] as const

export const WOHNEN_CONTACT_CATEGORY_LABELS: Record<string, string> = {
  wohnen_tenant: 'Helvenda Wohnungen — Mieter / Bewerbung',
  wohnen_landlord: 'Helvenda Wohnungen — Vermieter / Leads',
  wohnen_certificate: 'Helvenda Wohnungen — Qualitätsnachweis',
  wohnen_listing: 'Helvenda Wohnungen — Inserat',
  wohnen_technical: 'Helvenda Wohnungen — Technisches Problem',
  wohnen_feedback: 'Helvenda Wohnungen — Feedback',
  wohnen_other: 'Helvenda Wohnungen — Sonstiges',
}
