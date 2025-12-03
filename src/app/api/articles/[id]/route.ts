/**
 * Article Detail API Route
 * 
 * This is an alias for /api/watches/[id] to support the new terminology.
 */

import { NextRequest } from 'next/server'
import { GET as watchGET, PATCH as watchPATCH, DELETE as watchDELETE } from '../../watches/[id]/route'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return watchGET(request, { params })
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return watchPATCH(request, { params })
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return watchDELETE(request, { params })
}

