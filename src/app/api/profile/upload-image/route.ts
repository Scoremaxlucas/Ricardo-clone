import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { uploadImageToBlob, deleteImageFromBlob } from '@/lib/blob-storage'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('image') as File
    const userId = formData.get('userId') as string

    if (!file || !userId) {
      return NextResponse.json({ message: 'Datei und User ID erforderlich' }, { status: 400 })
    }

    console.log('Uploading profile image for user:', userId)
    console.log('Image size:', file.size, 'bytes')

    // KRITISCH: Upload zu Vercel Blob Storage statt Base64
    const blobPath = `profiles/${userId}/${Date.now()}.${file.name.split('.').pop() || 'jpg'}`
    const blobUrl = await uploadImageToBlob(file, blobPath)

    console.log('Uploaded to Blob Storage:', blobUrl)

    // Lösche altes Profilbild aus Blob Storage falls vorhanden
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { image: true },
    })

    if (existingUser?.image && existingUser.image.startsWith('https://')) {
      try {
        await deleteImageFromBlob(existingUser.image)
        console.log('Deleted old profile image from Blob Storage')
      } catch (error) {
        // Nicht kritisch wenn Löschen fehlschlägt
        console.warn('Could not delete old profile image:', error)
      }
    }

    // Speichere Blob URL in der Datenbank
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { image: blobUrl },
      select: { id: true, image: true },
    })

    console.log('Updated user:', updatedUser)

    return NextResponse.json({
      message: 'Profilbild erfolgreich hochgeladen',
      imageUrl: blobUrl,
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

    // Hole aktuelles Profilbild
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { image: true },
    })

    // Lösche Profilbild aus Blob Storage falls vorhanden
    if (user?.image && user.image.startsWith('https://')) {
      try {
        await deleteImageFromBlob(user.image)
        console.log('Deleted profile image from Blob Storage')
      } catch (error) {
        // Nicht kritisch wenn Löschen fehlschlägt
        console.warn('Could not delete profile image from Blob Storage:', error)
      }
    }

    // Entferne Profilbild aus Datenbank
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
