# Helvenda Wohnungen — GTM & Plattform-Ausrichtung (Execution)

Dieses Dokument verbindet **Marktstrategie** (kostenloser Qualitätsnachweis → Markenbekanntheit → Listings → Matching → später bezahlte Leads) mit **konkreten Plattform-Lieferungen**. Stand: fortlaufend gepflegt im Repo.

## 1. Strategische Kernaussagen

| Hebel | Zweck |
|--------|--------|
| **Helvenda Qualitätsnachweis** | Portabler Vertrauensbeweis (PDF + `/verify/…`) — **auch ausserhalb** Helvenda in Bewerbungen. |
| **Ein Profil** | Daten einmal, Bewerbungen oft (Helvenda + externe Kanäle). |
| **Listings + Matching** | Liquidität und Relevanz — Leads haben nur Wert mit **Nachfrage + Qualität**. |
| **Später: bezahlte Leads** | Nur nachweisbare **Zeitersparnis / Konversion** für Vermieter — nicht „Algorithmus“ als Buzzword. |

## 2. Produkt-Prinzipien (nicht verhandelbar)

1. **Jede öffentliche Fläche** erklärt in einem Satz: *was der Nachweis belegt / was nicht*.  
2. **Verifikation** muss für Dritte in **unter einer Minute** verständlich sein (Link, Status, Ablauf).  
3. **Tenant** sieht immer den nächsten Schritt zur **Ausstellung** und zur **externen Nutzung**.  
4. **Landlord** sieht Wertversprechen: weniger Rückfragen, vorgeprüfte Basis — kein Ersatz für Mietvertrag oder Bonitätspremium der Bank.

## 3. Umsetzung im Code (Referenz)

| Bereich | Dateien / Routen |
|---------|------------------|
| Ausstellung | `src/app/zertifikat/ZertifikatClient.tsx`, `src/app/api/certificate/issue/route.ts` |
| Öffentliche Prüfung | `src/app/verify/[code]/VerifyPageClient.tsx`, `src/app/api/certificate/verify/[code]/route.ts` |
| Profil-Dashboard | `src/app/profil/CertificateProfilSection.tsx` |
| Marketing-Start | `src/components/wohnen/WohnenMarketingHome.tsx`, `src/components/wohnen/WohnenHomeHowItWorks.tsx` |
| Onboarding / Shell | `src/app/profil/erstellen/OnboardingFlow.tsx`, `src/components/wohnen/WohnenLayoutShell.tsx`, `src/lib/wohnen-profil-flow-paths.ts` |

## 4. Backlog (priorisiert, bis Lead-Monetarisierung)

### P0 — Vertrauen & Klarheit

- [x] **Landlord one-pager** (Hilfe-Center): [`/help/wohnungen-qualitaetsnachweis-pruefen`](/help/wohnungen-qualitaetsnachweis-pruefen) — Checkliste für Vermieter (DE/EN/FR/IT in Übersetzungen).  
- [x] **Analytics**: API `GET /api/certificate/verify/…` schreibt `analytics_events` mit `name: certificate_verify` und `metadata.outcome` (`VALID`, `EXPIRED`, `REVOKED`, `NOT_FOUND`, `SUPERSEDED`, `INVALID_CODE`), Bots per UA gefiltert.  
- [x] **Erneuerung**: Cron **ca. 14 Tage** und **3 Tage** vor Ablauf — Betreibungsregister (`/api/cron/credit-check-expiry`) und Qualitätsnachweis (`/api/cron/certificate-expiry-reminders`, Vercel 08:15 UTC). Nach neuem Upload setzen die APIs die Reminder-Felder zurück.

### P1 — Liquidität

- [ ] Inserate-Qualität (Pflichtfelder, Fotos, Verfügbarkeit) im Vermieter-Flow.  
- [ ] Leere Zustände geografisch / thematisch erklären (Wedge-Strategie im Marketing, nicht nur „0 Treffer“).

### P2 — Matching als Produkt

- [ ] Landlord: „Warum dieser Match?“ + fehlende Felder beim Mieter.  
- [ ] Mieter: Wiederverwendung der Bewerbungsmappe pro Inserat mit Diff („diese Wohnung verlangt Zusatz X“).

### P3 — Monetarisierung Leads

- [ ] Definition Lead (Kontakt-Freigabe, Dossier, Besichtigung).  
- [ ] Billing / Entitlements + transparente Mieter-Kommunikation.  
- [ ] Juristische / marktrechtliche Klärung (externe Beratung).

## 5. Erfolgsmetriken (Vorschlag)

- Ausstellungen / aktive Zertifikate / Verhältnis **Verify-Page-Views : Ausstellungen**.  
- Aktive Listings, Bewerbungen / Listing, Zeit bis erste qualifizierte Antwort (Landlord).  
- Wiederkehrende Mieter-Sessions nach erstem Zertifikat.

---

*Dieses Dokument ist die Single Source of Truth für die Richtung „Wohnen GTM“; technische Details liegen in den verlinkten Modulen.*
