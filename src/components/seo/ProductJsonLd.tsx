import { abs } from '@/lib/seo'

interface ProductJsonLdProps {
  id: string
  name: string
  description: string
  image: string | null
  price: number
  isAuction: boolean
  condition: string
}

export function ProductJsonLd({
  id,
  name,
  description,
  image,
  price,
  isAuction,
  condition,
}: ProductJsonLdProps) {
  const url = abs(`/products/${id}`)
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name,
    description,
    url,
    ...(image && { image: [image] }),
    offers: {
      '@type': 'Offer',
      price,
      priceCurrency: 'CHF',
      availability: 'https://schema.org/InStock',
      url,
    },
    itemCondition: { '@type': conditionToSchema(condition) },
  }
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

function conditionToSchema(label: string): string {
  const s = (label || '').toLowerCase()
  if (s.includes('neu') || s.includes('wie neu')) return 'NewCondition'
  if (s.includes('sehr gut') || s.includes('sehr gut')) return 'UsedCondition'
  if (s.includes('gut')) return 'UsedCondition'
  if (s.includes('akzeptabel')) return 'UsedCondition'
  return 'UsedCondition'
}
