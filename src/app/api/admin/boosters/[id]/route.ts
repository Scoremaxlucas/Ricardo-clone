import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Helper function to check admin status
async function checkAdmin(session: any): Promise<boolean> {
  if (!session?.user?.id && !session?.user?.email) {
    return false
  }

  let user = null
  if (session.user.id) {
    user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { isAdmin: true, email: true },
    })
  }

  if (!user && session.user.email) {
    user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { isAdmin: true, email: true },
    })
  }

  const isAdminInDb = user?.isAdmin === true || user?.isAdmin === true

  return isAdminInDb
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)

    if (!(await checkAdmin(session))) {
      return NextResponse.json(
        { message: 'Zugriff verweigert. Admin-Rechte erforderlich.' },
        { status: 403 }
      )
    }

    const { id } = await params
    const booster = await prisma.boosterPrice.findUnique({
      where: { id },
    })

    if (!booster) {
      return NextResponse.json({ message: 'Booster nicht gefunden' }, { status: 404 })
    }

    return NextResponse.json(booster)
  } catch (error: any) {
    console.error('Error fetching booster:', error)
    return NextResponse.json(
      { message: 'Fehler beim Laden des Boosters', error: error.message },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)

    if (!(await checkAdmin(session))) {
      return NextResponse.json(
        { message: 'Zugriff verweigert. Admin-Rechte erforderlich.' },
        { status: 403 }
      )
    }

    const { id } = await params
    const body = await request.json()
    const { code, name, description, price, isActive } = body

    // Validierung
    if (code && typeof code !== 'string') {
      return NextResponse.json({ message: 'Code muss ein String sein' }, { status: 400 })
    }

    if (name && typeof name !== 'string') {
      return NextResponse.json({ message: 'Name muss ein String sein' }, { status: 400 })
    }

    if (price !== undefined && (typeof price !== 'number' || price < 0)) {
      return NextResponse.json({ message: 'Preis muss >= 0 sein' }, { status: 400 })
    }

    if (isActive !== undefined && typeof isActive !== 'boolean') {
      return NextResponse.json({ message: 'isActive muss ein Boolean sein' }, { status: 400 })
    }

    // Update booster
    const updatedBooster = await prisma.boosterPrice.update({
      where: { id },
      data: {
        ...(code && { code }),
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(price !== undefined && { price }),
        ...(isActive !== undefined && { isActive }),
      },
    })

    return NextResponse.json({
      message: 'Booster erfolgreich aktualisiert',
      booster: updatedBooster,
    })
  } catch (error: any) {
    console.error('Error updating booster:', error)
    return NextResponse.json(
      { message: 'Fehler beim Aktualisieren des Boosters', error: error.message },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!(await checkAdmin(session))) {
      return NextResponse.json(
        { message: 'Zugriff verweigert. Admin-Rechte erforderlich.' },
        { status: 403 }
      )
    }

    const { id } = await params
    await prisma.boosterPrice.delete({
      where: { id },
    })

    return NextResponse.json({
      message: 'Booster erfolgreich gelöscht',
    })
  } catch (error: any) {
    console.error('Error deleting booster:', error)
    return NextResponse.json(
      { message: 'Fehler beim Löschen des Boosters', error: error.message },
      { status: 500 }
    )
  }
}
