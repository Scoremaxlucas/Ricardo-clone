/**
 * Bexio Debug API - Get tax rates and other config
 */

import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const secret = searchParams.get('secret')

  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!process.env.BEXIO_API_TOKEN) {
    return NextResponse.json({ error: 'BEXIO_API_TOKEN not set' }, { status: 500 })
  }

  const results: any = {}

  const headers = {
    Authorization: `Bearer ${process.env.BEXIO_API_TOKEN}`,
    Accept: 'application/json',
  }

  try {
    // Get tax rates
    const taxRes = await fetch('https://api.bexio.com/2.0/tax', { headers })
    if (taxRes.ok) {
      const taxes = await taxRes.json()
      results.taxes = taxes.map((t: any) => ({
        id: t.id,
        name: t.name,
        value: t.value,
        is_active: t.is_active,
      }))
    } else {
      results.taxError = await taxRes.text()
    }
  } catch (e: any) {
    results.taxError = e.message
  }

  try {
    // Get bank accounts
    const bankRes = await fetch('https://api.bexio.com/2.0/bank_account', { headers })
    if (bankRes.ok) {
      results.bankAccounts = await bankRes.json()
    }
  } catch (e: any) {
    results.bankError = e.message
  }

  try {
    // Get payment types
    const paymentRes = await fetch('https://api.bexio.com/2.0/payment_type', { headers })
    if (paymentRes.ok) {
      results.paymentTypes = await paymentRes.json()
    }
  } catch (e: any) {
    results.paymentError = e.message
  }

  return NextResponse.json(results)
}
