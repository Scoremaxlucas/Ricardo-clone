# 🔑 Stripe API Keys abrufen - Schritt für Schritt

## Schritt 1: Stripe Dashboard öffnen

1. Gehen Sie zu: **https://dashboard.stripe.com**
2. Loggen Sie sich mit Ihrem Score-Max Account ein

---

## Schritt 2: Zu den API Keys navigieren

1. Im Stripe Dashboard sehen Sie links ein Menü
2. Klicken Sie auf **"Developers"** (Entwickler)
3. Klicken Sie auf **"API keys"** (API-Schlüssel)

**Alternativ:** Direkter Link: https://dashboard.stripe.com/apikeys

---

## Schritt 3: Test-Modus aktivieren (für Entwicklung)

1. Oben rechts sehen Sie einen Toggle-Schalter: **"Test mode"**
2. Stellen Sie sicher, dass **"Test mode"** aktiviert ist (Toggle sollte blau/grün sein)
3. **Wichtig:** Im Test-Modus werden keine echten Zahlungen durchgeführt!

---

## Schritt 4: Publishable Key kopieren

1. Sie sehen zwei Keys:
   - **Publishable key** (öffentlicher Schlüssel) - beginnt mit `pk_test_...`
   - **Secret key** (geheimer Schlüssel) - beginnt mit `sk_test_...`

2. **Publishable key kopieren:**
   - Klicken Sie auf das **Kopier-Symbol** (📋) neben dem Publishable key
   - Oder markieren Sie den gesamten Key und kopieren Sie ihn (Cmd+C / Ctrl+C)
   - Der Key beginnt mit `pk_test_...` und ist etwa 100 Zeichen lang

**Beispiel:**
```
pk_test_YOUR_PUBLISHABLE_KEY_HERE
```

---

## Schritt 5: Secret Key anzeigen und kopieren

1. Der Secret Key ist standardmäßig **versteckt** (zeigt nur `••••••••`)

2. **Secret Key anzeigen:**
   - Klicken Sie auf **"Reveal test key"** (Test-Schlüssel anzeigen)
   - Der vollständige Key wird jetzt angezeigt
   - Der Key beginnt mit `sk_test_...` und ist etwa 100 Zeichen lang

3. **Secret Key kopieren:**
   - Klicken Sie auf das **Kopier-Symbol** (📋) neben dem Secret key
   - Oder markieren Sie den gesamten Key und kopieren Sie ihn (Cmd+C / Ctrl+C)

**Beispiel:**
```
sk_test_YOUR_SECRET_KEY_HERE
```

⚠️ **WICHTIG:** 
- Der Secret Key ist **geheim** - teilen Sie ihn **NIEMALS** öffentlich!
- Speichern Sie ihn nur in der `.env` Datei (die nicht ins Git hochgeladen wird)
- Falls der Key kompromittiert wird, können Sie ihn in Stripe sofort widerrufen

---

## Schritt 6: Keys in .env Datei speichern

1. Öffnen Sie die `.env` Datei im Projekt-Verzeichnis:
   ```bash
   # Im Terminal:
   nano .env
   # oder
   code .env
   ```

2. Fügen Sie am Ende der Datei hinzu:
   ```env
   # Stripe Configuration (für TWINT)
   STRIPE_SECRET_KEY=sk_test_IHR_SECRET_KEY_HIER_EINFÜGEN
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_IHR_PUBLISHABLE_KEY_HIER_EINFÜGEN
   ```

3. **Ersetzen Sie:**
   - `sk_test_IHR_SECRET_KEY_HIER_EINFÜGEN` mit Ihrem kopierten **Secret Key**
   - `pk_test_IHR_PUBLISHABLE_KEY_HIER_EINFÜGEN` mit Ihrem kopierten **Publishable Key**

4. **Speichern Sie die Datei:**
   - In nano: `Ctrl+X`, dann `Y`, dann `Enter`
   - In VS Code: `Cmd+S` / `Ctrl+S`

**Beispiel einer korrekten .env Datei:**
```env
# Andere Konfigurationen...
DATABASE_URL="file:./dev.db"
NEXTAUTH_URL="http://localhost:3002"
NEXTAUTH_SECRET="..."

# Stripe Configuration (für TWINT)
STRIPE_SECRET_KEY=sk_test_YOUR_SECRET_KEY_HERE
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_PUBLISHABLE_KEY_HERE
```

---

## Schritt 7: Prüfen ob Keys korrekt gesetzt sind

1. Im Terminal prüfen:
   ```bash
   cat .env | grep STRIPE
   ```

2. Sie sollten beide Keys sehen:
   ```
   STRIPE_SECRET_KEY=sk_test_...
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
   ```

3. **Wichtig:** Stellen Sie sicher, dass:
   - Keine Leerzeichen vor/nach dem `=` Zeichen
   - Keine Anführungszeichen um die Keys (außer sie sind bereits in der .env)
   - Keys vollständig kopiert wurden (keine abgeschnittenen Zeichen)

---

## Schritt 8: Server neu starten

Nach dem Hinzufügen der Keys müssen Sie den Server neu starten:

```bash
# Stoppen Sie den aktuellen Server (falls läuft): Ctrl+C
# Dann starten Sie ihn neu:
npm run dev
```

---

## Schritt 9: Testen

1. Gehen Sie zu einer Rechnung: `http://localhost:3002/my-watches/selling/fees`
2. Klicken Sie auf **"Zahlen"** bei einer Rechnung
3. Wählen Sie **"TWINT"** als Zahlungsmethode
4. Sie sollten jetzt das TWINT-Zahlungsformular sehen ✅

---

## Troubleshooting

### Problem: "Stripe ist nicht konfiguriert"

**Lösung:**
1. Prüfen Sie die `.env` Datei:
   ```bash
   cat .env | grep STRIPE
   ```
2. Stellen Sie sicher, dass beide Keys vorhanden sind
3. Prüfen Sie, ob der Server neu gestartet wurde
4. Prüfen Sie die Browser-Konsole auf Fehler

### Problem: Keys werden nicht erkannt

**Lösung:**
1. Prüfen Sie, ob die Keys korrekt kopiert wurden (keine Leerzeichen)
2. Stellen Sie sicher, dass die `.env` Datei im Projekt-Root liegt
3. Prüfen Sie, ob die `.env` Datei nicht in `.gitignore` ist (sollte sie sein!)

### Problem: "Invalid API Key"

**Lösung:**
1. Prüfen Sie, ob Sie die richtigen Keys kopiert haben (Test vs. Live)
2. Stellen Sie sicher, dass Sie im Test-Modus sind (für Entwicklung)
3. Kopieren Sie die Keys erneut aus dem Stripe Dashboard

---

## Wichtige Hinweise

- ✅ **Test-Modus:** Verwenden Sie `pk_test_...` und `sk_test_...` für Entwicklung
- ✅ **Live-Modus:** Verwenden Sie `pk_live_...` und `sk_live_...` nur für Produktion
- ✅ **Sicherheit:** Teilen Sie den Secret Key **NIEMALS** öffentlich
- ✅ **Backup:** Speichern Sie die Keys sicher (z.B. in einem Passwort-Manager)

---

## Nächste Schritte

Nachdem die Keys gesetzt sind:
1. ✅ Server neu starten
2. ✅ TWINT-Zahlung testen
3. ✅ Webhook konfigurieren (optional, für automatische Bestätigung)

**Fertig!** 🎉 Ihre Stripe-Keys sind jetzt konfiguriert!

