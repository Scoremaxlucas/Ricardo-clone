# 🔑 RESEND API KEY ERSTELLEN

## Schritt 1: API Key erstellen

1. Gehen Sie zu: https://resend.com/login
2. Loggen Sie sich ein
3. Gehen Sie zu **"API Keys"** (im Menü links)
4. Klicken Sie auf **"Create API Key"**
5. Geben Sie einen Namen ein: **"Helvenda"**
6. Wählen Sie **"Sending Access"** (oder "Full Access")
7. Klicken Sie auf **"Add"**
8. **WICHTIG:** Kopieren Sie den API Key sofort! (beginnt mit `re_`)

## Schritt 2: API Key in .env eintragen

Öffnen Sie die `.env` Datei und fügen Sie am Ende hinzu:

```
RESEND_API_KEY=re_IHRE_KEY_HIER
RESEND_FROM_EMAIL=onboarding@resend.dev
```

Ersetzen Sie `re_IHRE_KEY_HIER` mit Ihrem echten API Key.

## Schritt 3: Server neu starten

```bash
npm run dev
```

## Fertig! ✅

Jetzt werden E-Mails automatisch versendet!
