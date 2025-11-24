import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { unblockUserAccountAfterPayment } from '@/lib/invoice-reminders'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { message: 'Nicht autorisiert' },
        { status: 401 }
      )
    }

    const { id } = await params
    const { orderId, invoiceNumber } = await request.json()

    // Prüfe ob Rechnung existiert und dem User gehört
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: { seller: true }
    })

    if (!invoice) {
      return NextResponse.json(
        { message: 'Rechnung nicht gefunden' },
        { status: 404 }
      )
    }

    if (invoice.sellerId !== session.user.id) {
      return NextResponse.json(
        { message: 'Nicht autorisiert' },
        { status: 403 }
      )
    }

    if (invoice.status === 'paid') {
      return NextResponse.json(
        { success: true, message: 'Rechnung wurde bereits bezahlt' }
      )
    }

    // Capture PayPal Order via REST API
    const clientId = process.env.PAYPAL_CLIENT_ID
    const clientSecret = process.env.PAYPAL_CLIENT_SECRET
    const environment = process.env.PAYPAL_ENVIRONMENT || 'sandbox'
    const baseUrl = environment === 'production' 
      ? 'https://api-m.paypal.com'
      : 'https://api-m.sandbox.paypal.com'

    if (!clientId || !clientSecret) {
      throw new Error('PayPal credentials not configured')
    }

    // Hole Access Token
    const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')
    const tokenResponse = await fetch(`${baseUrl}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Accept-Language': 'en_US',
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${credentials}`,
      },
      body: 'grant_type=client_credentials',
    })

    if (!tokenResponse.ok) {
      throw new Error('Failed to get PayPal access token')
    }

    const tokenData = await tokenResponse.json()
    const accessToken = tokenData.access_token

    // Capture Order
    const captureResponse = await fetch(`${baseUrl}/v2/checkout/orders/${orderId}/capture`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
    })

    if (!captureResponse.ok) {
      const error = await captureResponse.json()
      throw new Error(error.message || 'Failed to capture PayPal order')
    }

    const captureData = await captureResponse.json()
    const captureId = captureData.id
    const status = captureData.status

    console.log(`[paypal] Order captured: ${captureId}, Status: ${status} für Rechnung ${invoiceNumber}`)

    if (status === 'COMPLETED') {
      // Markiere Rechnung als bezahlt
      await prisma.invoice.update({
        where: { id },
        data: {
          status: 'paid',
          paidAt: new Date(),
          paymentMethod: 'paypal',
          paymentReference: captureId,
        },
      })

      // Entsperre User falls blockiert
      await unblockUserAccountAfterPayment(invoice.sellerId)

      console.log(`[paypal] ✅ Rechnung ${invoiceNumber} als bezahlt markiert via PayPal`)

      return NextResponse.json({
        success: true,
        message: 'Zahlung erfolgreich',
        captureId,
      })
    } else {
      return NextResponse.json(
        { success: false, message: `PayPal-Zahlung Status: ${status}` },
        { status: 400 }
      )
    }
  } catch (error: any) {
    console.error('[paypal] Error capturing order:', error)
    return NextResponse.json(
      { success: false, message: error.message || 'Fehler bei der PayPal-Zahlung' },
      { status: 500 }
    )
  }
}

