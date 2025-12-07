/**
 * Articles Create API Route
 *
 * This is an alias for /api/watches/create to support the new terminology.
 */

import { NextRequest } from 'next/server'
import { POST as watchesCreatePOST } from '../../watches/create/route'

export async function POST(request: NextRequest) {
  return watchesCreatePOST(request)
}


