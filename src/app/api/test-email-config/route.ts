import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

export async function GET(request: NextRequest) {
  try {
    const resendApiKey = process.env.RESEND_API_KEY
    const resendFromEmail = process.env.RESEND_FROM_EMAIL
    const nextAuthUrl = process.env.NEXTAUTH_URL
    const nextPublicBaseUrl = process.env.NEXT_PUBLIC_BASE_URL

    // Prüfe ob Resend Client initialisiert werden kann
    let resendClientStatus = 'not initialized'
    let resendTestResult = null

    if (resendApiKey) {
      try {
        const resend = new Resend(resendApiKey)
        resendClientStatus = 'initialized'
        
        // Versuche eine Test-Email zu senden
        const testResult = await resend.emails.send({
          from: resendFromEmail || 'onboarding@resend.dev',
          to: ['lucasrodrigues.gafner@outlook.com'],
          subject: 'Test Email from Helvenda',
          html: '<h1>Test Email</h1><p>This is a test email to verify Resend configuration.</p>',
        })
        
        resendTestResult = {
          success: !testResult.error,
          error: testResult.error,
          messageId: testResult.data?.id,
        }
      } catch (error: any) {
        resendTestResult = {
          success: false,
          error: error.message,
        }
      }
    }

    return NextResponse.json({
      environment: {
        RESEND_API_KEY: resendApiKey
          ? `Set (length: ${resendApiKey.length}, starts with: ${resendApiKey.substring(0, 5)}...)`
          : 'NOT SET',
        RESEND_FROM_EMAIL: resendFromEmail || 'NOT SET (will use onboarding@resend.dev)',
        NEXTAUTH_URL: nextAuthUrl || 'NOT SET',
        NEXT_PUBLIC_BASE_URL: nextPublicBaseUrl || 'NOT SET',
      },
      resendClientStatus,
      resendTestResult,
      timestamp: new Date().toISOString(),
    })
  } catch (error: any) {
    return NextResponse.json(
      {
        error: error.message,
        stack: error.stack,
      },
      { status: 500 }
    )
  }
}

