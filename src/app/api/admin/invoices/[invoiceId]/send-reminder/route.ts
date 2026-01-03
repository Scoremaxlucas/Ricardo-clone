import { authOptions } from '@/lib/auth'
import { getInvoiceReminderEmail, sendEmail } from '@/lib/email'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth/next'
import { NextRequest, NextResponse } from 'next/server'

// Check if user is admin
async function checkAdmin(session: any): Promise<boolean> {
  if (!session?.user?.id) return false

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { isAdmin: true },
  })

  return user?.isAdmin === true
}

// POST: Send reminder manually
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ invoiceId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!(await checkAdmin(session))) {
      return NextResponse.json({ message: 'Zugriff verweigert' }, { status: 403 })
    }

    const { invoiceId } = await params
    const body = await request.json()
    const { reminderType } = body // 'payment_request', 'first_reminder', 'second_reminder', 'final_reminder'

    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        seller: {
          select: {
            id: true,
            name: true,
            email: true,
            firstName: true,
          },
        },
        items: {
          include: {
            watch: {
              select: {
                title: true,
              },
            },
          },
        },
      },
    })

    if (!invoice) {
      return NextResponse.json({ message: 'Rechnung nicht gefunden' }, { status: 404 })
    }

    if (!invoice.seller.email) {
      return NextResponse.json({ message: 'Keine E-Mail-Adresse vorhanden' }, { status: 400 })
    }

    if (invoice.collectionStopped) {
      return NextResponse.json(
        { message: 'Mahnstopp aktiv - keine Mahnung möglich' },
        { status: 400 }
      )
    }

    // Determine reminder level and update field
    let updateField: string
    let reminderLevel: number
    let subject: string

    switch (reminderType) {
      case 'payment_request':
        updateField = 'paymentRequestSentAt'
        reminderLevel = 0
        subject = `Zahlungsaufforderung - Rechnung ${invoice.invoiceNumber}`
        break
      case 'first_reminder':
        updateField = 'firstReminderSentAt'
        reminderLevel = 1
        subject = `1. Mahnung - Rechnung ${invoice.invoiceNumber}`
        break
      case 'second_reminder':
        updateField = 'secondReminderSentAt'
        reminderLevel = 2
        subject = `2. Mahnung - Rechnung ${invoice.invoiceNumber}`
        break
      case 'final_reminder':
        updateField = 'finalReminderSentAt'
        reminderLevel = 3
        subject = `Letzte Mahnung - Rechnung ${invoice.invoiceNumber}`
        break
      default:
        return NextResponse.json({ message: 'Ungültiger Mahnungstyp' }, { status: 400 })
    }

    // Get email content
    const itemDescription = invoice.items.map(i => i.watch?.title || i.description).join(', ')
    const emailContent = getInvoiceReminderEmail({
      userName: invoice.seller.firstName || invoice.seller.name || 'Kunde',
      invoiceNumber: invoice.invoiceNumber,
      amount: invoice.total,
      dueDate: invoice.dueDate,
      itemDescription,
      reminderLevel,
    })

    // Send email
    const emailSent = await sendEmail({
      to: invoice.seller.email,
      subject,
      html: emailContent,
    })

    if (!emailSent) {
      return NextResponse.json({ message: 'E-Mail konnte nicht gesendet werden' }, { status: 500 })
    }

    // Update invoice
    await prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        [updateField]: new Date(),
        reminderCount: { increment: 1 },
        adminNotes:
          (invoice.adminNotes || '') +
          `\n[${new Date().toISOString()}] ${reminderType} manuell gesendet durch Admin`,
      },
    })

    return NextResponse.json({
      message: `${subject} erfolgreich gesendet`,
      sentTo: invoice.seller.email,
    })
  } catch (error: any) {
    console.error('Error sending reminder:', error)
    return NextResponse.json(
      { message: 'Fehler beim Senden der Mahnung', error: error.message },
      { status: 500 }
    )
  }
}
