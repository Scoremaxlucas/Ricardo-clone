# Domain-Umzug: Swiss Immo Cert → `swissimmocert.ch`

Code erwartet **`https://swissimmocert.ch`** (Apex) als SIC-Host (`NEXT_PUBLIC_SIC_URL`).  
Helvenda-Domains (`helvenda.ch`, `wohnen.helvenda.ch`) sind kein SIC-Host und leiten nicht auf Swiss Immo Cert um.

## Wichtig: Apex kanonisch (SSL)

Vercel-Zertifikat deckt oft nur **`swissimmocert.ch`** ab, **nicht** `www`.

Wenn **«Redirect apex → www»** in Vercel aktiv ist **und** die App www → Apex umleitet, entsteht eine Schleife. Safari: **Too many redirects** (`www.swissimmocert.ch`).

Die Middleware leitet deshalb **nicht** www → Apex. www wird wie Apex bedient. Apex bleibt die Origin in Links (`NEXT_PUBLIC_SIC_URL`); Vercel darf Apex einmal auf www schicken.

**Besser in Vercel (optional):** Apex als Primary, www zeigt auf Apex — dann landet alles ohne www. Nicht beides gegeneinander.

### Klick-Schritte in Vercel

1. Projekt → **Settings → Domains**
2. Bei **`swissimmocert.ch`** / **`www.swissimmocert.ch`**: Redirect- oder Edit-Option öffnen
3. Entweder Apex primary (www → Apex) **oder** www primary (Apex → www) — nie beide Richtungen
4. Speichern, 1–2 Min warten, hart neu laden

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

- [ ] Nur **eine** Redirect-Richtung (nie Middleware und Vercel gegeneinander)
- [ ] Vercel Domains **Valid**
- [ ] `https://www.swissimmocert.ch` ohne Safari-Schleife
- [ ] Env `NEXT_PUBLIC_SIC_URL=https://swissimmocert.ch` + Redeploy

## Lokal

`http://localhost:3000/?subdomain=sic`
