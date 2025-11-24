# E-Mail-Konfiguration für Helvenda

Helvenda unterstützt zwei Methoden zum Versenden von E-Mails:

## 1. Resend (Empfohlen - Einfachste Methode)

Resend ist ein moderner E-Mail-Service, der sehr einfach zu konfigurieren ist.

### Setup:

1. **Resend Account erstellen:**
   - Gehen Sie zu [resend.com](https://resend.com)
   - Erstellen Sie ein kostenloses Konto
   - Gehen Sie zu "API Keys" und erstellen Sie einen neuen API Key

2. **Umgebungsvariablen setzen:**
   ```bash
   RESEND_API_KEY=re_xxxxxxxxxxxxx
   RESEND_FROM_EMAIL=noreply@ihre-domain.com
   ```

   **Wichtig:** Für `RESEND_FROM_EMAIL` müssen Sie zuerst eine Domain bei Resend verifizieren oder die Test-E-Mail-Adresse verwenden (`onboarding@resend.dev` für Tests).

3. **Fertig!** E-Mails werden jetzt automatisch versendet.

## 2. SMTP (Alternative)

Falls Sie einen eigenen SMTP-Server verwenden möchten:

### Setup:

1. **Umgebungsvariablen setzen:**
   ```bash
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=ihre-email@gmail.com
   SMTP_PASS=ihr-app-passwort
   SMTP_FROM=noreply@ihre-domain.com
   ```

2. **Für Gmail:**
   - Aktivieren Sie "Zwei-Faktor-Authentifizierung"
   - Erstellen Sie ein "App-Passwort" unter Google Account → Sicherheit → App-Passwörter
   - Verwenden Sie dieses App-Passwort als `SMTP_PASS`

## Priorität

Helvenda versucht E-Mails in folgender Reihenfolge zu versenden:

1. **Resend** (wenn `RESEND_API_KEY` gesetzt ist)
2. **SMTP** (wenn `SMTP_USER` und `SMTP_PASS` gesetzt sind)
3. **Fallback:** E-Mail wird geloggt, Link wird auf der Registrierungsseite angezeigt

## Testen

Nach der Konfiguration können Sie die E-Mail-Funktion testen:

1. Registrieren Sie einen neuen Benutzer
2. Überprüfen Sie Ihr E-Mail-Postfach
3. Klicken Sie auf den Bestätigungslink
4. Sie können sich jetzt einloggen

## Fehlerbehebung

### E-Mail wird nicht versendet:

1. **Prüfen Sie die Umgebungsvariablen:**
   ```bash
   echo $RESEND_API_KEY
   echo $SMTP_USER
   ```

2. **Prüfen Sie die Server-Logs:**
   - Suchen Sie nach `[register]` Logs
   - Prüfen Sie ob Fehler angezeigt werden

3. **Resend Domain-Verifizierung:**
   - Für Produktion müssen Sie eine Domain bei Resend verifizieren
   - Für Tests können Sie `onboarding@resend.dev` verwenden

### Bestätigungslink funktioniert nicht:

1. Prüfen Sie ob `NEXTAUTH_URL` oder `NEXT_PUBLIC_BASE_URL` korrekt gesetzt ist
2. Der Link sollte so aussehen: `http://localhost:3002/verify-email?token=...`
3. Prüfen Sie ob der Token in der Datenbank gespeichert wurde

## Kostenlose Limits

- **Resend:** 3.000 E-Mails/Monat kostenlos
- **Gmail SMTP:** 500 E-Mails/Tag kostenlos

## Produktion

Für Produktion empfehlen wir:
- Resend mit verifizierter Domain
- Oder professioneller SMTP-Service (z.B. SendGrid, Mailgun)





