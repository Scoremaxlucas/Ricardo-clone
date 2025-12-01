# Welche E-Mail für Resend-Registrierung verwenden?

## Empfehlungen

### ✅ Geeignete E-Mail-Adressen:

1. **Ihre persönliche E-Mail** (z.B. Gmail, Outlook)
   - ✅ Einfach zu verwenden
   - ✅ Sie haben bereits Zugriff
   - ✅ Gut für Tests und Entwicklung

2. **Geschäfts-E-Mail** (z.B. info@ihre-domain.ch)
   - ✅ Professionell
   - ✅ Gut für Produktion
   - ✅ Mehrere Personen können Zugriff haben

3. **Admin-E-Mail** (z.B. admin@helvenda.ch)
   - ✅ Speziell für Helvenda
   - ✅ Professionell
   - ✅ Klare Trennung

### ❌ Nicht geeignet:

- ❌ E-Mail-Adressen, die Sie nicht kontrollieren
- ❌ E-Mail-Adressen, die Sie selten überprüfen
- ❌ Temporäre E-Mail-Adressen (werden oft gelöscht)

## Wichtige Punkte

### 1. E-Mail-Bestätigung erforderlich

- Resend sendet eine Bestätigungs-E-Mail
- Sie müssen auf den Link klicken, um das Konto zu aktivieren
- **Wichtig:** Verwenden Sie eine E-Mail, die Sie sofort überprüfen können

### 2. Wichtige Benachrichtigungen

- Resend sendet wichtige Benachrichtigungen an diese E-Mail:
  - API Key-Erstellung
  - Domain-Verifizierung
  - Limit-Warnungen
  - Sicherheitswarnungen
- **Wichtig:** Verwenden Sie eine E-Mail, die Sie regelmäßig überprüfen

### 3. Mehrere Konten möglich

- Sie können mehrere Resend-Konten haben
- Jedes Konto kann eine andere E-Mail verwenden
- **Tipp:** Verwenden Sie verschiedene E-Mails für Entwicklung und Produktion

## Empfehlung für Helvenda

### Für Entwicklung/Test:

```
Ihre persönliche E-Mail (z.B. lucas@gmail.com)
```

- ✅ Einfach zu verwenden
- ✅ Sie haben sofort Zugriff
- ✅ Perfekt für Tests

### Für Produktion:

```
Geschäfts-E-Mail (z.B. admin@helvenda.ch oder info@helvenda.ch)
```

- ✅ Professionell
- ✅ Mehrere Personen können Zugriff haben
- ✅ Klare Trennung von persönlichen E-Mails

## Beispiel-Workflow

### Schritt 1: Resend-Konto erstellen

```
E-Mail: lucas@gmail.com (oder Ihre bevorzugte E-Mail)
Passwort: [sicheres Passwort]
```

### Schritt 2: Konto bestätigen

- Resend sendet Bestätigungs-E-Mail an lucas@gmail.com
- Sie klicken auf den Link
- Konto ist aktiviert

### Schritt 3: API Key erstellen

- Im Resend Dashboard
- Gehen Sie zu "API Keys"
- Erstellen Sie einen neuen Key
- Kopieren Sie den Key

### Schritt 4: Helvenda konfigurieren

```bash
npm run setup:resend
```

- Geben Sie den API Key ein
- Das Script speichert alles in `.env`

## Häufige Fragen

### Q: Kann ich später die E-Mail ändern?

**A:** Ja, Sie können die E-Mail-Adresse in den Resend-Account-Einstellungen ändern.

### Q: Muss ich eine Geschäfts-E-Mail verwenden?

**A:** Nein, für Tests reicht Ihre persönliche E-Mail. Für Produktion ist eine Geschäfts-E-Mail professioneller.

### Q: Kann ich mehrere Resend-Konten haben?

**A:** Ja, Sie können mehrere Konten mit verschiedenen E-Mails erstellen.

### Q: Was passiert, wenn ich die E-Mail verliere?

**A:** Kontaktieren Sie Resend Support. Sie können Ihnen helfen, Zugriff wiederherzustellen.

## Zusammenfassung

**Für die meisten Fälle:**
→ Verwenden Sie **Ihre persönliche E-Mail** (Gmail, Outlook, etc.)

**Für Produktion:**
→ Verwenden Sie eine **Geschäfts-E-Mail** (admin@ihre-domain.ch)

**Wichtig:**

- ✅ E-Mail, die Sie kontrollieren
- ✅ E-Mail, die Sie regelmäßig überprüfen
- ✅ E-Mail, die Sie langfristig behalten
