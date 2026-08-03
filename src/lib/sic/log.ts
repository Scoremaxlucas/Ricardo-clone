/** Strukturiertes Einzeilen-JSON-Log für SIC (Vercel Log Drain). */
export function sicLog(event: string, payload: Record<string, unknown> = {}): void {
  console.log(
    JSON.stringify({
      ts: new Date().toISOString(),
      event,
      ...payload,
    })
  )
}
