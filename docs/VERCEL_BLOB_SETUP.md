# Vercel Blob Storage Setup - Schritt für Schritt

## Übersicht
Vercel Blob Storage ist ein CDN-optimierter Speicher für Bilder und Dateien. Dies ermöglicht:
- ✅ Skalierung auf Millionen von Produkten
- ✅ Schnellere Page-Loads
- ✅ Bessere Performance
- ✅ Erfolgreiche Deployments

## Schritt 1: Vercel Dashboard öffnen

1. Gehe zu [vercel.com](https://vercel.com)
2. Logge dich ein
3. Wähle dein Projekt **"helvenda"** aus

## Schritt 2: Storage erstellen

### Option A: Über das Dashboard

1. **Klicke auf dein Projekt** "helvenda"
2. Gehe zum Tab **"Storage"** (im linken Menü)
3. Klicke auf **"Create Database"** oder **"Add Storage"**
4. Wähle **"Blob"** aus der Liste
5. Gib einen Namen ein: **"helvenda-images"** (oder einen anderen Namen)
6. Wähle die **Region** (empfohlen: `fra1` für Frankfurt, nahe an der Schweiz)
7. Klicke auf **"Create"**

### Option B: Über die Vercel CLI

```bash
# Installiere Vercel CLI falls noch nicht installiert
npm i -g vercel

# Login
vercel login

# Erstelle Blob Store
vercel blob create helvenda-images --region fra1
```

## Schritt 3: Token holen

Nach dem Erstellen des Blob Stores:

1. Gehe zurück zum **"Storage"** Tab
2. Klicke auf deinen Blob Store **"helvenda-images"**
3. Gehe zum Tab **"Settings"** oder **"Environment Variables"**
4. Suche nach **"BLOB_READ_WRITE_TOKEN"** oder **"Token"**
5. **Kopiere den Token** (beginnt mit `vercel_blob_...`)

**WICHTIG:** Der Token sieht etwa so aus:
```
vercel_blob_rw_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

## Schritt 4: Token zur .env.local hinzufügen

1. Öffne die Datei `.env.local` in deinem Projekt
2. Füge folgende Zeile hinzu:

```bash
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**WICHTIG:**
- Ersetze `vercel_blob_rw_...` mit deinem echten Token
- Keine Anführungszeichen um den Token
- Keine Leerzeichen vor/nach dem `=`

### Beispiel `.env.local`:

```bash
DATABASE_URL="postgresql://..."
NEXTAUTH_SECRET="..."
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

## Schritt 5: Token in Vercel Project Settings setzen

**WICHTIG:** Der Token muss auch in Vercel Project Settings gesetzt werden, damit Deployments funktionieren:

1. Gehe zu **Project Settings** → **Environment Variables**
2. Klicke auf **"Add New"**
3. **Name:** `BLOB_READ_WRITE_TOKEN`
4. **Value:** Füge den Token ein (derselbe wie in `.env.local`)
5. Wähle alle Environments: **Production**, **Preview**, **Development**
6. Klicke auf **"Save"**

## Schritt 6: Migration ausführen

Nachdem der Token gesetzt ist:

```bash
npm run migrate:images-to-blob
```

Das Script wird:
- ✅ Alle Base64-Bilder finden
- ✅ Zu Vercel Blob Storage hochladen
- ✅ Datenbank mit Blob URLs aktualisieren
- ✅ Fortschritt anzeigen

## Schritt 7: Verifizierung

Nach erfolgreicher Migration:

1. Prüfe die Datenbank: Bilder sollten jetzt URLs enthalten (nicht Base64)
2. Prüfe Vercel Dashboard → Storage → "helvenda-images": Bilder sollten sichtbar sein
3. Teste die Website: Bilder sollten schnell laden

## Troubleshooting

### "No token found" Fehler
- ✅ Prüfe dass `BLOB_READ_WRITE_TOKEN` in `.env.local` gesetzt ist
- ✅ Prüfe dass keine Anführungszeichen um den Token sind
- ✅ Prüfe dass der Token korrekt kopiert wurde (keine Leerzeichen)

### "Blob store not found" Fehler
- ✅ Prüfe dass der Blob Store in Vercel erstellt wurde
- ✅ Prüfe dass du im richtigen Projekt bist
- ✅ Prüfe dass der Token zum richtigen Blob Store gehört

### Migration schlägt fehl
- ✅ Prüfe Internet-Verbindung
- ✅ Prüfe dass `DATABASE_URL` korrekt ist
- ✅ Prüfe Vercel Logs für Details

## Kosten

**Vercel Blob Storage Pricing:**
- **Storage:** $0.15/GB pro Monat
- **Bandwidth:** $0.40/GB
- **Free Tier:** 1 GB Storage, 1 GB Bandwidth (für Testing)

**Beispiel für 1M Produkte mit je 5 Bildern à 500KB:**
- Storage: ~2.5TB = $375/Monat
- Bandwidth: Abhängig von Traffic

## Nächste Schritte

Nach erfolgreicher Migration:
1. ✅ Alle neuen Uploads gehen automatisch zu Blob Storage
2. ✅ Page-Größe ist deutlich kleiner
3. ✅ Deployments sollten erfolgreich sein
4. ✅ Performance wie Ricardo

## Support

Bei Problemen:
1. Prüfe Vercel Dashboard → Storage → Logs
2. Prüfe Migration-Script Output
3. Kontaktiere Vercel Support falls nötig





