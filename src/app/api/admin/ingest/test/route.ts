import Anthropic from '@anthropic-ai/sdk'
import { authOptions } from '@/lib/auth'
import { isAdmin } from '@/lib/auth/isAdmin'
import { coerceAnthropicListingModel } from '@/lib/rental/anthropic-model'
import { getServerSession } from 'next-auth/next'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!(await isAdmin(session))) {
    return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
  }

  const apiKey = process.env.ANTHROPIC_API_KEY?.trim()
  if (!apiKey) {
    return NextResponse.json({ success: false, error: 'NO_API_KEY' }, { status: 200 })
  }

  try {
    const anthropic = new Anthropic({ apiKey })
    const model = coerceAnthropicListingModel(process.env.ANTHROPIC_INGEST_MODEL)
    const message = await anthropic.messages.create({
      model,
      max_tokens: 100,
      messages: [{ role: 'user', content: 'Antworte nur mit: {"test": "ok"}' }],
    })
    const text = message.content[0]?.type === 'text' ? message.content[0].text : 'NO TEXT'
    return NextResponse.json({ success: true, response: text })
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 200 })
  }
}
