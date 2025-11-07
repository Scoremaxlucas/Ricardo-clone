import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    console.log('Test watch creation API called')
    
    // Erstelle einen einfachen User
    let tempUser
    try {
      tempUser = await prisma.user.findUnique({
        where: { id: 'test-user-123' }
      })
      
      if (!tempUser) {
        tempUser = await prisma.user.create({
          data: {
            id: 'test-user-123',
            email: 'test@example.com',
            name: 'Test User',
            firstName: 'Test',
            lastName: 'User',
            password: 'test123'
          }
        })
        console.log('User created')
      } else {
        console.log('User already exists')
      }
    } catch (error) {
      console.log('User error:', error)
      // Verwende einen anderen User
      tempUser = await prisma.user.findFirst()
      if (!tempUser) {
        throw new Error('No users found in database')
      }
    }
    
    console.log('User created/found:', tempUser.id)

    // Erstelle eine einfache Uhr
    const watch = await prisma.watch.create({
      data: {
        title: 'Test Rolex Submariner',
        description: 'Test description',
        brand: 'Rolex',
        model: 'Submariner',
        year: 2020,
        condition: 'Sehr gut',
        price: 5000,
        images: JSON.stringify(['test-image']),
        sellerId: tempUser.id
      }
    })
    
    console.log('Watch created successfully:', watch.id)

    return NextResponse.json({
      message: 'Uhr erfolgreich zum Verkauf angeboten',
      watch: {
        id: watch.id,
        title: watch.title,
        brand: watch.brand,
        model: watch.model
      }
    })
  } catch (error) {
    console.error('Test watch creation error:', error)
    return NextResponse.json(
      { message: 'Test Fehler: ' + error.message },
      { status: 500 }
    )
  }
}
