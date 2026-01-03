import { getAuctionEndingSoonEmail, sendEmail } from '@/lib/email'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const maxDuration = 60 // 60 seconds timeout

// This cron job sends reminder emails to users who have bid on auctions ending soon
// Run every hour via Vercel Cron: 0 * * * *

export async function GET(request: NextRequest) {
  console.log('[cron/auction-reminders] Starting auction reminders job')

  try {
    const now = new Date()
    const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000)
    const in1Hour = new Date(now.getTime() + 1 * 60 * 60 * 1000)

    // Find auctions ending in 24 hours (but not in 1 hour - those get a separate reminder)
    const auctionsEndingIn24Hours = await prisma.watch.findMany({
      where: {
        isAuction: true,
        moderationStatus: 'approved',
        auctionEnd: {
          gt: in1Hour,
          lte: in24Hours,
        },
        // No active purchases
        purchases: {
          none: {
            status: {
              not: 'cancelled',
            },
          },
        },
      },
      include: {
        bids: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                firstName: true,
                nickname: true,
              },
            },
          },
        },
      },
    })

    // Find auctions ending in 1 hour
    const auctionsEndingIn1Hour = await prisma.watch.findMany({
      where: {
        isAuction: true,
        moderationStatus: 'approved',
        auctionEnd: {
          gt: now,
          lte: in1Hour,
        },
        // No active purchases
        purchases: {
          none: {
            status: {
              not: 'cancelled',
            },
          },
        },
      },
      include: {
        bids: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                firstName: true,
                nickname: true,
              },
            },
          },
        },
      },
    })

    let emailsSent24h = 0
    let emailsSent1h = 0
    const errors: string[] = []

    // Send 24-hour reminders
    for (const auction of auctionsEndingIn24Hours) {
      const currentBid = auction.price // Use price as current bid

      // Get first image if available
      let imageUrl: string | undefined
      try {
        const images = auction.images ? JSON.parse(auction.images) : []
        imageUrl = Array.isArray(images) && images.length > 0 ? images[0] : undefined
      } catch {
        imageUrl = undefined
      }

      // Get unique bidders
      const uniqueBidderIds = new Set<string>()
      const bidders: Array<{
        id: string
        email: string
        firstName: string | null
        nickname: string | null
      }> = []
      for (const bid of auction.bids) {
        if (!uniqueBidderIds.has(bid.user.id)) {
          uniqueBidderIds.add(bid.user.id)
          bidders.push(bid.user)
        }
      }

      for (const bidder of bidders) {
        const userName = bidder.firstName || bidder.nickname || 'Bieter'

        try {
          const { subject, html, text } = getAuctionEndingSoonEmail(
            userName,
            auction.title,
            currentBid,
            auction.auctionEnd!,
            auction.id,
            imageUrl,
            24
          )

          await sendEmail({
            to: bidder.email,
            subject,
            html,
            text,
          })

          emailsSent24h++
          console.log(
            `[cron/auction-reminders] 24h reminder sent to ${bidder.email} for ${auction.title}`
          )
        } catch (error: any) {
          console.error(
            `[cron/auction-reminders] Failed to send 24h reminder to ${bidder.email}:`,
            error.message
          )
          errors.push(`24h reminder to ${bidder.email}: ${error.message}`)
        }
      }
    }

    // Send 1-hour reminders (more urgent)
    for (const auction of auctionsEndingIn1Hour) {
      const currentBid = auction.price // Use price as current bid

      // Get first image if available
      let imageUrl1h: string | undefined
      try {
        const images = auction.images ? JSON.parse(auction.images) : []
        imageUrl1h = Array.isArray(images) && images.length > 0 ? images[0] : undefined
      } catch {
        imageUrl1h = undefined
      }

      // Get unique bidders
      const uniqueBidderIds1h = new Set<string>()
      const bidders1h: Array<{
        id: string
        email: string
        firstName: string | null
        nickname: string | null
      }> = []
      for (const bid of auction.bids) {
        if (!uniqueBidderIds1h.has(bid.user.id)) {
          uniqueBidderIds1h.add(bid.user.id)
          bidders1h.push(bid.user)
        }
      }

      for (const bidder of bidders1h) {
        const userName = bidder.firstName || bidder.nickname || 'Bieter'

        try {
          const { subject, html, text } = getAuctionEndingSoonEmail(
            userName,
            auction.title,
            currentBid,
            auction.auctionEnd!,
            auction.id,
            imageUrl1h,
            1
          )

          await sendEmail({
            to: bidder.email,
            subject,
            html,
            text,
          })

          emailsSent1h++
          console.log(
            `[cron/auction-reminders] 1h reminder sent to ${bidder.email} for ${auction.title}`
          )
        } catch (error: any) {
          console.error(
            `[cron/auction-reminders] Failed to send 1h reminder to ${bidder.email}:`,
            error.message
          )
          errors.push(`1h reminder to ${bidder.email}: ${error.message}`)
        }
      }
    }

    const result = {
      success: true,
      auctionsEndingIn24Hours: auctionsEndingIn24Hours.length,
      auctionsEndingIn1Hour: auctionsEndingIn1Hour.length,
      emailsSent24h,
      emailsSent1h,
      totalEmailsSent: emailsSent24h + emailsSent1h,
      errors: errors.length > 0 ? errors : undefined,
      timestamp: new Date().toISOString(),
    }

    console.log('[cron/auction-reminders] Job completed:', result)

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('[cron/auction-reminders] Job failed:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}

