/**
 * My Articles API Route
 *
 * This is an alias for /api/watches/mine to support the new terminology.
 */

import { NextRequest } from 'next/server'
import { GET as watchesMineGET } from '../../watches/mine/route'

export async function GET(request: NextRequest) {
  return watchesMineGET(request)
}


