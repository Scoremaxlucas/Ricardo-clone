/**
 * API Request Batching Utility
 *
 * Batches multiple API requests into a single request to reduce
 * network overhead and improve performance.
 */

interface BatchedRequest {
  endpoint: string
  params?: Record<string, any>
  method?: 'GET' | 'POST'
  body?: any
}

interface BatchedResponse {
  endpoint: string
  data: any
  error?: string
}

/**
 * Batch multiple API requests into a single call
 */
export async function batchRequests(
  requests: BatchedRequest[],
  timeout: number = 5000
): Promise<BatchedResponse[]> {
  if (requests.length === 0) return []

  // For now, execute in parallel with Promise.all
  // Future: Could implement actual batching endpoint
  const promises = requests.map(async (req) => {
    try {
      const url = new URL(req.endpoint, typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000')
      if (req.params) {
        Object.entries(req.params).forEach(([key, value]) => {
          url.searchParams.append(key, String(value))
        })
      }

      const response = await fetch(url.toString(), {
        method: req.method || 'GET',
        headers: req.body ? { 'Content-Type': 'application/json' } : {},
        body: req.body ? JSON.stringify(req.body) : undefined,
      })

      if (!response.ok) {
        throw new Error(`Request failed: ${response.statusText}`)
      }

      const data = await response.json()
      return {
        endpoint: req.endpoint,
        data,
      }
    } catch (error: any) {
      return {
        endpoint: req.endpoint,
        data: null,
        error: error.message || 'Unknown error',
      }
    }
  })

  // Use Promise.allSettled to handle partial failures
  const results = await Promise.allSettled(promises)
  return results.map((result, index) => {
    if (result.status === 'fulfilled') {
      return result.value
    }
    return {
      endpoint: requests[index].endpoint,
      data: null,
      error: result.reason?.message || 'Request failed',
    }
  })
}

import { useCallback } from 'react'

/**
 * Hook for batching multiple API calls
 */
export function useBatchedRequests() {
  const executeBatch = useCallback(
    async (requests: BatchedRequest[]) => {
      return batchRequests(requests)
    },
    []
  )

  return { executeBatch }
}

