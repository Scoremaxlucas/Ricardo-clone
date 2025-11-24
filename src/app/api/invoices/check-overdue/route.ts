import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    // Nur Admins können diesen Job manuell triggern (oder als Cron)
    if (!session?.user?.id) {
      // Wenn keine Session, prüfe ob es ein Cron-Job ist
      const authHeader = request.headers.get('authorization')
      if (!authHeader || authHeader !== `Bearer ${process.env.CRON_SECRET || 'development-secret'}`) {
        return NextResponse.json(
          { message: 'Nicht autorisiert' },
          { status: 401 }
        )
      }
    } else {
      // Prüfe ob User Admin ist (nur aus Session)
      const isAdminInSession = session?.user?.isAdmin === true || session?.user?.isAdmin === 1
      
      if (!isAdminInSession) {
        return NextResponse.json(
          { message: 'Zugriff verweigert' },
          { status: 403 }
        )
      }
    }

    // Finde alle überfälligen Rechnungen
    const now = new Date()
    const overdueInvoices = await prisma.invoice.updateMany({
      where: {
        status: 'pending',
        dueDate: {
          lt: now
        }
      },
      data: {
        status: 'overdue'
      }
    })

    console.log(`[invoices/check-overdue] ${overdueInvoices.count} Rechnungen als überfällig markiert`)

    return NextResponse.json({
      message: `Status-Update erfolgreich`,
      updated: overdueInvoices.count
    })
  } catch (error: any) {
    console.error('Error checking overdue invoices:', error)
    return NextResponse.json(
      { message: 'Fehler beim Status-Update: ' + error.message },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  // GET für manuelle Prüfung (ohne Auth für einfachen Cron-Setup)
  try {
    const now = new Date()
    const overdueCount = await prisma.invoice.count({
      where: {
        status: 'pending',
        dueDate: {
          lt: now
        }
      }
    })

    return NextResponse.json({
      overdueCount
    })
  } catch (error: any) {
    console.error('Error counting overdue invoices:', error)
    return NextResponse.json(
      { message: 'Fehler: ' + error.message },
      { status: 500 }
    )
  }
}



