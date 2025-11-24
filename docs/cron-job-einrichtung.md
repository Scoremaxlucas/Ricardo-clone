# Cron-Job Einrichtung für Mahnprozess

## 📋 Übersicht

Der Mahnprozess muss täglich um 2:00 Uhr ausgeführt werden, um:
- Zahlungsaufforderungen zu senden (Tag 14)
- Erinnerungen zu senden (Tag 30, 44, 58)
- Mahnspesen hinzuzufügen (Tag 44)
- Konten zu sperren (Tag 58)

## 🔧 Einrichtung

### Option 1: Vercel Cron Jobs (Empfohlen für Vercel-Hosting)

Wenn Sie auf Vercel hosten, können Sie Vercel Cron Jobs verwenden:

1. **Erstellen Sie `vercel.json` im Root-Verzeichnis:**

```json
{
  "crons": [
    {
      "path": "/api/invoices/process-reminders",
      "schedule": "0 2 * * *"
    }
  ]
}
```

2. **Erstellen Sie die Cron-Route:**

Erstellen Sie `src/app/api/cron/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { processInvoiceReminders } from '@/lib/invoice-reminders'

export async function GET(request: NextRequest) {
  try {
    // Vercel Cron Jobs senden einen Authorization Header
    const authHeader = request.headers.get('authorization')
    
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json(
        { message: 'Nicht autorisiert' },
        { status: 401 }
      )
    }

    const result = await processInvoiceReminders()
    
    return NextResponse.json({
      success: true,
      processed: result.processed,
      total: result.total
    })
  } catch (error: any) {
    console.error('Error processing reminders:', error)
    return NextResponse.json(
      { message: 'Fehler: ' + error.message },
      { status: 500 }
    )
  }
}
```

3. **Environment Variable setzen:**

Fügen Sie zu Ihrer `.env` hinzu:
```env
CRON_SECRET=ihr-sicheres-secret-hier
```

4. **Deployen:**

Nach dem Deploy wird der Cron-Job automatisch täglich um 2:00 Uhr ausgeführt.

---

### Option 2: Externer Cron-Service (cron-job.org, EasyCron, etc.)

Für andere Hosting-Plattformen können Sie einen externen Cron-Service verwenden:

1. **Registrieren Sie sich bei einem Cron-Service:**
   - [cron-job.org](https://cron-job.org) (kostenlos)
   - [EasyCron](https://www.easycron.com) (kostenlos)
   - [Cronitor](https://cronitor.io) (kostenlos)

2. **Erstellen Sie einen neuen Cron-Job:**

   - **URL:** `https://ihre-domain.ch/api/invoices/process-reminders`
   - **Method:** `POST` oder `GET`
   - **Schedule:** `0 2 * * *` (täglich um 2:00 Uhr)
   - **Headers:**
     ```
     Authorization: Bearer IHR_CRON_SECRET
     Content-Type: application/json
     ```

3. **Environment Variable setzen:**

Fügen Sie zu Ihrer `.env` hinzu:
```env
CRON_SECRET=ihr-sicheres-secret-hier
```

---

### Option 3: Lokale Entwicklung (Node.js Script)

Für lokale Tests können Sie ein Node.js Script erstellen:

1. **Erstellen Sie `scripts/run-cron.ts`:**

```typescript
import { processInvoiceReminders } from '../src/lib/invoice-reminders'

async function main() {
  console.log('🚀 Starte Mahnprozess-Verarbeitung...')
  
  try {
    const result = await processInvoiceReminders()
    console.log(`✅ Verarbeitet: ${result.processed} von ${result.total} Rechnungen`)
    process.exit(0)
  } catch (error: any) {
    console.error('❌ Fehler:', error)
    process.exit(1)
  }
}

main()
```

2. **Fügen Sie zu `package.json` hinzu:**

```json
{
  "scripts": {
    "cron:reminders": "tsx scripts/run-cron.ts"
  }
}
```

3. **Manuell ausführen:**

```bash
npm run cron:reminders
```

4. **Mit System-Cron (Linux/Mac):**

Fügen Sie zu Ihrer crontab hinzu (`crontab -e`):

```
0 2 * * * cd /pfad/zum/projekt && npm run cron:reminders >> /pfad/zum/projekt/cron.log 2>&1
```

---

### Option 4: GitHub Actions (für automatische Tests)

Sie können auch GitHub Actions verwenden:

1. **Erstellen Sie `.github/workflows/cron.yml`:**

```yaml
name: Process Invoice Reminders

on:
  schedule:
    - cron: '0 2 * * *' # Täglich um 2:00 UTC
  workflow_dispatch: # Manuell auslösbar

jobs:
  process-reminders:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run cron job
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
          CRON_SECRET: ${{ secrets.CRON_SECRET }}
        run: npm run cron:reminders
```

---

## 🔐 Sicherheit

### CRON_SECRET generieren

Generieren Sie ein sicheres Secret:

```bash
# Mit Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Oder mit OpenSSL
openssl rand -hex 32
```

### Environment Variables

Stellen Sie sicher, dass `CRON_SECRET` in Ihrer `.env` gesetzt ist:

```env
CRON_SECRET=ihr-sicheres-secret-hier
```

**Wichtig:** Teilen Sie dieses Secret niemals öffentlich!

---

## 🧪 Testing

### Manuell testen

Sie können den Cron-Job manuell testen:

```bash
# Mit curl
curl -X POST https://ihre-domain.ch/api/invoices/process-reminders \
  -H "Authorization: Bearer IHR_CRON_SECRET" \
  -H "Content-Type: application/json"

# Oder mit GET
curl https://ihre-domain.ch/api/invoices/process-reminders \
  -H "Authorization: Bearer IHR_CRON_SECRET"
```

### Lokal testen

```bash
npm run cron:reminders
```

---

## 📊 Monitoring

### Logs prüfen

Die API-Route loggt alle Aktivitäten:

```
[invoices/process-reminders] Starte Mahnprozess-Verarbeitung...
[invoice-reminders] Gefunden: X offene Rechnungen
[invoice-reminders] ✅ Verarbeitet: X Rechnungen
```

### Erfolg prüfen

Nach der Ausführung sollten Sie sehen:
- E-Mails wurden gesendet
- Rechnungen wurden aktualisiert
- Konten wurden gesperrt (falls nötig)

---

## ⚠️ Troubleshooting

### Cron-Job läuft nicht

1. **Prüfen Sie die Logs:**
   - Server-Logs
   - Cron-Service-Logs
   - E-Mail-Logs

2. **Prüfen Sie die Authorization:**
   - Ist `CRON_SECRET` korrekt gesetzt?
   - Wird der Header korrekt gesendet?

3. **Prüfen Sie die URL:**
   - Ist die URL erreichbar?
   - Gibt es CORS-Probleme?

### Fehler bei der Verarbeitung

1. **Prüfen Sie die Datenbank:**
   - Sind Rechnungen vorhanden?
   - Sind die Daten korrekt?

2. **Prüfen Sie E-Mail-Konfiguration:**
   - Ist SMTP konfiguriert?
   - Werden E-Mails gesendet?

---

## 📅 Zeitplan

Der Cron-Job sollte täglich um 2:00 Uhr ausgeführt werden:

- **Cron-Expression:** `0 2 * * *`
- **Bedeutung:** Jeden Tag um 2:00 Uhr UTC

**Hinweis:** Passen Sie die Zeitzone an Ihre Anforderungen an.

---

## ✅ Checkliste

- [ ] Cron-Job eingerichtet (Vercel/externer Service)
- [ ] `CRON_SECRET` in `.env` gesetzt
- [ ] API-Route getestet
- [ ] Logs überprüft
- [ ] E-Mails werden gesendet
- [ ] Rechnungen werden aktualisiert

---

## 📚 Weitere Ressourcen

- [Vercel Cron Jobs](https://vercel.com/docs/cron-jobs)
- [cron-job.org Dokumentation](https://cron-job.org/en/help/)
- [Cron Expression Generator](https://crontab.guru/)





