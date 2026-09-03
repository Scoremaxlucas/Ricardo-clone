import { SicCheckoutCancel } from '@/components/sic/SicCheckoutCancel'
import { prisma } from '@/lib/prisma'
import { sicCheckoutRetryFromPayment } from '@/lib/sic/checkout-retry'
import { sicPaths } from '@/lib/sic/config'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function SicCheckoutCancelPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>
}) {
  const { session_id } = await searchParams
  if (!session_id) return <SicCheckoutCancel retry={null} />

  const payment = await prisma.sicPayment.findUnique({
    where: { stripeCheckoutSessionId: session_id },
    select: {
      email: true,
      moduleKinds: true,
      holderName: true,
      isRenewal: true,
      includeBaseFee: true,
      status: true,
    },
  })

  if (payment?.status === 'PAID') {
    redirect(`${sicPaths.checkoutSuccess}?session_id=${encodeURIComponent(session_id)}`)
  }

  return <SicCheckoutCancel retry={payment ? sicCheckoutRetryFromPayment(payment) : null} />
}
