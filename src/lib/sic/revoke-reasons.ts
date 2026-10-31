/** Ohne Server-Abhängigkeiten — wird auch in der Admin-Oberfläche (Client) gebraucht. */

export function parseSicRevokeReason(raw: unknown): string | null {
  if (typeof raw !== 'string') return null
  const note = raw.trim().slice(0, 1000)
  return note.length >= 8 ? note : null
}

export const SIC_REVOKE_REASONS = [
  'Gefälschte Unterlagen',
  'Fremde Unterlagen',
  'Sonstiger schwerer Missbrauch',
] as const
