import { NextRequest, NextResponse } from 'next/server'

/**
 * Test-Route um zu prüfen ob OPENAI_API_KEY korrekt konfiguriert ist
 * 
 * GET /api/test-openai
 * 
 * Prüft:
 * - Ob OPENAI_API_KEY gesetzt ist
 * - Ob der Key gültig ist (durch einfachen API-Call)
 */
export async function GET(_request: NextRequest) {
  try {
    const openaiApiKey = process.env.OPENAI_API_KEY

    if (!openaiApiKey) {
      return NextResponse.json(
        {
          success: false,
          error: 'OPENAI_API_KEY ist nicht konfiguriert',
          message: 'Bitte fügen Sie OPENAI_API_KEY zu den Vercel Environment Variables hinzu.',
          steps: [
            '1. Gehen Sie zu Vercel Dashboard → Settings → Environment Variables',
            '2. Fügen Sie OPENAI_API_KEY hinzu',
            '3. Redeploy das Projekt',
          ],
        },
        { status: 500 }
      )
    }

    // Prüfe Key-Format (sollte mit sk- beginnen)
    if (!openaiApiKey.startsWith('sk-')) {
      return NextResponse.json(
        {
          success: false,
          error: 'OPENAI_API_KEY hat ungültiges Format',
          message: 'Der API Key sollte mit "sk-" beginnen.',
          keyPrefix: openaiApiKey.substring(0, 5) + '...',
        },
        { status: 500 }
      )
    }

    // Teste API Key mit einem einfachen API-Call
    try {
      const testResponse = await fetch('https://api.openai.com/v1/models', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${openaiApiKey}`,
        },
      })

      if (!testResponse.ok) {
        const errorData = await testResponse.json().catch(() => ({}))
        return NextResponse.json(
          {
            success: false,
            error: 'OpenAI API Key ist ungültig oder hat keine Berechtigung',
            message: 'Der API Key konnte nicht validiert werden.',
            statusCode: testResponse.status,
            errorDetails: errorData,
            steps: [
              '1. Prüfen Sie Ihre OpenAI API Credits: https://platform.openai.com/usage',
              '2. Prüfen Sie, ob der API Key aktiv ist: https://platform.openai.com/api-keys',
              '3. Erstellen Sie einen neuen API Key falls nötig',
            ],
          },
          { status: 500 }
        )
      }

      // Erfolgreich!
      return NextResponse.json({
        success: true,
        message: 'OpenAI API Key ist korrekt konfiguriert und funktioniert!',
        keyPrefix: openaiApiKey.substring(0, 7) + '...',
        keyLength: openaiApiKey.length,
        timestamp: new Date().toISOString(),
        features: [
          '✅ Emma Chat Assistant',
          '✅ Bilderkennung (Kategorisierung)',
          '✅ Titel-Generierung',
          '✅ Beschreibungs-Generierung',
        ],
      })
    } catch (apiError: any) {
      return NextResponse.json(
        {
          success: false,
          error: 'Fehler beim Testen der OpenAI API',
          message: apiError.message || 'Unbekannter Fehler',
          steps: [
            '1. Prüfen Sie Ihre Internetverbindung',
            '2. Prüfen Sie die Vercel Logs für mehr Details',
          ],
        },
        { status: 500 }
      )
    }
  } catch (error: any) {
    console.error('[test-openai] Fehler:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Interner Serverfehler',
        message: error.message || 'Unbekannter Fehler',
      },
      { status: 500 }
    )
  }
}

