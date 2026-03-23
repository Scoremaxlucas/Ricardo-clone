import { authOptions } from '@/lib/auth'
import { getProductDetailForPage } from '@/lib/product-detail'
import { getServerSession } from 'next-auth/next'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)
    const currentUserId = session?.user?.id || null

    if (!id) {
      return NextResponse.json({ error: 'No ID provided' }, { status: 400 })
    }

    const data = await getProductDetailForPage(id, currentUserId)

    if (!data) {
      return NextResponse.json({ error: 'Watch not found' }, { status: 404 })
    }

    return NextResponse.json(data)
  } catch (error: unknown) {
    const err = error as Error
    console.error('[products/[id]] Error:', err.message)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
