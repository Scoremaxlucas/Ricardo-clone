# DNS & Vercel: `wohnen.helvenda.ch` einrichten (Helvenda Mietwohnungen)

**Automatisch beim Öffnen des Repos:** siehe [_DNS_WOHNEN_AUTOOPEN.md](../_DNS_WOHNEN_AUTOOPEN.md) und die Task „Helvenda: DNS-Anleitung …“ in [.vscode/tasks.json](../.vscode/tasks.json) (`runOn: folderOpen`).

Kopierbare Anleitung für das Team. Enthält **verifizierte öffentliche DNS-Daten** und die **Vercel-Oberfläche** wie in euren Screenshots (gleicher Ablauf wie für jede Subdomain).

## Vercel in eurem Projekt (Referenz-Screenshots)

**Projekt-Übersicht** — Domains-Karte mit `www.helvenda.ch`; über das **Plus (+)** neben „Domains“ oder über die Sidebar gelangt ihr zur Domain-Verwaltung:

![Vercel Projekt-Übersicht – Production Deployment / Domains](images/vercel-project-overview-domains.png)

**Settings → Domains** — dort verwaltet ihr alle Hostnamen. Button **„Add Existing“** nutzen, um **`wohnen.helvenda.ch`** hinzuzufügen:

![Vercel Settings – Domains Liste](images/vercel-settings-domains.png)

Aktuell sichtbar in den Screenshots u. a.:

| Domain | Hinweis aus Vercel |
|--------|---------------------|
| `helvenda.ch` | **Proxy Detected** — oft Cloudflare (orange Wolke) vor Vercel. Redirect **307** → `www.helvenda.ch`. |
| `www.helvenda.ch` | **DNS Change Recommended** — Vercel schlägt oft eine klarere CNAME-Konfiguration vor; trotzdem **Production**. |
| `helvenda-marketplace.vercel.app` | **Valid Configuration**, Production. |

**`wohnen.helvenda.ch`** muss **explizit** unter Domains stehen, wenn die Miet-Subdomain auf **dieses** Deployment zeigen soll — erscheint nicht automatisch durch Git-Commits.

---

## Wichtig: Kein automatischer Zugriff auf euer Vercel-Konto

Die **exakte** DNS-Zeile steht in **Vercel → Project → Settings → Domains**, sobald ihr die Domain hinzufügt — dort **1:1 kopieren**.

Offizielle Doku: [Working with DNS (Vercel)](https://vercel.com/docs/domains/working-with-dns)

---

## Verifizierter öffentlicher DNS-Stand (Stand Abfrage)

Abgefragt via öffentlichem Resolver (Google Public DNS API):

| Abfrage | Ergebnis |
|---------|----------|
| **NS** für `helvenda.ch` | `amos.ns.cloudflare.com`, `magnolia.ns.cloudflare.com` |
| **CNAME** für `www.helvenda.ch` | `cname.vercel-dns.com.` |
| **CNAME** für `wohnen.helvenda.ch` | `cname.vercel-dns.com.` |

**Konsequenz:** Die **autoritative** Zone für `helvenda.ch` liegt bei **Cloudflare**. DNS-Einträge in **Metanet** wirken für das Internet **nur**, wenn die Nameserver dort hinzeigen — bei euch ist die Zone bei **Cloudflare**.

---

## Schritt 1 — Domain in Vercel anlegen

1. [vercel.com](https://vercel.com) → Projekt **Helvenda** öffnen (gleiches Projekt wie `helvenda-marketplace.vercel.app`).
2. **Settings** → **Domains**.
3. **Add Existing** → **`wohnen.helvenda.ch`** eingeben → bestätigen.
4. Vercel zeigt die **konkrete DNS-Anweisung** (fast immer **CNAME** `wohnen` → `cname.vercel-dns.com` — **exakt aus der UI kopieren**).
5. Warten, bis der Status **Valid** wird und SSL aktiv ist.

Ohne diesen Schritt ist **`wohnen.helvenda.ch`** diesem Projekt nicht zugeordnet.

---

## Schritt 2 — DNS bei Cloudflare setzen

1. [dash.cloudflare.com](https://dash.cloudflare.com) → Zone **`helvenda.ch`**.
2. **DNS** → **Records**.
3. Eintrag für **`wohnen`**:
   - **Type:** `CNAME`
   - **Name:** `wohnen`
   - **Target:** genau der Wert aus **Vercel → Domains** (wie bei `www`: typisch `cname.vercel-dns.com`).
4. **Proxy:** **DNS only (grau)** oder **Proxied (orange)** — bei orange in Cloudflare **SSL/TLS** prüfen (häufig **Full (strict)** mit Vercel).
5. Keine widersprüchlichen doppelten Einträge für `wohnen` lassen.

**Nicht** als Ziel nur `helvenda.ch` setzen, wenn Vercel **`cname.vercel-dns.com`** verlangt.

---

## Schritt 3 — Vercel-Warnungen („DNS Change Recommended“, „Proxy Detected“)

- **DNS Change Recommended** (bei `www`): In Vercel **Learn more** / **Edit** und empfohlene Konfiguration übernehmen.
- **Proxy Detected**: Cloudflare vor Vercel — SSL-Modus und CNAME müssen zusammenpassen.

---

## Schritt 4 — Metanet

Nur relevant, wenn **Nameserver = Metanet** und Zone dort autoritativ ist. Aktuell: **NS = Cloudflare** → DNS in **Cloudflare** pflegen.

---

## Schritt 5 — Google OAuth (falls aktiv)

In der Google Cloud Console beim OAuth-Client ergänzen:

- **Authorized redirect URIs:** `https://wohnen.helvenda.ch/api/auth/callback/google`
- **Authorized JavaScript origins:** `https://wohnen.helvenda.ch`

---

## Schritt 6 — Repo / Middleware

Im Code ist **`wohnen.helvenda.ch`** bereits in [`src/middleware.ts`](../src/middleware.ts) als eigener Host (Wohnen-Tenant, Allowlist, Rewrite `/` → `/wohnen-home`). Optional in Vercel Production:

- `NEXT_PUBLIC_MAIN_SHOP_URL=https://www.helvenda.ch` (für Redirects auf den Marktplatz)

---

## Checkliste

- [ ] **`wohnen.helvenda.ch`** unter **Vercel → Settings → Domains** mit **Add Existing**  
- [ ] DNS-Ziel aus Vercel kopiert  
- [ ] In **Cloudflare** CNAME **`wohnen`** → Vercel-Ziel  
- [ ] Vercel-Status **Valid**  
- [ ] Browser: **`https://wohnen.helvenda.ch`** mit gültigem Zertifikat  
- [ ] Google OAuth für **`wohnen`** (falls genutzt)  
- [ ] Optional: Vercel-Hinweise bei `www` / Apex mit **Edit** bereinigen  

---

## Troubleshooting

- [Vercel: Domains troubleshooting](https://vercel.com/docs/domains/troubleshooting)  
- Propagation: [whatsmydns.net – CNAME wohnen](https://www.whatsmydns.net/#CNAME/wohnen.helvenda.ch)  

---

*Eingebettete Screenshots: `docs/images/` (Vercel-UI; gleicher Ablauf für Subdomain `wohnen`).*
