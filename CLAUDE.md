# Projektkontext für Claude Code

## Was dieses Repo ist

Ein Next.js-14-Monorepo (App Router) mit drei Produkten unter einem Vercel-Deployment und gemeinsamem NextAuth:

- **SwissImmoCert (SIC)** unter `src/app/sic`, `src/app/api/sic`, `src/components/sic`: Mietenden-Zertifikat, Komplettpaket CHF 79.– einmalig (alle 4 Angaben: Bonität, Arbeit & Einkommen, Zuverlässigkeit, Aufenthaltsstatus; Modulpreis 0, siehe `src/lib/sic/modules.ts`), Verlängerung CHF 30.–, Paar-Zertifikat ohne Aufpreis. Gültigkeit 3 Monate ab Datum des Betreibungsauszugs. Prüfung nur anhand eingereichter Dokumente. **Das ist der aktuelle Fokus.**
- **Wohnen Helvenda** (wohnen.helvenda.ch): Mietwohnungen, Qualitätsnachweis HLV. **Pausiert.** Kontext in `.cursor/rules/wohnen-helvenda-context.mdc`, gilt weiterhin, wenn daran gearbeitet wird.
- **Helvenda Marktplatz** (helvenda.ch): C2C-Marktplatz. **Pausiert.**

Der Ordnername `ricardo-clone` ist historisch; der Inhalt ist Helvenda/SIC.

## Arbeitsweise

- Konsequent auf Deutsch (Code-Kommentare, Commit-Messages, UI-Texte). Commit-Messages im bestehenden Stil: `sic: kurze Beschreibung` (siehe `git log`).
- Nach einer inhaltlich fertigen Aufgabe (Implementierung, Fix, Copy): committen und direkt `git push` (Branch `main`, Remote `origin`), ohne nachzufragen. Nicht pushen nur, wenn ein Force-Push nötig wäre oder der User es untersagt.
- Keine Emojis in UI-Komponenten. Design: premium, schweizerisch, zurückhaltend. Akzentfarbe Teal `#18a87c`, sparsam.
- Keine neuen Markdown-Dateien im Repo-Root anlegen (es liegen dort bereits viele alte Fix-Notizen). Dokumentation nach `docs/`.
- Homegate und ImmoScout nie als Import- oder Scraping-Quelle verwenden.

## Stack

Next.js 14 (App Router), TypeScript, Tailwind, Prisma 6 + PostgreSQL (Neon), NextAuth v4, Vercel, Anthropic SDK (Dokumenten-Parsing), Stripe (Checkout, bis Payrexx aktiv) und Payrexx (TWINT), `@react-pdf/renderer` (Zertifikat-PDF), Vitest.

## Befehle

- Dev-Server: `npm run dev` (Port 3002)
- Tests: `npm test` (Vitest), einzelne Datei: `npx vitest run <pfad>`
- Lint: `npm run lint`, Format: `npm run format`
- Build wie auf Vercel: `npm run build`
- Vor Deploy: `npm run pre-deploy-check`

## SIC: wo was liegt

- Landing und öffentliche Seiten: `src/app/sic/page.tsx`, `agb`, `datenschutz`, `faq`, `impressum`
- Flow: `anmelden` → `email-bestaetigen` → `dossier` → `checkout` → `zertifikat`, `verlaengern`, `verify`
- API: `src/app/api/sic/*` (auth, magic-link, documents, quote, checkout, payrexx, certificate, email, reference, templates, admin)
- Admin: `src/app/sic/admin`, Komponenten `SicAdminReview*`, `SicAdminFunnel`
- Tests liegen neben den Komponenten (`*.test.tsx`)

## Nicht anfassen ohne Rückfrage

- `prisma/schema.prisma` und Migrationen (Produktions-DB)
- Zahlungslogik (`api/sic/checkout`, `api/sic/payrexx`, Stripe-Setup)
- `.env*`, Keys, `setup-stripe-keys.sh`
