import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      brand,
      model,
      year,
      fullset,
      allLinks,
      box,
      papers,
      lastRevision,
      accuracy,
      condition,
      warranty,
      warrantyMonths,
      warrantyYears,
      warrantyNote,
      warrantyDescription,
      price,
      buyNowPrice,
      isAuction,
      auctionDays,
      description,
      imageDataUrls,
      titleImage,
    } = body

    // Validierung: Mindestens Startpreis oder Sofortkaufpreis
    if (!price && !buyNowPrice) {
      return NextResponse.json(
        { message: 'Bitte geben Sie mindestens einen Startpreis oder Sofortkaufpreis ein.' },
        { status: 400 }
      )
    }

    // Bilder verarbeiten
    const imagesString = imageDataUrls && imageDataUrls.length > 0 
      ? imageDataUrls.join(',') 
      : ''

    // Create watch
    const watch = await prisma.watch.create({
      data: {
        title: `${brand} ${model}`,
        description: description || '',
        brand,
        model,
        year: year ? parseInt(year) : null,
        condition: condition || 'Sehr gut',
        material: 'Stahl', // Default
        movement: 'Automatik', // Default
        caseSize: 40.0, // Default
        price: price ? parseFloat(price) : (buyNowPrice ? parseFloat(buyNowPrice) : 0),
        buyNowPrice: buyNowPrice ? parseFloat(buyNowPrice) : null,
        isAuction: isAuction || false,
        auctionEnd: isAuction && auctionDays ? new Date(Date.now() + parseInt(auctionDays) * 24 * 60 * 60 * 1000) : null,
        images: imagesString,
        sellerId: session.user.id,
        // Additional fields for the detailed form
        lastRevision: lastRevision ? new Date(lastRevision) : null,
        accuracy: accuracy || '',
        fullset: fullset || false,
        allLinks: allLinks || false,
        box: box || false,
        papers: papers || false,
        warranty: warranty || '',
        warrantyMonths: warrantyMonths ? parseInt(warrantyMonths) : null,
        warrantyYears: warrantyYears ? parseInt(warrantyYears) : null,
        warrantyNote: warrantyNote || '',
        warrantyDescription: warrantyDescription || '',
      }
    })

    return NextResponse.json({ 
      message: 'Watch created successfully',
      watch 
    }, { status: 201 })

  } catch (error) {
    console.error('Error creating watch:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const category = searchParams.get('category')
    const search = searchParams.get('search')

    const where: any = {}
    
    if (category) {
      where.categories = {
        some: {
          category: {
            name: category
          }
        }
      }
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { brand: { contains: search, mode: 'insensitive' } },
        { model: { contains: search, mode: 'insensitive' } }
      ]
    }

    const now = new Date()
    
    const watches = await prisma.watch.findMany({
      where: {
        ...where,
        // Verkaufe Uhren ausschließen
        purchases: {
          none: {} // Keine Käufe = nicht verkauft
        },
        // Nur aktive Angebote anzeigen (kein Starttermin oder Starttermin bereits erreicht)
        OR: [
          { auctionStart: null },
          { auctionStart: { lte: now } }
        ]
      },
      include: {
        seller: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        categories: {
          include: {
            category: true
          }
        },
        bids: {
          orderBy: {
            amount: 'desc'
          },
          take: 1 // Nur das höchste Gebot
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip: (page - 1) * limit,
      take: limit
    })

    // Berechne aktuellen Preis für jede Uhr und füge Boosters hinzu
    let watchesWithCurrentPrice = watches.map(watch => {
      const highestBid = watch.bids[0]
      const currentPrice = highestBid ? highestBid.amount : watch.price
      
      // Parse boosters
      let boosters: string[] = []
      try {
        if ((watch as any).boosters) {
          boosters = JSON.parse((watch as any).boosters)
        }
      } catch (e) {
        boosters = []
      }
      
      return {
        ...watch,
        price: currentPrice, // Überschreibe price mit aktuellem Preis
        boosters: boosters
      }
    })

    // Sortiere nach Booster-Priorität: super-boost > turbo-boost > boost > none
    watchesWithCurrentPrice = watchesWithCurrentPrice.sort((a, b) => {
      const getBoostPriority = (boosters: string[]): number => {
        if (boosters.includes('super-boost')) return 4
        if (boosters.includes('turbo-boost')) return 3
        if (boosters.includes('boost')) return 2
        return 1
      }
      
      const priorityA = getBoostPriority(a.boosters || [])
      const priorityB = getBoostPriority(b.boosters || [])
      
      if (priorityA !== priorityB) {
        return priorityB - priorityA // Höhere Priorität zuerst
      }
      
      // Bei gleicher Priorität: nach Erstellungsdatum sortieren
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })

    const total = await prisma.watch.count({ 
      where: {
        ...where,
        // Verkaufe Uhren ausschließen
        purchases: {
          none: {}
        }
      }
    })

    return NextResponse.json({
      watches: watchesWithCurrentPrice,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })

  } catch (error) {
    console.error('Error fetching watches:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
