# Domain-Umzug: Swiss Immo Cert → `swissimmocert.ch`

Code erwartet **`https://swissimmocert.ch`** (Apex) als SIC-Host (`NEXT_PUBLIC_SIC_URL`).  
`wohnen.helvenda.ch` leitet per **308** auf die neue Domain um (Pfad bleibt erhalten).

## Wichtig: Apex kanonisch (SSL)

Vercel-Zertifikat deckt oft nur **`swissimmocert.ch`** ab, **nicht** `www`.

Wenn **«Redirect apex → www»** aktiv ist:

1. Browser öffnet Apex (TLS ok)
2. Redirect auf `https://www.swissimmocert.ch`
3. Safari: **«This Connection Is Not Private»** — Cert hat kein `www` in den SANs

**Fix:** Redirect umdrehen → **www → Apex**.

### Klick-Schritte in Vercel

1. Projekt → **Settings → Domains**
2. Bei **`swissimmocert.ch`** / **`www.swissimmocert.ch`**: Redirect- oder Edit-Option öffnen
3. **Nicht** «Redirect apex to www» — stattdessen Apex als Primary, www zeigt/redirectet auf Apex
4. Speichern, 1–2 Min warten, hart neu laden (`https://swissimmocert.ch`)

### Metanet CNAME

Wert **Zeichen für Zeichen** aus Vercel (www-Domain) kopieren — Tippfehler (`6ca5` vs `6ca6`) verhindern Validierung/Cert für www.

## DNS (Metanet)

| Typ | Name | Ziel |
|-----|------|------|
| **A** | (leer) | IP aus Vercel für Apex |
| **CNAME** | `www` | Value aus Vercel für www |

Danach immer **Jetzt speichern**.

## Env (Vercel Production)

| Key | Value |
|-----|--------|
| `NEXT_PUBLIC_SIC_URL` | `https://swissimmocert.ch` |

Nach Env-Änderung: Redeploy.

## Checkliste

- [ ] Redirect **www → Apex** (nicht Apex → www)
- [ ] Vercel Domains **Valid**
- [ ] `https://swissimmocert.ch` ohne Safari-Warnung
- [ ] Env `NEXT_PUBLIC_SIC_URL=https://swissimmocert.ch` + Redeploy

## Lokal

`http://localhost:3000/?subdomain=sic`
