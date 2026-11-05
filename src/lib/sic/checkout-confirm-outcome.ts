/**
 * Was die Erfolgsseite mit der Antwort der Bestätigung anfängt.
 *
 * Wichtig ist der Unterschied zwischen «geht gerade nicht» und «geht nicht»:
 * Ein kurzer Aussetzer (Netz weg, Server- oder Datenbankfehler) direkt nach der
 * Zahlung darf nicht als Fehler vor der Kundin stehen — die Zahlung ist da, also
 * weiter versuchen. Die Bestätigung ist idempotent, ein zweiter Aufruf schadet nie.
 */
export type SicConfirmOutcome =
  | { status: 'ok' }
  /** Zahlung beim Anbieter noch nicht als bezahlt gemeldet. */
  | { status: 'pending' }
  /** Vorübergehender Fehler — erneut versuchen. */
  | { status: 'retry' }
  | { status: 'error'; message?: string }

export function sicConfirmOutcome(
  /** HTTP-Status; `null`, wenn die Anfrage gar nicht ankam. */
  httpStatus: number | null,
  data: { ok?: unknown; pending?: unknown; message?: unknown } | null
): SicConfirmOutcome {
  if (httpStatus === null) return { status: 'retry' }
  if (data?.ok) return { status: 'ok' }
  if (data?.pending) return { status: 'pending' }
  if (httpStatus >= 500 || httpStatus === 429) return { status: 'retry' }
  return { status: 'error', message: typeof data?.message === 'string' ? data.message : undefined }
}
