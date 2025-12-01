import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Löscht offensichtliche Testeinträge (z.B. "Test Rolex Submariner" oder Beschreibungen mit "Testeintrag")
export async function DELETE(_request: NextRequest) {
  try {
    const result = await prisma.watch.deleteMany({
      where: {
        OR: [
          { title: { contains: 'Test Rolex Submariner' } },
          { description: { contains: 'Testeintrag' } },
        ],
      },
    })

    return NextResponse.json({ deleted: result.count })
  } catch (error: any) {
    return NextResponse.json({ message: 'Cleanup Fehler: ' + error.message }, { status: 500 })
  }
}
