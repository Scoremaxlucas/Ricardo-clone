import { Footer } from '@/components/layout/Footer'
import { Header } from '@/components/layout/Header'
import { prisma } from '@/lib/prisma'
import dynamicImport from 'next/dynamic'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const ProductPageClient = dynamicImport(
  () => import('@/components/product/ProductPageClient').then(mod => mod.ProductPageClient),
  {
    loading: () => (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-gray-600">Lade Produkt...</div>
      </div>
    ),
    ssr: true,
  }
)

interface Props {
  params: Promise<{ id: string }>
}

export default async function ProductPage({ params }: Props) {
  const { id } = await params

  if (!id) {
    return (
      <div className="flex min-h-screen flex-col bg-gray-50">
        <Header />
        <main className="flex-1 pb-8">
          <ProductPageClient watch={null} images={[]} conditionMap={{}} lieferumfang="" seller={null} />
        </main>
        <Footer />
      </div>
    )
  }

  // Try to find the watch
  let watch = null

  try {
    // First try by CUID
    watch = await prisma.watch.findUnique({
      where: { id },
      include: {
        seller: {
          select: {
            id: true,
            name: true,
            email: true,
            city: true,
            postalCode: true,
            verified: true,
          },
        },
      },
    })

    // If not found and ID looks numeric, try articleNumber
    if (!watch && /^\d+$/.test(id)) {
      watch = await prisma.watch.findUnique({
        where: { articleNumber: parseInt(id) },
        include: {
          seller: {
            select: {
              id: true,
              name: true,
              email: true,
              city: true,
              postalCode: true,
              verified: true,
            },
          },
        },
      })
    }
  } catch (error) {
    console.error('[ProductPage] Database error:', error)
  }

  if (!watch) {
    return (
      <div className="flex min-h-screen flex-col bg-gray-50">
        <Header />
        <main className="flex-1 pb-8">
          <ProductPageClient watch={null} images={[]} conditionMap={{}} lieferumfang="" seller={null} />
        </main>
        <Footer />
      </div>
    )
  }

  // Parse images
  let images: string[] = []
  try {
    images = watch.images ? JSON.parse(watch.images) : []
  } catch {
    images = []
  }

  // Parse condition
  let conditionMap: Record<string, string> = {}
  try {
    if (watch.condition) {
      const parsed = JSON.parse(watch.condition)
      conditionMap = typeof parsed === 'object' ? parsed : { overall: watch.condition }
    }
  } catch {
    conditionMap = { overall: watch.condition || 'Nicht angegeben' }
  }

  // Transform watch data
  const watchData = {
    id: watch.id,
    articleNumber: watch.articleNumber,
    title: watch.title,
    description: watch.description,
    brand: watch.brand,
    model: watch.model,
    year: watch.year,
    condition: watch.condition,
    material: watch.material,
    movement: watch.movement,
    caseSize: watch.caseSize,
    caseDiameter: watch.caseDiameter,
    price: watch.price,
    buyNowPrice: watch.buyNowPrice,
    isAuction: watch.isAuction,
    auctionStart: watch.auctionStart?.toISOString() || null,
    auctionEnd: watch.auctionEnd?.toISOString() || null,
    createdAt: watch.createdAt.toISOString(),
    accuracy: watch.accuracy,
    fullset: watch.fullset,
    allLinks: watch.allLinks,
    box: watch.box,
    papers: watch.papers,
    warranty: watch.warranty,
    warrantyMonths: watch.warrantyMonths,
    warrantyYears: watch.warrantyYears,
    warrantyNote: watch.warrantyNote,
    warrantyDescription: watch.warrantyDescription,
    referenceNumber: watch.referenceNumber,
    shippingMethod: watch.shippingMethod,
    deliveryMode: watch.deliveryMode,
    pickupLocationCity: watch.pickupLocationCity,
    pickupLocationZip: watch.pickupLocationZip,
    sellerId: watch.sellerId,
    moderationStatus: watch.moderationStatus,
  }

  const sellerData = watch.seller
    ? {
        id: watch.seller.id,
        name: watch.seller.name,
        email: watch.seller.email,
        city: watch.seller.city,
        postalCode: watch.seller.postalCode,
        verified: watch.seller.verified,
      }
    : null

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <Header />
      <main className="flex-1 pb-8">
        <ProductPageClient
          watch={watchData}
          images={images}
          conditionMap={conditionMap}
          lieferumfang=""
          seller={sellerData}
        />
      </main>
      <Footer />
    </div>
  )
}
