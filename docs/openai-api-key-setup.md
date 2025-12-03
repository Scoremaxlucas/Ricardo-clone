# OpenAI API Key Konfiguration für Helvenda

## 🎯 Übersicht

Der OpenAI API Key wird für folgende Funktionen benötigt:
- **Emma Chat Assistant** - KI-Chat-Assistent für Benutzerfragen
- **Bilderkennung** - Automatische Kategorisierung von Produktbildern
- **Titel-Generierung** - Automatische Generierung von Produkttiteln
- **Beschreibungs-Generierung** - Automatische Generierung von Produktbeschreibungen

## 📋 Schritt 1: OpenAI API Key erhalten

### 1.1 Account erstellen/anmelden

1. Gehen Sie zu: **https://platform.openai.com/**
2. Erstellen Sie ein Konto oder melden Sie sich an
3. Bestätigen Sie Ihre E-Mail-Adresse falls nötig

### 1.2 API Key erstellen

1. Gehen Sie zu: **https://platform.openai.com/api-keys**
2. Klicken Sie auf **"Create new secret key"**
3. Geben Sie einen Namen ein (z.B. "Helvenda Production")
4. Kopieren Sie den Key **sofort** (beginnt mit `sk-...`)
   - ⚠️ **WICHTIG:** Der Key wird nur einmal angezeigt!
   - ⚠️ **WICHTIG:** Speichern Sie den Key sicher!

### 1.3 API Credits aufladen

1. Gehen Sie zu: **https://platform.openai.com/account/billing**
2. Fügen Sie eine Zahlungsmethode hinzu (Kreditkarte)
3. Laden Sie Credits auf (mindestens $5 empfohlen)

## 🔧 Schritt 2: API Key in Vercel konfigurieren

### 2.1 Vercel Dashboard öffnen

1. Gehen Sie zu: **https://vercel.com/dashboard**
2. Wählen Sie Ihr Projekt **"Ricardo-clone"** oder **"helvenda-marketplace"**

### 2.2 Environment Variable hinzufügen

1. Klicken Sie auf **"Settings"** (Einstellungen)
2. Klicken Sie auf **"Environment Variables"** (Umgebungsvariablen)
3. Klicken Sie auf **"Add New"** (Neu hinzufügen)

### 2.3 Variable konfigurieren

**Name:**
```
OPENAI_API_KEY
```

**Value:**
```
sk-Ihr-API-Key-hier
```
(Ersetzen Sie `sk-Ihr-API-Key-hier` mit Ihrem tatsächlichen API Key)

**Environment:**
- ✅ **Production** (für live Website)
- ✅ **Preview** (für Preview-Deployments)
- ✅ **Development** (optional, für lokale Entwicklung)

4. Klicken Sie auf **"Save"** (Speichern)

### 2.4 Deployment neu starten

1. Gehen Sie zu **"Deployments"** Tab
2. Klicken Sie auf die drei Punkte (⋯) neben dem neuesten Deployment
3. Wählen Sie **"Redeploy"** (Neu deployen)
4. Warten Sie bis das Deployment abgeschlossen ist (~2-3 Minuten)

## ✅ Schritt 3: Überprüfung

### 3.1 Test-Route verwenden

Nach dem Deployment können Sie die Test-Route verwenden:

**URL:**
```
https://helvenda-marketplace.vercel.app/api/test-openai
```

**Erwartetes Ergebnis:**
```json
{
  "success": true,
  "message": "OpenAI API Key ist konfiguriert",
  "keyPrefix": "sk-...",
  "keyLength": 51
}
```

### 3.2 Emma Chat testen

1. Öffnen Sie: **https://helvenda-marketplace.vercel.app**
2. Klicken Sie auf den **Emma Chat-Button** (unten rechts)
3. Stellen Sie eine Frage, z.B.:
   - "Wie funktioniert der Versand?"
   - "Welche Zahlungsmethoden gibt es?"
   - "Wie verkaufe ich einen Artikel?"

### 3.3 Bilderkennung testen

1. Gehen Sie zu: **"Verkaufen"** → **"Einzelartikel"**
2. Laden Sie ein Produktbild hoch
3. Die Bilderkennung sollte automatisch die Kategorie vorschlagen

## 🔍 Fehlerbehebung

### Problem: "OPENAI_API_KEY ist nicht konfiguriert"

**Lösung:**
1. Prüfen Sie, ob `OPENAI_API_KEY` in Vercel Environment Variables vorhanden ist
2. Stellen Sie sicher, dass der Key mit `sk-` beginnt
3. Prüfen Sie, dass keine Leerzeichen vor/nach dem Key sind
4. Starten Sie das Deployment neu (Redeploy)

### Problem: "API Key ist ungültig"

**Lösung:**
1. Prüfen Sie Ihre OpenAI API Credits: **https://platform.openai.com/usage**
2. Prüfen Sie, ob der API Key aktiv ist: **https://platform.openai.com/api-keys**
3. Erstellen Sie einen neuen API Key falls nötig

### Problem: "Insufficient credits"

**Lösung:**
1. Gehen Sie zu: **https://platform.openai.com/account/billing**
2. Laden Sie Credits auf (mindestens $5)
3. Warten Sie 1-2 Minuten bis die Credits aktiviert sind

### Problem: Emma antwortet nicht

**Lösung:**
1. Öffnen Sie die Browser-Konsole (F12)
2. Prüfen Sie die Network-Tab für Fehler
3. Prüfen Sie die Vercel Logs: **Vercel Dashboard → Deployments → Logs**

## 💰 Kostenübersicht

### OpenAI GPT-4o-mini (Standard-Modell)

- **Input:** ~$0.15 pro 1M Tokens
- **Output:** ~$0.60 pro 1M Tokens
- **Geschätzte Kosten pro Conversation:** ~$0.001-0.01
- **Monatliche Kosten** (bei 1000 Conversations): ~$1-10

### OpenAI GPT-4 Vision (für Bilderkennung)

- **Input:** ~$2.50 pro 1M Tokens (mit Bildern)
- **Output:** ~$10.00 pro 1M Tokens
- **Geschätzte Kosten pro Bilderkennung:** ~$0.01-0.05

### Empfehlung

- **Starten Sie mit $10 Credits** für Tests
- **Überwachen Sie die Nutzung** unter: **https://platform.openai.com/usage**
- **Setzen Sie Limits** unter: **https://platform.openai.com/account/limits**

## 📝 Weitere Informationen

- **OpenAI Platform:** https://platform.openai.com/
- **OpenAI API Dokumentation:** https://platform.openai.com/docs
- **OpenAI Pricing:** https://openai.com/pricing
- **OpenAI Usage Dashboard:** https://platform.openai.com/usage

