import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Nicht autorisiert' }, { status: 401 })
    }

    const { id } = await params
    const { amount, invoiceNumber } = await request.json()

    // Prüfe ob Rechnung existiert und dem User gehört
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: { seller: true },
    })

    if (!invoice) {
      return NextResponse.json({ message: 'Rechnung nicht gefunden' }, { status: 404 })
    }

    if (invoice.sellerId !== session.user.id) {
      return NextResponse.json({ message: 'Nicht autorisiert' }, { status: 403 })
    }

    if (invoice.status === 'paid') {
      return NextResponse.json({ message: 'Rechnung wurde bereits bezahlt' }, { status: 400 })
    }

    // Erstelle PayPal Order via REST API
    const clientId = process.env.PAYPAL_CLIENT_ID
    const clientSecret = process.env.PAYPAL_CLIENT_SECRET
    const environment = process.env.PAYPAL_ENVIRONMENT || 'sandbox'
    const baseUrl =
      environment === 'production' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com'

    if (!clientId || !clientSecret) {
      throw new Error('PayPal credentials not configured')
    }

    // Hole Access Token
    const tokenResponse = await fetch(`${baseUrl}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-Language': 'en_US',
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
      }),
      // Basic Auth
      // @ts-ignore
      auth: {
        username: clientId,
        password: clientSecret,
      },
    })

    // Für Basic Auth verwenden wir einen anderen Ansatz
    const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')
    const tokenResponse2 = await fetch(`${baseUrl}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-Language': 'en_US',
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${credentials}`,
      },
      body: 'grant_type=client_credentials',
    })

    if (!tokenResponse2.ok) {
      throw new Error('Failed to get PayPal access token')
    }

    const tokenData = await tokenResponse2.json()
    const accessToken = tokenData.access_token

    // Erstelle Order
    const orderResponse = await fetch(`${baseUrl}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
        'PayPal-Request-Id': invoice.id,
      },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [
          {
            reference_id: invoice.id,
            description: `Rechnung ${invoiceNumber}`,
            amount: {
              currency_code: 'CHF',
              value: amount.toFixed(2),
            },
          },
        ],
        application_context: {
          brand_name: 'Helvenda',
          landing_page: 'BILLING',
          user_action: 'PAY_NOW',
          return_url: `${process.env.NEXTAUTH_URL || 'http://localhost:3002'}/my-watches/selling/fees`,
          cancel_url: `${process.env.NEXTAUTH_URL || 'http://localhost:3002'}/my-watches/selling/fees`,
        },
      }),
    })

    if (!orderResponse.ok) {
      const error = await orderResponse.json()
      throw new Error(error.message || 'Failed to create PayPal order')
    }

    const orderData = await orderResponse.json()
    const orderId = orderData.id

    console.log(`[paypal] Order erstellt: ${orderId} für Rechnung ${invoiceNumber}`)

    return NextResponse.json({ orderId })
  } catch (error: any) {
    console.error('[paypal] Error creating order:', error)
    return NextResponse.json(
      { message: error.message || 'Fehler beim Erstellen der PayPal-Bestellung' },
      { status: 500 }
    )
  }
}
