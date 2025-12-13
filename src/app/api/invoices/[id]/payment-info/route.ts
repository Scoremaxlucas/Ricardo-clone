import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { generateInvoicePaymentInfo } from '@/lib/invoice-payment-info'

/**
 * API-Route: Gibt Zahlungsinformationen für eine Rechnung zurück
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Nicht autorisiert' }, { status: 401 })
    }

    const { id } = await params

    const paymentInfo = await generateInvoicePaymentInfo(id)

    return NextResponse.json({
      paymentInfo,
    })
  } catch (error: any) {
    console.error('Error generating payment info:', error)
    return NextResponse.json(
      { message: 'Fehler beim Generieren der Zahlungsinformationen: ' + error.message },
      { status: 500 }
    )
  }
}
