# Stripe Schnellstart - Kreditkartenzahlung einrichten

## 🚀 Automatisches Setup (Empfohlen)

Führen Sie einfach aus:

```bash
npm run setup:stripe
```

Das Script prüft automatisch ob Stripe konfiguriert ist und gibt Ihnen Anweisungen.

## 📝 Manuelles Setup (5 Minuten)

### Schritt 1: Stripe Account erstellen

1. Gehen Sie zu [stripe.com](https://stripe.com)
2. Klicken Sie auf "Sign up"
3. Erstellen Sie ein kostenloses Konto
4. Bestätigen Sie Ihre E-Mail

### Schritt 2: Test-Keys holen

1. Gehen Sie zu [Dashboard → API keys](https://dashboard.stripe.com/test/apikeys)
2. Kopieren Sie:
   - **Publishable key** (beginnt mit `pk_test_`)
   - **Secret key** (beginnt mit `sk_test_`)

### Schritt 3: Keys in .env eintragen

Öffnen Sie die `.env` Datei und fügen Sie hinzu:

```env
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_51QJZ8QKQJZ8QKQJZ8QK...
STRIPE_SECRET_KEY=sk_test_51QJZ8QKQJZ8QKQJZ8QK...
```

**Wichtig:** Ersetzen Sie `...` mit Ihren echten Keys!

### Schritt 4: Server neu starten

```bash
npm run dev
```

### Schritt 5: Testen

1. Gehen Sie zu einer Rechnung
2. Klicken Sie auf "Jetzt bezahlen"
3. Wählen Sie "Kreditkarte"
4. Verwenden Sie Test-Karte: `4242 4242 4242 4242`
5. Beliebiges Datum in der Zukunft
6. Beliebige 3-stellige CVC

## ✅ Fertig!

Die Kreditkartenzahlung sollte jetzt funktionieren!

## 🧪 Test-Kreditkarten

| Karte | Ergebnis |
|-------|----------|
| `4242 4242 4242 4242` | ✅ Erfolgreich |
| `4000 0000 0000 0002` | ❌ Fehlgeschlagen |
| `4000 0000 0000 9995` | 🔒 3D Secure erforderlich |

## 🆘 Hilfe

- **"Stripe ist nicht konfiguriert"**: Prüfen Sie ob die Keys in `.env` stehen
- **Server neu starten**: Nach `.env` Änderungen immer Server neu starten
- **Weitere Hilfe**: Siehe `docs/stripe-konfiguration.md`





