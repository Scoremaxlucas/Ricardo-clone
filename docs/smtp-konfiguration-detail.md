# SMTP-Konfiguration - Detaillierte Anleitung

## Was ist SMTP?

SMTP (Simple Mail Transfer Protocol) ist ein Standard-Protokoll zum Versenden von E-Mails. Viele E-Mail-Anbieter wie Gmail, Outlook, Yahoo etc. bieten SMTP-Server an, die Sie nutzen können, um E-Mails von Ihrer Anwendung zu versenden.

## Option 2: SMTP mit Gmail (Kostenlos)

Gmail bietet einen kostenlosen SMTP-Server, den Sie für bis zu 500 E-Mails pro Tag nutzen können.

### Schritt-für-Schritt Anleitung:

#### 1. Gmail-Konto vorbereiten

**Wichtig:** Sie können NICHT einfach Ihr normales Gmail-Passwort verwenden. Sie müssen ein "App-Passwort" erstellen.

**Schritt 1: Zwei-Faktor-Authentifizierung aktivieren**
- Gehen Sie zu [Google Account](https://myaccount.google.com/)
- Klicken Sie auf "Sicherheit" (Security)
- Scrollen Sie zu "Zwei-Faktor-Authentifizierung" (2-Step Verification)
- Aktivieren Sie die Zwei-Faktor-Authentifizierung, falls noch nicht aktiviert

**Schritt 2: App-Passwort erstellen**
- Gehen Sie zurück zu "Sicherheit"
- Scrollen Sie zu "App-Passwörter" (App passwords)
- Falls Sie "App-Passwörter" nicht sehen:
  - Stellen Sie sicher, dass Zwei-Faktor-Authentifizierung aktiviert ist
  - Möglicherweise müssen Sie sich erneut anmelden
- Klicken Sie auf "App-Passwörter"
- Wählen Sie "Mail" als App
- Wählen Sie "Andere (benutzerdefiniert)" als Gerät
- Geben Sie "Helvenda" als Name ein
- Klicken Sie auf "Generieren"
- **WICHTIG:** Kopieren Sie das generierte Passwort (16 Zeichen, ohne Leerzeichen)
  - Beispiel: `abcd efgh ijkl mnop` → verwenden Sie `abcdefghijklmnop`

#### 2. Umgebungsvariablen in .env setzen

Öffnen Sie die `.env` Datei in Ihrem Projekt und fügen Sie folgende Zeilen hinzu:

```bash
# SMTP Konfiguration für Gmail
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=ihre-email@gmail.com
SMTP_PASS=abcdefghijklmnop
SMTP_FROM=ihre-email@gmail.com
```

**Beispiel:**
```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=max.mustermann@gmail.com
SMTP_PASS=abcd efgh ijkl mnop
SMTP_FROM=max.mustermann@gmail.com
```

**Wichtig:**
- `SMTP_USER`: Ihre vollständige Gmail-Adresse
- `SMTP_PASS`: Das App-Passwort (16 Zeichen, OHNE Leerzeichen)
- `SMTP_FROM`: Kann gleich wie `SMTP_USER` sein oder eine andere Adresse

#### 3. Server neu starten

Nach dem Setzen der Umgebungsvariablen müssen Sie den Server neu starten:

```bash
# Server stoppen (Ctrl+C)
# Dann neu starten:
npm run dev
```

#### 4. Testen

1. Registrieren Sie einen neuen Benutzer
2. Überprüfen Sie Ihr E-Mail-Postfach (auch Spam-Ordner)
3. Sie sollten eine E-Mail mit dem Bestätigungslink erhalten

## Andere SMTP-Anbieter

### Outlook/Hotmail

```bash
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=ihre-email@outlook.com
SMTP_PASS=ihr-passwort
SMTP_FROM=ihre-email@outlook.com
```

### Yahoo Mail

```bash
SMTP_HOST=smtp.mail.yahoo.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=ihre-email@yahoo.com
SMTP_PASS=ihr-app-passwort
SMTP_FROM=ihre-email@yahoo.com
```

**Hinweis:** Yahoo erfordert auch ein App-Passwort (ähnlich wie Gmail).

### Eigener SMTP-Server

Falls Sie einen eigenen SMTP-Server haben:

```bash
SMTP_HOST=mail.ihre-domain.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=noreply@ihre-domain.com
SMTP_PASS=ihr-passwort
SMTP_FROM=noreply@ihre-domain.com
```

## Häufige Probleme

### Problem 1: "Invalid login credentials"
- **Lösung:** Stellen Sie sicher, dass Sie ein App-Passwort verwenden, nicht Ihr normales Gmail-Passwort
- **Lösung:** Überprüfen Sie, dass Zwei-Faktor-Authentifizierung aktiviert ist

### Problem 2: "Connection timeout"
- **Lösung:** Überprüfen Sie, ob Port 587 nicht von Ihrer Firewall blockiert wird
- **Lösung:** Versuchen Sie Port 465 mit `SMTP_SECURE=true`

### Problem 3: "E-Mail wird nicht empfangen"
- **Lösung:** Überprüfen Sie den Spam-Ordner
- **Lösung:** Stellen Sie sicher, dass `SMTP_FROM` korrekt gesetzt ist
- **Lösung:** Überprüfen Sie die Server-Logs auf Fehler

### Problem 4: "Too many emails sent"
- **Gmail Limit:** 500 E-Mails pro Tag
- **Lösung:** Verwenden Sie Resend für höhere Limits

## Sicherheit

⚠️ **WICHTIG:**
- Speichern Sie niemals Passwörter im Code
- Verwenden Sie immer Umgebungsvariablen (`.env`)
- Fügen Sie `.env` zu `.gitignore` hinzu
- Verwenden Sie App-Passwörter, nicht Ihr Hauptpasswort
- Teilen Sie Ihre `.env` Datei niemals öffentlich

## Vergleich: SMTP vs. Resend

| Feature | SMTP (Gmail) | Resend |
|--------|--------------|--------|
| Kostenlos | ✅ Ja | ✅ Ja (bis 3.000/Monat) |
| Setup-Aufwand | ⚠️ Mittel (App-Passwort) | ✅ Einfach (nur API Key) |
| Tägliches Limit | 500 E-Mails | 3.000 E-Mails/Monat |
| Zuverlässigkeit | ⚠️ Abhängig von Gmail | ✅ Professioneller Service |
| Spam-Filter | ⚠️ Kann in Spam landen | ✅ Bessere Zustellung |

## Empfehlung

- **Für Entwicklung/Test:** SMTP mit Gmail ist ausreichend
- **Für Produktion:** Resend wird empfohlen (bessere Zustellung, höhere Limits)





