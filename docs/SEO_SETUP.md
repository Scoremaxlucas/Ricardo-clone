# SEO-Setup: Google Search Console & Produktion

Kurze Schritte, damit Helvenda in Google und bei relevanten Suchen sichtbar wird.

---

## 1. Google Search Console (einmalig)

1. **Öffnen:** [Google Search Console](https://search.google.com/search-console)
2. **Property hinzufügen**
   - „Property-Typ“: **Domain** (empfohlen) oder **URL-Präfix**
   - Domain: `helvenda.ch`  
     Oder URL-Präfix: `https://www.helvenda.ch` bzw. `https://helvenda.ch` (je nachdem, was du nutzt).
3. **Verifizierung (Domain)**
   - Bei Domain: DNS-TXT-Record anlegen (Anleitung in der Search Console).
   - Bei URL-Präfix: z.B. HTML-Datei hochladen oder Meta-Tag in der Startseite (Next.js kann das über Metadata).
4. **Sitemap einreichen**
   - Links: **Sitemaps** → „Neue Sitemap hinzufügen“
   - URL: `https://helvenda.ch/sitemap.xml`  
     (oder `https://www.helvenda.ch/sitemap.xml`, passend zu deiner gewählten Domain)
   - Speichern. Google crawlt die Sitemap in den nächsten Tagen.

Damit ist die Search Console für Helvenda eingerichtet.

---

## 2. Produktions-URL (Vercel)

Damit Sitemap, OG-Bilder und Links überall auf `helvenda.ch` zeigen:

1. **Vercel:** Projekt → **Settings** → **Environment Variables**
2. Für **Production** (und ggf. Preview, wenn du willst):
   - Name: `NEXT_PUBLIC_APP_URL`
   - Wert: `https://helvenda.ch`  
     (oder `https://www.helvenda.ch`, wenn du nur mit www erreichst)
3. **Speichern** und **Redeploy** (z.B. neues Deployment auslösen), damit die Variable überall greift.

Ohne diese Variable nutzt der Code den Fallback `https://helvenda.ch` aus `src/lib/seo.ts` – mit gesetzter Variable ist die Basis-URL eindeutig.

---

## 3. Logo für JSON-LD (optional)

Für das Organization-Schema (bessere Darstellung in Suchergebnissen):

- **Datei:** `public/images/logo-og.png`
- **Format:** PNG, z.B. 512×512 px
- **Inhalt:** Helvenda-Logo (z.B. „H“ oder Wortmarke), gut lesbar auf hellem Hintergrund

Falls die Datei fehlt, bleibt das Schema gültig; nur der `logo`-Eintrag wird nicht genutzt.

---

## 4. Kurz-Checkliste

- [ ] Search-Console-Property für `helvenda.ch` (oder www) angelegt und verifiziert
- [ ] Sitemap `https://helvenda.ch/sitemap.xml` in der Search Console eingetragen
- [ ] `NEXT_PUBLIC_APP_URL=https://helvenda.ch` in Vercel (Production) gesetzt und Redeploy gemacht
- [ ] Optional: `public/images/logo-og.png` angelegt

Nach dem Redeploy und nach dem ersten Crawl (oft innerhalb von 1–2 Tagen) nutzt Google Sitemap und Metadaten für die Indizierung.
