import { authOptions } from '@/lib/auth'
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

// GET: Get single invoice details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ invoiceId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!(await checkAdmin(session))) {
      return NextResponse.json({ message: 'Zugriff verweigert' }, { status: 403 })
    }

    const { invoiceId } = await params

    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        items: {
          include: {
            watch: {
              select: {
                id: true,
                title: true,
                brand: true,
                model: true,
                images: true,
              },
            },
          },
        },
        seller: {
          select: {
            id: true,
            name: true,
            email: true,
            firstName: true,
            lastName: true,
            companyName: true,
            street: true,
            streetNumber: true,
            postalCode: true,
            city: true,
            country: true,
            phone: true,
            isBlocked: true,
            hasUnpaidInvoices: true,
          },
        },
        originalInvoice: {
          select: {
            id: true,
            invoiceNumber: true,
          },
        },
        correctionInvoices: {
          select: {
            id: true,
            invoiceNumber: true,
            total: true,
            createdAt: true,
          },
        },
      },
    })

    if (!invoice) {
      return NextResponse.json({ message: 'Rechnung nicht gefunden' }, { status: 404 })
    }

    return NextResponse.json({ invoice })
  } catch (error: any) {
    console.error('Error fetching invoice:', error)
    return NextResponse.json({ message: 'Fehler beim Laden der Rechnung' }, { status: 500 })
  }
}

// PATCH: Update invoice (mark paid, mahnstopp, notes, etc.)
export async function PATCH(
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
    const { action, ...data } = body

    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { seller: true },
    })

    if (!invoice) {
      return NextResponse.json({ message: 'Rechnung nicht gefunden' }, { status: 404 })
    }

    let updateData: any = {}
    let message = ''

    switch (action) {
      case 'mark_paid':
        updateData = {
          status: 'paid',
          paidAt: new Date(),
          paymentMethod: data.paymentMethod || 'admin_manual',
          paymentReference: data.paymentReference || `ADMIN-${session?.user?.id}-${Date.now()}`,
          paymentConfirmedAt: new Date(),
        }
        // Also update user's hasUnpaidInvoices flag
        const remainingUnpaid = await prisma.invoice.count({
          where: {
            sellerId: invoice.sellerId,
            id: { not: invoiceId },
            status: { in: ['pending', 'overdue'] },
          },
        })
        if (remainingUnpaid === 0) {
          await prisma.user.update({
            where: { id: invoice.sellerId },
            data: { hasUnpaidInvoices: false },
          })
        }
        message = 'Rechnung als bezahlt markiert'
        break

      case 'mark_unpaid':
        updateData = {
          status: invoice.dueDate < new Date() ? 'overdue' : 'pending',
          paidAt: null,
          paymentMethod: null,
          paymentReference: null,
          paymentConfirmedAt: null,
        }
        await prisma.user.update({
          where: { id: invoice.sellerId },
          data: { hasUnpaidInvoices: true },
        })
        message = 'Zahlung zurückgesetzt'
        break

      case 'set_mahnstopp':
        updateData = {
          collectionStopped: true,
          collectionStoppedAt: new Date(),
          collectionStoppedBy: session?.user?.id,
          collectionStoppedReason: data.reason || 'Mahnstopp durch Admin',
        }
        message = 'Mahnstopp aktiviert'
        break

      case 'remove_mahnstopp':
        updateData = {
          collectionStopped: false,
          collectionResumedAt: new Date(),
        }
        message = 'Mahnstopp aufgehoben'
        break

      case 'set_payment_arrangement':
        updateData = {
          paymentArrangement: true,
          paymentArrangementDate: new Date(),
          paymentArrangementNotes: data.notes || '',
          collectionStopped: true, // Also stop collection
          collectionStoppedAt: new Date(),
          collectionStoppedBy: session?.user?.id,
          collectionStoppedReason: 'Ratenzahlung vereinbart',
        }
        message = 'Ratenzahlung hinterlegt'
        break

      case 'update_notes':
        updateData = {
          adminNotes: data.notes,
        }
        message = 'Notizen aktualisiert'
        break

      case 'cancel':
        updateData = {
          status: 'cancelled',
          adminNotes: (invoice.adminNotes || '') + `\n[${new Date().toISOString()}] Storniert: ${data.reason || 'Keine Angabe'}`,
        }
        message = 'Rechnung storniert'
        break

      case 'reset_reminders':
        updateData = {
          reminderCount: 0,
          firstReminderSentAt: null,
          secondReminderSentAt: null,
          finalReminderSentAt: null,
          paymentRequestSentAt: null,
        }
        message = 'Mahnungen zurückgesetzt'
        break

      case 'unblock_account':
        updateData = {
          accountBlockedAt: null,
          accountBlockedReason: null,
        }
        // Also unblock the user
        await prisma.user.update({
          where: { id: invoice.sellerId },
          data: { isBlocked: false },
        })
        message = 'Konto entsperrt'
        break

      default:
        return NextResponse.json({ message: 'Ungültige Aktion' }, { status: 400 })
    }

    const updatedInvoice = await prisma.invoice.update({
      where: { id: invoiceId },
      data: updateData,
      include: {
        items: true,
        seller: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    return NextResponse.json({
      message,
      invoice: updatedInvoice,
    })
  } catch (error: any) {
    console.error('Error updating invoice:', error)
    return NextResponse.json(
      { message: 'Fehler beim Aktualisieren der Rechnung', error: error.message },
      { status: 500 }
    )
  }
}
