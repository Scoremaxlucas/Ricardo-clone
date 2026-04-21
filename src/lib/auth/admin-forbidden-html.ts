/** HTML-403 für Admin-Routen (Middleware + Server-Component-Fallback, identischer Text). */
export const ADMIN_FORBIDDEN_HTML = `<!DOCTYPE html><html lang="de"><head><meta charset="utf-8"><title>403</title></head><body><h1>Zugriff verweigert</h1><p>403 — Für diese Seite ist eine Admin-Berechtigung nötig.</p></body></html>`

/** Next 14: kein `forbidden()` — Response werfen liefert echtes HTTP 403, wenn der App-Router es durchreicht. */
export function throwAdminForbidden(): never {
  throw new Response(ADMIN_FORBIDDEN_HTML, {
    status: 403,
    headers: { 'content-type': 'text/html; charset=utf-8' },
  })
}
