import { NextRequest, NextResponse } from 'next/server'

/**
 * Batch API Endpoint
 *
 * Executes multiple API requests in parallel and returns combined results.
 * This reduces network overhead when multiple endpoints need to be called.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { requests } = body

    if (!Array.isArray(requests)) {
      return NextResponse.json({ error: 'Requests must be an array' }, { status: 400 })
    }

    // Limit batch size to prevent abuse
    if (requests.length > 10) {
      return NextResponse.json({ error: 'Maximum 10 requests per batch' }, { status: 400 })
    }

    // Execute all requests in parallel
    const results = await Promise.allSettled(
      requests.map(async (req: { endpoint: string; params?: Record<string, any> }) => {
        try {
          // Build URL
          const url = new URL(req.endpoint, request.url)
          if (req.params) {
            Object.entries(req.params).forEach(([key, value]) => {
              url.searchParams.append(key, String(value))
            })
          }

          // Forward request to internal API
          const response = await fetch(url.toString(), {
            headers: {
              // Forward auth headers if present
              ...(request.headers.get('authorization') && {
                authorization: request.headers.get('authorization')!,
              }),
            },
          })

          if (!response.ok) {
            throw new Error(`Request failed: ${response.statusText}`)
          }

          return {
            endpoint: req.endpoint,
            data: await response.json(),
          }
        } catch (error: any) {
          return {
            endpoint: req.endpoint,
            error: error.message || 'Unknown error',
          }
        }
      })
    )

    const responses = results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value
      }
      return {
        endpoint: requests[index].endpoint,
        error: result.reason?.message || 'Request failed',
      }
    })

    return NextResponse.json({ responses })
  } catch (error: any) {
    console.error('Error in batch endpoint:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}









