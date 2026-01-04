import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth/next'
import { NextRequest, NextResponse } from 'next/server'

/**
 * RICARDO-LEVEL: Visual Search API
 *
 * Analyzes an uploaded image using AI vision to:
 * 1. Identify the product type, brand, model
 * 2. Extract visual features (color, style)
 * 3. Search for similar products
 *
 * Requires: OPENAI_API_KEY environment variable
 */

export const dynamic = 'force-dynamic'

interface AnalysisResult {
  productType: string
  brand: string | null
  model: string | null
  category: string | null
  style: string | null
  color: string | null
  searchQuery: string
  confidence: number
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    // Check for OpenAI API key
    const openaiKey = process.env.OPENAI_API_KEY
    if (!openaiKey) {
      return NextResponse.json(
        {
          error: 'Visual search not configured',
          message: 'OpenAI API key is required for visual search',
          enabled: false,
        },
        { status: 503 }
      )
    }

    // Get the image from the request
    const formData = await request.formData()
    const imageFile = formData.get('image') as File | null
    const imageUrl = formData.get('imageUrl') as string | null

    if (!imageFile && !imageUrl) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 })
    }

    // Convert image to base64 if it's a file
    let imageData: string
    if (imageFile) {
      const bytes = await imageFile.arrayBuffer()
      const base64 = Buffer.from(bytes).toString('base64')
      const mimeType = imageFile.type || 'image/jpeg'
      imageData = `data:${mimeType};base64,${base64}`
    } else {
      imageData = imageUrl!
    }

    // Call OpenAI Vision API
    const analysis = await analyzeImageWithOpenAI(imageData, openaiKey)

    if (!analysis) {
      return NextResponse.json({ error: 'Could not analyze image' }, { status: 500 })
    }

    // Search for similar products based on analysis
    const searchResults = await searchSimilarProducts(analysis)

    return NextResponse.json({
      analysis,
      results: searchResults,
      enabled: true,
    })
  } catch (error) {
    console.error('[VISUAL_SEARCH] Error:', error)
    return NextResponse.json({ error: 'Failed to process visual search' }, { status: 500 })
  }
}

// GET endpoint to check if visual search is enabled
export async function GET() {
  const openaiKey = process.env.OPENAI_API_KEY
  return NextResponse.json({
    enabled: !!openaiKey,
    message: openaiKey
      ? 'Visual search is enabled'
      : 'Visual search requires OPENAI_API_KEY to be configured',
  })
}

async function analyzeImageWithOpenAI(
  imageData: string,
  apiKey: string
): Promise<AnalysisResult | null> {
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4-vision-preview',
        messages: [
          {
            role: 'system',
            content: `You are a product identification expert for a Swiss marketplace similar to Ricardo.ch.
Analyze the image and identify:
1. Product type (e.g., "watch", "smartphone", "sneakers", "bag")
2. Brand (if identifiable)
3. Model (if identifiable)
4. Category (electronics, fashion, watches, etc.)
5. Style/Features (e.g., "sport", "luxury", "vintage", "casual")
6. Primary color

Respond ONLY in JSON format:
{
  "productType": "string",
  "brand": "string or null",
  "model": "string or null",
  "category": "string or null",
  "style": "string or null",
  "color": "string or null",
  "searchQuery": "best search query in German",
  "confidence": 0.0-1.0
}`,
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Analyze this product image and identify what it is. Focus on identifying the brand, model, and creating an effective search query in German.',
              },
              {
                type: 'image_url',
                image_url: {
                  url: imageData,
                  detail: 'high',
                },
              },
            ],
          },
        ],
        max_tokens: 500,
        temperature: 0.3,
      }),
    })

    if (!response.ok) {
      console.error('[VISUAL_SEARCH] OpenAI API error:', response.status, await response.text())
      return null
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content

    if (!content) {
      return null
    }

    // Parse JSON response
    try {
      // Extract JSON from potential markdown code blocks
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]) as AnalysisResult
      }
    } catch (parseError) {
      console.error('[VISUAL_SEARCH] JSON parse error:', parseError)
    }

    return null
  } catch (error) {
    console.error('[VISUAL_SEARCH] OpenAI API call failed:', error)
    return null
  }
}

async function searchSimilarProducts(analysis: AnalysisResult) {
  const { searchQuery, brand, category, color } = analysis

  // Build search query with multiple criteria
  const whereConditions: any[] = [
    { moderationStatus: { notIn: ['rejected', 'blocked', 'removed'] } },
    {
      OR: [{ auctionEnd: null }, { auctionEnd: { gt: new Date() } }],
    },
  ]

  // Search by multiple fields
  const orConditions: any[] = []

  if (searchQuery) {
    orConditions.push(
      { title: { contains: searchQuery, mode: 'insensitive' } },
      { description: { contains: searchQuery, mode: 'insensitive' } }
    )
  }

  if (brand) {
    orConditions.push({ brand: { contains: brand, mode: 'insensitive' } })
  }

  if (orConditions.length > 0) {
    whereConditions.push({ OR: orConditions })
  }

  try {
    const results = await prisma.watch.findMany({
      where: {
        AND: whereConditions,
      },
      select: {
        id: true,
        title: true,
        brand: true,
        model: true,
        price: true,
        buyNowPrice: true,
        images: true,
        condition: true,
        isAuction: true,
        auctionEnd: true,
        createdAt: true,
        sellerId: true,
        seller: {
          select: {
            city: true,
            postalCode: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    })

    return results.map(r => {
      let images: string[] = []
      try {
        images = typeof r.images === 'string' ? JSON.parse(r.images) : r.images || []
      } catch {}

      return {
        id: r.id,
        title: r.title,
        brand: r.brand,
        model: r.model,
        price: r.price,
        buyNowPrice: r.buyNowPrice,
        images,
        condition: r.condition,
        isAuction: r.isAuction,
        auctionEnd: r.auctionEnd,
        createdAt: r.createdAt,
        city: r.seller?.city || null,
        postalCode: r.seller?.postalCode || null,
      }
    })
  } catch (error) {
    console.error('[VISUAL_SEARCH] Database search failed:', error)
    return []
  }
}
