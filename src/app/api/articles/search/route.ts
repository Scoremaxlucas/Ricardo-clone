/**
 * Articles Search API Route
 *
 * This is an alias for /api/watches/search to support the new terminology.
 */

import { NextRequest } from 'next/server'
import { GET as watchesSearchGET } from '../../watches/search/route'

export async function GET(request: NextRequest) {
  return watchesSearchGET(request)
}


