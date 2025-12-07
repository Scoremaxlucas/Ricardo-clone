import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// STREAMING API: Sendet Artikel sofort sobald sie aus der DB kommen
// Verwendet Streaming für progressive Rendering
export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId')
    let finalUserId: string | null = null
    
    if (userId) {
      finalUserId = userId
    } else {
      const session = await getServerSession(authOptions)
      finalUserId = session?.user?.id || null
    }
    
    if (!finalUserId) {
      return new Response(JSON.stringify({ watches: [] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // OPTIMIERT: Verwende cursor-based pagination für Streaming
    // Lade in kleinen Batches und sende sofort
    const batchSize = 10
    
    // Erstelle ReadableStream für progressive Übertragung
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder()
        
        try {
          // Sende Start-Marker
          controller.enqueue(encoder.encode('{"watches":['))
          
          let skip = 0
          let firstItem = true
          
          while (true) {
            const batch = await prisma.watch.findMany({
              where: { sellerId: finalUserId! },
              select: {
                id: true,
                title: true,
                brand: true,
                model: true,
                price: true,
                images: true,
                createdAt: true,
                isAuction: true,
                auctionEnd: true,
                articleNumber: true,
              },
              orderBy: { createdAt: 'desc' },
              skip,
              take: batchSize,
            })
            
            if (batch.length === 0) break
            
            for (const w of batch) {
              if (!firstItem) {
                controller.enqueue(encoder.encode(','))
              }
              firstItem = false
              
              let firstImage = ''
              if (w.images && typeof w.images === 'string') {
                try {
                  const parsed = JSON.parse(w.images)
                  firstImage = Array.isArray(parsed) && parsed.length > 0 ? parsed[0] : ''
                } catch {}
              }
              
              const item = JSON.stringify({
                id: w.id,
                articleNumber: w.articleNumber,
                title: w.title || '',
                brand: w.brand || '',
                model: w.model || '',
                price: w.price,
                images: firstImage ? [firstImage] : [],
                createdAt: w.createdAt.toISOString(),
                isSold: false,
                isAuction: !!w.isAuction || !!w.auctionEnd,
                auctionEnd: w.auctionEnd ? w.auctionEnd.toISOString() : null,
                highestBid: null,
                bidCount: 0,
                finalPrice: w.price,
                isActive: true,
              })
              
              controller.enqueue(encoder.encode(item))
            }
            
            if (batch.length < batchSize) break
            skip += batchSize
          }
          
          // Sende End-Marker
          controller.enqueue(encoder.encode(']}'))
          controller.close()
        } catch (error) {
          controller.error(error)
        }
      },
    })
    
    return new Response(stream, {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store',
      },
    })
  } catch (error) {
    return new Response(JSON.stringify({ watches: [] }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}

