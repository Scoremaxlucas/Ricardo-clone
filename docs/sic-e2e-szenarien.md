# Swiss Immo Cert — Szenario-Tests (End-to-End)

`e2e/sic/scenarios.spec.ts` spielt die Plattform von Kauf bis Widerruf durch — mit echtem Stripe-Checkout
(Testmodus, Karte 4242), echten Uploads, Prüfer-Freigaben, PDF, Prüfseite, Cron-Läufen und Webhooks.
34 Szenarien, je auf Desktop und Handy.

## Was abgedeckt ist

1. **Einzelperson:** Kauf über das Formular der Website → Stripe → Dossier; kein PDF vor der ersten Freigabe;
   falsche Datei abgelehnt; Verlustscheine, offene Betreibungen und zu alter Auszug blockiert;
   gültiges Zertifikat ohne Siegel; abgelaufener Ausweis blockiert, gültiger gibt das Siegel;
   «Selbständig» als ANGABE, Upload danach gesperrt; befristete Stelle nur mit Enddatum;
   Referenz abgelehnt (Mail mit Grund), nachgereicht, mit «Stand Referenz» freigegeben; neuer Prüf-Code;
   fremder Zugriff gesperrt; Abmelden und Anmeldelink; Ausweis kürzt das Zertifikat (Erinnerung);
   Ablauf wegen Ausweis und kostenloser neuer Ausweis; frühe Verlängerung (CHF 30) mit mitgetragenen Werten.
2. **Paar:** Kauf für zwei; erst zwei Auszüge gehen in Prüfung; Verlustscheine bei Person 2 blockieren;
   Gültigkeit am älteren Auszug; volle Erstattung im Stripe-Dashboard widerruft per Webhook; Neuanfang.
3. **Zahlung und Erinnerung:** Upload-Erinnerung mit Bestell-Link, einmal pro Zertifikat; Abbruch legt nichts an;
   zwei gleichzeitig bezahlte Verlängerungen → eine gilt, die zweite wird erstattet; gefälschte Webhook-Signatur
   abgelehnt; echtes Event idempotent; Anmeldelink nur einmal verwendbar.
4. **Kleine offene Betreibung:** ohne Zustimmung gesperrt; Zustimmung im Dossier löst erneute Prüfung aus;
   über der Grenze gesperrt; gedruckt nur als Stufe; Zurückziehen nimmt den Auszug vom Zertifikat.
5. **Darstellung:** Paar mit langen Namen und langen Amtsbezeichnungen — Dossier (jede Angabe geöffnet, frisch
   gekauft und gemischter Stand mit langem Ablehnungsgrund), Prüfseite, Verlängern, Landing für Angemeldete und
   Prüfer-Übersicht bei 320, 390, 768 und 1280 px: nichts ragt über den Rand, kein Skriptfehler.
   Formulare für Arbeitgeber und Vermieter lassen sich als PDF erzeugen.

Nicht abgedeckt: TWINT über Payrexx (braucht ein Payrexx-Testkonto).

## Umgebung — nie gegen Produktion

Die Tests brechen ab, wenn eine Bedingung fehlt (`assertSafeEnvironment`) und prüfen vor dem ersten
Schritt, dass der Server wirklich die Testdatenbank liest.

- **Datenbank:** Neon-Branch `e2e-test` (nur Struktur, keine Kundendaten) im Projekt `neon-lime-island`.
  Verbindungsadresse: `npx neonctl connection-string e2e-test --project-id fragrant-heart-73625955 --pooled`.
- **Server und Tests** bekommen dieselben Variablen. In der Datei **jeden Wert in einfache Anführungszeichen**
  setzen — die Datenbankadresse enthält `&`, ohne Anführungszeichen schneidet die Shell sie ab und Next.js
  fällt still auf `.env.production.local` (Produktion) zurück.

```
DATABASE_URL='<Branch e2e-test>'
STRIPE_SECRET_KEY='sk_test_…'
STRIPE_WEBHOOK_SECRET='whsec_<beliebig, lokal>'
EMAIL_SINK_DIR='<Ordner für Test-Mails>'
SIC_BLOB_LOCAL_DIR='<Ordner für Test-Dateien>'
NEXTAUTH_SECRET='<beliebig>'  SIC_SESSION_SECRET='<beliebig>'  CRON_SECRET='<beliebig>'
SIC_ADMIN_EMAILS='pruefer@e2e.test'  SIC_DOC_ENCRYPTION_KEY='<64 Hex-Zeichen>'
NEXTAUTH_URL='http://localhost:3100'  NEXT_PUBLIC_SIC_URL='http://localhost:3100'
RESEND_API_KEY=''  SMTP_USER=''  BLOB_READ_WRITE_TOKEN=''  SIC_BLOB_READ_WRITE_TOKEN=''
ANTHROPIC_API_KEY=''  PAYREXX_CHECKOUT='0'  SENTRY_DSN=''
```

Leere Werte sind Absicht: Next.js überschreibt gesetzte Variablen nicht mit Werten aus `.env*`.

## Starten

```bash
set -a; source /pfad/zur/test.env; set +a
npx next build && npx next start -p 3100
```

```bash
set -a; source /pfad/zur/test.env; set +a
E2E_SCENARIOS=1 E2E_BASE_URL=http://localhost:3100 npx playwright test e2e/sic/scenarios.spec.ts --workers=1
```

`EMAIL_SINK_DIR` und `SIC_BLOB_LOCAL_DIR` wirken nur lokal — auf Vercel (`VERCEL=1`) nie.

## Automatisch auf GitHub

`.github/workflows/sic-e2e.yml` läuft bei jedem Push auf `main` (und von Hand unter «Actions»).
Er braucht zwei Repository-Secrets; fehlen sie, wird er still übersprungen:

- `E2E_DATABASE_URL` — Verbindungsadresse des Branches `e2e-test` (pooled)
- `E2E_STRIPE_SECRET_KEY` — Stripe-Schlüssel aus dem **Testmodus** (`sk_test_…`)

Setzen unter GitHub → Repository → Settings → Secrets and variables → Actions → «New repository secret»,
oder im Terminal:

```bash
npx neonctl connection-string e2e-test --project-id fragrant-heart-73625955 --pooled | gh secret set E2E_DATABASE_URL
```

```bash
gh secret set E2E_STRIPE_SECRET_KEY
```

Der Workflow prüft vor dem Start, dass die Adresse zum Testbranch gehört und Stripe im Testmodus ist.
