# 🔧 Server Error beheben

Der "Server error" wird normalerweise durch fehlende Environment Variables verursacht.

## ✅ Was ich gemacht habe:

1. ✅ `NEXTAUTH_URL` hinzugefügt: `http://localhost:3002`
2. ✅ `NEXTAUTH_SECRET` hinzugefügt: `AXHNPPlcbGpd7fo04WbwkUrWLlorFwOLmELdFLmzF4Y=`
3. ✅ `CRON_SECRET` hinzugefügt: `5BpnTEy9DmK3reUS5b7zYIuLdGQvBNYlLvngWwqbX1I=`
4. ✅ `NEXT_PUBLIC_BASE_URL` hinzugefügt: `http://localhost:3002`
5. ✅ `NEXT_PUBLIC_APP_URL` hinzugefügt: `http://localhost:3002`

## 🚀 Nächste Schritte:

### Schritt 1: Development Server neu starten

```bash
cd /Users/lucasrodrigues/ricardo-clone
npm run dev
```

### Schritt 2: Browser aktualisieren

1. **Leeren Sie den Browser-Cache:**
   - Drücken Sie `Cmd + Shift + R` (Hard Reload)
   - Oder: Rechtsklick auf Refresh → "Empty Cache and Hard Reload"

2. **Gehen Sie zu:** `http://localhost:3002`

### Schritt 3: Testen

1. **Homepage:** Sollte jetzt ohne Fehler laden
2. **Login:** Versuchen Sie sich einzuloggen mit:
   - E-Mail: `admin@helvenda.ch`
   - Passwort: `test123`
3. **Registrierung:** Versuchen Sie einen neuen User zu registrieren

## 🐛 Falls der Fehler weiterhin besteht:

### Prüfen Sie die Server-Logs

Im Terminal, wo `npm run dev` läuft, sollten Sie Fehlermeldungen sehen. Prüfen Sie:
- Gibt es Prisma-Fehler?
- Gibt es Datenbank-Verbindungsfehler?
- Gibt es NextAuth-Fehler?

### Häufige Probleme:

**"NEXTAUTH_URL is not set"**
- Lösung: `.env.local` sollte `NEXTAUTH_URL=http://localhost:3002` enthalten

**"NEXTAUTH_SECRET is not set"**
- Lösung: `.env.local` sollte `NEXTAUTH_SECRET=...` enthalten

**"Cannot connect to database"**
- Lösung: Prüfen Sie, ob `DATABASE_URL` korrekt ist

## ✅ Checkliste

- [ ] `.env.local` enthält alle benötigten Variablen
- [ ] Development Server neu gestartet
- [ ] Browser-Cache geleert
- [ ] Homepage lädt ohne Fehler
- [ ] Login funktioniert
- [ ] Registrierung funktioniert

## 🆘 Wenn es immer noch nicht funktioniert

Teilen Sie mir mit:
1. **Die genaue Fehlermeldung** aus dem Terminal (wo `npm run dev` läuft)
2. **Die Browser-Konsole** Fehlermeldungen (F12 → Console)
3. **Welche Seite** den Fehler zeigt

Dann kann ich gezielt helfen!


