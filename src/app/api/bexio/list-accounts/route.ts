/**
 * List Bexio accounts and tax rates to find valid IDs
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

  const token = process.env.BEXIO_API_TOKEN
  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: 'application/json',
  }

  const results: any = {}

  // Try to get accounts (chart of accounts)
  const endpoints = [
    '/account',
    '/accounts',
    '/chart_of_accounts',
    '/accounting/accounts',
    '/tax',
    '/taxes',
    '/vat',
    '/currency',
  ]

  for (const ep of endpoints) {
    try {
      const res = await fetch(`https://api.bexio.com/2.0${ep}`, { headers })
      if (res.ok) {
        const data = await res.json()
        results[ep] = Array.isArray(data) ? data : data // Alle zurückgeben
      } else {
        results[ep] = { status: res.status, statusText: res.statusText }
      }
    } catch (e: any) {
      results[ep] = { error: e.message }
    }
  }

  // Try 3.0 API
  for (const ep of ['/taxes', '/accounts', '/chart_of_accounts']) {
    try {
      const res = await fetch(`https://api.bexio.com/3.0${ep}`, { headers })
      if (res.ok) {
        const data = await res.json()
        results['3.0' + ep] = Array.isArray(data) ? data.slice(0, 5) : data
      } else {
        results['3.0' + ep] = { status: res.status, statusText: res.statusText }
      }
    } catch (e: any) {
      results['3.0' + ep] = { error: e.message }
    }
  }

  return NextResponse.json(results)
}
