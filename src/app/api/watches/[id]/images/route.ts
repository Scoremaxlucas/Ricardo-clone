import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * OPTIMIERT: Separate API-Route nur für Bilder
 * Reduziert Payload-Größe und ermöglicht client-side Loading
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    const watch = await prisma.watch.findUnique({
      where: { id },
      select: {
        id: true,
        images: true,
      },
    })

    if (!watch) {
      return NextResponse.json({ images: [] }, { status: 200 })
    }

    let images: string[] = []
    if (watch.images) {
      try {
        images = typeof watch.images === 'string' ? JSON.parse(watch.images) : watch.images
      } catch {
        images = []
      }
    }

    return NextResponse.json({ images })
  } catch (error) {
    console.error('Error fetching watch images:', error)
    return NextResponse.json({ images: [] }, { status: 200 })
  }
}

