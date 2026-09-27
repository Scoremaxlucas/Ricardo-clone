import { prisma } from '@/lib/prisma'
import { fulfillSicPaidCheckout } from '@/lib/sic/fulfillment'
import { payrexxGateway, payrexxGatewayConfirmed, readPayrexxWebhook } from '@/lib/sic/payrexx'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/** Payrexx meldet den Transaktionsstatus. Freigeschaltet wird nur nach Gegencheck bei Payrexx. */
export async function POST(req: NextRequest) {
  const payload = await req.json().catch(() => null)
  const hook = readPayrexxWebhook(payload)
  if (hook.status !== 'confirmed' || !hook.referenceId || !hook.gatewayId) {
    return NextResponse.json({ ok: true })
  }

  const payment = await prisma.sicPayment.findUnique({
    where: { stripeCheckoutSessionId: hook.referenceId },
    select: { id: true },
  })
  if (!payment) return NextResponse.json({ ok: true })

  try {
    const gateway = await payrexxGateway(hook.gatewayId)
    if (!payrexxGatewayConfirmed(gateway, hook.referenceId)) {
      return NextResponse.json({ ok: true })
    }
    const result = await fulfillSicPaidCheckout({
      stripeCheckoutSessionId: hook.referenceId,
      stripePaymentIntentId: String(hook.gatewayId),
    })
    if (!result.ok) {
      return NextResponse.json({ ok: false }, { status: 500 })
    }
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[sic/payrexx] webhook', err)
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
