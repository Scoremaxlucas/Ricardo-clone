# Wohnen Helvenda — Implementierungsreport (12.06.2026)

Dieser Report beschreibt, was in dieser Session umgesetzt wurde — gezielt für den **Cold-Start mit Vermieter-Akquise** und die **Monetarisierungs-Vorbereitung**, ohne sich an der geringen Listing-Anzahl zu orientieren.

---

## 1. Magic-Link für externe Vermieter (kritisch für Akquise)

**Problem:** Schema-Felder `landlordLeadToken` existierten, wurden aber nie gesetzt oder genutzt. Externe Vermieter ohne Helvenda-Konto konnten Bewerbungen nur per E-Mail-Kontaktdaten bearbeiten.

**Umsetzung:**

| Teil | Pfad |
|------|------|
| Token-Generierung (90 Tage TTL) | `src/lib/rental/landlord-lead-token.ts` |
| Token bei Lead-Mail erzeugen | `src/lib/rental/sendLandlordLeadNotification.ts` |
| E-Mail mit «Bewerbung verwalten»-Link | `src/lib/rental/emailTemplates.ts`, `emails.ts` |
| Öffentliche Seite | `/vermieter/bewerbung/[token]` |
| Öffentliche API (GET + PATCH) | `/api/public/landlord-lead/[token]` |
| UI für Vermieter | `src/components/rental/LandlordLeadClient.tsx` |

**Aktionen über Magic-Link:** Besichtigung anfragen, direkt kontaktieren, ablehnen — dieselbe Logik wie im eingeloggten Vermieter-UI (`applyLandlordApplicationDecision`).

**Middleware:** `/vermieter/*` und `/api/public/landlord-lead/*` auf der Wohnen-Subdomain freigegeben.

---

## 2. Vermittlung & Abrechnung (MVP, manuell)

**Problem:** Erfolgsprovision (33 %, min CHF 290, cap CHF 990) und CHF 250 Einzugsbonus existierten nur in AGB/Marketing — keine Datenbank, kein Admin-Workflow.

**Umsetzung:**

- Neues Prisma-Modell `WohnenRentalPlacement` (+ Migration)
- Berechnung in `src/lib/wohnen/placement.ts` (inkl. 8.1 % MwSt auf Provision)
- Admin-UI: **`/admin/wohnen/placements`**
- APIs: `GET/POST /api/admin/wohnen/placements`, `PATCH …/[id]`

**Workflow:** Nach Einzug Bewerbungs-ID aus Lead-Dossier eintragen → Provision und Bonus werden berechnet → Status manuell pflegen (`pending` → `invoiced` → `paid` / Bonus `eligible` → `paid`).

**Noch offen (bewusst):** Stripe-Rechnungen, Bexio-Sync, automatische Auszahlung — das ist die nächste Stufe nach den ersten echten Deals.

---

## 3. Mieter: Einzugsbonus-IBAN & Such-Alerts

**Umsetzung:**

- Felder `bonusPayoutIban`, `listingMatchAlertsEnabled` am `TenantProfile`
- API: `GET/PATCH /api/tenant-profile/bonus-settings`
- UI auf `/profil`: `ProfilBonusSettings` (IBAN + Opt-in für Match-Mails)

**Such-Alerts (Cron):**

- Täglich 08:00 UTC: `/api/cron/wohnen-listing-match-alerts` (in `vercel.json`)
- Logik: `src/lib/wohnen/listing-match-alerts.ts`
- Neue aktive Inserate (26h) → passende Profile mit Zertifikat → E-Mail → Dedupe via `WohnenListingMatchAlert`

---

## 4. Bewerbungsflow — Quick Wins

| Thema | Änderung |
|-------|----------|
| **Persönliche Nachricht** | Optionales Textfeld (max 500 Zeichen) in `WohnungBewerbungsBox` und `BewerbenClient` — API unterstützte `message` bereits |
| **Direkt kontaktieren** | Button + Modal in `LandlordListingApplicationsClient`; PATCH-Route unterstützt `contact_directly` |
| **Meine Bewerbungen** | Status: Besichtigungstermin, «Vermieter hat geantwortet», Ablehnung |
| **Import-Hub** | URL-Import für Vermieter erstellt jetzt **`RentalListing`** statt parallelem `MatchingProperty`-Wizard |
| **Legacy-Route** | `/wohnungen/anfragen/[id]` → Redirect auf `/meine-bewerbungen` |

---

## 5. Was bewusst **nicht** umgesetzt wurde

Diese Punkte brauchen entweder mehr Listings, Payment-Integration oder eigenes Produkt-Design:

- **Stripe / automatische Rechnungsstellung** an Vermieter
- **Automatische CHF-250-Auszahlung** (nur Erfassung + Admin-Status)
- **In-App-Chat** zwischen Mieter und Vermieter (weiterhin E-Mail)
- **Vollständige MatchingProperty-Ablösung** (paralleler Stack bleibt für Admin/Ops)
- **Homegate/ImmoScout-Import** (weiterhin ausgeschlossen)

---

## 6. Vor dem Go-Live der Akquise prüfen

1. **`WOHNEN_LEAD_EMAIL_OVERRIDE`** in Vercel **entfernen** — sonst gehen alle Vermieter-Mails an die Test-Adresse (Hinweis bereits auf `/admin/applications`).
2. **Migration deployen:** `20260612120000_wohnen_placements_match_alerts`
3. **Test-Flow:** Bewerbung auf Admin-Inserat → Vermieter-Mail → Magic-Link öffnen → Besichtigung anfragen → Mieter sieht Update unter «Meine Bewerbungen».
4. Sales-PDFs: Kontaktfelder (Name/Telefon/WhatsApp) in `docs/sales/` ausfüllen.

---

## 7. Datei-Übersicht (neu/geändert)

**Neu:**  
`landlord-lead-token.ts` (erweitert), `landlord-lead-application-view.ts`, `LandlordLeadClient.tsx`, `placement.ts`, `listing-match-alerts.ts`, Admin Placements, Cron-Route, Bonus-Settings API, `ProfilBonusSettings.tsx`, Report (diese Datei).

**Geändert:**  
Schema, Middleware, Lead-Mail, E-Mail-Templates, Bewerbungs-UI, Import-Hub, Vermieter-Bewerbungsliste, `vercel.json`.

---

*Stand: Implementierung für Cold-Start-Akquise — Plattform ist damit deutlich näher an «Vermieter kann ohne Konto reagieren» und «Helvenda kann Deals abrechnen», ohne auf Listing-Volumen angewiesen zu sein.*
