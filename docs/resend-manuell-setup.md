# Resend manuell einrichten (ohne Script)

Falls das Setup-Script nicht funktioniert, können Sie Resend auch manuell einrichten.

## Schritt 1: Resend Account erstellen

1. Gehen Sie zu: **https://resend.com**
2. Klicken Sie auf **"Sign Up"**
3. Registrieren Sie sich mit Ihrer E-Mail (z.B. `gamerlucas.67@outlook.com`)
4. Bestätigen Sie Ihre E-Mail-Adresse (Resend sendet eine Bestätigungs-E-Mail)

## Schritt 2: API Key erstellen

1. Loggen Sie sich bei Resend ein: **https://resend.com/login**
2. Gehen Sie zu **"API Keys"** (im Menü links)
3. Klicken Sie auf **"Create API Key"**
4. Geben Sie einen Namen ein (z.B. `Helvenda Production`)
5. Wählen Sie **"Full Access"** oder **"Sending Access"**
6. Klicken Sie auf **"Add"**
7. **WICHTIG:** Kopieren Sie den API Key sofort (er beginnt mit `re_` und wird nur einmal angezeigt!)

## Schritt 3: .env Datei bearbeiten

Öffnen Sie die `.env` Datei in Ihrem Projekt und fügen Sie folgende Zeilen hinzu:

```bash
# Resend E-Mail-Konfiguration
RESEND_API_KEY=re_xxxxxxxxxxxxx
RESEND_FROM_EMAIL=onboarding@resend.dev
```

**Beispiel:**
```bash
# Resend E-Mail-Konfiguration
RESEND_API_KEY=re_abc123def456ghi789jkl012mno345pqr678stu901vwx234yz
RESEND_FROM_EMAIL=onboarding@resend.dev
```

**Wichtig:**
- Ersetzen Sie `re_xxxxxxxxxxxxx` mit Ihrem echten API Key
- Für Tests können Sie `onboarding@resend.dev` verwenden
- Für Produktion müssen Sie eine Domain verifizieren

## Schritt 4: Server neu starten

```bash
npm run dev
```

## Schritt 5: Testen

1. Registrieren Sie einen neuen Test-User
2. Überprüfen Sie Ihr E-Mail-Postfach
3. Sie sollten eine Verifizierungs-E-Mail erhalten

## Troubleshooting

### Problem: E-Mail kommt nicht an
- Überprüfen Sie den Spam-Ordner
- Stellen Sie sicher, dass `RESEND_API_KEY` korrekt ist
- Stellen Sie sicher, dass `RESEND_FROM_EMAIL` korrekt ist

### Problem: "Invalid API Key"
- Überprüfen Sie, ob der API Key mit `re_` beginnt
- Stellen Sie sicher, dass keine Leerzeichen im API Key sind
- Erstellen Sie einen neuen API Key bei Resend

### Problem: "Domain not verified"
- Für Tests verwenden Sie `onboarding@resend.dev`
- Für Produktion müssen Sie eine Domain bei Resend verifizieren

## Hilfe

Falls Sie Hilfe benötigen:
- Resend Docs: https://resend.com/docs
- Resend Support: support@resend.com





