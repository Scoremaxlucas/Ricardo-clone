import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId')
    
    if (!userId) {
      return NextResponse.json(
        { message: 'userId fehlt' },
        { status: 400 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { 
        verified: true,
        verificationStatus: true
      }
    })

    if (!user) {
      return NextResponse.json(
        { message: 'Benutzer nicht gefunden' },
        { status: 404 }
      )
    }

    return NextResponse.json({ 
      verified: user.verified === true && user.verificationStatus === 'approved'
    })
  } catch (error: any) {
    console.error('Error fetching verification status:', error)
    return NextResponse.json(
      { message: 'Fehler beim Laden des Verifizierungsstatus' },
      { status: 500 }
    )
  }
}





