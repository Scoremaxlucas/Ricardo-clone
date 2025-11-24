# ⚡ SCHNELLSETUP RESEND

## Was Sie tun müssen (5 Minuten):

### 1. Resend Account erstellen
- Gehen Sie zu: https://resend.com
- Klicken Sie auf "Sign Up"
- Registrieren Sie sich mit: gamerlucas.67@outlook.com
- Bestätigen Sie Ihre E-Mail

### 2. API Key erstellen
- Nach Login: Gehen Sie zu "API Keys" (links im Menü)
- Klicken Sie auf "Create API Key"
- Name: "Helvenda"
- Wählen Sie "Sending Access"
- Klicken Sie auf "Add"
- **KOPIEREN SIE DEN KEY** (beginnt mit re_)

### 3. In .env Datei einfügen
Öffnen Sie die .env Datei und fügen Sie am Ende hinzu:

```
RESEND_API_KEY=re_HIER_IHRE_KEY_EINFÜGEN
RESEND_FROM_EMAIL=onboarding@resend.dev
```

### 4. Server neu starten
```bash
npm run dev
```

### 5. Fertig! ✅
Jetzt werden E-Mails automatisch versendet!

