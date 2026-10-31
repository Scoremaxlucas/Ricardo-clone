import { createHmac } from 'node:crypto'

const API = 'https://api.payrexx.com/v1.0'

export function payrexxSessionId(reference: string): string {
  return `payrexx_${reference}`
}

export function isPayrexxSessionId(sessionId: string): boolean {
  return /^payrexx_[A-Za-z0-9_-]{8,}$/.test(sessionId)
}

export function payrexxConfigured(): boolean {
  return (
    process.env.PAYREXX_CHECKOUT === '1' &&
    Boolean(process.env.PAYREXX_INSTANCE?.trim() && process.env.PAYREXX_API_SECRET?.trim())
  )
}

function instance(): string {
  return process.env.PAYREXX_INSTANCE?.trim() || ''
}

function secret(): string {
  return process.env.PAYREXX_API_SECRET?.trim() || ''
}

/** Payrexx signiert den Body exakt so, wie er gesendet wird — ohne ApiSignature. */
export function payrexxSignature(body: string, apiSecret = secret()): string {
  return createHmac('sha256', apiSecret).update(body).digest('base64')
}

function encodeBody(fields: Record<string, string>): string {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(fields)) params.append(key, value)
  return params.toString()
}

async function payrexxFetch(path: string, body?: string, query?: string): Promise<unknown> {
  // GET signiert die Filter im Query-String, POST den Body — wie das offizielle SDK.
  const signature = payrexxSignature(body ?? query ?? '')
  const url = `${API}${path}?instance=${encodeURIComponent(instance())}${query ? `&${query}` : ''}`
  const res = await fetch(body ? url : `${url}&ApiSignature=${encodeURIComponent(signature)}`, {
    method: body ? 'POST' : 'GET',
    headers: body ? { 'Content-Type': 'application/x-www-form-urlencoded' } : undefined,
    body: body ? `${body}&ApiSignature=${encodeURIComponent(signature)}` : undefined,
  })
  const json = (await res.json().catch(() => null)) as { status?: string; message?: string; data?: unknown } | null
  if (!res.ok || json?.status === 'error') {
    throw new Error(json?.message || `Payrexx ${res.status}`)
  }
  return json
}

export async function createPayrexxTwintGateway(input: {
  amountCents: number
  referenceId: string
  purpose: string
  email: string
  successUrl: string
  failedUrl: string
}): Promise<{ id: number; link: string }> {
  const body = encodeBody({
    amount: String(input.amountCents),
    currency: 'CHF',
    purpose: input.purpose.replace(/\s+/g, '-').replace(/[^A-Za-z0-9._-]/g, '').slice(0, 100),
    'pm[0]': 'twint',
    referenceId: input.referenceId,
    successRedirectUrl: input.successUrl,
    failedRedirectUrl: input.failedUrl,
    cancelRedirectUrl: input.failedUrl,
    'fields[email][value]': input.email,
    'fields[email][active]': '0',
    'fields[forename][active]': '0',
    'fields[surname][active]': '0',
    'fields[company][active]': '0',
    'fields[street][active]': '0',
    'fields[postcode][active]': '0',
    'fields[place][active]': '0',
    'fields[country][active]': '0',
    'fields[phone][active]': '0',
  })
  const json = (await payrexxFetch('/Gateway/', body)) as {
    data?: { id?: number; link?: string }[]
  }
  const row = json.data?.[0]
  if (!row?.id || !row.link) throw new Error('Payrexx hat keinen Zahlungslink geliefert.')
  return { id: row.id, link: row.link }
}

type GatewayRow = { id?: number; status?: string; referenceId?: string }

export async function payrexxGateway(id: number): Promise<GatewayRow | null> {
  const json = (await payrexxFetch(`/Gateway/${id}/`)) as { data?: GatewayRow[] }
  return json.data?.[0] ?? null
}

export function payrexxGatewayConfirmed(row: GatewayRow | null, referenceId: string): boolean {
  if (!row) return false
  // Jedes von uns erzeugte Gateway trägt unsere referenceId — ohne Übereinstimmung keine Freigabe.
  if (row.referenceId !== referenceId) return false
  return row.status === 'confirmed'
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : null
}

/** Payrexx-Webhook (JSON): nur confirmed zählt. Gateway-ID steht als paymentRequestId. */
export function readPayrexxWebhook(payload: unknown): {
  referenceId: string | null
  gatewayId: number | null
  status: string | null
} {
  const root = asRecord(payload)
  const tx = asRecord(root?.transaction) ?? root
  const invoice = asRecord(tx?.invoice)
  const reference = invoice?.referenceId ?? tx?.referenceId
  const gateway = invoice?.paymentRequestId ?? tx?.paymentRequestId ?? tx?.id
  const gatewayId = typeof gateway === 'number' ? gateway : Number(gateway)
  return {
    referenceId: typeof reference === 'string' && reference ? reference : null,
    gatewayId: Number.isFinite(gatewayId) && gatewayId > 0 ? gatewayId : null,
    status: typeof tx?.status === 'string' ? tx.status : null,
  }
}

type TransactionRow = {
  id?: number
  status?: string
  referenceId?: string
  amount?: number
  invoice?: {
    referenceId?: string
    amount?: number
    totalAmount?: number
    originalAmount?: number
    refundedAmount?: number
  }
}

function payrexxUtc(d: Date): string {
  return d.toISOString().slice(0, 19).replace('T', ' ')
}

/**
 * Bestätigte Transaktion zu unserer referenceId. Das Gateway kennt sie nicht
 * direkt, deshalb suchen wir im Zeitfenster um den Zahlungszeitpunkt.
 */
export async function payrexxConfirmedTransaction(
  referenceId: string,
  around: Date
): Promise<{ id: number; amountCents: number; refundedCents: number } | null> {
  const day = 24 * 60 * 60 * 1000
  const query = encodeBody({
    filterDatetimeUtcGreaterThan: payrexxUtc(new Date(around.getTime() - 2 * day)),
    filterDatetimeUtcLessThan: payrexxUtc(new Date(around.getTime() + 2 * day)),
    limit: '500',
  })
  const json = (await payrexxFetch('/Transaction/', undefined, query)) as { data?: TransactionRow[] }
  const row = (json.data ?? []).find(
    t =>
      (t.referenceId === referenceId || t.invoice?.referenceId === referenceId) &&
      t.id &&
      (t.status === 'confirmed' || t.status === 'partially-refunded')
  )
  if (!row?.id) return null
  const total = Number(
    row.invoice?.totalAmount ?? row.invoice?.originalAmount ?? row.invoice?.amount ?? row.amount ?? 0
  )
  // Ohne bekannten Betrag lieber gar nicht erstatten als «erfolgreich» nichts.
  if (!Number.isFinite(total) || total <= 0) return null
  return { id: row.id, amountCents: total, refundedCents: Number(row.invoice?.refundedAmount ?? 0) }
}

/** Erstattung einer Payrexx-Transaktion, Betrag in Rappen. */
export async function refundPayrexxTransaction(transactionId: number, amountCents: number): Promise<void> {
  await payrexxFetch(`/Transaction/${transactionId}/refund/`, encodeBody({ amount: String(amountCents) }))
}

/**
 * Payrexx sendet Webhooks je nach Einstellung als JSON oder als Formular
 * (`transaction[invoice][referenceId]=…`). Beides auf dieselbe Struktur bringen.
 */
export function parsePayrexxWebhookBody(raw: string, contentType: string | null): unknown {
  if (!raw) return null
  if (!contentType?.includes('application/x-www-form-urlencoded')) {
    try {
      return JSON.parse(raw)
    } catch {
      if (!raw.includes('=')) return null
    }
  }
  const root: Record<string, unknown> = {}
  new URLSearchParams(raw).forEach((value, key) => {
    const parts = key.split(/\[|\]\[|\]/).filter(Boolean)
    let node = root
    parts.forEach((part, i) => {
      if (i === parts.length - 1) {
        node[part] = value
      } else {
        const next = node[part]
        node[part] = next && typeof next === 'object' ? next : {}
        node = node[part] as Record<string, unknown>
      }
    })
  })
  return root
}
