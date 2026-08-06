# Domain-Umzug: Swiss Immo Cert → `swissimmocert.ch`

Code erwartet ab jetzt **`https://swissimmocert.ch`** als SIC-Host (`NEXT_PUBLIC_SIC_URL`).  
`wohnen.helvenda.ch` leitet per **308** auf die neue Domain um (Pfad bleibt erhalten).

## 1. Domain bei Vercel

1. [vercel.com](https://vercel.com) → Projekt **Helvenda** (dasselbe Deployment).
2. **Settings → Domains → Add**.
3. Hinzufügen:
   - `swissimmocert.ch`
   - `www.swissimmocert.ch` (Redirect auf Apex oder umgekehrt — wie Vercel vorschlägt)
4. DNS-Ziel aus Vercel **1:1** übernehmen (meist `cname.vercel-dns.com` bzw. A/AAAA für Apex).

`wohnen.helvenda.ch` **behalten** (weiterhin dem Projekt zugeordnet), damit der Legacy-Redirect greift.

## 2. DNS beim Registrar (wo `swissimmocert.ch` liegt)

Genau die Records aus **Vercel → Domains**:

| Typ | Name | Ziel (Beispiel — bei Vercel kopieren) |
|-----|------|----------------------------------------|
| A / ALIAS / ANAME | `@` | Vercel-Apex-Ziel |
| CNAME | `www` | `cname.vercel-dns.com` (o.ä.) |

Warten bis Status **Valid** + SSL aktiv.

## 3. Environment Variable (Vercel Production)

| Key | Value |
|-----|--------|
| `NEXT_PUBLIC_SIC_URL` | `https://swissimmocert.ch` |

Deploy neu auslösen nach dem Setzen (damit Client-Bundles die Origin kennen).

## 4. Stripe

- Checkout-Success/-Cancel-URLs kommen aus dem Code (`sicUrl(...)`) → greifen nach Env automatisch.
- Webhook-Endpoint bleibt pfadbasiert (`/api/sic/...` bzw. bestehender Stripe-Webhook) — Domain muss im Stripe-Dashboard nicht geändert werden, sofern der Webhook auf die Vercel-App zeigt. Optional in Stripe die Return-URLs prüfen.

## 5. E-Mails / Magic Links

Neue Links nutzen `swissimmocert.ch`. Alte Links auf `wohnen.helvenda.ch` werden per Middleware umgeschrieben.

## 6. Checkliste

- [ ] `swissimmocert.ch` (+ www) in Vercel Domains **Valid**
- [ ] `NEXT_PUBLIC_SIC_URL=https://swissimmocert.ch` gesetzt + Redeploy
- [ ] `https://swissimmocert.ch` öffnet SIC-Landing
- [ ] `https://wohnen.helvenda.ch/sic/zertifikat` → 308 → `https://swissimmocert.ch/sic/zertifikat`
- [ ] Login / Magic Link / Checkout einmal smoke-testen

## Lokal

Preview: `http://localhost:3000/?subdomain=sic`
