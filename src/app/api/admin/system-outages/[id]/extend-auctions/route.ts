import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { shouldShowDetailedErrors } from '@/lib/env'

export const dynamic = 'force-dynamic'

/**
 * Auktionsverlängerung bei Systemausfällen
 *
 * Gemäss "Grundsätze bei Systemausfällen":
 * - Bei Ausfall von 15 Minuten oder weniger: Verlängerung um 1 Stunde
 * - Bei Ausfall von über 15 Minuten: Verlängerung um 24 Stunden
 *
 * Betroffen sind alle Auktionen die:
 * - Während des Ausfalls geendet hätten
 * - Bis zu 1 Stunde nach dem Ausfall geendet hätten
 */
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })
    }

    // Systemausfall laden
    const outage = await prisma.systemOutage.findUnique({
      where: { id: params.id },
    })

    if (!outage) {
      return NextResponse.json({ error: 'Systemausfall nicht gefunden' }, { status: 404 })
    }

    if (!outage.endedAt) {
      return NextResponse.json(
        {
          error: 'Der Systemausfall muss zuerst beendet werden, bevor Auktionen verlängert werden',
        },
        { status: 400 }
      )
    }

    if (outage.extensionApplied) {
      return NextResponse.json(
        {
          error: 'Auktionsverlängerung wurde bereits angewendet',
          auctionsExtended: outage.auctionsExtended,
          extensionMinutes: outage.extensionMinutes,
          extensionAppliedAt: outage.extensionAppliedAt,
        },
        { status: 400 }
      )
    }

    // Dauer berechnen
    const durationMinutes =
      outage.durationMinutes ||
      Math.round((outage.endedAt.getTime() - outage.startedAt.getTime()) / 60000)

    // Verlängerung gemäss Regeln:
    // <= 15 Minuten: 1 Stunde (60 Minuten)
    // > 15 Minuten: 24 Stunden (1440 Minuten)
    const extensionMinutes = durationMinutes <= 15 ? 60 : 1440

    // Betroffene Auktionen finden:
    // - auctionEnd war während des Ausfalls ODER
    // - auctionEnd ist bis zu 1 Stunde nach Ausfall-Ende
    const oneHourAfterEnd = new Date(outage.endedAt.getTime() + 60 * 60 * 1000)

    const affectedAuctions = await prisma.watch.findMany({
      where: {
        isAuction: true,
        auctionEnd: {
          gte: outage.startedAt,
          lte: oneHourAfterEnd,
        },
        moderationStatus: {
          notIn: ['rejected', 'blocked', 'removed', 'ended', 'sold'],
        },
      },
      select: {
        id: true,
        title: true,
        auctionEnd: true,
      },
    })

    if (affectedAuctions.length === 0) {
      // Keine betroffenen Auktionen, aber trotzdem als "angewendet" markieren
      await prisma.systemOutage.update({
        where: { id: params.id },
        data: {
          extensionApplied: true,
          extensionMinutes,
          auctionsExtended: 0,
          extensionAppliedAt: new Date(),
          extensionAppliedBy: session.user.id,
        },
      })

      return NextResponse.json({
        message: 'Keine Auktionen betroffen',
        extensionMinutes,
        auctionsExtended: 0,
      })
    }

    // Auktionen verlängern
    const extensionMs = extensionMinutes * 60 * 1000
    const updatePromises = affectedAuctions.map((auction) => {
      const currentEnd = auction.auctionEnd!
      const newEnd = new Date(currentEnd.getTime() + extensionMs)

      return prisma.watch.update({
        where: { id: auction.id },
        data: {
          auctionEnd: newEnd,
        },
      })
    })

    await Promise.all(updatePromises)

    // Ausfall aktualisieren
    await prisma.systemOutage.update({
      where: { id: params.id },
      data: {
        extensionApplied: true,
        extensionMinutes,
        auctionsExtended: affectedAuctions.length,
        extensionAppliedAt: new Date(),
        extensionAppliedBy: session.user.id,
      },
    })

    return NextResponse.json({
      message: `${affectedAuctions.length} Auktionen wurden um ${extensionMinutes === 60 ? '1 Stunde' : '24 Stunden'} verlängert`,
      extensionMinutes,
      auctionsExtended: affectedAuctions.length,
      affectedAuctions: affectedAuctions.map((a) => ({
        id: a.id,
        title: a.title,
        originalEnd: a.auctionEnd,
        newEnd: new Date(a.auctionEnd!.getTime() + extensionMs),
      })),
    })
  } catch (error) {
    console.error('Fehler bei der Auktionsverlängerung:', error)
    return NextResponse.json(
      {
        error: 'Fehler bei der Auktionsverlängerung',
        ...(shouldShowDetailedErrors() && { details: String(error) }),
      },
      { status: 500 }
    )
  }
}

// GET: Vorschau der betroffenen Auktionen (ohne Änderungen)
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })
    }

    const outage = await prisma.systemOutage.findUnique({
      where: { id: params.id },
    })

    if (!outage) {
      return NextResponse.json({ error: 'Systemausfall nicht gefunden' }, { status: 404 })
    }

    if (!outage.endedAt) {
      return NextResponse.json({
        message: 'Ausfall noch aktiv - keine Vorschau verfügbar',
        affectedAuctions: [],
      })
    }

    const durationMinutes =
      outage.durationMinutes ||
      Math.round((outage.endedAt.getTime() - outage.startedAt.getTime()) / 60000)

    const extensionMinutes = durationMinutes <= 15 ? 60 : 1440
    const oneHourAfterEnd = new Date(outage.endedAt.getTime() + 60 * 60 * 1000)

    const affectedAuctions = await prisma.watch.findMany({
      where: {
        isAuction: true,
        auctionEnd: {
          gte: outage.startedAt,
          lte: oneHourAfterEnd,
        },
        moderationStatus: {
          notIn: ['rejected', 'blocked', 'removed', 'ended', 'sold'],
        },
      },
      select: {
        id: true,
        title: true,
        auctionEnd: true,
        price: true,
        seller: {
          select: { id: true, name: true, email: true },
        },
      },
    })

    return NextResponse.json({
      outageId: outage.id,
      durationMinutes,
      extensionMinutes,
      extensionLabel: extensionMinutes === 60 ? '1 Stunde' : '24 Stunden',
      affectedCount: affectedAuctions.length,
      affectedAuctions: affectedAuctions.map((a) => ({
        id: a.id,
        title: a.title,
        currentEnd: a.auctionEnd,
        proposedEnd: new Date(a.auctionEnd!.getTime() + extensionMinutes * 60 * 1000),
        currentPrice: a.price,
        seller: a.seller,
      })),
      alreadyApplied: outage.extensionApplied,
    })
  } catch (error) {
    console.error('Fehler bei der Vorschau:', error)
    return NextResponse.json(
      {
        error: 'Fehler bei der Vorschau',
        ...(shouldShowDetailedErrors() && { details: String(error) }),
      },
      { status: 500 }
    )
  }
}
