import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET: Alle Suchabos des Users abrufen
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 })
    }

    const subscriptions = await prisma.searchSubscription.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json({ subscriptions })
  } catch (error: any) {
    console.error('Error fetching search subscriptions:', error)
    return NextResponse.json({ error: 'Fehler beim Abrufen der Suchabos' }, { status: 500 })
  }
}

// POST: Neues Suchabo erstellen
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 })
    }

    const body = await request.json()
    const {
      searchTerm,
      brand,
      model,
      categoryId,
      subcategoryId,
      minPrice,
      maxPrice,
      condition,
      yearFrom,
      yearTo,
    } = body

    // Validierung: Mindestens ein Suchkriterium muss vorhanden sein
    if (!searchTerm && !brand && !model && !categoryId) {
      return NextResponse.json(
        { error: 'Mindestens ein Suchkriterium muss angegeben werden' },
        { status: 400 }
      )
    }

    const subscription = await prisma.searchSubscription.create({
      data: {
        userId: session.user.id,
        searchTerm: searchTerm || null,
        brand: brand || null,
        model: model || null,
        categoryId: categoryId || null,
        subcategoryId: subcategoryId || null,
        minPrice: minPrice ? parseFloat(minPrice) : null,
        maxPrice: maxPrice ? parseFloat(maxPrice) : null,
        condition: condition || null,
        yearFrom: yearFrom ? parseInt(yearFrom) : null,
        yearTo: yearTo ? parseInt(yearTo) : null,
        isActive: true,
      },
    })

    return NextResponse.json({ subscription }, { status: 201 })
  } catch (error: any) {
    console.error('Error creating search subscription:', error)
    return NextResponse.json({ error: 'Fehler beim Erstellen des Suchabos' }, { status: 500 })
  }
}
