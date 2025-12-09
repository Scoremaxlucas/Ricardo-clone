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
        const parsed = typeof watch.images === 'string' ? JSON.parse(watch.images) : watch.images
        // WICHTIG: Stelle sicher, dass es ein Array ist und die Reihenfolge beibehalten wird
        // Titelbild (erstes Bild) muss immer an erster Stelle bleiben
        images = Array.isArray(parsed) ? parsed : []
      } catch {
        images = []
      }
    }

    // WICHTIG: Stelle sicher, dass images[0] immer das Titelbild ist
    return NextResponse.json({ images })
  } catch (error) {
    console.error('Error fetching watch images:', error)
    return NextResponse.json({ images: [] }, { status: 200 })
  }
}

