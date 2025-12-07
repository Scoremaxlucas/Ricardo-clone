/**
 * Articles API Route
 *
 * This is an alias for /api/watches to support the new terminology.
 * All requests are forwarded to the watches route for backward compatibility.
 */

import { NextRequest } from 'next/server'
import { GET as watchesGET, POST as watchesPOST } from '../watches/route'

export async function GET(request: NextRequest) {
  return watchesGET(request)
}

export async function POST(request: NextRequest) {
  return watchesPOST(request)
}


