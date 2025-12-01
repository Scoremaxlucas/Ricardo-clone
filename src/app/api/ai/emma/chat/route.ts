import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * EMMA AI ASSISTANT - Chat Endpoint
 *
 * Emma ist der KI-Assistent von Helvenda
 * Sie hilft Benutzern bei Fragen zu:
 * - Produkten und Artikeln
 * - Verkaufsprozess
 * - Kaufprozess
 * - Zahlungsmethoden
 * - Versand
 * - Allgemeine Fragen zu Helvenda
 */

interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

interface EmmaContext {
  userId?: string
  userName?: string
  productId?: string
  productTitle?: string
  productPrice?: number
  productCondition?: string
  sellerName?: string
  userRole?: 'buyer' | 'seller' | 'guest'
  currentPage?: string
}

async function getEmmaContext(request: NextRequest, session: any): Promise<EmmaContext> {
  const context: LeaContext = {}

  if (session?.user) {
    context.userId = session.user.id
    context.userName = session.user.name || session.user.email
    context.userRole = 'buyer' // Default, könnte erweitert werden
  }

  // Versuche Produkt-ID aus URL oder Body zu extrahieren
  const url = new URL(request.url)
  const productId = url.searchParams.get('productId') || request.headers.get('x-product-id')

  if (productId) {
    try {
      const product = await prisma.watch.findUnique({
        where: { id: productId },
        include: {
          seller: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      })

      if (product) {
        context.productId = product.id
        context.productTitle = product.title
        context.productPrice = product.price
        context.productCondition = product.condition
        context.sellerName = product.seller.name || product.seller.email
      }
    } catch (error) {
      console.error('[Emma] Fehler beim Laden des Produkts:', error)
    }
  }

  return context
}

function buildSystemPrompt(context: EmmaContext): string {
  return `Du bist Emma, der freundliche und hilfsbereite KI-Assistent von Helvenda.ch, einem Schweizer Online-Marktplatz.

Deine Aufgabe ist es, Benutzern bei Fragen zu helfen und sie durch den Verkaufs- und Kaufprozess zu führen.

WICHTIGE INFORMATIONEN:
- Helvenda ist ein Schweizer Online-Marktplatz für Private und Gewerbetreibende
- Benutzer können Artikel verkaufen (Auktion oder Sofortkauf) und kaufen
- Zahlungsmethoden: Banküberweisung, Kreditkarte, TWINT, PayPal
- Versand: A-Post, B-Post, Abholung
- Alle Preise sind in CHF (Schweizer Franken)

${
  context.productId
    ? `
AKTUELLES PRODUKT:
- Titel: ${context.productTitle}
- Preis: CHF ${context.productPrice?.toFixed(2)}
- Zustand: ${context.productCondition}
- Verkäufer: ${context.sellerName}
`
    : ''
}

${
  context.userName
    ? `
BENUTZER:
- Name: ${context.userName}
`
    : ''
}

DEIN STIL:
- Freundlich, professionell und hilfsbereit
- Antworte auf Deutsch (Schweizerdeutsch ist ok, aber Standard-Deutsch bevorzugt)
- Sei präzise und konkret
- Wenn du etwas nicht weißt, gib ehrlich zu, dass du es nicht weißt
- Bei komplexen Problemen oder wenn der Benutzer explizit nach menschlichem Support fragt, leite ihn weiter mit: "Für weitere Unterstützung kannst du unseren Support kontaktieren unter support@helvenda.ch oder über das Kontaktformular."
- Verwende Emojis sparsam, aber freundlich (z.B. ✅, ❌, 💡)

ANTWORTE IMMER AUF DEUTSCH!`
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const { message, conversationId, productId } = await request.json()

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return NextResponse.json({ error: 'Nachricht ist erforderlich' }, { status: 400 })
    }

    const openaiApiKey = process.env.OPENAI_API_KEY
    if (!openaiApiKey) {
      console.error('[Emma] OPENAI_API_KEY nicht konfiguriert')
      return NextResponse.json(
        {
          error: 'OPENAI_API_KEY ist nicht konfiguriert. Bitte fügen Sie ihn zu .env.local hinzu.',
        },
        { status: 500 }
      )
    }

    // Hole Kontext
    const context = await getEmmaContext(request, session)
    if (productId && !context.productId) {
      context.productId = productId
    }

    // Lade Conversation History falls vorhanden
    let conversationHistory: ChatMessage[] = []
    if (conversationId) {
      try {
        const conversation = await prisma.conversation.findUnique({
          where: { id: conversationId },
          include: {
            messages: {
              orderBy: { createdAt: 'asc' },
              take: 10, // Letzte 10 Nachrichten für Kontext
            },
          },
        })

        if (conversation) {
          conversationHistory = conversation.messages.map(msg => ({
            role: msg.role as 'user' | 'assistant',
            content: msg.content,
          }))
        }
      } catch (error) {
        console.error('[Emma] Fehler beim Laden der Conversation:', error)
      }
    }

    // Baue Messages für OpenAI
    const messages: ChatMessage[] = [
      {
        role: 'system',
        content: buildSystemPrompt(context),
      },
      ...conversationHistory,
      {
        role: 'user',
        content: message.trim(),
      },
    ]

    // Rufe OpenAI API auf
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini', // Kostengünstig und schnell
        messages: messages,
        max_tokens: 500,
        temperature: 0.7,
        stream: false,
      }),
    })

    if (!openaiResponse.ok) {
      const error = await openaiResponse.json()
      console.error('[Emma] OpenAI API Fehler:', error)
      console.error('[Emma] OpenAI Response Status:', openaiResponse.status)
      console.error('[Emma] OpenAI Error Details:', JSON.stringify(error, null, 2))
      return NextResponse.json(
        { error: 'Emma konnte deine Frage nicht beantworten. Bitte versuche es später erneut.' },
        { status: 500 }
      )
    }

    const data = await openaiResponse.json()
    const assistantMessage =
      data.choices[0]?.message?.content?.trim() ||
      'Entschuldigung, ich konnte deine Frage nicht beantworten.'

    // Speichere Conversation (optional - nur wenn Datenbank verfügbar)
    let finalConversationId = conversationId
    try {
      if (!finalConversationId) {
        const newConversation = await prisma.conversation.create({
          data: {
            userId: session?.user?.id || null,
            context: JSON.stringify(context),
          },
        })
        finalConversationId = newConversation.id
      }

      // Speichere Messages
      await prisma.conversationMessage.createMany({
        data: [
          {
            conversationId: finalConversationId,
            role: 'user',
            content: message.trim(),
          },
          {
            conversationId: finalConversationId,
            role: 'assistant',
            content: assistantMessage,
          },
        ],
      })
    } catch (dbError: any) {
      // Wenn Datenbank-Fehler, logge aber antworte trotzdem
      console.error('[Emma] Fehler beim Speichern der Conversation:', dbError)
      // Verwende Fallback-ID wenn Conversation nicht gespeichert werden kann
      if (!finalConversationId) {
        finalConversationId = `temp-${Date.now()}`
      }
    }

    return NextResponse.json({
      message: assistantMessage,
      conversationId: finalConversationId,
      context: context,
    })
  } catch (error: any) {
    console.error('[Emma] Fehler:', error)
    console.error('[Emma] Error Stack:', error.stack)
    return NextResponse.json(
      { error: 'Ein Fehler ist aufgetreten. Bitte versuche es später erneut.' },
      { status: 500 }
    )
  }
}
