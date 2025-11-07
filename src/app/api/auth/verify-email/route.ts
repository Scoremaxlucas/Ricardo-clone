import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.json(
        { message: 'Kein Token angegeben' },
        { status: 400 }
      )
    }

    const user = await prisma.user.findFirst({
      where: {
        emailVerificationToken: token,
        emailVerified: false,
      }
    })

    if (!user) {
      return NextResponse.json(
        { message: 'Ungültiger oder abgelaufener Token' },
        { status: 400 }
      )
    }

    if (user.emailVerificationTokenExpires && user.emailVerificationTokenExpires < new Date()) {
      return NextResponse.json(
        { message: 'Token ist abgelaufen. Bitte registrieren Sie sich erneut.' },
        { status: 400 }
      )
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        emailVerifiedAt: new Date(),
        emailVerificationToken: null,
        emailVerificationTokenExpires: null,
      }
    })

    return NextResponse.json(
      { message: 'E-Mail-Adresse erfolgreich bestätigt' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Email verification error:', error)
    return NextResponse.json(
      { message: 'Ein Fehler ist aufgetreten' },
      { status: 500 }
    )
  }
}
