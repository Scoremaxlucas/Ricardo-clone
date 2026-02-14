import { BreadcrumbJsonLd, ProductJsonLd } from '@/components/seo/JsonLd'
import { abs, getProductMeta } from '@/lib/seo'
import type { Metadata } from 'next'

interface LayoutProps {
  children: React.ReactNode
  params: { id: string }
}

export async function generateMetadata({ params }: LayoutProps): Promise<Metadata> {
  const { id } = params
  const meta = await getProductMeta(id)
  if (!meta) {
    return { title: 'Artikel | Helvenda' }
  }

  const url = abs(`/products/${id}`)
  const images = meta.image ? [{ url: meta.image, width: 1200, height: 630, alt: meta.title }] : []

  return {
    title: `${meta.title} | Helvenda`,
    description: meta.description,
    alternates: { canonical: url },
    openGraph: {
      title: `${meta.title} | Helvenda`,
      description: meta.description,
      url,
      siteName: 'Helvenda',
      type: 'website',
      locale: 'de_CH',
      images,
    },
    twitter: {
      card: 'summary_large_image',
      title: `${meta.title} | Helvenda`,
      description: meta.description,
      images: meta.image ? [meta.image] : undefined,
    },
  }
}

export default async function ProductLayout({ children, params }: LayoutProps) {
  const { id } = params
  const meta = await getProductMeta(id)

  const productUrl = meta ? abs(`/products/${id}`) : ''
  const breadcrumbItems = meta
    ? [
        { name: 'Helvenda', url: abs('') },
        { name: 'Produkte', url: abs('/search') },
        { name: meta.title, url: productUrl },
      ]
    : []

  return (
    <>
      {meta && (
        <>
          <ProductJsonLd
            name={meta.title}
            description={meta.description}
            image={meta.image}
            price={meta.price}
            condition={meta.condition}
            seller={{ name: meta.sellerName || 'Helvenda' }}
            url={productUrl}
            sku={meta.articleNumber?.toString()}
          />
          <BreadcrumbJsonLd items={breadcrumbItems} />
        </>
      )}
      {children}
    </>
  )
}
