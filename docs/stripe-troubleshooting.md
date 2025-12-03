# Stripe Payment Form - Fehlerbehebung

## Problem: "Lade Zahlungsformular..." bleibt hängen

### Schritt 1: Browser-Konsole prüfen

1. Öffnen Sie die Website: https://helvenda-marketplace.vercel.app
2. Öffnen Sie die Browser-Konsole:
   - **Chrome/Edge:** F12 oder Rechtsklick → "Untersuchen" → Tab "Console"
   - **Safari:** Cmd+Option+I → Tab "Console"
   - **Firefox:** F12 → Tab "Console"
3. Versuchen Sie, eine Rechnung zu bezahlen
4. Schauen Sie nach Fehlermeldungen in der Konsole

**Häufige Fehler:**
- `Failed to fetch` → API-Route antwortet nicht
- `500 Internal Server Error` → Server-Fehler
- `Stripe is not configured` → Keys fehlen
- `Invalid API Key` → Key ist ungültig

### Schritt 2: Test-Route prüfen

Öffnen Sie diese URL im Browser:
```
https://helvenda-marketplace.vercel.app/api/test-stripe
```

**Erwartetes Ergebnis (Erfolg):**
```json
{
  "success": true,
  "message": "Stripe ist korrekt konfiguriert und funktioniert!",
  "secretKeyPrefix": "sk_live_51...",
  "publishableKeyPrefix": "pk_live_51...",
  "isTestMode": false
}
```

**Mögliche Fehler:**
- `STRIPE_SECRET_KEY ist nicht konfiguriert` → Key fehlt in Vercel
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ist nicht konfiguriert` → Key fehlt in Vercel
- `Stripe API Key ist ungültig` → Key ist falsch oder abgelaufen

### Schritt 3: Vercel Environment Variables prüfen

1. Gehen Sie zu: https://vercel.com/dashboard
2. Wählen Sie Ihr Projekt
3. **Settings** → **Environment Variables**
4. Prüfen Sie:
   - ✅ `STRIPE_SECRET_KEY` vorhanden? (beginnt mit `sk_live_...` oder `sk_test_...`)
   - ✅ `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` vorhanden? (beginnt mit `pk_live_...` oder `pk_test_...`)
   - ✅ Keine Leerzeichen vor/nach den Keys?
   - ✅ Keys sind für alle Environments gesetzt (Production, Preview, Development)?

### Schritt 4: Neuen Secret Key erstellen (falls nötig)

**Wenn der Secret Key ungültig ist oder nicht funktioniert:**

1. Gehen Sie zu: https://dashboard.stripe.com/apikeys
2. Stellen Sie sicher, dass Sie im richtigen Modus sind:
   - **Live-Modus** für Production (wenn Sie Live-Keys verwenden)
   - **Test-Modus** für Entwicklung (wenn Sie Test-Keys verwenden)
3. Klicken Sie auf **"Create secret key"** oder **"Geheimschlüssel erstellen"**
4. Wählen Sie: **"Ihre eigene Integration aufbauen"** (Build your own integration)
5. Geben Sie einen Namen ein (z.B. "Helvenda Production")
6. Klicken Sie auf **"Create secret key"**
7. **WICHTIG:** Kopieren Sie den Key sofort (er wird nur einmal angezeigt!)
8. Der neue Key beginnt mit `sk_live_...` (Live) oder `sk_test_...` (Test)

### Schritt 5: Neuen Key in Vercel hinzufügen

1. Gehen Sie zu Vercel Dashboard → Settings → Environment Variables
2. Finden Sie `STRIPE_SECRET_KEY`
3. Klicken Sie auf **"Edit"** (Bearbeiten)
4. Ersetzen Sie den alten Key mit dem neuen Key
5. Klicken Sie auf **"Save"**
6. **WICHTIG:** Redeploy das Projekt!

### Schritt 6: Redeploy

1. Gehen Sie zu **Deployments** Tab
2. Klicken Sie auf die drei Punkte (⋯) neben dem neuesten Deployment
3. Wählen Sie **"Redeploy"**
4. Warten Sie 2-3 Minuten

### Schritt 7: Erneut testen

1. Öffnen Sie: https://helvenda-marketplace.vercel.app/api/test-stripe
2. Sollte jetzt `{"success": true}` zeigen
3. Versuchen Sie, eine Rechnung zu bezahlen
4. Das Zahlungsformular sollte jetzt laden

## Häufige Probleme und Lösungen

### Problem: "Stripe ist nicht konfiguriert"

**Lösung:**
- Prüfen Sie, ob beide Keys in Vercel vorhanden sind
- Stellen Sie sicher, dass `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` mit `NEXT_PUBLIC_` beginnt
- Redeploy nach dem Hinzufügen der Keys

### Problem: "Invalid API Key"

**Lösung:**
- Erstellen Sie einen neuen Secret Key in Stripe
- Ersetzen Sie den alten Key in Vercel
- Redeploy

### Problem: "Payment Intent creation failed"

**Lösung:**
- Prüfen Sie die Vercel Logs: Dashboard → Deployments → Logs
- Prüfen Sie, ob der Stripe Account aktiv ist
- Prüfen Sie, ob Sie genug Credits haben (für Live-Modus)

### Problem: Formular lädt, aber Zahlung schlägt fehl

**Lösung:**
- Prüfen Sie die Browser-Konsole für Fehler
- Prüfen Sie die Stripe Dashboard Logs: https://dashboard.stripe.com/logs
- Stellen Sie sicher, dass die Zahlungsmethode aktiviert ist (Kreditkarte, TWINT)

## Vercel Logs prüfen

1. Gehen Sie zu: https://vercel.com/dashboard
2. Wählen Sie Ihr Projekt
3. **Deployments** → Klicken Sie auf das neueste Deployment
4. Klicken Sie auf **"Logs"** Tab
5. Suchen Sie nach Fehlern mit "Stripe" oder "payment"

## Stripe Dashboard Logs prüfen

1. Gehen Sie zu: https://dashboard.stripe.com/logs
2. Schauen Sie nach fehlgeschlagenen API-Calls
3. Klicken Sie auf einen Fehler, um Details zu sehen

## Support

Wenn nichts funktioniert:
1. Prüfen Sie die Browser-Konsole (F12)
2. Prüfen Sie die Vercel Logs
3. Prüfen Sie die Stripe Dashboard Logs
4. Kontaktieren Sie den Support mit den Fehlermeldungen

