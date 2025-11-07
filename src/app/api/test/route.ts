import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    console.log('Test API called')
    const data = await request.json()
    console.log('Received data:', data)
    
    return NextResponse.json({
      message: 'Test erfolgreich',
      receivedData: data
    })
  } catch (error) {
    console.error('Test API error:', error)
    return NextResponse.json(
      { message: 'Test Fehler: ' + error },
      { status: 500 }
    )
  }
}




