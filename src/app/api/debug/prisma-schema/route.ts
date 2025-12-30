import { NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  // Get the Purchase model scalar fields from Prisma
  const purchaseFields = Object.keys(Prisma.PurchaseScalarFieldEnum)
  
  // Check if disputeInitiatedBy is in the fields
  const hasDisputeInitiatedBy = purchaseFields.includes('disputeInitiatedBy')
  
  // Get prisma version info
  const prismaVersion = Prisma.prismaVersion?.client || 'unknown'
  
  return NextResponse.json({
    message: 'Prisma schema debug info',
    purchaseScalarFields: purchaseFields,
    hasDisputeInitiatedBy,
    prismaClientVersion: prismaVersion,
    timestamp: new Date().toISOString(),
    nodeVersion: process.version,
  })
}
