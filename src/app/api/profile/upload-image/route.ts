import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('image') as File
    const userId = formData.get('userId') as string

    if (!file || !userId) {
      return NextResponse.json({ message: 'Datei und User ID erforderlich' }, { status: 400 })
    }

    // Konvertiere File zu Base64
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const base64Image = `data:${file.type};base64,${buffer.toString('base64')}`

    console.log('Uploading image for user:', userId)
    console.log('Image size:', base64Image.length)

    // Speichere Base64 String in der Datenbank
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { image: base64Image },
      select: { id: true, image: true },
    })

    console.log('Updated user:', updatedUser)

    return NextResponse.json({
      message: 'Profilbild erfolgreich hochgeladen',
      imageUrl: base64Image,
    })
  } catch (error) {
    console.error('Error uploading profile image:', error)
    return NextResponse.json({ message: 'Ein Fehler ist aufgetreten' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json({ message: 'User ID erforderlich' }, { status: 400 })
    }

    // Entferne Profilbild
    await prisma.user.update({
      where: { id: userId },
      data: { image: null },
    })

    return NextResponse.json({
      message: 'Profilbild erfolgreich entfernt',
    })
  } catch (error) {
    console.error('Error removing profile image:', error)
    return NextResponse.json({ message: 'Ein Fehler ist aufgetreten' }, { status: 500 })
  }
}
