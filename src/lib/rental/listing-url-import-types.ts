export type ImportListingAiResult = {
  title: string
  description: string
  address: string
  zip: string
  city: string
  canton: string
  rooms: number | null
  areaSqm: number | null
  floor: number | null
  rentPerMonth: number | null
  utilitiesPerMonth: number | null
  depositAmount: number | null
  availableFrom: string
  features: string[]
  originalPlatform: string
  confidence: 'high' | 'medium' | 'low'
}
